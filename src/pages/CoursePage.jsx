import { useState, useEffect } from "react";
import { Link, useParams } from "react-router";
import { supabase } from "../lib/supabase";
import { normalizeCode, formatCode, isCourseCode } from "../lib/courseSlug";
import Sidebar from "../components/Sidebar";
import NotificationBell from "../components/NotificationBell";
import NotificationToast from "../components/NotificationToast";
import NotFound from './NotFound';
import '../../nexus-breadcrumb.css';
import './CoursePage.css';
import ScrollToTop from '../components/ScrollToTop';

const TYPE_LABELS = {
  outline:  "Outline",
  module:   "Available Modules",
  textbook: "Textbooks",
  library:  "Library Resources",
};

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

function getTypeLabel(mat) {
  const name = (mat.file_name || "").toLowerCase();
  const ext = name.slice(name.lastIndexOf(".") + 1);

  if (mat.file_type === "pdf" || ext === "pdf") return "PDF";
  // All picture formats share one friendly label.
  if (/^(jpe?g|png|gif|bmp|tiff?|webp|svg|ico|heic|heif|avif|jfif)$/.test(ext)) return "Image";
  if (mat.file_type === "video" || /^(mp4|mov|avi|mkv|wmv|flv|webm|m4v|mpe?g|3gp)$/.test(ext)) return "Video";
  if (/^(mp3|wav|flac|aac|ogg|m4a|wma|aiff|opus|midi?)$/.test(ext)) return "Audio";
  if (/^(docx?|dot|dotx|rtf|odt|pages)$/.test(ext)) return "Word Document";
  if (/^(xlsx?|xlsm|xlsb|xlt|xltx|ods|csv|tsv|numbers)$/.test(ext)) return "Spreadsheet";
  if (/^(pptx?|pps|ppsx|pot|potx|odp|key)$/.test(ext)) return "PowerPoint";
  if (/^(zip|rar|7z|tar|gz|bz2|xz|tgz|iso|cab|img)$/.test(ext)) return "Archive";
  // Everything else (html, css, js, txt, json, py…) keeps its own distinct name.
  if (ext && ext !== name) return `${ext.toUpperCase()} File`;
  return "File";
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
    <div className="cp-pv-frame-wrap">
      {!loaded && (
        <div className="cp-pv-loading">
          <span className="cp-pv-spin" />
          <span>Loading preview…</span>
        </div>
      )}
      <iframe
        className="cp-pv-frame"
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
    return <img className="cp-pv-img" src={url} alt={material.file_name} />;

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
    return <video className="cp-pv-video" src={url} controls />;

  if (kind === "audio")
    return (
      <div className="cp-pv-audio">
        <img src={getFileIcon(material)} alt="" className="cp-pv-audio-icon" />
        <audio src={url} controls className="cp-pv-audio-el" />
      </div>
    );

  return (
    <div className="cp-pv-none">
      <img src={getFileIcon(material)} alt="" className="cp-pv-none-icon" />
      <div className="cp-pv-none-title">Preview isn&apos;t available</div>
      <div className="cp-pv-none-sub">This file type can&apos;t be shown here -download it to view.</div>
    </div>
  );
}

function FilePreviewModal({ material, courseCode, onClose }) {
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
    await downloadMaterial(material, courseCode);
    setDownloading(false);
  }

  const title = material.module_numbering?.trim() || material.file_name;

  return (
    <div
      className="cp-preview-overlay"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={`Preview of ${title}`}
    >
      <div className="cp-preview-modal" onClick={e => e.stopPropagation()}>
        <div className="cp-preview-header">
          <img src={getFileIcon(material)} alt="" className="cp-preview-ficon" />
          <div className="cp-preview-titles">
            <div className="cp-preview-title" title={title}>{title}</div>
            <div className="cp-preview-sub" title={material.file_name}>{material.file_name}</div>
          </div>
          <button className="cp-preview-close" onClick={onClose} aria-label="Close preview">
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M4.5 4.5l9 9M13.5 4.5l-9 9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <div className="cp-preview-body">
          <PreviewContent material={material} />
        </div>

        <div className="cp-preview-footer">
          <button className="cp-preview-dl" onClick={handleDownload} disabled={downloading}>
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M9 2v9M6 8l3 3 3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M3 13v2a1 1 0 001 1h10a1 1 0 001-1v-2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            {downloading ? "Downloading…" : "Download"}
          </button>
        </div>
      </div>
    </div>
  );
}

