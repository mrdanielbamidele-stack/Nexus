// Environment access. Values are read lazily (not at import time) so the same
// code runs under `node server/dev.js`, as a Netlify Function, and in tests.

import 'dotenv/config'
import { fail } from './errors.js'

export const env = (name, fallback = '') => String(process.env[name] ?? fallback).trim()

// On Netlify (or NODE_ENV=production) cookies must be Secure; plain-http local
// development can't set Secure cookies, so they're relaxed there.
export const isProd = () => process.env.NODE_ENV === 'production' || Boolean(process.env.NETLIFY)

// Read a setting the feature can't work without. `what` finishes the sentence
// "<what> isn't set up yet" in the message shown to the person.
export function need(name, what) {
  const value = env(name)
  if (!value) {
    console.error(`[config] ${name} is missing from the environment`)
    // The setting's name goes to the log, not to the browser.
    throw fail(
      503,
      'NOT_CONFIGURED',
      `${what} isn't switched on yet. This is a setup problem on our side, not something you did wrong.`
    )
  }
  return value
}
