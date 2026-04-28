import { api } from './client'
import type {
  AuthResponse,
  AuthUser,
  LoginRequest,
  RegisterRequest,
} from '../types'

export const authApi = {
  register(payload: RegisterRequest): Promise<AuthResponse> {
    return api.post<AuthResponse>('/auth/register', payload).then((r) => r.data)
  },
  login(payload: LoginRequest): Promise<AuthResponse> {
    return api.post<AuthResponse>('/auth/login', payload).then((r) => r.data)
  },
  me(): Promise<AuthUser> {
    return api.get<AuthUser>('/auth/me').then((r) => r.data)
  },
}
