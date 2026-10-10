import mongoose from 'mongoose'
import { env, need } from './lib/env.js'

// One connection per warm function instance / per dev server. Netlify reuses a
// warm instance across requests, so the connection is cached on globalThis.
const state = (globalThis.__nexusMongo ||= { promise: null })

function databaseName(uri) {
  // mongodb+srv://user:pass@cluster/tos_portal?x=y -> "tos_portal"
  const match = uri.match(/^mongodb(?:\+srv)?:\/\/[^/]+\/([^?]*)/)
  return match?.[1] ? '' : 'tos_portal'
}

export function connectDb() {
  if (mongoose.connection.readyState === 1) return Promise.resolve(mongoose)

  if (!state.promise) {
    const uri = need('MONGODB_URI', 'The database')
    const dbName = env('MONGODB_DB') || databaseName(uri) || undefined

    state.promise = mongoose
      .connect(uri, { dbName, serverSelectionTimeoutMS: 8000, bufferCommands: false })
      .catch(err => {
        state.promise = null // let the next request try again
        console.error('[db] could not connect:', err.message)
        throw err
      })
  }
  return state.promise
}
