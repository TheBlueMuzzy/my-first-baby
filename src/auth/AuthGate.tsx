import { useEffect, useState, ReactNode } from 'react'
import { format } from 'date-fns'
import { supabase, syncEnabled } from '../lib/supabase'
import { activateSync, deactivateSync, seedHousehold, pushDueDate } from '../lib/storage'
import { getDueDate } from '../lib/pregnancy'

// Wraps the whole app. Until the user is signed in AND in a household, it shows the
// sign-in / setup screens instead of the app. Once they're in, sync is switched on
// and the real app renders.

type Stage = 'loading' | 'signin' | 'onboarding' | 'ready' | 'recovery'

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

    const { data: sub } = supabase!.auth.onAuthStateChange((event, session) => {
      if (!active) return
      if (event === 'PASSWORD_RECOVERY') {
        // Arrived from a reset-password email link — let them set a new one.
        setStage('recovery')
        return
      }
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
  if (stage === 'recovery') {
    return <SetNewPassword onDone={() => resolveHousehold()} />
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

  async function forgot() {
    if (!email) {
      setMsg('Enter your email above first, then tap “Forgot password.”')
      return
    }
    setBusy(true)
    setMsg(null)
    try {
      const { error } = await supabase!.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin + window.location.pathname,
      })
      if (error) throw error
      setMsg('If that email has an account, a reset link is on its way.')
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
        {mode === 'in' && (
          <button type="button" className="linkbtn auth__switch" onClick={forgot} disabled={busy}>
            Forgot password?
          </button>
        )}
      </form>
    </div>
  )
}

function Onboarding({ onDone }: { onDone: () => void }) {
  const [name, setName] = useState('Our family')
  const [code, setCode] = useState('')
  const [busy, setBusy] = useState<'create' | 'join' | null>(null)
  const [createMsg, setCreateMsg] = useState<string | null>(null)
  const [joinMsg, setJoinMsg] = useState<string | null>(null)

  async function create() {
    setBusy('create')
    setCreateMsg(null)
    try {
      const { data, error } = await supabase!.rpc('create_household', { p_name: name })
      if (error) throw error
      const h = Array.isArray(data) ? data[0] : data
      await activateSync(h.id, h.join_code)
      seedHousehold()
      pushDueDate(format(getDueDate(), 'yyyy-MM-dd'))
      onDone()
    } catch (err: any) {
      setCreateMsg(err?.message ?? 'Something went wrong.')
    } finally {
      setBusy(null)
    }
  }

  async function join() {
    setBusy('join')
    setJoinMsg(null)
    try {
      const { data, error } = await supabase!.rpc('join_household', { p_code: code.trim().toUpperCase() })
      if (error) throw error
      const h = Array.isArray(data) ? data[0] : data
      await activateSync(h.id, h.join_code)
      onDone()
    } catch (err: any) {
      setJoinMsg(
        err?.message?.includes('invalid join code')
          ? "That code didn't match — double-check it with your partner."
          : (err?.message ?? 'Something went wrong.'),
      )
    } finally {
      setBusy(null)
    }
  }

  return (
    <div className="auth">
      <div className="auth__brand">One last step</div>
      <p className="muted auth__tag">Are you joining your partner, or setting things up?</p>

      {/* Join is first and prominent — most partners arrive here with a code in hand. */}
      <div className="auth__card">
        <h2>Joining your partner? 🤝</h2>
        <p className="muted small">
          They'll have given you a 6-character code from their app. Enter it here to share their space.
        </p>
        <div className="field">
          <label>Partner's code</label>
          <input
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            maxLength={6}
            autoCapitalize="characters"
            autoCorrect="off"
            placeholder="ABC123"
          />
        </div>
        {joinMsg && <p className="auth__msg">{joinMsg}</p>}
        <button
          className="btn btn--on auth__submit"
          disabled={busy !== null || code.trim().length < 6}
          onClick={join}
        >
          {busy === 'join' ? 'Joining…' : 'Join with code'}
        </button>
      </div>

      <div className="or-divider">or</div>

      <div className="auth__card">
        <h2>Setting things up? ✨</h2>
        <p className="muted small">
          Create your space first — then you'll get a code to text your partner so they can join you.
        </p>
        <div className="field">
          <label>Name this space (optional)</label>
          <input value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        {createMsg && <p className="auth__msg">{createMsg}</p>}
        <button className="btn btn--on auth__submit" disabled={busy !== null} onClick={create}>
          {busy === 'create' ? 'Setting up…' : 'Create our space'}
        </button>
      </div>
    </div>
  )
}

function SetNewPassword({ onDone }: { onDone: () => void }) {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setMsg(null)
    if (password.length < 6) {
      setMsg('Password must be at least 6 characters.')
      return
    }
    if (password !== confirm) {
      setMsg("Passwords don't match.")
      return
    }
    setBusy(true)
    try {
      const { error } = await supabase!.auth.updateUser({ password })
      if (error) throw error
      onDone()
    } catch (err: any) {
      setMsg(err?.message ?? 'Could not set your password.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="auth">
      <div className="auth__brand">Set a new password</div>
      <form className="auth__card" onSubmit={submit}>
        <h2>Choose a new password</h2>
        <div className="field">
          <label>New password</label>
          <input type="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>
        <div className="field">
          <label>Confirm new password</label>
          <input type="password" autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
        </div>
        {msg && <p className="auth__msg">{msg}</p>}
        <button className="btn btn--on auth__submit" disabled={busy || !password || !confirm}>
          {busy ? 'Saving…' : 'Save password'}
        </button>
      </form>
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
