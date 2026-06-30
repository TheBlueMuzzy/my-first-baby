import { useSyncExternalStore } from 'react'

// A tiny global toast/snackbar: one message at a time, with an optional Undo action.
export interface ToastData {
  id: number
  message: string
  undo?: () => void
}

let current: ToastData | null = null
let counter = 0
const listeners = new Set<() => void>()

function emit() {
  listeners.forEach((l) => l())
}

/** Show a toast. Pass an `undo` callback to add an Undo button. */
export function showToast(message: string, undo?: () => void) {
  current = { id: ++counter, message, undo }
  emit()
}

export function dismissToast() {
  current = null
  emit()
}

function subscribe(cb: () => void) {
  listeners.add(cb)
  return () => listeners.delete(cb)
}

export function useToast(): ToastData | null {
  return useSyncExternalStore(
    subscribe,
    () => current,
    () => current,
  )
}
