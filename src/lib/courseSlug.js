// DB code  -> clean URL slug:  "Phy 101" -> "Phy101"
export const codeToSlug = (code) => (code ?? "").replace(/\s+/g, "");

// Anything -> comparison key (case- AND space-insensitive):
//   "Phy 101", "phy101", "PHY101" all -> "phy101"
export const normalizeCode = (code) => (code ?? "").toLowerCase().replace(/\s+/g, "");

// Slug / DB code -> nice display label:  "cos101" / "Phy 101" -> "COS 101",
// "tum-ges103" -> "TUM-GES 103".  We strip existing spaces then re-insert one
// between the letter prefix and the course number so the URL slug (no space)
// still reads nicely in the UI.
export const formatCode = (code) =>
  (code ?? "")
    .replace(/\s+/g, "")
    .replace(/([a-zA-Z]+)(\d.*)$/, "$1 $2")
    .toUpperCase();

// Does this slug actually look like a course code? Letters (optionally
// hyphenated, e.g. "tum-csc") followed by a number at the END:
//   "cos101", "tum-csc 122", "PHY101"  -> true
//   "about", "ffff", "settings"        -> false
// Used to send non-course paths to the generic 404 instead of the
// course-specific "course not found" screen.
export const isCourseCode = (code) =>
  /^[a-z]+(?:-[a-z]+)*\s*\d+[a-z]?$/i.test((code ?? "").trim());
