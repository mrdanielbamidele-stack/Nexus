// The Nexus AI bubble. The browser never sees the API key: it talks to this
// route, which forwards the conversation to OpenRouter.

import { Router } from 'express'
import { env, need } from '../lib/env.js'
import { fail, wrap } from '../lib/errors.js'
import { clientIp } from '../lib/session.js'
import { limit } from '../lib/throttle.js'

const router = Router()

const ROLES = new Set(['system', 'user', 'assistant'])
const DEFAULT_MODEL = 'nvidia/nemotron-3-nano-30b-a3b:free'

router.post('/', wrap(async (req, res) => {
  const key = need('OPENROUTER_API_KEY', 'The Nexus AI assistant')
  await limit(`chat:${clientIp(req)}`, { max: 40, windowSec: 10 * 60, what: 'messages to Nexus AI' })

  const incoming = Array.isArray(req.body?.messages) ? req.body.messages : []
  const messages = incoming
    .filter(m => ROLES.has(m?.role) && typeof m?.content === 'string' && m.content.trim())
    .slice(-14)
    .map(m => ({ role: m.role, content: m.content.slice(0, 6000) }))

  if (!messages.length) throw fail(400, 'NO_MESSAGE', 'Type a message first, then send it.')

  let upstream
  try {
    upstream = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
        'X-Title': 'Nexus',
      },
      body: JSON.stringify({
        model: env('CHAT_MODEL') || DEFAULT_MODEL,
        messages,
        temperature: Math.min(1, Math.max(0, Number(req.body?.temperature) || 0.7)),
        max_tokens: 700,
      }),
      signal: AbortSignal.timeout(20000),
    })
  } catch {
    throw fail(502, 'CHAT_UNREACHABLE', "Nexus AI couldn't be reached just now. Please try again in a moment.")
  }

  if (!upstream.ok) {
    console.error('[chat] upstream said', upstream.status)
    throw fail(502, 'CHAT_FAILED', 'Nexus AI is having a rough moment. Please try again in a little while.')
  }

  res.json(await upstream.json())
}))

export default router
