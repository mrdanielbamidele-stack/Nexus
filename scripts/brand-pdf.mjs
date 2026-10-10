// Stamps a sponsor footer (logo + URL, clickable) onto every page of a PDF.
// The footer is written into the file itself, so it shows in the site's viewer
// and in the downloaded copy alike.
//
//   npm i --no-save pdf-lib
//   node scripts/brand-pdf.mjs <input.pdf> <output.pdf> <logo.png> [url]
//
// e.g. node scripts/brand-pdf.mjs public/pastquestions/STA111-20232024.pdf \
//        public/pastquestions/STA111-20232024-lynklens.pdf public/lynklens-logo.png
//
// The footer sits in the bottom margin (about 12-40pt up from the page edge).
// Pages need at least ~45pt of clear space there - the STA 111 paper has 56pt+.

import fs from 'fs'
import { PDFDocument, PDFName, PDFString, StandardFonts, rgb } from 'pdf-lib'

const [input, output, logoPath, url = 'https://lynklens.com'] = process.argv.slice(2)
if (!input || !output || !logoPath) {
  console.error('usage: node scripts/brand-pdf.mjs <input.pdf> <output.pdf> <logo.png> [url]')
  process.exit(1)
}

const PURPLE = rgb(0.455, 0.255, 0.69)   // #7441b0 - Lynklens purple
const GREY = rgb(0.45, 0.43, 0.52)
const LINE = rgb(0.86, 0.82, 0.93)

const doc = await PDFDocument.load(fs.readFileSync(input))
const logo = await doc.embedPng(fs.readFileSync(logoPath)) // embedded once, reused on every page
const regular = await doc.embedFont(StandardFonts.Helvetica)
const bold = await doc.embedFont(StandardFonts.HelveticaBold)

const LOGO_H = 17
const LOGO_W = (logo.width / logo.height) * LOGO_H
const BOTTOM = 14            // footer baseline area, pt from the bottom edge
const SIDE = 72              // keep to the page's text margins
const label = url.replace(/^https?:\/\//, '')

for (const page of doc.getPages()) {
  const { width } = page.getSize()
  const left = SIDE
  const right = width - SIDE

  // hairline above the footer
  page.drawLine({ start: { x: left, y: BOTTOM + LOGO_H + 7 }, end: { x: right, y: BOTTOM + LOGO_H + 7 }, thickness: 0.6, color: LINE })

  // logo (left)
  page.drawImage(logo, { x: left, y: BOTTOM, width: LOGO_W, height: LOGO_H })

  // tagline (middle)
  const tagline = 'Past questions in your palm. Brought to you by Lynklens.'
  const tagSize = 7.5
  page.drawText(tagline, { x: left + LOGO_W + 12, y: BOTTOM + 5.5, size: tagSize, font: regular, color: GREY })

  // URL (right)
  const urlSize = 10
  const urlWidth = bold.widthOfTextAtSize(label, urlSize)
  page.drawText(label, { x: right - urlWidth, y: BOTTOM + 4.5, size: urlSize, font: bold, color: PURPLE })

  // make the whole footer a link
  const link = doc.context.obj({
    Type: 'Annot',
    Subtype: 'Link',
    Rect: [left, BOTTOM - 2, right, BOTTOM + LOGO_H + 2],
    Border: [0, 0, 0],
    A: { Type: 'Action', S: 'URI', URI: PDFString.of(url) },
  })
  const ref = doc.context.register(link)
  const existing = page.node.Annots()
  if (existing) existing.push(ref)
  else page.node.set(PDFName.of('Annots'), doc.context.obj([ref]))
}

fs.writeFileSync(output, await doc.save())
console.log(`branded ${doc.getPageCount()} pages -> ${output} (${(fs.statSync(output).size / 1024).toFixed(0)} KB)`)
