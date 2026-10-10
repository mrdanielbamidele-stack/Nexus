// src/lib/studentAuth.js
// The browser's copy of the signed-in student.
//
// The real session lives on the server (an httpOnly cookie - see lib/session.js).
// This is only a local cache of "who am I" so the screens can read it
// synchronously. It is refreshed from the server every time the app starts and
// after every sign-in, and a server that says "nobody is signed in" clears it.
//
// We also mirror individual fields into the flat `username` / `courseOS` /
// `level` / `regNumber` keys that the rest of the app (Dashboard, Settings,
// Past Questions) already reads.

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
  for (const key of MIRRORED_KEYS) {
    if (student?.[key] != null) localStorage.setItem(key, student[key]);
  }
}

export function clearStudent() {
  localStorage.removeItem(STUDENT_KEY);
  for (const key of MIRRORED_KEYS) localStorage.removeItem(key);
}

// The server's student record -> the shape the screens already use.
export function applyServerStudent(me) {
  if (!me) return clearStudent();
  setStudent({
    id: me.id,
    email: me.email,
    username: me.username,
    regNumber: me.regNumber,
    courseOS: me.programme,
    level: me.level,
    courses: me.courses,
  });
}
