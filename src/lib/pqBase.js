import { useLocation } from 'react-router'

// The past-questions pages are used by students (/pastquestions/...) and by
// staff (/admin/pastquestions/...). Links inside them must stay in whichever
// area the person is in.
export function usePqBase() {
  const { pathname } = useLocation()
  const admin = pathname === '/admin' || pathname.startsWith('/admin/')
  return {
    papers: admin ? '/admin/pastquestions' : '/pastquestions',
    home: admin ? '/admin' : '/',
  }
}
