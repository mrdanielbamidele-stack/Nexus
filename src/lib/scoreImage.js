// Draws a shareable "score card" on a canvas and triggers a PNG download.
// No external library - purpose-built so it works offline and matches the
// app's purple theme. Used by both the MCQ and the AI-graded essay results.

function roundRect(ctx, x, y, w, h, r) {
  const rr = Math.min(r, w / 2, h / 2)
  ctx.beginPath()
  ctx.moveTo(x + rr, y)
  ctx.arcTo(x + w, y,     x + w, y + h, rr)
  ctx.arcTo(x + w, y + h, x,     y + h, rr)
  ctx.arcTo(x,     y + h, x,     y,     rr)
  ctx.arcTo(x,     y,     x + w, y,     rr)
  ctx.closePath()
}

function loadImage(src) {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload  = () => resolve(img)
    img.onerror = () => resolve(null)
    img.src = src
  })
}

function gradeColor(pct) {
  if (pct >= 70) return '#34d399'
  if (pct >= 50) return '#fbbf24'
  return '#f87171'
}

/**
 * @param {object} o
 * @param {string} o.courseCode
 * @param {string} o.courseTitle
 * @param {number} o.score        marks / correct count
 * @param {number} o.total        total marks / question count
 * @param {number} o.pct
 * @param {string} o.grade        letter grade
 * @param {string} [o.gradeWord]
 * @param {Array<{label:string,value:number|string,color:string}>} [o.stats]
 * @param {string} [o.studentName]
 */
export async function downloadScoreCard(o) {
  const W = 1080, H = 1350
  const canvas = document.createElement('canvas')
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d')

  // Background gradient (matches the in-app purple banner).
  const bg = ctx.createLinearGradient(0, 0, W, H)
  bg.addColorStop(0, '#7c3aed')
  bg.addColorStop(1, '#3b0d70')
  ctx.fillStyle = bg
  ctx.fillRect(0, 0, W, H)

  // Soft decorative circles.
  ctx.fillStyle = 'rgba(255,255,255,0.06)'
  ctx.beginPath(); ctx.arc(W - 120, 150, 260, 0, Math.PI * 2); ctx.fill()
  ctx.beginPath(); ctx.arc(120, H - 180, 220, 0, Math.PI * 2); ctx.fill()

  ctx.textAlign = 'center'

  // Logo + university name.
  const logo = await loadImage('/logo.png')
  if (logo) {
    const s = 96
    try { ctx.drawImage(logo, W / 2 - s / 2, 90, s, s) } catch { /* tainted */ }
  }
  ctx.fillStyle = '#ffffff'
  ctx.font = '700 40px Arial, sans-serif'
  ctx.fillText('TOPFAITH UNIVERSITY', W / 2, 250)
  ctx.fillStyle = 'rgba(255,255,255,0.7)'
  ctx.font = '500 26px Arial, sans-serif'
  ctx.fillText('Nexus Campaign · Result', W / 2, 296)

  // Course code + title.
  ctx.fillStyle = '#ffffff'
  ctx.font = '800 64px Arial, sans-serif'
  ctx.fillText((o.courseCode || '').toUpperCase(), W / 2, 410)
  ctx.fillStyle = 'rgba(255,255,255,0.82)'
  ctx.font = '400 30px Arial, sans-serif'
  const title = o.courseTitle || ''
  ctx.fillText(title.length > 46 ? title.slice(0, 45) + '…' : title, W / 2, 458)

  // Score card panel.
  const cardX = 110, cardY = 520, cardW = W - 220, cardH = 470
  ctx.fillStyle = 'rgba(255,255,255,0.10)'
  roundRect(ctx, cardX, cardY, cardW, cardH, 36); ctx.fill()

  // Big grade letter inside a circle.
  const gc = gradeColor(o.pct)
  ctx.beginPath(); ctx.arc(W / 2, cardY + 150, 110, 0, Math.PI * 2)
  ctx.fillStyle = 'rgba(255,255,255,0.12)'; ctx.fill()
  ctx.lineWidth = 10; ctx.strokeStyle = gc; ctx.stroke()
  ctx.fillStyle = gc
  ctx.font = '900 120px Arial, sans-serif'
  ctx.textBaseline = 'middle'
  ctx.fillText(o.grade || '–', W / 2, cardY + 158)
  ctx.textBaseline = 'alphabetic'

  // Score number + percentage.
  ctx.fillStyle = '#ffffff'
  ctx.font = '900 92px Arial, sans-serif'
  ctx.fillText(`${o.score} / ${o.total}`, W / 2, cardY + 360)
  ctx.fillStyle = gc
  ctx.font = '700 40px Arial, sans-serif'
  const word = o.gradeWord ? ` · ${o.gradeWord}` : ''
  ctx.fillText(`${o.pct}%${word}`, W / 2, cardY + 420)

  // Stat pills (e.g. Correct / Wrong / Skipped).
  const stats = (o.stats || []).slice(0, 3)
  if (stats.length) {
    const gap = 24
    const pillW = (cardW - gap * (stats.length - 1)) / stats.length
    const pillH = 130, py = cardY + cardH + 40
    stats.forEach((st, i) => {
      const px = cardX + i * (pillW + gap)
      ctx.fillStyle = 'rgba(255,255,255,0.10)'
      roundRect(ctx, px, py, pillW, pillH, 24); ctx.fill()
      ctx.fillStyle = st.color || '#ffffff'
      ctx.font = '800 56px Arial, sans-serif'
      ctx.fillText(String(st.value), px + pillW / 2, py + 66)
      ctx.fillStyle = 'rgba(255,255,255,0.75)'
      ctx.font = '600 24px Arial, sans-serif'
      ctx.fillText(st.label, px + pillW / 2, py + 104)
    })
  }

  // Footer: student name + date.
  ctx.fillStyle = 'rgba(255,255,255,0.85)'
  ctx.font = '600 30px Arial, sans-serif'
  if (o.studentName) ctx.fillText(o.studentName, W / 2, H - 110)
  ctx.fillStyle = 'rgba(255,255,255,0.55)'
  ctx.font = '400 24px Arial, sans-serif'
  const date = new Date().toLocaleDateString('en-NG', { day: 'numeric', month: 'long', year: 'numeric' })
  ctx.fillText(`Topfaith Nexus · ${date}`, W / 2, H - 64)

  // Download.
  const safe = (o.courseCode || 'result').replace(/\s+/g, '-')
  const filename = `nexus-${safe}-${o.pct}pct.png`
  await new Promise((resolve) => {
    canvas.toBlob((blob) => {
      if (!blob) { resolve(); return }
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      a.remove()
      setTimeout(() => URL.revokeObjectURL(url), 1000)
      resolve()
    }, 'image/png')
  })
}
