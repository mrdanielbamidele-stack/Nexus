import { useMemo, useState } from "react";
import { useNavigate } from "react-router";
import "./Settings.css";
import { clearStudent, getStudent, setStudent } from "../lib/studentAuth";
import {
  addCourse,
  getAllCatalogCourses,
  removeCourse,
  useEffectiveCourses,
} from "../lib/studentCourses";
import ScrollToTop from '../components/ScrollToTop';
import NotificationsCard from '../components/NotificationsCard';

/* ------------------------------- helpers -------------------------------- */

function initialsOf(name) {
  const parts = (name || "").trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "?";
  if (parts.length === 1) return parts[0].slice(0, 1).toUpperCase();
  return (parts[2]).toUpperCase();
}

function prettyCode(code) {
  return code.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
}

/* ----------------------------- course editor ---------------------------- */

function CourseEditor() {
  const courses = useEffectiveCourses();
  const [query, setQuery] = useState("");
  const [confirming, setConfirming] = useState(null); // code pending removal

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    const taken = new Set(courses.map((c) => c.code));
    return getAllCatalogCourses()
      .filter((c) => !taken.has(c.code))
      .filter(
        (c) =>
          c.code.toLowerCase().includes(q) || c.title.toLowerCase().includes(q)
      )
      .slice(0, 8);
  }, [query, courses]);

  const totalCredits = courses.reduce((sum, c) => sum + (c.creditHours || 0), 0);
  const addedCount = courses.filter((c) => c.added).length;

  function handleAdd(code) {
    addCourse(code);
    setQuery("");
  }

  function handleRemove(code) {
    removeCourse(code);
    setConfirming(null);
  }

  return (
    <section className="set-card">
      <div className="set-card-head">
        <div>
          <h2 className="set-card-title">
            My Courses
          </h2>
          <p className="set-card-sub">
            {courses.length} course{courses.length === 1 ? "" : "s"} ·{" "}
            {totalCredits} credit units · {addedCount} added by you
          </p>
        </div>
      </div>

      <ul className="set-course-list">
        {courses.map((c) => (
          <li key={c.code} className={`set-course-row ${c.added ? "is-added" : ""}`}>
            <div className="set-course-main">
              <span className="set-course-code">{prettyCode(c.code)}</span>
              <span className="set-course-title">{c.title}</span>
            </div>

            <div className="set-course-right">
             

              {c.added ? (
                confirming === c.code ? (
                  <span className="set-confirm">
                    <button
                      type="button"
                      className="set-confirm-yes"
                      onClick={() => handleRemove(c.code)}
                    >
                      Remove
                    </button>
                    <button
                      type="button"
                      className="set-confirm-no"
                      onClick={() => setConfirming(null)}
                    >
                      Cancel
                    </button>
                  </span>
                ) : (
                  <button
                    type="button"
                    className="set-course-remove"
                    aria-label={`Remove ${prettyCode(c.code)}`}
                    title="Remove this course"
                    onClick={() => setConfirming(c.code)}
                  >
                    <i className="fa-solid fa-xmark" />
                  </button>
                )
              ) : (
                <span className="set-course-lock" title="Core programme course - can't be removed">
                  <i className="fa-solid fa-lock" /> 
                </span>
              )}
            </div>
          </li>
        ))}
      </ul>

      {/* Add a course */}
      <div className="set-add">
        <div className="set-add-field">
          <i className="fa-solid fa-magnifying-glass" />
          <input
            type="text"
            placeholder="Add a course - search by code or title…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoComplete="off"
          />
        </div>

        {query.trim() && (
          <ul className="set-add-results">
            {matches.length ? (
              matches.map((c) => (
                <li key={c.code}>
                  <button type="button" onClick={() => handleAdd(c.code)}>
                    <span className="set-add-code">{prettyCode(c.code)}</span>
                    <span className="set-add-title">{c.title}</span>
                    <i className="fa-solid fa-plus" />
                  </button>
                </li>
              ))
            ) : (
              <li className="set-add-empty">No matching courses</li>
            )}
          </ul>
        )}
      </div>

      <p className="set-note">
        <i className="fa-solid fa-circle-info" /> Your core programme courses are
        fixed and can&rsquo;t be removed. Any course you add yourself can be
        removed 
      </p>
    </section>
  );
}

/* -------------------------------- page ---------------------------------- */

export default function Settings() {
  const navigate = useNavigate();

  const student = getStudent();
  const [username, setUsername] = useState(
    () => localStorage.getItem("username") || student?.username || "Guest"
  );
  const [draftName, setDraftName] = useState(username);
  const [saved, setSaved] = useState(false);

  
  const regNumber = localStorage.getItem("regNumber") || student?.regNumber || "-";

  function saveName() {
    let v = draftName.trim();
    if (!v) return;
    v = v.charAt(0).toUpperCase() + v.slice(1);
    localStorage.setItem("username", v);
    const s = getStudent();
    if (s) setStudent({ ...s, username: v });
    setUsername(v);
    setDraftName(v);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  function logout() {
    if (!window.confirm("Log out of this device?")) return;
    clearStudent();
    localStorage.removeItem("isLoggedIn");
    navigate("/auth", { replace: true });
  }

  const nameChanged = draftName.trim() && draftName.trim() !== username;

  return (
    <div className="settings-page">
       <ScrollToTop />
      <div className="set-header-banner">
        <h1 className="set-heading">
           Settings
        </h1>
        <p className="set-heading-sub">
          Manage your profile, courses and preferences.
        </p>
      </div>

      {/* Profile */}
      <section className="set-card">
        <div className="set-profile">
          <div className="set-avatar">{initialsOf(username)}</div>
          <div className="set-profile-meta">
            <h2 className="set-profile-name">{username}</h2>
            <p className="set-profile-reg">Reg No. {regNumber}</p>
          </div>
        </div>

        <label className="set-label" htmlFor="set-name">
          Username
        </label>
        <div className="set-name-row">
          <input
            id="set-name"
            className="set-input"
            placeholder="Enter your display name"
            value={draftName}
            onChange={(e) => setDraftName(e.target.value)}
          />
          <button
            type="button"
            className="set-btn-primary"
            disabled={!nameChanged}
            onClick={saveName}
          >
            Save
          </button>
        </div>
        {saved && (
          <p className="set-saved">
            <i className="fa-solid fa-check" /> Saved
          </p>
        )}
      </section>

      {/* Academic */}
      

      {/* Courses */}
      <CourseEditor />

      {/* Notifications */}
      <NotificationsCard />

      {/* Account */}
      <section className="set-card">
        <h2 className="set-card-title">
           Account
        </h2>
        <p className="set-card-sub">Sign out of Nexus on this device.</p>
        <button type="button" className="set-btn-danger" onClick={logout}>
          <i className="fa-solid fa-right-from-bracket" /> Log out
        </button>
      </section>
    </div>
  );
}
