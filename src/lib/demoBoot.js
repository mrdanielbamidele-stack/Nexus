// Runs first (it is the first import in main.jsx), before any other module has
// had a chance to read the student's saved session.
//
// In demo mode it does two things:
//   1. Puts everything the app saves in localStorage under a "demo:" prefix, so
//      the demo can never read - or overwrite - a real student's data in the
//      same browser.
//   2. Signs the demo student in (every page load, so a demo always starts from
//      the same place).
//
// It works by wrapping the Storage methods, so the rest of the app keeps using
// plain localStorage and doesn't need to know any of this.

import { isDemo, DEMO_STUDENT } from './demo'

if (isDemo) {
  const PREFIX = 'demo:'
  const proto = Storage.prototype
  const original = {
    getItem: proto.getItem,
    setItem: proto.setItem,
    removeItem: proto.removeItem,
    clear: proto.clear,
  }
  const isLocal = store => store === window.localStorage

  proto.getItem = function (key) {
    return original.getItem.call(this, isLocal(this) ? PREFIX + key : key)
  }
  proto.setItem = function (key, value) {
    return original.setItem.call(this, isLocal(this) ? PREFIX + key : key, value)
  }
  proto.removeItem = function (key) {
    return original.removeItem.call(this, isLocal(this) ? PREFIX + key : key)
  }
  proto.clear = function () {
    if (!isLocal(this)) return original.clear.call(this)
    // Only clear the demo's own entries, never the real ones.
    const own = []
    for (let i = 0; i < this.length; i++) {
      const key = this.key(i)
      if (key.startsWith(PREFIX)) own.push(key)
    }
    own.forEach(key => original.removeItem.call(this, key))
  }

  // Signed in, as the demo student.
  const { username, regNumber, courseOS, level } = DEMO_STUDENT
  localStorage.setItem('studentAuth', JSON.stringify(DEMO_STUDENT))
  localStorage.setItem('username', username)
  localStorage.setItem('regNumber', regNumber)
  localStorage.setItem('courseOS', courseOS)
  localStorage.setItem('level', level)
}
