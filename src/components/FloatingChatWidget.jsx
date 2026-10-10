// src/components/FloatingChatWidget.jsx
// Persistent floating chat bubble, pinned bottom-right on every authenticated
// page. Ported from the old full-page NexusAI screen: same message-bubble
// layout/markdown rendering/mic input, minus the two-column chat-history
// panel (too large for a floating widget).

import { marked } from 'marked'
import { useRef, useState, useEffect, useLayoutEffect } from 'react'
import { api } from '../lib/api'
import './FloatingChatWidget.css'

marked.use({ breaks: true })

// ── Draggable bubble physics ───────────────────────────────────────────────
// The bubble is moved by writing transforms straight to the DOM from a
// requestAnimationFrame loop (no React state per frame). While dragging it
// trails the pointer on a spring; on release it is thrown with friction and
// bounces off an invisible frame inset from the viewport, so it never touches
// the screen edges. It stays wherever it comes to rest.
const BW = 80, BH = 58               // bubble size (matches Chatbot.svg aspect)
const MARGIN = 24                    // breathing room between the bubble and the viewport edge
const PANEL_GAP = 12
const DRAG_THRESHOLD = 6             // px of travel before a press counts as a drag
const STORE_KEY = 'nexus-chat-bubble-pos'

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v))

// Allowed top-left corner range for the bubble (the inset frame).
function bounds() {
  return {
    minX: MARGIN,
    minY: MARGIN,
    maxX: Math.max(MARGIN, window.innerWidth - BW - MARGIN),
    maxY: Math.max(MARGIN, window.innerHeight - BH - MARGIN),
  }
}

// Position is stored as 0..1 ratios of that range so it survives window resizes.
function loadPos() {
  try {
    const d = JSON.parse(localStorage.getItem(STORE_KEY))
    if (d && typeof d.x === 'number' && typeof d.y === 'number') return d
  } catch { /* storage unavailable - fall back to the default corner */ }
  return { x: 1, y: 1 }               // bottom-right
}

function savePos(pos) {
  try { localStorage.setItem(STORE_KEY, JSON.stringify(pos)) } catch { /* ignore */ }
}

function ratioToPos(r) {
  const b = bounds()
  return {
    x: b.minX + clamp(r.x, 0, 1) * (b.maxX - b.minX),
    y: b.minY + clamp(r.y, 0, 1) * (b.maxY - b.minY),
  }
}

function posToRatio(x, y) {
  const b = bounds()
  return {
    x: clamp((x - b.minX) / Math.max(1, b.maxX - b.minX), 0, 1),
    y: clamp((y - b.minY) / Math.max(1, b.maxY - b.minY), 0, 1),
  }
}

const SITE_INSTRUCTIONS = [
  { q: "How do I start studying a course?", a: "Go to the Dashboard, scroll to 'Your Courses', and click **Browse Past Questions** on any course card." },
  { q: "Where are the past questions?",      a: "Click a course card's **Browse Past Questions** button, then pick a year to get previous exam questions with detailed explanations." },
  { q: "How do I change my name?",           a: "Go to **Settings** in the sidebar. Under 'Profile', type a new name and click Save." },
  { q: "Who is the founder?",                a: "The founder of Nexus is Daniel Bamidele, a student at Topfaith University." },
]

function buildSystemPrompt() {
  const facts = SITE_INSTRUCTIONS.map((item, i) => `${i + 1}. Q: ${item.q}\n   A: ${item.a}`).join('\n\n')
  return `You are Nexus AI, the built-in assistant for the Nexus academic platform used by students at Topfaith University.

Your job is to:
• Help students understand course material
• Answer questions about how the Nexus platform works
• Give study tips and exam strategies
• Refer students to the right section of the app when relevant

PLATFORM FACTS:
${facts}

Always be warm, encouraging, and concise. Use markdown for formatting when it helps clarity. Use \\n (a new line) whenever you want content to appear on the next line - for lists, steps, or separating ideas.
If you don't know something, say so honestly rather than guessing.`
}

const CHIPS = [
  { label: 'Where are the Past Questions', q: 'Where can I find past questions?' },
  { label: 'Study tips',                   q: 'Give me study tips for exams' },
]

