import { useEffect, useState, ReactNode } from 'react'
import { format } from 'date-fns'
import { supabase, syncEnabled } from '../lib/supabase'
import { activateSync, deactivateSync, seedHousehold, pushDueDate } from '../lib/storage'
import { getDueDate } from '../lib/pregnancy'

// Wraps the whole app. Until the user is signed in AND in a household, it shows the
// sign-in / setup screens instead of the app. Once they're in, sync is switched on
// and the real app renders.

type Stage = 'loading' | 'signin' | 'onboarding' | 'ready'

export default function AuthGate({ children }: { children: ReactNode }) {
  // If Supabase isn't configured, run fully on-device (no sign-in needed).
  if (!syncEnabled || !supabase) return <>{children}</>
  return <CloudGate>{children}</CloudGate>
}

function CloudGate({ children }: { children: ReactNode }) {
  const [stage, setStage] = useState<Stage>('loading')

  // Resolve the current session → household on load and whenever auth changes.
  useEffect(() => {
    let active = true

    async function resolve() {
      const { data } = await supabase!.auth.getSession()
      if (!active) return
      if (!data.session) {
        setStage('signin')
        return
      }
      await resolveHousehold()
    }

    resolve()

    const { data: sub } = supabase!.auth.onAuthStateChange((_event, session) => {
      if (!active) return
      if (!session) {
        deactivateSync()
        setStage('signin')
      } else {
        resolveHousehold()
      }
    })

    return () => {
      active = false
      sub.subscription.unsubscribe()
    }
  }, [])

  async function resolveHousehold() {
    const { data, error } = await supabase!
      .from('household_members')
      .select('household_id, households(join_code)')
      .limit(1)
      .maybeSingle()

    if (error) {
      console.warn('[auth] could not look up household:', error.message)
    }

    if (data?.household_id) {
      const code = (data.households as any)?.join_code ?? null
      await activateSync(data.household_id, code)
      setStage('ready')
    } else {
      setStage('onboarding')
    }
  }

  if (stage === 'loading') {
    return <Splash text="Loading…" />
  }
  if (stage === 'signin') {
    return <SignIn />
  }
  if (stage === 'onboarding') {
    return <Onboarding onDone={() => resolveHousehold()} />
  }
  return <>{children}</>
}

function Splash({ text }: { text: string }) {
  return (
    <div className="auth">
      <div className="auth__brand">My First Baby</div>
      <p className="muted">{text}</p>
    </div>
  )
}

function SignIn() {
  const [mode, setMode] = useState<'in' | 'up'>('in')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    setMsg(null)
    try {
      if (mode === 'up') {
        const { data, error } = await supabase!.auth.signUp({ email, password })
        if (error) throw error
        if (!data.session) {
          setMsg('Check your email to confirm your account, then sign in.')
          setMode('in')
        }
        // If a session came back, onAuthStateChange takes it from here.
      } else {
        const { error } = await supabase!.auth.signInWithPassword({ email, password })
        if (error) throw error
      }
    } catch (err: any) {
      setMsg(friendlyAuthError(err?.message))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="auth">
      <div className="auth__brand">My First Baby 🌱</div>
      <p className="muted auth__tag">A calm place for the two of you to follow along, together.</p>

      <form className="auth__card" onSubmit={submit}>
        <h2>{mode === 'in' ? 'Sign in' : 'Create your account'}</h2>
        <div className="field">
          <label>Email</label>
          <input type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div className="field">
          <label>Password</label>
          <input
            type="password"
            autoComplete={mode === 'in' ? 'current-password' : 'new-password'}
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        {msg && <p className="auth__msg">{msg}</p>}
        <button className="btn btn--on auth__submit" disabled={busy}>
          {busy ? 'One moment…' : mode === 'in' ? 'Sign in' : 'Sign up'}
        </button>
        <button
          type="button"
          className="linkbtn auth__switch"
          onClick={() => {
            setMode(mode === 'in' ? 'up' : 'in')
            setMsg(null)
          }}
        >
          {mode === 'in' ? 'New here? Create an account' : 'Already have an account? Sign in'}
        </button>
      </form>
    </div>
  )
}

function Onboarding({ onDone }: { onDone: () => void }) {
  const [tab, setTab] = useState<'create' | 'join'>('create')
  const [name, setName] = useState('Our family')
  const [code, setCode] = useState('')
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)

  async function create() {
    setBusy(true)
    setMsg(null)
    try {
      const { data, error } = await supabase!.rpc('create_household', { p_name: name })
      if (error) throw error
      const h = Array.isArray(data) ? data[0] : data
      await activateSync(h.id, h.join_code)
      seedHousehold()
      pushDueDate(format(getDueDate(), 'yyyy-MM-dd'))
      onDone()
    } catch (err: any) {
      setMsg(err?.message ?? 'Something went wrong.')
    } finally {
      setBusy(false)
    }
  }

  async function join() {
    setBusy(true)
    setMsg(null)
    try {
      const { data, error } = await supabase!.rpc('join_household', { p_code: code.trim().toUpperCase() })
      if (error) throw error
      const h = Array.isArray(data) ? data[0] : data
      await activateSync(h.id, h.join_code)
      onDone()
    } catch (err: any) {
      setMsg(err?.message?.includes('invalid join code') ? "That code didn't match — double-check it." : err?.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="auth">
      <div className="auth__brand">Almost there</div>
      <div className="chips auth__tabs">
        <button className={'chip' + (tab === 'create' ? ' chip--on' : '')} onClick={() => setTab('create')}>
          Start fresh
        </button>
        <button className={'chip' + (tab === 'join' ? ' chip--on' : '')} onClick={() => setTab('join')}>
          Join my partner
        </button>
      </div>

      {tab === 'create' ? (
        <div className="auth__card">
          <h2>Create your space</h2>
          <p className="muted small">You'll get a code to share with your partner so you both see the same plan.</p>
          <div className="field">
            <label>Name this space</label>
            <input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          {msg && <p className="auth__msg">{msg}</p>}
          <button className="btn btn--on auth__submit" disabled={busy} onClick={create}>
            {busy ? 'Setting up…' : 'Create'}
          </button>
        </div>
      ) : (
        <div className="auth__card">
          <h2>Enter the code</h2>
          <p className="muted small">Ask your partner for the 6-character code from their app.</p>
          <div className="field">
            <label>Join code</label>
            <input
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              maxLength={6}
              autoCapitalize="characters"
              placeholder="ABC123"
            />
          </div>
          {msg && <p className="auth__msg">{msg}</p>}
          <button className="btn btn--on auth__submit" disabled={busy || code.trim().length < 6} onClick={join}>
            {busy ? 'Joining…' : 'Join'}
          </button>
        </div>
      )}
    </div>
  )
}

export async function signOut() {
  await supabase?.auth.signOut()
}

function friendlyAuthError(raw?: string): string {
  if (!raw) return 'Something went wrong. Please try again.'
  const m = raw.toLowerCase()
  if (m.includes('invalid login credentials')) return "That email and password don't match."
  if (m.includes('email not confirmed')) return 'Please confirm your email first (check your inbox), then sign in.'
  if (m.includes('user already registered')) return 'That email already has an account — try signing in.'
  if (m.includes('password')) return 'Password needs to be at least 6 characters.'
  return raw
}
