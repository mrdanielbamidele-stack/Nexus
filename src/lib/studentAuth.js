// src/lib/studentAuth.js
// Tiny localStorage-backed "session" for the (fake) student auth flow.
// A logged-in student is stored as JSON under STUDENT_KEY. We also mirror the
// individual fields into the flat `username` / `courseOS` / `level` /
// `regNumber` keys that the rest of the app (Dashboard, NexusAI, Settings,
// Campaign, PastQuestions) already reads.

const STUDENT_KEY = "studentAuth";

// Flat keys other pages read, so signing in/out keeps them in sync.
const MIRRORED_KEYS = ["username", "courseOS", "level", "regNumber"];

export function getStudent() {
  try {
    return JSON.parse(localStorage.getItem(STUDENT_KEY)) || null;
  } catch {
    return null;
  }
}

export function isAuthed() {
  return !!getStudent();
}

export function setStudent(student) {
  localStorage.setItem(STUDENT_KEY, JSON.stringify(student));
  // Mirror the flat keys the rest of the app reads.
  for (const key of MIRRORED_KEYS) {
    if (student?.[key] != null) localStorage.setItem(key, student[key]);
  }
}

export function clearStudent() {
  localStorage.removeItem(STUDENT_KEY);
  for (const key of MIRRORED_KEYS) localStorage.removeItem(key);
}

// Backfill the flat keys for sessions created before mirroring existed, so an
// already-logged-in student doesn't have to sign out/in to see their details.
// Runs once when this module is first imported (early, via RequireAuth).
const _existing = getStudent();
if (_existing) setStudent(_existing);
