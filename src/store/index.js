import { createPinia, defineStore } from 'pinia'
import { ROLE, ROLE_HOME, ROLE_LABEL } from '../config/menu'

export const pinia = createPinia()

const AUTH_STORAGE_KEY = 'carbon-admin-auth'

function getInitialAuth() {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY)
    if (!raw) {
      return {
        loggedIn: false,
        role: null,
        username: '',
      }
    }

    const parsed = JSON.parse(raw)
    const validRole = Object.values(ROLE).includes(parsed.role)

    if (!validRole || !parsed.loggedIn) {
      return {
        loggedIn: false,
        role: null,
        username: '',
      }
    }

    return {
      loggedIn: true,
      role: parsed.role,
      username: parsed.username || '系统用户',
    }
  } catch {
    return {
      loggedIn: false,
      role: null,
      username: '',
    }
  }
}

export const useAppStore = defineStore('app', {
  state: () => ({
    sidebarCollapsed: false,
    systemTitle: '碳资产监管后台',
    ...getInitialAuth(),
  }),
  getters: {
    roleLabel: (state) => (state.role ? ROLE_LABEL[state.role] : '未登录'),
    homePath: (state) => (state.role ? ROLE_HOME[state.role] : '/enterprise/carbon/upload'),
  },
  actions: {
    toggleSidebar() {
      this.sidebarCollapsed = !this.sidebarCollapsed
    },
    login(payload) {
      this.loggedIn = true
      this.role = payload.role
      this.username = payload.username || '系统用户'
      this.persistAuth()
    },
    logout() {
      this.loggedIn = false
      this.role = null
      this.username = ''
      this.sidebarCollapsed = false
      this.persistAuth()
    },
    persistAuth() {
      localStorage.setItem(
        AUTH_STORAGE_KEY,
        JSON.stringify({
          loggedIn: this.loggedIn,
          role: this.role,
          username: this.username,
        }),
      )
    },
  },
})
