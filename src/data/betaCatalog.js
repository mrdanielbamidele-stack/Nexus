// Course catalog for the 2025/2026 Beta (second) semester - the courses a student
// can take again as a "reseat" after the semester has passed.
//
// Source: "2025/2026 BETA SEMESTER TIMETABLES" PDF. It lists every course a
// programme + level sits in the Beta semester, so each list below is exactly
// what that timetable shows (a level with no timetable has no entry).
//
// Same shape as courseCatalog.js - { programme: { level: [{ code, title }] } } -
// and the same programme names, so the two can be used side by side. Chemical
// Engineering and Telecommunications Engineering are new here: they have a Beta
// timetable but are not in the Primo catalog.
//
// TITLES: the timetable has course codes only. Titles in TITLES below are
// worked out from the sibling Primo course (CHM 101 "General Chemistry I" ->
// CHM 102 "General Chemistry II", JUPEB 001/002 -> 003/004). A course with no
// such sibling shows "Title to be confirmed" - search this file for TBC and
// fill the title in TITLES; nothing else needs to change.

export const TBC = 'Title to be confirmed'

const TITLES = {
  // Sciences
  'CHM 102': 'General Chemistry II',
  'CHM 108': 'General Practical Chemistry II',
  'PHY 102': 'General Physics II',
  'PHY 104': 'General Physics IV',
  'PHY 108': 'General Practical Physics II',
  'MTH 102': 'Elementary Mathematics II',
  'BIO 102': 'General Biology II',
  'BIO 108': 'General Practical Biology II',
  'COS 102': 'Problem Solving',
  'COS 202': 'Computer Programming II',

  // General education (Character & Leadership Education runs 1, 3, 5, 7 in Primo)
  'TUM-GES 104': 'Character & Leadership Education 2',
  'TUM-GES 204': 'Character & Leadership Education 4',
  'TUM-GES 304': 'Character & Leadership Education 6',

  // Engineering
  'GET 102': 'Engineering Graphics & Solid Modeling I',
  'GET 202': 'Applied Electricity II',
  'GET 204': 'Workshop Practice',
  'GET 210': 'Engineering Mathematics II',
  'GET 302': 'Engineering Mathematics IV',
  'CEE 302': 'Structural Analysis II',
  'CEE 306': 'Soil Mechanics II',
  'EEE 322': 'Analogue Electronic Circuits II',

  // Management and social sciences
  'ACC 102': 'Introduction to Financial Accounting II',
  'AMS 102': 'Business Mathematics II',
  'ECO 102': 'Principles of Economics II',
  'ACC 202': 'Financial Accounting II',
  'ACC 204': 'Cost Accounting II',
  'ACC 302': 'Intermediate Financial Reporting II',
  'ACC 306': 'Auditing and Investigations II',
  'ACC 308': 'Taxation II',
  'ACC 402': 'Advanced Financial Reporting II',

  // Health sciences
  'ANA 202': 'Gross Anatomy II',
  'BCH 202': 'General Biochemistry II',
  'NSC 202': 'Foundations of Nursing II',
  'TUM-NSC 202': 'Nursing Practicum II',

  // Law
  'LAW 102': 'Legal Method II',
  'CIL 202': 'Law of Contract II',
  'CIL 304': 'Company Law II',

  // JUPEB (001/002 are the Primo courses, 003/004 the Beta ones)
  'CRS 003': 'Christian Religious Studies III',
  'CRS 004': 'Christian Religious Studies IV',
  'GOV 003': 'Government III',
  'GOV 004': 'Government IV',
  'LIT 003': 'Literature in English III',
  'LIT 004': 'Literature in English IV',
  'ACC 003': 'Accounting III',
  'ACC 004': 'Accounting IV',
  'BUS 003': 'Business Management III',
  'BUS 004': 'Business Management IV',
  'ECO 003': 'Economics III',
  'ECO 004': 'Economics IV',
  'BIO 003': 'Biology III',
  'BIO 004': 'Biology IV',
  'BIO 003P': 'Biology III Practical',
  'CHM 003': 'Chemistry III',
  'CHM 004': 'Chemistry IV',
  'CHM 003P': 'Chemistry III Practical',
  'PHY 003': 'Physics III',
  'PHY 004': 'Physics IV',
  'PHY 003P': 'Physics III Practical',
  'MAT 003': 'Mathematics III',
  'MAT 004': 'Mathematics IV',
}

// Codes are written as the timetable prints them ("TUM-GES104", "BIO003P") and
// turned into the catalog's form ("TUM-GES 104", "BIO 003P").
const spaced = code => code.replace(/^([A-Z-]+)(\d)/, '$1 $2')

