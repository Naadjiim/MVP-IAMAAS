import axios from 'axios'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('auth_token')
      window.location.reload()
    }
    return Promise.reject(error)
  }
)

export interface CreateSandboxRequest {
  name: string
  email: string
  duration_hours: number
  description?: string
  software_type?: 'keycloak'
}

export interface SandboxResponse {
  id: string
  name: string
  email: string
  duration_hours: number
  status: 'running' | 'stopped' | 'expired'
  price: number
  user_id: string
  software_type: 'keycloak'
  created_at: string
  expires_at: string
  access_url: string
  admin_username?: string
  container_id?: string
  description?: string
}

// Auth operations
export const login = async (email: string, password: string): Promise<any> => {
  const response = await api.post('/api/v1/auth/login', { email, password })
  return response.data
}

export const register = async (email: string, password: string, name: string): Promise<any> => {
  const response = await api.post('/api/v1/auth/register', { email, password, name })
  return response.data
}

export const googleLogin = async (token: string): Promise<any> => {
  const response = await api.post('/api/v1/auth/google', { token })
  return response.data
}

export const logout = async (): Promise<void> => {
  await api.post('/api/v1/auth/logout')
}

export const getCurrentUser = async (): Promise<any> => {
  const response = await api.get('/api/v1/auth/me')
  return response.data
}

export const updateProfile = async (name: string): Promise<any> => {
  const response = await api.put('/api/v1/auth/profile', { name })
  return response.data
}

export const deleteAccount = async (): Promise<void> => {
  await api.delete('/api/v1/auth/account')
}

export const getPricing = async (): Promise<any> => {
  const response = await api.get('/api/v1/pricing')
  return response.data
}

export const apiService = {
  async createSandbox(data: CreateSandboxRequest): Promise<SandboxResponse> {
    const response = await api.post('/api/v1/sandboxes/', data)
    return response.data
  },

  async getSandboxes(): Promise<SandboxResponse[]> {
    const response = await api.get('/api/v1/sandboxes/')
    return response.data
  },

  async getSandbox(id: string): Promise<SandboxResponse> {
    const response = await api.get(`/api/v1/sandboxes/${id}`)
    return response.data
  },

  async deleteSandbox(id: string): Promise<void> {
    await api.delete(`/api/v1/sandboxes/${id}`)
  },

  async updateSandbox(id: string, data: Partial<CreateSandboxRequest>): Promise<SandboxResponse> {
    const response = await api.put(`/api/v1/sandboxes/${id}`, data)
    return response.data
  },

  // Auth operations
  login,
  register,
  googleLogin,
  logout,
  getCurrentUser,
  updateProfile,
  deleteAccount,
  
  // Pricing operations
  getPricing
} 