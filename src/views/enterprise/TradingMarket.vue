<script setup>
import { computed, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { ArrowDownBold, ArrowUpBold } from '@element-plus/icons-vue'
import { useCarbonStore } from '../../store/carbon'
import { ORDER_STATUS, ORDER_SIDE, ORDER_SIDE_LABEL } from '../../config/constants'
import BlockchainHash from '../../components/BlockchainHash.vue'

const store = useCarbonStore()
const acc = computed(() => store.currentAccount)

const orderSide = ref('buy')
const orderForm = reactive({ price: null, quantity: null })

const txFilterKeyword = ref('')
const txPage = ref(1)
const txPageSize = ref(10)
const txSelectedRows = ref([])
const txDetailVisible = ref(false)
const currentTxDetail = ref(null)

const orderPage = ref(1)
const orderPageSize = ref(10)

const marketStats = computed(() => store.marketStats)

const displayBids = computed(() =>
  [...store.orderBook.bids].sort((a, b) => b.price - a.price || a.createdAt.localeCompare(b.createdAt)).slice(0, 10)
)
const displayAsks = computed(() =>
  [...store.orderBook.asks].sort((a, b) => a.price - b.price || a.createdAt.localeCompare(b.createdAt)).slice(0, 10)
)

const myOrders = computed(() => store.myTradingOrders)
const totalOrders = computed(() => myOrders.value.length)
const pagedMyOrders = computed(() => {
  const start = (orderPage.value - 1) * orderPageSize.value
  return myOrders.value.slice(start, start + orderPageSize.value)
})

const activeOrderCount = computed(() =>
  myOrders.value.filter(o => o.status === ORDER_STATUS.PENDING || o.status === ORDER_STATUS.PARTIAL).length
)

const filteredTx = computed(() => {
  const keyword = txFilterKeyword.value.trim().toLowerCase()
  return store.transactions.filter(t => {
    if (!keyword) return true
    return t.txHash.toLowerCase().includes(keyword) ||
      t.buyerName.toLowerCase().includes(keyword) ||
      t.sellerName.toLowerCase().includes(keyword) ||
      String(t.blockHeight).includes(keyword)
  })
})

const totalTx = computed(() => filteredTx.value.length)
const pagedTx = computed(() => {
  const start = (txPage.value - 1) * txPageSize.value
  return filteredTx.value.slice(start, start + txPageSize.value)
})

const estimateAmount = computed(() => {
  if (orderForm.price && orderForm.quantity) return (orderForm.price * orderForm.quantity).toLocaleString()
  return '-'
})

const onPlaceOrder = () => {
  if (!orderForm.price || orderForm.price <= 0) { ElMessage.warning('请输入有效价格'); return }
  if (!orderForm.quantity || orderForm.quantity <= 0) { ElMessage.warning('请输入有效数量'); return }

  const result = store.placeTradingOrder(orderSide.value, orderForm.price, orderForm.quantity)
  if (!result.ok) {
    ElMessage.warning(result.msg)
    return
  }

  const order = store.myTradingOrders[0]
  if (order && order.status === ORDER_STATUS.COMPLETED) {
    ElMessage.success('订单已全部成交，交易记录已上链')
  } else if (order && order.status === ORDER_STATUS.PARTIAL) {
    ElMessage.success(`订单部分成交 (${order.filledQuantity} / ${order.originalQuantity})，剩余挂单等待中`)
  } else {
    ElMessage.info('订单已挂入市场，等待撮合')
  }

  orderForm.price = null
  orderForm.quantity = null
}

const onCancelOrder = async (order) => {
  store.cancelTradingOrder(order.id)
  ElMessage.success('订单已撤销，资金/配额已返还')
}

const openTxDetail = (tx) => { currentTxDetail.value = tx; txDetailVisible.value = true }

const onTxQuery = () => { txPage.value = 1; ElMessage.success('查询完成') }
const onTxSelectionChange = (rows) => { txSelectedRows.value = rows }
const onTxSizeChange = (s) => { txPageSize.value = s; txPage.value = 1 }
const onTxPageChange = (p) => { txPage.value = p }
const onOrderSizeChange = (s) => { orderPageSize.value = s; orderPage.value = 1 }
const onOrderPageChange = (p) => { orderPage.value = p }
</script>

<template>
  <section class="trading-page">
    <el-card class="section-card" shadow="never">
      <el-breadcrumb separator="/">
        <el-breadcrumb-item :to="{ path: '/enterprise/carbon/upload' }">首页</el-breadcrumb-item>
        <el-breadcrumb-item>碳交易</el-breadcrumb-item>
        <el-breadcrumb-item>双向拍卖</el-breadcrumb-item>
      </el-breadcrumb>
    </el-card>

    <div class="stats-row">
      <el-card class="stat-card" shadow="never">
        <div class="stat-label">最新成交价</div>
        <div class="stat-value stat-price">{{ marketStats.lastPrice.toFixed(2) }}</div>
        <div class="stat-unit">元 / 单位碳配额</div>
      </el-card>
      <el-card class="stat-card" shadow="never">
        <div class="stat-label">24h 涨跌</div>
        <div class="stat-value" :class="marketStats.change24h >= 0 ? 'up' : 'down'">
          {{ marketStats.change24h >= 0 ? '+' : '' }}{{ marketStats.change24h.toFixed(2) }}
          ({{ marketStats.changePercent24h >= 0 ? '+' : '' }}{{ marketStats.changePercent24h.toFixed(2) }}%)
        </div>
        <div class="stat-sub">高 {{ marketStats.high24h.toFixed(2) }} / 低 {{ marketStats.low24h.toFixed(2) }}</div>
      </el-card>
      <el-card class="stat-card" shadow="never">
        <div class="stat-label">24h 成交量</div>
        <div class="stat-value">{{ marketStats.volume24h.toLocaleString() }}</div>
        <div class="stat-unit">单位碳配额</div>
      </el-card>
    </div>

    <div class="trade-panel">
      <el-card class="section-card trade-form-card" shadow="never">
        <template #header>
          <div class="card-header-row">
            <span class="card-title">创建订单</span>
            <el-radio-group v-model="orderSide" class="side-switch">
              <el-radio-button value="buy"><el-icon><ArrowDownBold /></el-icon> 买入</el-radio-button>
              <el-radio-button value="sell"><el-icon><ArrowUpBold /></el-icon> 卖出</el-radio-button>
            </el-radio-group>
          </div>
        </template>
        <div class="account-info" v-if="acc">
          <span>资金：<strong>¥{{ (acc.funds - acc.frozenFunds).toLocaleString() }}</strong></span>
          <el-divider direction="vertical" />
          <span>配额：<strong>{{ (acc.carbonQuota - acc.frozenQuota).toLocaleString() }}</strong> 单位</span>
          <el-divider direction="vertical" />
          <span>活跃：<strong>{{ activeOrderCount }}</strong> 笔</span>
        </div>
        <el-form label-position="top" class="order-form">
          <el-form-item label="委托价格（元/单位）">
            <el-input-number v-model="orderForm.price" :min="0.01" :precision="2" :step="0.5" style="width: 100%" controls-position="right" />
          </el-form-item>
          <el-form-item label="委托数量（碳配额单位）">
            <el-input-number v-model="orderForm.quantity" :min="1" :step="10" style="width: 100%" controls-position="right" />
          </el-form-item>
          <el-form-item label="预估金额">
            <div class="estimate-amount">¥{{ estimateAmount }}</div>
          </el-form-item>
          <el-button type="primary" :class="orderSide === 'buy' ? 'btn-buy' : 'btn-sell'" size="large" style="width: 100%" @click="onPlaceOrder">确认{{ orderSide === 'buy' ? '买入' : '卖出' }}</el-button>
        </el-form>
      </el-card>

      <el-card class="section-card orderbook-card" shadow="never">
        <template #header><span class="card-title">订单簿 (Order Book)</span></template>
        <div class="orderbook-sections">
          <div class="ob-section ob-asks">
            <div class="ob-header"><span class="ob-header-item price">价格</span><span class="ob-header-item qty">数量</span></div>
            <div v-for="ask in displayAsks" :key="ask.id" class="ob-row ob-ask-row">
              <span class="ob-price ob-price-sell">{{ ask.price.toFixed(2) }}</span>
              <span class="ob-qty">{{ ask.quantity.toLocaleString() }}</span>
            </div>
          </div>
          <div class="ob-spread">
            <span class="spread-label">最新价</span>
            <span class="spread-price">{{ marketStats.lastPrice.toFixed(2) }}</span>
          </div>
          <div class="ob-section ob-bids">
            <div v-for="bid in displayBids" :key="bid.id" class="ob-row ob-bid-row">
              <span class="ob-price ob-price-buy">{{ bid.price.toFixed(2) }}</span>
              <span class="ob-qty">{{ bid.quantity.toLocaleString() }}</span>
            </div>
          </div>
        </div>
      </el-card>
    </div>

    <el-card class="section-card" shadow="never">
      <template #header><span class="card-title">我的订单</span></template>
      <el-table :data="pagedMyOrders" border>
        <el-table-column label="序号" width="68" align="center">
          <template #default="scope">{{ (orderPage - 1) * orderPageSize + scope.$index + 1 }}</template>
        </el-table-column>
        <el-table-column label="方向" width="80" align="center">
          <template #default="{ row }">
            <el-tag :type="row.side === 'buy' ? 'success' : 'danger'" size="small">{{ ORDER_SIDE_LABEL[row.side] }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="价格" width="110" align="right">
          <template #default="{ row }">{{ row.price.toFixed(2) }}</template>
        </el-table-column>
        <el-table-column label="数量/已成交" width="130" align="right">
          <template #default="{ row }">{{ row.originalQuantity || row.quantity }} / {{ row.filledQuantity }}</template>
        </el-table-column>
        <el-table-column label="状态" width="90" align="center">
          <template #default="{ row }">
            <el-tag :type="row.status === ORDER_STATUS.COMPLETED ? 'success' : row.status === ORDER_STATUS.CANCELLED ? 'info' : row.status === ORDER_STATUS.PARTIAL ? 'warning' : ''" size="small">{{ row.status }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="创建时间" min-width="170" />
        <el-table-column label="操作" width="80" align="center" fixed="right">
          <template #default="{ row }">
            <el-button v-if="row.status === ORDER_STATUS.PENDING || row.status === ORDER_STATUS.PARTIAL" link type="danger" size="small" @click="onCancelOrder(row)">撤单</el-button>
            <span v-else class="muted">-</span>
          </template>
        </el-table-column>
      </el-table>
      <div class="pagination-row">
        <el-pagination v-model:current-page="orderPage" v-model:page-size="orderPageSize" background :page-sizes="[10, 20, 50]" layout="total, sizes, prev, pager, next, jumper" :total="totalOrders" @size-change="onOrderSizeChange" @current-change="onOrderPageChange" />
      </div>
    </el-card>

    <el-card class="section-card" shadow="never">
      <template #header><span class="card-title">成交记录（区块链上链数据）</span></template>
      <div class="tx-search-row">
        <el-input v-model="txFilterKeyword" placeholder="搜索交易哈希 / 参与方 / 区块高度" clearable style="width: 320px; margin-right: 10px" />
        <el-button type="primary" @click="onTxQuery">查询</el-button>
      </div>
      <div class="table-tip">已选择 {{ txSelectedRows.length }} 条记录，所有交易数据基于区块链账本生成且不可篡改。</div>
      <el-table :data="pagedTx" border @selection-change="onTxSelectionChange">
        <el-table-column type="selection" width="56" />
        <el-table-column label="序号" width="68" align="center">
          <template #default="scope">{{ (txPage - 1) * txPageSize + scope.$index + 1 }}</template>
        </el-table-column>
        <el-table-column label="交易哈希" min-width="200">
          <template #default="{ row }"><BlockchainHash :hash="row.txHash" /></template>
        </el-table-column>
        <el-table-column label="区块高度" width="110" align="right">
          <template #default="{ row }">{{ row.blockHeight.toLocaleString() }}</template>
        </el-table-column>
        <el-table-column label="成交价" width="100" align="right">
          <template #default="{ row }">{{ row.price.toFixed(2) }}</template>
        </el-table-column>
        <el-table-column label="数量" width="90" align="right">
          <template #default="{ row }">{{ row.quantity.toLocaleString() }}</template>
        </el-table-column>
        <el-table-column label="成交额" width="120" align="right">
          <template #default="{ row }">¥{{ row.totalAmount.toLocaleString() }}</template>
        </el-table-column>
        <el-table-column prop="buyerName" label="买方" min-width="140" show-overflow-tooltip />
        <el-table-column prop="sellerName" label="卖方" min-width="140" show-overflow-tooltip />
        <el-table-column prop="timestamp" label="时间戳" min-width="170" />
        <el-table-column label="操作" width="100" align="center" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" size="small" @click="openTxDetail(row)">查看详情</el-button>
          </template>
        </el-table-column>
      </el-table>
      <div class="pagination-row">
        <el-pagination v-model:current-page="txPage" v-model:page-size="txPageSize" background :page-sizes="[10, 20, 50]" layout="total, sizes, prev, pager, next, jumper" :total="totalTx" @size-change="onTxSizeChange" @current-change="onTxPageChange" />
      </div>
    </el-card>

    <el-dialog v-model="txDetailVisible" title="交易详情（链上数据）" width="780px" destroy-on-close>
      <el-descriptions :column="2" border v-if="currentTxDetail" label-width="110px">
        <el-descriptions-item label="交易哈希值" :span="2">
          <BlockchainHash :hash="currentTxDetail.txHash" />
        </el-descriptions-item>
        <el-descriptions-item label="区块哈希" :span="2">
          <BlockchainHash :hash="currentTxDetail.blockHash" />
        </el-descriptions-item>
        <el-descriptions-item label="区块高度">{{ currentTxDetail.blockHeight.toLocaleString() }}</el-descriptions-item>
        <el-descriptions-item label="状态">{{ currentTxDetail.status }}</el-descriptions-item>
        <el-descriptions-item label="成交价格">¥{{ currentTxDetail.price.toFixed(2) }}</el-descriptions-item>
        <el-descriptions-item label="成交数量">{{ currentTxDetail.quantity.toLocaleString() }} 单位</el-descriptions-item>
        <el-descriptions-item label="成交总额">¥{{ currentTxDetail.totalAmount.toLocaleString() }}</el-descriptions-item>
        <el-descriptions-item label="买方">{{ currentTxDetail.buyerName }}</el-descriptions-item>
        <el-descriptions-item label="卖方">{{ currentTxDetail.sellerName }}</el-descriptions-item>
        <el-descriptions-item label="交易时间" :span="2">{{ currentTxDetail.timestamp }}</el-descriptions-item>
      </el-descriptions>
    </el-dialog>
  </section>
</template>

<style scoped>
.trading-page { display: flex; flex-direction: column; gap: 14px; }
.section-card { border: 1px solid var(--border-color); border-radius: 12px; }
.stats-row { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; }
.stat-card { text-align: center; padding: 4px 0; }
.stat-label { font-size: 13px; color: var(--text-secondary); margin-bottom: 6px; }
.stat-value { font-size: 28px; font-weight: 700; color: var(--text-primary); }
.stat-value.up { color: #18a99a; }
.stat-value.down { color: #e74c3c; }
.stat-price { color: #18a99a; }
.stat-unit { font-size: 12px; color: var(--text-secondary); margin-top: 4px; }
.stat-sub { font-size: 12px; color: var(--text-secondary); margin-top: 4px; }
.trade-panel { display: grid; grid-template-columns: 400px 1fr; gap: 14px; align-items: start; }
.trade-form-card { height: fit-content; }
.card-header-row { display: flex; justify-content: space-between; align-items: center; }
.card-title { font-size: 15px; font-weight: 700; }
.account-info { display: flex; align-items: center; gap: 10px; font-size: 13px; color: var(--text-secondary); padding: 8px 0; margin-bottom: 8px; flex-wrap: wrap; }
.account-info strong { color: var(--text-primary); }
.order-form { margin-top: 4px; }
.estimate-amount { font-size: 18px; font-weight: 700; }
.btn-buy { background: linear-gradient(120deg, #18a99a, #42c977); border: none; }
.btn-sell { background: linear-gradient(120deg, #e74c3c, #c0392b); border: none; }
.orderbook-card { height: fit-content; }
.orderbook-sections { display: flex; flex-direction: column; }
.ob-header { display: flex; justify-content: space-between; padding: 4px 8px; font-size: 12px; color: var(--text-secondary); border-bottom: 1px solid var(--border-color); }
.ob-header-item.price { flex: 1; }
.ob-header-item.qty { text-align: right; min-width: 80px; }
.ob-row { display: flex; justify-content: space-between; padding: 4px 8px; font-size: 13px; font-family: 'Courier New', monospace; }
.ob-ask-row { position: relative; }
.ob-ask-row::before { content: ''; position: absolute; right: 0; top: 0; height: 100%; width: 40%; background: linear-gradient(90deg, transparent, rgba(231, 76, 60, 0.12)); border-radius: 0 4px 4px 0; }
.ob-bid-row { position: relative; }
.ob-bid-row::before { content: ''; position: absolute; right: 0; top: 0; height: 100%; width: 40%; background: linear-gradient(90deg, transparent, rgba(24, 169, 154, 0.12)); border-radius: 0 4px 4px 0; }
.ob-price { flex: 1; }
.ob-price-sell { color: #e74c3c; }
.ob-price-buy { color: #18a99a; }
.ob-qty { text-align: right; min-width: 80px; }
.ob-spread { display: flex; align-items: center; justify-content: center; gap: 12px; padding: 8px 0; border-top: 1px solid var(--border-color); border-bottom: 1px solid var(--border-color); background: var(--bg-page); }
.spread-label { font-size: 12px; color: var(--text-secondary); }
.spread-price { font-size: 18px; font-weight: 700; color: #18a99a; font-family: 'Courier New', monospace; }
.tx-search-row { display: flex; align-items: center; margin-bottom: 10px; }
.table-tip { margin-bottom: 10px; color: var(--text-secondary); font-size: 13px; }
.pagination-row { margin-top: 14px; display: flex; justify-content: flex-end; }
.muted { color: var(--text-secondary); }
@media (max-width: 1200px) { .trade-panel { grid-template-columns: 1fr; } }
</style>
