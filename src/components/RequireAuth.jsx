import { Navigate, useLocation } from "react-router";
import { isAuthed } from "../lib/studentAuth";

// Wrap any protected route. If the student isn't signed in we bounce them to
// /auth, remembering where they were headed via ?next= so the auth flow can
// send them right back once they're done.
export default function RequireAuth({ children }) {
  const location = useLocation();
  if (!isAuthed()) {
    const next = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/auth?next=${next}`} replace />;
  }
  return children;
}
