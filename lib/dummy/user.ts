// lib/dummy/user.ts - Dummy user data and auth simulation

export interface UserProfile {
  id: string
  email: string
  name: string
  phone?: string
  avatar?: string
  createdAt: string
}

export const dummyUser: UserProfile = {
  id: 'user-001',
  email: 'user@example.com',
  name: 'Demo User',
  phone: '081234567890',
  avatar: undefined,
  createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days ago
}

// Auth storage keys
const AUTH_KEY = 'gamehub_auth'
const USER_KEY = 'gamehub_user'

// Check if running on client
function isClient(): boolean {
  return typeof window !== 'undefined'
}

// Get stored auth state
export function getAuthState(): { isAuthenticated: boolean; user: UserProfile | null } {
  if (!isClient()) return { isAuthenticated: false, user: null }

  try {
    const auth = localStorage.getItem(AUTH_KEY)
    const userData = localStorage.getItem(USER_KEY)

    if (auth === 'true' && userData) {
      return { isAuthenticated: true, user: JSON.parse(userData) }
    }
  } catch {
    // Ignore errors
  }

  return { isAuthenticated: false, user: null }
}

// Set auth state
export function setAuthState(user: UserProfile | null) {
  if (!isClient()) return

  try {
    if (user) {
      localStorage.setItem(AUTH_KEY, 'true')
      localStorage.setItem(USER_KEY, JSON.stringify(user))
    } else {
      localStorage.removeItem(AUTH_KEY)
      localStorage.removeItem(USER_KEY)
    }
  } catch {
    // Ignore errors
  }
}

// Login simulation
export async function login(email: string, password: string): Promise<{ success: boolean; error?: string; user?: UserProfile }> {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 800))

  // Mock credentials check
  if (email === 'user@example.com' && password === 'password123') {
    setAuthState(dummyUser)
    return { success: true, user: dummyUser }
  }

  // Also accept any email with password "demo123" for demo purposes
  if (password === 'demo123') {
    const demoUser: UserProfile = {
      id: `user-${Date.now()}`,
      email,
      name: email.split('@')[0],
      phone: '',
      createdAt: new Date().toISOString(),
    }
    setAuthState(demoUser)
    return { success: true, user: demoUser }
  }

  return { success: false, error: 'Email atau password salah' }
}

// Register simulation
export async function register(
  email: string,
  password: string,
  name: string,
  confirmPassword: string
): Promise<{ success: boolean; error?: string }> {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 1000))

  // Validation
  if (password !== confirmPassword) {
    return { success: false, error: 'Password tidak cocok' }
  }

  if (password.length < 6) {
    return { success: false, error: 'Password minimal 6 karakter' }
  }

  if (!email.includes('@')) {
    return { success: false, error: 'Email tidak valid' }
  }

  // Check if email already exists (mock - only check against dummy user)
  if (email === dummyUser.email) {
    return { success: false, error: 'Email sudah terdaftar' }
  }

  // Create new user
  const newUser: UserProfile = {
    id: `user-${Date.now()}`,
    email,
    name,
    phone: '',
    createdAt: new Date().toISOString(),
  }

  setAuthState(newUser)
  return { success: true }
}

// Logout
export async function logout(): Promise<void> {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 300))
  setAuthState(null)
}

// Update profile
export async function updateProfile(
  userId: string,
  updates: Partial<UserProfile>
): Promise<{ success: boolean; user?: UserProfile; error?: string }> {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 800))

  const { user } = getAuthState()
  if (!user || user.id !== userId) {
    return { success: false, error: 'User tidak ditemukan' }
  }

  const updatedUser = { ...user, ...updates }
  setAuthState(updatedUser)

  return { success: true, user: updatedUser }
}

// Change password
export async function changePassword(
  currentPassword: string,
  newPassword: string
): Promise<{ success: boolean; error?: string }> {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 1000))

  // Mock validation - accept any current password for demo
  if (newPassword.length < 6) {
    return { success: false, error: 'Password baru minimal 6 karakter' }
  }

  return { success: true }
}
