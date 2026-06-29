import { useSyncExternalStore } from 'react'
import { subscribe, getVersion } from './storage'

/** Re-renders the component whenever task state or the due date changes. */
export function useStoreVersion(): number {
  return useSyncExternalStore(subscribe, getVersion, getVersion)
}
