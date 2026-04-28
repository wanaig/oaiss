<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { ArrowDownBold, ArrowUpBold } from '@element-plus/icons-vue'
import { useCarbonStore } from '../../store/carbon'
import { ORDER_SIDE_LABEL, ORDER_STATUS_MAP } from '../../config/constants'
import BlockchainHash from '../../components/BlockchainHash.vue'
import PageSaaSWrapper from '../../components/PageSaaSWrapper.vue'

const store = useCarbonStore()
const acc = computed(() => store.currentAccount)

const orderSide = ref('buy')
const orderForm = reactive({ price: null, quantity: null })
const txFilterKeyword = ref('')
const txPage = ref(1); const txPageSize = ref(10)
const txSelectedRows = ref([])
const txDetailVisible = ref(false)
const currentTxDetail = ref(null)
const orderPage = ref(1); const orderPageSize = ref(10)

const marketStats = computed(() => store.marketStats)

const displayBids = computed(() => [...store.orderBook.bids].sort((a, b) => b.price - a.price || String(a.createdAt || '').localeCompare(String(b.createdAt || ''))).slice(0, 10))
const displayAsks = computed(() => [...store.orderBook.asks].sort((a, b) => a.price - b.price || String(a.createdAt || '').localeCompare(String(b.createdAt || ''))).slice(0, 10))

const myOrders = computed(() => store.myTradingOrders)
const pagedMyOrders = computed(() => { const s = (orderPage.value - 1) * orderPageSize.value; return myOrders.value.slice(s, s + orderPageSize.value) })
const activeOrderCount = computed(() => myOrders.value.filter(o => o.status === 'open' || o.status === 'pending' || o.status === 'partial').length)

const filteredTx = computed(() => {
  const kw = txFilterKeyword.value.trim().toLowerCase()
  return store.transactions.filter(t => !kw || (t.txHash || '').toLowerCase().includes(kw) || (t.buyerName || '').toLowerCase().includes(kw) || String(t.blockHeight || '').includes(kw))
})
const pagedTx = computed(() => { const s = (txPage.value - 1) * txPageSize.value; return filteredTx.value.slice(s, s + txPageSize.value) })

const estimateAmount = computed(() => orderForm.price && orderForm.quantity ? (orderForm.price * orderForm.quantity).toLocaleString() : '-')

const orderStatusInfo = (status) => ORDER_STATUS_MAP[status] || { label: status, type: 'info' }

onMounted(async () => {
  await Promise.all([store.fetchMarketStats(), store.fetchOrderBook(), store.fetchMyOrders({ page: 1, size: 999 }), store.fetchTradingTransactions({ page: 1, size: 999 }), store.fetchAccount()])
})

const onPlaceOrder = async () => {
  if (!orderForm.price || orderForm.price <= 0) { ElMessage.warning('请输入有效价格'); return }
  if (!orderForm.quantity || orderForm.quantity <= 0) { ElMessage.warning('请输入有效数量'); return }
  try { await store.placeTradingOrder(orderSide.value, orderForm.price, orderForm.quantity); ElMessage.success('订单已提交') } catch { ElMessage.error('订单提交失败'); return }
  orderForm.price = null; orderForm.quantity = null
}

const onCancelOrder = async (order) => {
  try { await store.cancelTradingOrder(order.id); ElMessage.success('订单已撤销') } catch { ElMessage.error('撤销失败') }
}

const openTxDetail = (tx) => { currentTxDetail.value = tx; txDetailVisible.value = true }
</script>

