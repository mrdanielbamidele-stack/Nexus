// src/lib/notifications.js
// The universal, works-on-every-device notification layer.
//
// Notifications live in the `public.notifications` table (one row per "new
// material" event, course-scoped). This module:
//   1. Loads recent notifications and keeps them in sync via Supabase Realtime.
//   2. Filters them down to the courses the *current* student is taking
//      (their list lives in localStorage, see studentCourses.js).
//   3. Tracks an "last seen" timestamp per device so we can show an unread
//      badge - no server-side per-student state needed.
//
// Use the `useNotifications()` hook in React. It re-renders on new rows, on
// course-list changes, and across tabs.

import { useSyncExternalStore, useCallback } from "react";
import { supabasePublic as supabase } from "./supabase";
import { normalizeCode } from "./courseSlug";
import { getEffectiveCourses } from "./studentCourses";

const SEEN_KEY = "nexus_notifs_seen_at"; // ISO timestamp the panel was last opened
const DISMISS_KEY = "nexus_notifs_dismissed"; // ids the user deleted on this device
const CHANGED_EVENT = "nexus:notifs-changed";
const COURSES_EVENT = "nexus:courses-changed";
const MAX_ROWS = 100;

let _all = []; // raw rows from the DB (newest first), unfiltered by course
let _loaded = false;
let _channel = null;
const _listeners = new Set();

/* ------------------------------- course set ------------------------------- */

// Normalized set of the codes the student is currently taking.
function takenCodeSet() {
  return new Set(getEffectiveCourses().map((c) => normalizeCode(c.code)));
}

/* --------------------------------- loading -------------------------------- */

async function load() {
  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(MAX_ROWS);
  if (!error) {
    _all = data || [];
    _loaded = true;
    bump();
  }
}

function ensureStarted() {
  if (_channel) return;
  load();
  _channel = supabase
    .channel("notifications-feed")
    .on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "notifications" },
      (payload) => {
        // Prepend the new row (dedupe by id) and trim.
        _all = [payload.new, ..._all.filter((n) => n.id !== payload.new.id)].slice(
          0,
          MAX_ROWS
        );
        bump();
      }
    )
    .subscribe();
}

/* --------------------------- seen / dismissed ----------------------------- */

export function getSeenAt() {
  return localStorage.getItem(SEEN_KEY) || "1970-01-01T00:00:00.000Z";
}

// Called when the panel opens: clears the unread badge.
export function markSeen() {
  localStorage.setItem(SEEN_KEY, new Date().toISOString());
  bump();
}

function readDismissed() {
  try {
    const raw = JSON.parse(localStorage.getItem(DISMISS_KEY));
    return new Set(Array.isArray(raw) ? raw : []);
  } catch {
    return new Set();
  }
}

function writeDismissed(set) {
  // Keep the list bounded so it can't grow forever.
  const arr = [...set].slice(-500);
  localStorage.setItem(DISMISS_KEY, JSON.stringify(arr));
  bump();
}

// Hide a single notification on this device (the DB rows are shared across all
// students, so "delete" is a local hide, not a server delete).
export function dismiss(id) {
  const set = readDismissed();
  set.add(id);
  writeDismissed(set);
}

// Hide every notification currently visible to this student.
export function dismissAll() {
  const set = readDismissed();
  for (const n of visibleItems()) set.add(n.id);
  writeDismissed(set);
}

/* -------------------------------- snapshot -------------------------------- */

// Course-filtered, not-dismissed rows (newest first).
function visibleItems() {
  const taken = takenCodeSet();
  const dismissed = readDismissed();
  return _all.filter(
    (n) => taken.has(normalizeCode(n.course_id)) && !dismissed.has(n.id)
  );
}

let _snap = { items: [], unreadCount: 0, loaded: false, seenAt: "" };
let _snapKey = "";

function computeSnapshot() {
  const items = visibleItems();
  const seenAt = getSeenAt();
  const unreadCount = items.filter((n) => n.created_at > seenAt).length;

  const key = `${_loaded}|${seenAt}|` + items.map((n) => n.id).join(",");
  if (key !== _snapKey) {
    _snapKey = key;
    _snap = { items, unreadCount, loaded: _loaded, seenAt };
  }
  return _snap;
}

/* ------------------------------ subscription ------------------------------ */

function bump() {
  window.dispatchEvent(new Event(CHANGED_EVENT));
}

function subscribe(cb) {
  ensureStarted();
  _listeners.add(cb);
  window.addEventListener(CHANGED_EVENT, cb);
  window.addEventListener(COURSES_EVENT, cb); // re-filter when courses change
  window.addEventListener("storage", cb); // sync seen-at across tabs
  return () => {
    _listeners.delete(cb);
    window.removeEventListener(CHANGED_EVENT, cb);
    window.removeEventListener(COURSES_EVENT, cb);
    window.removeEventListener("storage", cb);
  };
}

/**
 * React hook: live notification feed for the current student.
 * @returns {{ items: object[], unreadCount: number, loaded: boolean,
 *   seenAt: string, markSeen: () => void, dismiss: (id: string) => void,
 *   dismissAll: () => void }}
 */
export function useNotifications() {
  const snap = useSyncExternalStore(subscribe, computeSnapshot, computeSnapshot);
  return {
    ...snap,
    markSeen: useCallback(() => markSeen(), []),
    dismiss: useCallback((id) => dismiss(id), []),
    dismissAll: useCallback(() => dismissAll(), []),
  };
}
