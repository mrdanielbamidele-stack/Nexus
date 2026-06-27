import { useNavigate } from 'react-router'
import './PreTestWarning.css'

export default function PreTestWarning({ warning, onStart }) {
  const navigate = useNavigate()

  return (
    <div className="ptw-overlay">
      <div className="ptw-modal">

        <div className="ptw-modal-header">
          
          <div className="ptw-course-name">{warning.courseTitle}</div>
          <p className="ptw-tagline">{warning.tagline}</p>
        </div>

        <div className="ptw-cannot-section">
          <div className="ptw-section-label">
            <i className="fa-solid fa-circle-xmark" /> Cannot be tested here
          </div>
          <ul className="ptw-list">
            {warning.cannotTest.map((item, i) => (
              <li key={i}>
                <span className="ptw-x">✗</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        {warning.examTip && (
          <div className="ptw-tip">
            <p>{warning.examTip}</p>
          </div>
        )}

        <div className="ptw-actions">
          <button className="ptw-btn-back" onClick={() => navigate('/campaign')}>
            Back to Campaign
          </button>
          <button className="ptw-btn-start" onClick={onStart}>
            Continue to  Test
          </button>
        </div>

      </div>
    </div>
  )
}
