import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'

// Types
export interface UserProfile {
  id: string
  email: string
  fullName: string
  age: number
  dateOfBirth: string
  nationality: string
  courseProgram: string
  domain: string
  yearOfProgram: number
  preferredStates: string[]
  preferredDistricts: string[]
  fathersName: string
  mothersName: string
  address: string
  contactNumber: string
  desiredCompany: string
  emailAlertsEnabled: boolean
  createdAt: string
}

interface AuthContextType {
  user: UserProfile | null
  login: (email: string, password: string) => Promise<boolean>
  register: (data: Partial<UserProfile> & { password: string }) => Promise<boolean>
  logout: () => void
  updateProfile: (data: Partial<UserProfile>) => void
}

const AuthContext = createContext<AuthContextType | null>(null)

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

// For MVP: localStorage-based auth. Will be replaced with Supabase.
const USERS_KEY = 'internmatch_users'
const SESSION_KEY = 'internmatch_session'

function getStoredUsers(): Record<string, { profile: UserProfile; password: string }> {
  try {
    return JSON.parse(localStorage.getItem(USERS_KEY) || '{}')
  } catch { return {} }
}

function storeUsers(users: Record<string, { profile: UserProfile; password: string }>) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users))
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null)

  useEffect(() => {
    const sessionEmail = localStorage.getItem(SESSION_KEY)
    if (sessionEmail) {
      const users = getStoredUsers()
      const entry = users[sessionEmail]
      if (entry) setUser(entry.profile)
    }
  }, [])

  const login = useCallback(async (email: string, password: string): Promise<boolean> => {
    const users = getStoredUsers()
    const entry = users[email.toLowerCase()]
    if (!entry || entry.password !== password) return false
    setUser(entry.profile)
    localStorage.setItem(SESSION_KEY, email.toLowerCase())
    return true
  }, [])

  const register = useCallback(async (data: Partial<UserProfile> & { password: string }): Promise<boolean> => {
    const users = getStoredUsers()
    const email = (data.email || '').toLowerCase()
    if (users[email]) return false // already exists

    const profile: UserProfile = {
      id: crypto.randomUUID(),
      email,
      fullName: data.fullName || '',
      age: data.age || 0,
      dateOfBirth: data.dateOfBirth || '',
      nationality: data.nationality || 'Indian',
      courseProgram: data.courseProgram || '',
      domain: data.domain || '',
      yearOfProgram: data.yearOfProgram || 1,
      preferredStates: data.preferredStates || [],
      preferredDistricts: data.preferredDistricts || [],
      fathersName: data.fathersName || '',
      mothersName: data.mothersName || '',
      address: data.address || '',
      contactNumber: data.contactNumber || '',
      desiredCompany: data.desiredCompany || 'Any',
      emailAlertsEnabled: data.emailAlertsEnabled ?? true,
      createdAt: new Date().toISOString()
    }

    users[email] = { profile, password: data.password }
    storeUsers(users)
    setUser(profile)
    localStorage.setItem(SESSION_KEY, email)
    return true
  }, [])

  const logout = useCallback(() => {
    setUser(null)
    localStorage.removeItem(SESSION_KEY)
  }, [])

  const updateProfile = useCallback((data: Partial<UserProfile>) => {
    setUser(prev => {
      if (!prev) return prev
      const updated = { ...prev, ...data }
      const users = getStoredUsers()
      if (users[prev.email]) {
        users[prev.email].profile = updated
        storeUsers(users)
      }
      return updated
    })
  }, [])

  return (
    <AuthContext.Provider value={{ user, login, register, logout, updateProfile }}>
      {children}
    </AuthContext.Provider>
  )
}
