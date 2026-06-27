import { useEffect, useRef, useState, useCallback } from 'react'
import './WaitGame.css'

// ── Snake ──────────────────────────────────────────────────────────────────

const COLS = 17, ROWS = 17, CELL = 20
const START_SPEED = 145, MIN_SPEED = 70

const snakeCentre = () => [{ x: 8, y: 8 }, { x: 7, y: 8 }, { x: 6, y: 8 }]

function randFood(snake) {
  let f
  do { f = { x: Math.floor(Math.random() * COLS), y: Math.floor(Math.random() * ROWS) } }
  while (snake.some(s => s.x === f.x && s.y === f.y))
  return f
}

function SnakeGame() {
  const canvasRef  = useRef(null)
  const snakeRef   = useRef(snakeCentre())
  const dirRef     = useRef({ x: 1, y: 0 })
  const nextDir    = useRef({ x: 1, y: 0 })
  const foodRef    = useRef(randFood(snakeCentre()))
  const speedRef   = useRef(START_SPEED)
  const timerRef   = useRef(null)
  const overRef    = useRef(false)
  const pausedRef  = useRef(false)   // guard against double-scheduling on pause/resume

  const [score, setScore]   = useState(0)
  const [over, setOver]     = useState(false)
  const [paused, setPaused] = useState(false)

  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    ctx.fillStyle = '#0f172a'
    ctx.fillRect(0, 0, COLS * CELL, ROWS * CELL)
    ctx.strokeStyle = 'rgba(255,255,255,0.04)'
    ctx.lineWidth = 1
    for (let i = 1; i < COLS; i++) {
      ctx.beginPath(); ctx.moveTo(i * CELL, 0); ctx.lineTo(i * CELL, ROWS * CELL); ctx.stroke()
      ctx.beginPath(); ctx.moveTo(0, i * CELL); ctx.lineTo(COLS * CELL, i * CELL); ctx.stroke()
    }
    const f = foodRef.current
    ctx.fillStyle = '#f87171'
    ctx.beginPath()
    ctx.arc(f.x * CELL + CELL / 2, f.y * CELL + CELL / 2, CELL / 2 - 2, 0, Math.PI * 2)
    ctx.fill()
    snakeRef.current.forEach((s, i) => {
      ctx.fillStyle = i === 0 ? '#c4b5fd' : '#7c3aed'
      const pad = i === 0 ? 1 : 2
      ctx.fillRect(s.x * CELL + pad, s.y * CELL + pad, CELL - pad * 2, CELL - pad * 2)
    })
  }, [])

  const stop = useCallback(() => {
    if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null }
  }, [])

  const tick = useCallback(() => {
    // Guard: if paused or over, a stale in-flight tick should not re-schedule.
    if (pausedRef.current || overRef.current) return

    const dir = nextDir.current
    dirRef.current = dir
    const snake = snakeRef.current
    const head = { x: snake[0].x + dir.x, y: snake[0].y + dir.y }

    const hitWall = head.x < 0 || head.y < 0 || head.x >= COLS || head.y >= ROWS
    const hitSelf = snake.slice(0, -1).some(s => s.x === head.x && s.y === head.y)
    if (hitWall || hitSelf) {
      overRef.current = true
      setOver(true)
      stop()
      return
    }

    const ate = head.x === foodRef.current.x && head.y === foodRef.current.y
    const next = [head, ...snake]
    if (ate) {
      foodRef.current = randFood(next)
      speedRef.current = Math.max(MIN_SPEED, speedRef.current - 4)
      setScore(s => s + 1)
    } else {
      next.pop()
    }
    snakeRef.current = next
    draw()
    // Only schedule the next step if we haven't been paused mid-tick.
    if (!pausedRef.current) {
      timerRef.current = setTimeout(tick, speedRef.current)
    }
  }, [draw, stop])

  const setDir = useCallback((x, y) => {
    if (overRef.current) return
    const cur = dirRef.current
    if (cur.x === -x && cur.y === -y) return
    if (cur.x === x && cur.y === y) return
    nextDir.current = { x, y }
  }, [])

  const restart = useCallback(() => {
    stop()
    snakeRef.current  = snakeCentre()
    dirRef.current    = { x: 1, y: 0 }
    nextDir.current   = { x: 1, y: 0 }
    foodRef.current   = randFood(snakeRef.current)
    speedRef.current  = START_SPEED
    overRef.current   = false
    pausedRef.current = false
    setScore(0); setOver(false); setPaused(false)
    draw()
    timerRef.current = setTimeout(tick, speedRef.current)
  }, [draw, stop, tick])

  useEffect(() => {
    draw()
    timerRef.current = setTimeout(tick, speedRef.current)
    const onKey = (e) => {
      const map = {
        ArrowUp: [0,-1], w: [0,-1], W: [0,-1],
        ArrowDown: [0,1], s: [0,1], S: [0,1],
        ArrowLeft: [-1,0], a: [-1,0], A: [-1,0],
        ArrowRight: [1,0], d: [1,0], D: [1,0],
      }
      if (map[e.key]) { e.preventDefault(); setDir(...map[e.key]) }
    }
    window.addEventListener('keydown', onKey)
    return () => { window.removeEventListener('keydown', onKey); stop() }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const togglePause = () => {
    if (overRef.current) return
    // Update the ref synchronously in the event handler - don't rely on the
    // React batch flush timing, which can let tick() fire and re-schedule
    // before the updater function ever runs (causing 2× speed after resume).
    const np = !pausedRef.current
    pausedRef.current = np
    if (np) {
      stop()
    } else {
      timerRef.current = setTimeout(tick, speedRef.current)
    }
    setPaused(np)
  }

  return (
    <>
      <div className="wg-game-meta">
        <span className="wg-badge">N-Snake</span>
        <span className="wg-score">Score: {score}</span>
      </div>

      <div className="wg-stage">
        <canvas ref={canvasRef} width={COLS * CELL} height={ROWS * CELL} className="wg-canvas" />
        {(over || paused) && (
          <div className="wg-stage-overlay">
            {over ? (
              <>
                <div className="wg-go-title">Game Over</div>
                <div className="wg-go-score">You scored {score}</div>
                <button className="wg-btn" onClick={restart}>↻ Play again</button>
              </>
            ) : (
              <button className="wg-btn" onClick={togglePause}>▶ Resume</button>
            )}
          </div>
        )}
      </div>

      <div className="wg-dpad">
        <button className="wg-key wg-up"    onClick={() => setDir(0, -1)}  aria-label="Up">▲</button>
        <button className="wg-key wg-left"  onClick={() => setDir(-1, 0)}  aria-label="Left">◀</button>
        <button className="wg-key wg-pause" onClick={togglePause}          aria-label="Pause">{paused ? '▶' : 'II'}</button>
        <button className="wg-key wg-right" onClick={() => setDir(1, 0)}   aria-label="Right">▶</button>
        <button className="wg-key wg-down"  onClick={() => setDir(0, 1)}   aria-label="Down">▼</button>
      </div>

      <div className="wg-hint">Arrow keys / WASD · don't hit the wall or your own tail.</div>
    </>
  )
}

// ── Tic Tac Toe ────────────────────────────────────────────────────────────

const TTT_WINS = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]]
const PLAYER = 'X', AI_MARK = 'O'

