import { createContext, useContext, useState } from 'react'
import { login as apiLogin } from '../services/api'

const AuthContext = createContext(null)
const STORAGE_KEY = 'cloudguard_auth'

function readStored() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY))
  } catch {
    return null
  }
}

export function AuthProvider({ children }) {
  const [auth, setAuth] = useState(readStored)

  const login = async (email, password, remember) => {
    const data = await apiLogin(email, password)
    setAuth(data)
    try {
      if (remember) localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
    } catch {
      /* storage unavailable – session only */
    }
    return data
  }

  const logout = () => {
    setAuth(null)
    try {
      localStorage.removeItem(STORAGE_KEY)
    } catch {
      /* ignore */
    }
  }

  return (
    <AuthContext.Provider value={{ user: auth?.user ?? null, isAuthenticated: !!auth, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext)
