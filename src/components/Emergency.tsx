import { useState } from 'react'

// Warning signs pulled from /pregnancy-guide (03 + 05 + 06). Reference only —
// when in doubt, call. Provider thresholds override anything here.
export default function Emergency() {
  const [open, setOpen] = useState(false)
  return (
    <>
      <button className="emergency-btn" onClick={() => setOpen(true)}>
        ⚠️ When to call / go now
      </button>
      {open && (
        <div className="modal-backdrop" onClick={() => setOpen(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal__head">
              <h2>When to act</h2>
              <button className="modal__close" onClick={() => setOpen(false)}>✕</button>
            </div>
            <p className="muted small">
              General reference only. When in doubt, call your provider — that’s never an overreaction.
            </p>

            <h3>Call the provider now (pregnancy)</h3>
            <ul>
              <li>Severe headache or vision changes</li>
              <li>Sudden swelling, or upper-right belly pain</li>
              <li>Any bleeding, or a fluid leak / gush</li>
              <li>Noticeably reduced fetal movement</li>
            </ul>

            <h3>Go in now — don’t wait</h3>
            <ul>
              <li>Water breaks (note time, amount, color, odor)</li>
              <li>Contractions before ~37 weeks (possible preterm labor)</li>
              <li>Bleeding heavier than spotting</li>
              <li>A contraction that never fully relaxes</li>
              <li>Visible umbilical cord — call 911</li>
            </ul>

            <h3>After birth</h3>
            <ul>
              <li>Mom: soaking a pad in under an hour, fever, calf pain/swelling, severe headache</li>
              <li>Baby under 3 months: any fever 100.4°F / 38°C → ER immediately</li>
            </ul>
          </div>
        </div>
      )}
    </>
  )
}
