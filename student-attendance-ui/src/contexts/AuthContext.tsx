import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { authApi } from '../api/auth'
import { setUnauthorizedHandler, tokenStore } from '../api/client'
import type {
  AuthResponse,
  AuthUser,
  LoginRequest,
  RegisterRequest,
} from '../types'

export type AuthStatus = 'loading' | 'authenticated' | 'anonymous'

interface AuthContextValue {
  status: AuthStatus
  user: AuthUser | null
  login: (payload: LoginRequest) => Promise<AuthUser>
  register: (payload: RegisterRequest) => Promise<AuthUser>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  // Initialize status from the persisted token so we don't have to flip
  // it inside an effect when there's no session at all.
  const [status, setStatus] = useState<AuthStatus>(() =>
    tokenStore.get() ? 'loading' : 'anonymous',
  )
  // Avoid repeating the bootstrap fetch under React 18 strict-mode double-invoke.
  const bootstrapped = useRef(false)

  const clearSession = useCallback(() => {
    tokenStore.clear()
    setUser(null)
    setStatus('anonymous')
  }, [])

  const applyAuth = useCallback((response: AuthResponse) => {
    tokenStore.set(response.token)
    setUser(response.user)
    setStatus('authenticated')
    return response.user
  }, [])

  // If any API call returns 401 we drop the local session so the UI flips
  // back to "anonymous" without the user having to refresh manually.
  useEffect(() => {
    setUnauthorizedHandler(() => {
      if (tokenStore.get()) clearSession()
    })
    return () => setUnauthorizedHandler(null)
  }, [clearSession])

  // On mount: if we already have a saved token, validate it by hitting /auth/me.
  useEffect(() => {
    if (bootstrapped.current) return
    bootstrapped.current = true

    const token = tokenStore.get()
    if (!token) return // initial status is already 'anonymous'

    authApi
      .me()
      .then((u) => {
        setUser(u)
        setStatus('authenticated')
      })
      .catch(() => clearSession())
  }, [clearSession])

  const login = useCallback(
    async (payload: LoginRequest) => {
      const res = await authApi.login(payload)
      return applyAuth(res)
    },
    [applyAuth],
  )

  const register = useCallback(
    async (payload: RegisterRequest) => {
      const res = await authApi.register(payload)
      return applyAuth(res)
    },
    [applyAuth],
  )

  const value = useMemo<AuthContextValue>(
    () => ({
      status,
      user,
      login,
      register,
      logout: clearSession,
    }),
    [status, user, login, register, clearSession],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}
