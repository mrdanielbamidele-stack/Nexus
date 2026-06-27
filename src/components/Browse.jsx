import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router'

// ── Data ─────────────────────────────────────────────────────────────────────
// Courses that actually have pages built -navigate to them.
// All others show an alert. Add codes here as you build more pages.
const AVAILABLE_COURSES = new Set([
  'COS101', 'CSC112', 'GST111', 'PHY101', 'PHY107', 'MTH101', 'STA111', 'GES101', 'GES103'
])

const DEPT_MAP = {
  ACC: 'Accounting',          AMS: 'Administration & Management',
  ANA: 'Anatomy',             ARC: 'Architecture',
  BCH: 'Biochemistry',        BIO: 'Biology',
  BTG: 'Biotechnology',       BUA: 'Business Administration',
  BUS: 'Business',            CEE: 'Civil Engineering',
  CHM: 'Chemistry',           CIL: 'Law',
  CLE: 'Law',                 CMS: 'Communication & Media Studies',
  COS: 'Computer Science',    CPE: 'Computer Engineering',
  CRS: 'Religious Studies',   CSC: 'Computer Science',
  CSS: 'Criminology & Security Studies',
  CYB: 'Cybersecurity',       DTS: 'Data Science',
  ECO: 'Economics',           EEE: 'Electrical Engineering',
  ENT: 'Entrepreneurship',    FAA: 'Graphics',
  GES: 'General Studies',     GET: 'Engineering',
  GOV: 'Government',          GST: 'General Studies',
  ICT: 'Information & Communication Technology',
  IFT: 'Information Technology',
  INS: 'Information Systems', JIL: 'Law',
  LAW: 'Law',                 LIT: 'Literature',
  MAS: 'Mass Communication',  MAT: 'Mathematics',
  MCB: 'Microbiology',        MCE: 'Mechatronics Engineering',
  MCM: 'Mass Communication',  MEE: 'Mechanical Engineering',
  MLS: 'Medical Laboratory Science',
  MOS: 'Management',          MTH: 'Mathematics',
  NSC: 'Nursing Science',     PGE: 'Petroleum Engineering',
  PHA: 'Pharmacology',        PHL: 'Philosophy',
  PHS: 'Public Health',       PHY: 'Physics',
  PIO: 'Physiology',          PPL: 'Law',
  PSY: 'Psychology',          PUL: 'Law',
  SEN: 'Software Engineering',SOC: 'Sociology',
  SSC: 'Social Sciences',     STA: 'Statistics',
}

function getDept(code) {
  const prefix = code.split(' ')[0]
  return DEPT_MAP[prefix] || prefix
}

