<script setup>
import { computed, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useCarbonStore } from '../../store/carbon'
import { ORDER_STATUS, ORDER_STATUS_MAP } from '../../config/constants'
import BlockchainHash from '../../components/BlockchainHash.vue'
import PageSaaSWrapper from '../../components/PageSaaSWrapper.vue'

const store = useCarbonStore()

const searchKeyword = ref(''); const filterStatus = ref('')
const page = ref(1); const pageSize = ref(10); const selectedRows = ref([])
const dialogVisible = ref(false); const dialogMode = ref('add'); const editingId = ref(null); const formRef = ref()
const formModel = reactive({ side: 'buy', enterpriseName: '', carbonQuota: null, price: null, appId: '', certificatePath: '', queryPassword: '', publicKey: '' })

const statusOptions = Object.values(ORDER_STATUS).map(v => ({ label: v, value: v }))

const filteredData = computed(() => {
  const kw = searchKeyword.value.trim().toLowerCase(); const st = filterStatus.value
  return store.p2pOrders.filter(o => (!st || o.status === st) && (!kw || (o.orderNo || '').toLowerCase().includes(kw) || (o.buyer || '').toLowerCase().includes(kw) || (o.seller || '').toLowerCase().includes(kw)))
})
const pagedData = computed(() => { const s = (page.value - 1) * pageSize.value; return filteredData.value.slice(s, s + pageSize.value) })

const kpi = computed(() => ({
  total: store.p2pOrders.length,
  pending: store.p2pOrders.filter(o => o.status === ORDER_STATUS.PENDING).length,
  completed: store.p2pOrders.filter(o => o.status === ORDER_STATUS.COMPLETED).length,
}))

const orderStatusInfo = (s) => ORDER_STATUS_MAP[Object.entries(ORDER_STATUS).find(([, v]) => v === s)?.[0]?.toLowerCase()] || { label: s, type: 'info' }

const resetForm = () => { Object.assign(formModel, { side: 'buy', enterpriseName: '', carbonQuota: null, price: null, appId: '', certificatePath: '', queryPassword: '', publicKey: '' }) }
const openAddDialog = () => { dialogMode.value = 'add'; editingId.value = null; resetForm(); dialogVisible.value = true }
const openEditDialog = (row) => { dialogMode.value = 'edit'; editingId.value = row.id; Object.assign(formModel, row); dialogVisible.value = true }

const onSave = async () => {
  if (!formModel.enterpriseName || !formModel.carbonQuota || !formModel.price) { ElMessage.warning('请完善信息'); return }
  if (dialogMode.value === 'add') { store.addP2POrder({ ...formModel }); ElMessage.success('创建成功') }
  else { store.updateP2POrder(editingId.value, formModel); ElMessage.success('修改成功') }
  dialogVisible.value = false; page.value = 1
}

const onDelete = (row) => { store.deleteP2POrder(row.id); ElMessage.success('已删除') }
const onConfirm = (row) => { store.updateP2POrderStatus(row.id, ORDER_STATUS.COMPLETED); ElMessage.success('已完成') }
const onCancelOrder = (row) => { store.updateP2POrderStatus(row.id, ORDER_STATUS.CANCELLED); ElMessage.success('已取消') }
</script>

