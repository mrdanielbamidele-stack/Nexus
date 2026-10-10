import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url'
import { ReaderSkeleton } from './Skeleton'

// Pages are fitted to the screen width but never wider than this at 100% zoom,
// so a paper doesn't balloon on big monitors.
const MAX_PAGE_WIDTH = 1100

// One page. Only drawn while it's near the viewport, so a long paper doesn't
// hold every page in memory; the placeholder keeps its size so scrolling stays smooth.
function PdfPage({ doc, num, width, height, root }) {
  const holder = useRef(null)
  const canvasRef = useRef(null)
  const [near, setNear] = useState(false)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => setNear(entry.isIntersecting),
      { root, rootMargin: '1500px 0px' }
    )
    observer.observe(holder.current)
    return () => observer.disconnect()
  }, [root])

  useEffect(() => {
    if (!near) return
    let cancelled = false
    let task

    ;(async () => {
      const page = await doc.getPage(num)
      const canvas = canvasRef.current
      if (cancelled || !canvas) return

      // Draw at device resolution (capped) so text stays sharp.
      const ratio = Math.min(window.devicePixelRatio || 1, 2)
      const scale = width / page.getViewport({ scale: 1 }).width
      const viewport = page.getViewport({ scale: scale * ratio })
      canvas.width = viewport.width
      canvas.height = viewport.height

      task = page.render({ canvas, canvasContext: canvas.getContext('2d'), viewport })
      await task.promise
    })().catch(() => {
      // A cancelled render (scrolled away / resized) rejects - nothing to do.
    })

    return () => {
      cancelled = true
      task?.cancel()
    }
  }, [near, doc, num, width])

  return (
    <div ref={holder} className="pq-reader-page" data-page={num} style={{ width, height }}>
      {/* keyed by width so a resize always gets a fresh canvas */}
      {near && <canvas key={width} ref={canvasRef} style={{ width, height }} />}
    </div>
  )
}

// Full-height, scrollable PDF reader. It reports which page is on screen via
// onPage(page, totalPages) and opens at `startPage`. `topPadding` is the space
// above the first page (room for floating controls in the full-screen reader).
// `footer` is shown under the last page, at the same width as the pages.
export default function PdfReader({ url, zoom, startPage, onPage, topPadding = 72, footer = null }) {
  const scrollRef = useRef(null)
  const [doc, setDoc] = useState(null)
  const [sizes, setSizes] = useState([])
  const [failed, setFailed] = useState(false)
  const [boxWidth, setBoxWidth] = useState(0)
  const anchor = useRef(0)      // scroll position as a fraction, to keep our place when zooming/resizing
  const restored = useRef(false)

  useEffect(() => {
    let cancelled = false
    let task

    ;(async () => {
      // Loaded on demand so the PDF engine isn't part of the main bundle.
      const pdfjs = await import('pdfjs-dist')
      pdfjs.GlobalWorkerOptions.workerSrc = workerUrl
      task = pdfjs.getDocument({ url })
      const pdf = await task.promise
      const pages = await Promise.all(
        Array.from({ length: pdf.numPages }, async (_, i) => {
          const view = (await pdf.getPage(i + 1)).getViewport({ scale: 1 })
          return { w: view.width, h: view.height }
        })
      )
      if (cancelled) return
      setDoc(pdf)
      setSizes(pages)
    })().catch(() => {
      if (!cancelled) setFailed(true)
    })

    return () => {
      cancelled = true
      task?.destroy()
    }
  }, [url])

  useEffect(() => {
    const el = scrollRef.current
    const observer = new ResizeObserver(() => setBoxWidth(el.clientWidth))
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const gutter = boxWidth < 600 ? 8 : 24
  const pageWidth = boxWidth ? Math.round(Math.min(boxWidth - gutter * 2, MAX_PAGE_WIDTH) * zoom) : 0

  // First layout: jump to where the student left off. Later layouts (zoom /
  // resize): stay at the same relative spot in the paper.
  useLayoutEffect(() => {
    const el = scrollRef.current
    if (!el || !pageWidth || !sizes.length) return

    if (!restored.current) {
      restored.current = true
      const target = el.querySelector(`[data-page="${startPage}"]`)
      if (target && startPage > 1) el.scrollTop = target.offsetTop - 8
      return
    }
    el.scrollTop = anchor.current * el.scrollHeight
  }, [pageWidth, sizes, startPage])

  // Work out which page is on screen as the student scrolls.
  useEffect(() => {
    const el = scrollRef.current
    if (!doc || !pageWidth) return
    let frame = 0

    const update = () => {
      frame = 0
      anchor.current = el.scrollTop / el.scrollHeight
      const probe = el.scrollTop + el.clientHeight * 0.4
      const pages = el.querySelectorAll('.pq-reader-page')
      let current = 1
      for (let i = 0; i < pages.length; i++) {
        if (pages[i].offsetTop > probe) break
        current = i + 1
      }
      onPage(current, pages.length)
    }
    const onScroll = () => { if (!frame) frame = requestAnimationFrame(update) }

    el.addEventListener('scroll', onScroll, { passive: true })
    update()
    return () => {
      el.removeEventListener('scroll', onScroll)
      cancelAnimationFrame(frame)
    }
  }, [doc, pageWidth, onPage])

  return (
    <div ref={scrollRef} className="pq-reader-scroll">
      {failed && (
        <div className="pq-reader-status">
          <p>We couldn't load this paper here.</p>
          <p>
            <a href={url} target="_blank" rel="noreferrer">Open it in a new tab</a>
            {' '}or{' '}
            <a href={url} download>download it</a>.
          </p>
        </div>
      )}
      {!failed && !doc && <ReaderSkeleton topPadding={topPadding} />}
      {doc && pageWidth > 0 && (
        <div className="pq-reader-pages" style={{ padding: `${topPadding}px ${gutter}px 40px` }}>
          {sizes.map((size, i) => (
            <PdfPage
              key={i}
              doc={doc}
              num={i + 1}
              width={pageWidth}
              height={Math.round((size.h * pageWidth) / size.w)}
              root={scrollRef.current}
            />
          ))}
          {footer && <div className="pq-reader-footer" style={{ width: pageWidth }}>{footer}</div>}
        </div>
      )}
    </div>
  )
}
