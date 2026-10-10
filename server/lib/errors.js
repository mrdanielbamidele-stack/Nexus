// Every failure the API reports is an HttpError with a `code` (for the code that
// handles it) and a `message` (for the person reading it). Messages are written
// to say what happened AND what to do next - the browser shows them as they are.

export class HttpError extends Error {
  constructor(status, code, message, data) {
    super(message)
    this.status = status
    this.code = code
    this.data = data
  }
}

export const fail = (status, code, message, data) => new HttpError(status, code, message, data)

// Express 4 doesn't catch rejected promises on its own.
export const wrap = handler => (req, res, next) =>
  Promise.resolve(handler(req, res, next)).catch(next)

export function notFoundHandler(req, res) {
  res.status(404).json({
    error: { code: 'NOT_FOUND', message: "That address doesn't exist on the Nexus API." },
  })
}

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, _next) {
  if (err instanceof HttpError) {
    const body = { code: err.code, message: err.message }
    if (err.data !== undefined) body.data = err.data
    return res.status(err.status).json({ error: body })
  }

  if (err?.type === 'entity.parse.failed' || err instanceof SyntaxError) {
    return res.status(400).json({
      error: { code: 'BAD_JSON', message: "We couldn't read that request. Refresh the page and try again." },
    })
  }

  if (err?.type === 'entity.too.large') {
    return res.status(413).json({
      error: { code: 'TOO_LARGE', message: 'That request was too large. Try again with less in it.' },
    })
  }

  // Never leak internals to the browser; the log has the detail.
  console.error('[api] unexpected error:', err)
  res.status(500).json({
    error: {
      code: 'SERVER_ERROR',
      message: 'Something went wrong on our side. Please try again in a moment. If it keeps happening, tell us through Contact.',
    },
  })
}
