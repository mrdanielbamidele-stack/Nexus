// src/lib/studentCourses.js
// Single source of truth for the courses a student is taking.
//
// A student's course list has two parts:
//   1. BASE / "main" courses  -> derived from their programme + level in the
//      courseCatalog. These are fixed: the student can't remove them.
//   2. ADDED courses          -> extra courses the student adds themselves
//      (e.g. during onboarding or from Settings). These can be removed.
//
// The added course codes live in localStorage under ADDED_KEY. The onboarding
// flow (Auth.jsx) stores the full list (base + extra) on the student object as
// `courses`, so on first read we backfill ADDED_KEY from that if needed.
//
// Every mutation dispatches a `nexus:courses-changed` event so any open screen
// (Dashboard, Past Questions, Settings…) can refresh live. Use
// `useEffectiveCourses()` in React to subscribe automatically.

import { useSyncExternalStore } from "react";
import { courseCatalog } from "../data/courseCatalog";
import { getStudent, setStudent } from "./studentAuth";

const ADDED_KEY = "nexus_added_courses";
const CHANGED_EVENT = "nexus:courses-changed";

const DEFAULT_COURSE_OS = "Computer Science";
const DEFAULT_LEVEL = "100";

/* ------------------------------ catalog index ----------------------------- */

let _catalogIndex = null;

// Flat, de-duped map of code -> course across every programme/level. Built once.
function catalogIndex() {
  if (_catalogIndex) return _catalogIndex;
  const map = new Map();
  for (const programme of Object.values(courseCatalog)) {
    for (const list of Object.values(programme)) {
      for (const c of list) if (!map.has(c.code)) map.set(c.code, c);
    }
  }
  _catalogIndex = map;
  return map;
}

// Resolve a course code to a full course object, even if it isn't in the
// catalog (custom code) - we still want something renderable.
function resolveCourse(code) {
  return (
    catalogIndex().get(code) || { code, title: "Custom course", creditHours: 1, years: 4 }
  );
}

/* --------------------------------- student -------------------------------- */

export function getCourseOS() {
  return localStorage.getItem("courseOS") || DEFAULT_COURSE_OS;
}

export function getLevel() {
  return localStorage.getItem("level") || DEFAULT_LEVEL;
}

// The fixed programme courses for the student's programme + level.
export function getBaseCourses() {
  return courseCatalog[getCourseOS()]?.[getLevel()] || [];
}

function baseCodes() {
  return getBaseCourses().map((c) => c.code);
}

/* ------------------------------ added courses ----------------------------- */

function readAdded() {
  try {
    const raw = localStorage.getItem(ADDED_KEY);
    if (raw != null) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed.filter((c) => typeof c === "string");
    }
  } catch {
    /* fall through to backfill */
  }

  // Backfill: derive added codes from the onboarding `courses` list (base+extra)
  // for sessions created before this store existed.
  const student = getStudent();
  const base = new Set(baseCodes());
  const derived = Array.isArray(student?.courses)
    ? student.courses.filter((code) => !base.has(code))
    : [];
  // Persist so we don't recompute every time.
  localStorage.setItem(ADDED_KEY, JSON.stringify(derived));
  return derived;
}

function writeAdded(codes) {
  // De-dupe, drop anything that's actually a base course, keep it tidy.
  const base = new Set(baseCodes());
  const seen = new Set();
  const clean = [];
  for (const code of codes) {
    if (!code || base.has(code) || seen.has(code)) continue;
    seen.add(code);
    clean.push(code);
  }
  localStorage.setItem(ADDED_KEY, JSON.stringify(clean));

  // Keep the student object's `courses` mirror in sync (base + added) so the
  // rest of the app and any future reads stay consistent.
  const student = getStudent();
  if (student) setStudent({ ...student, courses: [...baseCodes(), ...clean] });

  emitChange();
  return clean;
}

export function getAddedCodes() {
  return readAdded();
}

// Add a course (by code) to the student's added list. Returns the new list.
export function addCourse(code) {
  if (!code) return getAddedCodes();
  const current = readAdded();
  if (current.includes(code) || baseCodes().includes(code)) return current;
  return writeAdded([...current, code]);
}

// Remove an added course. Base/programme courses are ignored (can't be removed).
export function removeCourse(code) {
  const current = readAdded();
  if (!current.includes(code)) return current;
  return writeAdded(current.filter((c) => c !== code));
}

export function isAddedCourse(code) {
  return readAdded().includes(code);
}

/* ----------------------------- effective list ----------------------------- */

// The full list the student is taking: base courses (locked) followed by added
// courses (removable). Each item carries an `added` flag for the UI.
export function getEffectiveCourses() {
  const base = getBaseCourses().map((c) => ({ ...c, added: false }));
  const added = readAdded().map((code) => ({ ...resolveCourse(code), added: true }));
  return [...base, ...added];
}

// Every course in the catalog, de-duped and sorted by code. Used by the
// "add a course" picker (callers filter out what's already taken).
export function getAllCatalogCourses() {
  return [...catalogIndex().values()].sort((a, b) => a.code.localeCompare(b.code));
}

// Every catalog course the student isn't already taking - for the "add" picker.
export function getAddableCourses() {
  const taken = new Set(getEffectiveCourses().map((c) => c.code));
  return getAllCatalogCourses().filter((c) => !taken.has(c.code));
}

/* ------------------------------ subscription ------------------------------ */

function emitChange() {
  window.dispatchEvent(new Event(CHANGED_EVENT));
}

function subscribe(callback) {
  window.addEventListener(CHANGED_EVENT, callback);
  window.addEventListener("storage", callback); // sync across tabs
  return () => {
    window.removeEventListener(CHANGED_EVENT, callback);
    window.removeEventListener("storage", callback);
  };
}

// Cache the snapshot so useSyncExternalStore gets a stable reference between
// renders (it only changes when the underlying codes change).
let _snapshot = null;
let _snapshotKey = "";

function getSnapshot() {
  const courses = getEffectiveCourses();
  const key = courses.map((c) => `${c.code}:${c.added ? 1 : 0}`).join("|");
  if (key !== _snapshotKey) {
    _snapshotKey = key;
    _snapshot = courses;
  }
  return _snapshot;
}

// React hook: returns the live effective course list and re-renders on change.
export function useEffectiveCourses() {
  return useSyncExternalStore(subscribe, getSnapshot);
}
