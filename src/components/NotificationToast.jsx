// src/components/NotificationToast.jsx
// A styled (non-native) prompt that nudges students to turn on alerts whenever
// notifications are OFF. It reappears on later visits (snoozed for a day when
// dismissed, so it's persistent but not annoying). The "Enable" button does the
// whole job: on Android/desktop it triggers the native install dialog first
// (for reliable background delivery), then asks for notification permission.
// On iOS it shows the manual "Add to Home Screen" steps, since Apple gives no
// programmatic install.

import { useEffect, useState } from "react";
import {
  pushSupported,
  isPushEnabled,
  enablePush,
  iosNeedsInstall,
  canInstall,
  promptInstall,
} from "../lib/push";
import "./NotificationToast.css";

const SNOOZE_KEY = "nexus_push_snooze_until";
const SNOOZE_MS = 24 * 60 * 60 * 1000; // come back after a day if dismissed

export default function NotificationToast() {
  const [show, setShow] = useState(false);
  const [mode, setMode] = useState("prompt"); // 'prompt' | 'ios' | 'blocked'
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      const snoozeUntil = Number(localStorage.getItem(SNOOZE_KEY) || 0);
      if (Date.now() < snoozeUntil) return;

      const ios = iosNeedsInstall();
      if (!ios && !pushSupported()) return; // device truly can't do push

      const enabled = await isPushEnabled();
      if (!alive || enabled) return; // already on -> nothing to nag about

      setMode(ios ? "ios" : "prompt");
      setTimeout(() => alive && setShow(true), 700); // slide in after load
    })();
    return () => {
      alive = false;
    };
  }, []);

  function snooze() {
    localStorage.setItem(SNOOZE_KEY, String(Date.now() + SNOOZE_MS));
    setShow(false);
  }

  async function enable() {
    setBusy(true);
    // Offer the native "Install / Add to Home Screen" first where available -
    // an installed app gets far more reliable background notifications.
    if (canInstall()) {
      await promptInstall();
    }
    const res = await enablePush();
    setBusy(false);

    if (res.ok) {
      setShow(false);
      return;
    }
    if (res.reason === "ios-needs-install") setMode("ios");
    else if (res.reason === "denied") setMode("blocked");
    // other reasons: leave the prompt up so they can retry
  }

  if (!show) return null;

  return (
    <div className="nx-toast" role="dialog" aria-live="polite">
      <button className="nx-toast-close" onClick={snooze} aria-label="Dismiss">
        <i className="fa-solid fa-xmark" />
      </button>

      <div className="nx-toast-icon">
        <i className="fa-solid fa-bell" />
      </div>

      {mode === "prompt" && (
        <>
          <div className="nx-toast-text">
            <strong>Turn on notifications</strong>
            <span>
              Get alerted the instant new materials are added to your courses -
              even when Nexus is closed.
            </span>
          </div>
          <div className="nx-toast-actions">
            <button className="nx-toast-btn" onClick={enable} disabled={busy}>
              {busy ? "Enabling…" : "Enable"}
            </button>
            <button className="nx-toast-later" onClick={snooze}>
              Not now
            </button>
          </div>
        </>
      )}

      {mode === "ios" && (
        <>
          <div className="nx-toast-text">
            <strong>Add Nexus to your Home Screen</strong>
            <span>
              On iPhone/iPad, tap the{" "}
              <i className="fa-solid fa-arrow-up-from-bracket" /> <b>Share</b>{" "}
              button below, choose <b>Add to Home Screen</b>, then open Nexus from
              your Home Screen to turn on alerts.
            </span>
          </div>
          <div className="nx-toast-actions">
            <button className="nx-toast-btn" onClick={snooze}>
              Got it
            </button>
          </div>
        </>
      )}

      {mode === "blocked" && (
        <>
          <div className="nx-toast-text">
            <strong>Notifications are blocked</strong>
            <span>
              Tap the lock/settings icon next to the web address, set{" "}
              <b>Notifications</b> to <b>Allow</b>, then tap Enable again.
            </span>
          </div>
          <div className="nx-toast-actions">
            <button className="nx-toast-btn" onClick={enable} disabled={busy}>
              Try again
            </button>
            <button className="nx-toast-later" onClick={snooze}>
              Later
            </button>
          </div>
        </>
      )}
    </div>
  );
}
