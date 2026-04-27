import { defineStore } from 'pinia'
import { ORDER_STATUS, AUDIT_STATUS, QUOTA_CONVERSION, computeEmission } from '../config/constants'
import { generateTxHash, generateBlockHash, generateBlockHeight, nowString } from '../utils/blockchain'

export const useCarbonStore = defineStore('carbon', {
  state: () => ({
    currentCompanyId: 'C-1001',

    accounts: {
      'C-1001': { companyId: 'C-1001', companyName: '华东能源集团', enterpriseType: '发电企业', deptName: '华东发电一部', deptCode: 'D-001', funds: 1000000, carbonQuota: 50000, frozenFunds: 0, frozenQuota: 0, creditScore: 850 },
      'C-1002': { companyId: 'C-1002', companyName: '华南低碳科技', enterpriseType: '电网企业', deptName: '华南电网调度中心', deptCode: 'D-002', funds: 800000, carbonQuota: 35000, frozenFunds: 0, frozenQuota: 0, creditScore: 920 },
      'C-1003': { companyId: 'C-1003', companyName: '华北电网平台', enterpriseType: '电网企业', deptName: '华北调度一部', deptCode: 'D-003', funds: 1200000, carbonQuota: 60000, frozenFunds: 0, frozenQuota: 0, creditScore: 780 },
      'C-1004': { companyId: 'C-1004', companyName: '蓝碳科技有限公司', enterpriseType: '发电企业', deptName: '蓝碳技术部', deptCode: 'D-004', funds: 500000, carbonQuota: 25000, frozenFunds: 0, frozenQuota: 0, creditScore: 700 },
      'C-1005': { companyId: 'C-1005', companyName: '北方清洁电力集团', enterpriseType: '发电企业', deptName: '北方发电中心', deptCode: 'D-005', funds: 1500000, carbonQuota: 80000, frozenFunds: 0, frozenQuota: 0, creditScore: 880 },
    },

    emissionReports: [
      {
        id: 'RPT-202604-0001', deptName: '华东发电一部', deptCode: 'D-001', enterpriseType: '发电企业',
        coalHeatValue: 24000, coalConsumption: 80, oilHeatValue: 42000, oilConsumption: 15,
        emission: computeEmission(24000, 80, 42000, 15),
        uploaderCode: 'UP-1201', submitTime: '2026-04-20 10:20:30',
        auditStatus: AUDIT_STATUS.APPROVED,
        auditResult: { pollutionStatus: '正常', impactAssessment: '排放低于基准线，建议通过', emissionLevel: '一级', auditPassword: '****', eventCode: 'EVT-001', auditTime: '2026-04-21 09:30:00', auditorName: '审核员A' },
        signed: true, companyId: 'C-1001', companyName: '华东能源集团',
      },
      {
        id: 'RPT-202604-0002', deptName: '华北电网调度中心', deptCode: 'D-002', enterpriseType: '电网企业',
        coalHeatValue: 18500, coalConsumption: 65, oilHeatValue: 38000, oilConsumption: 18,
        emission: computeEmission(18500, 65, 38000, 18),
        uploaderCode: 'UP-0960', submitTime: '2026-04-21 08:31:10',
        auditStatus: AUDIT_STATUS.PENDING,
        auditResult: null, signed: true, companyId: 'C-1002', companyName: '华南低碳科技',
      },
      {
        id: 'RPT-202604-0003', deptName: '华南发电三部', deptCode: 'D-003', enterpriseType: '发电企业',
        coalHeatValue: 22000, coalConsumption: 95, oilHeatValue: 41000, oilConsumption: 8,
        emission: computeEmission(22000, 95, 41000, 8),
        uploaderCode: 'UP-1654', submitTime: '2026-04-22 14:15:20',
        auditStatus: AUDIT_STATUS.PENDING,
        auditResult: null, signed: true, companyId: 'C-1003', companyName: '华北电网平台',
      },
      {
        id: 'RPT-202604-0004', deptName: '蓝碳实验工厂', deptCode: 'D-004', enterpriseType: '发电企业',
        coalHeatValue: 28000, coalConsumption: 120, oilHeatValue: 45000, oilConsumption: 22,
        emission: computeEmission(28000, 120, 45000, 22),
        uploaderCode: 'UP-2010', submitTime: '2026-04-23 16:40:00',
        auditStatus: AUDIT_STATUS.REJECTED, rejectReason: '排放数据与历史记录偏差过大，请重新核算',
        auditResult: null, signed: true, companyId: 'C-1004', companyName: '蓝碳科技有限公司',
      },
    ],

    tradingOrders: [],

    orderBook: {
      bids: [
        { id: 1001, companyId: 'C-1001', price: 42.3, quantity: 500, side: 'buy', createdAt: '2026-04-26 10:20:30' },
        { id: 1002, companyId: 'C-1005', price: 42.1, quantity: 800, side: 'buy', createdAt: '2026-04-26 10:15:12' },
        { id: 1003, companyId: 'C-1003', price: 42.0, quantity: 1200, side: 'buy', createdAt: '2026-04-26 10:08:45' },
        { id: 1004, companyId: 'C-1002', price: 41.8, quantity: 600, side: 'buy', createdAt: '2026-04-26 09:55:20' },
        { id: 1005, companyId: 'C-1004', price: 41.5, quantity: 2000, side: 'buy', createdAt: '2026-04-26 09:40:10' },
      ],
      asks: [
        { id: 2001, companyId: 'C-1002', price: 42.6, quantity: 400, side: 'sell', createdAt: '2026-04-26 10:22:00' },
        { id: 2002, companyId: 'C-1003', price: 42.8, quantity: 700, side: 'sell', createdAt: '2026-04-26 10:18:30' },
        { id: 2003, companyId: 'C-1004', price: 43.0, quantity: 1000, side: 'sell', createdAt: '2026-04-26 10:10:15' },
        { id: 2004, companyId: 'C-1005', price: 43.3, quantity: 500, side: 'sell', createdAt: '2026-04-26 09:58:40' },
        { id: 2005, companyId: 'C-1001', price: 43.5, quantity: 1500, side: 'sell', createdAt: '2026-04-26 09:45:25' },
      ],
    },

    p2pOrders: [
      {
        id: 1, orderNo: 'P2P-202604-0001',
        buyer: '华东能源集团', seller: '华南低碳科技',
        buyerId: 'C-1001', sellerId: 'C-1002',
        carbonQuota: 420.5, price: 42.5, amount: 17871.25,
        appId: 'APP-ECO-1001', callback: 'https://api.example.com/callback/1001',
        certificatePath: '/cert/c1001/20260401.pfx', queryPassword: '****',
        publicKey: '0x96af12b8abce00014c5d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4',
        status: ORDER_STATUS.PENDING, createdAt: '2026-04-22 09:21:43',
      },
      {
        id: 2, orderNo: 'P2P-202604-0002',
        buyer: '华北电网平台', seller: '蓝碳科技有限公司',
        buyerId: 'C-1003', sellerId: 'C-1004',
        carbonQuota: 180.0, price: 43.0, amount: 7740,
        appId: 'APP-ECO-1002', callback: 'https://api.example.com/callback/1002',
        certificatePath: '/cert/c1003/20260402.pfx', queryPassword: '****',
        publicKey: '0x8f1eea2ba9c4a78d9e51f0b12c3d6e7a8901b23c45d678e90123456789abcde',
        status: ORDER_STATUS.COMPLETED, createdAt: '2026-04-23 10:43:08',
      },
      {
        id: 3, orderNo: 'P2P-202604-0003',
        buyer: '北方清洁电力集团', seller: '华东能源集团',
        buyerId: 'C-1005', sellerId: 'C-1001',
        carbonQuota: 305.8, price: 41.8, amount: 12782.44,
        appId: 'APP-ECO-1003', callback: 'https://api.example.com/callback/1003',
        certificatePath: '/cert/c1005/20260403.pfx', queryPassword: '****',
        publicKey: '0x3a4b5c6d7e8f9012abcdef3456789012abcdef3456789012abcdef34567890',
        status: ORDER_STATUS.PENDING, createdAt: '2026-04-24 08:15:20',
      },
    ],

    transactions: [
      {
        id: 1, txHash: '0x8f1eea2ba9c4a78d9e51f0b12c3d6e7a8901b23c45d678e90123456789abcde',
        blockHeight: 18472653, blockHash: '0x1a2b3c4d5e6f7890abcdef1234567890abcdef1234567890abcdef12345678',
        buyOrderId: 1001, sellOrderId: 2001,
        buyerId: 'C-1001', sellerId: 'C-1002',
        buyerName: '华东能源集团', sellerName: '华南低碳科技',
        price: 42.5, quantity: 300, totalAmount: 12750,
        status: '已完成', timestamp: '2026-04-26 10:30:18',
      },
      {
        id: 2, txHash: '0x3a4b5c6d7e8f9012abcdef3456789012abcdef3456789012abcdef34567890',
        blockHeight: 18472580, blockHash: '0x2b3c4d5e6f7890abcdef1234567890abcdef1234567890abcdef12345678',
        buyOrderId: 1003, sellOrderId: 2003,
        buyerId: 'C-1003', sellerId: 'C-1004',
        buyerName: '华北电网平台', sellerName: '蓝碳科技有限公司',
        price: 42.8, quantity: 500, totalAmount: 21400,
        status: '已完成', timestamp: '2026-04-26 09:45:55',
      },
      {
        id: 3, txHash: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef12345678',
        blockHeight: 18472512, blockHash: '0x3c4d5e6f7890abcdef1234567890abcdef1234567890abcdef1234567890',
        buyOrderId: 3003, sellOrderId: 2002,
        buyerId: 'C-1001', sellerId: 'C-1003',
        buyerName: '华东能源集团', sellerName: '华北电网平台',
        price: 42.5, quantity: 300, totalAmount: 12750,
        status: '已完成', timestamp: '2026-04-25 08:35:00',
      },
    ],

    marketStats: {
      lastPrice: 42.5, change24h: 2.3, changePercent24h: 5.72,
      high24h: 44.2, low24h: 39.8, volume24h: 12580,
    },

    _nextOrderId: 3006,
    _nextP2PId: 4,
    _nextTxId: 4,
  }),

  getters: {
    accountMap: (state) => state.accounts,

    accountList: (state) => Object.values(state.accounts),

    currentAccount(state) {
      return state.accounts[state.currentCompanyId] || Object.values(state.accounts)[0]
    },

    availableFunds(state) {
      const acc = state.accounts[state.currentCompanyId]
      return acc ? acc.funds - acc.frozenFunds : 0
    },

    availableQuota(state) {
      const acc = state.accounts[state.currentCompanyId]
      return acc ? acc.carbonQuota - acc.frozenQuota : 0
    },

    activeOrderCount(state) {
      return state.tradingOrders.filter(o => o.companyId === state.currentCompanyId && (o.status === ORDER_STATUS.PENDING || o.status === ORDER_STATUS.PARTIAL)).length
    },

    myTradingOrders(state) {
      return state.tradingOrders.filter(o => o.companyId === state.currentCompanyId)
    },

    pendingAuditReports(state) {
      return state.emissionReports.filter(r => r.auditStatus === AUDIT_STATUS.PENDING)
    },

    auditedReports(state) {
      return state.emissionReports.filter(r => r.auditStatus === AUDIT_STATUS.APPROVED || r.auditStatus === AUDIT_STATUS.REJECTED)
    },

    myReports(state) {
      return state.emissionReports.filter(r => r.companyId === state.currentCompanyId)
    },

    myTransactions(state) {
      return state.transactions.filter(t => t.buyerId === state.currentCompanyId || t.sellerId === state.currentCompanyId)
    },

    totalEmission: (state) => (companyId) =>
      state.emissionReports
        .filter(r => r.companyId === companyId && r.auditStatus === AUDIT_STATUS.APPROVED)
        .reduce((sum, r) => sum + r.emission, 0),

    totalQuotaIssued: (state) => (companyId) =>
      state.emissionReports
        .filter(r => r.companyId === companyId && r.auditStatus === AUDIT_STATUS.APPROVED)
        .reduce((sum, r) => sum + r.emission * QUOTA_CONVERSION, 0),

    companyReportCount(state) {
      return (companyId) => state.emissionReports.filter(r => r.companyId === companyId).length
    },
  },

  actions: {
    setCurrentCompany(companyId) {
      if (this.accounts[companyId]) {
        this.currentCompanyId = companyId
      }
    },

    addEmissionReport(report) {
      const id = `RPT-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(this.emissionReports.length + 1).padStart(4, '0')}`
      const emission = computeEmission(
        Number(report.coalHeatValue), Number(report.coalConsumption),
        Number(report.oilHeatValue), Number(report.oilConsumption)
      )
      const account = this.accounts[this.currentCompanyId]
      this.emissionReports.unshift({
        id,
        deptName: report.deptName,
        deptCode: report.deptCode,
        enterpriseType: report.enterpriseType,
        coalHeatValue: Number(report.coalHeatValue),
        coalConsumption: Number(report.coalConsumption),
        oilHeatValue: Number(report.oilHeatValue),
        oilConsumption: Number(report.oilConsumption),
        emission,
        uploaderCode: `UP-${Math.floor(1000 + Math.random() * 9000)}`,
        submitTime: nowString(),
        auditStatus: AUDIT_STATUS.PENDING,
        auditResult: null,
        signed: false,
        companyId: this.currentCompanyId,
        companyName: account ? account.companyName : '',
      })
    },

    updateEmissionReport(id, data) {
      const report = this.emissionReports.find(r => r.id === id)
      if (!report) return
      Object.assign(report, {
        deptName: data.deptName,
        deptCode: data.deptCode,
        enterpriseType: data.enterpriseType,
        coalHeatValue: Number(data.coalHeatValue),
        coalConsumption: Number(data.coalConsumption),
        oilHeatValue: Number(data.oilHeatValue),
        oilConsumption: Number(data.oilConsumption),
        emission: computeEmission(
          Number(data.coalHeatValue), Number(data.coalConsumption),
          Number(data.oilHeatValue), Number(data.oilConsumption)
        ),
      })
    },

    deleteEmissionReport(id) {
      this.emissionReports = this.emissionReports.filter(r => r.id !== id)
    },

    submitForAudit(reportId) {
      const report = this.emissionReports.find(r => r.id === reportId)
      if (report && !report.signed) {
        report.signed = true
        report.submitTime = nowString()
        return true
      }
      return false
    },

    approveReport(reportId, auditData) {
      const report = this.emissionReports.find(r => r.id === reportId)
      if (!report || report.auditStatus !== AUDIT_STATUS.PENDING) return false
      report.auditStatus = AUDIT_STATUS.APPROVED
      report.auditResult = { ...auditData, auditTime: nowString() }
      const quota = report.emission * QUOTA_CONVERSION
      const account = this.accounts[report.companyId]
      if (account) {
        account.carbonQuota += quota
      }
      return true
    },

    rejectReport(reportId, reason) {
      const report = this.emissionReports.find(r => r.id === reportId)
      if (!report || report.auditStatus !== AUDIT_STATUS.PENDING) return false
      report.auditStatus = AUDIT_STATUS.REJECTED
      report.rejectReason = reason || '未填写驳回原因'
      return true
    },

    placeTradingOrder(side, price, quantity) {
      const account = this.accounts[this.currentCompanyId]
      if (!account) return { ok: false, msg: '未找到账户' }

      const totalCost = price * quantity
      if (side === 'buy' && account.funds - account.frozenFunds < totalCost) {
        return { ok: false, msg: `账户资金不足，需要 ${totalCost.toLocaleString()} 元` }
      }
      if (side === 'sell' && account.carbonQuota - account.frozenQuota < quantity) {
        return { ok: false, msg: `碳配额不足，需要 ${quantity.toLocaleString()} 单位` }
      }

      const order = {
        id: this._nextOrderId++,
        companyId: account.companyId,
        companyName: account.companyName,
        side, price, quantity,
        originalQuantity: quantity,
        filledQuantity: 0,
        status: ORDER_STATUS.PENDING,
        createdAt: nowString(),
      }

      if (side === 'buy') {
        account.frozenFunds += totalCost
      } else {
        account.frozenQuota += quantity
      }

      this.tradingOrders.push(order)
      this.executeMatching(order)
      return { ok: true }
    },

    executeMatching(order) {
      const isBuy = order.side === 'buy'
      const counterparties = isBuy
        ? [...this.orderBook.asks].sort((a, b) => a.price - b.price || a.createdAt.localeCompare(b.createdAt))
        : [...this.orderBook.bids].sort((a, b) => b.price - a.price || a.createdAt.localeCompare(b.createdAt))

      let remaining = order.quantity
      const matchedTxs = []
      const buyerAccount = this.accounts[isBuy ? order.companyId : '']
      const sellerAccount = this.accounts[isBuy ? '' : order.companyId]

      for (const cp of counterparties) {
        if (remaining <= 0) break
        const canMatch = isBuy ? order.price >= cp.price : order.price <= cp.price
        if (!canMatch) break

        const fillQty = Math.min(remaining, cp.quantity)
        const tradePrice = cp.price
        const tradeAmount = tradePrice * fillQty
        remaining -= fillQty
        cp.quantity -= fillQty

        if (cp.quantity <= 0) {
          const book = isBuy ? this.orderBook.asks : this.orderBook.bids
          const idx = book.findIndex(o => o.id === cp.id)
          if (idx > -1) book.splice(idx, 1)
        }

        const buyerAcc = this.accounts[isBuy ? order.companyId : cp.companyId]
        const sellerAcc = this.accounts[isBuy ? cp.companyId : order.companyId]

        if (buyerAcc) {
          buyerAcc.frozenFunds -= tradeAmount
          buyerAcc.funds -= tradeAmount
          buyerAcc.carbonQuota += fillQty
        }
        if (sellerAcc) {
          sellerAcc.frozenQuota -= fillQty
          sellerAcc.carbonQuota -= fillQty
          sellerAcc.funds += tradeAmount
        }

        const tx = {
          id: this._nextTxId++,
          txHash: generateTxHash(),
          blockHeight: generateBlockHeight(),
          blockHash: generateBlockHash(),
          buyOrderId: isBuy ? order.id : cp.id,
          sellOrderId: isBuy ? cp.id : order.id,
          buyerId: isBuy ? order.companyId : cp.companyId,
          sellerId: isBuy ? cp.companyId : order.companyId,
          buyerName: (this.accounts[isBuy ? order.companyId : cp.companyId] || {}).companyName || '-',
          sellerName: (this.accounts[isBuy ? cp.companyId : order.companyId] || {}).companyName || '-',
          price: tradePrice, quantity: fillQty, totalAmount: tradeAmount,
          status: '已完成', timestamp: nowString(),
        }
        matchedTxs.push(tx)
      }

      if (matchedTxs.length > 0) {
        this.transactions.unshift(...matchedTxs)
        const lastTx = matchedTxs[0]
        this.marketStats.lastPrice = lastTx.price
        const vol = matchedTxs.reduce((s, t) => s + t.quantity, 0)
        this.marketStats.volume24h += vol
      }

      const myOrder = this.tradingOrders.find(o => o.id === order.id)
      if (!myOrder) return matchedTxs

      myOrder.filledQuantity = order.originalQuantity - remaining
      if (remaining <= 0) {
        myOrder.status = ORDER_STATUS.COMPLETED
        myOrder.quantity = 0
      } else if (remaining < order.originalQuantity) {
        myOrder.status = ORDER_STATUS.PARTIAL
        myOrder.quantity = remaining
        this.orderBook[order.side === 'buy' ? 'bids' : 'asks'].push({
          id: order.id, companyId: order.companyId,
          price: order.price, quantity: remaining,
          side: order.side, createdAt: order.createdAt,
        })
      } else {
        this.orderBook[order.side === 'buy' ? 'bids' : 'asks'].push({
          id: order.id, companyId: order.companyId,
          price: order.price, quantity: order.quantity,
          side: order.side, createdAt: order.createdAt,
        })
      }

      return matchedTxs
    },

    cancelTradingOrder(orderId) {
      const order = this.tradingOrders.find(o => o.id === orderId)
      if (!order || (order.status !== ORDER_STATUS.PENDING && order.status !== ORDER_STATUS.PARTIAL)) return false

      const remainingQty = order.quantity
      const totalCost = order.price * remainingQty
      const account = this.accounts[order.companyId]

      if (order.side === 'buy') {
        if (account) account.frozenFunds -= totalCost
      } else {
        if (account) account.frozenQuota -= remainingQty
      }

      const book = order.side === 'buy' ? this.orderBook.bids : this.orderBook.asks
      const idx = book.findIndex(o => o.id === orderId)
      if (idx > -1) book.splice(idx, 1)

      order.status = ORDER_STATUS.CANCELLED
      order.quantity = 0
      return true
    },

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
        status: ORDER_STATUS.PENDING, createdAt: nowString(),
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
      if (order && Object.values(ORDER_STATUS).includes(newStatus)) {
        order.status = newStatus
        if (newStatus === ORDER_STATUS.COMPLETED) {
          const buyerAccount = this.accounts[order.buyerId]
          const sellerAccount = this.accounts[order.sellerId]
          if (buyerAccount && sellerAccount) {
            buyerAccount.carbonQuota += order.carbonQuota
            buyerAccount.funds -= order.amount
            sellerAccount.carbonQuota -= order.carbonQuota
            sellerAccount.funds += order.amount
          }
          this.transactions.unshift({
            id: this._nextTxId++,
            txHash: generateTxHash(), blockHeight: generateBlockHeight(), blockHash: generateBlockHash(),
            buyOrderId: id, sellOrderId: id,
            buyerId: order.buyerId, sellerId: order.sellerId,
            buyerName: order.buyer, sellerName: order.seller,
            price: order.price, quantity: order.carbonQuota, totalAmount: order.amount,
            status: '已完成', timestamp: nowString(),
          })
        }
      }
    },
  },
})