<template>
  <PageSaaSWrapper title="双向拍卖市场" description="碳配额实时撮合交易">
    <div class="stats-row">
      <el-card shadow="never" class="stat-card"><div class="stat-label">最新成交价</div><div class="stat-value stat-price">{{ (marketStats.lastPrice || 0).toFixed(2) }}</div><div class="stat-unit">元/单位</div></el-card>
      <el-card shadow="never" class="stat-card"><div class="stat-label">24h 涨跌</div><div class="stat-value" :class="(marketStats.change24h || 0) >= 0 ? 'up' : 'down'">{{ (marketStats.change24h || 0) >= 0 ? '+' : '' }}{{ (marketStats.change24h || 0).toFixed(2) }} ({{ (marketStats.changePercent24h || 0).toFixed(2) }}%)</div><div class="stat-sub">高 {{ (marketStats.high24h || 0).toFixed(2) }} / 低 {{ (marketStats.low24h || 0).toFixed(2) }}</div></el-card>
      <el-card shadow="never" class="stat-card"><div class="stat-label">24h 成交量</div><div class="stat-value">{{ (marketStats.volume24h || 0).toLocaleString() }}</div><div class="stat-unit">单位</div></el-card>
    </div>

    <div class="trade-grid">
      <el-card shadow="never" class="trade-form-card">
        <template #header><div class="card-header-row"><span>创建订单</span><el-radio-group v-model="orderSide" size="small"><el-radio-button value="buy"><el-icon><ArrowDownBold /></el-icon> 买入</el-radio-button><el-radio-button value="sell"><el-icon><ArrowUpBold /></el-icon> 卖出</el-radio-button></el-radio-group></div></template>
        <div class="acc-info" v-if="acc"><span>资金 <strong>¥{{ (acc.availableFunds ?? acc.funds - (acc.frozenFunds||0)).toLocaleString() }}</strong></span><span class="sep">|</span><span>配额 <strong>{{ (acc.availableQuota ?? acc.carbonQuota - (acc.frozenQuota||0)).toLocaleString() }}</strong></span><span class="sep">|</span><span>活跃 <strong>{{ activeOrderCount }}</strong></span></div>
        <el-form label-position="top">
          <el-form-item label="价格 (元/单位)"><el-input-number v-model="orderForm.price" :min="0.01" :precision="2" :step="0.5" style="width:100%" controls-position="right" /></el-form-item>
          <el-form-item label="数量 (单位)"><el-input-number v-model="orderForm.quantity" :min="1" :step="10" style="width:100%" controls-position="right" /></el-form-item>
          <el-form-item label="预估金额"><div style="font-size:18px;font-weight:700;color:var(--saas-primary)">¥{{ estimateAmount }}</div></el-form-item>
          <el-button type="primary" :class="orderSide === 'buy' ? 'btn-buy' : 'btn-sell'" size="large" style="width:100%" @click="onPlaceOrder">确认{{ orderSide === 'buy' ? '买入' : '卖出' }}</el-button>
        </el-form>
      </el-card>

      <el-card shadow="never" class="orderbook-card">
        <template #header><span>订单簿</span></template>
        <div class="ob-section ob-asks"><div class="ob-hdr"><span>价格</span><span>数量</span></div><div v-for="a in displayAsks" :key="a.id" class="ob-row"><span class="ob-price-sell">{{ a.price.toFixed(2) }}</span><span>{{ a.quantity.toLocaleString() }}</span></div></div>
        <div class="ob-spread"><span class="spread-lbl">最新价</span><span class="spread-val">{{ (marketStats.lastPrice || 0).toFixed(2) }}</span></div>
        <div class="ob-section ob-bids"><div v-for="b in displayBids" :key="b.id" class="ob-row"><span class="ob-price-buy">{{ b.price.toFixed(2) }}</span><span>{{ b.quantity.toLocaleString() }}</span></div></div>
      </el-card>
    </div>

    <el-card shadow="never">
      <template #header><span>我的订单</span></template>
      <el-table :data="pagedMyOrders" border>
        <el-table-column label="序号" width="60" align="center"><template #default="s">{{ (orderPage - 1) * orderPageSize + s.$index + 1 }}</template></el-table-column>
        <el-table-column label="方向" width="70" align="center"><template #default="{ row }"><el-tag :type="row.side === 'buy' ? 'success' : 'danger'" size="small">{{ ORDER_SIDE_LABEL[row.side] }}</el-tag></template></el-table-column>
        <el-table-column label="价格" width="100" align="right"><template #default="{ row }">{{ (row.price || 0).toFixed(2) }}</template></el-table-column>
        <el-table-column label="数量/已成交" width="120" align="right"><template #default="{ row }">{{ row.originalQuantity || row.quantity || 0 }} / {{ row.filledQuantity || 0 }}</template></el-table-column>
        <el-table-column label="状态" width="80" align="center"><template #default="{ row }"><el-tag :type="orderStatusInfo(row.status).type" size="small">{{ orderStatusInfo(row.status).label }}</el-tag></template></el-table-column>
        <el-table-column label="创建时间" min-width="160"><template #default="{ row }">{{ row.createdAt }}</template></el-table-column>
        <el-table-column label="操作" width="70" align="center" fixed="right"><template #default="{ row }"><el-button v-if="row.status === 'open' || row.status === 'partial'" link type="danger" size="small" @click="onCancelOrder(row)">撤单</el-button><span v-else class="muted">-</span></template></el-table-column>
      </el-table>
      <div class="pagination-wrap"><el-pagination v-model:current-page="orderPage" v-model:page-size="orderPageSize" background :page-sizes="[10,20,50]" layout="total, sizes, prev, pager, next, jumper" :total="myOrders.length" /></div>
    </el-card>

    <el-card shadow="never">
      <template #header><span>成交记录 (链上数据)</span></template>
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:12px"><el-input v-model="txFilterKeyword" placeholder="搜索交易哈希/参与方/区块高度" clearable style="width:300px" /><el-button type="primary" @click="txPage = 1">查询</el-button></div>
      <el-table :data="pagedTx" border @selection-change="txSelectedRows = $event">
        <el-table-column type="selection" width="50" />
        <el-table-column label="序号" width="60" align="center"><template #default="s">{{ (txPage - 1) * txPageSize + s.$index + 1 }}</template></el-table-column>
        <el-table-column label="交易哈希" min-width="180"><template #default="{ row }"><BlockchainHash :hash="row.txHash" /></template></el-table-column>
        <el-table-column label="区块高度" width="100" align="right"><template #default="{ row }">{{ (row.blockHeight || 0).toLocaleString() }}</template></el-table-column>
        <el-table-column label="成交价" width="90" align="right"><template #default="{ row }">{{ (row.price || 0).toFixed(2) }}</template></el-table-column>
        <el-table-column label="数量" width="80" align="right"><template #default="{ row }">{{ (row.quantity || 0).toLocaleString() }}</template></el-table-column>
        <el-table-column label="成交额" width="110" align="right"><template #default="{ row }">¥{{ (row.totalAmount || 0).toLocaleString() }}</template></el-table-column>
        <el-table-column prop="buyerName" label="买方" min-width="120" show-overflow-tooltip />
        <el-table-column prop="sellerName" label="卖方" min-width="120" show-overflow-tooltip />
        <el-table-column label="时间" min-width="160">
          <template #default="{ row }">{{ row.txTime || row.createdAt || row.timestamp }}</template>
        </el-table-column>
        <el-table-column label="操作" width="80" align="center" fixed="right"><template #default="{ row }"><el-button link type="primary" size="small" @click="openTxDetail(row)">详情</el-button></template></el-table-column>
      </el-table>
      <div class="pagination-wrap"><el-pagination v-model:current-page="txPage" v-model:page-size="txPageSize" background :page-sizes="[10,20,50]" layout="total, sizes, prev, pager, next, jumper" :total="filteredTx.length" /></div>
    </el-card>

    <el-dialog v-model="txDetailVisible" title="交易详情" width="720px">
      <el-descriptions :column="2" border v-if="currentTxDetail" label-width="100px">
        <el-descriptions-item label="交易哈希" :span="2"><BlockchainHash :hash="currentTxDetail.txHash" /></el-descriptions-item>
        <el-descriptions-item label="区块哈希" :span="2"><BlockchainHash :hash="currentTxDetail.blockHash" /></el-descriptions-item>
        <el-descriptions-item label="区块高度">{{ (currentTxDetail.blockHeight || 0).toLocaleString() }}</el-descriptions-item>
        <el-descriptions-item label="状态">{{ currentTxDetail.status }}</el-descriptions-item>
        <el-descriptions-item label="价格">{{ (currentTxDetail.price || 0).toFixed(2) }} 元</el-descriptions-item>
        <el-descriptions-item label="数量">{{ (currentTxDetail.quantity || 0).toLocaleString() }} 单位</el-descriptions-item>
        <el-descriptions-item label="总额">¥{{ (currentTxDetail.totalAmount || 0).toLocaleString() }}</el-descriptions-item>
        <el-descriptions-item label="买方">{{ currentTxDetail.buyerName }}</el-descriptions-item>
        <el-descriptions-item label="卖方">{{ currentTxDetail.sellerName }}</el-descriptions-item>
        <el-descriptions-item label="时间" :span="2">{{ currentTxDetail.txTime || currentTxDetail.createdAt || currentTxDetail.timestamp }}</el-descriptions-item>
      </el-descriptions>
    </el-dialog>
  </PageSaaSWrapper>