async function downloadMaterial(material, courseCode) {
  const ext = material.file_name.includes('.')
    ? material.file_name.slice(material.file_name.lastIndexOf('.'))
    : '';
  const label = material.module_numbering?.trim() || material.file_name.replace(/\.[^.]+$/, '');
  const downloadName = `${courseCode} ${label}${ext}`;
  try {
    const res = await fetch(material.file_url);
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
    window.open(material.file_url, '_blank');
  }
}

function MaterialCard({ material, courseCode }) {
  const [downloading, setDownloading] = useState(false);
  const [mode, setMode] = useState('download');
  const [previewing, setPreviewing] = useState(false);
  const displayTitle = material.module_numbering?.trim()
    || material.file_name.replace(/\.[^.]+$/, '');
  const typeLabel = getTypeLabel(material);

  async function handleGo() {
    if (mode === 'preview') {
      setPreviewing(true);
    } else {
      setDownloading(true);
      await downloadMaterial(material, courseCode);
      setDownloading(false);
    }
  }

  const goLabel = downloading ? "Downloading…"
    : mode === 'preview' ? `Preview ${typeLabel}`
    : `Download ${typeLabel}`;

  return (
    <div className="cp-card">
      {previewing && (
        <FilePreviewModal
          material={material}
          courseCode={courseCode}
          onClose={() => setPreviewing(false)}
        />
      )}
      <strong>{displayTitle}</strong>

      <div className="cp-mode-selector">
        <button
          className={`cp-mode-btn${mode === 'preview' ? ' selected' : ''}`}
          onClick={() => setMode('preview')}
        >
          <span className="cp-mode-icon"></span>
          <span className="cp-mode-text">
            <span className="cp-mode-label">Preview {typeLabel}</span>
            <span className="cp-mode-desc">View in your browser</span>
          </span>
          <span className="cp-radio-dot" />
        </button>

        <button
          className={`cp-mode-btn${mode === 'download' ? ' selected' : ''}`}
          onClick={() => setMode('download')}
        >
          <span className="cp-mode-icon"></span>
          <span className="cp-mode-text">
            <span className="cp-mode-label">Download {typeLabel}</span>
            <span className="cp-mode-desc">Save to your device</span>
          </span>
          <span className="cp-radio-dot" />
        </button>
      </div>

      <button
        className={`cp-go-btn${downloading ? ' cp-btn-busy' : ''}`}
        onClick={handleGo}
        disabled={downloading}
      >
        {goLabel}
      </button>
    </div>
  );
}

function TypeGroup({ title, materials, courseCode }) {
  if (!materials.length) return null;
  return (
    <div className="cp-section">
      <h2>{title}</h2>
      <div className="cp-cards">
        {materials.map(m => (
          <MaterialCard key={m.id} material={m} courseCode={courseCode} />
        ))}
      </div>
    </div>
  );
}

