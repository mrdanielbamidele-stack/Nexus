import { useState, useMemo, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { courseCatalog } from "../data/courseCatalog";
import { studentRegistry } from "../data/studentRegistry";
import { setStudent } from "../lib/studentAuth";
import "./Auth.css";
import ScrollToTop from '../components/ScrollToTop'

const DEMO_EMAIL = "202500062@topfaith.edu.ng";

/* ------------------------------- helpers -------------------------------- */

function coursesFor(courseOS, level) {
  return courseCatalog[courseOS]?.[level] || [];
}

// Flat, de-duped list of every course across all programmes/levels.
function allCourses() {
  const map = new Map();
  for (const programme of Object.values(courseCatalog)) {
    for (const list of Object.values(programme)) {
      for (const c of list) if (!map.has(c.code)) map.set(c.code, c);
    }
  }
  return [...map.values()].sort((a, b) => a.code.localeCompare(b.code));
}

// "TUM-CSC 112" -> "Tum-Csc 112"  (matches the look in the mock-up)
function prettyCode(code) {
  return code.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
}

function hasEmoji(str) {
  return /\p{Extended_Pictographic}/u.test(str);
}

/* -------------------------------- icons --------------------------------- */

const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
    <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.4 29.3 35.5 24 35.5c-6.3 0-11.5-5.2-11.5-11.5S17.7 12.5 24 12.5c2.9 0 5.5 1.1 7.5 2.9l5.7-5.7C33.6 6.5 29 4.5 24 4.5 13.2 4.5 4.5 13.2 4.5 24S13.2 43.5 24 43.5 43.5 34.8 43.5 24c0-1.2-.1-2.3-.4-3.5z" />
    <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12.5 24 12.5c2.9 0 5.5 1.1 7.5 2.9l5.7-5.7C33.6 6.5 29 4.5 24 4.5 16.3 4.5 9.7 8.9 6.3 14.7z" />
    <path fill="#4CAF50" d="M24 43.5c5.2 0 9.7-2 13.1-5.2l-6.1-5c-1.9 1.4-4.3 2.2-7 2.2-5.3 0-9.7-3.1-11.3-7.5l-6.5 5C9.6 39 16.2 43.5 24 43.5z" />
    <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.1-2.2 4-4.2 5.3l6.1 5C40.9 36 43.5 30.6 43.5 24c0-1.2-.1-2.3-.4-3.5z" />
  </svg>
);

const GithubIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M12 2C6.48 2 2 6.58 2 12.25c0 4.53 2.87 8.37 6.84 9.73.5.09.68-.22.68-.49l-.01-1.7c-2.78.62-3.37-1.37-3.37-1.37-.45-1.18-1.11-1.5-1.11-1.5-.91-.64.07-.62.07-.62 1 .07 1.53 1.06 1.53 1.06.89 1.57 2.34 1.12 2.91.86.09-.66.35-1.12.63-1.38-2.22-.26-4.56-1.14-4.56-5.07 0-1.12.39-2.03 1.03-2.75-.1-.26-.45-1.3.1-2.7 0 0 .84-.28 2.75 1.05A9.36 9.36 0 0 1 12 6.84c.85 0 1.71.12 2.51.34 1.91-1.33 2.75-1.05 2.75-1.05.55 1.4.2 2.44.1 2.7.64.72 1.03 1.63 1.03 2.75 0 3.94-2.34 4.81-4.57 5.06.36.32.68.94.68 1.9l-.01 2.81c0 .27.18.59.69.49A10.26 10.26 0 0 0 22 12.25C22 6.58 17.52 2 12 2z" />
  </svg>
);

const KeyIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <circle cx="8" cy="15" r="4.5" stroke="currentColor" strokeWidth="1.6" />
    <path d="M11 13l8-8M16 5l2 2M19 8l1.5-1.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
  </svg>
);

const MailIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="1.6" />
    <path d="M4 7l8 6 8-6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
  </svg>
);

/* -------------------------------- page ---------------------------------- */

