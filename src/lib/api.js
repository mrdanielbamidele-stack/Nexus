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

export async function api(path, { method = 'GET', body, signal } = {}) {
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
    throw new ApiError(
      "Nexus couldn't be reached. Check that you're online and try again.",
      { code: 'NETWORK' }
    )
  }

  const data = await response.json().catch(() => null)

  if (!response.ok) {
    const problem = data?.error
    throw new ApiError(
      problem?.message || `Something went wrong (error ${response.status}). Please try again.`,
      { status: response.status, code: problem?.code || 'ERROR', data: problem?.data }
    )
  }
  return data
}
