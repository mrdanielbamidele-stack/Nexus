import { Link } from 'react-router'
import { formatCode } from '../lib/courseSlug'
import '../../nexus-breadcrumb.css'
import ScrollToTop from '../components/ScrollToTop'

// Nexus breadcrumb for the pages reached from the campaign page:
// Dashboard / Campaign / <course>. Mirrors the trail used in CoursePage.
export default function CampaignBreadcrumb({ courseCode }) {
  return (
    <nav className="nx-breadcrumb nx-fixed" aria-label="breadcrumb">
      <ScrollToTop />
      <Link className="nx-bc-item" to="/campaign">
        <span className="nx-bc-home-dot"></span>
        Campaign
      </Link>
      <span className="nx-bc-sep">/</span>
      <span className="nx-bc-item nx-bc-current">
        {formatCode(courseCode)}
      </span>
    </nav>
  )
}