export default function Auth() {
  const [params] = useSearchParams();
  const next = params.get("next") || "/";
  const navigate = useNavigate();

  const [mode, setMode] = useState("signup"); // 'signup' | 'login'  -signup is the default
  const [step, setStep] = useState("form"); // 'form' | 'oauth' | 'onboarding'

  useEffect(() => {
    document.title = "Sign in - Nexus";
  }, []);

  function chooseAccount() {
    if (mode === "login") {
      // Login skips onboarding entirely: fixed username + 100L Computer Science.
      setStudent({
        regNumber: DEMO_EMAIL.split("@")[0],
        username: "Dele",
        courseOS: "Computer Science",
        level: "100",
        courses: coursesFor("Computer Science", "100").map((c) => c.code),
      });
      navigate(next, { replace: true });
    } else {
      setStep("onboarding");
    }
  }

  function finishSignup(student) {
    setStudent(student);
    navigate(next, { replace: true });
  }

  return (
    <div className="auth-root">
      <ScrollToTop />
      {/* Image collage background */}
      <div className="auth-collage" aria-hidden="true">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
          <div key={n} className="auth-collage-item">
            <img src={`/logimgs/pic${n}.jpg`} alt="" />
          </div>
        ))}
      </div>

      <div className="auth-fakebanner">
        ⚠ Demo mode -this is a <b>demo OAuth</b> flow (simulated Google sign-in)
      </div>

      {step === "form" && (
        <AuthForm mode={mode} setMode={setMode} onContinue={() => setStep("oauth")} />
      )}
      {step === "oauth" && (
        <OAuthChooser onChoose={chooseAccount} />
      )}
      {step === "onboarding" && (
        <Onboarding email={DEMO_EMAIL} onFinish={finishSignup} />
      )}
    </div>
  );
}

/* ----------------------------- step: form ------------------------------- */

function AuthForm({ mode, setMode, onContinue }) {

  const isSignup = mode === "signup";

  // "Trouble logging in?" complaint box (login only)
  const [complaintOpen, setComplaintOpen] = useState(false);
  const [complaintText, setComplaintText] = useState("");
  const [complaintDone, setComplaintDone] = useState(false);

  // "Something wrong? Report it" box (signup only)
  const [reportOpen, setReportOpen] = useState(false);
  const [reportText, setReportText] = useState("");
  const [reportDone, setReportDone] = useState(false);

  return (
    <div className="auth-card">
      <div className="auth-brand">
        <span className="auth-brand-badge">N</span>
        <span className="auth-brand-name">Nexus</span>
      </div>

      <h1 className="auth-title">{isSignup ? "Sign up for Nexus" : "Log in"}</h1>

      <button type="button" className="auth-google" onClick={onContinue}>
        <GoogleIcon /> Continue with Google
      </button>

      

      {isSignup ? (
        <>
          {/* Something wrong? Report it */}
          {reportDone ? (
            <p className="onb-report-done" style={{ marginTop: 16 }}>
              Sorry for the inconvenience -we&rsquo;ve received your report and it will be resolved soon.
            </p>
          ) : reportOpen ? (
            <div className="onb-report" style={{ marginTop: 16 }}>
              <textarea
                className="onb-report-text"
                rows={3}
                placeholder="Tell us what's wrong…"
                value={reportText}
                onChange={(e) => setReportText(e.target.value)}
              />
              <div className="onb-report-actions">
                <button type="button" className="onb-report-cancel" onClick={() => setReportOpen(false)}>Cancel</button>
                <button
                  type="button"
                  className="onb-report-send"
                  onClick={() => reportText.trim() && setReportDone(true)}
                >
                  Submit report
                </button>
              </div>
            </div>
          ) : (
            <div style={{ textAlign: "center" }}>
              <button type="button" className="onb-report-link" onClick={() => setReportOpen(true)}>
                Something wrong? Report it
              </button>
            </div>
          )}

          <p className="auth-fineprint">
            By registering, you agree to our <a href="#" onClick={(e) => e.preventDefault()}>Terms of Use</a> &amp;{" "}
            <a href="#" onClick={(e) => e.preventDefault()}>Privacy Policy</a>
          </p>
        </>
      ) : complaintDone ? (
        <p className="onb-report-done" style={{ marginTop: 16 }}>
          Sorry for the inconvenience -we&rsquo;ve received your complaint and it will be resolved soon.
        </p>
      ) : complaintOpen ? (
        <div className="onb-report" style={{ marginTop: 16 }}>
          <textarea
            className="onb-report-text"
            rows={3}
            placeholder="Tell us what went wrong logging in…"
            value={complaintText}
            onChange={(e) => setComplaintText(e.target.value)}
          />
          <div className="onb-report-actions">
            <button type="button" className="onb-report-cancel" onClick={() => setComplaintOpen(false)}>Cancel</button>
            <button
              type="button"
              className="onb-report-send"
              onClick={() => complaintText.trim() && setComplaintDone(true)}
            >
              Submit complaint
            </button>
          </div>
        </div>
      ) : (
        <p className="auth-fineprint">
          Trouble logging in?{" "}
          <button type="button" className="auth-link" onClick={() => setComplaintOpen(true)}>
            Make a complaint
          </button>
        </p>
      )}

      <p className="auth-switch">
        {isSignup ? "Already have an account? " : "Don't have an account? "}
        <button type="button" className="auth-link" onClick={() => setMode(isSignup ? "login" : "signup")}>
          {isSignup ? "Log in" : "Sign up now"}
        </button>
      </p>
    </div>
  );
}

