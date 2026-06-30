import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { getJoinCode, resetSchedule } from '../lib/storage'
import { signOut } from '../auth/AuthGate'

type Msg = { ok: boolean; text: string } | null

export default function Account() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const code = getJoinCode()

  useEffect(() => {
    supabase?.auth.getUser().then(({ data }) => setEmail(data.user?.email ?? ''))
  }, [])

  return (
    <div className="view view--fab">
      <h1 className="page-title">Account</h1>

      <section className="card">
        <div className="card__label">Signed in as</div>
        <div className="card__title">{email || '…'}</div>
      </section>

      {code && (
        <section className="card">
          <div className="card__label">Share with your partner</div>
          <div className="join-code">{code}</div>
          <p className="muted small">
            They open the app, choose <strong>Join my partner</strong>, and enter this code.
          </p>
        </section>
      )}

      <ChangePassword email={email} />
      <ChangeEmail currentEmail={email} />
      <ResetSchedule />

      <button className="btn auth__submit" onClick={() => signOut()}>
        Sign out
      </button>

      <button className="fab fab--left fab--back" onClick={() => navigate(-1)} aria-label="Back">‹</button>
    </div>
  )
}

function ResetSchedule() {
  const [confirming, setConfirming] = useState(false)
  const [clearEvents, setClearEvents] = useState(false)
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<Msg>(null)

  async function doReset() {
    setBusy(true)
    setMsg(null)
    try {
      await resetSchedule({ clearEvents })
      setMsg({ ok: true, text: 'Schedule reset to the recommended plan.' })
      setConfirming(false)
      setClearEvents(false)
    } catch (err: any) {
      setMsg({ ok: false, text: err?.message ?? 'Could not reset.' })
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="card">
      <div className="card__label">Reset schedule</div>
      <p className="muted small">
        Puts every milestone back to its recommended date and clears your check-offs, moves, and notes (your real
        first appointment on July 13 stays pinned). Photos and your account aren't touched.
      </p>
      {!confirming ? (
        <button className="btn" onClick={() => { setConfirming(true); setMsg(null) }}>
          Reset to recommended…
        </button>
      ) : (
        <>
          <label className="checkrow">
            <input type="checkbox" checked={clearEvents} onChange={(e) => setClearEvents(e.target.checked)} />
            Also delete the events I added myself
          </label>
          <p className="auth__msg">This can't be undone. Reset the schedule?</p>
          <div className="actions">
            <button className="btn btn--on" disabled={busy} onClick={doReset}>
              {busy ? 'Resetting…' : 'Yes, reset'}
            </button>
            <button className="btn" disabled={busy} onClick={() => setConfirming(false)}>
              Cancel
            </button>
          </div>
        </>
      )}
      {msg && <p className={msg.ok ? 'auth__msg auth__msg--ok' : 'auth__msg'}>{msg.text}</p>}
    </section>
  )
}

function ChangePassword({ email }: { email: string }) {
  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [confirm, setConfirm] = useState('')
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<Msg>(null)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setMsg(null)
    if (next.length < 6) {
      setMsg({ ok: false, text: 'New password must be at least 6 characters.' })
      return
    }
    if (next !== confirm) {
      setMsg({ ok: false, text: "New passwords don't match." })
      return
    }
    setBusy(true)
    try {
      // Verify the current password by re-authenticating before changing it.
      const { error: reauthErr } = await supabase!.auth.signInWithPassword({ email, password: current })
      if (reauthErr) {
        setMsg({ ok: false, text: "Your current password isn't right." })
        return
      }
      const { error } = await supabase!.auth.updateUser({ password: next })
      if (error) throw error
      setMsg({ ok: true, text: 'Password updated.' })
      setCurrent('')
      setNext('')
      setConfirm('')
    } catch (err: any) {
      setMsg({ ok: false, text: err?.message ?? 'Could not update password.' })
    } finally {
      setBusy(false)
    }
  }

  return (
    <form className="card" onSubmit={submit}>
      <div className="card__label">Change password</div>
      <div className="field">
        <label>Current password</label>
        <input type="password" autoComplete="current-password" value={current} onChange={(e) => setCurrent(e.target.value)} />
      </div>
      <div className="field">
        <label>New password</label>
        <input type="password" autoComplete="new-password" value={next} onChange={(e) => setNext(e.target.value)} />
      </div>
      <div className="field">
        <label>Confirm new password</label>
        <input type="password" autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
      </div>
      {msg && <p className={msg.ok ? 'auth__msg auth__msg--ok' : 'auth__msg'}>{msg.text}</p>}
      <button className="btn btn--on" disabled={busy || !current || !next || !confirm}>
        {busy ? 'Saving…' : 'Update password'}
      </button>
    </form>
  )
}

function ChangeEmail({ currentEmail }: { currentEmail: string }) {
  const [email, setEmail] = useState('')
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<Msg>(null)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setMsg(null)
    if (!email || email === currentEmail) {
      setMsg({ ok: false, text: 'Enter a new email address.' })
      return
    }
    setBusy(true)
    try {
      const { error } = await supabase!.auth.updateUser({ email })
      if (error) throw error
      setMsg({ ok: true, text: 'Check your inbox to confirm the new address — it changes once you click the link.' })
      setEmail('')
    } catch (err: any) {
      setMsg({ ok: false, text: err?.message ?? 'Could not change email.' })
    } finally {
      setBusy(false)
    }
  }

  return (
    <form className="card" onSubmit={submit}>
      <div className="card__label">Change email</div>
      <div className="field">
        <label>New email</label>
        <input type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
      </div>
      {msg && <p className={msg.ok ? 'auth__msg auth__msg--ok' : 'auth__msg'}>{msg.text}</p>}
      <button className="btn btn--on" disabled={busy || !email}>
        {busy ? 'Saving…' : 'Update email'}
      </button>
    </form>
  )
}