const allPrimoCourses = [
  { code: "ACC 001", title: "Basic Financial Accounting" },
  { code: "ACC 002", title: "Basic Cost & Management Accounting" },
  { code: "ACC 101", title: "Introduction to Financial Accounting I" },
  { code: "ACC 201", title: "Financial Accounting I" },
  { code: "ACC 203", title: "Corporate Governance & Accounting Ethics" },
  { code: "ACC 301", title: "Financial Reporting I" },
  { code: "ACC 303", title: "Management Accounting" },
  { code: "ACC 305", title: "Taxation I" },
  { code: "ACC 307", title: "Auditing & Assurance I" },
  { code: "ACC 311", title: "Entrepreneurship in Accounting" },
  { code: "ACC 401", title: "Advanced Financial Reporting" },
  { code: "ACC 403", title: "Auditing & Assurance II" },
  { code: "ACC 405", title: "Bankruptcy & Liquidation" },
  { code: "ACC 413", title: "Analysis of Accounting Literatures" },
  { code: "AMS 101", title: "Principles of Management" },
  { code: "AMS 103", title: "Introduction to Computing" },
  { code: "ANA 201", title: "Anatomy of Upper & Lower Limb" },
  { code: "ANA 203", title: "General & Systemic Embryology" },
  { code: "ARC 101", title: "Introduction to Architecture" },
  { code: "ARC 201", title: "Architectural Design Studio I" },
  { code: "ARC 203", title: "Building Components & Methods I" },
  { code: "ARC 205", title: "History of World & Traditional Architecture" },
  { code: "ARC 207", title: "Building Structures I" },
  { code: "ARC 211", title: "Land Surveying I" },
  { code: "BCH 201", title: "General Biochemistry I" },
  { code: "BCH 203", title: "General Biochemistry Practical" },
  { code: "BCH 401", title: "Advanced Enzymology" },
  { code: "BCH 403", title: "Metabolic Regulations" },
  { code: "BCH 405", title: "Plant Biochemistry" },
  { code: "BCH 407", title: "Bioinformatics" },
  { code: "BCH 415", title: "Endocrinology" },
  { code: "BIO 001", title: "General Biology I" },
  { code: "BIO 001P", title: "General Biology Practical" },
  { code: "BIO 002", title: "Basic Botany" },
  { code: "BIO 101", title: "General Biology I" },
  { code: "BIO 107", title: "General Biology Practical I" },
  { code: "BTG 203", title: "Biotechnology Practical" },
  { code: "BTG 301", title: "Molecular Genetics" },
  { code: "BTG 302", title: "Molecular Cell Biology" },
  { code: "BTG 304", title: "Genetic Engineering" },
  { code: "BTG 305", title: "Techniques in Biotechnology" },
  { code: "BTG 309", title: "Food Biotechnology" },
  { code: "BTG 311", title: "Plant & Animal Cells Tissue Culture" },
  { code: "BTG 313", title: "Biotechnology for Animal Production" },
  { code: "BTG 315", title: "Bioinformatics" },
  { code: "BTG 401", title: "Biotechnology Seminar" },
  { code: "BTG 403", title: "Environmental Biotechnology" },
  { code: "BTG 405", title: "Industrial Biotechnology" },
  { code: "BTG 433", title: "Biotechnology Entrepreneurship" },
  { code: "BUA 101", title: "Introduction to Business I" },
  { code: "BUA 201", title: "Principles of Business Administration I" },
  { code: "BUA 203", title: "Business Statistics" },
  { code: "BUA 205", title: "Leadership & Governance" },
  { code: "BUA 303", title: "Management Theory" },
  { code: "BUA 305", title: "Financial Management" },
  { code: "BUA 313", title: "Innovation Management" },
  { code: "BUA 319", title: "E-Commerce" },
  { code: "BUA 321", title: "Business Start-up" },
  { code: "BUA 323", title: "Supply Chain Management" },
  { code: "BUA 401", title: "Business Policy" },
  { code: "BUA 406", title: "International Business" },
  { code: "BUA 409", title: "Management Information System" },
  { code: "BUA 411", title: "Analysis for Business Decision" },
  { code: "BUS 001", title: "Business & Its Environment" },
  { code: "BUS 002", title: "Finance & Accounting" },
  { code: "BUS 207", title: "Business Law" },
  { code: "CEE 101", title: "Introduction to Civil Engineering" },
  { code: "CEE 201", title: "Civil Engineering Drawing" },
  { code: "CEE 301", title: "Fluid Mechanics" },
  { code: "CEE 305", title: "Soil Mechanics I" },
  { code: "CEE 307", title: "Structural Mechanics I" },
  { code: "CHM 001", title: "General Chemistry I" },
  { code: "CHM 001P", title: "General Chemistry Practical" },
  { code: "CHM 002", title: "Physical Chemistry" },
  { code: "CHM 101", title: "General Chemistry I" },
  { code: "CHM 107", title: "General Chemistry Practical I" },
  { code: "CIL 201", title: "Law of Contract I" },
  { code: "CIL 303", title: "Commercial Law I" },
  { code: "CIL 501", title: "Labour Law I" },
  { code: "CLE 401", title: "Clinical & Moot Court Practice I" },
  { code: "CMS 101", title: "Introduction to Human Communication" },
  { code: "CMS 201", title: "History of Nigerian Media" },
  { code: "CMS 301", title: "Theories of Communication" },
  { code: "CMS 303", title: "Data Analysis in Communication Research" },
  { code: "CMS 401", title: "International Communication" },
  { code: "COS 101", title: "Introduction to Computing Sciences" },
  { code: "COS 201", title: "Computer Programming I" },
  { code: "COS 409", title: "Research Methodology & Technical Writing" },
  { code: "CPE 103", title: "Computer System Diagnostics & Maintenance" },
  { code: "CPE 301", title: "Computer Architecture & Organisation" },
  { code: "CPE 401", title: "Microprocessor & Embedded Systems" },
  { code: "CPE 403", title: "Control System Engineering I" },
  { code: "CPE 405", title: "Fundamentals of Software Engineering" },
  { code: "CPE 409", title: "Expert System Design" },
  { code: "CPE 411", title: "Hardware Design Techniques & Verification" },
  { code: "CPE 413", title: "Research Methods" },
  { code: "CPE 501", title: "Testing, Reliability & Maintainability" },
  { code: "CPE 503", title: "Mobile & Sensor Computing" },
  { code: "CPE 505", title: "Digital System Design with VHDL" },
  { code: "CPE 511", title: "Machine Learning & Applications" },
  { code: "CRS 001", title: "Old Testament Studies: History & Religion of Israel" },
  { code: "CRS 002", title: "New Testament Studies: The Synoptic Gospels" },
  { code: "CSC 203", title: "Discrete Structures" },
  { code: "CSC 301", title: "Data Structures" },
  { code: "CSC 308", title: "Operating Systems" },
  { code: "CSC 309", title: "Artificial Intelligence" },
  { code: "CSC 322", title: "Computer Science Innovation & New Ventures" },
  { code: "CSC 401", title: "Algorithms & Complexity Analysis" },
  { code: "CSC 411", title: "Introduction to Computer Graphics" },
  { code: "CSS 101", title: "Introduction to Criminology & Security Studies" },
  { code: "CSS 103", title: "Deviant Behaviours & Social Control" },
  { code: "CSS 201", title: "Nigerian Law Enforcement & Security System" },
  { code: "CSS 203", title: "Comparative Police & Policing Systems" },
  { code: "CSS 205", title: "Human Rights & Criminal Justice Systems" },
  { code: "CSS 207", title: "Prisons & Correction Services" },
  { code: "CSS 301", title: "Theories of Crime, Criminal Behaviour & Society" },
  { code: "CSS 303", title: "Research Methods in Criminology & Security" },
  { code: "CSS 305", title: "Forensic Science" },
  { code: "CSS 307", title: "Criminal Investigation" },
  { code: "CSS 403", title: "Contemporary Development in Criminology & Security" },
  { code: "CSS 405", title: "National & Transnational Organised Crimes" },
  { code: "CSS 407", title: "Determinants of Behaviour" },
  { code: "CYB 201", title: "Introduction to Cybersecurity & Strategy" },
  { code: "DTS 304", title: "Data Management I" },
  { code: "ECO 001", title: "Principles of Economics I" },
  { code: "ECO 002", title: "Principles of Economics II" },
  { code: "ECO 101", title: "Principles of Economics I" },
  { code: "ECO 103", title: "Introductory Mathematics I" },
  { code: "ECO 111", title: "Informal & Vocational Economies in Nigeria" },
  { code: "ECO 201", title: "Introduction to Microeconomics I" },
  { code: "ECO 203", title: "Introduction to Macroeconomics I" },
  { code: "ECO 205", title: "Structure of the Nigerian Economy" },
  { code: "ECO 207", title: "Mathematics for Economists" },
  { code: "ECO 301", title: "Intermediate Microeconomics I" },
  { code: "ECO 303", title: "Intermediate Macroeconomics I" },
  { code: "ECO 305", title: "History of Economic Thought" },
  { code: "ECO 307", title: "Project Evaluation" },
  { code: "ECO 401", title: "Advanced Microeconomics I" },
  { code: "ECO 403", title: "Advanced Macroeconomics I" },
  { code: "ECO 405", title: "Economic Planning" },
  { code: "ECO 407", title: "Fiscal Policy & Analysis" },
  { code: "EEE 311", title: "Electric Circuit Theory I" },
  { code: "EEE 321", title: "Analogue Electronic Circuits I" },
  { code: "EEE 405", title: "Fundamental of Reliability & Maintainability" },
  { code: "EEE 407", title: "Power Electronics & Drives" },
  { code: "EEE 501", title: "Power System Analysis" },
  { code: "ENT 211", title: "Entrepreneurship & Innovation" },
  { code: "ENT 312", title: "Venture Creation" },
  { code: "FAA 103", title: "Graphics Communication I" },
  { code: "FAA 221", title: "Introduction to Computer-Aided Design" },
  { code: "GES 101", title: "Law, Man & Society" },
  { code: "TUM-GES 103", title: "Character & Leadership Education I" },
  { code: "GES 201", title: "Emotional Intelligence & Critical Thinking" },
  { code: "GES 203", title: "Character & Leadership Education III" },
  { code: "GES 301", title: "Global Economy Literacy" },
  { code: "GES 303", title: "Character & Leadership Education V" },
  { code: "GES 401", title: "Anti-Corruption & Money Laundering Studies" },
  { code: "GES 403", title: "Character & Leadership Education VII" },
  { code: "GET 101", title: "Engineer in Society" },
  { code: "GET 201", title: "Applied Electricity I" },
  { code: "GET 203", title: "Engineering Graphics & Solid Modeling II" },
  { code: "GET 205", title: "Fundamentals of Fluid Mechanics" },
  { code: "GET 207", title: "Applied Mechanics" },
  { code: "GET 209", title: "Engineering Mathematics I" },
  { code: "GET 211", title: "Computing & Software Engineering" },
  { code: "GET 301", title: "Engineering Mathematics III" },
  { code: "GET 305", title: "Engineering Statistics & Data Analytics" },
  { code: "GET 307", title: "Introduction to Artificial Intelligence & Machine Learning" },
  { code: "GET 404", title: "Engineering Valuation & Costing" },
  { code: "GET 501", title: "Engineering Project Management" },
  { code: "GOV 001", title: "Elements of Government" },
  { code: "GOV 002", title: "Fundamentals of Government" },
  { code: "GST 111", title: "Communication in English Language" },
  { code: "ICT 305", title: "Data Communication System & Network" },
  { code: "IFT 211", title: "Digital Logic Design" },
  { code: "INS 401", title: "Project Management" },
  { code: "JIL 103", title: "Introduction to Human Rights I" },
  { code: "JIL 501", title: "Jurisprudence & Legal Theory I" },
  { code: "LAW 101", title: "English for Legal Writing" },
  { code: "LIT 001", title: "Introduction to Drama" },
  { code: "LIT 002", title: "Prose Fiction" },
  { code: "MAS 409", title: "Media & Society" },
  { code: "MAT 001", title: "Advanced Pure Mathematics" },
  { code: "MAT 002", title: "Calculus" },
  { code: "MCB 201", title: "Introduction to General Microbiology" },
  { code: "MCB 221", title: "General Microbiology I" },
  { code: "MCE 101", title: "Introduction to Mechatronics Engineering" },
  { code: "MCE 321", title: "Design of Mechatronics & Robotics Systems I" },
  { code: "MCM 101", title: "Foundations of Broadcasting & Film" },
  { code: "MCM 103", title: "Introduction to Advertising" },
  { code: "MCM 105", title: "Introduction to Book Publishing" },
  { code: "MCM 107", title: "Introduction to Photojournalism" },
  { code: "MCM 201", title: "Critical & Reviewing Writing" },
  { code: "MCM 207", title: "Radio/TV News Reporting" },
  { code: "MCM 209", title: "Drama, Film & Documentary Production" },
  { code: "MCM 211", title: "Basics of Screenwriting & Film Animation" },
  { code: "MCM 301", title: "Mass Communication & Politics" },
  { code: "MCM 303", title: "Gender & Communication" },
  { code: "MCM 309", title: "Commentary, Critical Writing & Public Affairs" },
  { code: "MCM 311", title: "Film Production & Screen Directing" },
  { code: "MCM 405", title: "Mass Media Law" },
  { code: "MCM 407", title: "Message Design for Development" },
  { code: "MEE 101", title: "Introduction to Mechanical Engineering" },
  { code: "MLS 201", title: "Introduction to Medical Laboratory Science" },
  { code: "MOS 311", title: "Management of Organisations" },
  { code: "MTH 101", title: "Elementary Mathematics I" },
  { code: "MTH 103", title: "Elementary Mathematics III" },
  { code: "MTH 201", title: "Mathematical Methods I" },
  { code: "NSC 201", title: "Foundation of Professional Nursing Practice I" },
  { code: "NSC 203", title: "Developmental Psychology" },
  { code: "NSC 301", title: "Epidemiology" },
  { code: "NSC 303", title: "Community/Public Health Nursing I" },
  { code: "NSC 306", title: "Medical-Surgical Nursing II" },
  { code: "NSC 307", title: "Human Nutrition" },
  { code: "NSC 309", title: "Nursing Ethics & Jurisprudence" },
  { code: "NSC 313", title: "Medical-Surgical Nursing I" },
  { code: "PGE 101", title: "Introduction to Petroleum & Gas Industry" },
  { code: "PGE 301", title: "Rock and Fluid Properties" },
  { code: "PGE 303", title: "Drilling and Well Design I" },
  { code: "PGE 305", title: "Oil & Gas Production Engineering I" },
  { code: "PGE 401", title: "Entrepreneurship & Startup in Oil & Gas Business" },
  { code: "PGE 402", title: "Formation Evaluation" },
  { code: "PGE 403", title: "Natural Gas Engineering" },
  { code: "PGE 406", title: "Well Test Analysis" },
  { code: "PGE 501", title: "Natural Gas Handling" },
  { code: "PGE 505", title: "Offshore Operations" },
  { code: "PHA 301", title: "Pharmacodynamics & Chemotherapy I" },
  { code: "PHL 105", title: "Introduction to Social & Political Philosophy" },
  { code: "PHS 201", title: "Introduction to Public Health" },
  { code: "PHS 203", title: "Principles of Epidemiology" },
  { code: "PHY 001", title: "Mechanics & Properties of Matter" },
  { code: "PHY 001P", title: "General Physics Practical" },
  { code: "PHY 002", title: "Heat, Waves & Optics" },
  { code: "PHY 101", title: "General Physics I" },
  { code: "PHY 103", title: "General Physics III" },
  { code: "PHY 107", title: "General Practical Physics I" },
  { code: "PIO 201", title: "Introductory Physiology & Blood" },
  { code: "PIO 203", title: "Physiology of Excitable Tissues" },
  { code: "PPL 301", title: "Law of Torts I" },
  { code: "PPL 401", title: "Maritime Law I" },
  { code: "PPL 403", title: "Equity & Trusts I" },
  { code: "PPL 405", title: "Property Law I" },
  { code: "PSY 101", title: "Introduction to Psychology" },
  { code: "PUL 101", title: "Legal Methods I" },
  { code: "PUL 201", title: "Constitutional Law I" },
  { code: "PUL 203", title: "Nigerian Legal System I" },
  { code: "PUL 301", title: "Criminal Law I" },
  { code: "PUL 304", title: "Environmental Law I" },
  { code: "PUL 401", title: "Law of Evidence I" },
  { code: "SEN 201", title: "Introduction to Software Engineering" },
  { code: "SEN 301", title: "Object-Oriented Analysis & Design" },
  { code: "SEN 304", title: "Software Testing & Quality Assurance" },
  { code: "SEN 306", title: "Software Construction" },
  { code: "SEN 322", title: "Software Engineering Innovation & New Ventures" },
  { code: "SEN 401", title: "Software Configuration Management" },
  { code: "SOC 101", title: "Introduction to Sociology" },
  { code: "SSC 301", title: "Innovation in the Social Sciences" },
  { code: "SSC 401", title: "Research Method II" },
  { code: "STA 111", title: "Descriptive Statistics" },
  { code: "STA 112", title: "Probability I" },
  { code: "STA 201", title: "Statistics for Agriculture & Biological Sciences" },
]