function tttWinner(board) {
  for (const [a, b, c] of TTT_WINS) {
    if (board[a] && board[a] === board[b] && board[a] === board[c]) return board[a]
  }
  return null
}

function minimax(board, isMax) {
  const w = tttWinner(board)
  if (w === AI_MARK) return 10
  if (w === PLAYER)  return -10
  if (board.every(Boolean)) return 0
  let best = isMax ? -Infinity : Infinity
  for (let i = 0; i < 9; i++) {
    if (!board[i]) {
      board[i] = isMax ? AI_MARK : PLAYER
      const s = minimax(board, !isMax)
      board[i] = null
      best = isMax ? Math.max(best, s) : Math.min(best, s)
    }
  }
  return best
}

function aiMove(board) {
  const empty = board.map((v, i) => (v ? -1 : i)).filter(i => i >= 0)
  // 80% minimax, 20% random - keeps it beatable and fun
  if (Math.random() < 0.2) return empty[Math.floor(Math.random() * empty.length)]
  let best = -Infinity, idx = empty[0]
  for (const i of empty) {
    board[i] = AI_MARK
    const s = minimax(board, false)
    board[i] = null
    if (s > best) { best = s; idx = i }
  }
  return idx
}

function getWinLine(board) {
  for (const line of TTT_WINS) {
    const [a, b, c] = line
    if (board[a] && board[a] === board[b] && board[a] === board[c]) return line
  }
  return null
}

