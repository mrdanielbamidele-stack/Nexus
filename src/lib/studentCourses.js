// src/lib/studentCourses.js
// Single source of truth for the courses a student is taking.
//
// The list is stored on the student's account (so it follows them to any
// device). When they sign up it starts as the courses of their programme +
// level, and from then on EVERY course in it can be removed, and any course in
// the catalogue can be added.
//
// Changes apply on screen immediately and are saved to the account in the
// background. Every change dispatches `nexus:courses-changed` so any open
// screen (Dashboard, Past Questions, Settings...) refreshes live. Use
// `useEffectiveCourses()` in React to subscribe automatically.

import { useSyncExternalStore } from "react";
import { courseCatalog } from "../data/courseCatalog";
import { api } from "./api";
import { isDemo } from "./demo";
import { getStudent, setStudent } from "./studentAuth";

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

// The courses of the student's programme + level - what they started with.
export function getProgrammeCourses() {
  return courseCatalog[getCourseOS()]?.[getLevel()] || [];
}

/* ------------------------------ their courses ----------------------------- */

function readCodes() {
  const student = getStudent();
  if (Array.isArray(student?.courses)) {
    return student.courses.filter((code) => typeof code === "string");
  }
  // A cached session from before the list was stored on the account.
  return getProgrammeCourses().map((c) => c.code);
}

async function writeCodes(codes) {
  const previous = readCodes();
  const student = getStudent();

  const clean = [...new Set(codes.filter(Boolean))];
  if (student) setStudent({ ...student, courses: clean });
  emitChange();

  if (isDemo || !student) return clean;

  try {
    const { me } = await api("/student/courses", { method: "PUT", body: { courses: clean } });
    const latest = getStudent();
    if (latest) setStudent({ ...latest, courses: me.courses });
    emitChange();
  } catch (err) {
    // Couldn't save: put the list back so the screen doesn't lie.
    const latest = getStudent();
    if (latest) setStudent({ ...latest, courses: previous });
    emitChange();
    throw err;
  }
  return clean;
}

export function hasCourse(code) {
  return readCodes().includes(code);
}

// Add a course (by code). Resolves to the new list; rejects with a readable
// error if it couldn't be saved.
export function addCourse(code) {
  const current = readCodes();
  if (!code || current.includes(code)) return Promise.resolve(current);
  return writeCodes([...current, code]);
}

// Remove any course - there are no locked ones.
export function removeCourse(code) {
  const current = readCodes();
  if (!current.includes(code)) return Promise.resolve(current);
  return writeCodes(current.filter((c) => c !== code));
}

/* ----------------------------- effective list ----------------------------- */

export function getEffectiveCourses() {
  return readCodes().map((code) => resolveCourse(code));
}

// Every course in the catalog, de-duped and sorted by code. Used by the
// "add a course" picker (callers filter out what's already taken).
export function getAllCatalogCourses() {
  return [...catalogIndex().values()].sort((a, b) => a.code.localeCompare(b.code));
}

// Every catalog course the student isn't already taking - for the "add" picker.
export function getAddableCourses() {
  const taken = new Set(readCodes());
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
let _snapshotKey = null;

function getSnapshot() {
  const courses = getEffectiveCourses();
  const key = courses.map((c) => c.code).join("|");
  if (key !== _snapshotKey) {
    _snapshotKey = key;
    _snapshot = courses;
  }
  return _snapshot;
}

// React hook: returns the live course list and re-renders on change.
export function useEffectiveCourses() {
  return useSyncExternalStore(subscribe, getSnapshot);
}