</template>

<style scoped>
.stats-row { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
.stat-card { text-align: center; padding: 12px 0; }
.stat-label { font-size: 13px; color: var(--saas-text-secondary); margin-bottom: 4px; }
.stat-value { font-size: 26px; font-weight: 700; }
.stat-price { color: var(--saas-primary); }
.stat-value.up { color: var(--saas-success); }
.stat-value.down { color: var(--saas-danger); }
.stat-unit { font-size: 12px; color: var(--saas-text-light); margin-top: 2px; }
.stat-sub { font-size: 12px; color: var(--saas-text-light); margin-top: 2px; }
.trade-grid { display: grid; grid-template-columns: 360px 1fr; gap: 16px; align-items: start; }
.trade-form-card { height: fit-content; }
.acc-info { display: flex; gap: 8px; align-items: center; font-size: 13px; color: var(--saas-text-secondary); padding: 6px 0; flex-wrap: wrap; }
.acc-info strong { color: var(--saas-text); }
.sep { color: var(--saas-border); }
.btn-buy { background: var(--saas-success); border-color: var(--saas-success); }
.btn-sell { background: var(--saas-danger); border-color: var(--saas-danger); }
.card-header-row { display: flex; justify-content: space-between; align-items: center; }
.orderbook-card { height: fit-content; }
.ob-section { display: flex; flex-direction: column; }
.ob-hdr { display: flex; justify-content: space-between; padding: 4px 8px; font-size: 12px; color: var(--saas-text-light); border-bottom: 1px solid var(--saas-border); }
.ob-row { display: flex; justify-content: space-between; padding: 3px 8px; font-size: 13px; font-family: monospace; }
.ob-price-sell { color: var(--saas-danger); }
.ob-price-buy { color: var(--saas-success); }
.ob-spread { display: flex; justify-content: center; gap: 12px; padding: 8px 0; border-top: 1px solid var(--saas-border); border-bottom: 1px solid var(--saas-border); background: var(--saas-bg); }
.spread-lbl { font-size: 12px; color: var(--saas-text-secondary); }
.spread-val { font-size: 18px; font-weight: 700; color: var(--saas-primary); font-family: monospace; }
.muted { color: var(--saas-text-light); }
.cell-mono { font-family: 'JetBrains Mono', 'Courier New', monospace; font-size: 13px; }
.cell-time { font-size: 13px; color: var(--saas-text-secondary); }
.orders-card :deep(.el-card__body) { padding: 0; }
.orders-card :deep(.el-card__header) { padding: 14px 20px 0; border: none; }
.pagination-wrap { margin-top: 16px; display: flex; justify-content: flex-end; }
@media (max-width: 1200px) { .trade-grid { grid-template-columns: 1fr; } }
</style>
