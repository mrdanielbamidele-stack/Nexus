import { createContext, useContext } from 'react'

// `call(path, options)` talks to /api/dele/... and, if the owner session has
// ended, flips the whole area back to the password screen.
export const DeleContext = createContext(null)

export const useDele = () => useContext(DeleContext)
