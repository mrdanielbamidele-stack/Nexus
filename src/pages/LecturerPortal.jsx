/* eslint-disable no-unused-vars */
import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "../lib/supabase";
import { codeToSlug } from "../lib/courseSlug";
import FolderIcon from '../assets/icons8-folder-96.png';
import HidePassword from '../assets/hidepassword.svg';
import ShowPassword from '../assets/showpassword.svg';
import nexusLogo from '/logo.svg';
import '../../nexus-breadcrumb.css';
import './LecturerPortal.css';

const IconPdf        = '/lecturer-icons/icons8-pdf-80.png';
const IconWord       = '/lecturer-icons/icons8-word-file-96.png';
const IconExcel      = '/lecturer-icons/icons8-excel-file-96.png';
const IconPowerpoint = '/lecturer-icons/icons8-powerpoint-file-480.png';
const IconImage      = '/lecturer-icons/icons8-image-file-240.png';
const IconVideo      = '/lecturer-icons/icons8-video-file-100.png';
const IconAudio      = '/lecturer-icons/icons8-audio-file-80.png';
const IconZip        = '/lecturer-icons/icons8-zip-file-100.png';
const IconCode       = '/lecturer-icons/icons8-code-file-100.png';
const IconDatabase   = '/lecturer-icons/icons8-database-80.png';
const IconText       = '/lecturer-icons/icons8-text-file-100.png';
const IconDefault    = '/lecturer-icons/icons8-file-480.png';

function capitalizeName(name) {
  return (name || "")
    .split(" ")
    .map(w => (w ? w.charAt(0).toUpperCase() + w.slice(1) : w))
    .join(" ");
}

function parseModuleNumbering(fileName) {
  return fileName
    .replace(/\.[^.]+$/, '')
    .replace(/[-_]+/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, c => c.toUpperCase());
}

function getNumberingLabel(folderType) {
  return folderType === 'module' ? 'Module Numbering' : 'Display Title';
}

async function downloadFile(fileUrl, downloadName) {
  try {
    const res = await fetch(fileUrl);
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = downloadName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  } catch {
    window.open(fileUrl, '_blank');
  }
}

function buildDownloadName(mat, courseCode) {
  const ext = mat.file_name.includes('.')
    ? mat.file_name.slice(mat.file_name.lastIndexOf('.'))
    : '';
  const label = mat.module_numbering?.trim() || mat.file_name.replace(/\.[^.]+$/, '');
  return `${courseCode} ${label}${ext}`;
}

