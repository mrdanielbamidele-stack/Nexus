import dns from 'node:dns'
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

// `mongodb+srv://` addresses need a DNS "SRV" lookup. Some networks (VPNs,
// phone hotspots, local DNS filters) answer ordinary lookups but refuse that
// one, which shows up as `querySrv ECONNREFUSED`. When it happens, ask public
// DNS instead and try once more.
const isSrvDnsProblem = err =>
  /querySrv|queryTxt/i.test(err?.message || '') &&
  /ECONNREFUSED|ETIMEOUT|ENOTFOUND|ESERVFAIL|EREFUSED/i.test(`${err?.code} ${err?.message}`)

async function connectOnce(uri, dbName) {
  return mongoose.connect(uri, { dbName, serverSelectionTimeoutMS: 8000, bufferCommands: false })
}

export function connectDb() {
  if (mongoose.connection.readyState === 1) return Promise.resolve(mongoose)

  if (!state.promise) {
    const uri = need('MONGODB_URI', 'The database')
    const dbName = env('MONGODB_DB') || databaseName(uri) || undefined

    state.promise = connectOnce(uri, dbName)
      .catch(async err => {
        if (!isSrvDnsProblem(err)) throw err
        console.warn('[db] this network refuses SRV lookups - retrying with public DNS (8.8.8.8, 1.1.1.1)')
        dns.setServers(['8.8.8.8', '1.1.1.1'])
        return connectOnce(uri, dbName)
      })
      .catch(err => {
        state.promise = null // let the next request try again
        console.error('[db] could not connect:', err.message)
        throw err
      })
  }
  return state.promise
}