/* -------------------------- step: oauth chooser ------------------------- */

function OAuthChooser({ onChoose }) {
  return (
    <div className="goog-card">
      <div className="goog-head">
        <GoogleIcon /> <span>Sign in with Google</span>
      </div>

      <div className="goog-body">
        <div className="auth-brand-badge">N</div>
        <h2 className="goog-title">Choose an account</h2>
        <p className="goog-sub">to continue to <span>Nexus</span></p>

        <button type="button" className="goog-account" onClick={onChoose}>
          <span className="goog-avatar">D</span>
          <span className="goog-acc-text">
            <span className="goog-acc-email">{DEMO_EMAIL}</span>
          </span>
        </button>

        <div className="goog-account goog-disabled" aria-disabled="true">
          <span className="goog-avatar goog-avatar-grey">+</span>
          <span className="goog-acc-text">
            <span className="goog-acc-name">Use another account</span>
            <span className="goog-acc-email">Disabled in this demo</span>
          </span>
        </div>

        <p className="goog-footer">
          This is a <b>demo Google sign-in</b> screen. No real account is used. Before using this app you
          can review Nexus&rsquo;s <a href="#" onClick={(e) => e.preventDefault()}>Privacy Policy</a> and{" "}
          <a href="#" onClick={(e) => e.preventDefault()}>Terms of Service</a>.
        </p>
      </div>

    </div>
  );
}

/* --------------------------- step: onboarding --------------------------- */