const TrashIcon = ({ size = 16, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
    <path d="M2.5 4h11M6 4V2.5a1 1 0 011-1h2a1 1 0 011 1V4M5 4l.4 9a1 1 0 001 .95h3.2a1 1 0 001-.95L11 4"
      stroke={color} strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const DownloadIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
    <path d="M9 2v9M6 8l3 3 3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M3 13v2a1 1 0 001 1h10a1 1 0 001-1v-2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

function storagePathFromUrl(url) {
  const marker = "/course-materials/";
  const i = (url || "").indexOf(marker);
  return i === -1 ? null : decodeURIComponent(url.slice(i + marker.length));
}

async function deleteMaterial(mat) {
  const path = storagePathFromUrl(mat.file_url);
  if (path) {
    await supabase.storage.from("course-materials").remove([path]);
  }
  const { error } = await supabase.from("course_materials").delete().eq("id", mat.id);
  return error;
}

const SearchIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <circle cx="7" cy="7" r="5" stroke="#999" strokeWidth="1.5" />
    <path d="M11 11l3 3" stroke="#999" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

const Toggle = ({ checked, onChange, disabled }) => (
  <button
    onClick={() => !disabled && onChange(!checked)}
    disabled={disabled}
    style={{
      width: 44, height: 24, borderRadius: 12,
      background: checked ? "#7c3aed" : "#D1D5DB",
      border: "none", cursor: disabled ? "not-allowed" : "pointer",
      position: "relative", transition: "background .2s", flexShrink: 0,
    }}
  >
    <span style={{
      position: "absolute", top: 3, left: checked ? 23 : 3,
      width: 18, height: 18, borderRadius: "50%", background: "#fff",
      transition: "left .2s",
    }} />
  </button>
);

const Spinner = () => (
  <div style={{ display: "flex", justifyContent: "center", padding: 40 }}>
    <div style={{
      width: 32, height: 32, borderRadius: "50%",
      border: "3px solid #EEE", borderTopColor: "#7c3aed",
      animation: "spin 0.7s linear infinite",
    }} />
    <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
  </div>
);

const TOAST_STYLES = {
  info:    { bg: "#1E3A5F", icon: "i" },
  success: { bg: "#047857", icon: "✓" },
  error:   { bg: "#B91C1C", icon: "!" },
};
const Toast = ({ msg, type = "info", onClose }) => {
  useEffect(() => {
    const t = setTimeout(onClose, type === "error" ? 4500 : 3000);
    return () => clearTimeout(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const s = TOAST_STYLES[type] || TOAST_STYLES.info;
  return (
    <div className="lp-toast" style={{ border: `1px solid ${s.bg}` , color: s.bg }} role="status" aria-live="polite">
      <span className="lp-toast-badge" style={{ border: `1px solid ${s.bg}`}}>{s.icon}</span>
      <span className="lp-toast-msg">{msg}</span>
    </div>
  );
};

const ConfirmDialog = ({ title, message, confirmLabel = "Delete", onConfirm, onCancel, busy }) => (
  <div
    onClick={busy ? undefined : onCancel}
    style={{
      position: "fixed", inset: 0, background: "rgba(15,23,42,.45)",
      display: "flex", alignItems: "center", justifyContent: "center",
      zIndex: 2000, padding: 20, fontFamily: "sans-serif",
    }}
  >
    <div
      onClick={e => e.stopPropagation()}
      style={{
        background: "#fff", borderRadius: 14, padding: "24px 24px 20px",
        width: "100%", maxWidth: 400, boxSizing: "border-box",
        boxShadow: "0 16px 48px rgba(0,0,0,.22)",
      }}
    >
      <h3 style={{ margin: "0 0 8px", fontSize: 18, fontWeight: 700, color: "#1E3A5F" }}>{title}</h3>
      <p style={{ margin: "0 0 22px", fontSize: 14, color: "#6B7280", lineHeight: 1.5, fontWeight: 400 }}>
        {message}
      </p>
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
        <button
          onClick={onCancel} disabled={busy}
          style={{
            padding: "9px 16px", borderRadius: 8, border: "1.5px solid #E5E7EB",
            background: "#fff", color: "#374151", fontSize: 14, fontWeight: 600,
            cursor: busy ? "not-allowed" : "pointer", fontFamily: "inherit", width: "auto",
          }}
        >Cancel</button>
        <button
          onClick={onConfirm} disabled={busy}
          style={{
            padding: "9px 16px", borderRadius: 8, border: "none",
            background: "#DC2626", color: "#fff", fontSize: 14, fontWeight: 600,
            cursor: busy ? "not-allowed" : "pointer", fontFamily: "inherit",
            opacity: busy ? 0.7 : 1, width: "auto",
          }}
        >{busy ? "Deleting…" : confirmLabel}</button>
      </div>
    </div>
  </div>
);

function NavBar({ profile }) {
  return (
    <div className="lp-navbar">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}>
        <span style={{ display: "flex", alignItems: "center" }}><img src={nexusLogo} /></span>
        <span style={{ justifyContent: "center", color: "black", fontSize: 17, fontWeight: 700 }}>Nexus Admin</span>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span className="lp-navbar-name">
          {profile.title} {capitalizeName(profile.full_name)}
        </span>
        <button
          onClick={() => supabase.auth.signOut()}
          style={{
            fontSize: 13, fontFamily: "sans-serif", background: "#7c3aed",
            borderRadius: 5, padding: "5px 12px", width: "auto",
            cursor: "pointer", color: "#fff", border: "none", whiteSpace: "nowrap",
          }}
        >Sign out</button>
      </div>
    </div>
  );
}

function AuthPage({ onAuth }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [fullName, setFullName] = useState("");
  const [title, setTitle] = useState("Dr.");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function handleSubmit() {
    setError(""); setLoading(true);
    try {
      if (isSignUp) {
        const { data, error } = await supabase.auth.signUp({
          email, password,
          options: { data: { full_name: fullName, title, role: "lecturer" } },
        });
        if (error) throw error;
        // Email verification is disabled - sign-up returns a session, so take the user straight in.
        if (data.user) {
          onAuth(data.user);
        } else {
          // Fallback in case a session isn't returned (e.g. verification re-enabled).
          const { data: signInData, error: signInError } =
            await supabase.auth.signInWithPassword({ email, password });
          if (signInError) throw signInError;
          onAuth(signInData.user);
        }
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        onAuth(data.user);
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  const inp = {
    width: "100%", padding: "10px 14px", borderRadius: 8,
    border: "1.5px solid #DDE3EF", fontSize: 14, fontFamily: "inherit",
    outline: "none", boxSizing: "border-box",
    background: "#FAFBFF", color: "#1a1a2e",
  };

  return (
    <div style={{
      minHeight: "100vh", width: "100%",
      display: "flex", alignItems: "center", justifyContent: "center",
      background: "linear-gradient(135deg,#F0F4FF 0%,#FFF8F0 100%)",
      fontFamily: "sans-serif", fontWeight: 800, boxSizing: "border-box",
    }}>
      <div className="lp-auth-card">
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{
            width: 52, height: 52, borderRadius: 14,
            margin: "0 auto 12px", display: "flex", alignItems: "center",
            justifyContent: "center", fontSize: 26,
          }}>
            <img src={nexusLogo} width={"40px"} />
          </div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: "black" }}>Nexus  </h1>
          <p style={{ margin: "4px 0 0", fontSize: 13, color: "#888", fontFamily: "sans-serif", fontWeight: 300 }}>
            Lecturer Administration System
          </p>
        </div>

        {isSignUp && (
          <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
            <select value={title} onChange={e => setTitle(e.target.value)}
              style={{ ...inp, width: 90 }}>
              {["Dr.", "Prof.", "Mr.", "Mrs.", "Ms."].map(t => <option key={t}>{t}</option>)}
            </select>
            <input style={inp} placeholder="Full name" value={fullName}
              onChange={e => setFullName(e.target.value)} />
          </div>
        )}

        <div style={{ marginBottom: 10 }}>
          <input style={inp} type="email" placeholder="Email address"
            value={email} onChange={e => setEmail(e.target.value)} />
        </div>
        <div style={{ marginBottom: 4 }}>
          <div style={{ position: "relative", width: "100%" }}>
            <input
              style={{ ...inp, paddingRight: "40px" }}
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleSubmit()}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              style={{
                position: "absolute", right: "10px", top: "50%",
                transform: "translateY(-50%)", background: "none",
                border: "none", cursor: "pointer", padding: "5px 8px",
                display: "flex", alignItems: "center", color: "#777",
                width: "auto",
              }}
            >
              <img
                src={showPassword ? HidePassword : ShowPassword}
                alt="toggle password"
                style={{ width: "20px", height: "20px" }}
              />
            </button>
          </div>
        </div>

        {error && (
          <p style={{
            fontSize: 13, margin: "8px 0 0", fontFamily: "sans-serif",
            color: error.includes("Check") ? "#2563EB" : "#C0392B",
          }}>{error}</p>
        )}

        <button
          onClick={handleSubmit} disabled={loading}
          style={{
            width: "100%", padding: 12, borderRadius: 8, border: "none",
            background: "#7c3aed", color: "#fff", fontSize: 15, fontWeight: 600,
            cursor: "pointer", fontFamily: "inherit", marginTop: 12,
          }}
        >
          {loading ? "Please wait…" : isSignUp ? "Create Account" : "Sign In"}
        </button>

        <p style={{
          fontWeight: 300, textAlign: "center", fontSize: 13, color: "#888",
          marginTop: 16, fontFamily: "sans-serif",
        }}>
          {isSignUp ? "Already have an account? " : "No account yet? "}
          <span style={{ color: "#7c3aed", cursor: "pointer" }}
            onClick={() => setIsSignUp(!isSignUp)}>
            {isSignUp ? "Sign in" : "Sign up"}
          </span>
        </p>
      </div>
    </div>
  );
}

function Dashboard({ profile, onSelectCourse }) {
  const [courses, setCourses] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from("courses").select("*")
      .eq("lecturer_id", profile.id).order("created_at")
      .then(({ data }) => { setCourses(data || []); setLoading(false); });
  }, [profile.id]);

  const filtered = courses.filter(c =>
    c.code.toLowerCase().includes(search.toLowerCase()) ||
    c.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{
      minHeight: "100vh", width: "100%",
      background: "#fff", fontFamily: "sans-serif", fontWeight: 600,
      boxSizing: "border-box",
    }}>
      <NavBar profile={profile} />

      <div className="lp-dashboard-content">
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ margin: 0, fontSize: 26, color: "black", fontWeight: 700 }}>
            Welcome, {profile.title} {capitalizeName(profile.full_name.split(" ")[0])}
          </h1>
          <p style={{ margin: "6px 0 0", color: "#888", fontSize: 15, fontFamily: "sans-serif", fontWeight: 100 }}>
            What are we educating the younger generation with today?
          </p>
        </div>

        <div style={{
          display: "flex", alignItems: "center", gap: 10,
          background: "#fff", border: "1.5px solid #E8EAF0",
          borderRadius: 10, padding: "10px 16px", marginBottom: 32, maxWidth: 360,
        }}>
          <SearchIcon />
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search courses…"
            style={{
              border: "none", outline: "none", fontSize: 14,
              fontFamily: "sans-serif", width: "100%", background: "transparent",
            }}
          />
        </div>

        {loading ? <Spinner /> : filtered.length === 0 ? (
          <p style={{ color: "#999", fontFamily: "sans-serif", fontSize: 15 }}>
            No courses found.
          </p>
        ) : (
          <div className="lp-courses-grid">
            {filtered.map(course => (
              <div
                key={course.code}
                onClick={() => onSelectCourse(course)}
                style={{
                  cursor: "pointer", textAlign: "center",
                  padding: "20px 12px 16px", borderRadius: 12,
                  transition: "transform .15s, background .15s",
                  background: "transparent",
                }}
                onMouseEnter={e => e.currentTarget.style.opacity = ".75"}
                onMouseLeave={e => e.currentTarget.style.opacity = "1"}
              >
                <img src={FolderIcon} width="52" />
                <div style={{
                  marginTop: 10, fontSize: 13, fontWeight: 700,
                  color: "black", fontFamily: "sans-serif",
                }}>{course.code}</div>
                <div style={{
                  fontSize: 11, color: "#999", marginTop: 2,
                  fontFamily: "sans-serif", lineHeight: 1.3, fontWeight: 200,
                }}>{course.title}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

const FOLDERS = [
  { type: "outline", label: "Course Outline" },
  { type: "module", label: "Course Modules" },
  { type: "textbook", label: "Textbooks" },
];

function CourseDetail({ course, profile, onBack }) {
  const [activeFolder, setActiveFolder] = useState(null);

  if (activeFolder) {
    return (
      <FolderView
        course={course}
        profile={profile}
        folderType={activeFolder.type}
        folderLabel={activeFolder.label}
        onBack={() => setActiveFolder(null)}
        onBackToCourses={onBack}
      />
    );
  }

  return (
    <div style={{
      minHeight: "100vh", width: "100%",
      background: "#fff", fontFamily: "sans-serif", fontWeight: 800,
      boxSizing: "border-box",
    }}>
      <NavBar profile={profile} />
      <div className="lp-breadcrumb-pad">
        <nav className="nx-breadcrumb" aria-label="breadcrumb">
          <button className="nx-bc-item nx-bc-prev" onClick={onBack}>
            <span className="nx-bc-home-dot"></span>
            Courses
          </button>
          <span className="nx-bc-sep">/</span>
          <span className="nx-bc-item nx-bc-current">{course.code}</span>
        </nav>
      </div>

      <div className="lp-course-content">
        <h2 style={{ margin: "0 0 4px", color: "black", fontSize: 22, fontWeight: 700 }}>{course.code}</h2>
        <p style={{ margin: "0 0 36px", color: "#888", fontFamily: "sans-serif", fontWeight: 100 }}>{course.title}</p>

        <div className="lp-folders-grid">
          {FOLDERS.map(f => (
            <div
              key={f.type}
              onClick={() => setActiveFolder(f)}
              style={{ cursor: "pointer", textAlign: "center", padding: "16px 12px" }}
              onMouseEnter={e => e.currentTarget.style.opacity = ".75"}
              onMouseLeave={e => e.currentTarget.style.opacity = "1"}
            >
              <img src={FolderIcon} width="56" />
              <div style={{ marginTop: 8, fontSize: 13, fontWeight: 700, color: "black", fontFamily: "sans-serif" }}>
                {f.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function getFileIcon(mat) {
  const name = (mat.file_name || "").toLowerCase();
  const ext = name.slice(name.lastIndexOf(".") + 1);

  if (mat.file_type === "video") return IconVideo;
  if (mat.file_type === "pdf") return IconPdf;
  if (ext === "pdf") return IconPdf;
  if (/^(jpe?g|png|gif|bmp|tiff?|webp|svg|ico|heic|heif|raw|cr2|nef|arw|dng|psd|ai|eps|avif|jfif)$/.test(ext)) return IconImage;
  if (/^(mp4|mov|avi|mkv|wmv|flv|webm|m4v|mpe?g|3gp)$/.test(ext)) return IconVideo;
  if (/^(mp3|wav|flac|aac|ogg|m4a|wma|aiff|opus|midi?)$/.test(ext)) return IconAudio;
  if (/^(docx?|dot|dotx|rtf|odt|pages)$/.test(ext)) return IconWord;
  if (/^(xlsx?|xlsm|xlsb|xlt|xltx|ods|csv|tsv|numbers)$/.test(ext)) return IconExcel;
  if (/^(pptx?|pps|ppsx|pot|potx|odp|key)$/.test(ext)) return IconPowerpoint;
  if (/^(txt|md|markdown|log|rst)$/.test(ext)) return IconText;
  if (/^(zip|rar|7z|tar|gz|bz2|xz|tgz|iso|cab|img)$/.test(ext)) return IconZip;
  if (/^(html?|css|js|jsx|ts|tsx|py|java|c|cpp|cs|php|rb|go|rs|swift|kt|sh|xml|ya?ml|json)$/.test(ext)) return IconCode;
  if (/^(db|sqlite|sql|mdb|accdb)$/.test(ext)) return IconDatabase;
  return IconDefault;
}

function FolderView({ course, profile, folderType, folderLabel, onBack, onBackToCourses }) {
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(null);
  const [toast, setToast] = useState(null);
  const [selectedMaterial, setSelectedMaterial] = useState(null);
  const [confirmMat, setConfirmMat] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [progress, setProgress] = useState(null);
  const [dragActive, setDragActive] = useState(false);

  const [selectedIds, setSelectedIds] = useState(() => new Set());
  const [bulkBusy, setBulkBusy] = useState(false);
  const [confirmBulk, setConfirmBulk] = useState(false);

  const [numberings, setNumberings] = useState({});
  const [savedTick, setSavedTick] = useState({});
  const saveTimers = useRef({});

  const dragCounter = useRef(0);
  const uploading = progress !== null;

  const notify = useCallback(
    (msg, type = "info") => setToast({ msg, type, id: Date.now() + Math.random() }),
    []
  );

  const load = useCallback(() => {
    setLoading(true);
    supabase.from("course_materials").select("*")
      .eq("course_id", course.code)
      .eq("type", folderType)
      .order("created_at")
      .then(({ data }) => { setMaterials(data || []); setLoading(false); });
  }, [course.code, folderType]);

  useEffect(() => { load(); }, [load]);

  async function handleToggle(mat, value) {
    setToggling(mat.id);
    try {
      if (value) {
        await supabase.rpc("publish_material", { material_id: mat.id });
        notify("Published - material is live", "success");
      } else {
        // Plain column update -never a delete.
        await supabase
          .from("course_materials")
          .update({ is_published: false, clone_key: null, download_url: null, updated_at: new Date().toISOString() })
          .eq("id", mat.id);
        notify("Unpublished - material is now locked", "info");
      }
      load();
    } finally {
      setToggling(null);
    }
  }

  function handleNumberingChange(matId, value) {
    setNumberings(prev => ({ ...prev, [matId]: value }));
    setSavedTick(prev => ({ ...prev, [matId]: false }));
    if (saveTimers.current[matId]) clearTimeout(saveTimers.current[matId]);
    saveTimers.current[matId] = setTimeout(async () => {
      const { error } = await supabase
        .from("course_materials")
        .update({ module_numbering: value })
        .eq("id", matId);
      if (!error) {
        setSavedTick(prev => ({ ...prev, [matId]: true }));
        setTimeout(() => setSavedTick(prev => ({ ...prev, [matId]: false })), 2000);
      }
    }, 3000);
  }

  async function uploadFiles(fileList) {
    const files = Array.from(fileList || []);
    if (!files.length) return;

    const plural = (n) => `${n} file${n !== 1 ? "s" : ""}`;
    let ok = 0, fail = 0;
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      setProgress({ done: i, total: files.length, name: file.name });

      const path = `${course.code}/${folderType}/${Date.now()}-${i}-${file.name}`;
      const { error: uploadErr } = await supabase.storage
        .from("course-materials").upload(path, file);
      if (uploadErr) { fail++; continue; }

      const { data: urlData } = supabase.storage.from("course-materials").getPublicUrl(path);
      const { data: inserted, error: insertErr } = await supabase.from("course_materials").insert({
        course_id: course.code,
        type: folderType,
        file_name: file.name,
        file_url: urlData.publicUrl,
        module_numbering: parseModuleNumbering(file.name),
        file_type: file.type.startsWith("video") ? "video"
          : file.name.toLowerCase().endsWith(".pdf") ? "pdf"
          : "document",
      }).select("id").single();
      if (insertErr) { fail++; continue; }
      // Publish on upload so the material is live for students right away
      // (also generates the clone_key slug the student lesson link needs).
      await supabase.rpc("publish_material", { material_id: inserted.id });
      ok++;
    }

    setProgress(null);
    if (fail === 0)     notify(`${plural(ok)} uploaded`, "success");
    else if (ok === 0)  notify(`Couldn't upload ${plural(fail)} - please try again`, "error");
    else                notify(`${plural(ok)} uploaded · ${fail} failed`, "info");
    load();
  }

  function handleUpload(e) {
    uploadFiles(e.target.files);
    e.target.value = "";
  }

  function handleDragEnter(e) {
    e.preventDefault();
    if (!Array.from(e.dataTransfer?.types || []).includes("Files")) return;
    dragCounter.current++;
    setDragActive(true);
  }
  function handleDragOver(e) { e.preventDefault(); }
  function handleDragLeave(e) {
    e.preventDefault();
    dragCounter.current = Math.max(0, dragCounter.current - 1);
    if (dragCounter.current === 0) setDragActive(false);
  }
  function handleDrop(e) {
    e.preventDefault();
    dragCounter.current = 0;
    setDragActive(false);
    if (e.dataTransfer?.files?.length) uploadFiles(e.dataTransfer.files);
  }

  async function handleDelete(mat) {
    setDeleting(true);
    const err = await deleteMaterial(mat);
    setDeleting(false);
    setConfirmMat(null);
    if (err) { notify("Delete failed: " + err.message, "error"); return; }
    notify("File deleted", "info");
    load();
  }

  function toggleSelect(id) {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }
  const clearSelection = () => setSelectedIds(new Set());
  const allSelected = materials.length > 0 && selectedIds.size === materials.length;
  function toggleSelectAll() {
    setSelectedIds(allSelected ? new Set() : new Set(materials.map(m => m.id)));
  }

  const pluralFiles = (n) => `${n} file${n !== 1 ? "s" : ""}`;

  async function bulkSetPublished(value) {
    const ids = [...selectedIds];
    if (!ids.length) return;
    setBulkBusy(true);
    let fail = 0;
    if (value) {
      // Publishing goes through the RPC so each row gets its clone_key slug.
      for (const id of ids) {
        const { error } = await supabase.rpc("publish_material", { material_id: id });
        if (error) fail++;
      }
    } else {
      // Unpublish is a plain column update -never a delete.
      const { error } = await supabase
        .from("course_materials")
        .update({ is_published: false, clone_key: null, download_url: null, updated_at: new Date().toISOString() })
        .in("id", ids);
      if (error) fail = ids.length;
    }
    setBulkBusy(false);
    const ok = ids.length - fail;
    if (fail === 0)            notify(`${pluralFiles(ok)} ${value ? "published" : "unpublished"}`, value ? "success" : "info");
    else if (ok === 0)         notify(`Couldn't ${value ? "publish" : "unpublish"} ${pluralFiles(fail)} -please try again`, "error");
    else                       notify(`${ok} ${value ? "published" : "unpublished"} · ${fail} failed`, "info");
    clearSelection();
    load();
  }

  async function bulkDelete() {
    const toDelete = materials.filter(m => selectedIds.has(m.id));
    if (!toDelete.length) return;
    setBulkBusy(true);
    let fail = 0;
    for (const mat of toDelete) {
      const err = await deleteMaterial(mat);
      if (err) fail++;
    }
    setBulkBusy(false);
    setConfirmBulk(false);
    if (fail === 0)                    notify(`${pluralFiles(toDelete.length)} deleted`, "info");
    else if (fail === toDelete.length) notify(`Couldn't delete ${pluralFiles(fail)} -please try again`, "error");
    else                               notify(`${toDelete.length - fail} deleted · ${fail} failed`, "info");
    clearSelection();
    load();
  }

  const numberingLabel = getNumberingLabel(folderType);

  return (
    <div
      onDragEnter={handleDragEnter}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      style={{
        minHeight: "100vh", width: "100%",
        background: "#fff", fontFamily: "sans-serif", fontWeight: 200,
        boxSizing: "border-box", position: "relative",
      }}
    >
      <NavBar profile={profile} />
      {toast && <Toast key={toast.id} msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}

      {dragActive && (
        <div className="lp-drop-overlay">
          <div className="lp-drop-card">
            <svg width="48" height="48" viewBox="0 0 44 44" fill="none" style={{ display: "block", margin: "0 auto 12px" }}>
              <path d="M8 4H27L36 13V40H8V4Z" stroke="#7c3aed" strokeWidth="2" fill="none" strokeLinejoin="round"/>
              <path d="M27 4V13H36" stroke="#7c3aed" strokeWidth="2" fill="none" strokeLinejoin="round"/>
              <path d="M22 32V22M17 27L22 22L27 27" stroke="#7c3aed" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <div className="lp-drop-title">Drop to upload</div>
            <div className="lp-drop-sub">
              Files will be added to <strong>{folderLabel}</strong> in {course.code}
            </div>
          </div>
        </div>
      )}

      {progress && (
        <div className="lp-upload-progress" role="status" aria-live="polite">
          <div className="lp-up-row">
            <span className="lp-up-spin" />
            <span className="lp-up-label">
              Uploading {Math.min(progress.done + 1, progress.total)} of {progress.total}
            </span>
            <span className="lp-up-count">{Math.round((progress.done / progress.total) * 100)}%</span>
          </div>
          <div className="lp-up-name" title={progress.name}>{progress.name}</div>
          <div className="lp-up-bar">
            <div className="lp-up-bar-fill" style={{ width: `${(progress.done / progress.total) * 100}%` }} />
          </div>
        </div>
      )}

      {confirmMat && (
        <ConfirmDialog
          title="Delete file?"
          message={`"${confirmMat.file_name}" will be permanently removed${confirmMat.is_published ? " and its student  will loose access to material" : ""}. This cannot be undone.`}
          onConfirm={() => handleDelete(confirmMat)}
          onCancel={() => setConfirmMat(null)}
          busy={deleting}
        />
      )}

      {confirmBulk && (
        <ConfirmDialog
          title={`Delete ${pluralFiles(selectedIds.size)}?`}
          message={`The selected ${selectedIds.size === 1 ? "file" : "files"} will be permanently removed and any live student  will loose access to material. This cannot be undone.`}
          confirmLabel={`Delete ${selectedIds.size}`}
          onConfirm={bulkDelete}
          onCancel={() => setConfirmBulk(false)}
          busy={bulkBusy}
        />
      )}

      {selectedMaterial && (
        <FilePreviewModal
          material={selectedMaterial}
          course={course}
          onClose={() => setSelectedMaterial(null)}
        />
      )}

      <div className="lp-breadcrumb-pad">
        <nav className="nx-breadcrumb" aria-label="breadcrumb">
          <button className="nx-bc-item" onClick={onBackToCourses}>
            <span className="nx-bc-home-dot"></span>
            Courses
          </button>
          <span className="nx-bc-sep">/</span>
          <button className="nx-bc-item nx-bc-prev" onClick={onBack}>
            {course.code}
          </button>
          <span className="nx-bc-sep">/</span>
          <span className="nx-bc-item nx-bc-current">{folderLabel}</span>
        </nav>
      </div>

      <div className="lp-folder-content">
        <div className="lp-folder-header">
          <div>
            <h2 style={{ margin: "0 0 4px", color: "black", fontSize: 20, fontWeight: 700, fontFamily: "sans-serif" }}>
              {folderLabel}
            </h2>
            <p style={{ margin: 0, color: "#888", fontSize: 13, fontFamily: "sans-serif", fontWeight: 400 }}>
              {course.code} - {course.title}
            </p>
          </div>
          <label className={`lp-upload-btn${uploading ? " is-busy" : ""}`} aria-disabled={uploading}>
            {uploading ? (
              <><span className="lp-up-spin lp-up-spin--sm" /> Uploading…</>
            ) : (
              <>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M8 11V3M5 6l3-3 3 3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M3 11v1.5A1.5 1.5 0 004.5 14h7a1.5 1.5 0 001.5-1.5V11" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                </svg>
                Upload files
              </>
            )}
            <input type="file" multiple disabled={uploading} style={{ display: "none" }} onChange={handleUpload} />
          </label>
        </div>

        <p className="lp-folder-hint">
          Select several files at once, or drag &amp; drop them anywhere on this page.
        </p>

        {!loading && materials.length > 0 && (
          <div style={{
            display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap",
            margin: "0 0 16px", padding: selectedIds.size ? "10px 14px" : "0",
            borderRadius: 10, fontFamily: "sans-serif",
            background: selectedIds.size ? "#F5F3FF" : "transparent",
            border: selectedIds.size ? "1.5px solid #DDD6FE" : "none",
            transition: "background .15s, border .15s",
          }}>
            <label style={{
              display: "flex", alignItems: "center", gap: 8, cursor: "pointer",
              fontSize: 13, fontWeight: 600, color: "#374151",
            }}>
              <input
                type="checkbox"
                checked={allSelected}
                ref={el => { if (el) el.indeterminate = selectedIds.size > 0 && !allSelected; }}
                onChange={toggleSelectAll}
                style={{ width: 16, height: 16, accentColor: "#7c3aed", cursor: "pointer" }}
              />
              {selectedIds.size > 0 ? `${selectedIds.size} selected` : "Select all"}
            </label>

            {selectedIds.size > 0 && (
              <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                <button
                  onClick={() => bulkSetPublished(true)}
                  disabled={bulkBusy}
                  style={{
                    fontSize: 13, fontWeight: 600, fontFamily: "inherit",
                    color: "#fff", background: "#7c3aed", border: "none",
                    borderRadius: 7, padding: "7px 14px", width: "auto",
                    cursor: bulkBusy ? "not-allowed" : "pointer", opacity: bulkBusy ? 0.6 : 1,
                  }}
                >Publish</button>
                <button
                  onClick={() => bulkSetPublished(false)}
                  disabled={bulkBusy}
                  style={{
                    fontSize: 13, fontWeight: 600, fontFamily: "inherit",
                    color: "#374151", background: "#fff", border: "1.5px solid #E5E7EB",
                    borderRadius: 7, padding: "7px 14px", width: "auto",
                    cursor: bulkBusy ? "not-allowed" : "pointer", opacity: bulkBusy ? 0.6 : 1,
                  }}
                >Unpublish</button>
                <button
                  onClick={() => setConfirmBulk(true)}
                  disabled={bulkBusy}
                  style={{
                    display: "flex", alignItems: "center", gap: 6,
                    fontSize: 13, fontWeight: 600, fontFamily: "inherit",
                    color: "#DC2626", background: "#fff", border: "1.5px solid #FECACA",
                    borderRadius: 7, padding: "7px 14px", width: "auto",
                    cursor: bulkBusy ? "not-allowed" : "pointer", opacity: bulkBusy ? 0.6 : 1,
                  }}
                ><TrashIcon size={14} color="#DC2626" /> Delete</button>
                <button
                  onClick={clearSelection}
                  disabled={bulkBusy}
                  style={{
                    fontSize: 13, fontWeight: 600, fontFamily: "inherit",
                    color: "#6B7280", background: "transparent", border: "none",
                    padding: "7px 8px", width: "auto",
                    cursor: bulkBusy ? "not-allowed" : "pointer",
                  }}
                >Clear</button>
              </div>
            )}
          </div>
        )}

        {loading ? <Spinner /> : (
          <div className="lp-materials-grid">
            <label className="lp-placeholder-card">
              <svg width="60" height="72" viewBox="0 0 52 64" fill="none">
                <path d="M6 8Q6 2 12 2H34V16H46V58Q46 64 40 64H12Q6 64 6 58Z" fill="white" stroke="#111827" strokeWidth="3" strokeLinejoin="round"/>
                <path d="M34 2L46 16" stroke="#111827" strokeWidth="3" strokeLinecap="round"/>
                <path d="M26 41V27" stroke="#111827" strokeWidth="3" strokeLinecap="round"/>
                <path d="M19 34L26 27L33 34" stroke="#111827" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M15 49V54H37V49" stroke="#111827" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <input type="file" multiple disabled={uploading} style={{ display: "none" }} onChange={handleUpload} />
            </label>

            {materials.map(mat => {
              const currentNumbering = numberings[mat.id] ?? mat.module_numbering ?? '';
              const isSel = selectedIds.has(mat.id);

              return (
                <div
                  key={mat.id}
                  className="lp-material-card"
                  style={{
                    cursor: "default",
                    outline: isSel ? "2px solid #7c3aed" : "none",
                    outlineOffset: -2,
                  }}
                >
                  <input
                    type="checkbox"
                    title="Select file"
                    checked={isSel}
                    onChange={() => toggleSelect(mat.id)}
                    onClick={e => e.stopPropagation()}
                    style={{
                      position: "absolute", top: 8, left: 8, zIndex: 3,
                      width: 18, height: 18, accentColor: "#7c3aed", cursor: "pointer",
                    }}
                  />
                  <button
                    title="Delete file"
                    className="lp-card-delete"
                    onClick={e => { e.stopPropagation(); setConfirmMat(mat); }}
                  >
                    <TrashIcon size={14} />
                  </button>

                  <div
                    className="lp-material-thumb"
                    onClick={() => setSelectedMaterial(mat)}
                    style={{
                      display: "flex", alignItems: "center", justifyContent: "center",
                      background: "#F8F9FC", cursor: "pointer",
                    }}
                  >
                    <img
                      src={getFileIcon(mat)}
                      alt={mat.file_name}
                      style={{ width: 64, height: 64, objectFit: "contain" }}
                    />
                  </div>

                  <div style={{ background: "#fff", padding: "10px 10px 12px" }}>
                    <div style={{
                      fontSize: 10, color: "#9CA3AF", fontFamily: "sans-serif",
                      fontWeight: 500, marginBottom: 4, textTransform: "uppercase",
                      letterSpacing: ".4px",
                    }}>
                      {numberingLabel}
                    </div>

                    <div style={{ position: "relative", marginBottom: 4 }}>
                      <textarea
                        rows={1}
                        ref={node => {
                          if (node && !node.dataset.hInit) {
                            node.dataset.hInit = '1';
                            node.style.height = 'auto';
                            node.style.height = node.scrollHeight + 'px';
                          }
                        }}
                        value={currentNumbering}
                        placeholder={`e.g. ${folderType === 'module' ? 'Module 1 Part 1' : 'Module 1'}`}
                        onChange={e => {
                          handleNumberingChange(mat.id, e.target.value);
                          e.target.style.height = 'auto';
                          e.target.style.height = e.target.scrollHeight + 'px';
                        }}
                        onClick={e => e.stopPropagation()}
                        style={{
                          width: "100%", boxSizing: "border-box",
                          border: "1px solid #E5E7EB", borderRadius: 6,
                          padding: "5px 7px", fontSize: 12, fontFamily: "sans-serif",
                          resize: "none", overflow: "hidden", minHeight: 28,
                          lineHeight: 1.5, outline: "none", background: "#FAFAFA",
                          color: "#1E3A5F", fontWeight: 500,
                          transition: "border-color .15s",
                        }}
                        onFocus={e => e.target.style.borderColor = "#7c3aed"}
                        onBlur={e => e.target.style.borderColor = "#E5E7EB"}
                      />
                      {savedTick[mat.id] && (
                        <span style={{
                          position: "absolute", bottom: -14, right: 2,
                          fontSize: 10, color: "#059669", fontFamily: "sans-serif",
                        }}>✓ Saved</span>
                      )}
                    </div>

                    <div
                      style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 18, minWidth: 0 }}
                      onClick={e => e.stopPropagation()}
                    >
                      <Toggle
                        checked={mat.is_published}
                        onChange={v => handleToggle(mat, v)}
                        disabled={toggling === mat.id}
                      />
                      <span style={{ fontSize: 11, color: "#9CA3AF", fontFamily: "sans-serif", fontWeight: 400, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {mat.is_published ? "Published" : "Unpublished"}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function getPreviewKind(mat) {
  const name = (mat.file_name || "").toLowerCase();
  const ext = name.slice(name.lastIndexOf(".") + 1);

  if (mat.file_type === "pdf" || ext === "pdf") return "pdf";
  if (/^(jpe?g|png|gif|bmp|webp|svg|ico|avif|jfif)$/.test(ext)) return "image";
  if (/^(mp4|webm|ogv|m4v|mov)$/.test(ext)) return "video";
  if (/^(mp3|wav|aac|ogg|m4a|opus|flac|aiff)$/.test(ext)) return "audio";
  if (/^(docx?|dotx?|xlsx?|xlsm|pptx?|pps|ppsx|odt|ods|odp)$/.test(ext)) return "office";
  if (/^(txt|md|markdown|log|csv|tsv|json|xml|ya?ml|html?|css|js|jsx|ts|tsx|py|java|c|cpp|cs|rb|go|rs|sh)$/.test(ext))
    return "text";
  return "none";
}

function IframePreview({ src, title }) {
  const [loaded, setLoaded] = useState(false);
  return (
    <div className="lp-pv-frame-wrap">
      {!loaded && (
        <div className="lp-pv-loading">
          <span className="lp-up-spin" />
          <span>Loading preview…</span>
        </div>
      )}
      <iframe
        className="lp-pv-frame"
        src={src}
        title={title}
        onLoad={() => setLoaded(true)}
      />
    </div>
  );
}

function PreviewContent({ material }) {
  const kind = getPreviewKind(material);
  const url = material.file_url;

  if (kind === "image")
    return <img className="lp-pv-img" src={url} alt={material.file_name} />;

  if (kind === "pdf" || kind === "text")
    return <IframePreview src={url} title={material.file_name} />;

  if (kind === "office")
    return (
      <IframePreview
        src={`https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(url)}`}
        title={material.file_name}
      />
    );

  if (kind === "video")
    return <video className="lp-pv-video" src={url} controls />;

  if (kind === "audio")
    return (
      <div className="lp-pv-audio">
        <img src={getFileIcon(material)} alt="" className="lp-pv-audio-icon" />
        <audio src={url} controls className="lp-pv-audio-el" />
      </div>
    );

  return (
    <div className="lp-pv-none">
      <img src={getFileIcon(material)} alt="" className="lp-pv-none-icon" />
      <div className="lp-pv-none-title">Preview isn&apos;t available</div>
      <div className="lp-pv-none-sub">This file type can&apos;t be shown here - download it to view.</div>
    </div>
  );
}

function FilePreviewModal({ material, course, onClose }) {
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    const onKey = e => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [onClose]);

  async function handleDownload() {
    setDownloading(true);
    await downloadFile(material.file_url, buildDownloadName(material, course.code));
    setDownloading(false);
  }

  const title = material.module_numbering || material.file_name;

  return (
    <div
      className="lp-preview-overlay"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={`Preview of ${title}`}
    >
      <div className="lp-preview-modal" onClick={e => e.stopPropagation()}>
        <div className="lp-preview-header">
          <img src={getFileIcon(material)} alt="" className="lp-preview-ficon" />
          <div className="lp-preview-titles">
            <div className="lp-preview-title" title={title}>{title}</div>
            <div className="lp-preview-sub" title={material.file_name}>{material.file_name}</div>
          </div>
          <button className="lp-preview-close" onClick={onClose} aria-label="Close preview">
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M4.5 4.5l9 9M13.5 4.5l-9 9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <div className="lp-preview-body">
          <PreviewContent material={material} />
        </div>

        <div className="lp-preview-footer">
          <span className={`lp-preview-status${material.is_published ? " is-pub" : ""}`}>
            {material.is_published ? "Published" : "Unpublished"}
          </span>
          <button className="lp-preview-dl" onClick={handleDownload} disabled={downloading}>
            <DownloadIcon /> {downloading ? "Downloading…" : "Download"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function LecturerPortal() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [bootstrapping, setBootstrapping] = useState(true);

  useEffect(() => {
    document.title = "Lecturer Portal";
  }, []);

  useEffect(() => {
    let handled = false;

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        handled = true;
        loadProfile(session.user);
      } else {
        setBootstrapping(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user && !handled) {
        loadProfile(session.user);
      } else if (!session?.user) {
        handled = false;
        setUser(null);
        setProfile(null);
        setBootstrapping(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  async function loadProfile(u) {
    setUser(u);
    const { data } = await supabase
      .from("profiles").select("*").eq("id", u.id).single();
    setProfile(data);
    setBootstrapping(false);
  }

  if (bootstrapping) return (
    <div style={{
      minHeight: "100vh", width: "100%",
      display: "flex", alignItems: "center",
      justifyContent: "center", background: "#fff",
    }}>
      <Spinner />
    </div>
  );

  if (!user || !profile) return <AuthPage onAuth={loadProfile} />;

  if (selectedCourse) return (
    <CourseDetail
      course={selectedCourse}
      profile={profile}
      onBack={() => setSelectedCourse(null)}
    />
  );

  return <Dashboard profile={profile} onSelectCourse={setSelectedCourse} />;
}
