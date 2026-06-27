import { useEffect, useRef, createElement } from 'react'
import { typesetMath } from '../lib/mathjax'

/* Renders HTML that may contain LaTeX ($...$) and typesets it with MathJax.

   Why a dedicated component instead of dangerouslySetInnerHTML?
   MathJax rewrites the DOM in place (it replaces the "$...$" text with rendered
   <mjx-container> nodes). If React owns that same node - via
   dangerouslySetInnerHTML or a text child - the next re-render (a card flip, a
   swipe reset, typing in a textarea) makes React reclaim the node and slam the
   raw "$...$" string back in, wiping the rendered math. Since MathJax runs
   async, it loses that race and you see raw LaTeX (with a brief "glimpse").

   Here React renders an EMPTY element (no children in JSX), so it never touches
   the contents on re-render. We set innerHTML ourselves and let MathJax own it. */
export default function MathContent({ html, as = 'div', className }) {
  const ref = useRef(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    el.innerHTML = html ?? ''
    typesetMath(el)
  }, [html])
  return createElement(as, { ref, className })
}
