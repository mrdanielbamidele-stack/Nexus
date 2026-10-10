import { FACULTIES } from '../../data/faculties'

// Pick the one department a staff member mostly works with. Grouped by faculty.
export default function DepartmentPicker({ value, onChange, disabled }) {
  return (
    <div>
      {FACULTIES.map(faculty => (
        <div className="set-faculty" key={faculty.name}>
          <h3 className="set-faculty-name">{faculty.name}</h3>
          <div className="set-dept-grid" role="radiogroup" aria-label={faculty.name}>
            {faculty.departments.map(department => (
              <button
                key={department}
                type="button"
                role="radio"
                aria-checked={value === department}
                className={`set-dept${value === department ? ' on' : ''}`}
                disabled={disabled}
                onClick={() => onChange(department)}
              >
                {department}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
