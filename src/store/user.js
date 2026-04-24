import { defineStore } from 'pinia'
import request from '@/utils/request'
import { setToken, removeToken, getToken } from '@/utils/auth'

export const useUserStore = defineStore('user', {
  state: () => ({
    token: getToken(),
    name: '',
    avatar: '',
    roles: [],
    permissions: []
  }),
  actions: {
    // Login
    async login(loginInfo) {
      const res = await request({
        url: '/login',
        method: 'post',
        data: loginInfo
      })
      this.token = res.token
      setToken(res.token)
    },
    // Get user info
    async getInfo() {
      const res = await request({
        url: '/getInfo',
        method: 'get'
      })
      this.name = res.user.userName
      this.avatar = res.user.avatar
      this.roles = res.roles
      this.permissions = res.permissions
      return res
    },
    // Logout
    logout() {
      this.token = ''
      this.roles = []
      this.permissions = []
      removeToken()
    }
  }
})
