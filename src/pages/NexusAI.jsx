import { marked } from 'marked'
import { useState, useRef, useEffect } from 'react'

marked.use({ breaks: true })
import ScrollToTop from '../components/ScrollToTop';
import { supabasePublic } from '../lib/supabase'
import './App.css'
 

// ── Chat history helpers (localStorage) ──────────────────────────────────────
 

const NEXUS_STORAGE_KEY = 'nexus_chat_history'

function loadAllChats() {
  try { return JSON.parse(localStorage.getItem(NEXUS_STORAGE_KEY)) || [] }
  catch { return [] }
}

function saveAllChats(chats) {
  try { localStorage.setItem(NEXUS_STORAGE_KEY, JSON.stringify(chats)) }
  catch (e) { console.warn('Could not save chat history:', e) }
}

function logChatMessage({ source = 'Unknown Page', role, text, sessionId }) {
  const all = loadAllChats()
  all.push({ source, role, text, sessionId, time: new Date().toISOString() })
  if (all.length > 500) all.splice(0, all.length - 500)
  saveAllChats(all)
}

// ── System prompt ─────────────────────────────────────────────────────────────

const SITE_INSTRUCTIONS = [
  { q: "How do I start studying a course?",        a: "Go to the Dashboard, scroll to 'Your Courses', and click **View Materials** on any course card." },
  { q: "What is Campaign Mode?",                   a: "Campaign Mode lets you attempt questions from ALL your semester courses back-to-back. Your readiness score and estimated GPA are calculated automatically." },
  { q: "Where are the past questions?",            a: "Click **Past Questions** in the sidebar. Select a course to get previous exam questions with detailed explanations." },
  { q: "How do I change my name?",                 a: "Go to **Settings** in the sidebar. Under 'Profile', type a new name and click Save." },
  { q: "Who is the founder?",                      a: "The founder of Nexus is Daniel Bamidele, a student at Topfaith University." },
  { q: "What does the letter grade next to a course mean?", a: "It's your predicted exam grade based on Campaign Mode. A = 70%+, B = 60–69%, C = 50–59%, etc." },
]

