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
  const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token')
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
      sessionStorage.removeItem('auth_token')
      // Ne pas recharger automatiquement, laisser le contexte gérer
    }
    return Promise.reject(error)
  }
)

export interface User {
  id: string
  email: string
  name: string
  roles: string[]
  is_active: boolean
  is_verified: boolean
  avatar_url?: string
  google_id?: string
  created_at: string
}

export interface CreateSandboxRequest {
  name: string
  email: string
  duration_hours: number
  description?: string
  software_type_id: string
}

export interface SandboxResponse {
  id: string
  name: string
  email: string
  duration_hours: number
  status: 'running' | 'stopped' | 'expired'
  price: number
  user_id: string
  software_type_id: string
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

export const changePassword = async (currentPassword: string, newPassword: string): Promise<any> => {
  const response = await api.post('/api/v1/auth/change-password', {
    current_password: currentPassword,
    new_password: newPassword
  })
  return response.data
}

export const deleteAccount = async (): Promise<void> => {
  await api.delete('/api/v1/auth/profile')
}

export const getPricing = async (): Promise<any> => {
  const response = await api.get('/api/v1/pricing')
  return response.data
}

export const apiService = {
  async createSandboxPayment(data: CreateSandboxRequest): Promise<any> {
    const response = await api.post('/api/v1/sandboxes/', data)
    return response.data
  },

  async createSandbox(data: CreateSandboxRequest): Promise<SandboxResponse> {
    const response = await api.post('/api/v1/sandboxes/', data)
    return response.data
  },

  async getSandboxes(): Promise<SandboxResponse[]> {
    const response = await api.get('/api/v1/sandboxes/')
    return response.data
  },

  async getAllSandboxes(): Promise<SandboxResponse[]> {
    const response = await api.get('/api/v1/admin/sandboxes/')
    return response.data
  },

  async deleteSandbox(sandboxId: string): Promise<void> {
    await api.delete(`/api/v1/admin/sandboxes/${sandboxId}`)
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
  changePassword,
  deleteAccount,
  
  // Pricing operations
  getPricing,

  // Admin user management
  async getUsers(): Promise<User[]> {
    const response = await api.get('/api/v1/admin/users')
    return response.data
  },

  async getRoles(): Promise<{id: string, name: string, description: string}[]> {
    const response = await api.get('/api/v1/admin/roles')
    return response.data
  },

  async getSoftwareTypes(): Promise<{id: string, name: string, description: string, base_price_per_hour: number}[]> {
    const response = await api.get('/api/v1/software-types')
    return response.data
  },

  async getAdminSoftwareTypes(): Promise<{id: string, name: string, description: string, base_price_per_hour: number}[]> {
    const response = await api.get('/api/v1/admin/software-types')
    return response.data
  },

  async getAdminPricing(): Promise<any[]> {
    const response = await api.get('/api/v1/admin/pricing')
    return response.data
  },

  async createSoftwareType(data: any): Promise<any> {
    const response = await api.post('/api/v1/admin/software-types', data)
    return response.data
  },

  async updateSoftwareType(id: string, data: any): Promise<any> {
    const response = await api.put(`/api/v1/admin/software-types/${id}`, data)
    return response.data
  },

  async deleteSoftwareType(id: string): Promise<void> {
    await api.delete(`/api/v1/admin/software-types/${id}`)
  },

  async createPricing(data: any): Promise<any> {
    const response = await api.post('/api/v1/admin/pricing', data)
    return response.data
  },

  async updatePricing(id: string, data: any): Promise<any> {
    const response = await api.put(`/api/v1/admin/pricing/${id}`, data)
    return response.data
  },

  async deletePricing(id: string): Promise<void> {
    await api.delete(`/api/v1/admin/pricing/${id}`)
  },

  async createRole(data: any): Promise<any> {
    const response = await api.post('/api/v1/admin/roles', data)
    return response.data
  },

  async updateRole(id: string, data: any): Promise<any> {
    const response = await api.put(`/api/v1/admin/roles/${id}`, data)
    return response.data
  },

  async deleteRole(id: string): Promise<void> {
    await api.delete(`/api/v1/admin/roles/${id}`)
  },

  async addRoleToUser(userId: string, roleName: string): Promise<void> {
    await api.post(`/api/v1/admin/users/${userId}/roles`, { role_name: roleName })
  },

  async removeRoleFromUser(userId: string, roleName: string): Promise<void> {
    await api.delete(`/api/v1/admin/users/${userId}/roles/${roleName}`)
  },

  async activateUser(userId: string): Promise<void> {
    await api.put(`/api/v1/admin/users/${userId}/activate`)
  },

  async deactivateUser(userId: string): Promise<void> {
    await api.put(`/api/v1/admin/users/${userId}/deactivate`)
  },

  async deleteUser(userId: string): Promise<void> {
    await api.delete(`/api/v1/admin/users/${userId}`)
  },

  async getUserSandboxes(userId: string): Promise<SandboxResponse[]> {
    const response = await api.get(`/api/v1/admin/users/${userId}/sandboxes`)
    return response.data
  },

  async deleteUserWithSandboxes(userId: string): Promise<{
    message: string
    deleted_sandboxes_count: number
    deleted_sandboxes: Array<{
      id: string
      name: string
      status: string
      container_name?: string
    }>
  }> {
    const response = await api.delete(`/api/v1/admin/users/${userId}`)
    return response.data
  }
} 