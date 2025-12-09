import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { User } from '../types'
import { post } from '../api'

export const useAuthStore = defineStore('auth', () => {
  const token = ref<string | null>(localStorage.getItem('authToken'))
  const user = ref<User | null>(null)
  const isAuthenticated = computed(() => !!token.value)
  const isAdmin = computed(() => user.value?.role === 'admin')

  const login = (userData: User, authToken: string) => {
    token.value = authToken
    user.value = userData
    localStorage.setItem('authToken', authToken)
    localStorage.setItem('userName', userData.name)
    localStorage.setItem('userRole', userData.role)
    localStorage.setItem('userId', userData.id)
  }

  const logout = () => {
    token.value = null
    user.value = null
    localStorage.clear()
  }

  const initAuth = () => {
    const storedToken = localStorage.getItem('authToken')
    const storedName = localStorage.getItem('userName')
    const storedRole = localStorage.getItem('userRole')
    const storedId = localStorage.getItem('userId')

    if (storedToken && storedName && storedRole) {
      token.value = storedToken
      user.value = {
        id: storedId || 'unknown',
        name: storedName,
        email: storedName + '@simpleshare.com',
        role: storedRole as 'admin' | 'user',
        status: '活跃'
      }
    }
  }

  // 调用真实 API 登录
  const loginWithAPI = async (username: string, password: string, remember?: boolean) => {
    const response = await post<{ token: string; user: User }>('/auth/login', {
      username,
      password,
      remember
    })

    if (response.success && response.data) {
      const { token: authToken, user: userData } = response.data
      login(userData, authToken)
      return { success: true, user: userData }
    } else {
      return { success: false, error: response.error || '登录失败' }
    }
  }

  // 调用真实 API 注册
  const registerWithAPI = async (username: string, email: string, password: string) => {
    const response = await post<{ token: string; user: User }>('/auth/register', {
      username,
      email,
      password
    })

    if (response.success && response.data) {
      const { token: authToken, user: userData } = response.data
      login(userData, authToken)
      return { success: true, user: userData }
    } else {
      return { success: false, error: response.error || '注册失败' }
    }
  }

  return {
    token,
    user,
    isAuthenticated,
    isAdmin,
    login,
    logout,
    initAuth,
    loginWithAPI,
    registerWithAPI
  }
})

