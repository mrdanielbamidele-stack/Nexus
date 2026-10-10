// Rate limiting that works on serverless: the counters live in Mongo (a warm
// function instance's memory isn't shared between instances).

import { fail } from './errors.js'
import { Throttle } from '../models.js'

async function bump(key, windowSec) {
  const expiresAt = new Date(Date.now() + windowSec * 1000)
  const update = { $inc: { n: 1 }, $setOnInsert: { expiresAt } }
  try {
    return await Throttle.findOneAndUpdate({ _id: key }, update, { upsert: true, returnDocument: 'after' })
  } catch (err) {
    // Two requests created the counter at once; the second just increments.
    if (err?.code === 11000) {
      return Throttle.findOneAndUpdate({ _id: key }, { $inc: { n: 1 } }, { returnDocument: 'after' })
    }
    throw err
  }
}

// Count one attempt against `key`; throws a friendly error once `limit` is passed.
export async function limit(key, { max, windowSec, what = 'tries' }) {
  const row = await bump(key, windowSec)
  if (row.n > max) {
    const minutes = Math.max(1, Math.ceil((row.expiresAt.getTime() - Date.now()) / 60000))
    throw fail(
      429,
      'TOO_MANY_ATTEMPTS',
      `Too many ${what}. Please wait about ${minutes} minute${minutes === 1 ? '' : 's'} and try again.`
    )
  }
  return row.n
}

export const forget = key => Throttle.deleteOne({ _id: key })
