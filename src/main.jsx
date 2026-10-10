// Must stay the first import: in demo mode it sandboxes localStorage before any
// other module reads it (see lib/demoBoot.js).
import './lib/demoBoot'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import {BrowserRouter} from 'react-router'
import './index.css'
import './pages/App.css'
import App from './App.jsx'
import { initPush } from './lib/push'
import { isDemo } from './lib/demo'
import { bootSession } from './lib/session'
import { loadPapers } from './lib/pastQuestions'
import { startTracking } from './lib/track'

// Register the push service worker early so devices that already opted in keep
// receiving background notifications. Does not prompt for permission.
if (!isDemo) initPush()

function render() {
  createRoot(document.getElementById('root')).render(
    <StrictMode>
      {/* The demo is the same app, served under /demo */}
      <BrowserRouter basename={isDemo ? '/demo' : undefined}>
        <App />
      </BrowserRouter>
    </StrictMode>,
  )
  startTracking()
}

// Know who is signed in and which papers exist before the first screen is
// drawn, so nothing flashes "signed out" or "no papers" while loading. If the
// server is slow or down, start anyway with whatever this device remembers.
Promise.race([
  Promise.all([bootSession(), loadPapers()]),
  new Promise(resolve => setTimeout(resolve, 6000)),
]).finally(render)
