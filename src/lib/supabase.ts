import { createClient } from '@supabase/supabase-js'

// These come from .env (VITE_ prefixed vars are exposed to the browser).
// The anon/publishable key is safe client-side; data is guarded by row-level security.
const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

// Sync is wired up after the database tables exist. Until then the app runs
// fully on-device (localStorage), and this client just sits ready.
export const supabase = url && key ? createClient(url, key) : null

export const syncEnabled = Boolean(supabase)
