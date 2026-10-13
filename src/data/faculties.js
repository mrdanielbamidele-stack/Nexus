// Which faculty each department (programme) sits under. Staff pick a department
// and then only see that department's courses.
//
// A "department" here is the same string as a programme key in courseCatalog.js,
// so a department's courses are simply that programme's courses at every level.
// Edit the groupings below if the school's structure differs.

export const FACULTIES = [
  {
    name: 'Computing & Applied Sciences',
    departments: ['Computer Science', 'Software Engineering', 'Cyber Security', 'Biotechnology' ,'Architecture'],
  },
  {
    name: 'Engineering',
    departments: [
      'Civil Engineering',
      'Mechanical Engineering',
      'Electrical and Electronics Engineering',
      'Computer Engineering',
      'Mechatronics Engineering',
      'Petroleum & Gas Engineering',
    ],
  },
  {
    name: 'Management & Social Sciences',
    departments: [
      'Business Administration',
      'Accounting',
      'Economics',
      'Mass Communication',
      'Criminology and Security Studies',
    ],
  },
  {
    name: 'Health & Medical Sciences',
    departments: ['Medical Laboratory Science', 'Public Health', 'Nursing Science', 'Medicine & Surgery' , 'Biochemistry',  'Physics with Electronics', 'Mathematics'],
  },
  {
    name: 'Law',
    departments: ['Law'],
  },

  {
    name: 'JUPEB',
    departments: [
      'JUPEB Arts',
      'JUPEB Commercial',
      'JUPEB Medical & Applied Sciences',
      'JUPEB Engineering & Computing',
    ],
  },
]

export function facultyOf(department) {
  return FACULTIES.find(f => f.departments.includes(department))?.name || null
}

export const isDepartment = department => facultyOf(department) !== null

// The level labels of a programme, in teaching order ("100" ... "500", "JUPEB").
export function levelsOf(catalog, programme) {
  return Object.keys(catalog[programme] || {}).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
}

// Every course a department teaches, with the level it sits at, de-duplicated.
// [{ code, title, creditHours, level }] sorted by level then code.
export function coursesOfDepartment(catalog, department) {
  const byCode = new Map()
  for (const level of levelsOf(catalog, department)) {
    for (const course of catalog[department][level]) {
      if (!byCode.has(course.code)) byCode.set(course.code, { ...course, level })
    }
  }
  return [...byCode.values()]
}
