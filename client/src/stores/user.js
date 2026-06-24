import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import request from '@/utils/request'

export const useUserStore = defineStore('user', () => {
  const token = ref(localStorage.getItem('token') || '')
  const user = ref(JSON.parse(localStorage.getItem('user') || 'null'))

  const isLoggedIn = computed(() => !!token.value)

  const setAuth = (newToken, newUser) => {
    token.value = newToken
    user.value = newUser
    localStorage.setItem('token', newToken)
    localStorage.setItem('user', JSON.stringify(newUser))
  }

  const clearAuth = () => {
    token.value = ''
    user.value = null
    localStorage.removeItem('token')
    localStorage.removeItem('user')
  }

  const register = async (data) => {
    const res = await request.post('/users/register', data)
    setAuth(res.token, res.user)
    return res
  }

  const login = async (data) => {
    const res = await request.post('/users/login', data)
    setAuth(res.token, res.user)
    return res
  }

  const logout = () => {
    clearAuth()
  }

  const getProfile = async () => {
    const res = await request.get('/users/profile')
    user.value = res.user
    localStorage.setItem('user', JSON.stringify(res.user))
    return res
  }

  return {
    token,
    user,
    isLoggedIn,
    register,
    login,
    logout,
    getProfile,
    setAuth,
    clearAuth
  }
})
