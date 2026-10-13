// Who is signed in, according to the server.
//
//   bootSession()   once, before the app renders
//   useSession()    { admin, pending, impersonating } and re-renders on change
//
// The student's own record is kept by lib/studentAuth.js (so the older screens
// can read it synchronously); the admin's record lives here.
//
// Both are remembered on this device, and the server is only ever allowed to
// say "you are signed out" - a server that can't be reached (it restarts on
// every code change while developing, or the connection drops) never is.

import { useSyncExternalStore } from 'react'
import { api } from './api'
import { isDemo } from './demo'
import { applyServerStudent } from './studentAuth'

const ADMIN_KEY = 'adminAuth'

function readAdmin() {
  try {
    return JSON.parse(localStorage.getItem(ADMIN_KEY)) || null
  } catch {
    return null
  }
}

function writeAdmin(admin) {
  try {
    if (admin) localStorage.setItem(ADMIN_KEY, JSON.stringify(admin))
    else localStorage.removeItem(ADMIN_KEY)
  } catch {
    /* storage unavailable: the server session still works */
  }
}

let state = { admin: isDemo ? null : readAdmin(), pending: null, impersonating: null }
const listeners = new Set()

function set(next) {
  state = { ...state, ...next }
  if ("admin" in next) writeAdmin(state.admin)
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

// Couldn't reach the server (it is restarting, or offline): keep what this
// device already knows and ask again shortly, rather than showing a sign-in.
let retryTimer = 0
function retryRefresh(attempt = 1) {
  if (attempt > 12) return
  clearTimeout(retryTimer)
  retryTimer = setTimeout(async () => {
    try {
      await refreshSession()
    } catch {
      retryRefresh(attempt + 1)
    }
  }, Math.min(800 * attempt, 5000))
}

export async function bootSession() {
  if (isDemo) return
  try {
    await refreshSession()
  } catch {
    retryRefresh()
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
