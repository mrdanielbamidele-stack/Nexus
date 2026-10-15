import { useMemo, useRef, useState, useEffect } from "react";
import { Link, useNavigate } from "react-router";
import "./Settings.css";
import { api } from "../lib/api";
import { signOut } from "../lib/session";
import { applyServerStudent, getStudent, setStudent } from "../lib/studentAuth";
import {
  addCourse,
  addReseatCourse,
  getBetaCatalogCourses,
  getPrimoCatalogCourses,
  removeCourse,
  removeReseatCourse,
  useEffectiveCourses,
  useReseatCourses,
} from "../lib/studentCourses";
import { courseCatalog } from "../data/courseCatalog";
import AccountSecurity from "../components/AccountSecurity";
import NotificationsCard from "../components/NotificationsCard";
import SettingsHub from "../components/SettingsHub";
import UiIcon from "../components/UiIcon";
import CourseCombobox from "../components/CourseCombobox";
import { SetRow, SetSection } from "../components/SetSection";
import HeroBanner from "../components/HeroBanner";
import { isDemo } from "../lib/demo";

/* ------------------------------- helpers -------------------------------- */

function initialsOf(name) {
  const parts = (name || "").trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "?";
  if (parts.length === 1) return parts[0].slice(0, 1).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

const programmes = Object.keys(courseCatalog);
const levelsOf = (programme) => Object.keys(courseCatalog[programme] || {});
const levelLabel = (level) => (/^\d+$/.test(level) ? `${level} level` : level);

const Status = ({ type, children }) =>
  children ? (
    <p className={`set-status is-${type}`} role={type === "err" ? "alert" : "status"}>
      <UiIcon name={type === "ok" ? "check" : "alert"} size={14} />
      <span>{children}</span>
    </p>
  ) : null;

/* -------------------------------- profile -------------------------------- */

function ProfileSection({ student }) {
  const [username, setUsername] = useState(
    () => localStorage.getItem("username") || student?.username || "Guest"
  );
  const [draftName, setDraftName] = useState(username);
  const [nameState, setNameState] = useState({ type: "", text: "" });
  const [savingName, setSavingName] = useState(false);

  const nameChanged = draftName.trim() && draftName.trim() !== username;
  const regNumber = localStorage.getItem("regNumber") || student?.regNumber || "-";

  async function saveName() {
    let value = draftName.trim();
    if (!value) return;
    value = value.charAt(0).toUpperCase() + value.slice(1);
    setNameState({ type: "", text: "" });
    setSavingName(true);

    try {
      if (!isDemo) {
        const { me } = await api("/student/profile", { method: "PATCH", body: { username: value } });
        value = me.username;
      }
      localStorage.setItem("username", value);
      const current = getStudent();
      if (current) setStudent({ ...current, username: value });
      setUsername(value);
      setDraftName(value);
      setNameState({ type: "ok", text: "Saved." });
    } catch (err) {
      setNameState({ type: "err", text: err.message });
    } finally {
      setSavingName(false);
    }
  }

  return (
    <>
      <SetSection title="Display name" sub="This is how your name appears across Nexus.">
        <div className="set-row set-who">
          <div className="set-avatar">{initialsOf(username)}</div>
          <div className="set-profile-meta">
            <p className="set-profile-name">{username}</p>
            <p className="set-profile-reg">{student?.email || `Reg No. ${regNumber}`}</p>
          </div>
        </div>

        <div className="set-body">
          <label className="set-label" htmlFor="set-name">Username</label>
          <input
            id="set-name"
            className="set-input"
            placeholder="Enter your display name"
            value={draftName}
            maxLength={30}
            onChange={(e) => setDraftName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && nameChanged && saveName()}
          />
          <Status type={nameState.type}>{nameState.text}</Status>
        </div>

        <div className="set-foot">
          <button
            type="button"
            className="set-btn-primary"
            disabled={!nameChanged || savingName}
            onClick={saveName}
          >
            {savingName ? "Saving…" : "Save"}
          </button>
        </div>
      </SetSection>

      <StudySection student={student} />

      <SetSection title="Account details" sub="Your sign-in identity. These can't be edited here.">
        <SetRow
          title="School email"
          desc={student?.email || "-"}
          action={<Link to="/settings?section=account">Change</Link>}
        />
        <SetRow title="Registration number" desc={regNumber} />
      </SetSection>
    </>
  );
}

// Course of study + level. Changing them can optionally bring the course list
// along; the person decides, so nothing they added by hand is lost by accident.
function StudySection({ student }) {
  // What is saved right now (it moves when a change is saved).
  const [saved, setSaved] = useState(() => ({
    programme: student?.courseOS || localStorage.getItem("courseOS") || "",
    level: student?.level || localStorage.getItem("level") || "",
  }));
  const savedProgramme = saved.programme;
  const savedLevel = saved.level;

  const [programme, setProgramme] = useState(savedProgramme);
  const [level, setLevel] = useState(savedLevel);
  const [reset, setReset] = useState(true);
  const [state, setState] = useState({ type: "", text: "" });
  const [busy, setBusy] = useState(false);

  const levels = levelsOf(programme);
  const changed = programme !== savedProgramme || level !== savedLevel;

  function pickProgramme(next) {
    setProgramme(next);
    // Keep the level if the new course has it, otherwise make them choose.
    if (!levelsOf(next).includes(level)) setLevel("");
  }

  async function save() {
    if (!programme || !level) {
      return setState({ type: "err", text: "Choose both your course of study and your level." });
    }
    setState({ type: "", text: "" });
    setBusy(true);

    try {
      if (isDemo) throw new Error("This is the demo - your course of study stays as it is.");
      const { me } = await api("/student/programme", {
        method: "PUT",
        body: { programme, level, resetCourses: reset },
      });
      applyServerStudent(me);
      setSaved({ programme: me.programme, level: me.level });
      window.dispatchEvent(new Event("nexus:courses-changed"));
      setState({
        type: "ok",
        text: reset
          ? `Updated. Your courses are now the ${levelLabel(me.level)} ${me.programme} courses.`
          : "Updated. Your course list was left as it was.",
      });
    } catch (err) {
      setState({ type: "err", text: err.message });
    } finally {
      setBusy(false);
    }
  }

  return (
    <SetSection title="Course of study" sub="Moved up a level or changed course? Update it here.">
      <div className="set-body">
        <div className="set-grid-2">
          <div className="set-field">
            <label className="set-label" htmlFor="set-programme">Course of study</label>
            <select
              id="set-programme"
              className="set-select"
              value={programme}
              onChange={(e) => pickProgramme(e.target.value)}
              disabled={busy}
            >
              <option value="">Select your course…</option>
              {programmes.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>

          <div className="set-field">
            <label className="set-label" htmlFor="set-level">Level</label>
            <select
              id="set-level"
              className="set-select"
              value={level}
              onChange={(e) => setLevel(e.target.value)}
              disabled={busy || !programme}
            >
              <option value="">{programme ? "Select your level…" : "Choose a course first"}</option>
              {levels.map((l) => <option key={l} value={l}>{levelLabel(l)}</option>)}
            </select>
          </div>
        </div>

        {changed && (
          <label className="set-check">
            <input type="checkbox" checked={reset} onChange={(e) => setReset(e.target.checked)} />
            <span>
              Replace my course list with the courses for this course of study and level.
              Untick to keep the courses I have now.
            </span>
          </label>
        )}

        <Status type={state.type}>{state.text}</Status>
      </div>

      <div className="set-foot">
        <button type="button" className="set-btn-primary" disabled={!changed || busy} onClick={save}>
          {busy ? "Saving…" : "Save changes"}
        </button>
        {changed && (
          <button
            type="button"
            className="set-btn-ghost"
            disabled={busy}
            onClick={() => { setProgramme(savedProgramme); setLevel(savedLevel); setState({ type: "", text: "" }); }}
          >
            Cancel
          </button>
        )}
      </div>
    </SetSection>
  );
}

/* -------------------------------- courses -------------------------------- */

// "Add course" opens a panel with the same search box as the upload page:
// type a code or title, the best match is highlighted, and Enter adds it.
// `reseat` picks from last semester's (Beta) courses instead of this semester's.
function AddCoursePanel({ taken, onClose, reseat = false }) {
  const [error, setError] = useState("");
  const [justAdded, setJustAdded] = useState("");
  // Bumping this empties the search box, ready for the next course.
  const [round, setRound] = useState(0);
  const input = useRef(null);

  const options = useMemo(
    () =>
      (reseat ? getBetaCatalogCourses() : getPrimoCatalogCourses()).filter(
        (c) => !taken.has(c.code)
      ),
    [taken, reseat]
  );

  useEffect(() => {
    input.current?.focus();
  }, [round]);

  async function add(code) {
    if (!code) return;
    setError("");
    setJustAdded("");
    try {
      await (reseat ? addReseatCourse : addCourse)(code);
      setJustAdded(`${code} added to your ${reseat ? "reseat courses" : "courses"}.`);
    } catch (err) {
      setError(err.message);
    }
    setRound((r) => r + 1);
  }

  return (
    <div className="set-picker">
      <div className="set-picker-head">
        <h3 className="set-picker-title">{reseat ? "Add a reseat course" : "Add a course"}</h3>
        <button type="button" className="set-btn-ghost set-btn-sm" onClick={onClose}>Done</button>
      </div>

      <CourseCombobox
        key={round}
        courses={options}
        value=""
        onChange={add}
        inputRef={input}
        pickOnBlur={false}
      />

      <Status type="ok">{justAdded}</Status>
      <Status type="err">{error}</Status>
    </div>
  );
}

// "Your courses" (this semester) and "Reseat courses" (last semester's, being
// sat again) are the same screen over two lists.
function CoursesSection({ reseat = false }) {
  const current = useEffectiveCourses();
  const reseating = useReseatCourses();
  const courses = reseat ? reseating : current;
  const remove = reseat ? removeReseatCourse : removeCourse;
  const [adding, setAdding] = useState(false);
  const [confirming, setConfirming] = useState(null); // code pending removal
  const [error, setError] = useState("");

  const taken = useMemo(() => new Set(courses.map((c) => c.code)), [courses]);

  async function handleRemove(code) {
    setError("");
    setConfirming(null);
    try {
      await remove(code);
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <SetSection
      title={reseat ? "Your reseat courses" : "Your courses"}
      sub={`${courses.length} course${courses.length === 1 ? "" : "s"}`}
      actions={!adding && (
        <button type="button" className="set-btn-primary" onClick={() => setAdding(true)}>
          <UiIcon name="plus" size={15} /> {reseat ? "Add reseat course" : "Add course"}
        </button>
      )}
    >
      {adding && (
        <div className="set-body">
          <AddCoursePanel taken={taken} reseat={reseat} onClose={() => setAdding(false)} />
        </div>
      )}

      {error && (
        <div className="set-body"><Status type="err">{error}</Status></div>
      )}

      {courses.length === 0 && (
        <div className="set-body">
          <p className="set-row-desc" style={{ margin: 0 }}>
            {reseat ? (
              <>
                You have no reseat courses. Tap <strong>Add reseat course</strong> to pick the courses
                from last semester you are sitting again.
              </>
            ) : (
              <>You have no courses yet. Tap <strong>Add course</strong> to pick the ones you take.</>
            )}
          </p>
        </div>
      )}

      {courses.map((c) => (
        <div key={c.code} className="set-row">
          <div className="set-row-text">
            <p className="set-row-title">{c.code}</p>
            <p className="set-row-desc">{c.title}</p>
          </div>

          <div className="set-row-action">
            {confirming === c.code ? (
              <span className="set-confirm">
                <button type="button" className="set-btn-danger set-btn-sm" onClick={() => handleRemove(c.code)}>
                  Remove
                </button>
                <button type="button" className="set-btn-ghost set-btn-sm" onClick={() => setConfirming(null)}>
                  Cancel
                </button>
              </span>
            ) : (
              <button
                type="button"
                className="set-btn-ghost set-btn-sm"
                aria-label={`Remove ${c.code}`}
                onClick={() => setConfirming(c.code)}
              >
                Remove
              </button>
            )}
          </div>
        </div>
      ))}
    </SetSection>
  );
}



export default function Settings() {
  const navigate = useNavigate();
  const student = getStudent();
  const courses = useEffectiveCourses();
  const reseatCourses = useReseatCourses();

  const username = localStorage.getItem("username") || student?.username || "Guest";
  const regNumber = localStorage.getItem("regNumber") || student?.regNumber || "-";
  const level = student?.level || localStorage.getItem("level");
  const programme = student?.courseOS || localStorage.getItem("courseOS");

  async function logout() {
    if (isDemo) {
      window.alert("This is the demo - you stay signed in as " + username + ".");
      return;
    }
    if (!window.confirm("Log out of this device?")) return;
    await signOut("student");
    navigate("/auth", { replace: true });
  }

  const sections = [
    {
      id: "profile",
      title: "Profile",
      icon: "user",
      tone: "violet",
      desc: "Update your username and keep your course of study and level up to date.",
      meta: `${username} · ${regNumber}`,
      lead: "Your identity across Nexus.",
      sponsor: "Without Lynklens, none of this would be possible - your profile, your papers, all free for you.",
    },
    {
      id: "courses",
      title: "My Courses",
      icon: "book",
      tone: "blue",
      desc: "Add or remove the courses that show up on your dashboard.",
      meta: `${courses.length} course${courses.length === 1 ? "" : "s"}`,
      lead: "Keep your course list in step with your timetable.",
      sponsor: "Every course, every past paper, in your palm - brought to you by Lynklens.",
    },
    {
      id: "reseat",
      title: "Reseat Courses",
      icon: "undo",
      tone: "blue",
      desc: "Sitting a course from last semester again? Add it here to see it on your dashboard.",
      meta: `${reseatCourses.length} course${reseatCourses.length === 1 ? "" : "s"}`,
      lead: "Courses from last semester that you are sitting again.",
      sponsor: "Every past paper for your reseats, in one place - thanks to Lynklens.",
    },
    {
      id: "notifications",
      title: "Notifications",
      icon: "bell",
      tone: "peach",
      desc: "Get alerted when new past questions are added to your courses.",
      meta: "Stay in the loop",
      lead: "Choose how Nexus reaches you.",
      sponsor: "New materials reach your pocket the moment they land - thanks to Lynklens.",
    },
    {
      id: "account",
      title: "Account & security",
      icon: "shield",
      tone: "sage",
      desc: "Your school email, password, and deleting your account.",
      meta: "Keep your account safe",
      lead: "Manage how you sign in to Nexus.",
      sponsor: "Study safely. Lynklens checks every link before you click it.",
    },
  ];

  function renderSection(section) {
    if (section.id === "profile") return <ProfileSection student={student} />;
    if (section.id === "courses") return <CoursesSection />;
    if (section.id === "reseat") return <CoursesSection reseat />;
    if (section.id === "notifications") return <NotificationsCard />;
    return (
      <AccountSecurity
        role="student"
        email={student?.email || "-"}
        onSignOut={logout}
      />
    );
  }

  // Which tile is "level / programme" in the profile tile footer, when known.
  if (programme && level) sections[0].meta = `${programme} · ${levelLabel(level)}`;

  return (
    <SettingsHub
      title="Settings"
      lead="Manage your profile, courses and preferences."
      basePath="/settings"
      sections={sections}
      renderSection={renderSection}
      banner={(
        <HeroBanner title="Make Nexus feel like yours.">
          Your name, your courses and your alerts - all in one calm place.
          <br />
          Change anything, any time.
        </HeroBanner>
      )}
    />
  );
}