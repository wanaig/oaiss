import { createPinia, defineStore } from 'pinia'
import { ROLE, ROLE_HOME, ROLE_LABEL } from '../config/menu'
import { login as loginApi, getCurrentUser } from '../api/auth'

export const pinia = createPinia()

const AUTH_STORAGE_KEY = 'carbon-admin-auth'

const ROLE_MAP = {
  ENTERPRISE: ROLE.ENTERPRISE,
  AUDITOR: ROLE.AUDITOR,
  ADMIN: ROLE.ADMIN,
}

function mapRole(backendRole) {
  if (!backendRole) return null
  const stripped = backendRole.replace(/^ROLE_/i, '').toUpperCase()
  return ROLE_MAP[stripped] || null
}

function getInitialAuth() {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY)
    if (!raw) return { loggedIn: false, role: null, username: '', token: '' }

    const parsed = JSON.parse(raw)
    const validRole = Object.values(ROLE).includes(parsed.role)

    if (!validRole || !parsed.loggedIn || !parsed.token) {
      return { loggedIn: false, role: null, username: '', token: '' }
    }

    return {
      loggedIn: true,
      role: parsed.role,
      username: parsed.username || '系统用户',
      token: parsed.token,
    }
  } catch {
    return { loggedIn: false, role: null, username: '', token: '' }
  }
}

export const useAppStore = defineStore('app', {
  state: () => ({
    sidebarCollapsed: false,
    systemTitle: '碳资产监管后台',
    _validated: false,
    ...getInitialAuth(),
  }),
  getters: {
    roleLabel: (state) => (state.role ? ROLE_LABEL[state.role] : '未登录'),
    homePath: (state) => (state.role ? (ROLE_HOME[state.role] || '/login') : '/login'),
  },
  actions: {
    toggleSidebar() {
      this.sidebarCollapsed = !this.sidebarCollapsed
    },
    async login(credentials) {
      const data = await loginApi(credentials)
      this.token = data.token || data
      this.loggedIn = true
      const role = mapRole(data.role) || ROLE.ENTERPRISE
      this.role = role
      this.username = data.displayName || data.username || '系统用户'
      this.persistAuth()
      return { user: data, role }
    },
    async fetchCurrentUser() {
      try {
        const user = await getCurrentUser()
        const role = mapRole(user.role) || ROLE.ENTERPRISE
        this.role = role
        this.username = user.displayName || user.username
        this.loggedIn = true
        this.persistAuth()
      } catch {
        this.logout()
      }
    },
    logout() {
      this.loggedIn = false
      this.role = null
      this.username = ''
      this.token = ''
      this.sidebarCollapsed = false
      localStorage.removeItem(AUTH_STORAGE_KEY)
    },
    persistAuth() {
      localStorage.setItem(
        AUTH_STORAGE_KEY,
        JSON.stringify({
          loggedIn: this.loggedIn,
          role: this.role,
          username: this.username,
          token: this.token,
        }),
      )
    },
  },
})
