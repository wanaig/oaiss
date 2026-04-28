<script setup>
import { computed, onMounted, ref } from 'vue'
import { useCarbonStore } from '../../store/carbon'
import { ORDER_STATUS_MAP } from '../../config/constants'
import BlockchainHash from '../../components/BlockchainHash.vue'
import PageSaaSWrapper from '../../components/PageSaaSWrapper.vue'

const store = useCarbonStore()
const acc = computed(() => store.currentAccount)

const txPage = ref(1); const txPageSize = ref(10)
const txDetailVisible = ref(false); const currentTx = ref(null)

const myTx = computed(() => store.myTransactions)
const myOrders = computed(() => [...store.myTradingOrders, ...store.orderHistory])
const activeOrders = computed(() => myOrders.value.filter(o => o.status === 'open' || o.status === 'pending' || o.status === 'partial'))
const completedOrders = computed(() => myOrders.value.filter(o => o.status === 'filled' || o.status === 'completed'))
const cancelledOrders = computed(() => myOrders.value.filter(o => o.status === 'cancelled'))
const pagedTx = computed(() => { const s = (txPage.value - 1) * txPageSize.value; return myTx.value.slice(s, s + txPageSize.value) })

const orderStatusInfo = (s) => ORDER_STATUS_MAP[s] || { label: s, type: 'info' }

onMounted(async () => { await Promise.all([store.fetchAccount(), store.fetchMyOrders(), store.fetchOrderHistory(), store.fetchTradingTransactions()]) })

const openTxDetail = (tx) => { currentTx.value = tx; txDetailVisible.value = true }
</script>

<template>
  <PageSaaSWrapper title="我的账户" description="企业账户概览与交易记录">
    <div class="stats-row" v-if="acc">
      <el-card shadow="never" class="stat-card"><div class="stat-label">账户资金</div><div class="stat-value">¥{{ (acc.availableFunds ?? acc.funds).toLocaleString() }}</div><div class="stat-sub">可用 ¥{{ (acc.availableFunds ?? (acc.funds - (acc.frozenFunds||0))).toLocaleString() }}</div></el-card>
      <el-card shadow="never" class="stat-card"><div class="stat-label">碳配额</div><div class="stat-value" style="color:var(--saas-success)">{{ (acc.availableQuota ?? acc.carbonQuota).toLocaleString() }}</div><div class="stat-sub">可用 {{ (acc.availableQuota ?? (acc.carbonQuota - (acc.frozenQuota||0))).toLocaleString() }} 单位</div></el-card>
      <el-card shadow="never" class="stat-card"><div class="stat-label">信用评分</div><div class="stat-value" style="color:var(--saas-primary)">{{ acc.creditScore ?? '-' }}</div></el-card>
      <el-card shadow="never" class="stat-card"><div class="stat-label">活跃订单</div><div class="stat-value">{{ activeOrders.length }}</div><div class="stat-sub">已完成 {{ completedOrders.length }} · 已取消 {{ cancelledOrders.length }}</div></el-card>
    </div>

    <el-card shadow="never">
      <template #header><span>交易记录 (链上数据)</span></template>
      <el-table :data="pagedTx" border>
        <el-table-column label="序号" width="60" align="center"><template #default="s">{{ (txPage - 1) * txPageSize + s.$index + 1 }}</template></el-table-column>
        <el-table-column label="交易哈希" min-width="180"><template #default="{ row }"><BlockchainHash :hash="row.txHash" /></template></el-table-column>
        <el-table-column label="区块高度" width="100" align="right"><template #default="{ row }">{{ (row.blockHeight || 0).toLocaleString() }}</template></el-table-column>
        <el-table-column label="类型" width="70" align="center"><template #default="{ row }"><el-tag :type="row.buyerId === store.currentCompanyId ? 'success' : 'danger'" size="small">{{ row.buyerId === store.currentCompanyId ? '买入' : '卖出' }}</el-tag></template></el-table-column>
        <el-table-column label="成交价" width="90" align="right"><template #default="{ row }">¥{{ (row.price || 0).toFixed(2) }}</template></el-table-column>
        <el-table-column label="数量" width="80" align="right"><template #default="{ row }">{{ (row.quantity || 0).toLocaleString() }}</template></el-table-column>
        <el-table-column label="成交额" width="110" align="right"><template #default="{ row }">¥{{ (row.totalAmount || 0).toLocaleString() }}</template></el-table-column>
        <el-table-column label="对手方" min-width="120"><template #default="{ row }">{{ row.buyerId === store.currentCompanyId ? row.sellerName : row.buyerName }}</template></el-table-column>
        <el-table-column label="时间" min-width="160">
          <template #default="{ row }">{{ row.txTime || row.createdAt || row.timestamp }}</template>
        </el-table-column>
        <el-table-column label="操作" width="70" align="center"><template #default="{ row }"><el-button link type="primary" size="small" @click="openTxDetail(row)">详情</el-button></template></el-table-column>
      </el-table>
      <div class="pagination-wrap"><el-pagination v-model:current-page="txPage" v-model:page-size="txPageSize" background :page-sizes="[10,20,50]" layout="total, sizes, prev, pager, next, jumper" :total="myTx.length" /></div>
    </el-card>

    <el-dialog v-model="txDetailVisible" title="交易详情" width="700px">
      <el-descriptions :column="2" border v-if="currentTx" label-width="100px">
        <el-descriptions-item label="交易哈希" :span="2"><BlockchainHash :hash="currentTx.txHash" /></el-descriptions-item>
        <el-descriptions-item label="区块哈希" :span="2"><BlockchainHash :hash="currentTx.blockHash" /></el-descriptions-item>
        <el-descriptions-item label="区块高度">{{ (currentTx.blockHeight || 0).toLocaleString() }}</el-descriptions-item>
        <el-descriptions-item label="状态">{{ currentTx.status }}</el-descriptions-item>
        <el-descriptions-item label="价格">{{ (currentTx.price || 0).toFixed(2) }} 元</el-descriptions-item>
        <el-descriptions-item label="数量">{{ (currentTx.quantity || 0).toLocaleString() }} 单位</el-descriptions-item>
        <el-descriptions-item label="总额">¥{{ (currentTx.totalAmount || 0).toLocaleString() }}</el-descriptions-item>
        <el-descriptions-item label="买方">{{ currentTx.buyerName }}</el-descriptions-item>
        <el-descriptions-item label="卖方">{{ currentTx.sellerName }}</el-descriptions-item>
        <el-descriptions-item label="时间" :span="2">{{ currentTx.txTime || currentTx.createdAt || currentTx.timestamp }}</el-descriptions-item>
      </el-descriptions>
    </el-dialog>
  </PageSaaSWrapper>
</template>

<style scoped>
.stats-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; }
.stat-card { text-align: center; padding: 12px 0; }
.stat-label { font-size: 13px; color: var(--saas-text-secondary); margin-bottom: 4px; }
.stat-value { font-size: 24px; font-weight: 700; }
.stat-sub { font-size: 12px; color: var(--saas-text-light); margin-top: 4px; }
.pagination-wrap { margin-top: 16px; display: flex; justify-content: flex-end; }
</style>