<template>
  <PageSaaSWrapper title="P2P订单管理" description="点对点碳配额订单管理">
    <div class="kpi-row">
      <el-card shadow="never" class="kpi-card"><div class="kpi-label">订单总数</div><div class="kpi-value">{{ kpi.total }}</div></el-card>
      <el-card shadow="never" class="kpi-card"><div class="kpi-label">待成交</div><div class="kpi-value" style="color:var(--saas-warning)">{{ kpi.pending }}</div></el-card>
      <el-card shadow="never" class="kpi-card"><div class="kpi-label">已完成</div><div class="kpi-value" style="color:var(--saas-success)">{{ kpi.completed }}</div></el-card>
    </div>

    <el-card shadow="never">
      <div class="search-row">
        <el-select v-model="filterStatus" placeholder="全部状态" clearable style="width:140px"><el-option v-for="o in statusOptions" :key="o.value" :label="o.label" :value="o.value" /></el-select>
        <el-input v-model="searchKeyword" placeholder="搜索订单号/买卖方" clearable style="width:240px" />
        <el-button type="primary" @click="page = 1">查询</el-button>
        <el-button type="success" plain @click="openAddDialog">新增订单</el-button>
      </div>
    </el-card>

    <el-card shadow="never">
      <el-table :data="pagedData" border @selection-change="selectedRows = $event">
        <el-table-column type="selection" width="50" />
        <el-table-column label="序号" width="60" align="center"><template #default="s">{{ (page - 1) * pageSize + s.$index + 1 }}</template></el-table-column>
        <el-table-column prop="orderNo" label="订单号" min-width="150" />
        <el-table-column prop="buyer" label="买方" min-width="120" show-overflow-tooltip />
        <el-table-column prop="seller" label="卖方" min-width="120" show-overflow-tooltip />
        <el-table-column label="配额" width="90" align="right"><template #default="{ row }">{{ (row.carbonQuota || 0).toLocaleString() }}</template></el-table-column>
        <el-table-column label="单价" width="80" align="right"><template #default="{ row }">¥{{ (row.price || 0).toFixed(2) }}</template></el-table-column>
        <el-table-column label="金额" width="110" align="right"><template #default="{ row }">¥{{ (row.amount || 0).toLocaleString() }}</template></el-table-column>
        <el-table-column label="公钥" min-width="140"><template #default="{ row }"><BlockchainHash :hash="row.publicKey" :prefix-len="8" :suffix-len="8" /></template></el-table-column>
        <el-table-column label="状态" width="80" align="center"><template #default="{ row }"><el-tag :type="row.status === ORDER_STATUS.COMPLETED ? 'success' : row.status === ORDER_STATUS.CANCELLED ? 'info' : 'warning'" size="small">{{ row.status }}</el-tag></template></el-table-column>
        <el-table-column prop="createdAt" label="创建时间" min-width="150" />
        <el-table-column label="操作" width="180" fixed="right"><template #default="{ row }"><el-button v-if="row.status === ORDER_STATUS.PENDING" link type="success" size="small" @click="onConfirm(row)">完成</el-button><el-button v-if="row.status === ORDER_STATUS.PENDING" link type="warning" size="small" @click="onCancelOrder(row)">取消</el-button><el-button v-if="row.status === ORDER_STATUS.PENDING" link size="small" @click="openEditDialog(row)">编辑</el-button><el-button link type="danger" size="small" @click="onDelete(row)">删除</el-button></template></el-table-column>
      </el-table>
      <div class="pagination-wrap"><el-pagination v-model:current-page="page" v-model:page-size="pageSize" background :page-sizes="[10,20,50]" layout="total, sizes, prev, pager, next, jumper" :total="filteredData.length" /></div>
    </el-card>

    <el-dialog v-model="dialogVisible" :title="dialogMode === 'add' ? '新增订单' : '编辑订单'" width="560px" destroy-on-close>
      <el-form ref="formRef" :model="formModel" label-width="120px">
        <el-form-item label="方向"><el-radio-group v-model="formModel.side"><el-radio value="buy">买入</el-radio><el-radio value="sell">卖出</el-radio></el-radio-group></el-form-item>
        <el-form-item label="对方企业"><el-input v-model="formModel.enterpriseName" /></el-form-item>
        <el-form-item label="碳配额"><el-input-number v-model="formModel.carbonQuota" :min="0.1" :precision="2" style="width:100%" controls-position="right" /></el-form-item>
        <el-form-item label="单价"><el-input-number v-model="formModel.price" :min="0.01" :precision="2" style="width:100%" controls-position="right" /></el-form-item>
        <el-form-item label="App ID"><el-input v-model="formModel.appId" /></el-form-item>
        <el-form-item label="证书路径"><el-input v-model="formModel.certificatePath" /></el-form-item>
        <el-form-item label="查询密码"><el-input v-model="formModel.queryPassword" show-password /></el-form-item>
        <el-form-item label="公钥"><el-input v-model="formModel.publicKey" type="textarea" :rows="2" /></el-form-item>
      </el-form>
      <template #footer><el-button @click="dialogVisible = false">取消</el-button><el-button type="primary" @click="onSave">保存</el-button></template>
    </el-dialog>
  </PageSaaSWrapper>
</template>

<style scoped>
.kpi-row { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
.kpi-card { text-align: center; padding: 16px 0; }
.kpi-label { font-size: 13px; color: var(--saas-text-secondary); margin-bottom: 6px; }
.kpi-value { font-size: 28px; font-weight: 700; }
.search-row { display: flex; gap: 12px; flex-wrap: wrap; align-items: center; }
.pagination-wrap { margin-top: 16px; display: flex; justify-content: flex-end; }
</style>
