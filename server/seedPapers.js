// The papers that shipped with Nexus before it had a database. They are copied
// into Mongo once (see seed.js) so they can be moderated like any other paper.
// The files start in public/pastquestions/ and are moved to Cloudinary by
// `npm run papers:cloud` (scripts/papers-to-cloudinary.mjs).

export const seedPapers = [
  { code: 'COS 101', session: '2023/2024', file: 'COS101-20232024.pdf' },
  { code: 'GES 101', session: '2023/2024', file: 'GES101-20232024.pdf' },
  { code: 'CSC 112', session: '2023/2024', file: 'CSC112-20232024.pdf' },
  { code: 'PHY 107', session: '2023/2024', file: 'PHY107-20232024.pdf' },
  { code: 'MTH 101', session: '2023/2024', file: 'MTH101-20232024.pdf' },
  { code: 'STA 111', session: '2023/2024', file: 'STA111-20232024.pdf' },
  { code: 'PHY 101', session: '2023/2024', file: 'PHY101-20232024.pdf' },
  { code: 'GST 111', session: '2023/2024', file: 'GST111-20232024.pdf' },
]
