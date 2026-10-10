import { useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";
import "./Settings.css";
import { api } from "../lib/api";
import { signOut } from "../lib/session";
import { getStudent, setStudent } from "../lib/studentAuth";
import {
  addCourse,
  getAllCatalogCourses,
  removeCourse,
  useEffectiveCourses,
} from "../lib/studentCourses";
import ScrollToTop from '../components/ScrollToTop';
import BackLink from '../components/BackLink';
import AccountSecurity from '../components/AccountSecurity';
import NotificationsCard from '../components/NotificationsCard';
import UiIcon from '../components/UiIcon';
import HeroBanner from '../components/HeroBanner';
import LynklensAd from '../components/LynklensAd';
import { isDemo } from '../lib/demo';

/* ------------------------------- helpers -------------------------------- */

function initialsOf(name) {
  const parts = (name || "").trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "?";
  if (parts.length === 1) return parts[0].slice(0, 1).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function prettyCode(code) {
  return code.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
}

/* ----------------------------- course editor ---------------------------- */

function CourseEditor() {
  const courses = useEffectiveCourses();
  const [query, setQuery] = useState("");
  const [confirming, setConfirming] = useState(null); // code pending removal
  const [error, setError] = useState("");

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

  async function handleAdd(code) {
    setError("");
    setQuery("");
    try {
      await addCourse(code);
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleRemove(code) {
    setError("");
    setConfirming(null);
    try {
      await removeCourse(code);
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <section className="set-card">
      <p className="set-card-sub">
        {courses.length} course{courses.length === 1 ? "" : "s"} ·{" "}
        {totalCredits} credit units
      </p>

      {courses.length === 0 && (
        <p className="set-card-sub">
          You have no courses yet. Search below to add the ones you take.
        </p>
      )}

      <ul className="set-course-list">
        {courses.map((c) => (
          <li key={c.code} className="set-course-row">
            <div className="set-course-main">
              <span className="set-course-code">{prettyCode(c.code)}</span>
              <span className="set-course-title">{c.title}</span>
            </div>

            <div className="set-course-right">
              {confirming === c.code ? (
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
                  <UiIcon name="x" size={15} />
                </button>
              )}
            </div>
          </li>
        ))}
      </ul>

      {error && (
        <p className="set-error" role="alert">
          <UiIcon name="alert" size={14} /> {error}
        </p>
      )}

      {/* Add a course */}
      <div className="set-add">
        <div className="set-add-field">
          <UiIcon name="search" size={17} />
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
                    <UiIcon name="plus" size={16} />
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
        <UiIcon name="info" size={15} />
        <span>
          You can add or remove any course. Past questions and alerts follow
          the courses listed here.
        </span>
      </p>
    </section>
  );
}

/* -------------------------------- page ---------------------------------- */

// Hub of tiles at /settings; each opens /settings?section=<id>.
const SECTIONS = [
  {
    id: "profile",
    title: "Profile",
    icon: "user",
    tone: "violet",
    eyebrow: "A space that works for you",
    desc: "Change your display name and check your registration details.",
    lead: "Your identity across Nexus · A few details make all the difference.",
    sponsor: "Without Lynklens, none of this would be possible - your profile, your papers, all free for you.",
  },
  {
    id: "courses",
    title: "My Courses",
    icon: "book",
    tone: "blue",
    eyebrow: "What you're studying",
    desc: "Add or remove the courses that show up on your dashboard.",
    lead: "Keep your course list in step with your timetable.",
    sponsor: "Every course, every past paper, in your palm - brought to you by Lynklens.",
  },
  {
    id: "notifications",
    title: "Notifications",
    icon: "bell",
    tone: "peach",
    eyebrow: "Stay in the loop",
    desc: "Get alerted when new past questions are added to your courses.",
    lead: "Choose how Nexus reaches you.",
    sponsor: "New materials reach your pocket the moment they land - thanks to Lynklens.",
  },
  {
    id: "account",
    title: "Account",
    icon: "shield",
    tone: "sage",
    eyebrow: "Sign-in & security",
    desc: "Your school email, password and signing out.",
    lead: "Manage how you sign in to Nexus.",
    sponsor: "Study safely. Lynklens checks every link before you click it.",
  },
];

export default function Settings() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const section = SECTIONS.find((s) => s.id === params.get("section")) || null;

  const student = getStudent();
  const courses = useEffectiveCourses();
  const [username, setUsername] = useState(
    () => localStorage.getItem("username") || student?.username || "Guest"
  );
  const [draftName, setDraftName] = useState(username);
  const [saved, setSaved] = useState(false);
  const [nameError, setNameError] = useState("");

  const regNumber = localStorage.getItem("regNumber") || student?.regNumber || "-";

  async function saveName() {
    let v = draftName.trim();
    if (!v) return;
    v = v.charAt(0).toUpperCase() + v.slice(1);
    setNameError("");

    try {
      if (!isDemo) {
        const { me } = await api("/student/profile", { method: "PATCH", body: { username: v } });
        v = me.username;
      }
    } catch (err) {
      setNameError(err.message);
      return;
    }

    localStorage.setItem("username", v);
    const s = getStudent();
    if (s) setStudent({ ...s, username: v });
    setUsername(v);
    setDraftName(v);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  async function logout() {
    if (isDemo) {
      window.alert("This is the demo - you stay signed in as " + username + ".");
      return;
    }
    if (!window.confirm("Log out of this device?")) return;
    await signOut("student");
    navigate("/auth", { replace: true });
  }

  const nameChanged = draftName.trim() && draftName.trim() !== username;
  const totalCredits = courses.reduce((sum, c) => sum + (c.creditHours || 0), 0);

  // One-line summary shown in each tile's footer.
  const meta = {
    profile: `${username} · ${regNumber}`,
    courses: `${courses.length} course${courses.length === 1 ? "" : "s"} · ${totalCredits} credit units`,
    notifications: "Stay in the loop",
    account: "Sign out of this device",
  };

  /* ---- hub ---- */
  if (!section) {
    return (
      <div className="settings-page" key="hub">
        <ScrollToTop />
        <header className="set-hero">
          <div>
            <h1 className="set-title">Settings</h1>
            <p className="set-lead">Manage your profile, courses and preferences.</p>
          </div>
        </header>

        <HeroBanner title="Make Nexus feel like yours.">
          Your name, your courses and your alerts - all in one calm place.
          <br />
          Change anything, any time.
        </HeroBanner>

        <div className="set-grid">
          {SECTIONS.map((s) => (
            <Link
              key={s.id}
              to={`/settings?section=${s.id}`}
              className={`set-tile tone-${s.tone}`}
            >
              <div className="set-tile-top">
                <span className="set-tile-icon"><UiIcon name={s.icon} size={24} /></span>
                <UiIcon name="arrow" size={20} className="set-tile-arrow" />
              </div>
              <h2 className="set-tile-title">{s.title}</h2>
              <p className="set-tile-desc">{s.desc}</p>
              <div className="set-tile-meta">{meta[s.id]}</div>
            </Link>
          ))}
        </div>

        <LynklensAd variant="banner" />
      </div>
    );
  }

  /* ---- section ---- */
  return (
    <div className="settings-page is-section" key={section.id}>
      <ScrollToTop />
      <BackLink to="/settings">All settings</BackLink>

      <header className="set-hero">
        <div>
          <span className="set-eyebrow">{section.eyebrow}</span>
          <h1 className="set-title">{section.title}</h1>
          <p className="set-lead">{section.lead}</p>
        </div>
        <span className={`set-hero-icon tone-${section.tone}`}>
          <UiIcon name={section.icon} size={26} />
        </span>
      </header>

      {section.id === "profile" && (
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
              <UiIcon name="check" size={14} /> Saved
            </p>
          )}
          {nameError && (
            <p className="set-error" role="alert">
              <UiIcon name="alert" size={14} /> {nameError}
            </p>
          )}
        </section>
      )}

      {section.id === "courses" && <CourseEditor />}

      {section.id === "notifications" && <NotificationsCard hideTitle />}

      {section.id === "account" && (
        <AccountSecurity
          role="student"
          email={student?.email || "-"}
          emailChanged={params.get("emailChanged") === "1"}
          onSignOut={logout}
        />
      )}

      <LynklensAd variant="note" message={section.sponsor} />
    </div>
  );
}