const level = (...codes) =>
  [...new Set(codes.map(spaced))].map(code => ({ code, title: TITLES[code] || TBC }))

export const betaCatalog = {
  'Chemical Engineering': {
    '100': level('CHM102', 'TUM-GES104', 'PHY104', 'PHY108', 'TUM-GET104', 'TUM-GES102', 'TUM-GES106', 'CHM108', 'MTH102', 'GST112', 'GET102'),
    '200': level('GET206', 'GET208', 'GET204', 'TUM-GET214', 'GET210', 'GST212', 'TUM-GES202', 'TUM-GES204'),
    '300': level('TUM-GES302', 'GET302', 'GET304', 'TUM-GES304', 'GET306', 'GST312'),
    '500': level('TUM-GES402', 'GET502'),
  },
  'Civil Engineering': {
    '100': level('CHM102', 'PHY104', 'TUM-GES102', 'TUM-GET104', 'TUM-GES104', 'TUM-GES106', 'CHM108', 'MTH102', 'GET102', 'PHY108', 'GST112'),
    '200': level('GET206', 'GET202', 'GET208', 'GET204', 'GST212', 'TUM-GET214', 'GET210', 'TUM-GES204', 'TUM-GES202'),
    '300': level('TUM-GES302', 'CEE302', 'CEE306', 'CEE308', 'CEE304', 'GET302', 'CEE303', 'GET304', 'TUM-GES304', 'GET306', 'GST312'),
    '500': level('TUM-GES402', 'GET502'),
  },
  'Computer Engineering': {
    '100': level('TUM-GES104', 'PHY104', 'TUM-GES102', 'CPE112', 'TUM-GET104', 'TUM-GES106', 'GST112', 'MTH102', 'GET102', 'PHY108'),
    '200': level('CET202', 'GET206', 'GET202', 'GET208', 'GET204', 'TUM-GES202', 'TUM-GET214', 'GET210', 'TUM-GES204'),
    '300': level('CPE302', 'TUM-CPE306', 'EEE322', 'GET302', 'GET304', 'GET306', 'TUM-GES304', 'GST312', 'TUM-CPE304', 'TUM-GES302'),
    '500': level('TUM-CPE508', 'TUM-GES402', 'CPE502', 'CPE514', 'GET502', 'TUM-CPE504'),
  },
  'Electrical and Electronics Engineering': {
    '100': level('CHM102', 'TUM-GES104', 'PHY104', 'PHY108', 'TUM-GET104', 'GST112', 'TUM-GES106', 'CHM108', 'MTH102', 'EEE102', 'GET102', 'TUM-GES102'),
    '200': level('GET206', 'GET208', 'GET204', 'TUM-GET214', 'GET210', 'EEE202', 'GST212', 'TUM-GES202', 'TUM-GES204', 'EEE204'),
    '300': level('EEE322', 'EEE324', 'GET302', 'TUM-EEE302', 'GET304', 'GET306', 'GST312', 'TUM-GES302', 'EEE326', 'TUM-GES304'),
    '500': level('TUM-CPE508', 'TUM-GES402', 'TUM-EEE504', 'TUM-EEE506', 'CPE502', 'GET502', 'TUM-EEE502'),
  },
  'Mechanical Engineering': {
    '100': level('CHM102', 'PHY104', 'PHY108', 'TUM-GET104', 'TUM-GES102', 'TUM-GES104', 'TUM-GES106', 'CHM108', 'GST112', 'MTH102', 'GET102'),
    '200': level('GET206', 'GET202', 'GET208', 'GET204', 'TUM-GET214', 'GET210', 'TUM-MEE206', 'GST212', 'TUM-GES204', 'TUM-GES202'),
    '300': level('MEE306', 'TUM-MEE313', 'GET302', 'GET304', 'GET306', 'TUM-GES304', 'TUM-MEE304', 'GST312', 'TUM-GES302'),
    '500': level('TUM-GES402', 'GET502'),
  },
  'Mechatronics Engineering': {
    '100': level('CHM102', 'PHY104', 'TUM-GES102', 'PHY108', 'TUM-GET104', 'GST112', 'TUM-GES106', 'CHM108', 'MTH102', 'TUM-GES104', 'GET102'),
    '200': level('GET206', 'GET202', 'GET208', 'GET204', 'TUM-GET214', 'TUM-MEE206', 'GST212', 'TUM-GES202', 'TUM-GES204'),
    '300': level('TUM-GES302', 'MEE306', 'EEE322', 'EEE324', 'GET302', 'GET304', 'TUM-GES304', 'GET306', 'GST312', 'TUM-MCE324'),
    '500': level('TUM-GES402', 'GET502'),
  },
  'Petroleum and Gas Engineering': {
    '100': level('CHM102', 'TUM-GES104', 'PHY104', 'TUM-GES102', 'TUM-GET104', 'TUM-GES106', 'GST112', 'CHM108', 'MTH102', 'PHY108', 'GET102'),
    '200': level('GET206', 'GET202', 'GET208', 'GET204', 'TUM-GET214', 'GET210', 'GST212', 'TUM-GES204', 'TUM-GES202'),
    '300': level('TUM-PGE304', 'TUM-PGE302', 'PGE302', 'PGE306', 'GET302', 'GET304', 'GET306', 'TUM-GES302', 'PGE304', 'GST312', 'TUM-GES304'),
    '500': level('TUM-PGE502', 'TUM-GES402', 'TUM-PGE504', 'PGE504', 'PGE502', 'TUM-PGE506', 'GET502'),
  },
  'Telecommunications Engineering': {
    '100': level('CHM102', 'TUM-GES104', 'PHY104', 'PHY108', 'TUM-GET104', 'TUM-GES102', 'TUM-GES106', 'CHM108', 'MTH102', 'GST112', 'GET102'),
    '200': level('GET206', 'GET202', 'GET208', 'GET204', 'TUM-GET214', 'GET210', 'GST212', 'TUM-GES202', 'TUM-GES204'),
    '300': level('TUM-GES302', 'EEE322', 'GET302', 'GET304', 'TUM-GES304', 'GET306', 'GST312'),
    '500': level('TUM-GES402', 'GET502'),
  },
  'Medical Laboratory Science': {
    '100': level('CHM102', 'BIO102', 'PHY102', 'GST112', 'TUM-GES104', 'TUM-GES106', 'CHM108', 'BIO108', 'PHY108', 'TUM-GES102'),
    '200': level('GST212', 'ANA202', 'BCH202', 'PIO216', 'PIO214', 'TUM-GES202', 'TUM-GES204'),
    '300': level('TUM-GES302', 'TUM-GES304', 'GST312'),
    '400': level('TUM-GES402'),
  },
  'Nursing Science': {
    '100': level('CHM102', 'TUM-GES102', 'PHY102', 'BIO102', 'TUM-GES104', 'TUM-NSC102', 'TUM-GES106', 'BIO108', 'CHM108', 'PHY108', 'GST112'),
    '200': level('TUM-GES204', 'NSC206', 'TUM-NSC213', 'TUM-NSC202', 'GST212', 'TUM-GES202', 'ANA204', 'TUM-BCH218', 'NSC202', 'TUM-ANA206', 'BCH202', 'TUM-NSC208', 'PIO212'),
    '300': level('TUM-NSC314', 'PHA302', 'NSC314', 'NSC312', 'TUM-ANA206', 'TUM-NSC318', 'TUM-GES302', 'NSC308', 'GST312', 'TUM-GES304', 'TUM-NSC310', 'NSC302'),
    '400': level('TUM-GES402'),
  },
  'Accounting': {
    '100': level('ACC102', 'TUM-ACC123', 'TUM-GES102', 'ECO102', 'AMS102', 'TUM-GES106', 'GST112', 'AMS104', 'TUM-GES104'),
    '200': level('ACC206', 'ACC202', 'TUM-GES202', 'ACC204', 'GST212', 'TUM-GES204'),
    '300': level('TUM-ACC322', 'ACC306', 'ACC308', 'ACC302', 'GST312', 'TUM-GES304', 'TUM-GES302'),
    '400': level('ACC404', 'TUM-ACC423', 'ACC402', 'TUM-GES402'),
  },
  'Architecture': {
    '100': level('TUM-ARC104', 'FAA104', 'TUM-ARC102', 'FAA126', 'TUM-GES102', 'TUM-GES106', 'TUM-ARC106', 'TUM-GES104', 'GST112'),
    '200': level('ARC202', 'TUM-ARC212', 'GST212', 'ARC206', 'TUM-ARC214', 'TUM-GES202', 'TUM-ARC210', 'ARC208', 'ARC204', 'TUM-GES204'),
    '400': level('TUM-GES302', 'TUM-GES304', 'TUM-GES402', 'GST312'),
  },
  'Biochemistry': {
    '100': level('CHM102', 'TUM-GES104', 'PHY108', 'PHY102', 'BIO102', 'TUM-GES102', 'TUM-GES106', 'BIO108', 'CHM108', 'MTH102', 'GST112'),
    '200': level('TUM-BCH218', 'BCH202', 'GST212', 'TUM-GES202', 'TUM-GES204'),
    '400': level('TUM-GES302', 'BCH408', 'TUM-BCH499', 'BCH402', 'TUM-BCH424', 'BCH404', 'TUM-GES304', 'TUM-GES402', 'GST312'),
  },
  'Biotechnology': {
    '100': level('CHM102', 'TUM-GES102', 'PHY102', 'BIO102', 'TUM-GES106', 'BIO108', 'GST112', 'TUM-GES104', 'CHM108', 'MTH102', 'TUM-BTG102', 'PHY108'),
    '200': level('GST212', 'TUM-GES202', 'TUM-GES204'),
    '400': level('BTG402', 'TUM-GES402', 'TUM-BTG402', 'BTG404', 'BTG406', 'GST312', 'TUM-GES302', 'TUM-GES304'),
  },
  'Business Administration': {
    '100': level('BUA102', 'ACC102', 'TUM-GES104', 'ECO102', 'AMS102', 'TUM-GES102', 'TUM-GES106', 'AMS104', 'GST112', 'TUM-BUS110'),
    '200': level('BUA202', 'BUA216', 'TUM-GES202', 'BUA204', 'GST212', 'BUA218', 'TUM-BUS220', 'TUM-GES204'),
    '300': level('TUM-GES302', 'BUA310', 'BUA304', 'TUM-BUS322', 'BUA302', 'TUM-GES304', 'BUA312', 'GST312'),
    '400': level('TUM-GES402', 'BUA402', 'TUM-BUS418', 'TUM-BUS417'),
  },
  'Computer Science': {
    '100': level('PHY102', 'TUM-GES104', 'PHY108', 'TUM-GES102', 'TUM-CSC122', 'COS102', 'TUM-GES106', 'MTH102', 'GST112'),
    '200': level('TUM-CSC222', 'COS202', 'TUM-CSC221', 'MTH202', 'TUM-GES202', 'IFT212', 'GST212', 'TUM-GES204'),
    '400': level('TUM-CSC422', 'TUM-CSC412', 'GST312', 'TUM-GES402', 'TUM-GES302', 'TUM-GES304', 'CSC402'),
  },
  'Criminology and Security Studies': {
    '100': level('TUM-CSS110', 'TUM-GES102', 'TUM-CSS106', 'TUM-GES106', 'CSS102', 'TUM-CSS112', 'TUM-GES104', 'CSS104', 'TUM-CSS108', 'GST112'),
    '200': level('SSC202', 'CSS206', 'TUM-CSS212', 'CSS204', 'TUM-CSS210', 'GST212', 'CSS202', 'TUM-GES202', 'TUM-GES204'),
    '300': level('TUM-CSS308', 'CSS304', 'SSC302', 'TUM-GES302', 'CSS302', 'GST312', 'TUM-GES304'),
    '400': level('CSS404', 'TUM-GES402', 'TUM-CSS408', 'CSS402', 'CSS406'),
  },
  'Cyber Security': {
    '100': level('PHY102', 'TUM-GES102', 'TUM-CYB122', 'TUM-GES104', 'TUM-CSC122', 'COS102', 'TUM-CYB121', 'MTH102', 'PHY108', 'GST112'),
    '200': level('TUM-SEN222', 'COS202', 'INS204', 'GST212', 'TUM-GES202', 'TUM-GES204'),
    '400': level('TUM-GES302', 'TUM-GES304', 'TUM-GES402', 'GST312'),
  },
  'Economics': {
    '100': level('ACC102', 'ECO104', 'TUM-GES102', 'ECO102', 'TUM-ECO116', 'TUM-GES106', 'TUM-GES104', 'GST112'),
    '200': level('SSC202', 'TUM-ECO221', 'ECO202', 'TUM-GES202', 'ECO204', 'TUM-ECO223', 'ECO206', 'GST212', 'TUM-GES204'),
    '300': level('ECO306', 'ECO304', 'ECO302', 'SSC302', 'TUM-GES304', 'TUM-GES302', 'ECO310'),
    '400': level('ECO406', 'ECO404', 'ECO402', 'TUM-ECO416', 'TUM-GES402'),
  },
  'Mass Communication': {
    '100': level('MCM102', 'CMS102', 'GST112', 'TUM-GES104', 'MCM104', 'MCM106', 'TUM-GES106', 'TUM-MAS110', 'TUM-MAS108', 'TUM-GES102'),
    '200': level('TUM-MAS208', 'MCM208', 'MCM210', 'TUM-GES202', 'TUM-MAS210', 'MCM202', 'GST212', 'TUM-GES204'),
    '300': level('TUM-MAS308', 'MCM304', 'MCM302', 'CMS302', 'GST312', 'TUM-GES304', 'TUM-GES302', 'MCM306'),
    '400': level('MCM406', 'TUM-GES402', 'TUM-MAS410', 'MCM404', 'MCM408', 'CMS402'),
  },
  'Mathematics': {
    '100': level('TUM-GES104', 'PHY108', 'PHY102', 'TUM-GES102', 'TUM-GES106', 'MTH102', 'GST112'),
    '200': level('MTH202', 'GST212', 'TUM-GES202', 'TUM-GES204'),
    '400': level('TUM-GES302', 'TUM-GES304', 'TUM-GES402', 'GST312'),
  },
  'Physics with Electronics': {
    '100': level('TUM-GES104', 'PHY104', 'PHY108', 'PHY102', 'TUM-GES106', 'MTH102', 'GST112'),
    '200': level('MTH202', 'GST212', 'TUM-GES204'),
    '400': level('GST312'),
  },
  'Public Health': {
    '100': level('CHM102', 'BIO102', 'PHY102', 'GST112', 'TUM-GES104', 'TUM-GES106', 'CHM108', 'BIO108', 'PHY108', 'TUM-GES102'),
    '200': level('PHS202', 'PHS204', 'TUM-PHS203', 'TUM-PHS206', 'TUM-PHS208', 'GST212', 'TUM-GES204', 'TUM-GES202'),
    '300': level('TUM-GES302', 'TUM-GES304', 'GST312'),
    '400': level('TUM-GES402'),
  },
  'Software Engineering': {
    '100': level('PHY102', 'TUM-SEN114', 'PHY108', 'TUM-GES102', 'TUM-CSC122', 'COS102', 'TUM-GES106', 'MTH102', 'TUM-GES104', 'GST112'),
    '200': level('TUM-SEN222', 'COS202', 'INS204', 'MTH202', 'GST212', 'IFT212', 'TUM-GES202', 'TUM-GES204'),
    '400': level('TUM-SEN442', 'TUM-SEN444', 'TUM-GES402', 'TUM-GES304', 'TUM-GES302', 'SEN410'),
  },
  'JUPEB Art (SC001)': {
    '100': level('GOV003', 'GOV004', 'CRS003', 'CRS004', 'LIT003', 'LIT004', 'TUM-GES104'),
  },
  'JUPEB Commercial (SC019)': {
    '100': level('ACC004', 'ACC003', 'ECO003', 'ECO004', 'BUS004', 'BUS003', 'TUM-GES104'),
  },
  'JUPEB Medical and Applied Sciences (SC031)': {
    '100': level('BIO003P', 'BIO004', 'BIO003', 'CHM004', 'CHM003', 'CHM003P', 'PHY003', 'PHY004', 'PHY003P', 'TUM-GES104'),
  },
  'JUPEB Engineering and Computing (SC038)': {
    '100': level('CHM004', 'CHM003', 'CHM003P', 'MAT004', 'MAT003', 'PHY003', 'PHY004', 'PHY003P', 'TUM-GES104'),
  },
  'Law': {
    '100': level('TUM-JIL104', 'TUM-GES104', 'TUM-GES102', 'TUM-GES106', 'PUL102', 'GST112', 'LAW102', 'TUM-LAW103'),
    '200': level('PUL202', 'GST212', 'PUL204', 'CIL202', 'TUM-PPL202', 'TUM-PUL202', 'TUM-GES204', 'TUM-GES202'),
    '300': level('TUM-GES302', 'TUM-PUL305', 'CIL304', 'PPL302', 'PUL302', 'TUM-GES304', 'GST312', 'TUM-PPL303'),
    '400': level('CLE402', 'TUM-PPL402', 'PUL402', 'PPL406', 'TUM-PUL404', 'TUM-GES402', 'PPL404'),
    '500': level('TUM-CIL504', 'TUM-PPL502', 'TUM-JIL504', 'JIL502', 'PPL502'),
  },
  'Medicine and Surgery': {
    '100': level('CHM102', 'BIO102', 'PHY102', 'GST112', 'TUM-GES104', 'CHM108', 'BIO108', 'MTH102', 'PHY108', 'TUM-GES102'),
    '200': level('PHS202', 'ANA204', 'PHS204', 'BCH202', 'GST212', 'CSS202', 'TUM-GES202'),
    '300': level('TUM-GES302', 'TUM-GES304', 'GST312'),
    '400': level('TUM-GES402'),
  },
}