function TicTacToe() {
  const [board, setBoard]   = useState(Array(9).fill(null))
  const [phase, setPhase]   = useState('play')  // 'play' | 'ai' | 'done'
  const [result, setResult] = useState(null)     // 'win' | 'lose' | 'draw'
  const [winLine, setWinLine] = useState(null)

  const handleClick = (i) => {
    if (phase !== 'play' || board[i]) return
    const next = [...board]; next[i] = PLAYER
    const w = tttWinner(next)
    if (w) { setBoard(next); setWinLine(getWinLine(next)); setPhase('done'); setResult('win'); return }
    if (next.every(Boolean)) { setBoard(next); setPhase('done'); setResult('draw'); return }
    setBoard(next); setPhase('ai')
    setTimeout(() => {
      const move = aiMove([...next])
      const b = [...next]; b[move] = AI_MARK
      const w2 = tttWinner(b)
      if (w2) { setBoard(b); setWinLine(getWinLine(b)); setPhase('done'); setResult('lose'); return }
      if (b.every(Boolean)) { setBoard(b); setPhase('done'); setResult('draw'); return }
      setBoard(b); setPhase('play')
    }, 450)
  }

  const restart = () => {
    setBoard(Array(9).fill(null))
    setPhase('play'); setResult(null); setWinLine(null)
  }

  const statusText = phase === 'ai' ? 'Computer is thinking…'
    : phase === 'done'
      ? result === 'win' ? 'You won!' : result === 'lose' ? 'Computer won' : "Draw"
    : 'Your turn (X)'

  return (
    <div className="ttt-wrap">
      <div className={`ttt-status ttt-status-${result ?? (phase === 'ai' ? 'ai' : 'play')}`}>
        {statusText}
      </div>

      <div className="ttt-grid">
        {board.map((cell, i) => (
          <button
            key={i}
            className={[
              'ttt-cell',
              cell === PLAYER  ? 'ttt-x' : '',
              cell === AI_MARK ? 'ttt-o' : '',
              winLine?.includes(i) ? 'ttt-hl' : '',
            ].join(' ').trim()}
            onClick={() => handleClick(i)}
            disabled={!!cell || phase !== 'play'}
            aria-label={`Cell ${i + 1}${cell ? ` - ${cell}` : ''}`}
          >
            {cell && <span className="ttt-sym">{cell}</span>}
          </button>
        ))}
      </div>

      {phase === 'done' && (
        <button className="wg-btn ttt-replay" onClick={restart}>↻ Play again</button>
      )}

      <div className="wg-hint">You are X · try to beat the AI!</div>
    </div>
  )
}

// ── Main WaitGame ──────────────────────────────────────────────────────────

export default function WaitGame({
  title    = 'Nexus AI is marking your paper…',
  subtitle = 'Sending answers · awaiting grade · parsing results',
}) {
  const [game, setGame] = useState('ttt')   // 'ttt' is the default

  return (
    <div className="wg-overlay">
      <div className="wg-card">
        <div className="wg-head">
          <span className="wg-spinner" />
          <div>
            <div className="wg-title">{title}</div>
            <div className="wg-sub">{subtitle}</div>
          </div>
        </div>

        <div className="wg-tabs">
          <button
            className={`wg-tab${game === 'ttt' ? ' wg-tab-active' : ''}`}
            onClick={() => setGame('ttt')}
          >
            Tic Tac Toe
          </button>
          <button
            className={`wg-tab${game === 'snake' ? ' wg-tab-active' : ''}`}
            onClick={() => setGame('snake')}
          >
            Snake
          </button>
        </div>

        {game === 'ttt' ? <TicTacToe /> : <SnakeGame />}
      </div>
    </div>
  )
}
