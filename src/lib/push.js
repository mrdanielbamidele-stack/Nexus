// src/lib/push.js
// The background (OS-level) notification layer - true Web Push.
//
// What this does:
//   * Registers the service worker (public/sw.js).
//   * Asks for notification permission and subscribes the browser to push.
//   * Stores the subscription + the student's course codes on the server
//     (/api/push) so it can target this device when a paper is added to one
//     of those courses.
//   * Re-syncs the course list to the row whenever the student adds/removes a
//     course (so they only get pushed for what they're actually taking).
//
// IMPORTANT device note (this is why a naive push setup "only works on laptop"):
//   - Desktop Chrome/Edge/Firefox and Android Chrome: push works in the browser.
//   - iPhone / iPad (Safari): web push is ONLY delivered if the site has been
//     installed to the Home Screen ("Add to Home Screen"). In a normal Safari
//     tab, iOS silently refuses to subscribe. We detect and surface that.

import { api } from "./api";
import { normalizeCode } from "./courseSlug";
import { getFollowedCourses } from "./studentCourses";

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY || "";
const COURSES_EVENT = "nexus:courses-changed";

/* ----------------------------- capability ------------------------------- */

export function pushSupported() {
  return (
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window
  );
}

/* --------------------------- install (A2HS) prompt ------------------------ */
// Chrome/Edge (Android + desktop) fire `beforeinstallprompt` when the PWA is
// installable. We stash it so an "Enable" button can trigger the NATIVE
// "Add to Home Screen / Install" dialog on demand. (iOS gives no such event -
// there install is always a manual Share → Add to Home Screen.)
export const INSTALLABLE_EVENT = "nexus:installable";

let _deferredInstall = null;
if (typeof window !== "undefined") {
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    _deferredInstall = e;
    // Let the UI show/refresh an "Install app" button (the event can fire after
    // a component has already mounted).
    window.dispatchEvent(new Event(INSTALLABLE_EVENT));
  });
  window.addEventListener("appinstalled", () => {
    _deferredInstall = null;
    window.dispatchEvent(new Event(INSTALLABLE_EVENT));
  });
}

// True if we can show the native install dialog right now.
export function canInstall() {
  return !!_deferredInstall && !isStandalone();
}

// Show the native install dialog. Returns 'accepted' | 'dismissed' | 'unavailable'.
export async function promptInstall() {
  if (!_deferredInstall) return "unavailable";
  _deferredInstall.prompt();
  try {
    const { outcome } = await _deferredInstall.userChoice;
    return outcome;
  } catch {
    return "dismissed";
  } finally {
    _deferredInstall = null;
  }
}

// iOS only delivers push to an installed PWA (display-mode: standalone).
export function isIos() {
  const ua = navigator.userAgent || "";
  // iPadOS 13+ reports a Mac user-agent, so also treat a touch-capable "Mac"
  // as iOS for the install-required flow.
  const iPadOsMasqueradingAsMac =
    /Macintosh/.test(ua) && typeof navigator.maxTouchPoints === "number" && navigator.maxTouchPoints > 1;
  return /iphone|ipad|ipod/i.test(ua) || iPadOsMasqueradingAsMac;
}
export function isStandalone() {
  return (
    window.matchMedia?.("(display-mode: standalone)").matches ||
    window.navigator.standalone === true
  );
}
// On iOS, push is unavailable until the user installs the app to the Home Screen.
export function iosNeedsInstall() {
  return isIos() && !isStandalone();
}

export function permission() {
  return pushSupported() ? Notification.permission : "unsupported";
}

/* ------------------------------- helpers -------------------------------- */

function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

function takenCodes() {
  return getFollowedCourses().map((c) => normalizeCode(c.code));
}

async function getRegistration() {
  return navigator.serviceWorker.register("/sw.js", { scope: "/" });
}

/* ----------------------------- subscribe -------------------------------- */

/**
 * Turn on background push for this device. Returns { ok, reason }.
 * Reasons: 'unsupported' | 'ios-needs-install' | 'no-vapid' | 'denied' | 'error'
 */
export async function enablePush() {
  if (!pushSupported()) return { ok: false, reason: "unsupported" };
  if (iosNeedsInstall()) return { ok: false, reason: "ios-needs-install" };
  if (!VAPID_PUBLIC_KEY) return { ok: false, reason: "no-vapid" };

  try {
    const reg = await getRegistration();
    await navigator.serviceWorker.ready;

    const perm = await Notification.requestPermission();
    if (perm !== "granted") return { ok: false, reason: "denied" };

    let sub = await reg.pushManager.getSubscription();
    if (!sub) {
      sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      });
    }

    try {
      await saveSubscription(sub);
    } catch (err) {
      // The browser subscribed, but we couldn't persist it. Don't claim
      // success - that hides a broken setup.
      console.error("[push] save failed", err);
      return { ok: false, reason: "save-failed", error: err };
    }
    return { ok: true };
  } catch (err) {
    console.error("[push] enable failed", err);
    return { ok: false, reason: "error", error: err };
  }
}

/** Stop background push on this device and remove its row. */
export async function disablePush() {
  if (!pushSupported()) return;
  try {
    const reg = await navigator.serviceWorker.getRegistration("/");
    const sub = await reg?.pushManager.getSubscription();
    if (sub) {
      const endpoint = sub.endpoint;
      await sub.unsubscribe();
      await api("/push/unsubscribe", { method: "POST", body: { endpoint } });
    }
  } catch (err) {
    console.error("[push] disable failed", err);
  }
}

/** True if this device currently has an active push subscription. */
export async function isPushEnabled() {
  if (!pushSupported() || permission() !== "granted") return false;
  try {
    const reg = await navigator.serviceWorker.getRegistration("/");
    return !!(await reg?.pushManager.getSubscription());
  } catch {
    return false;
  }
}

/* ------------------------------- persistence ---------------------------- */

async function saveSubscription(sub) {
  const json = sub.toJSON();
  await api("/push/subscribe", {
    method: "POST",
    body: { endpoint: sub.endpoint, keys: json.keys, courses: takenCodes() },
  });
}

// Keep the stored course list current so the device is only pushed for courses
// it's still taking. Cheap no-op if push isn't enabled.
async function syncCourses() {
  if (!(await isPushEnabled())) return;
  const reg = await navigator.serviceWorker.getRegistration("/");
  const sub = await reg?.pushManager.getSubscription();
  if (sub) await saveSubscription(sub);
}

/**
 * Call once on app start. Registers the SW (so existing subscriptions keep
 * receiving) and wires up course-list syncing. Does NOT prompt for permission.
 */
export function initPush() {
  if (!pushSupported()) return;
  // Register the SW early so push delivery works even before the user opens
  // Settings. (Registration itself triggers no permission prompt.)
  getRegistration().catch((err) => console.error("[push] sw register failed", err));
  window.addEventListener(COURSES_EVENT, syncCourses);
}
