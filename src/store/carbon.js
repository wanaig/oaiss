import { defineStore } from 'pinia'
import { AUDIT_STATUS_MAP } from '../config/constants'
import * as accountApi from '../api/account'
import * as marketApi from '../api/market'
import * as tradingApi from '../api/trading'
import * as emissionApi from '../api/emission'
import * as auditApi from '../api/audit'
import * as adminApi from '../api/admin'
import * as usersApi from '../api/users'
import * as statisticsApi from '../api/statistics'

export const useCarbonStore = defineStore('carbon', {
  state: () => ({
    currentCompanyId: '',

    accounts: {},
    emissionReports: [],
    tradingOrders: [],
    orderBook: { bids: [], asks: [] },
    p2pOrders: [
      {
        id: 1, orderNo: 'P2P-202604-0001',
        buyer: '华东能源集团', seller: '华南低碳科技',
        buyerId: 'C-1001', sellerId: 'C-1002',
        carbonQuota: 420.5, price: 42.5, amount: 17871.25,
        appId: 'APP-ECO-1001', callback: 'https://api.example.com/callback/1001',
        certificatePath: '/cert/c1001/20260401.pfx', queryPassword: '****',
        publicKey: '0x96af12b8abce00014c5d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4',
        status: '待成交', createdAt: '2026-04-22 09:21:43',
      },
      {
        id: 2, orderNo: 'P2P-202604-0002',
        buyer: '华北电网平台', seller: '蓝碳科技有限公司',
        buyerId: 'C-1003', sellerId: 'C-1004',
        carbonQuota: 180.0, price: 43.0, amount: 7740,
        appId: 'APP-ECO-1002', callback: 'https://api.example.com/callback/1002',
        certificatePath: '/cert/c1003/20260402.pfx', queryPassword: '****',
        publicKey: '0x8f1eea2ba9c4a78d9e51f0b12c3d6e7a8901b23c45d678e90123456789abcde',
        status: '已完成', createdAt: '2026-04-23 10:43:08',
      },
      {
        id: 3, orderNo: 'P2P-202604-0003',
        buyer: '北方清洁电力集团', seller: '华东能源集团',
        buyerId: 'C-1005', sellerId: 'C-1001',
        carbonQuota: 305.8, price: 41.8, amount: 12782.44,
        appId: 'APP-ECO-1003', callback: 'https://api.example.com/callback/1003',
        certificatePath: '/cert/c1005/20260403.pfx', queryPassword: '****',
        publicKey: '0x3a4b5c6d7e8f9012abcdef3456789012abcdef3456789012abcdef34567890',
        status: '待成交', createdAt: '2026-04-24 08:15:20',
      },
    ],
    tradingOrders: [],
    orderHistory: [],
    transactions: [],
    marketStats: { lastPrice: 0, change24h: 0, changePercent24h: 0, high24h: 0, low24h: 0, volume24h: 0 },

    adminUsers: [],
    userTotal: 0,
    userStats: null,
    adminConfigs: [],
    statistics: {},
    systemDashboard: null,
    dashboardData: null,

    _nextP2PId: 4,
  }),

  getters: {
    accountMap: (state) => state.accounts,

    accountList: (state) => Object.values(state.accounts),

    currentAccount(state) {
      return state.accounts[state.currentCompanyId] || Object.values(state.accounts)[0] || null
    },

    availableFunds(state) {
      const acc = state.accounts[state.currentCompanyId]
      return acc ? acc.availableFunds ?? (acc.funds - acc.frozenFunds) : 0
    },

    availableQuota(state) {
      const acc = state.accounts[state.currentCompanyId]
      return acc ? acc.availableQuota ?? (acc.carbonQuota - acc.frozenQuota) : 0
    },

    activeOrderCount(state) {
      return state.tradingOrders.filter(o => o.status === 'open' || o.status === 'pending' || o.status === 'partial').length
    },

    myTradingOrders(state) {
      return state.tradingOrders
    },

    pendingAuditReports(state) {
      return state.emissionReports.filter(r => r.auditStatus === 'pending')
    },

    auditedReports(state) {
      return state.emissionReports.filter(r => r.auditStatus === 'approved' || r.auditStatus === 'rejected')
    },

    myReports(state) {
      return state.emissionReports
    },

    myTransactions(state) {
      return state.transactions
    },

    totalEmission: (state) => (companyId) =>
      state.emissionReports
        .filter(r => r.companyId === companyId && r.auditStatus === 'approved')
        .reduce((sum, r) => sum + r.emission, 0),

    totalQuotaIssued: (state) => (companyId) =>
      state.emissionReports
        .filter(r => r.companyId === companyId && r.auditStatus === 'approved')
        .reduce((sum, r) => sum + (r.emission || 0), 0),

    companyReportCount(state) {
      return (companyId) => state.emissionReports.filter(r => r.companyId === companyId).length
    },
  },

  actions: {
    setCurrentCompany(companyId) {
      this.currentCompanyId = companyId
    },

    // ==================== Account ====================
    async fetchAccount() {
      try {
        const data = await accountApi.getAccount()
        if (data) {
          this.accounts[data.companyId] = data
          if (!this.currentCompanyId) {
            this.currentCompanyId = data.companyId
          }
        }
      } catch { /* 非企业用户无账户 */ }
    },

    async fetchAccountTransactions() {
      try {
        const data = await accountApi.getAccountTransactions()
        if (Array.isArray(data)) {
          this.transactions = data
        }
        return data
      } catch { return [] }
    },

    // ==================== Emission Reports ====================
    async fetchEmissionReports(params) {
      try {
        const data = await emissionApi.getEmissionReports(params)
        if (data?.records) {
          this.emissionReports = data.records
        }
        return data
      } catch { return null }
    },

    async fetchEmissionReport(id) {
      try { return await emissionApi.getEmissionReport(id) } catch { return null }
    },

    async addEmissionReport(report) {
      try {
        await emissionApi.createEmissionReport({
          ...report,
          uploaderCode: report.uploaderCode || `UP-${Date.now().toString(36).toUpperCase()}`,
        })
        await this.fetchEmissionReports()
      } catch {}
    },

    async updateEmissionReport(id, data) {
      try {
        await emissionApi.updateEmissionReport(id, data)
        await this.fetchEmissionReports()
      } catch {}
    },

    async deleteEmissionReport(id) {
      try {
        await emissionApi.deleteEmissionReport(id)
        this.emissionReports = this.emissionReports.filter(r => r.id !== id)
      } catch {}
    },

    async submitForAudit(reportId) {
      try {
        await emissionApi.submitEmissionReport(reportId)
        await this.fetchEmissionReports()
      } catch {}
    },

    async fetchEmissionOnChain(id) {
      try { return await emissionApi.getEmissionOnChain(id) } catch { return null }
    },

    // ==================== Trading / Market ====================
    async fetchTicker() {
      try {
        const data = await marketApi.getTicker()
        if (data) {
          this.marketStats = {
            lastPrice: data.lastPrice ?? 0,
            change24h: data.change24h ?? 0,
            changePercent24h: data.changePercent ?? data.changePercent24h ?? 0,
            high24h: data.high24h ?? 0,
            low24h: data.low24h ?? 0,
            volume24h: data.volume24h ?? 0,
          }
        }
        return data
      } catch { return null }
    },

    async fetchDepth() {
      try {
        const data = await marketApi.getDepth()
        if (data) {
          this.orderBook = { bids: data.bids || [], asks: data.asks || [] }
        }
        return data
      } catch { return null }
    },

    async placeTradingOrder(side, price, quantity) {
      const data = await tradingApi.placeOrder({ side, price, quantity })
      await Promise.all([this.fetchDepth(), this.fetchOpenOrders(), this.fetchOrderHistory()]).catch(() => {})
      return data
    },

    async cancelTradingOrder(orderId) {
      await tradingApi.cancelOrder(orderId)
      await Promise.all([this.fetchDepth(), this.fetchOpenOrders(), this.fetchOrderHistory()]).catch(() => {})
    },

    async fetchOpenOrders(params) {
      try {
        const data = await tradingApi.getOpenOrders(params)
        if (data?.list) {
          this.tradingOrders = data.list
        }
        return data
      } catch { return null }
    },

    async fetchOrderHistory(params) {
      try {
        const data = await tradingApi.getOrderHistory(params)
        if (data?.list) {
          this.orderHistory = data.list
        }
        return data
      } catch { return null }
    },

    async fetchTradeHistory(params) {
      try {
        const data = await tradingApi.getTradeHistory(params)
        if (data?.list) {
          this.transactions = data.list
        }
        return data
      } catch { return null }
    },

    // Backward compat aliases
    async fetchMyOrders(params) { return this.fetchOpenOrders(params) },
    async fetchTradingTransactions(params) { return this.fetchTradeHistory(params) },

    async fetchAccountAssets() {
      try {
        return await accountApi.getAccountAssets()
      } catch { return null }
    },

    // ==================== P2P Orders (Mock) ====================
    addP2POrder(data) {
      const id = this._nextP2PId++
      const orderNo = `P2P-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(this._nextP2PId).padStart(4, '0')}`
      const buyer = data.side === 'buy' ? data.enterpriseName : '当前企业'
      const seller = data.side === 'sell' ? data.enterpriseName : '当前企业'
      this.p2pOrders.unshift({
        id, orderNo,
        buyer, seller,
        buyerId: data.side === 'buy' ? this.currentCompanyId : '',
        sellerId: data.side === 'sell' ? this.currentCompanyId : '',
        carbonQuota: Number(data.carbonQuota), price: Number(data.price),
        amount: Number(data.carbonQuota) * Number(data.price),
        appId: data.appId || 'APP-ECO-NEW', callback: data.certificatePath || '',
        certificatePath: data.certificatePath || '', queryPassword: data.queryPassword || '',
        publicKey: data.publicKey || '',
        status: '待成交', createdAt: new Date().toLocaleString('zh-CN', { hour12: false }),
      })
    },

    updateP2POrder(id, data) {
      const order = this.p2pOrders.find(o => o.id === id)
      if (!order) return
      Object.assign(order, {
        buyer: data.buyer, seller: data.seller,
        carbonQuota: Number(data.carbonQuota), price: Number(data.price),
        amount: Number(data.carbonQuota) * Number(data.price),
        callback: data.certificatePath || order.callback,
        certificatePath: data.certificatePath || order.certificatePath,
        publicKey: data.publicKey || order.publicKey,
      })
    },

    deleteP2POrder(id) {
      this.p2pOrders = this.p2pOrders.filter(o => o.id !== id)
    },

    updateP2POrderStatus(id, newStatus) {
      const order = this.p2pOrders.find(o => o.id === id)
      if (order) {
        order.status = newStatus
      }
    },

    // ==================== Audit ====================
    async fetchAuditTasks(params) {
      try {
        const data = await auditApi.getAuditTasks(params)
        if (data?.records) {
          this.emissionReports = data.records
        }
        return data
      } catch { return null }
    },

    async fetchAuditTask(id) {
      try { return await auditApi.getAuditTask(id) } catch { return null }
    },

    async approveReport(reportId, auditData) {
      await auditApi.approveAudit(reportId, { auditResult: 'approved', ...auditData })
      await this.fetchAuditTasks()
    },

    async rejectReport(reportId, reason) {
      await auditApi.rejectAudit(reportId, { auditResult: 'rejected', rejectReason: reason })
      await this.fetchAuditTasks()
    },

    async fetchAuditRecords(id) {
      try { return await auditApi.getAuditRecords(id) } catch { return [] }
    },

    // ==================== Admin Users ====================
    async fetchAdminUsers(params) {
      try {
        const data = await usersApi.getUsers(params)
        if (data) {
          this.adminUsers = data.list || []
          this.userTotal = data.total || 0
        }
        return data
      } catch { return null }
    },

    async fetchUserStats() {
      try {
        const data = await usersApi.getUserStats()
        if (data) {
          this.userStats = data
        }
        return data
      } catch { return null }
    },

    async addAdminUser(data) {
      return await usersApi.createUser(data)
    },

    async updateAdminUser(id, data) {
      const res = await usersApi.updateUser(id, data)
      if (res) {
        const idx = this.adminUsers.findIndex(u => u.id === id)
        if (idx !== -1) {
          this.adminUsers[idx] = { ...this.adminUsers[idx], ...res }
        }
      }
      return res
    },

    async toggleUserCredit(id, creditEnabled) {
      return await usersApi.toggleCredit(id, creditEnabled)
    },

    async deleteAdminUser(id) {
      await usersApi.deleteUser(id)
      this.adminUsers = this.adminUsers.filter(u => u.id !== id)
    },

    async fetchUserAssets(id) {
      try {
        return await usersApi.getUserAssets(id)
      } catch { return null }
    },

    // ==================== Admin Configs ====================
    async fetchAdminConfigs() {
      try {
        const data = await adminApi.getAdminConfigs()
        if (Array.isArray(data)) {
          this.adminConfigs = data
        }
        return data
      } catch { return [] }
    },

    async updateAdminConfig(id, data) {
      await adminApi.updateAdminConfig(id, data)
      await this.fetchAdminConfigs()
    },

    // ==================== Statistics ====================
    async fetchStatistics() {
      try {
        const data = await statisticsApi.getStatistics()
        if (data) {
          this.statistics = data
        }
        return data
      } catch { return null }
    },

    async fetchSystemDashboard(params) {
      try {
        const data = await statisticsApi.getSystemDashboard(params)
        if (data) {
          this.systemDashboard = data
        }
        return data
      } catch { return null }
    },

    // ==================== Dashboard ====================
    async fetchDashboard() {
      try {
        const data = await emissionApi.getDashboard()
        if (data) {
          this.dashboardData = data
        }
        return data
      } catch { return null }
    },
  },
})
