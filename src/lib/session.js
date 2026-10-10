// Who is signed in, according to the server.
//
//   bootSession()   once, before the app renders
//   useSession()    { admin, pending, impersonating } and re-renders on change
//
// The student's own record is kept by lib/studentAuth.js (so the older screens
// can read it synchronously); the admin's record lives here.

import { useSyncExternalStore } from 'react'
import { api } from './api'
import { isDemo } from './demo'
import { applyServerStudent } from './studentAuth'

let state = { admin: null, pending: null, impersonating: null }
const listeners = new Set()

function set(next) {
  state = { ...state, ...next }
  listeners.forEach(listener => listener())
}

export const getSession = () => state

export function useSession() {
  return useSyncExternalStore(
    callback => {
      listeners.add(callback)
      return () => listeners.delete(callback)
    },
    getSession
  )
}

// Apply a /api/me answer (or a sign-in answer) to everything that caches it.
export function applyMe(me) {
  applyServerStudent(me.student)
  set({
    admin: me.admin || null,
    pending: me.pending || null,
    impersonating: me.impersonating || null,
  })
}

export async function refreshSession() {
  if (isDemo) return
  applyMe(await api('/me'))
}

export async function bootSession() {
  if (isDemo) return
  try {
    await refreshSession()
  } catch {
    // Offline or the server is down: keep whatever this device last knew, so a
    // student can still open what they've already got.
  }
}

// After a sign-in call returned the account directly.
export function setAdmin(admin) {
  set({ admin, pending: null })
}

export function patchAdmin(patch) {
  if (state.admin) set({ admin: { ...state.admin, ...patch } })
}

export async function signOut(role) {
  try {
    await api('/auth/logout', { method: 'POST', body: { role } })
  } finally {
    if (role === 'admin') set({ admin: null })
    else applyServerStudent(null)
    set({ pending: null })
  }
}
