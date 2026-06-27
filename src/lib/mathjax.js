// Lazily load MathJax (v3) once, on demand, for pages that render LaTeX.
// We configure it before the script loads and turn off the initial auto-typeset
// so callers control exactly which elements get typeset.

let mathjaxPromise = null

export function loadMathJax() {
  if (mathjaxPromise) return mathjaxPromise

  if (typeof window !== 'undefined' && window.MathJax && window.MathJax.typesetPromise) {
    mathjaxPromise = Promise.resolve()
    return mathjaxPromise
  }

  window.MathJax = {
    tex: {
      inlineMath: [['$', '$'], ['\\(', '\\)']],
      displayMath: [['$$', '$$'], ['\\[', '\\]']],
    },
    startup: { typeset: false },
  }

  mathjaxPromise = new Promise((resolve) => {
    const script = document.createElement('script')
    script.id = 'MathJax-script'
    script.async = true
    script.src = 'https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js'
    // Wait for MathJax's own startup to finish, not just the file download -
    // calling typesetPromise before startup resolves silently does nothing.
    script.onload = () => {
      const startup = window.MathJax && window.MathJax.startup
      if (startup && startup.promise) startup.promise.then(resolve, resolve)
      else resolve()
    }
    script.onerror = () => resolve() // fail open: show raw text rather than block
    document.head.appendChild(script)
  })
  return mathjaxPromise
}

// Typeset a single element's LaTeX. Safe to call repeatedly.
export function typesetMath(el) {
  if (!el) return
  loadMathJax().then(() => {
    const MJ = window.MathJax
    if (!MJ || !MJ.typesetPromise) return
    const run = () => {
      try { MJ.typesetClear && MJ.typesetClear([el]) } catch { /* ignore */ }
      return MJ.typesetPromise([el]).catch(() => { /* ignore render errors */ })
    }
    // Chain on startup.promise so we never typeset before MathJax is ready.
    if (MJ.startup && MJ.startup.promise) MJ.startup.promise.then(run, run)
    else run()
  })
}
