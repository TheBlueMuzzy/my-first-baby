// Labor tools store their logs on-device only (localStorage). These are things one
// person does in the moment on their own phone, so they don't sync to the partner.

export interface KickSession {
  id: string
  endedAt: number // ms timestamp
  kicks: number
  durationMs: number
}

export interface Contraction {
  id: string
  start: number // ms timestamp
  end: number
}

const KICKS = 'mfb.kicks'
const CONTRACTIONS = 'mfb.contractions'

function read<T>(key: string): T[] {
  try {
    return JSON.parse(localStorage.getItem(key) || '[]')
  } catch {
    return []
  }
}
function write<T>(key: string, v: T[]) {
  localStorage.setItem(key, JSON.stringify(v))
}

export function getKickSessions(): KickSession[] {
  return read<KickSession>(KICKS)
}
export function addKickSession(s: KickSession) {
  write(KICKS, [s, ...read<KickSession>(KICKS)].slice(0, 50))
}
export function clearKickSessions() {
  write<KickSession>(KICKS, [])
}

export function getContractions(): Contraction[] {
  return read<Contraction>(CONTRACTIONS)
}
export function saveContractions(list: Contraction[]) {
  write(CONTRACTIONS, list.slice(0, 200))
}
