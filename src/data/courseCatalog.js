// Course catalog for the 2026/2027 Primo (first) semester.
// Programmes, levels and course codes come from the 2026/2027 PRIMO SEMESTER TIMETABLES PDF.
// creditHours = hours per week in that programme/level timetable (New Horizons courses = 2).
// years = 1 for every course. Titles: taken from the previous catalog or the timetable footer
// where available; the remaining titles are best-guess and should be confirmed.
export const courseCatalog = {
  "Civil Engineering": {
    "100": [
      { code: "CEE 101", title: "Introduction to Civil Engineering", creditHours: 1, years: 1 },
      { code: "CHM 101", title: "General Chemistry I", creditHours: 2, years: 1 },
      { code: "CHM 107", title: "General Practical Chemistry I", creditHours: 2, years: 1 },
      { code: "TUM-GES 101", title: "Lawman and society", creditHours: 1, years: 1 },
      { code: "TUM-GES 103", title: "Character & Leadership Education 1", creditHours: 1, years: 1 },
      { code: "GET 101", title: "Engineer in Society", creditHours: 1, years: 1 },
      { code: "GST 111", title: "Communication in English Language", creditHours: 2, years: 1 },
      { code: "MTH 101", title: "Elementary Mathematics I", creditHours: 2, years: 1 },
      { code: "MTH 103", title: "Elementary Mathematics III", creditHours: 2, years: 1 },
      { code: "TUM-NHV 150", title: "AutoCAD 2D", creditHours: 2, years: 1 },
      { code: "PHY 101", title: "General Physics I", creditHours: 2, years: 1 },
      { code: "PHY 103", title: "General Physics III", creditHours: 2, years: 1 },
      { code: "PHY 107", title: "General Practical Physics I", creditHours: 2, years: 1 },
      { code: "STA 112", title: "Probability I", creditHours: 3, years: 1 }
    ],
    "200": [
      { code: "CEE 201", title: "Civil Engineering Drawing", creditHours: 2, years: 1 },
      { code: "ENT 211", title: "Entrepreneurship & Innovation", creditHours: 2, years: 1 },
      { code: "TUM-GES 201", title: "Emotional Intelligence & Critical Thinking", creditHours: 1, years: 1 },
      { code: "TUM-GES 203", title: "Character & Leadership Education 3", creditHours: 1, years: 1 },
      { code: "GET 201", title: "Applied Electricity I", creditHours: 3, years: 1 },
      { code: "GET 205", title: "Fundamentals of Fluid Mechanics", creditHours: 3, years: 1 },
      { code: "GET 207", title: "Applied Mechanics", creditHours: 3, years: 1 },
      { code: "GET 209", title: "Engineering Mathematics I", creditHours: 3, years: 1 },
      { code: "GET 211", title: "Computing & Software Engineering", creditHours: 3, years: 1 },
      { code: "TUM-NHV 250", title: "Revit 1", creditHours: 2, years: 1 }
    ],
    "300": [
      { code: "CEE 301", title: "Structural Analysis I", creditHours: 3, years: 1 },
      { code: "CEE 305", title: "Soil Mechanics I", creditHours: 3, years: 1 },
      { code: "CEE 307", title: "Hydraulics", creditHours: 2, years: 1 },
      { code: "ENT 312", title: "Venture Creation", creditHours: 2, years: 1 },
      { code: "TUM-GES 301", title: "Peace & Conflict Resolution", creditHours: 1, years: 1 },
      { code: "TUM-GES 303", title: "Character & Leadership Education 5", creditHours: 1, years: 1 },
      { code: "GET 301", title: "Engineering Mathematics III", creditHours: 3, years: 1 },
      { code: "TUM-GET 301", title: "Engineering Statistics", creditHours: 3, years: 1 },
      { code: "GET 305", title: "Engineering Statistics and Data Analytics", creditHours: 3, years: 1 },
      { code: "GET 307", title: "Introduction to Artificial Intelligence, Machine Learning and Convergent Technologies", creditHours: 3, years: 1 },
      { code: "TUM-MOS 311", title: "Moral and Ethical Studies", creditHours: 3, years: 1 },
      { code: "TUM-NHV 350", title: "Enscape", creditHours: 2, years: 1 }
    ],
    "400": [
      { code: "TUM-CEE 401", title: "Reinforced Concrete Design", creditHours: 2, years: 1 },
      { code: "TUM-CEE 405", title: "Steel Design", creditHours: 2, years: 1 },
      { code: "CEE 406", title: "Highway Engineering", creditHours: 3, years: 1 },
      { code: "TUM-CEE 407", title: "Foundation Engineering", creditHours: 2, years: 1 },
      { code: "TUM-CEE 409", title: "Water Resources Engineering", creditHours: 2, years: 1 },
      { code: "TUM-CEE 411", title: "Construction Management", creditHours: 3, years: 1 },
      { code: "TUM-CEE 413", title: "Computer Applications in Civil Engineering", creditHours: 2, years: 1 },
      { code: "TUM-GES 401", title: "Professional Ethics & Career Development", creditHours: 1, years: 1 },
      { code: "TUM-GES 403", title: "Character & Leadership Education 7", creditHours: 1, years: 1 },
      { code: "GET 404", title: "Engineering Valuation and Appraisal", creditHours: 2, years: 1 },
      { code: "TUM-NHV 450", title: "3D Technology, Modeling and Printing using Autodesk Fusion", creditHours: 2, years: 1 }
    ],
    "500": [
      { code: "GET 501", title: "Engineering Project Management", creditHours: 3, years: 1 },
      { code: "TUM-NHV 550", title: "3D Technology, Modeling & Printing (Autodesk Fusion) 1 & 2", creditHours: 2, years: 1 }
    ]
  },
  "Computer Engineering": {
    "100": [
      { code: "TUM-CPE 103", title: "Introduction to Computer Engineering", creditHours: 2, years: 1 },
      { code: "TUM-EEE 101", title: "Introduction to Electrical and Electronic Engineering", creditHours: 2, years: 1 },
      { code: "TUM-FEN 150", title: "CompTIA A+ Core 1", creditHours: 2, years: 1 },
      { code: "TUM-GES 101", title: "Lawman and society", creditHours: 1, years: 1 },
      { code: "TUM-GES 103", title: "Character & Leadership Education 1", creditHours: 1, years: 1 },
      { code: "GET 101", title: "Engineer in Society", creditHours: 1, years: 1 },
      { code: "GST 111", title: "Communication in English Language", creditHours: 2, years: 1 },
      { code: "MTH 101", title: "Elementary Mathematics I", creditHours: 2, years: 1 },
      { code: "MTH 103", title: "Elementary Mathematics III", creditHours: 2, years: 1 },
      { code: "PHY 101", title: "General Physics I", creditHours: 2, years: 1 },
      { code: "PHY 103", title: "General Physics III", creditHours: 2, years: 1 },
      { code: "PHY 107", title: "General Practical Physics I", creditHours: 2, years: 1 },
      { code: "STA 112", title: "Probability I", creditHours: 3, years: 1 }
    ],
    "200": [
      { code: "ENT 211", title: "Entrepreneurship & Innovation", creditHours: 2, years: 1 },
      { code: "TUM-FEN 250", title: "Autodesk Inventor", creditHours: 2, years: 1 },
      { code: "TUM-GES 201", title: "Emotional Intelligence & Critical Thinking", creditHours: 1, years: 1 },
      { code: "TUM-GES 203", title: "Character & Leadership Education 3", creditHours: 1, years: 1 },
      { code: "GET 201", title: "Applied Electricity I", creditHours: 3, years: 1 },
      { code: "GET 203", title: "Engineering Graphics & Solid Modeling II", creditHours: 2, years: 1 },
      { code: "GET 205", title: "Fundamentals of Fluid Mechanics", creditHours: 3, years: 1 },
      { code: "GET 207", title: "Applied Mechanics", creditHours: 3, years: 1 },
      { code: "GET 209", title: "Engineering Mathematics I", creditHours: 3, years: 1 },
      { code: "GET 211", title: "Computing & Software Engineering", creditHours: 3, years: 1 }
    ],
    "300": [
      { code: "CPE 301", title: "Computer Organisation and Architecture", creditHours: 2, years: 1 },
      { code: "TUM-CPE 307", title: "Microprocessors and Microcontrollers", creditHours: 2, years: 1 },
      { code: "TUM-CPE 309", title: "Digital Systems Design", creditHours: 2, years: 1 },
      { code: "EEE 321", title: "Analogue Electronic Circuits I", creditHours: 2, years: 1 },
      { code: "ENT 312", title: "Venture Creation", creditHours: 2, years: 1 },
      { code: "TUM-FEN 350", title: "3D Technology with Autodesk Fusion", creditHours: 2, years: 1 },
      { code: "TUM-GES 301", title: "Peace & Conflict Resolution", creditHours: 1, years: 1 },
      { code: "TUM-GES 303", title: "Character & Leadership Education 5", creditHours: 1, years: 1 },
      { code: "GET 301", title: "Engineering Mathematics III", creditHours: 3, years: 1 },
      { code: "TUM-GET 301", title: "Engineering Statistics", creditHours: 3, years: 1 },
      { code: "GET 305", title: "Engineering Statistics and Data Analytics", creditHours: 3, years: 1 },
      { code: "GET 307", title: "Introduction to Artificial Intelligence, Machine Learning and Convergent Technologies", creditHours: 3, years: 1 },
      { code: "TUM-MOS 311", title: "Moral and Ethical Studies", creditHours: 3, years: 1 }
    ],
    "400": [
      { code: "CPE 401", title: "Computer Networks", creditHours: 3, years: 1 },
      { code: "CPE 403", title: "Control Systems", creditHours: 2, years: 1 },
      { code: "CPE 405", title: "Embedded Systems Design", creditHours: 2, years: 1 },
      { code: "TUM-CPE 407", title: "Real-Time Systems", creditHours: 2, years: 1 },
      { code: "TUM-CPE 409", title: "Computer Engineering Seminar", creditHours: 3, years: 1 },
      { code: "CPE 411", title: "Software Engineering", creditHours: 2, years: 1 },
      { code: "CPE 413", title: "Computer Graphics", creditHours: 2, years: 1 },
      { code: "TUM-CPE 415", title: "Mobile Computing", creditHours: 2, years: 1 },
      { code: "TUM-CPE 417", title: "Internet of Things", creditHours: 2, years: 1 },
      { code: "TUM-FEN 450", title: "Python Programming", creditHours: 2, years: 1 },
      { code: "TUM-GES 401", title: "Professional Ethics & Career Development", creditHours: 1, years: 1 },
      { code: "TUM-GES 403", title: "Character & Leadership Education 7", creditHours: 1, years: 1 },
      { code: "GET 404", title: "Engineering Valuation and Appraisal", creditHours: 2, years: 1 }
    ],
    "500": [
      { code: "CPE 501", title: "Computer Engineering Project I", creditHours: 2, years: 1 },
      { code: "TUM-CPE 503", title: "VLSI Design", creditHours: 2, years: 1 },
      { code: "CPE 505", title: "Digital Image Processing", creditHours: 2, years: 1 },
      { code: "TUM-CPE 507", title: "Cybersecurity Engineering", creditHours: 3, years: 1 },
      { code: "TUM-CPE 509", title: "Robotics", creditHours: 2, years: 1 },
      { code: "CPE 511", title: "Reliability Engineering", creditHours: 3, years: 1 },
      { code: "TUM-FEN 550", title: "Artificial Intelligence", creditHours: 2, years: 1 },
      { code: "GET 501", title: "Engineering Project Management", creditHours: 3, years: 1 }
    ]
  },
  "Electrical and Electronics Engineering": {
    "100": [
      { code: "CHM 101", title: "General Chemistry I", creditHours: 2, years: 1 },
      { code: "CHM 107", title: "General Practical Chemistry I", creditHours: 2, years: 1 },
      { code: "TUM-EEE 101", title: "Introduction to Electrical and Electronic Engineering", creditHours: 2, years: 1 },
      { code: "TUM-FEN 150", title: "CompTIA A+ Core 1", creditHours: 2, years: 1 },
      { code: "TUM-GES 101", title: "Lawman and society", creditHours: 1, years: 1 },
      { code: "TUM-GES 103", title: "Character & Leadership Education 1", creditHours: 1, years: 1 },
      { code: "GET 101", title: "Engineer in Society", creditHours: 1, years: 1 },
      { code: "GST 111", title: "Communication in English Language", creditHours: 2, years: 1 },
      { code: "MTH 101", title: "Elementary Mathematics I", creditHours: 2, years: 1 },
      { code: "MTH 103", title: "Elementary Mathematics III", creditHours: 2, years: 1 },
      { code: "PHY 101", title: "General Physics I", creditHours: 2, years: 1 },
      { code: "PHY 103", title: "General Physics III", creditHours: 2, years: 1 },
      { code: "PHY 107", title: "General Practical Physics I", creditHours: 2, years: 1 },
      { code: "STA 112", title: "Probability I", creditHours: 3, years: 1 }
    ],
    "200": [
      { code: "ENT 211", title: "Entrepreneurship & Innovation", creditHours: 2, years: 1 },
      { code: "TUM-FEN 250", title: "Autodesk Inventor", creditHours: 2, years: 1 },
      { code: "TUM-GES 201", title: "Emotional Intelligence & Critical Thinking", creditHours: 1, years: 1 },
      { code: "TUM-GES 203", title: "Character & Leadership Education 3", creditHours: 1, years: 1 },
      { code: "GET 201", title: "Applied Electricity I", creditHours: 3, years: 1 },
      { code: "GET 203", title: "Engineering Graphics & Solid Modeling II", creditHours: 2, years: 1 },
      { code: "GET 205", title: "Fundamentals of Fluid Mechanics", creditHours: 3, years: 1 },
      { code: "GET 207", title: "Applied Mechanics", creditHours: 3, years: 1 },
      { code: "GET 209", title: "Engineering Mathematics I", creditHours: 3, years: 1 },
      { code: "GET 211", title: "Computing & Software Engineering", creditHours: 3, years: 1 }
    ],
    "300": [
      { code: "EEE 311", title: "Electric Circuit Theory I", creditHours: 2, years: 1 },
      { code: "TUM-EEE 315", title: "Electrical Machines I", creditHours: 2, years: 1 },
      { code: "EEE 321", title: "Analogue Electronic Circuits I", creditHours: 2, years: 1 },
      { code: "ENT 312", title: "Venture Creation", creditHours: 2, years: 1 },
      { code: "TUM-FEN 350", title: "3D Technology with Autodesk Fusion", creditHours: 2, years: 1 },
      { code: "TUM-GES 301", title: "Peace & Conflict Resolution", creditHours: 1, years: 1 },
      { code: "TUM-GES 303", title: "Character & Leadership Education 5", creditHours: 1, years: 1 },
      { code: "GET 301", title: "Engineering Mathematics III", creditHours: 3, years: 1 },
      { code: "TUM-GET 301", title: "Engineering Statistics", creditHours: 3, years: 1 },
      { code: "GET 305", title: "Engineering Statistics and Data Analytics", creditHours: 3, years: 1 },
      { code: "GET 307", title: "Introduction to Artificial Intelligence, Machine Learning and Convergent Technologies", creditHours: 3, years: 1 },
      { code: "TUM-MOS 311", title: "Moral and Ethical Studies", creditHours: 3, years: 1 }
    ],
    "400": [
      { code: "CPE 401", title: "Computer Networks", creditHours: 3, years: 1 },
      { code: "CPE 403", title: "Control Systems", creditHours: 2, years: 1 },
      { code: "TUM-EEE 401", title: "Power Systems Analysis", creditHours: 2, years: 1 },
      { code: "TUM-EEE 405", title: "Power Electronics", creditHours: 2, years: 1 },
      { code: "TUM-EEE 407", title: "Electrical Machines II", creditHours: 2, years: 1 },
      { code: "TUM-EEE 409", title: "Communication Principles", creditHours: 2, years: 1 },
      { code: "TUM-EEE 417", title: "Digital Signal Processing", creditHours: 2, years: 1 },
      { code: "TUM-EEE 423", title: "Instrumentation and Measurement", creditHours: 2, years: 1 },
      { code: "TUM-FEN 450", title: "Python Programming", creditHours: 2, years: 1 },
      { code: "TUM-GES 401", title: "Professional Ethics & Career Development", creditHours: 1, years: 1 },
      { code: "TUM-GES 403", title: "Character & Leadership Education 7", creditHours: 1, years: 1 },
      { code: "GET 404", title: "Engineering Valuation and Appraisal", creditHours: 2, years: 1 }
    ],
    "500": [
      { code: "CPE 505", title: "Digital Image Processing", creditHours: 2, years: 1 },
      { code: "CPE 511", title: "Reliability Engineering", creditHours: 3, years: 1 },
      { code: "TUM-EEE 501", title: "Power System Protection", creditHours: 2, years: 1 },
      { code: "TUM-EEE 507", title: "High Voltage Engineering", creditHours: 2, years: 1 },
      { code: "TUM-EEE 509", title: "Renewable Energy Systems", creditHours: 2, years: 1 },
      { code: "TUM-FEN 550", title: "Artificial Intelligence", creditHours: 2, years: 1 },
      { code: "GET 501", title: "Engineering Project Management", creditHours: 3, years: 1 }
    ]
  },
  "Mechanical Engineering": {
    "100": [
      { code: "CHM 101", title: "General Chemistry I", creditHours: 2, years: 1 },
      { code: "CHM 107", title: "General Practical Chemistry I", creditHours: 2, years: 1 },
      { code: "TUM-EEE 101", title: "Introduction to Electrical and Electronic Engineering", creditHours: 2, years: 1 },
      { code: "TUM-FEN 150", title: "CompTIA A+ Core 1", creditHours: 2, years: 1 },
      { code: "TUM-GES 101", title: "Lawman and society", creditHours: 1, years: 1 },
      { code: "TUM-GES 103", title: "Character & Leadership Education 1", creditHours: 1, years: 1 },
      { code: "GET 101", title: "Engineer in Society", creditHours: 1, years: 1 },
      { code: "GST 111", title: "Communication in English Language", creditHours: 2, years: 1 },
      { code: "MEE 101", title: "Introduction to Mechanical Engineering", creditHours: 2, years: 1 },
      { code: "MTH 101", title: "Elementary Mathematics I", creditHours: 2, years: 1 },
      { code: "MTH 103", title: "Elementary Mathematics III", creditHours: 2, years: 1 },
      { code: "PHY 101", title: "General Physics I", creditHours: 2, years: 1 },
      { code: "PHY 103", title: "General Physics III", creditHours: 2, years: 1 },
      { code: "PHY 107", title: "General Practical Physics I", creditHours: 2, years: 1 },
      { code: "STA 112", title: "Probability I", creditHours: 3, years: 1 }
    ],
    "200": [
      { code: "ENT 211", title: "Entrepreneurship & Innovation", creditHours: 2, years: 1 },
      { code: "TUM-FEN 250", title: "Autodesk Inventor", creditHours: 2, years: 1 },
      { code: "TUM-GES 201", title: "Emotional Intelligence & Critical Thinking", creditHours: 1, years: 1 },
      { code: "TUM-GES 203", title: "Character & Leadership Education 3", creditHours: 1, years: 1 },
      { code: "GET 201", title: "Applied Electricity I", creditHours: 3, years: 1 },
      { code: "GET 203", title: "Engineering Graphics & Solid Modeling II", creditHours: 2, years: 1 },
      { code: "GET 205", title: "Fundamentals of Fluid Mechanics", creditHours: 3, years: 1 },
      { code: "GET 207", title: "Applied Mechanics", creditHours: 3, years: 1 },
      { code: "GET 209", title: "Engineering Mathematics I", creditHours: 3, years: 1 },
      { code: "GET 211", title: "Computing & Software Engineering", creditHours: 3, years: 1 }
    ],
    "300": [
      { code: "ENT 312", title: "Venture Creation", creditHours: 2, years: 1 },
      { code: "TUM-FEN 350", title: "3D Technology with Autodesk Fusion", creditHours: 2, years: 1 },
      { code: "TUM-GES 301", title: "Peace & Conflict Resolution", creditHours: 1, years: 1 },
      { code: "TUM-GES 303", title: "Character & Leadership Education 5", creditHours: 1, years: 1 },
      { code: "GET 301", title: "Engineering Mathematics III", creditHours: 3, years: 1 },
      { code: "TUM-GET 301", title: "Engineering Statistics", creditHours: 3, years: 1 },
      { code: "GET 305", title: "Engineering Statistics and Data Analytics", creditHours: 3, years: 1 },
      { code: "GET 307", title: "Introduction to Artificial Intelligence, Machine Learning and Convergent Technologies", creditHours: 3, years: 1 },
      { code: "TUM-MEE 301", title: "Fluid Mechanics II", creditHours: 2, years: 1 },
      { code: "TUM-MEE 307", title: "Machine Design I", creditHours: 2, years: 1 },
      { code: "TUM-MOS 311", title: "Moral and Ethical Studies", creditHours: 3, years: 1 }
    ],
    "400": [
      { code: "TUM-FEN 450", title: "Python Programming", creditHours: 2, years: 1 },
      { code: "TUM-GES 401", title: "Professional Ethics & Career Development", creditHours: 1, years: 1 },
      { code: "TUM-GES 403", title: "Character & Leadership Education 7", creditHours: 1, years: 1 },
      { code: "GET 404", title: "Engineering Valuation and Appraisal", creditHours: 2, years: 1 },
      { code: "MEE 401", title: "Heat Transfer", creditHours: 2, years: 1 },
      { code: "TUM-MEE 401", title: "Thermodynamics II", creditHours: 1, years: 1 },
      { code: "MEE 402", title: "Refrigeration and Air Conditioning", creditHours: 2, years: 1 },
      { code: "MEE 403", title: "Machine Design II", creditHours: 2, years: 1 },
      { code: "TUM-MEE 403", title: "Manufacturing Processes", creditHours: 2, years: 1 },
      { code: "MEE 404", title: "Internal Combustion Engines", creditHours: 2, years: 1 },
      { code: "MEE 405", title: "Production Engineering", creditHours: 3, years: 1 },
      { code: "TUM-MEE 405", title: "Industrial Engineering", creditHours: 2, years: 1 },
      { code: "MEE 407", title: "Mechanical Vibrations", creditHours: 2, years: 1 }
    ],
    "500": [
      { code: "CPE 403", title: "Control Systems", creditHours: 2, years: 1 },
      { code: "TUM-FEN 550", title: "Artificial Intelligence", creditHours: 2, years: 1 },
      { code: "GET 501", title: "Engineering Project Management", creditHours: 3, years: 1 }
    ]
  },
  "Mechatronics Engineering": {
    "100": [
      { code: "CHM 101", title: "General Chemistry I", creditHours: 2, years: 1 },
      { code: "TUM-CPE 103", title: "Introduction to Computer Engineering", creditHours: 2, years: 1 },
      { code: "TUM-EEE 101", title: "Introduction to Electrical and Electronic Engineering", creditHours: 2, years: 1 },
      { code: "TUM-FEN 150", title: "CompTIA A+ Core 1", creditHours: 2, years: 1 },
      { code: "TUM-GES 101", title: "Lawman and society", creditHours: 1, years: 1 },
      { code: "GET 101", title: "Engineer in Society", creditHours: 1, years: 1 },
      { code: "GST 111", title: "Communication in English Language", creditHours: 2, years: 1 },
      { code: "MCE 101", title: "Introduction to Mechatronics Engineering", creditHours: 2, years: 1 },
      { code: "MTH 101", title: "Elementary Mathematics I", creditHours: 2, years: 1 },
      { code: "MTH 103", title: "Elementary Mathematics III", creditHours: 2, years: 1 },
      { code: "PHY 101", title: "General Physics I", creditHours: 2, years: 1 },
      { code: "PHY 103", title: "General Physics III", creditHours: 2, years: 1 },
      { code: "PHY 107", title: "General Practical Physics I", creditHours: 2, years: 1 },
      { code: "STA 112", title: "Probability I", creditHours: 3, years: 1 }
    ],
    "200": [
      { code: "ENT 211", title: "Entrepreneurship & Innovation", creditHours: 2, years: 1 },
      { code: "TUM-FEN 250", title: "Autodesk Inventor", creditHours: 2, years: 1 },
      { code: "TUM-GES 201", title: "Emotional Intelligence & Critical Thinking", creditHours: 1, years: 1 },
      { code: "TUM-GES 203", title: "Character & Leadership Education 3", creditHours: 1, years: 1 },
      { code: "GET 201", title: "Applied Electricity I", creditHours: 3, years: 1 },
      { code: "GET 203", title: "Engineering Graphics & Solid Modeling II", creditHours: 2, years: 1 },
      { code: "GET 205", title: "Fundamentals of Fluid Mechanics", creditHours: 3, years: 1 },
      { code: "GET 207", title: "Applied Mechanics", creditHours: 3, years: 1 },
      { code: "GET 209", title: "Engineering Mathematics I", creditHours: 3, years: 1 },
      { code: "GET 211", title: "Computing & Software Engineering", creditHours: 3, years: 1 }
    ],
    "300": [
      { code: "ENT 312", title: "Venture Creation", creditHours: 2, years: 1 },
      { code: "TUM-FEN 350", title: "3D Technology with Autodesk Fusion", creditHours: 2, years: 1 },
      { code: "TUM-GES 301", title: "Peace & Conflict Resolution", creditHours: 1, years: 1 },
      { code: "TUM-GES 303", title: "Character & Leadership Education 5", creditHours: 1, years: 1 },
      { code: "GET 301", title: "Engineering Mathematics III", creditHours: 3, years: 1 },
      { code: "TUM-GET 301", title: "Engineering Statistics", creditHours: 3, years: 1 },
      { code: "GET 305", title: "Engineering Statistics and Data Analytics", creditHours: 3, years: 1 },
      { code: "GET 307", title: "Introduction to Artificial Intelligence, Machine Learning and Convergent Technologies", creditHours: 3, years: 1 },
      { code: "MCE 321", title: "Control Systems", creditHours: 2, years: 1 },
      { code: "TUM-MEE 301", title: "Fluid Mechanics II", creditHours: 2, years: 1 },
      { code: "TUM-MEE 307", title: "Machine Design I", creditHours: 2, years: 1 },
      { code: "TUM-MOS 311", title: "Moral and Ethical Studies", creditHours: 3, years: 1 }
    ],
    "400": [
      { code: "CPE 403", title: "Control Systems", creditHours: 2, years: 1 },
      { code: "TUM-FEN 450", title: "Python Programming", creditHours: 2, years: 1 },
      { code: "TUM-GES 401", title: "Professional Ethics & Career Development", creditHours: 1, years: 1 },
      { code: "TUM-GES 403", title: "Character & Leadership Education 7", creditHours: 1, years: 1 },
      { code: "GET 404", title: "Engineering Valuation and Appraisal", creditHours: 2, years: 1 },
      { code: "MCE 401", title: "Industrial Automation", creditHours: 2, years: 1 },
      { code: "MCE 407", title: "Robotics", creditHours: 2, years: 1 },
      { code: "MCE 409", title: "Mechatronic Systems Design", creditHours: 2, years: 1 },
      { code: "TUM-MCE 415", title: "Embedded Systems", creditHours: 2, years: 1 }
    ],
    "500": [
      { code: "TUM-FEN 550", title: "Artificial Intelligence", creditHours: 2, years: 1 },
      { code: "GET 501", title: "Engineering Project Management", creditHours: 3, years: 1 }
    ]
  },
  "Petroleum and Gas Engineering": {
    "100": [
      { code: "CHM 101", title: "General Chemistry I", creditHours: 2, years: 1 },
      { code: "CHM 107", title: "General Practical Chemistry I", creditHours: 2, years: 1 },
      { code: "TUM-FEN 150", title: "CompTIA A+ Core 1", creditHours: 2, years: 1 },
      { code: "TUM-GES 101", title: "Lawman and society", creditHours: 1, years: 1 },
      { code: "TUM-GES 103", title: "Character & Leadership Education 1", creditHours: 1, years: 1 },
      { code: "GET 101", title: "Engineer in Society", creditHours: 1, years: 1 },
      { code: "GST 111", title: "Communication in English Language", creditHours: 2, years: 1 },
      { code: "MTH 101", title: "Elementary Mathematics I", creditHours: 2, years: 1 },
      { code: "MTH 103", title: "Elementary Mathematics III", creditHours: 2, years: 1 },
      { code: "PGE 101", title: "Introduction to Petroleum Engineering", creditHours: 2, years: 1 },
      { code: "PHY 101", title: "General Physics I", creditHours: 2, years: 1 },
      { code: "PHY 103", title: "General Physics III", creditHours: 2, years: 1 },
      { code: "PHY 107", title: "General Practical Physics I", creditHours: 2, years: 1 },
      { code: "STA 112", title: "Probability I", creditHours: 3, years: 1 }
    ],
    "200": [
      { code: "ENT 211", title: "Entrepreneurship & Innovation", creditHours: 2, years: 1 },
      { code: "TUM-FEN 250", title: "Autodesk Inventor", creditHours: 2, years: 1 },
      { code: "TUM-GES 201", title: "Emotional Intelligence & Critical Thinking", creditHours: 1, years: 1 },
      { code: "TUM-GES 203", title: "Character & Leadership Education 3", creditHours: 1, years: 1 },
      { code: "GET 201", title: "Applied Electricity I", creditHours: 3, years: 1 },
      { code: "GET 203", title: "Engineering Graphics & Solid Modeling II", creditHours: 2, years: 1 },
      { code: "GET 205", title: "Fundamentals of Fluid Mechanics", creditHours: 3, years: 1 },
      { code: "GET 207", title: "Applied Mechanics", creditHours: 3, years: 1 },
      { code: "GET 209", title: "Engineering Mathematics I", creditHours: 3, years: 1 },
      { code: "GET 211", title: "Computing & Software Engineering", creditHours: 3, years: 1 },
      { code: "TUM-PGE 201", title: "Petroleum Geology", creditHours: 2, years: 1 }
    ],
    "300": [
      { code: "ENT 312", title: "Venture Creation", creditHours: 2, years: 1 },
      { code: "TUM-FEN 350", title: "3D Technology with Autodesk Fusion", creditHours: 2, years: 1 },
      { code: "TUM-GES 301", title: "Peace & Conflict Resolution", creditHours: 1, years: 1 },
      { code: "TUM-GES 303", title: "Character & Leadership Education 5", creditHours: 1, years: 1 },
      { code: "GET 301", title: "Engineering Mathematics III", creditHours: 3, years: 1 },
      { code: "TUM-GET 301", title: "Engineering Statistics", creditHours: 3, years: 1 },
      { code: "GET 305", title: "Engineering Statistics and Data Analytics", creditHours: 3, years: 1 },
      { code: "GET 307", title: "Introduction to Artificial Intelligence, Machine Learning and Convergent Technologies", creditHours: 3, years: 1 },
      { code: "TUM-MOS 311", title: "Moral and Ethical Studies", creditHours: 3, years: 1 },
      { code: "PGE 301", title: "Reservoir Engineering I", creditHours: 3, years: 1 },
      { code: "PGE 303", title: "Drilling Engineering I", creditHours: 3, years: 1 },
      { code: "PGE 305", title: "Petroleum Production Engineering I", creditHours: 2, years: 1 }
    ],
    "400": [
      { code: "TUM-FEN 450", title: "Python Programming", creditHours: 2, years: 1 },
      { code: "TUM-GES 401", title: "Professional Ethics & Career Development", creditHours: 1, years: 1 },
      { code: "TUM-GES 403", title: "Character & Leadership Education 7", creditHours: 1, years: 1 },
      { code: "GET 404", title: "Engineering Valuation and Appraisal", creditHours: 2, years: 1 },
      { code: "PGE 401", title: "Reservoir Engineering II", creditHours: 2, years: 1 },
      { code: "TUM-PGE 402", title: "Natural Gas Engineering", creditHours: 2, years: 1 },
      { code: "PGE 403", title: "Formation Evaluation", creditHours: 3, years: 1 },
      { code: "TUM-PGE 403", title: "Petroleum Economics", creditHours: 2, years: 1 },
      { code: "TUM-PGE 404", title: "Well Completion and Workover", creditHours: 3, years: 1 },
      { code: "TUM-PGE 405", title: "Enhanced Oil Recovery", creditHours: 2, years: 1 },
      { code: "TUM-PGE 406", title: "Pipeline Engineering", creditHours: 2, years: 1 }
    ],
    "500": [
      { code: "TUM-FEN 550", title: "Artificial Intelligence", creditHours: 2, years: 1 },
      { code: "GET 501", title: "Engineering Project Management", creditHours: 3, years: 1 },
      { code: "PGE 501", title: "Petroleum Engineering Design", creditHours: 2, years: 1 },
      { code: "TUM-PGE 501", title: "Offshore Engineering", creditHours: 3, years: 1 },
      { code: "TUM-PGE 503", title: "Process Safety", creditHours: 2, years: 1 },
      { code: "TUM-PGE 505", title: "Petroleum Refining", creditHours: 3, years: 1 },
      { code: "TUM-PGE 507", title: "Well Testing", creditHours: 2, years: 1 }
    ]
  },
  "Medical Laboratory Science": {
    "100": [
      { code: "BIO 101", title: "General Biology I", creditHours: 2, years: 1 },
      { code: "BIO 107", title: "General Practical Biology I", creditHours: 2, years: 1 },
      { code: "CHM 101", title: "General Chemistry I", creditHours: 2, years: 1 },
      { code: "CHM 107", title: "General Practical Chemistry I", creditHours: 2, years: 1 },
      { code: "COS 101", title: "Introduction to Computing Sciences", creditHours: 3, years: 1 },
      { code: "TUM-GES 101", title: "Lawman and society", creditHours: 1, years: 1 },
      { code: "TUM-GES 103", title: "Character & Leadership Education 1", creditHours: 1, years: 1 },
      { code: "GST 111", title: "Communication in English Language", creditHours: 2, years: 1 },
      { code: "TUM-MCS 150", title: "Office Productivity", creditHours: 2, years: 1 },
      { code: "PHY 101", title: "General Physics I", creditHours: 2, years: 1 },
      { code: "PHY 107", title: "General Practical Physics I", creditHours: 2, years: 1 }
    ],
    "200": [
      { code: "ANA 201", title: "Gross Anatomy I", creditHours: 2, years: 1 },
      { code: "ANA 203", title: "Histology", creditHours: 2, years: 1 },
      { code: "BCH 201", title: "General Biochemistry I", creditHours: 2, years: 1 },
      { code: "BCH 203", title: "Biochemistry of Biomolecules", creditHours: 2, years: 1 },
      { code: "ENT 211", title: "Entrepreneurship & Innovation", creditHours: 2, years: 1 },
      { code: "TUM-GES 201", title: "Emotional Intelligence & Critical Thinking", creditHours: 1, years: 1 },
      { code: "TUM-GES 203", title: "Character & Leadership Education 3", creditHours: 1, years: 1 },
      { code: "MCB 201", title: "General Microbiology I", creditHours: 2, years: 1 },
      { code: "TUM-MCS 250", title: "Health Informatics (Using Power BI)", creditHours: 2, years: 1 },
      { code: "MLS 201", title: "Introduction to Medical Laboratory Science", creditHours: 2, years: 1 },
      { code: "PIO 201", title: "General Physiology", creditHours: 2, years: 1 },
      { code: "PIO 203", title: "Physiology of Body Systems", creditHours: 2, years: 1 },
      { code: "STA 201", title: "Biostatistics", creditHours: 3, years: 1 }
    ],
    "300": [
      { code: "ENT 312", title: "Venture Creation", creditHours: 2, years: 1 },
      { code: "TUM-GES 301", title: "Peace & Conflict Resolution", creditHours: 1, years: 1 },
      { code: "TUM-GES 303", title: "Character & Leadership Education 5", creditHours: 1, years: 1 },
      { code: "TUM-MCS 350", title: "Data Analysis Using IBM SPSS 1", creditHours: 2, years: 1 },
      { code: "MLS 301", title: "Haematology I", creditHours: 2, years: 1 },
      { code: "MLS 303", title: "Clinical Chemistry I", creditHours: 2, years: 1 },
      { code: "MLS 305", title: "Medical Microbiology I", creditHours: 2, years: 1 },
      { code: "MLS 307", title: "Histopathology I", creditHours: 2, years: 1 },
      { code: "MLS 309", title: "Immunology and Serology", creditHours: 2, years: 1 },
      { code: "TUM-MOS 311", title: "Moral and Ethical Studies", creditHours: 3, years: 1 },
      { code: "PHA 301", title: "General Pharmacology", creditHours: 2, years: 1 }
    ],
    "400": [
      { code: "TUM-GES 401", title: "Professional Ethics & Career Development", creditHours: 1, years: 1 },
      { code: "TUM-GES 403", title: "Character & Leadership Education 7", creditHours: 1, years: 1 },
      { code: "TUM-MCS 450", title: "Medical Coding and Billing", creditHours: 2, years: 1 }
    ]
  },
  "Nursing Science": {
    "100": [
      { code: "BIO 101", title: "General Biology I", creditHours: 2, years: 1 },
      { code: "BIO 107", title: "General Practical Biology I", creditHours: 2, years: 1 },
      { code: "CHM 101", title: "General Chemistry I", creditHours: 2, years: 1 },
      { code: "CHM 107", title: "General Practical Chemistry I", creditHours: 2, years: 1 },
      { code: "COS 101", title: "Introduction to Computing Sciences", creditHours: 3, years: 1 },
      { code: "TUM-GES 101", title: "Lawman and society", creditHours: 1, years: 1 },
      { code: "TUM-GES 103", title: "Character & Leadership Education 1", creditHours: 1, years: 1 },
      { code: "GST 111", title: "Communication in English Language", creditHours: 2, years: 1 },
      { code: "TUM-MCS 150", title: "Office Productivity", creditHours: 2, years: 1 },
      { code: "MTH 101", title: "Elementary Mathematics I", creditHours: 2, years: 1 },
      { code: "PHY 101", title: "General Physics I", creditHours: 2, years: 1 },
      { code: "PHY 107", title: "General Practical Physics I", creditHours: 2, years: 1 }
    ],
    "200": [
      { code: "ANA 201", title: "Gross Anatomy I", creditHours: 2, years: 1 },
      { code: "ANA 203", title: "Histology", creditHours: 2, years: 1 },
      { code: "BCH 201", title: "General Biochemistry I", creditHours: 2, years: 1 },
      { code: "BCH 203", title: "Biochemistry of Biomolecules", creditHours: 2, years: 1 },
      { code: "ENT 211", title: "Entrepreneurship & Innovation", creditHours: 2, years: 1 },
      { code: "TUM-GES 201", title: "Emotional Intelligence & Critical Thinking", creditHours: 1, years: 1 },
      { code: "TUM-GES 203", title: "Character & Leadership Education 3", creditHours: 1, years: 1 },
      { code: "TUM-MCS 250", title: "Health Informatics (Using Power BI)", creditHours: 2, years: 1 },
      { code: "NSC 201", title: "Foundations of Nursing I", creditHours: 2, years: 1 },
      { code: "TUM-NSC 201", title: "Nursing Practicum I", creditHours: 2, years: 1 },
      { code: "NSC 203", title: "Health Assessment I", creditHours: 1, years: 1 },
      { code: "PIO 201", title: "General Physiology", creditHours: 2, years: 1 }
    ],
    "300": [
      { code: "ENT 312", title: "Venture Creation", creditHours: 2, years: 1 },
      { code: "TUM-GES 301", title: "Peace & Conflict Resolution", creditHours: 1, years: 1 },
      { code: "TUM-GES 303", title: "Character & Leadership Education 5", creditHours: 1, years: 1 },
      { code: "TUM-MCS 350", title: "Data Analysis Using IBM SPSS 1", creditHours: 2, years: 1 },
      { code: "TUM-MOS 311", title: "Moral and Ethical Studies", creditHours: 3, years: 1 },
      { code: "NSC 301", title: "Medical-Surgical Nursing I", creditHours: 1, years: 1 },
      { code: "NSC 303", title: "Maternal and Child Health Nursing I", creditHours: 2, years: 1 },
      { code: "NSC 306", title: "Community Health Nursing I", creditHours: 2, years: 1 },
      { code: "NSC 307", title: "Mental Health Nursing I", creditHours: 2, years: 1 },
      { code: "NSC 309", title: "Paediatric Nursing", creditHours: 2, years: 1 },
      { code: "NSC 313", title: "Nursing Research I", creditHours: 2, years: 1 },
      { code: "TUM-NSC 313", title: "Clinical Practicum II", creditHours: 4, years: 1 },
      { code: "TUM-NSC 316", title: "Nursing Informatics", creditHours: 1, years: 1 },
      { code: "PHA 301", title: "General Pharmacology", creditHours: 2, years: 1 }
    ],
    "400": [
      { code: "TUM-GES 401", title: "Professional Ethics & Career Development", creditHours: 1, years: 1 },
      { code: "TUM-GES 403", title: "Character & Leadership Education 7", creditHours: 1, years: 1 },
      { code: "TUM-MCS 450", title: "Medical Coding and Billing", creditHours: 2, years: 1 },
      { code: "NSC 401", title: "Medical-Surgical Nursing II", creditHours: 3, years: 1 },
      { code: "NSC 403", title: "Obstetric and Gynaecological Nursing", creditHours: 2, years: 1 },
      { code: "NSC 405", title: "Nursing Administration", creditHours: 2, years: 1 },
      { code: "NSC 407", title: "Community Health Nursing II", creditHours: 2, years: 1 },
      { code: "NSC 409", title: "Mental Health Nursing II", creditHours: 2, years: 1 },
      { code: "NSC 411", title: "Nursing Research II", creditHours: 1, years: 1 },
      { code: "TUM-NSC 415", title: "Geriatric Nursing", creditHours: 2, years: 1 },
      { code: "TUM-NSC 417", title: "Critical Care Nursing", creditHours: 2, years: 1 },
      { code: "TUM-NSC 419", title: "Palliative Care Nursing", creditHours: 2, years: 1 }
    ]
  },
  "Accounting": {
    "100": [
      { code: "ACC 101", title: "Introduction to Financial Accounting I", creditHours: 3, years: 1 },
      { code: "TUM-ACC 113", title: "Fundamentals of Bookkeeping", creditHours: 3, years: 1 },
      { code: "AMS 101", title: "Business Mathematics I", creditHours: 2, years: 1 },
      { code: "AMS 103", title: "Introductory Statistics", creditHours: 2, years: 1 },
      { code: "ECO 101", title: "Principles of Economics I", creditHours: 2, years: 1 },
      { code: "TUM-FMS 150", title: "Office Productivity", creditHours: 2, years: 1 },
      { code: "TUM-GES 101", title: "Lawman and society", creditHours: 1, years: 1 },
      { code: "TUM-GES 103", title: "Character & Leadership Education 1", creditHours: 1, years: 1 },
      { code: "GST 111", title: "Communication in English Language", creditHours: 2, years: 1 }
    ],
    "200": [
      { code: "ACC 201", title: "Financial Accounting I", creditHours: 3, years: 1 },
      { code: "ACC 203", title: "Cost Accounting I", creditHours: 3, years: 1 },
      { code: "TUM-ACC 213", title: "Computer Applications in Accounting", creditHours: 2, years: 1 },
      { code: "TUM-ACC 214", title: "Introduction to Taxation", creditHours: 3, years: 1 },
      { code: "TUM-BUS 207", title: "Business Mathematics and Statistics", creditHours: 2, years: 1 },
      { code: "ENT 211", title: "Entrepreneurship & Innovation", creditHours: 2, years: 1 },
      { code: "TUM-FMS 250", title: "Data Analysis using Power BI", creditHours: 2, years: 1 },
      { code: "TUM-GES 201", title: "Emotional Intelligence & Critical Thinking", creditHours: 1, years: 1 },
      { code: "TUM-GES 203", title: "Character & Leadership Education 3", creditHours: 1, years: 1 }
    ],
    "300": [
      { code: "ACC 301", title: "Intermediate Financial Reporting I", creditHours: 3, years: 1 },
      { code: "ACC 303", title: "Cost and Management Accounting I", creditHours: 3, years: 1 },
      { code: "ACC 305", title: "Auditing and Investigations I", creditHours: 3, years: 1 },
      { code: "ACC 307", title: "Taxation I", creditHours: 3, years: 1 },
      { code: "ACC 311", title: "Public Sector Accounting", creditHours: 3, years: 1 },
      { code: "ENT 312", title: "Venture Creation", creditHours: 2, years: 1 },
      { code: "TUM-FMS 350", title: "Business Analytics", creditHours: 2, years: 1 },
      { code: "TUM-GES 301", title: "Peace & Conflict Resolution", creditHours: 1, years: 1 },
      { code: "TUM-GES 303", title: "Character & Leadership Education 5", creditHours: 1, years: 1 },
      { code: "TUM-MOS 311", title: "Moral and Ethical Studies", creditHours: 3, years: 1 }
    ],
    "400": [
      { code: "ACC 401", title: "Advanced Financial Reporting I", creditHours: 3, years: 1 },
      { code: "ACC 403", title: "Advanced Auditing and Assurance", creditHours: 3, years: 1 },
      { code: "ACC 405", title: "Advanced Management Accounting", creditHours: 3, years: 1 },
      { code: "TUM-ACC 413", title: "Forensic Accounting", creditHours: 3, years: 1 },
      { code: "TUM-FMS 450", title: "QuickBooks/Generative AI", creditHours: 2, years: 1 },
      { code: "TUM-GES 401", title: "Professional Ethics & Career Development", creditHours: 1, years: 1 },
      { code: "TUM-GES 403", title: "Character & Leadership Education 7", creditHours: 1, years: 1 }
    ]
  },
  "Architecture": {
    "100": [
      { code: "AMS 103", title: "Introductory Statistics", creditHours: 2, years: 1 },
      { code: "ARC 101", title: "Architectural Design I", creditHours: 2, years: 1 },
      { code: "TUM-ARC 103", title: "History of Architecture I", creditHours: 2, years: 1 },
      { code: "TUM-ARC 105", title: "Architectural Graphics", creditHours: 2, years: 1 },
      { code: "TUM-ARC 107", title: "Building Construction I", creditHours: 2, years: 1 },
      { code: "FAA 103", title: "Introduction to Fine Arts", creditHours: 2, years: 1 },
      { code: "TUM-GES 101", title: "Lawman and society", creditHours: 1, years: 1 },
      { code: "TUM-GES 103", title: "Character & Leadership Education 1", creditHours: 1, years: 1 },
      { code: "GST 111", title: "Communication in English Language", creditHours: 2, years: 1 },
      { code: "MTH 101", title: "Elementary Mathematics I", creditHours: 2, years: 1 },
      { code: "MTH 103", title: "Elementary Mathematics III", creditHours: 2, years: 1 },
      { code: "TUM-NHV 150", title: "AutoCAD 2D", creditHours: 2, years: 1 },
      { code: "PHY 101", title: "General Physics I", creditHours: 2, years: 1 }
    ],
    "200": [
      { code: "ARC 201", title: "Architectural Design II", creditHours: 6, years: 1 },
      { code: "ARC 203", title: "Building Construction II", creditHours: 2, years: 1 },
      { code: "ARC 205", title: "History and Theory of Architecture II", creditHours: 2, years: 1 },
      { code: "ARC 207", title: "Building Services I", creditHours: 2, years: 1 },
      { code: "TUM-ARC 209", title: "Structures I", creditHours: 2, years: 1 },
      { code: "TUM-ARC 211", title: "Architectural Drawing and Rendering", creditHours: 2, years: 1 },
      { code: "ENT 211", title: "Entrepreneurship & Innovation", creditHours: 2, years: 1 },
      { code: "FAA 221", title: "Art History", creditHours: 2, years: 1 },
      { code: "TUM-GES 201", title: "Emotional Intelligence & Critical Thinking", creditHours: 1, years: 1 },
      { code: "TUM-GES 203", title: "Character & Leadership Education 3", creditHours: 1, years: 1 },
      { code: "TUM-NHV 250", title: "Revit 1", creditHours: 2, years: 1 }
    ],
    "300": [
      { code: "ARC 301", title: "Architectural Design III", creditHours: 6, years: 1 },
      { code: "ARC 303", title: "Building Construction III", creditHours: 2, years: 1 },
      { code: "ARC 304", title: "Building Services II", creditHours: 2, years: 1 },
      { code: "ARC 305", title: "Theory of Structures", creditHours: 2, years: 1 },
      { code: "ARC 307", title: "Landscape Architecture", creditHours: 2, years: 1 },
      { code: "ARC 309", title: "Urban Design", creditHours: 2, years: 1 },
      { code: "TUM-ARC 315", title: "Building Information Modelling", creditHours: 1, years: 1 },
      { code: "ENT 312", title: "Venture Creation", creditHours: 2, years: 1 },
      { code: "FAA 313", title: "Architectural Photography", creditHours: 2, years: 1 },
      { code: "TUM-GES 301", title: "Peace & Conflict Resolution", creditHours: 1, years: 1 },
      { code: "TUM-GES 303", title: "Character & Leadership Education 5", creditHours: 1, years: 1 },
      { code: "TUM-MOS 311", title: "Moral and Ethical Studies", creditHours: 3, years: 1 },
      { code: "TUM-NHV 350", title: "Enscape", creditHours: 2, years: 1 }
    ],
    "400": [
      { code: "TUM-GES 401", title: "Professional Ethics & Career Development", creditHours: 1, years: 1 },
      { code: "TUM-GES 403", title: "Character & Leadership Education 7", creditHours: 1, years: 1 },
      { code: "TUM-NHV 450", title: "3D Technology, Modeling and Printing using Autodesk Fusion", creditHours: 2, years: 1 }
    ]
  },
  "Biochemistry": {
    "100": [
      { code: "TUM-BCH 101", title: "Introduction to Biochemistry", creditHours: 1, years: 1 },
      { code: "BIO 101", title: "General Biology I", creditHours: 2, years: 1 },
      { code: "BIO 107", title: "General Practical Biology I", creditHours: 2, years: 1 },
      { code: "CHM 101", title: "General Chemistry I", creditHours: 2, years: 1 },
      { code: "CHM 107", title: "General Practical Chemistry I", creditHours: 2, years: 1 },
      { code: "COS 101", title: "Introduction to Computing Sciences", creditHours: 3, years: 1 },
      { code: "TUM-FCA 152", title: "Office Productivity", creditHours: 2, years: 1 },
      { code: "TUM-GES 101", title: "Lawman and society", creditHours: 1, years: 1 },
      { code: "TUM-GES 103", title: "Character & Leadership Education 1", creditHours: 1, years: 1 },
      { code: "GST 111", title: "Communication in English Language", creditHours: 2, years: 1 },
      { code: "MTH 101", title: "Elementary Mathematics I", creditHours: 2, years: 1 },
      { code: "PHY 101", title: "General Physics I", creditHours: 2, years: 1 },
      { code: "PHY 107", title: "General Practical Physics I", creditHours: 2, years: 1 }
    ],
    "200": [
      { code: "BCH 201", title: "General Biochemistry I", creditHours: 2, years: 1 },
      { code: "BCH 203", title: "Biochemistry of Biomolecules", creditHours: 2, years: 1 },
      { code: "ENT 211", title: "Entrepreneurship & Innovation", creditHours: 2, years: 1 },
      { code: "TUM-FCA 252", title: "Data Analysis using Power BI", creditHours: 2, years: 1 },
      { code: "TUM-GES 201", title: "Emotional Intelligence & Critical Thinking", creditHours: 1, years: 1 },
      { code: "TUM-GES 203", title: "Character & Leadership Education 3", creditHours: 1, years: 1 },
      { code: "STA 201", title: "Biostatistics", creditHours: 3, years: 1 }
    ],
    "300": [
      { code: "ENT 312", title: "Venture Creation", creditHours: 2, years: 1 },
      { code: "TUM-FCA 352", title: "Data Analysis using IBM SPSS", creditHours: 2, years: 1 },
      { code: "TUM-GES 301", title: "Peace & Conflict Resolution", creditHours: 1, years: 1 },
      { code: "TUM-GES 303", title: "Character & Leadership Education 5", creditHours: 1, years: 1 },
      { code: "TUM-MOS 311", title: "Moral and Ethical Studies", creditHours: 3, years: 1 }
    ],
    "400": [
      { code: "TUM-FCA 452", title: "Predictive Analysis using Machine Learning", creditHours: 2, years: 1 },
      { code: "TUM-GES 401", title: "Professional Ethics & Career Development", creditHours: 1, years: 1 },
      { code: "TUM-GES 403", title: "Character & Leadership Education 7", creditHours: 1, years: 1 }
    ]
  },
  "Biotechnology": {
    "100": [
      { code: "BIO 101", title: "General Biology I", creditHours: 2, years: 1 },
      { code: "BIO 107", title: "General Practical Biology I", creditHours: 2, years: 1 },
      { code: "CHM 101", title: "General Chemistry I", creditHours: 2, years: 1 },
      { code: "CHM 107", title: "General Practical Chemistry I", creditHours: 2, years: 1 },
      { code: "COS 101", title: "Introduction to Computing Sciences", creditHours: 3, years: 1 },
      { code: "TUM-FCA 152", title: "Office Productivity", creditHours: 2, years: 1 },
      { code: "TUM-GES 101", title: "Lawman and society", creditHours: 1, years: 1 },
      { code: "TUM-GES 103", title: "Character & Leadership Education 1", creditHours: 1, years: 1 },
      { code: "GST 111", title: "Communication in English Language", creditHours: 2, years: 1 },
      { code: "MTH 101", title: "Elementary Mathematics I", creditHours: 2, years: 1 },
      { code: "PHY 101", title: "General Physics I", creditHours: 2, years: 1 },
      { code: "PHY 107", title: "General Practical Physics I", creditHours: 2, years: 1 }
    ],
    "200": [
      { code: "BCH 201", title: "General Biochemistry I", creditHours: 2, years: 1 },
      { code: "BCH 203", title: "Biochemistry of Biomolecules", creditHours: 2, years: 1 },
      { code: "TUM-BTG 201", title: "Introduction to Biotechnology", creditHours: 2, years: 1 },
      { code: "TUM-BTG 203", title: "Microbial Biotechnology", creditHours: 2, years: 1 },
      { code: "TUM-BTG 205", title: "Cell Biology", creditHours: 2, years: 1 },
      { code: "TUM-BTG 209", title: "Biotechnology Laboratory Techniques", creditHours: 2, years: 1 },
      { code: "ENT 211", title: "Entrepreneurship & Innovation", creditHours: 2, years: 1 },
      { code: "TUM-FCA 252", title: "Data Analysis using Power BI", creditHours: 2, years: 1 },
      { code: "TUM-GES 201", title: "Emotional Intelligence & Critical Thinking", creditHours: 1, years: 1 },
      { code: "TUM-GES 203", title: "Character & Leadership Education 3", creditHours: 1, years: 1 },
      { code: "MCB 221", title: "Microbial Physiology", creditHours: 2, years: 1 },
      { code: "STA 201", title: "Biostatistics", creditHours: 3, years: 1 }
    ],
    "300": [
      { code: "BTG 301", title: "Molecular Biology", creditHours: 2, years: 1 },
      { code: "BTG 302", title: "Plant Biotechnology", creditHours: 2, years: 1 },
      { code: "BTG 304", title: "Animal Biotechnology", creditHours: 2, years: 1 },
      { code: "BTG 305", title: "Industrial Biotechnology", creditHours: 2, years: 1 },
      { code: "BTG 309", title: "Bioprocess Engineering", creditHours: 2, years: 1 },
      { code: "BTG 311", title: "Immunology", creditHours: 2, years: 1 },
      { code: "BTG 313", title: "Bioinformatics", creditHours: 2, years: 1 },
      { code: "BTG 315", title: "Environmental Biotechnology", creditHours: 2, years: 1 },
      { code: "ENT 312", title: "Venture Creation", creditHours: 2, years: 1 },
      { code: "TUM-FCA 352", title: "Data Analysis using IBM SPSS", creditHours: 2, years: 1 },
      { code: "TUM-GES 301", title: "Peace & Conflict Resolution", creditHours: 1, years: 1 },
      { code: "TUM-GES 303", title: "Character & Leadership Education 5", creditHours: 1, years: 1 },
      { code: "TUM-MOS 311", title: "Moral and Ethical Studies", creditHours: 3, years: 1 }
    ],
    "400": [
      { code: "BTG 401", title: "Advanced Genetic Engineering", creditHours: 2, years: 1 },
      { code: "TUM-BTG 401", title: "Biosafety and Bioethics", creditHours: 2, years: 1 },
      { code: "BTG 403", title: "Pharmaceutical Biotechnology", creditHours: 2, years: 1 },
      { code: "TUM-BTG 403", title: "Biotechnology Entrepreneurship", creditHours: 2, years: 1 },
      { code: "BTG 405", title: "Agricultural Biotechnology", creditHours: 2, years: 1 },
      { code: "TUM-BTG 405", title: "Biotechnology Policy and Regulation", creditHours: 2, years: 1 },
      { code: "TUM-BTG 407", title: "Nanobiotechnology", creditHours: 1, years: 1 },
      { code: "TUM-BTG 409", title: "Genomics and Proteomics", creditHours: 1, years: 1 },
      { code: "BTG 433", title: "Research Project", creditHours: 2, years: 1 },
      { code: "TUM-FCA 452", title: "Predictive Analysis using Machine Learning", creditHours: 2, years: 1 },
      { code: "TUM-GES 401", title: "Professional Ethics & Career Development", creditHours: 1, years: 1 },
      { code: "TUM-GES 403", title: "Character & Leadership Education 7", creditHours: 1, years: 1 }
    ]
  },
  "Business Administration": {
    "100": [
      { code: "ACC 101", title: "Introduction to Financial Accounting I", creditHours: 3, years: 1 },
      { code: "AMS 101", title: "Business Mathematics I", creditHours: 2, years: 1 },
      { code: "AMS 103", title: "Introductory Statistics", creditHours: 2, years: 1 },
      { code: "BUA 101", title: "Introduction to Business", creditHours: 2, years: 1 },
      { code: "TUM-BUS 109", title: "Business Communication", creditHours: 1, years: 1 },
      { code: "ECO 101", title: "Principles of Economics I", creditHours: 2, years: 1 },
      { code: "TUM-FMS 150", title: "Office Productivity", creditHours: 2, years: 1 },
      { code: "TUM-GES 101", title: "Lawman and society", creditHours: 1, years: 1 },
      { code: "TUM-GES 103", title: "Character & Leadership Education 1", creditHours: 1, years: 1 },
      { code: "GST 111", title: "Communication in English Language", creditHours: 2, years: 1 }
    ],
    "200": [
      { code: "BUA 201", title: "Principles of Management", creditHours: 3, years: 1 },
      { code: "BUA 203", title: "Organizational Behaviour", creditHours: 3, years: 1 },
      { code: "BUA 205", title: "Principles of Marketing", creditHours: 2, years: 1 },
      { code: "TUM-BUS 207", title: "Business Mathematics and Statistics", creditHours: 2, years: 1 },
      { code: "TUM-BUS 209", title: "Business Ethics", creditHours: 1, years: 1 },
      { code: "ENT 211", title: "Entrepreneurship & Innovation", creditHours: 2, years: 1 },
      { code: "TUM-FMS 250", title: "Data Analysis using Power BI", creditHours: 2, years: 1 },
      { code: "TUM-GES 201", title: "Emotional Intelligence & Critical Thinking", creditHours: 1, years: 1 },
      { code: "TUM-GES 203", title: "Character & Leadership Education 3", creditHours: 1, years: 1 }
    ],
    "300": [
      { code: "BUA 303", title: "Operations Management", creditHours: 3, years: 1 },
      { code: "BUA 305", title: "Human Resource Management", creditHours: 3, years: 1 },
      { code: "BUA 313", title: "Marketing Management", creditHours: 2, years: 1 },
      { code: "BUA 319", title: "Small Business Management", creditHours: 2, years: 1 },
      { code: "BUA 321", title: "Financial Management", creditHours: 2, years: 1 },
      { code: "BUA 323", title: "Business Research Methods", creditHours: 2, years: 1 },
      { code: "ENT 312", title: "Venture Creation", creditHours: 2, years: 1 },
      { code: "TUM-FMS 350", title: "Business Analytics", creditHours: 2, years: 1 },
      { code: "TUM-GES 301", title: "Peace & Conflict Resolution", creditHours: 1, years: 1 },
      { code: "TUM-GES 303", title: "Character & Leadership Education 5", creditHours: 1, years: 1 },
      { code: "TUM-MOS 311", title: "Moral and Ethical Studies", creditHours: 3, years: 1 }
    ],
    "400": [
      { code: "BUA 401", title: "Strategic Management", creditHours: 3, years: 1 },
      { code: "BUA 406", title: "International Business", creditHours: 3, years: 1 },
      { code: "BUA 409", title: "Project Management", creditHours: 2, years: 1 },
      { code: "BUA 411", title: "Management Information Systems", creditHours: 3, years: 1 },
      { code: "TUM-BUS 415", title: "Corporate Governance", creditHours: 1, years: 1 },
      { code: "TUM-FMS 450", title: "QuickBooks/Generative AI", creditHours: 2, years: 1 },
      { code: "TUM-GES 401", title: "Professional Ethics & Career Development", creditHours: 1, years: 1 },
      { code: "TUM-GES 403", title: "Character & Leadership Education 7", creditHours: 1, years: 1 }
    ]
  },
  "Computer Science": {
    "100": [
      { code: "COS 101", title: "Introduction to Computing Sciences", creditHours: 3, years: 1 },
      { code: "TUM-CSC 112", title: "Web Technologies I", creditHours: 2, years: 1 },
      { code: "TUM-FCA 150", title: "Blockchain 2", creditHours: 2, years: 1 },
      { code: "TUM-GES 101", title: "Lawman and society", creditHours: 1, years: 1 },
      { code: "TUM-GES 103", title: "Character & Leadership Education 1", creditHours: 1, years: 1 },
      { code: "GST 111", title: "Communication in English Language", creditHours: 2, years: 1 },
      { code: "MTH 101", title: "Elementary Mathematics I", creditHours: 2, years: 1 },
      { code: "PHY 101", title: "General Physics I", creditHours: 2, years: 1 },
      { code: "PHY 107", title: "General Practical Physics I", creditHours: 2, years: 1 },
      { code: "STA 111", title: "Descriptive Statistics", creditHours: 3, years: 1 }
    ],
    "200": [
      { code: "COS 201", title: "Computer Programming I", creditHours: 3, years: 1 },
      { code: "CSC 203", title: "Discrete Structures", creditHours: 2, years: 1 },
      { code: "TUM-CSC 211", title: "Human-Computer Interaction", creditHours: 2, years: 1 },
      { code: "TUM-CSC 223", title: "Data Analytics", creditHours: 3, years: 1 },
      { code: "CYB 201", title: "Introduction to Cybersecurity & Strategy", creditHours: 2, years: 1 },
      { code: "ENT 211", title: "Entrepreneurship & Innovation", creditHours: 2, years: 1 },
      { code: "TUM-FCA 250", title: "Data Science 1", creditHours: 2, years: 1 },
      { code: "TUM-GES 201", title: "Emotional Intelligence & Critical Thinking", creditHours: 1, years: 1 },
      { code: "TUM-GES 203", title: "Character & Leadership Education 3", creditHours: 1, years: 1 },
      { code: "IFT 211", title: "Digital Logic Design", creditHours: 2, years: 1 },
      { code: "MTH 201", title: "Mathematical Methods I", creditHours: 2, years: 1 },
      { code: "SEN 201", title: "Introduction to Software Engineering", creditHours: 2, years: 1 }
    ],
    "300": [
      { code: "CSC 301", title: "Data Structures", creditHours: 3, years: 1 },
      { code: "CSC 308", title: "Operating Systems", creditHours: 3, years: 1 },
      { code: "CSC 309", title: "Artificial Intelligence", creditHours: 2, years: 1 },
      { code: "CSC 322", title: "Computer Science Innovation & New Ventures", creditHours: 2, years: 1 },
      { code: "DTS 304", title: "Data Management I", creditHours: 3, years: 1 },
      { code: "ENT 312", title: "Venture Creation", creditHours: 2, years: 1 },
      { code: "TUM-FCA 350", title: "Machine Learning", creditHours: 2, years: 1 },
      { code: "TUM-GES 301", title: "Peace & Conflict Resolution", creditHours: 1, years: 1 },
      { code: "TUM-GES 303", title: "Character & Leadership Education 5", creditHours: 1, years: 1 },
      { code: "ICT 305", title: "Data Communication System & Network", creditHours: 3, years: 1 },
      { code: "TUM-MOS 311", title: "Moral and Ethical Studies", creditHours: 3, years: 1 }
    ],
    "400": [
      { code: "COS 409", title: "Research Methodology & Technical Writing", creditHours: 3, years: 1 },
      { code: "CSC 401", title: "Algorithms & Complexity Analysis", creditHours: 2, years: 1 },
      { code: "TUM-CSC 411", title: "Introduction to Computer Graphics", creditHours: 2, years: 1 },
      { code: "TUM-CSC 413", title: "Mobile Application Development", creditHours: 2, years: 1 },
      { code: "TUM-CSC 422", title: "Final Year Project I", creditHours: 3, years: 1 },
      { code: "TUM-FCA 450", title: "Agile Project Management for Software Dev", creditHours: 2, years: 1 },
      { code: "TUM-GES 403", title: "Character & Leadership Education 7", creditHours: 1, years: 1 },
      { code: "INS 401", title: "Project Management", creditHours: 2, years: 1 }
    ]
  },
  "Criminology and Security Studies": {
    "100": [
      { code: "CSS 101", title: "Introduction to Criminology", creditHours: 3, years: 1 },
      { code: "CSS 103", title: "Introduction to Security Studies", creditHours: 3, years: 1 },
      { code: "TUM-CSS 150", title: "Office Productivity", creditHours: 2, years: 1 },
      { code: "TUM-GES 101", title: "Lawman and society", creditHours: 1, years: 1 },
      { code: "TUM-GES 103", title: "Character & Leadership Education 1", creditHours: 1, years: 1 },
      { code: "GST 111", title: "Communication in English Language", creditHours: 2, years: 1 },
      { code: "PSY 101", title: "General Psychology", creditHours: 2, years: 1 },
      { code: "SOC 101", title: "Introduction to Sociology", creditHours: 3, years: 1 }
    ],
    "200": [
      { code: "CSS 201", title: "Forensic Science", creditHours: 2, years: 1 },
      { code: "CSS 203", title: "Criminal Law and Procedure", creditHours: 2, years: 1 },
      { code: "CSS 205", title: "Policing and Law Enforcement", creditHours: 2, years: 1 },
      { code: "CSS 207", title: "Research Methods in Criminology", creditHours: 2, years: 1 },
      { code: "TUM-CSS 209", title: "Introduction to Digital Forensics", creditHours: 2, years: 1 },
      { code: "TUM-CSS 250", title: "CompTIA Security +", creditHours: 2, years: 1 },
      { code: "ENT 211", title: "Entrepreneurship & Innovation", creditHours: 2, years: 1 },
      { code: "TUM-GES 201", title: "Emotional Intelligence & Critical Thinking", creditHours: 1, years: 1 },
      { code: "TUM-GES 203", title: "Character & Leadership Education 3", creditHours: 1, years: 1 },
      { code: "TUM-PSY 211", title: "Social Psychology", creditHours: 2, years: 1 }
    ],
    "300": [
      { code: "CSS 301", title: "Forensic Medicine", creditHours: 3, years: 1 },
      { code: "CSS 303", title: "Corrections and Penology", creditHours: 3, years: 1 },
      { code: "CSS 305", title: "Victimology", creditHours: 2, years: 1 },
      { code: "TUM-CSS 307", title: "Crime Mapping and Analysis", creditHours: 2, years: 1 },
      { code: "TUM-CSS 309", title: "Terrorism and Counter-Terrorism", creditHours: 2, years: 1 },
      { code: "TUM-CSS 350", title: "Cybercrime and Digital Forensics", creditHours: 2, years: 1 },
      { code: "ENT 312", title: "Venture Creation", creditHours: 2, years: 1 },
      { code: "TUM-GES 301", title: "Peace & Conflict Resolution", creditHours: 1, years: 1 },
      { code: "TUM-GES 303", title: "Character & Leadership Education 5", creditHours: 1, years: 1 },
      { code: "TUM-MOS 311", title: "Moral and Ethical Studies", creditHours: 3, years: 1 },
      { code: "SSC 301", title: "Research Methods in Social Sciences", creditHours: 2, years: 1 }
    ],
    "400": [
      { code: "CSS 403", title: "Criminal Investigation", creditHours: 3, years: 1 },
      { code: "CSS 405", title: "Security Management", creditHours: 3, years: 1 },
      { code: "TUM-CSS 407", title: "Intelligence Analysis", creditHours: 2, years: 1 },
      { code: "TUM-CSS 409", title: "Transnational Organised Crime", creditHours: 2, years: 1 },
      { code: "TUM-CSS 411", title: "Crisis and Disaster Management", creditHours: 1, years: 1 },
      { code: "TUM-CSS 413", title: "Research Project", creditHours: 1, years: 1 },
      { code: "TUM-CSS 450", title: "Generative AI for Criminology and Security Studies", creditHours: 2, years: 1 },
      { code: "TUM-GES 401", title: "Professional Ethics & Career Development", creditHours: 1, years: 1 },
      { code: "TUM-GES 403", title: "Character & Leadership Education 7", creditHours: 1, years: 1 },
      { code: "SSC 401", title: "Seminar in Social Sciences", creditHours: 2, years: 1 }
    ]
  },
  "Cyber Security": {
    "100": [
      { code: "COS 101", title: "Introduction to Computing Sciences", creditHours: 3, years: 1 },
      { code: "TUM-CYB 111", title: "Fundamentals of Information Security", creditHours: 3, years: 1 },
      { code: "TUM-CYB 150", title: "Information Systems Security Officer", creditHours: 2, years: 1 },
      { code: "TUM-GES 101", title: "Lawman and society", creditHours: 1, years: 1 },
      { code: "TUM-GES 103", title: "Character & Leadership Education 1", creditHours: 1, years: 1 },
      { code: "GST 111", title: "Communication in English Language", creditHours: 2, years: 1 },
      { code: "MTH 101", title: "Elementary Mathematics I", creditHours: 2, years: 1 },
      { code: "PHY 101", title: "General Physics I", creditHours: 2, years: 1 },
      { code: "PHY 107", title: "General Practical Physics I", creditHours: 2, years: 1 },
      { code: "STA 111", title: "Descriptive Statistics", creditHours: 3, years: 1 }
    ],
    "200": [
      { code: "COS 201", title: "Computer Programming I", creditHours: 3, years: 1 },
      { code: "TUM-CSC 221", title: "Computer Networks", creditHours: 3, years: 1 },
      { code: "CYB 201", title: "Introduction to Cybersecurity & Strategy", creditHours: 2, years: 1 },
      { code: "CYB 203", title: "Network Security Fundamentals", creditHours: 2, years: 1 },
      { code: "TUM-CYB 211", title: "Cryptography", creditHours: 2, years: 1 },
      { code: "TUM-CYB 212", title: "Operating Systems Security", creditHours: 2, years: 1 },
      { code: "TUM-CYB 213", title: "Ethical Hacking Fundamentals", creditHours: 2, years: 1 },
      { code: "TUM-CYB 250", title: "Incident Handling Engineer", creditHours: 2, years: 1 },
      { code: "TUM-GES 201", title: "Emotional Intelligence & Critical Thinking", creditHours: 1, years: 1 },
      { code: "SEN 201", title: "Introduction to Software Engineering", creditHours: 2, years: 1 }
    ],
    "300": [
      { code: "CSC 309", title: "Artificial Intelligence", creditHours: 2, years: 1 },
      { code: "TUM-CYB 350", title: "CPEH (MILE2) 1", creditHours: 2, years: 1 },
      { code: "ENT 312", title: "Venture Creation", creditHours: 2, years: 1 },
      { code: "TUM-GES 301", title: "Peace & Conflict Resolution", creditHours: 1, years: 1 },
      { code: "TUM-GES 303", title: "Character & Leadership Education 5", creditHours: 1, years: 1 }
    ],
    "400": [
      { code: "COS 409", title: "Research Methodology & Technical Writing", creditHours: 3, years: 1 },
      { code: "TUM-CSC 411", title: "Introduction to Computer Graphics", creditHours: 2, years: 1 },
      { code: "TUM-CYB 450", title: "Cyber Security Systems Auditor", creditHours: 2, years: 1 },
      { code: "TUM-GES 401", title: "Professional Ethics & Career Development", creditHours: 1, years: 1 },
      { code: "TUM-SEN 441", title: "Secure Software Development", creditHours: 3, years: 1 }
    ]
  },
  "Economics": {
    "100": [
      { code: "ACC 101", title: "Introduction to Financial Accounting I", creditHours: 3, years: 1 },
      { code: "TUM-BUS 207", title: "Business Mathematics and Statistics", creditHours: 2, years: 1 },
      { code: "ECO 101", title: "Principles of Economics I", creditHours: 2, years: 1 },
      { code: "ECO 103", title: "Elementary Economic Statistics", creditHours: 2, years: 1 },
      { code: "TUM-ECO 111", title: "Mathematics for Economists I", creditHours: 2, years: 1 },
      { code: "TUM-ECO 113", title: "Economic History of Nigeria", creditHours: 2, years: 1 },
      { code: "TUM-ECO 117", title: "Basic Economic Computing", creditHours: 1, years: 1 },
      { code: "TUM-FMS 150", title: "Office Productivity", creditHours: 2, years: 1 },
      { code: "TUM-GES 101", title: "Lawman and society", creditHours: 1, years: 1 },
      { code: "TUM-GES 103", title: "Character & Leadership Education 1", creditHours: 1, years: 1 },
      { code: "GST 111", title: "Communication in English Language", creditHours: 2, years: 1 }
    ],
    "200": [
      { code: "ECO 201", title: "Microeconomic Theory I", creditHours: 2, years: 1 },
      { code: "ECO 203", title: "Macroeconomic Theory I", creditHours: 2, years: 1 },
      { code: "ECO 205", title: "Mathematical Economics I", creditHours: 2, years: 1 },
      { code: "ECO 207", title: "Statistics for Economists I", creditHours: 2, years: 1 },
      { code: "TUM-ECO 211", title: "Economic Development", creditHours: 2, years: 1 },
      { code: "TUM-ECO 213", title: "Public Finance", creditHours: 2, years: 1 },
      { code: "ENT 211", title: "Entrepreneurship & Innovation", creditHours: 2, years: 1 },
      { code: "TUM-FMS 250", title: "Data Analysis using Power BI", creditHours: 2, years: 1 },
      { code: "TUM-GES 201", title: "Emotional Intelligence & Critical Thinking", creditHours: 1, years: 1 },
      { code: "TUM-GES 203", title: "Character & Leadership Education 3", creditHours: 1, years: 1 }
    ],
    "300": [
      { code: "ECO 301", title: "Microeconomic Theory II", creditHours: 2, years: 1 },
      { code: "ECO 303", title: "Macroeconomic Theory II", creditHours: 2, years: 1 },
      { code: "ECO 305", title: "Econometrics I", creditHours: 2, years: 1 },
      { code: "ECO 307", title: "International Economics", creditHours: 3, years: 1 },
      { code: "TUM-ECO 311", title: "Monetary Economics", creditHours: 1, years: 1 },
      { code: "TUM-ECO 313", title: "Development Planning", creditHours: 2, years: 1 },
      { code: "ENT 312", title: "Venture Creation", creditHours: 2, years: 1 },
      { code: "TUM-FMS 350", title: "Business Analytics", creditHours: 2, years: 1 },
      { code: "TUM-GES 301", title: "Peace & Conflict Resolution", creditHours: 1, years: 1 },
      { code: "TUM-GES 303", title: "Character & Leadership Education 5", creditHours: 1, years: 1 },
      { code: "TUM-MOS 311", title: "Moral and Ethical Studies", creditHours: 3, years: 1 },
      { code: "SSC 301", title: "Research Methods in Social Sciences", creditHours: 2, years: 1 }
    ],
    "400": [
      { code: "ECO 401", title: "Advanced Microeconomics", creditHours: 2, years: 1 },
      { code: "ECO 403", title: "Advanced Macroeconomics", creditHours: 2, years: 1 },
      { code: "ECO 405", title: "Econometrics II", creditHours: 3, years: 1 },
      { code: "ECO 407", title: "Research Methods in Economics", creditHours: 3, years: 1 },
      { code: "TUM-ECO 413", title: "Seminar in Economics", creditHours: 2, years: 1 },
      { code: "TUM-FMS 450", title: "QuickBooks/Generative AI", creditHours: 2, years: 1 },
      { code: "TUM-GES 401", title: "Professional Ethics & Career Development", creditHours: 1, years: 1 },
      { code: "TUM-GES 403", title: "Character & Leadership Education 7", creditHours: 1, years: 1 },
      { code: "SSC 401", title: "Seminar in Social Sciences", creditHours: 2, years: 1 }
    ]
  },
  "Mass Communication": {
    "100": [
      { code: "CMS 101", title: "Communication and Society", creditHours: 2, years: 1 },
      { code: "TUM-GES 101", title: "Lawman and society", creditHours: 1, years: 1 },
      { code: "TUM-GES 103", title: "Character & Leadership Education 1", creditHours: 1, years: 1 },
      { code: "GST 111", title: "Communication in English Language", creditHours: 2, years: 1 },
      { code: "TUM-MAS 109", title: "Media Literacy", creditHours: 1, years: 1 },
      { code: "MCM 101", title: "Introduction to Mass Communication", creditHours: 3, years: 1 },
      { code: "MCM 103", title: "Writing for the Media", creditHours: 2, years: 1 },
      { code: "MCM 105", title: "History of Mass Communication in Nigeria", creditHours: 2, years: 1 },
      { code: "MCM 107", title: "Introduction to Photography", creditHours: 2, years: 1 },
      { code: "TUM-MCM 150", title: "Adobe Photoshop I", creditHours: 2, years: 1 }
    ],
    "200": [
      { code: "CMS 201", title: "Communication Theories", creditHours: 2, years: 1 },
      { code: "ENT 211", title: "Entrepreneurship & Innovation", creditHours: 2, years: 1 },
      { code: "TUM-GES 201", title: "Emotional Intelligence & Critical Thinking", creditHours: 1, years: 1 },
      { code: "TUM-GES 203", title: "Character & Leadership Education 3", creditHours: 1, years: 1 },
      { code: "TUM-MAS 209", title: "Digital Media Production", creditHours: 2, years: 1 },
      { code: "MCM 201", title: "News Writing and Reporting", creditHours: 2, years: 1 },
      { code: "MCM 207", title: "Introduction to Public Relations", creditHours: 2, years: 1 },
      { code: "MCM 209", title: "Introduction to Advertising", creditHours: 2, years: 1 },
      { code: "MCM 211", title: "Broadcasting Basics", creditHours: 2, years: 1 },
      { code: "TUM-MCM 250", title: "Adobe Illustrator", creditHours: 2, years: 1 }
    ],
    "300": [
      { code: "CMS 301", title: "Communication Research Methods", creditHours: 2, years: 1 },
      { code: "CMS 303", title: "Media Law and Ethics", creditHours: 2, years: 1 },
      { code: "ENT 312", title: "Venture Creation", creditHours: 2, years: 1 },
      { code: "TUM-GES 301", title: "Peace & Conflict Resolution", creditHours: 1, years: 1 },
      { code: "TUM-GES 303", title: "Character & Leadership Education 5", creditHours: 1, years: 1 },
      { code: "TUM-MAS 309", title: "Multimedia Journalism", creditHours: 2, years: 1 },
      { code: "MCM 301", title: "Feature Writing", creditHours: 2, years: 1 },
      { code: "MCM 303", title: "Media Management", creditHours: 2, years: 1 },
      { code: "MCM 309", title: "Investigative Reporting", creditHours: 2, years: 1 },
      { code: "MCM 311", title: "Development Communication", creditHours: 2, years: 1 },
      { code: "TUM-MCM 350", title: "Adobe Premier Pro/Audition", creditHours: 2, years: 1 },
      { code: "TUM-MOS 311", title: "Moral and Ethical Studies", creditHours: 3, years: 1 }
    ],
    "400": [
      { code: "CMS 401", title: "Communication Research Project", creditHours: 2, years: 1 },
      { code: "TUM-GES 401", title: "Professional Ethics & Career Development", creditHours: 1, years: 1 },
      { code: "TUM-GES 403", title: "Character & Leadership Education 7", creditHours: 1, years: 1 },
      { code: "TUM-MAS 409", title: "Media Entrepreneurship", creditHours: 2, years: 1 },
      { code: "TUM-MAS 411", title: "Mass Communication Project", creditHours: 2, years: 1 },
      { code: "TUM-MAS 413", title: "Media Internship", creditHours: 2, years: 1 },
      { code: "MCM 403", title: "Communication Policy", creditHours: 2, years: 1 },
      { code: "MCM 405", title: "International Communication", creditHours: 2, years: 1 },
      { code: "MCM 407", title: "Media Economics", creditHours: 2, years: 1 },
      { code: "TUM-MCM 450", title: "Adobe FireFly", creditHours: 2, years: 1 }
    ]
  },
  "Mathematics": {
    "100": [
      { code: "CHM 101", title: "General Chemistry I", creditHours: 2, years: 1 },
      { code: "CHM 107", title: "General Practical Chemistry I", creditHours: 2, years: 1 },
      { code: "COS 101", title: "Introduction to Computing Sciences", creditHours: 3, years: 1 },
      { code: "TUM-GES 101", title: "Lawman and society", creditHours: 1, years: 1 },
      { code: "TUM-GES 103", title: "Character & Leadership Education 1", creditHours: 1, years: 1 },
      { code: "GST 111", title: "Communication in English Language", creditHours: 2, years: 1 },
      { code: "MTH 101", title: "Elementary Mathematics I", creditHours: 2, years: 1 },
      { code: "MTH 103", title: "Elementary Mathematics III", creditHours: 2, years: 1 },
      { code: "PHY 101", title: "General Physics I", creditHours: 2, years: 1 },
      { code: "PHY 107", title: "General Practical Physics I", creditHours: 2, years: 1 },
      { code: "STA 111", title: "Descriptive Statistics", creditHours: 3, years: 1 },
      { code: "STA 112", title: "Probability I", creditHours: 3, years: 1 }
    ],
    "200": [
      { code: "COS 201", title: "Computer Programming I", creditHours: 3, years: 1 },
      { code: "ENT 211", title: "Entrepreneurship & Innovation", creditHours: 2, years: 1 },
      { code: "TUM-GES 201", title: "Emotional Intelligence & Critical Thinking", creditHours: 1, years: 1 },
      { code: "TUM-GES 203", title: "Character & Leadership Education 3", creditHours: 1, years: 1 },
      { code: "MTH 201", title: "Mathematical Methods I", creditHours: 2, years: 1 }
    ],
    "300": [
      { code: "ENT 312", title: "Venture Creation", creditHours: 2, years: 1 },
      { code: "TUM-GES 301", title: "Peace & Conflict Resolution", creditHours: 1, years: 1 },
      { code: "TUM-GES 303", title: "Character & Leadership Education 5", creditHours: 1, years: 1 },
      { code: "TUM-MOS 311", title: "Moral and Ethical Studies", creditHours: 3, years: 1 }
    ],
    "400": [
      { code: "TUM-GES 401", title: "Professional Ethics & Career Development", creditHours: 1, years: 1 },
      { code: "TUM-GES 403", title: "Character & Leadership Education 7", creditHours: 1, years: 1 }
    ]
  },
  "Physics with Electronics": {
    "100": [
      { code: "COS 101", title: "Introduction to Computing Sciences", creditHours: 3, years: 1 },
      { code: "TUM-GES 103", title: "Character & Leadership Education 1", creditHours: 1, years: 1 },
      { code: "GST 111", title: "Communication in English Language", creditHours: 2, years: 1 },
      { code: "MTH 101", title: "Elementary Mathematics I", creditHours: 2, years: 1 },
      { code: "PHY 101", title: "General Physics I", creditHours: 2, years: 1 },
      { code: "PHY 103", title: "General Physics III", creditHours: 2, years: 1 },
      { code: "PHY 107", title: "General Practical Physics I", creditHours: 2, years: 1 }
    ],
    "200": [
      { code: "ENT 211", title: "Entrepreneurship & Innovation", creditHours: 2, years: 1 },
      { code: "TUM-GES 203", title: "Character & Leadership Education 3", creditHours: 1, years: 1 }
    ],
    "300": [
      { code: "ENT 312", title: "Venture Creation", creditHours: 2, years: 1 },
      { code: "TUM-GES 301", title: "Peace & Conflict Resolution", creditHours: 1, years: 1 },
      { code: "TUM-GES 303", title: "Character & Leadership Education 5", creditHours: 1, years: 1 },
      { code: "TUM-MOS 311", title: "Moral and Ethical Studies", creditHours: 3, years: 1 }
    ],
    "400": [
      { code: "TUM-GES 303", title: "Character & Leadership Education 5", creditHours: 1, years: 1 },
      { code: "TUM-GES 403", title: "Character & Leadership Education 7", creditHours: 1, years: 1 }
    ]
  },
  "Public Health": {
    "100": [
      { code: "BIO 101", title: "General Biology I", creditHours: 2, years: 1 },
      { code: "BIO 107", title: "General Practical Biology I", creditHours: 2, years: 1 },
      { code: "CHM 101", title: "General Chemistry I", creditHours: 2, years: 1 },
      { code: "CHM 107", title: "General Practical Chemistry I", creditHours: 2, years: 1 },
      { code: "COS 101", title: "Introduction to Computing Sciences", creditHours: 3, years: 1 },
      { code: "TUM-GES 101", title: "Lawman and society", creditHours: 1, years: 1 },
      { code: "TUM-GES 103", title: "Character & Leadership Education 1", creditHours: 1, years: 1 },
      { code: "GST 111", title: "Communication in English Language", creditHours: 2, years: 1 },
      { code: "TUM-MCS 150", title: "Office Productivity", creditHours: 2, years: 1 },
      { code: "MTH 101", title: "Elementary Mathematics I", creditHours: 2, years: 1 },
      { code: "PHY 101", title: "General Physics I", creditHours: 2, years: 1 },
      { code: "PHY 107", title: "General Practical Physics I", creditHours: 2, years: 1 }
    ],
    "200": [
      { code: "ANA 201", title: "Gross Anatomy I", creditHours: 2, years: 1 },
      { code: "BCH 201", title: "General Biochemistry I", creditHours: 2, years: 1 },
      { code: "ENT 211", title: "Entrepreneurship & Innovation", creditHours: 2, years: 1 },
      { code: "TUM-GES 201", title: "Emotional Intelligence & Critical Thinking", creditHours: 1, years: 1 },
      { code: "TUM-GES 203", title: "Character & Leadership Education 3", creditHours: 1, years: 1 },
      { code: "MCB 201", title: "General Microbiology I", creditHours: 2, years: 1 },
      { code: "TUM-MCS 250", title: "Health Informatics (Using Power BI)", creditHours: 2, years: 1 },
      { code: "PHS 201", title: "Introduction to Public Health", creditHours: 2, years: 1 },
      { code: "PHS 203", title: "Epidemiology I", creditHours: 2, years: 1 },
      { code: "PIO 201", title: "General Physiology", creditHours: 2, years: 1 }
    ],
    "300": [
      { code: "ENT 312", title: "Venture Creation", creditHours: 2, years: 1 },
      { code: "TUM-GES 301", title: "Peace & Conflict Resolution", creditHours: 1, years: 1 },
      { code: "TUM-GES 303", title: "Character & Leadership Education 5", creditHours: 1, years: 1 },
      { code: "TUM-MCS 350", title: "Data Analysis Using IBM SPSS 1", creditHours: 2, years: 1 },
      { code: "TUM-MOS 311", title: "Moral and Ethical Studies", creditHours: 3, years: 1 },
      { code: "PHS 301", title: "Epidemiology II", creditHours: 2, years: 1 },
      { code: "TUM-PHS 301", title: "Biostatistics for Public Health", creditHours: 3, years: 1 },
      { code: "PHS 303", title: "Health Systems and Management", creditHours: 2, years: 1 },
      { code: "TUM-PHS 303", title: "Health Promotion", creditHours: 2, years: 1 },
      { code: "PHS 305", title: "Occupational Health", creditHours: 1, years: 1 },
      { code: "TUM-PHS 311", title: "Nutrition and Public Health", creditHours: 3, years: 1 },
      { code: "TUM-PHS 351", title: "Public Health Field Practicum", creditHours: 2, years: 1 }
    ],
    "400": [
      { code: "TUM-GES 401", title: "Professional Ethics & Career Development", creditHours: 1, years: 1 },
      { code: "TUM-GES 403", title: "Character & Leadership Education 7", creditHours: 1, years: 1 },
      { code: "TUM-MCS 450", title: "Medical Coding and Billing", creditHours: 2, years: 1 }
    ]
  },
  "Software Engineering": {
    "100": [
      { code: "COS 101", title: "Introduction to Computing Sciences", creditHours: 3, years: 1 },
      { code: "TUM-CSC 112", title: "Web Technologies I", creditHours: 2, years: 1 },
      { code: "TUM-FCA 150", title: "Blockchain 2", creditHours: 2, years: 1 },
      { code: "TUM-GES 101", title: "Lawman and society", creditHours: 1, years: 1 },
      { code: "TUM-GES 103", title: "Character & Leadership Education 1", creditHours: 1, years: 1 },
      { code: "GST 111", title: "Communication in English Language", creditHours: 2, years: 1 },
      { code: "MTH 101", title: "Elementary Mathematics I", creditHours: 2, years: 1 },
      { code: "PHY 101", title: "General Physics I", creditHours: 2, years: 1 },
      { code: "PHY 107", title: "General Practical Physics I", creditHours: 2, years: 1 },
      { code: "STA 111", title: "Descriptive Statistics", creditHours: 3, years: 1 }
    ],
    "200": [
      { code: "COS 201", title: "Computer Programming I", creditHours: 3, years: 1 },
      { code: "CSC 203", title: "Discrete Structures", creditHours: 2, years: 1 },
      { code: "ENT 211", title: "Entrepreneurship & Innovation", creditHours: 2, years: 1 },
      { code: "TUM-FCA 250", title: "Data Science 1", creditHours: 2, years: 1 },
      { code: "TUM-GES 201", title: "Emotional Intelligence & Critical Thinking", creditHours: 1, years: 1 },
      { code: "TUM-GES 203", title: "Character & Leadership Education 3", creditHours: 1, years: 1 },
      { code: "IFT 211", title: "Digital Logic Design", creditHours: 2, years: 1 },
      { code: "MTH 201", title: "Mathematical Methods I", creditHours: 2, years: 1 },
      { code: "SEN 201", title: "Introduction to Software Engineering", creditHours: 2, years: 1 },
      { code: "TUM-SEN 221", title: "Object-Oriented Programming", creditHours: 3, years: 1 }
    ],
    "300": [
      { code: "CSC 301", title: "Data Structures", creditHours: 3, years: 1 },
      { code: "CSC 308", title: "Operating Systems", creditHours: 3, years: 1 },
      { code: "ENT 312", title: "Venture Creation", creditHours: 2, years: 1 },
      { code: "TUM-FCA 350", title: "Machine Learning", creditHours: 2, years: 1 },
      { code: "TUM-GES 301", title: "Peace & Conflict Resolution", creditHours: 1, years: 1 },
      { code: "TUM-GES 303", title: "Character & Leadership Education 5", creditHours: 1, years: 1 },
      { code: "TUM-MOS 311", title: "Moral and Ethical Studies", creditHours: 3, years: 1 },
      { code: "SEN 301", title: "Object-Oriented Analysis & Design", creditHours: 2, years: 1 },
      { code: "SEN 304", title: "Software Testing & Quality Assurance", creditHours: 2, years: 1 },
      { code: "SEN 306", title: "Software Construction", creditHours: 2, years: 1 },
      { code: "SEN 322", title: "Software Engineering Innovation & New Ventures", creditHours: 2, years: 1 }
    ],
    "400": [
      { code: "COS 409", title: "Research Methodology & Technical Writing", creditHours: 3, years: 1 },
      { code: "TUM-FCA 450", title: "Agile Project Management for Software Dev", creditHours: 2, years: 1 },
      { code: "TUM-GES 401", title: "Professional Ethics & Career Development", creditHours: 1, years: 1 },
      { code: "TUM-GES 403", title: "Character & Leadership Education 7", creditHours: 1, years: 1 },
      { code: "INS 401", title: "Project Management", creditHours: 2, years: 1 },
      { code: "SEN 401", title: "Software Configuration Management", creditHours: 2, years: 1 },
      { code: "TUM-SEN 441", title: "Secure Software Development", creditHours: 3, years: 1 },
      { code: "TUM-SEN 443", title: "Software Maintenance and Evolution", creditHours: 2, years: 1 },
      { code: "TUM-SEN 445", title: "Software Engineering Project", creditHours: 2, years: 1 }
    ]
  },
  "JUPEB Art (SC001)": {
    "100": [
      { code: "CRS 001", title: "Christian Religious Studies I", creditHours: 3, years: 1 },
      { code: "CRS 002", title: "Christian Religious Studies II", creditHours: 3, years: 1 },
      { code: "GOV 001", title: "Government I", creditHours: 3, years: 1 },
      { code: "GOV 002", title: "Government II", creditHours: 3, years: 1 },
      { code: "GST 111", title: "Communication in English Language", creditHours: 2, years: 1 },
      { code: "LIT 001", title: "Literature in English I", creditHours: 3, years: 1 },
      { code: "LIT 002", title: "Literature in English II", creditHours: 3, years: 1 }
    ]
  },
  "JUPEB Commercial (SC019)": {
    "100": [
      { code: "ACC 001", title: "Accounting I", creditHours: 3, years: 1 },
      { code: "ACC 002", title: "Accounting II", creditHours: 3, years: 1 },
      { code: "BUS 001", title: "Business Management I", creditHours: 3, years: 1 },
      { code: "BUS 002", title: "Business Management II", creditHours: 3, years: 1 },
      { code: "ECO 001", title: "Economics I", creditHours: 3, years: 1 },
      { code: "ECO 002", title: "Economics II", creditHours: 3, years: 1 },
      { code: "GST 111", title: "Communication in English Language", creditHours: 2, years: 1 }
    ]
  },
  "JUPEB Medical and Applied Sciences (SC031)": {
    "100": [
      { code: "BIO 001", title: "Biology I", creditHours: 6, years: 1 },
      { code: "BIO 002", title: "Biology II", creditHours: 4, years: 1 },
      { code: "CHM 001", title: "Chemistry I", creditHours: 6, years: 1 },
      { code: "CHM 002", title: "Chemistry II", creditHours: 4, years: 1 },
      { code: "GST 111", title: "Communication in English Language", creditHours: 2, years: 1 },
      { code: "PHY 001", title: "Physics I", creditHours: 6, years: 1 },
      { code: "PHY 002", title: "Physics II", creditHours: 4, years: 1 }
    ]
  },
  "JUPEB Engineering and Computing (SC038)": {
    "100": [
      { code: "CHM 001", title: "Chemistry I", creditHours: 6, years: 1 },
      { code: "CHM 002", title: "Chemistry II", creditHours: 4, years: 1 },
      { code: "GST 111", title: "Communication in English Language", creditHours: 2, years: 1 },
      { code: "MAT 001", title: "Mathematics I", creditHours: 4, years: 1 },
      { code: "MAT 002", title: "Mathematics II", creditHours: 4, years: 1 },
      { code: "PHY 001", title: "Physics I", creditHours: 6, years: 1 },
      { code: "PHY 002", title: "Physics II", creditHours: 4, years: 1 }
    ]
  },
  "Law": {
    "100": [
      { code: "ECO 101", title: "Principles of Economics I", creditHours: 2, years: 1 },
      { code: "TUM-GES 101", title: "Lawman and society", creditHours: 1, years: 1 },
      { code: "TUM-GES 103", title: "Character & Leadership Education 1", creditHours: 1, years: 1 },
      { code: "GST 111", title: "Communication in English Language", creditHours: 2, years: 1 },
      { code: "TUM-JIL 103", title: "Nigerian Legal System", creditHours: 2, years: 1 },
      { code: "LAW 101", title: "Legal Method I", creditHours: 2, years: 1 },
      { code: "TUM-LAW 150", title: "Office Productivity", creditHours: 2, years: 1 },
      { code: "PHL 105", title: "Logic and Philosophy of Law", creditHours: 2, years: 1 },
      { code: "PSY 101", title: "General Psychology", creditHours: 2, years: 1 },
      { code: "PUL 101", title: "Constitutional Law I", creditHours: 4, years: 1 },
      { code: "SOC 101", title: "Introduction to Sociology", creditHours: 3, years: 1 }
    ],
    "200": [
      { code: "CIL 201", title: "Law of Contract I", creditHours: 4, years: 1 },
      { code: "ENT 211", title: "Entrepreneurship & Innovation", creditHours: 2, years: 1 },
      { code: "TUM-GES 201", title: "Emotional Intelligence & Critical Thinking", creditHours: 1, years: 1 },
      { code: "TUM-GES 203", title: "Character & Leadership Education 3", creditHours: 1, years: 1 },
      { code: "TUM-LAW 250", title: "Cyber Security Awareness", creditHours: 2, years: 1 },
      { code: "TUM-PPL 201", title: "Law of Torts", creditHours: 2, years: 1 },
      { code: "PUL 201", title: "Constitutional Law II", creditHours: 4, years: 1 },
      { code: "TUM-PUL 201", title: "Administrative Law", creditHours: 2, years: 1 },
      { code: "PUL 203", title: "Criminal Law I", creditHours: 4, years: 1 }
    ],
    "300": [
      { code: "CIL 303", title: "Company Law I", creditHours: 4, years: 1 },
      { code: "ENT 312", title: "Venture Creation", creditHours: 2, years: 1 },
      { code: "TUM-GES 301", title: "Peace & Conflict Resolution", creditHours: 1, years: 1 },
      { code: "TUM-GES 303", title: "Character & Leadership Education 5", creditHours: 1, years: 1 },
      { code: "TUM-LAW 350", title: "Analyzing and Visualizing Data Using Power BI", creditHours: 2, years: 1 },
      { code: "TUM-MOS 311", title: "Moral and Ethical Studies", creditHours: 3, years: 1 },
      { code: "PPL 301", title: "Equity and Trusts", creditHours: 4, years: 1 },
      { code: "TUM-PPL 302", title: "Land Law", creditHours: 2, years: 1 },
      { code: "PUL 301", title: "Criminal Law II", creditHours: 4, years: 1 },
      { code: "TUM-PUL 304", title: "Human Rights Law", creditHours: 3, years: 1 }
    ],
    "400": [
      { code: "CLE 401", title: "Clinical Legal Education I", creditHours: 4, years: 1 },
      { code: "TUM-GES 401", title: "Professional Ethics & Career Development", creditHours: 1, years: 1 },
      { code: "TUM-GES 403", title: "Character & Leadership Education 7", creditHours: 1, years: 1 },
      { code: "TUM-LAW 450", title: "Client Management", creditHours: 2, years: 1 },
      { code: "TUM-PPL 401", title: "Family Law", creditHours: 3, years: 1 },
      { code: "PPL 403", title: "Law of Evidence", creditHours: 4, years: 1 },
      { code: "PPL 405", title: "Conflict of Laws", creditHours: 4, years: 1 },
      { code: "PUL 401", title: "Public International Law", creditHours: 4, years: 1 },
      { code: "TUM-PUL 403", title: "Law of Taxation", creditHours: 3, years: 1 }
    ],
    "500": [
      { code: "TUM-CIL 503", title: "Insurance Law", creditHours: 2, years: 1 },
      { code: "JIL 501", title: "Jurisprudence", creditHours: 4, years: 1 },
      { code: "TUM-JIL 503", title: "International Humanitarian Law", creditHours: 2, years: 1 },
      { code: "TUM-LAW 501", title: "Legal Practice and Skills", creditHours: 2, years: 1 },
      { code: "TUM-LAW 550", title: "ISO 37001 Anti-Bribery Foundation", creditHours: 2, years: 1 },
      { code: "PPL 501", title: "Civil Procedure", creditHours: 4, years: 1 },
      { code: "TUM-PPL 501", title: "Law of Succession and Wills", creditHours: 2, years: 1 }
    ]
  },
  "Medicine and Surgery": {
    "100": [
      { code: "BIO 101", title: "General Biology I", creditHours: 2, years: 1 },
      { code: "BIO 107", title: "General Practical Biology I", creditHours: 2, years: 1 },
      { code: "CHM 101", title: "General Chemistry I", creditHours: 2, years: 1 },
      { code: "CHM 107", title: "General Practical Chemistry I", creditHours: 2, years: 1 },
      { code: "TUM-GES 101", title: "Lawman and society", creditHours: 1, years: 1 },
      { code: "TUM-GES 103", title: "Character & Leadership Education 1", creditHours: 1, years: 1 },
      { code: "GST 111", title: "Communication in English Language", creditHours: 2, years: 1 },
      { code: "TUM-MCS 150", title: "Office Productivity", creditHours: 2, years: 1 },
      { code: "MTH 101", title: "Elementary Mathematics I", creditHours: 2, years: 1 },
      { code: "PHY 101", title: "General Physics I", creditHours: 2, years: 1 },
      { code: "PHY 107", title: "General Practical Physics I", creditHours: 2, years: 1 }
    ],
    "200": [
      { code: "ANA 201", title: "Gross Anatomy I", creditHours: 6, years: 1 },
      { code: "ANA 203", title: "Histology", creditHours: 1, years: 1 },
      { code: "ANA 205", title: "Embryology", creditHours: 1, years: 1 },
      { code: "ANA 207", title: "Neuroanatomy", creditHours: 9, years: 1 },
      { code: "BCH 201", title: "General Biochemistry I", creditHours: 1, years: 1 },
      { code: "BCH 205", title: "Medical Biochemistry I", creditHours: 1, years: 1 },
      { code: "BCH 207", title: "Metabolism and Nutrition", creditHours: 3, years: 1 },
      { code: "BCH 209", title: "Biochemistry Practical", creditHours: 1, years: 1 },
      { code: "COM 201", title: "Introduction to Community Health", creditHours: 1, years: 1 },
      { code: "COM 203", title: "Medical Sociology", creditHours: 1, years: 1 },
      { code: "COM 205", title: "Medical Statistics", creditHours: 1, years: 1 },
      { code: "CSS 201", title: "Forensic Science", creditHours: 3, years: 1 },
      { code: "ENT 211", title: "Entrepreneurship & Innovation", creditHours: 2, years: 1 },
      { code: "TUM-GES 201", title: "Emotional Intelligence & Critical Thinking", creditHours: 1, years: 1 },
      { code: "TUM-GES 203", title: "Character & Leadership Education 3", creditHours: 1, years: 1 },
      { code: "MBS 203", title: "Introduction to Clinical Medicine", creditHours: 1, years: 1 },
      { code: "TUM-MCS 250", title: "Health Informatics (Using Power BI)", creditHours: 2, years: 1 },
      { code: "MDH 201", title: "Medical Humanities I", creditHours: 1, years: 1 },
      { code: "MDH 203", title: "Medical Humanities II", creditHours: 1, years: 1 },
      { code: "PHS 201", title: "Introduction to Public Health", creditHours: 1, years: 1 },
      { code: "PHS 203", title: "Epidemiology I", creditHours: 1, years: 1 },
      { code: "PHS 205", title: "Environmental Health", creditHours: 1, years: 1 },
      { code: "PHS 207", title: "Health Education", creditHours: 3, years: 1 }
    ],
    "300": [
      { code: "CSS 301", title: "Forensic Medicine", creditHours: 3, years: 1 },
      { code: "ENT 312", title: "Venture Creation", creditHours: 2, years: 1 },
      { code: "TUM-GES 301", title: "Peace & Conflict Resolution", creditHours: 1, years: 1 },
      { code: "TUM-GES 303", title: "Character & Leadership Education 5", creditHours: 1, years: 1 },
      { code: "TUM-MCS 350", title: "Data Analysis Using IBM SPSS 1", creditHours: 2, years: 1 },
      { code: "TUM-MOS 311", title: "Moral and Ethical Studies", creditHours: 3, years: 1 },
      { code: "PHS 301", title: "Epidemiology II", creditHours: 2, years: 1 },
      { code: "PHS 303", title: "Health Systems and Management", creditHours: 2, years: 1 },
      { code: "PHS 305", title: "Occupational Health", creditHours: 1, years: 1 }
    ],
    "400": [
      { code: "TUM-GES 401", title: "Professional Ethics & Career Development", creditHours: 1, years: 1 },
      { code: "TUM-GES 403", title: "Character & Leadership Education 7", creditHours: 1, years: 1 },
      { code: "TUM-MCS 450", title: "Medical Coding and Billing", creditHours: 2, years: 1 }
    ]
  }
};