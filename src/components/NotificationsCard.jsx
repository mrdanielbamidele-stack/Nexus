// src/components/NotificationsCard.jsx
// The Notifications section of Settings.
//
//   In-app alerts      the bell - works on every device, nothing to set up
//   Background alerts  real OS notifications (Web Push) for THIS device
//   Install Nexus      the native "add to home screen" prompt, when available
//
// iPhone/iPad only deliver push to a site that has been added to the Home
// Screen, so there the switch is replaced by the steps to do that - this is
// the piece that makes notifications reach phones, not just laptops.

import { useEffect, useState } from "react";
import UiIcon from "./UiIcon";
import { SetRow, SetSection } from "./SetSection";
import {
  pushSupported,
  isPushEnabled,
  enablePush,
  disablePush,
  iosNeedsInstall,
  canInstall,
  promptInstall,
  INSTALLABLE_EVENT,
} from "../lib/push";

const FAILURES = {
  "ios-needs-install":
    "On iPhone/iPad, first tap Share → Add to Home Screen, open Nexus from there, then switch this on.",
  denied:
    "Notifications are blocked for this site. Tap the lock icon next to the web address, set Notifications to Allow, then switch this on again. (On a phone, it's in the browser's site settings.)",
  "no-vapid": "Background alerts aren't switched on for Nexus yet. Please tell us through Contact.",
  "save-failed": "We couldn't register this device just now. Please try again in a moment.",
  unsupported: "This browser can't show background notifications. You'll still see the in-app bell.",
  error: "We couldn't turn alerts on. Please try again.",
};

export default function NotificationsCard() {
  const [enabled, setEnabled] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null); // { type: 'ok' | 'warn' | 'err', text }
  const [installable, setInstallable] = useState(canInstall());

  const supported = pushSupported();
  const needsInstall = iosNeedsInstall();
  const canToggle = supported && !needsInstall;

  useEffect(() => {
    isPushEnabled().then(setEnabled);
    // The install prompt may arrive after mount; keep the button in sync.
    const sync = () => setInstallable(canInstall());
    window.addEventListener(INSTALLABLE_EVENT, sync);
    return () => window.removeEventListener(INSTALLABLE_EVENT, sync);
  }, []);

  async function install() {
    const outcome = await promptInstall();
    setInstallable(canInstall());
    if (outcome === "accepted") {
      setMsg({ type: "ok", text: "Nexus installed. Open it from your home screen or apps." });
    }
  }

  async function turnOn() {
    setBusy(true);
    setMsg(null);
    const res = await enablePush();
    setBusy(false);
    if (res.ok) {
      setEnabled(true);
      setMsg({ type: "ok", text: "Background alerts are on for this device." });
      return;
    }
    setMsg({
      type: res.reason === "denied" || res.reason === "save-failed" ? "err" : "warn",
      text: FAILURES[res.reason] || FAILURES.error,
    });
  }

  async function turnOff() {
    setBusy(true);
    await disablePush();
    setEnabled(false);
    setBusy(false);
    setMsg({ type: "ok", text: "Background alerts are off for this device." });
  }

  const description = needsInstall
    ? "Needs Nexus on your home screen first - see the steps below."
    : !supported
      ? "This browser can't show alerts while Nexus is closed."
      : enabled
        ? "On for this device. You'll be notified even when Nexus is closed."
        : "Get a notification on this device even when Nexus is closed.";

  return (
    <>
      <SetSection title="Alerts" sub="How you hear about new past questions for the courses you take.">
        <SetRow
          title="In-app alerts"
          desc="The bell in the top corner lights up when a paper is added to one of your courses."
          action={<span className="set-badge">Always on</span>}
        />

        <SetRow
          title="Background alerts"
          desc={description}
          action={canToggle ? (
            <button
              type="button"
              role="switch"
              aria-checked={enabled}
              aria-label="Background alerts"
              className="set-switch"
              disabled={busy}
              onClick={enabled ? turnOff : turnOn}
            />
          ) : (
            <span className="set-badge is-off">{needsInstall ? "Install first" : "Not available"}</span>
          )}
        />

        {installable && (
          <SetRow
            title="Install Nexus"
            desc="Add Nexus to your home screen or desktop to open it in one tap."
            action={(
              <button type="button" className="set-btn-ghost set-btn-sm" onClick={install}>
                Install
              </button>
            )}
          />
        )}

        {msg && (
          <div className="set-body">
            <p
              className={`set-status is-${msg.type === "ok" ? "ok" : msg.type === "err" ? "err" : "warn"}`}
              role="status"
              style={{ margin: 0 }}
            >
              <UiIcon name={msg.type === "ok" ? "check" : "alert"} size={14} />
              <span>{msg.text}</span>
            </p>
          </div>
        )}
      </SetSection>

      {needsInstall && (
        <SetSection title="One step on iPhone & iPad" sub="Apple only delivers notifications to apps on the Home Screen.">
          <div className="set-body">
            <ol className="set-steps">
              <li>In Safari, tap the <strong>Share</strong> button.</li>
              <li>Choose <strong>Add to Home Screen</strong>.</li>
              <li>Open <strong>Nexus</strong> from your Home Screen, come back to this page and switch background alerts on.</li>
            </ol>
          </div>
        </SetSection>
      )}
    </>
  );
}
