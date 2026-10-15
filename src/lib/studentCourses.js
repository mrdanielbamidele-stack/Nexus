// src/lib/studentCourses.js
// Single source of truth for the courses a student is taking.
//
// There are two lists, both stored on the student's account (so they follow
// them to any device):
//
//   courses         this semester's courses. When they sign up it starts as the
//                   courses of their programme + level; from then on EVERY
//                   course in it can be removed, and any course in the
//                   catalogue can be added.
//   reseatCourses   courses from last semester (betaCatalog.js) they are
//                   sitting again. Empty until they add some in Settings.
//
// Changes apply on screen immediately and are saved to the account in the
// background. Every change dispatches `nexus:courses-changed` so any open
// screen (Dashboard, Past Questions, Settings...) refreshes live. Use
// `useEffectiveCourses()` / `useReseatCourses()` in React to subscribe.

import { useSyncExternalStore } from "react";
import { courseCatalog } from "../data/courseCatalog";
import { betaCatalog } from "../data/betaCatalog";
import { api } from "./api";
import { isDemo } from "./demo";
import { getStudent, setStudent } from "./studentAuth";

const CHANGED_EVENT = "nexus:courses-changed";

const DEFAULT_COURSE_OS = "Computer Science";
const DEFAULT_LEVEL = "100";

/* ------------------------------ catalog index ----------------------------- */

// Flat, de-duped map of code -> course across every programme/level.
function indexOf(catalog) {
  const map = new Map();
  for (const programme of Object.values(catalog)) {
    for (const list of Object.values(programme)) {
      for (const c of list) if (!map.has(c.code)) map.set(c.code, c);
    }
  }
  return map;
}

let _primoIndex = null;
let _betaIndex = null;
const primoIndex = () => (_primoIndex ||= indexOf(courseCatalog));
const betaIndex = () => (_betaIndex ||= indexOf(betaCatalog));

// Resolve a course code to a full course object, even if it isn't in either
// catalog (custom code) - we still want something renderable.
function resolveCourse(code) {
  return primoIndex().get(code) || betaIndex().get(code) || { code, title: "Custom course" };
}

const byCode = (a, b) => a.code.localeCompare(b.code);

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

function readReseatCodes() {
  const student = getStudent();
  if (!Array.isArray(student?.reseatCourses)) return [];
  return student.reseatCourses.filter((code) => typeof code === "string");
}

// Save a list: shown at once, then sent to the account. If the account refuses
// it the previous list is put back so the screen never lies.
//   field  the key on the student record      path  the API route that stores it
async function writeList(field, path, previous, codes) {
  const student = getStudent();

  const clean = [...new Set(codes.filter(Boolean))];
  if (student) setStudent({ ...student, [field]: clean });
  emitChange();

  if (isDemo || !student) return clean;

  try {
    const { me } = await api(path, { method: "PUT", body: { courses: clean } });
    const latest = getStudent();
    if (latest) setStudent({ ...latest, [field]: me[field] });
    emitChange();
  } catch (err) {
    const latest = getStudent();
    if (latest) setStudent({ ...latest, [field]: previous });
    emitChange();
    throw err;
  }
  return clean;
}

const writeCodes = (codes) => writeList("courses", "/student/courses", readCodes(), codes);
const writeReseatCodes = (codes) =>
  writeList("reseatCourses", "/student/reseat-courses", readReseatCodes(), codes);

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

/* ----------------------------- reseat courses ----------------------------- */

export function addReseatCourse(code) {
  const current = readReseatCodes();
  if (!code || current.includes(code)) return Promise.resolve(current);
  return writeReseatCodes([...current, code]);
}

export function removeReseatCourse(code) {
  const current = readReseatCodes();
  if (!current.includes(code)) return Promise.resolve(current);
  return writeReseatCodes(current.filter((c) => c !== code));
}

/* ----------------------------- effective list ----------------------------- */

export function getEffectiveCourses() {
  return readCodes().map((code) => resolveCourse(code));
}

export function getReseatCourses() {
  return readReseatCodes().map((code) => resolveCourse(code));
}

// Every course the student follows this semester or is reseating - what the
// notification bell and background alerts are matched against.
export function getFollowedCourses() {
  return [...getEffectiveCourses(), ...getReseatCourses()];
}

// This semester's catalog, de-duped and sorted by code. Used by the "add a
// course" picker (callers filter out what's already taken).
export function getPrimoCatalogCourses() {
  return [...primoIndex().values()].sort(byCode);
}

// Last semester's catalog, sorted by code. Used by the "add a reseat course"
// picker.
export function getBetaCatalogCourses() {
  return [...betaIndex().values()].sort(byCode);
}

// Every course Nexus knows, from either semester, de-duped and sorted by code.
// Used wherever any course may be named (the upload page, the demo).
export function getAllCatalogCourses() {
  const all = new Map(betaIndex());
  for (const [code, course] of primoIndex()) all.set(code, course);
  return [...all.values()].sort(byCode);
}

// Every catalog course the student isn't already taking - for the "add" picker.
export function getAddableCourses() {
  const taken = new Set(readCodes());
  return getPrimoCatalogCourses().filter((c) => !taken.has(c.code));
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

// useSyncExternalStore needs a stable reference between renders, so each list
// keeps its last snapshot and only swaps it when the underlying codes change.
function snapshotOf(read) {
  let key = null;
  let snapshot = null;
  return () => {
    const courses = read();
    const next = courses.map((c) => c.code).join("|");
    if (next !== key) {
      key = next;
      snapshot = courses;
    }
    return snapshot;
  };
}

const getSnapshot = snapshotOf(getEffectiveCourses);
const getReseatSnapshot = snapshotOf(getReseatCourses);

// React hook: returns the live course list and re-renders on change.
export function useEffectiveCourses() {
  return useSyncExternalStore(subscribe, getSnapshot);
}

// React hook: the live reseat list.
export function useReseatCourses() {
  return useSyncExternalStore(subscribe, getReseatSnapshot);
}