function buildSystemPrompt() {
  const facts = SITE_INSTRUCTIONS.map((item, i) =>
    `${i + 1}. Q: ${item.q}\n   A: ${item.a}`
  ).join('\n\n')

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

// ── Small helper components ───────────────────────────────────────────────────

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

function formatTime(isoStr) {
  if (!isoStr) return 'Now'
  return new Date(isoStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

function ChatMessage({ role, text, time }) {
  return (
    <div className={`nai-msg ${role}`}>
      {role === 'bot'
        ? <div className="nai-bubble" dangerouslySetInnerHTML={{ __html: marked(text) }} />
        : <div className="nai-bubble">{text}</div>
      }
      <div className="nai-time">{time}</div>
    </div>
  )
}

// ── History panel ─────────────────────────────────────────────────────────────

function HistoryPanel({ sessions }) {
  const [openSessions, setOpenSessions] = useState({})

  function toggle(key) {
    setOpenSessions(prev => ({ ...prev, [key]: !prev[key] }))
  }

  if (!sessions.length) {
    return (
      <div className="nai-history-empty">
        No previous chats yet.<br />
        <span style={{ fontSize: 11 }}>Each conversation you start will appear here.</span>
      </div>
    )
  }

  return (
    <>
      {sessions.map(session => (
        <div className="nai-source-group" key={session.key}>
          <div className="nai-source-header" onClick={() => toggle(session.key)}>
            <span title={session.title}>{session.title}</span>
            <span className="nai-chevron">{openSessions[session.key] ? '▲' : '▼'}</span>
          </div>
          {openSessions[session.key] && (
            <div className="nai-source-body open">
              {session.messages.map((m, i) => (
                <div key={i}>
{m.role === 'bot'
  ? <div className={`nai-hist-msg ${m.role}`} dangerouslySetInnerHTML={{ __html: marked(m.text) }} />
  : <div className={`nai-hist-msg ${m.role}`}>{m.text}</div>
}
                  <div className="nai-hist-time">
                    {new Date(m.time).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </>
  )
}

// ── Main NexusAI page ─────────────────────────────────────────────────────────

const CHIPS = [
  { label: 'Where are the Past Questions',  q: 'Where can I find past questions?' },
  { label: 'Change username',    q: 'How do I change my display name?' },
  { label: 'Study tips',      q: 'Give me study tips for exams' },
]

export default function NexusAIPage() {
  const username = localStorage.getItem('username') || 'Guest'

  // ── State ──────────────────────────────────────────────────────
  const [messages, setMessages]       = useState([])   // chat bubbles shown on screen
  const [inputText, setInputText]     = useState('')   // controlled textarea value
  const [isTyping, setIsTyping]       = useState(false)// show typing indicator
  const [allChats, setAllChats]       = useState(() => loadAllChats())

  // sessionMessages keeps the conversation history for the API -useRef so it
  // doesn't cause re-renders but persists across them (unlike a plain let)
  const sessionMessages = useRef([])
  const messagesEndRef  = useRef(null)   // used to auto-scroll to bottom

  // A fresh session id is generated each time the page mounts, so leaving and
  // coming back to Nexus AI starts a separate conversation in the history panel.
  const sessionIdRef = useRef(`sess-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`)

  // ── Auto-scroll when new messages arrive ───────────────────────
 

  // ── Speech recognition ─────────────────────────────────────────
  const recognitionRef   = useRef(null)
  const [isRecording, setIsRecording] = useState(false)
  const [micAvailable, setMicAvailable] = useState(false)

  useEffect(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SR) return

    const rec          = new SR()
    rec.continuous     = false
    rec.interimResults = false
    rec.lang           = 'en-NG'

    rec.onresult = e => {
      const t = e.results[0][0].transcript.trim()
      if (!t) return
      setInputText(prev => {
        const prefix = prev.length && !prev.endsWith(' ') && !prev.endsWith('.') ? ' ' : ''
        let final = t
        if (!prev.length || prev.endsWith('. ')) final = final[0].toUpperCase() + final.slice(1)
        if (!final.match(/[.!?]$/)) final += '.'
        return prev + prefix + final + ' '
      })
    }

    rec.onstart = () => setIsRecording(true)
    rec.onend   = () => setIsRecording(false)
    rec.onerror = e => { if (e.error !== 'no-speech') setIsRecording(false) }

    recognitionRef.current = rec
    setMicAvailable(true)
  }, [])

  function toggleMic() {
    const rec = recognitionRef.current
    if (!rec) return
    if (isRecording) { rec.stop() }
    else { try { rec.start() } catch (e) { console.error(e) } }
  }
  console.log(window.location.href)
  // ── Send message ───────────────────────────────────────────────
  async function sendMessage(textOverride) {
    const text = (textOverride ?? inputText).trim()
    if (!text) return

    setInputText('')
    const now = new Date().toISOString()

    // Add user message to screen
    setMessages(prev => [...prev, { role: 'user', text, time: formatTime(now) }])

    // Save to session history (for API context) and global store (for history panel)
    sessionMessages.current.push({ role: 'user', text, time: now })
    logChatMessage({ source: 'Nexus AI', role: 'user', text, sessionId: sessionIdRef.current })

    setIsTyping(true)

    try {
      const history = sessionMessages.current.slice(-10).map(m => ({
        role: m.role === 'user' ? 'user' : 'assistant',
        content: m.text,
      }))

      const { data, error: fnError } = await supabasePublic.functions.invoke('ai-chat', {
        body: {
          model: 'nvidia/nemotron-3-nano-30b-a3b:free',
          messages: [
            { role: 'system', content: buildSystemPrompt() },
            ...history,
          ],
          temperature: 0.7,
        },
      })

      if (fnError) throw fnError
      const reply = data?.choices?.[0]?.message?.content || 'Sorry, I ran into an error. Please try again.'

      setIsTyping(false)

      const replyTime = new Date().toISOString()
      setMessages(prev => [...prev, { role: 'bot', text: reply, time: formatTime(replyTime) }])

      sessionMessages.current.push({ role: 'bot', text: reply, time: replyTime })
      logChatMessage({ source: 'Nexus AI', role: 'bot', text: reply, sessionId: sessionIdRef.current })

      // Refresh history panel
      setAllChats(loadAllChats())

    } catch (err) {
      setIsTyping(false)
      setMessages(prev => [...prev, { role: 'bot', text: 'Network error – please check your connection and try again.', time: 'Now' }])
      console.error('Nexus AI error:', err)
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  function handleClearHistory() {
    if (confirm('Clear all previous chat history? This cannot be undone.')) {
      saveAllChats([])
      setAllChats([])
    }
  }

  // ── Group history into individual sessions for the panel ───────
  // Each session is keyed by its sessionId (older messages without one are
  // grouped by source so legacy history still shows up). The session title is
  // the first thing the user typed in that conversation.
  const sessionMap = {}
  const order = []
  allChats.forEach(msg => {
    const key = msg.sessionId || `legacy-${msg.source || 'Nexus AI'}`
    if (!sessionMap[key]) { sessionMap[key] = []; order.push(key) }
    sessionMap[key].push(msg)
  })

  function truncate(s, n = 40) {
    return s.length > n ? s.slice(0, n).trimEnd() + '…' : s
  }

  const sessions = order.map(key => {
    const msgs = sessionMap[key]
    const firstUser = msgs.find(m => m.role === 'user')
    const rawTitle = (firstUser?.text || msgs[0]?.text || msgs[0]?.source || 'Chat').trim()
    return { key, title: truncate(rawTitle), messages: msgs }
  }).reverse()   // newest session first

  // ── Render ─────────────────────────────────────────────────────
  return (

    <> 
     <ScrollToTop />
    <div className="nexus-ai-page">

      {/* Header */}
      <div className="nai-header">
        <div className="nai-avatar">N</div>
        <div>
          <h1 style={{ margin: 0, fontSize: 24 }}>Nexus AI</h1>
          <p className="muted" style={{ margin: '2px 0 0' }}>Your personal academic assistant</p>
        </div>
      </div>

      {/* Two-column layout */}
      <div className="nai-layout">

        {/* ── LEFT: Chat panel ── */}
        <div className="nai-chat-panel">

          {/* Quick-help chips */}
          <div className="nai-chips">
            {CHIPS.map(chip => (
              <span
                key={chip.label}
                className="nai-chip"
                onClick={() => sendMessage(chip.q)}
              >
                {chip.label}
              </span>
            ))}
          </div>

          {/* Messages */}
          <div className="nai-messages">
            {/* Welcome message */}
            <div className="nai-msg bot">
              <div className="nai-bubble">
                👋 Hi <strong>{username}</strong>! I&apos;m Nexus AI.<br />
                Ask me anything about your courses or how to use this platform.
              </div>
              <div className="nai-time">Now</div>
            </div>

            {/* All chat messages */}
            {messages.map((msg, i) => (
              <ChatMessage key={i} role={msg.role} text={msg.text} time={msg.time} />
            ))}

            {/* Typing indicator */}
            {isTyping && <TypingIndicator />}

            {/* Invisible div at the bottom -scrolled into view on new messages */}
            <div ref={messagesEndRef} />
          </div>

          {/* Input row */}
          <div className="nai-input-row">
            {micAvailable && (
              <button
                className={`nai-mic-btn ${isRecording ? 'active' : ''}`}
                onClick={toggleMic}
                title="Voice input"
              >
                <i className="fa-solid fa-microphone" />
              </button>
            )}
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

        {/* ── RIGHT: History panel ── */}
        <div className="nai-history-panel">
          <div className="nai-history-header">
            <h3 style={{ margin: 0 }}>Previous Chats</h3>
            <button className="nai-clear-btn" onClick={handleClearHistory}>
              <i className="fa-solid fa-trash-can" /> Clear
            </button>
          </div>
          <div id="naiHistoryList">
            <HistoryPanel sessions={sessions} />
          </div>
        </div>

      </div>
    </div>
    </>
  )
}