function formatTime(isoStr) {
  if (!isoStr) return 'Now'
  return new Date(isoStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

function TypingIndicator() {
  return (
    <div className="nai-msg bot nai-typing">
      <div className="nai-bubble">
        <span className="nai-dot" />
        <span className="nai-dot" />
        <span className="nai-dot" />
      </div>
    </div>
  )
}

function ChatMessage({ role, text, time }) {
  return (
    <div className={`nai-msg ${role}`}>
      {role === 'bot'
        ? <div className="nai-bubble" dangerouslySetInnerHTML={{ __html: marked(text) }} />
        : <div className="nai-bubble">{text}</div>}
      <div className="nai-time">{time}</div>
    </div>
  )
}

export default function FloatingChatWidget() {
  const [open, setOpen]           = useState(false)
  const [messages, setMessages]   = useState([])
  const [inputText, setInputText] = useState('')
  const [isTyping, setIsTyping]   = useState(false)

  const sessionMessages = useRef([])
  const messagesEndRef  = useRef(null)

  const bubbleRef = useRef(null)
  const squashRef = useRef(null)
  const panelRef  = useRef(null)
  const phys      = useRef(null)

  // Keep the chat panel anchored to wherever the bubble currently is: it opens
  // above the bubble when the bubble is in the lower half, below otherwise, and
  // lines up with the bubble's side of the screen.
  function placePanel() {
    const panel = panelRef.current, s = phys.current
    if (!panel || !s) return
    const vw = window.innerWidth, vh = window.innerHeight
    const pw = Math.min(360, vw - 32), ph = Math.min(520, vh - 140)
    const cx = s.x + BW / 2, cy = s.y + BH / 2
    const left = clamp(cx > vw / 2 ? s.x + BW - pw : s.x, 16, Math.max(16, vw - pw - 16))
    const rawTop = cy > vh / 2 ? s.y - PANEL_GAP - ph : s.y + BH + PANEL_GAP
    const top = clamp(rawTop, 16, Math.max(16, vh - ph - 16))
    panel.style.left = `${left}px`
    panel.style.top = `${top}px`
    panel.style.transformOrigin = `${cx - left}px ${cy - top}px`
  }

  function render() {
    const s = phys.current
    if (!s || !bubbleRef.current) return
    bubbleRef.current.style.transform = `translate3d(${s.x}px, ${s.y}px, 0)`
    if (!s.reduced) {
      // tilt + stretch along the direction of travel + squash against a wall
      squashRef.current.style.transform =
        `rotate(${s.tilt}deg) ` +
        `rotate(${s.ang}rad) scale(${1 + s.st}, ${1 - s.st * 0.8}) rotate(${-s.ang}rad) ` +
        `rotate(${s.hitAng}rad) scale(${1 - s.imp}, ${1 + s.imp * 0.7}) rotate(${-s.hitAng}rad)`
    }
    placePanel()
  }

  function hit(angle, normalSpeed) {
    const s = phys.current
    s.hitAng = angle
    s.imp = Math.min(0.32, normalSpeed / 2800)
    s.impV = 0
  }

  // The bubble has stopped moving - remember where it ended up.
  function rest() {
    const s = phys.current
    s.vx = s.vy = 0
    s.phase = 'idle'
    s.pos = posToRatio(s.x, s.y)
    savePos(s.pos)
  }

  function startLoop() {
    const s = phys.current
    if (s.raf) return
    s.last = performance.now()
    s.raf = requestAnimationFrame(tick)
  }

  function tick(now) {
    const s = phys.current
    const dt = Math.min(0.033, (now - s.last) / 1000) || 0.016
    s.last = now
    const { minX, minY, maxX, maxY } = bounds()

    if (s.dragging) {
      // Trail the pointer on a soft spring so the bubble feels weighty.
      const k = 1 - Math.exp(-dt * 26)
      const nx = s.x + (s.tx - s.x) * k, ny = s.y + (s.ty - s.y) * k
      s.vx = (nx - s.x) / dt
      s.vy = (ny - s.y) / dt
      s.x = nx
      s.y = ny
    } else if (s.phase === 'throw') {
      const f = Math.exp(-dt * 2.4)                 // friction
      s.vx *= f
      s.vy *= f
      s.x += s.vx * dt
      s.y += s.vy * dt
      // Bounce off the inset frame, not the screen edge.
      if (s.x < minX)      { s.x = minX; hit(0, Math.abs(s.vx));           s.vx = -s.vx * 0.6 }
      else if (s.x > maxX) { s.x = maxX; hit(0, Math.abs(s.vx));           s.vx = -s.vx * 0.6 }
      if (s.y < minY)      { s.y = minY; hit(Math.PI / 2, Math.abs(s.vy)); s.vy = -s.vy * 0.6 }
      else if (s.y > maxY) { s.y = maxY; hit(Math.PI / 2, Math.abs(s.vy)); s.vy = -s.vy * 0.6 }
      if (Math.hypot(s.vx, s.vy) < 25) rest()
    }

    // Visual response: stretch with speed, jelly-wobble tilt, impact squash.
    const speed = Math.hypot(s.vx, s.vy)
    if (speed > 30) s.ang = Math.atan2(s.vy, s.vx)
    s.st += (Math.min(0.3, speed / 3500) - s.st) * (1 - Math.exp(-dt * 14))
    s.tiltV += (-130 * (s.tilt - clamp(s.vx / 55, -20, 20)) - 10 * s.tiltV) * dt
    s.tilt += s.tiltV * dt
    s.impV += (-300 * s.imp - 13 * s.impV) * dt
    s.imp += s.impV * dt

    render()

    const settled = !s.dragging && s.phase === 'idle' &&
      Math.abs(s.imp) < 0.002 && Math.abs(s.impV) < 0.02 &&
      s.st < 0.003 && Math.abs(s.tilt) < 0.1 && Math.abs(s.tiltV) < 0.2
    if (settled) {
      s.st = 0; s.tilt = 0; s.tiltV = 0; s.imp = 0; s.impV = 0
      render()
      s.raf = 0
    } else {
      s.raf = requestAnimationFrame(tick)
    }
  }

  useLayoutEffect(() => {
    const pos = loadPos()
    const { x, y } = ratioToPos(pos)
    phys.current = {
      x, y, vx: 0, vy: 0, pos,
      tx: x, ty: y, offX: 0, offY: 0,
      phase: 'idle', dragging: false, didDrag: false,
      st: 0, ang: 0, tilt: 0, tiltV: 0, imp: 0, impV: 0, hitAng: 0,
      pvx: 0, pvy: 0, lastX: 0, lastY: 0, lastT: 0, startX: 0, startY: 0,
      raf: 0, last: 0,
      reduced: window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false,
    }
    render()

    const onResize = () => {
      const s = phys.current
      if (s.dragging || s.phase !== 'idle') return
      const p = ratioToPos(s.pos)
      s.x = p.x
      s.y = p.y
      render()
    }
    window.addEventListener('resize', onResize)
    return () => {
      window.removeEventListener('resize', onResize)
      cancelAnimationFrame(phys.current.raf)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Position the panel as soon as it mounts (before paint).
  useLayoutEffect(() => { placePanel() }, [open])

  function onPointerDown(e) {
    if (e.button !== undefined && e.button !== 0) return
    const s = phys.current
    e.currentTarget.setPointerCapture?.(e.pointerId)
    s.dragging = true
    s.didDrag = false
    s.phase = 'idle'
    s.offX = e.clientX - s.x
    s.offY = e.clientY - s.y
    s.tx = s.x
    s.ty = s.y
    s.startX = s.lastX = e.clientX
    s.startY = s.lastY = e.clientY
    s.lastT = e.timeStamp
    s.pvx = s.pvy = 0
    bubbleRef.current.classList.add('dragging')
    startLoop()
  }

  function onPointerMove(e) {
    const s = phys.current
    if (!s.dragging) return
    const b = bounds()
    s.tx = clamp(e.clientX - s.offX, b.minX, b.maxX)
    s.ty = clamp(e.clientY - s.offY, b.minY, b.maxY)
    if (Math.hypot(e.clientX - s.startX, e.clientY - s.startY) > DRAG_THRESHOLD) s.didDrag = true
    // Pointer velocity (smoothed) - this is what the throw is launched with.
    const dt = (e.timeStamp - s.lastT) / 1000
    if (dt > 0) {
      s.pvx += ((e.clientX - s.lastX) / dt - s.pvx) * 0.4
      s.pvy += ((e.clientY - s.lastY) / dt - s.pvy) * 0.4
    }
    s.lastX = e.clientX
    s.lastY = e.clientY
    s.lastT = e.timeStamp
  }

  function onPointerUp(e) {
    const s = phys.current
    if (!s.dragging) return
    s.dragging = false
    e.currentTarget.releasePointerCapture?.(e.pointerId)
    bubbleRef.current.classList.remove('dragging')
    if (!s.didDrag) {                       // a tap, not a drag - leave it where it is
      s.x = s.tx
      s.y = s.ty
      s.vx = s.vy = 0
      s.phase = 'idle'
      return
    }
    // Paused before letting go -> no throw.
    const held = e.timeStamp - s.lastT > 90
    const cap = 3200
    s.vx = held ? 0 : clamp(s.pvx, -cap, cap)
    s.vy = held ? 0 : clamp(s.pvy, -cap, cap)
    if (Math.hypot(s.vx, s.vy) > 200) s.phase = 'throw'
    else rest()
    startLoop()
    // The click that follows this pointerup must be ignored, but a later
    // keyboard-triggered click must not be - so clear the flag after it fires.
    setTimeout(() => { s.didDrag = false }, 0)
  }

  function onBubbleClick() {
    if (phys.current.didDrag) return        // the click that ends a drag is not a toggle
    setOpen(prev => !prev)
  }

  useEffect(() => {
    if (open) messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [open, messages, isTyping])

  async function sendMessage(textOverride) {
    const text = (textOverride ?? inputText).trim()
    if (!text) return

    setInputText('')
    const now = new Date().toISOString()
    setMessages(prev => [...prev, { role: 'user', text, time: formatTime(now) }])
    sessionMessages.current.push({ role: 'user', text, time: now })
    setIsTyping(true)

    try {
      const history = sessionMessages.current.slice(-10).map(m => ({
        role: m.role === 'user' ? 'user' : 'assistant',
        content: m.text,
      }))

      const data = await api('/chat', {
        method: 'POST',
        body: {
          messages: [{ role: 'system', content: buildSystemPrompt() }, ...history],
          temperature: 0.7,
        },
      })

      const reply = data?.choices?.[0]?.message?.content || 'Sorry, I ran into an error. Please try again.'

      setIsTyping(false)
      const replyTime = new Date().toISOString()
      setMessages(prev => [...prev, { role: 'bot', text: reply, time: formatTime(replyTime) }])
      sessionMessages.current.push({ role: 'bot', text: reply, time: replyTime })
    } catch (err) {
      setIsTyping(false)
      // The API's own wording says what actually went wrong (offline, busy, not switched on...).
      setMessages(prev => [...prev, { role: 'bot', text: err.message || 'Something went wrong. Please try again.', time: 'Now' }])
      console.error('Nexus AI error:', err)
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  return (
    <>
      {open && (
        <div className="fcw-panel" ref={panelRef}>
          <div className="fcw-header">
            <div className="nai-avatar">N</div>
            <div className="fcw-header-text">
              <strong style={{ fontSize: 20, lineHeight: 1.2 }}>Nexus AI</strong>
              <div className="muted" style={{ fontSize: 13 }}>Your guide around the site</div>
            </div>
            <button className="fcw-close" onClick={() => setOpen(false)} aria-label="Close chat">
              <i className="fa-solid fa-xmark" />
            </button>
          </div>

          <div className="nai-chips">
            {CHIPS.map(chip => (
              <span key={chip.label} className="nai-chip" onClick={() => sendMessage(chip.q)}>
                {chip.label}
              </span>
            ))}
          </div>

          <div className="nai-messages">
            <div className="nai-msg bot">
              <div className="nai-bubble">
                👋 Hi! I&apos;m Nexus AI. Ask me anything about your courses or how to use this platform.
              </div>
              <div className="nai-time">Now</div>
            </div>

            {messages.map((msg, i) => (
              <ChatMessage key={i} role={msg.role} text={msg.text} time={msg.time} />
            ))}

            {isTyping && <TypingIndicator />}
            <div ref={messagesEndRef} />
          </div>

          <div className="nai-input-row">
            <textarea
              placeholder="Ask anything…"
              rows={1}
              value={inputText}
              onChange={e => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
            />
            <button className="nai-send-btn" onClick={() => sendMessage()}>
              <i className="fa-solid fa-paper-plane" />
            </button>
          </div>
        </div>
      )}

      <button
        ref={bubbleRef}
        className="fcw-bubble"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onClick={onBubbleClick}
        aria-label="Toggle Nexus AI chat"
        aria-expanded={open}
      >
        <span className="fcw-bob">
          <span className="fcw-squash" ref={squashRef}>
            <img src="/Chatbot.svg" alt="" draggable={false} />
          </span>
        </span>
      </button>
    </>
  )
}