export default function CoursePage() {
  const { courseCode } = useParams();
  const [course, setCourse]         = useState(null);
  const [materials, setMaterials]   = useState([]);
  const [library, setLibrary]       = useState([]);
  const [search, setSearch]         = useState("");
  const [loading, setLoading]       = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    document.title = courseCode ? courseCode.toUpperCase() : "Nexus";
  }, [courseCode]);

  useEffect(() => {
    const handleResize = () => { if (window.innerWidth >= 768) setSidebarOpen(false); };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    // Paths that don't look like a course code (e.g. "/about") never hit the
    // DB -they fall through to the generic 404 below.
    if (!isCourseCode(courseCode)) { setLoading(false); return; }
    async function load() {
      setLoading(true);
      const { data: courses } = await supabase.from("courses").select("*");
      const courseData = courses?.find(
        c => normalizeCode(c.code) === normalizeCode(courseCode)
      );
      if (!courseData) { setLoading(false); return; }
      setCourse(courseData);

      const { data: mats } = await supabase
        .from("course_materials")
        .select("*")
        .eq("course_id", courseData.code)
        .eq("is_published", true)
        .order("created_at");

      setMaterials(mats || []);

      // Library resources uploaded by the school library for this course.
      // Map `title` onto `module_numbering` so the existing MaterialCard /
      // downloadMaterial helpers work unchanged.
      const { data: lib } = await supabase
        .from("library_resources")
        .select("*")
        .eq("course_id", courseData.code)
        .order("created_at");

      setLibrary((lib || []).map(r => ({ ...r, type: "library", module_numbering: r.title })));
      setLoading(false);
    }
    load();

    const channel = supabase
      .channel("materials-realtime")
      .on("postgres_changes", {
        event: "*", schema: "public", table: "course_materials",
      }, () => load())
      .on("postgres_changes", {
        event: "*", schema: "public", table: "library_resources",
      }, () => load())
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [courseCode]);

  const term = search.toLowerCase().replace(/\s+/g, "");
  const filtered = materials.filter(m =>
    m.file_name.toLowerCase().replace(/\s+/g, "").includes(term) ||
    (m.module_numbering || "").toLowerCase().replace(/\s+/g, "").includes(term) ||
    (m.type || "").toLowerCase().includes(term)
  );

  const outlines  = filtered.filter(m => m.type === "outline");
  const modules   = filtered.filter(m => m.type === "module");
  const textbooks = filtered.filter(m => m.type === "textbook");

  const libraryFiltered = library.filter(m =>
    m.file_name.toLowerCase().replace(/\s+/g, "").includes(term) ||
    (m.title || "").toLowerCase().replace(/\s+/g, "").includes(term)
  );

  // Not a course-shaped path (no trailing number) -> generic 404, not the
  // course-specific "course not found" screen.
  if (!isCourseCode(courseCode)) {
    return <NotFound />
  }

  return (
    <div className="app cp-app">
       <ScrollToTop />
      {/* Hamburger -mobile only */}
      <button
        className={`menu-btn ${sidebarOpen ? "hidden" : ""}`}
        onClick={() => setSidebarOpen(true)}
      >☰</button>

      {/* Dark overlay -mobile only */}
      <div
        className={`overlay ${sidebarOpen ? "active" : ""}`}
        onClick={() => setSidebarOpen(false)}
      />

      <Sidebar
        isOpen={sidebarOpen}
        onNavClick={() => setSidebarOpen(false)}
      />

      {/* Notification bell - fixed top-right */}
      <div className="nx-bell-fixed">
        <NotificationBell />
      </div>

      <NotificationToast />

      <main className="main">
        {/* Breadcrumb */}
        <nav className="nx-breadcrumb cp-breadcrumb nx-fixed" aria-label="breadcrumb" style={{ marginBottom: 24 }}>
          <Link className="nx-bc-item nx-bc-prev" to="/dashboard">
            <span className="nx-bc-home-dot"></span>
            Dashboard
          </Link>
          <span className="nx-bc-sep">/</span>
          <span className="nx-bc-item nx-bc-current">
            {formatCode(courseCode)}
          </span>
        </nav>

        {loading ? (
          <div style={{ display: "flex", justifyContent: "center", paddingTop: 80 }}>
            <div className="cp-spinner" />
          </div>
        ) : !course ? (
          <NotFound
            title="404 - Course not found"
            message={`We couldn't find ${formatCode(courseCode) || 'that course'}. It may have been moved or never existed.`}
            homeTo="/dashboard"
            homeLabel="Back to Dashboard"
          />
        ) : (
          <>
            <h1 style={{ marginTop: 15  , marginBottom: -10 }}>{formatCode(course.code)} Materials</h1>
            <p className="muted">All available materials for this course.</p>


            <div className="cp-search">
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search materials…"
                type="text"
                autoComplete="off"
              />
            </div>

            <TypeGroup title={TYPE_LABELS.outline}  materials={outlines}  courseCode={course.code} />
            <TypeGroup title={TYPE_LABELS.module}   materials={modules}   courseCode={course.code} />
            <TypeGroup title={TYPE_LABELS.textbook} materials={textbooks} courseCode={course.code} />
            <TypeGroup title={TYPE_LABELS.library}  materials={libraryFiltered} courseCode={course.code} />

            {!outlines.length && !modules.length && !textbooks.length && !libraryFiltered.length && (
              <p className="muted" style={{ paddingTop: 40 }}>
                {search ? "No materials match your search." : "No published materials yet."}
              </p>
            )}
          </>
        )}
      </main>
    </div>
  );
}
