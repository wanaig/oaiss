<script setup>
import { computed, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { useCarbonStore } from '../../store/carbon'
import { ORDER_STATUS, AUDIT_STATUS } from '../../config/constants'
import BlockchainHash from '../../components/BlockchainHash.vue'

const store = useCarbonStore()
const acc = computed(() => store.currentAccount)

const txPage = ref(1)
const txPageSize = ref(10)
const txDetailVisible = ref(false)
const currentTx = ref(null)

const myTx = computed(() => store.myTransactions)
const totalTx = computed(() => myTx.value.length)
const pagedTx = computed(() => {
  const start = (txPage.value - 1) * txPageSize.value
  return myTx.value.slice(start, start + txPageSize.value)
})

const myOrders = computed(() => store.myTradingOrders)
const activeOrders = computed(() => myOrders.value.filter(o => o.status === ORDER_STATUS.PENDING || o.status === ORDER_STATUS.PARTIAL))
const completedOrders = computed(() => myOrders.value.filter(o => o.status === ORDER_STATUS.COMPLETED))
const cancelledOrders = computed(() => myOrders.value.filter(o => o.status === ORDER_STATUS.CANCELLED))

const totalQuotaIssued = computed(() => store.emissionReports
  .filter(r => r.companyId === store.currentCompanyId && r.auditStatus === AUDIT_STATUS.APPROVED)
  .reduce((s, r) => s + r.emission, 0))

const openTxDetail = (tx) => {
  currentTx.value = tx
  txDetailVisible.value = true
}

const statusTag = (status) => {
  switch (status) {
    case ORDER_STATUS.PENDING: return 'warning'
    case ORDER_STATUS.PARTIAL: return ''
    case ORDER_STATUS.COMPLETED: return 'success'
    case ORDER_STATUS.CANCELLED: return 'info'
    default: return 'info'
  }
}

const onTxSizeChange = (s) => { txPageSize.value = s; txPage.value = 1 }
const onTxPageChange = (p) => { txPage.value = p }
</script>

<template>
  <section class="account-page">
    <el-card class="section-card" shadow="never">
      <el-breadcrumb separator="/">
        <el-breadcrumb-item>本公司信息</el-breadcrumb-item>
        <el-breadcrumb-item>我的账户</el-breadcrumb-item>
      </el-breadcrumb>
    </el-card>

    <div class="stats-row" v-if="acc">
      <el-card class="stat-card" shadow="never">
        <div class="stat-label">账户资金</div>
        <div class="stat-value">¥{{ acc.funds.toLocaleString() }}</div>
        <div class="stat-sub">冻结 ¥{{ acc.frozenFunds.toLocaleString() }} | 可用 ¥{{ (acc.funds - acc.frozenFunds).toLocaleString() }}</div>
      </el-card>
      <el-card class="stat-card" shadow="never">
        <div class="stat-label">碳配额持有量</div>
        <div class="stat-value green">{{ acc.carbonQuota.toLocaleString() }}</div>
        <div class="stat-sub">冻结 {{ acc.frozenQuota.toLocaleString() }} | 可用 {{ (acc.carbonQuota - acc.frozenQuota).toLocaleString() }} 单位</div>
      </el-card>
      <el-card class="stat-card" shadow="never">
        <div class="stat-label">累计审核配额</div>
        <div class="stat-value teal">{{ totalQuotaIssued.toLocaleString() }}</div>
        <div class="stat-sub">审核通过累计发放</div>
      </el-card>
      <el-card class="stat-card" shadow="never">
        <div class="stat-label">信用评分</div>
        <div class="stat-value blue">{{ acc.creditScore }}</div>
        <div class="stat-sub">企业信用积分</div>
      </el-card>
    </div>

    <el-card class="section-card" shadow="never">
      <template #header><span class="card-title">订单汇总</span></template>
      <el-descriptions :column="4" border>
        <el-descriptions-item label="活跃订单">{{ activeOrders.length }} 笔</el-descriptions-item>
        <el-descriptions-item label="已完成订单">{{ completedOrders.length }} 笔</el-descriptions-item>
        <el-descriptions-item label="已取消订单">{{ cancelledOrders.length }} 笔</el-descriptions-item>
        <el-descriptions-item label="总订单">{{ myOrders.length }} 笔</el-descriptions-item>
      </el-descriptions>
    </el-card>

    <el-card class="section-card" shadow="never">
      <template #header><span class="card-title">交易记录（链上数据）</span></template>
      <el-table :data="pagedTx" border>
        <el-table-column label="序号" width="68" align="center">
          <template #default="scope">{{ (txPage - 1) * txPageSize + scope.$index + 1 }}</template>
        </el-table-column>
        <el-table-column label="交易哈希" min-width="200">
          <template #default="{ row }"><BlockchainHash :hash="row.txHash" /></template>
        </el-table-column>
        <el-table-column label="区块高度" width="110" align="right">
          <template #default="{ row }">{{ row.blockHeight.toLocaleString() }}</template>
        </el-table-column>
        <el-table-column label="类型" width="90" align="center">
          <template #default="{ row }">
            <el-tag :type="row.buyerId === store.currentCompanyId ? 'success' : 'danger'" size="small">{{ row.buyerId === store.currentCompanyId ? '买入' : '卖出' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="成交价" width="100" align="right">
          <template #default="{ row }">¥{{ row.price.toFixed(2) }}</template>
        </el-table-column>
        <el-table-column label="数量" width="90" align="right">
          <template #default="{ row }">{{ row.quantity.toLocaleString() }}</template>
        </el-table-column>
        <el-table-column label="成交额" width="120" align="right">
          <template #default="{ row }">¥{{ row.totalAmount.toLocaleString() }}</template>
        </el-table-column>
        <el-table-column label="对手方" min-width="140">
          <template #default="{ row }">{{ row.buyerId === store.currentCompanyId ? row.sellerName : row.buyerName }}</template>
        </el-table-column>
        <el-table-column prop="timestamp" label="时间" min-width="170" />
        <el-table-column label="操作" width="90" align="center">
          <template #default="{ row }">
            <el-button link type="primary" size="small" @click="openTxDetail(row)">详情</el-button>
          </template>
        </el-table-column>
      </el-table>
      <div class="pagination-row">
        <el-pagination v-model:current-page="txPage" v-model:page-size="txPageSize" background :page-sizes="[10, 20, 50]" layout="total, sizes, prev, pager, next, jumper" :total="totalTx" @size-change="onTxSizeChange" @current-change="onTxPageChange" />
      </div>
    </el-card>

    <el-dialog v-model="txDetailVisible" title="交易详情（链上数据）" width="700px" destroy-on-close>
      <el-descriptions :column="2" border v-if="currentTx" label-width="110px">
        <el-descriptions-item label="交易哈希值" :span="2">
          <BlockchainHash :hash="currentTx.txHash" />
        </el-descriptions-item>
        <el-descriptions-item label="区块哈希" :span="2">
          <BlockchainHash :hash="currentTx.blockHash" />
        </el-descriptions-item>
        <el-descriptions-item label="区块高度">{{ currentTx.blockHeight.toLocaleString() }}</el-descriptions-item>
        <el-descriptions-item label="交易状态">{{ currentTx.status }}</el-descriptions-item>
        <el-descriptions-item label="成交价格">{{ currentTx.price.toFixed(2) }} 元/单位</el-descriptions-item>
        <el-descriptions-item label="成交数量">{{ currentTx.quantity.toLocaleString() }} 单位</el-descriptions-item>
        <el-descriptions-item label="成交总额">{{ currentTx.totalAmount.toLocaleString() }} 元</el-descriptions-item>
        <el-descriptions-item label="买方">{{ currentTx.buyerName }}</el-descriptions-item>
        <el-descriptions-item label="卖方">{{ currentTx.sellerName }}</el-descriptions-item>
        <el-descriptions-item label="交易时间" :span="2">{{ currentTx.timestamp }}</el-descriptions-item>
      </el-descriptions>
    </el-dialog>
  </section>
</template>

<style scoped>
.account-page { display: flex; flex-direction: column; gap: 14px; }
.section-card { border: 1px solid var(--border-color); border-radius: 12px; }
.card-title { font-size: 15px; font-weight: 700; }
.stats-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; }
.stat-card { text-align: center; padding: 4px 0; }
.stat-label { font-size: 13px; color: var(--text-secondary); margin-bottom: 6px; }
.stat-value { font-size: 24px; font-weight: 700; }
.stat-value.green { color: #67c23a; }
.stat-value.teal { color: #18a99a; }
.stat-value.blue { color: #409eff; }
.stat-sub { font-size: 12px; color: var(--text-secondary); margin-top: 4px; }
.pagination-row { margin-top: 14px; display: flex; justify-content: flex-end; }
</style>
