// Demo mode: the whole platform served under /demo, with no sign-in, already
// logged in as a made-up student, and a sponsor (Lynklens) shown in the ad slots.
//
// Nothing here runs on the real site - `isDemo` is only true when the page was
// opened at /demo (or /demo/...). Everything the demo stores is kept under its
// own prefix (see demoBoot.js), so it never touches a real student's session.

export const isDemo =
  typeof location !== 'undefined' &&
  (location.pathname === '/demo' || location.pathname.startsWith('/demo/'))

// Who the demo visitor is. A Computer Science student in 400 level.
export const DEMO_STUDENT = {
  username: 'Lynklens',
  regNumber: '202300092',
  courseOS: 'Computer Science',
  level: '400',
}

// Every demo course serves this course's past paper, so each one has content.
export const DEMO_COURSE = 'STA 111'

// ...using a copy of that paper with the Lynklens footer stamped into every page
// (made with scripts/brand-pdf.mjs). The original file is left as it was.
export const DEMO_PAPER_URL = '/pastquestions/STA111-20232024-lynklens.pdf'

export const SPONSOR_URL = 'https://lynklens.com'
