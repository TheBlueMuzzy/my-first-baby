import { useEffect, useState } from 'react'
import { useToast, dismissToast } from '../lib/toast'

// Renders the current toast (if any), auto-fading after a few seconds.
export default function Toaster() {
  const toast = useToast()
  const [leaving, setLeaving] = useState(false)

  useEffect(() => {
    if (!toast) return
    setLeaving(false)
    const fade = setTimeout(() => setLeaving(true), 3600)
    const clear = setTimeout(() => dismissToast(), 4000)
    return () => {
      clearTimeout(fade)
      clearTimeout(clear)
    }
  }, [toast?.id])

  if (!toast) return null
  return (
    <div className={'toast' + (leaving ? ' toast--leaving' : '')} role="status">
      <span className="toast__msg">{toast.message}</span>
      {toast.undo && (
        <button
          className="toast__undo"
          onClick={() => {
            toast.undo!()
            dismissToast()
          }}
        >
          Undo
        </button>
      )}
    </div>
  )
}