// ── Sub-components ────────────────────────────────────────────────────────────

function CourseCard({ course }) {
  const navigate = useNavigate()
  const slug = course.code.replace(/\s+/g, '')  // "COS 101" → "COS101"
  const isAvailable = AVAILABLE_COURSES.has(slug)

  function handleClick() {
    if (isAvailable) {
      navigate(`/courses/${slug}`)
    } else {
      alert('This course page hasn\'t been created yet.')
    }
  }

  return (
    <div className="card">
      <strong>{course.code}</strong>
      <div className="course-title">{course.title}</div>
      <button onClick={handleClick}>View Materials</button>
    </div>
  )
}

function DeptSection({ dept, courses }) {
  return (
    <div className="section">
      <h2 style={{ marginTop: 24, marginBottom: 16, color: 'var(--primary)' }}>{dept}</h2>
      <div className="cards">
        {courses.map(course => (
          <CourseCard key={course.code} course={course} />
        ))}
      </div>
    </div>
  )
}



export default function Browse() {
  const [query, setQuery] = useState('')

  // Filter + group -recomputed only when query changes
  const grouped = useMemo(() => {
    const term = query.toLowerCase().trim()
    const filtered = term
      ? allPrimoCourses.filter(c =>
          c.code.toLowerCase().includes(term) ||
          c.title.toLowerCase().includes(term) 
        )
      : allPrimoCourses

    // Group by department, then sort dept names alphabetically
    const map = {}
    filtered.forEach(course => {
      const dept = getDept(course.code)
      if (!map[dept]) map[dept] = []
      map[dept].push(course)
    })
    return Object.keys(map).sort().map(dept => ({ dept, courses: map[dept] }))
  }, [query])

  return (
    <div>
      <h1>Browse Courses</h1>
      <p className="muted">{allPrimoCourses.length} courses across all departments</p>

      <div className="search" style={{ marginBottom: 20 }}>
        <input
          type="text"
          placeholder="Search by course code or title..."
          autoComplete="off"
          value={query}
          onChange={e => setQuery(e.target.value)}
        />
      </div>

      {grouped.length === 0
        ? <p className="muted">No courses match your search.</p>
        : grouped.map(({ dept, courses }) => (
            <DeptSection key={dept} dept={dept} courses={courses} />
          ))
      }
    </div>
  )
}