import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'
import { seedOnce } from './lib/storage'
import { syncEnabled } from './lib/supabase'

// When there's no cloud account (Supabase not configured), seed the known first
// appointment locally. With sync on, seeding happens when a household is created.
if (!syncEnabled) seedOnce()

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
