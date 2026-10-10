// src/components/NotificationsCard.jsx
// Settings card to turn background (OS) push on/off for THIS device, with a
// clear iOS explainer - because on iPhone, push only works after the site is
// installed to the Home Screen. This is the piece that makes notifications
// reach phones, not just laptops.

import { useEffect, useState } from "react";
import UiIcon from "./UiIcon";
import {
  pushSupported,
  isPushEnabled,
  enablePush,
  disablePush,
  iosNeedsInstall,
  isIos,
  canInstall,
  promptInstall,
  INSTALLABLE_EVENT,
} from "../lib/push";

// `hideTitle` drops the heading when the page already shows one (Settings
// section view); the explainer line stays.
export default function NotificationsCard({ hideTitle = false }) {
  const [enabled, setEnabled] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null); // { type: 'ok'|'warn'|'err', text }
  const [installable, setInstallable] = useState(canInstall());

  const supported = pushSupported();
  const needsInstall = iosNeedsInstall();

  useEffect(() => {
    isPushEnabled().then(setEnabled);
    // The install prompt may arrive after mount; keep the button in sync.
    const sync = () => setInstallable(canInstall());
    window.addEventListener(INSTALLABLE_EVENT, sync);
    return () => window.removeEventListener(INSTALLABLE_EVENT, sync);
  }, []);

  async function installApp() {
    const outcome = await promptInstall();
    setInstallable(canInstall());
    if (outcome === "accepted") {
      setMsg({ type: "ok", text: "Nexus installed. Open it from your home screen / apps." });
    }
  }

  async function turnOn() {
    setBusy(true);
    setMsg(null);
    const res = await enablePush();
    setBusy(false);
    if (res.ok) {
      setEnabled(true);
      setMsg({ type: "ok", text: "Background notifications are on for this device." });
      return;
    }
    const text = {
      "ios-needs-install":
        "On iPhone/iPad, first tap Share → Add to Home Screen, open Nexus from there, then enable.",
      denied:
        "Notifications are blocked for this site. Tap the lock/settings icon next to the web address, set Notifications to Allow, then tap Enable again. (On a phone, it's in the browser's site settings.)",
      "no-vapid": "Push isn't configured yet (missing VAPID key). Contact the admin.",
      "save-failed":
        "Couldn't register this device (server rejected it). Please try again later.",
      unsupported: "This browser doesn't support background notifications.",
      error: "Couldn't enable notifications. Please try again.",
    }[res.reason];
    setMsg({
      type: res.reason === "denied" || res.reason === "save-failed" ? "err" : "warn",
      text,
    });
  }

  async function turnOff() {
    setBusy(true);
    await disablePush();
    setEnabled(false);
    setBusy(false);
    setMsg({ type: "ok", text: "Background notifications turned off for this device." });
  }

  return (
    <section className="set-card">
      {!hideTitle && (
        <h2 className="set-card-title">
          <UiIcon name="bell" size={18} /> Notifications
        </h2>
      )}
      <p className="set-card-sub">
        Get alerted the moment new past questions are added to your courses.
        The in-app bell always works; turn on background alerts to be notified
        even when Nexus is closed.
      </p>

      {/* One-tap install (Android/desktop Chrome/Edge). Triggers the native
          "Add to Home Screen / Install" dialog directly - no manual steps. */}
      {installable && (
        <button
          type="button"
          className="set-btn-primary"
          onClick={installApp}
          style={{ marginBottom: 10 }}
        >
          <UiIcon name="download" size={17} /> Add Nexus to home screen
        </button>
      )}

      {/* On iOS the push APIs don't exist until the app is installed, so the
          install guide must come BEFORE the generic "unsupported" message. */}
      {needsInstall ? (
        <div
          style={{
            background: "#f5f3ff",
            border: "1px solid #ddd6fe",
            borderRadius: 10,
            padding: "12px 14px",
            fontSize: 13.5,
            color: "#4c1d95",
            lineHeight: 1.5,
          }}
        >
          <strong>One step on iPhone/iPad:</strong> Apple only delivers push to
          installed apps. In Safari, tap the{" "}
          <UiIcon name="download" size={14} /> <strong>Share</strong>{" "}
          button, scroll down and choose <strong>Add to Home Screen</strong>, then
          open <strong>Nexus</strong> from your Home Screen and come back to this
          page to turn alerts on.
        </div>
      ) : !supported ? (
        <p className="set-saved" style={{ color: "#b45309" }}>
          <UiIcon name="info" size={15} /> This browser can't show
          background notifications - you'll still see the in-app bell.
        </p>
      ) : (
        <>
        <button
          type="button"
          className={enabled ? "set-btn-danger" : "set-btn-primary"}
          onClick={enabled ? turnOff : turnOn}
          disabled={busy}
          style={{ margin: 10 }}
          >
          {busy ? (
            <>
              <UiIcon name="loader" size={16} spin /> Working…
            </>
          ) : enabled ? (
            <>
              <UiIcon name="bell" size={16} /> Turn off background alerts
            </>
          ) : (
            <>
               Enable background alerts
            </>
          )}
        </button>
          </>
      )}

      {msg && (
        <p
          className="set-saved"
          style={{
            color:
              msg.type === "ok" ? "#065f46" : msg.type === "err" ? "#b91c1c" : "#b45309",
          }}
        >
          <UiIcon name={msg.type === "ok" ? "check" : "info"} size={14} />{" "}
          {msg.text}
        </p>
      )}

      {supported && !needsInstall && isIos() && (
        <p className="set-card-sub" style={{ marginTop: 8, fontSize: 12 }}>
          Tip: keep Nexus on your Home Screen so iOS keeps delivering alerts.
        </p>
      )}
    </section>
  );
}
