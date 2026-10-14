// The one way the browser talks to the Nexus API (/api/...).
//
// Failures come back as ApiError, whose `message` is already written for the
// person to read (the server words every error as "what happened + what to do").
// Branch on `code` when the page should react, e.g. to offer "Create an account".

export class ApiError extends Error {
  constructor(message, { status = 0, code = 'ERROR', data } = {}) {
    super(message)
    this.status = status
    this.code = code
    this.data = data
  }
}

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms))

// The API can be briefly unreachable (a restart, a cold start). Rather than
// show an error for a blip, wait a moment and ask again. Only requests that
// can't have reached the server are repeated, so nothing is ever done twice.
const RETRIES = 3
const RETRY_DELAY_MS = 700
const STARTING_RETRIES = 10
const STARTING_DELAY_MS = 1000

export async function api(path, { method = 'GET', body, signal } = {}) {
  for (let attempt = 0; ; attempt++) {
    let response
    try {
      response = await fetch(`/api${path}`, {
        method,
        headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
        body: body === undefined ? undefined : JSON.stringify(body),
        credentials: 'same-origin',
        signal,
      })
    } catch (err) {
      if (err?.name === 'AbortError') throw err
      // Never reached the server: safe to retry reads.
      if (method === 'GET' && attempt < RETRIES) {
        await sleep(RETRY_DELAY_MS)
        continue
      }
      throw new ApiError(
        "Nexus couldn't be reached. Check that you're online and try again.",
        { code: 'NETWORK' }
      )
    }

    const data = await response.json().catch(() => null)
    const problem = data?.error

    // The dev proxy says "API_STARTING" when nothing answered: the request
    // never reached the API, so any method is safe to repeat.
    // A restart (every saved server file while developing) takes several
    // seconds, so this waits longer than a dropped connection does.
    if (response.status === 503 && problem?.code === 'API_STARTING' && attempt < STARTING_RETRIES) {
      await sleep(STARTING_DELAY_MS)
      continue
    }

    if (!response.ok) {
      throw new ApiError(
        problem?.message || `Something went wrong (error ${response.status}). Please try again.`,
        { status: response.status, code: problem?.code || 'ERROR', data: problem?.data }
      )
    }
    return data
  }
}