function Onboarding({ email, onFinish }) {
  const defaultReg = email.split("@")[0]; // 202500062
  const [reg, setReg] = useState(defaultReg);
  const [extra, setExtra] = useState([]); // course codes added on top of the base list
  const [username, setUsername] = useState("");
  const [error, setError] = useState("");

  // course report widget
  const [reportOpen, setReportOpen] = useState(false);
  const [reportText, setReportText] = useState("");
  const [reportDone, setReportDone] = useState(false);

  const match = studentRegistry[reg.trim()];
  const courseOS = match?.courseOS;
  const level = match?.level;
  const baseCodes = useMemo(
    () => (match ? coursesFor(courseOS, level).map((c) => c.code) : []),
    [match, courseOS, level]
  );

  const selectedCodes = useMemo(() => [...baseCodes, ...extra], [baseCodes, extra]);
  const addable = useMemo(
    () => allCourses().filter((c) => !selectedCodes.includes(c.code)),
    [selectedCodes]
  );

  function addCourse(code) {
    if (code && !selectedCodes.includes(code)) setExtra((x) => [...x, code]);
  }

  // Only courses the student added can be removed - programme courses are fixed.
  function removeCourse(code) {
    setExtra((x) => x.filter((c) => c !== code));
  }

  function submitReport() {
    if (!reportText.trim()) return;
    setReportDone(true);
  }

  function submit() {
    setError("");
    if (!match) return setError("We couldn't find that registration number. Please check it.");
    if (!username.trim()) return setError("Please choose a username.");
    if (hasEmoji(username)) return setError("Your username can't contain emojis.");
    onFinish({
      regNumber: reg.trim(),
      username: username.trim(),
      courseOS,
      level,
      courses: selectedCodes,
    });
  }

  return (
    <div className="onb-card">
      <h1 className="onb-title">Finish setting up</h1>
      <p className="onb-sub">We pulled your details from your school account. Confirm everything looks right.</p>

      {/* Reg number */}
      <label className="onb-label">Registration number</label>
      <input
        className="onb-field"
        value={reg}
        onChange={(e) => setReg(e.target.value)}
        placeholder="e.g. 202500062"
      />

      {/* Mapped programme / level / courses */}
      {match ? (
        <div className="onb-result">
          <div className="onb-pills">
            <span className="pill pill-strong">{courseOS}</span>
            <span className="pill pill-strong">{level} level</span>
          </div>
          <div className="onb-courses-label">Courses you&rsquo;re taking</div>
          <div className="onb-pills">
            {baseCodes.map((code) => (
              <span key={code} className="pill pill-locked">{prettyCode(code)}</span>
            ))}
            {extra.map((code) => (
              <span key={code} className="pill pill-added">
                {prettyCode(code)}
                <button
                  type="button"
                  className="pill-remove"
                  aria-label={`Remove ${prettyCode(code)}`}
                  onClick={() => removeCourse(code)}
                >
                  ×
                </button>
              </span>
            ))}
          </div>

          <AddCourse addable={addable} onAdd={addCourse} />

          {!reportOpen && !reportDone && (
            <button type="button" className="onb-report-link" onClick={() => setReportOpen(true)}>
              Something wrong with these courses? Report it
            </button>
          )}

          {reportOpen && !reportDone && (
            <div className="onb-report">
              <textarea
                className="onb-report-text"
                placeholder="Tell us what's wrong with your course list…"
                value={reportText}
                onChange={(e) => setReportText(e.target.value)}
                rows={3}
              />
              <div className="onb-report-actions">
                <button type="button" className="onb-report-cancel" onClick={() => setReportOpen(false)}>Cancel</button>
                <button type="button" className="onb-report-send" onClick={submitReport}>Submit report</button>
              </div>
            </div>
          )}

          {reportDone && (
            <p className="onb-report-done">
              Sorry for the inconvenience -thanks for letting us know. This error will soon be resolved.
            </p>
          )}
        </div>
      ) : (
        <p className="onb-nomatch">No student found for that registration number.</p>
      )}

      {/* Username */}
      <label className="onb-label" style={{ marginTop: 22 }}>Username</label>
      <input
        className="onb-field"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        placeholder="Pick a username"
      />
      <p className="onb-hint">Your username is a nickname but no emojis.</p>

      {error && <p className="onb-error">{error}</p>}

      <button type="button" className="onb-submit" onClick={submit}>Continue</button>
    </div>
  );
}

function AddCourse({ addable, onAdd }) {
  const [value, setValue] = useState("");
  return (
    <div className="onb-add">
      <select
        className="onb-add-select"
        value={value}
        onChange={(e) => {
          onAdd(e.target.value);
          setValue("");
        }}
      >
        <option value="">+ Add a course…</option>
        {addable.map((c) => (
          <option key={c.code} value={c.code}>
            {prettyCode(c.code)} -{c.title}
          </option>
        ))}
      </select>
      <span className="onb-add-note">Your programme courses are fixed. Any course you add can be removed with the × .</span>
    </div>
  );
}
