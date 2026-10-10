// src/components/NotificationBell.jsx
// The bell + unread badge + dropdown panel. This is the universal layer: it
// works on every device that can open the site (iPhone Safari included), with
// no permissions and no PWA install. Background OS push (see lib/push.js) is a
// bonus on top for when the site is closed.

import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router";
import { useNotifications } from "../lib/notifications";
import { codeToSlug, formatCode } from "../lib/courseSlug";
import { NotificationRowsSkeleton } from "./Skeleton";
import "./NotificationBell.css";

function timeAgo(iso) {
  const secs = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
  if (secs < 60) return "just now";
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString();
}

export default function NotificationBell() {
  const { items, loaded, unreadCount, seenAt, markSeen, dismiss, dismissAll } =
    useNotifications();
  const [open, setOpen] = useState(false);
  // Frozen "last seen" captured the moment the panel opens, so items that are
  // new since the previous open stay highlighted while the user looks at them.
  const [openedAt, setOpenedAt] = useState("");
  const ref = useRef(null);
  const navigate = useNavigate();

  // Close on outside click / Escape.
  useEffect(() => {
    if (!open) return;
    const onDown = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  function toggle() {
    const next = !open;
    if (next) {
      setOpenedAt(seenAt); // remember what counted as "new" before this open
      if (unreadCount > 0) markSeen(); // clear the badge
    }
    setOpen(next);
  }

  function openCourse(n) {
    setOpen(false);
    navigate(`/${codeToSlug(n.course_id)}`);
  }

  function removeOne(e, id) {
    e.stopPropagation();
    dismiss(id);
  }

  return (
    <div className="nx-bell" ref={ref}>
      <button
        className="nx-bell-btn"
        onClick={toggle}
        aria-label={`Notifications${unreadCount ? `, ${unreadCount} unread` : ""}`}
      >
        <i className="fa-regular fa-bell" />
        {unreadCount > 0 && (
          <span className="nx-bell-badge">{unreadCount > 9 ? "9+" : unreadCount}</span>
        )}
      </button>

      {open && (
        <div className="nx-bell-panel" role="menu">
          <div className="nx-bell-head">
            <span>Notifications</span>
            {items.length > 0 && (
              <button className="nx-bell-clear" onClick={dismissAll}>
                Delete all
              </button>
            )}
          </div>

          <div className="nx-bell-list">
            {!loaded && items.length === 0 ? (
              <NotificationRowsSkeleton />
            ) : items.length === 0 ? (
              <div className="nx-bell-empty">
                <i className="fa-regular fa-bell-slash" />
                <p>No notifications yet.</p>
                <span>You'll be alerted here when new materials are added to your courses.</span>
              </div>
            ) : (
              items.map((n) => {
                const isNew = n.created_at > openedAt;
                return (
                  <div
                    key={n.id}
                    className={`nx-bell-item ${isNew ? "is-new" : ""}`}
                    onClick={() => openCourse(n)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => e.key === "Enter" && openCourse(n)}
                  >
                    {isNew && <span className="nx-bell-newdot" aria-label="new" />}
                    <span className="nx-bell-dot mat">
                      <i className="fa-solid fa-file-arrow-up" />
                    </span>
                    <span className="nx-bell-body">
                      <span className="nx-bell-title">{formatCode(n.course_id)}</span>
                      <span className="nx-bell-text">{n.body}</span>
                      <span className="nx-bell-time">{timeAgo(n.created_at)}</span>
                    </span>
                    <button
                      className="nx-bell-x"
                      onClick={(e) => removeOne(e, n.id)}
                      aria-label="Delete notification"
                    >
                      <i className="fa-solid fa-xmark" />
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
