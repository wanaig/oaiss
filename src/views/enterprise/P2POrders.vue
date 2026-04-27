<script setup>
import { computed, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useCarbonStore } from '../../store/carbon'
import { ORDER_STATUS } from '../../config/constants'
import BlockchainHash from '../../components/BlockchainHash.vue'

const store = useCarbonStore()

const searchForm = reactive({ keyword: '', status: '' })
const page = ref(1)
const pageSize = ref(10)
const selectedRows = ref([])

const statusOptions = Object.values(ORDER_STATUS)

const filteredData = computed(() => {
  const keyword = searchForm.keyword.trim().toLowerCase()
  const status = searchForm.status
  return store.p2pOrders.filter((o) => {
    const keywordMatch = !keyword || o.orderNo.toLowerCase().includes(keyword) || o.buyer.toLowerCase().includes(keyword) || o.seller.toLowerCase().includes(keyword) || o.appId.toLowerCase().includes(keyword)
    const statusMatch = !status || o.status === status
    return keywordMatch && statusMatch
  })
})

const total = computed(() => filteredData.value.length)
const pagedData = computed(() => {
  const start = (page.value - 1) * pageSize.value
  return filteredData.value.slice(start, start + pageSize.value)
})

const dialogMode = ref('add')
const editId = ref(null)
const dialogVisible = ref(false)
const dialogRef = ref()
const dialogForm = reactive({
  side: 'buy',
  enterpriseName: '',
  carbonQuota: null,
  price: null,
  appId: '',
  certificatePath: '',
  queryPassword: '',
  publicKey: '',
})

const dialogRules = {
  enterpriseName: [{ required: true, message: '请输入交易对手名称', trigger: 'blur' }],
  carbonQuota: [{ required: true, message: '请输入碳配额数量', trigger: 'blur' }],
  price: [{ required: true, message: '请输入交易价格', trigger: 'blur' }],
  publicKey: [{ required: true, message: '请输入区块链交易公钥', trigger: 'blur' }],
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

const orderAmount = computed(() => {
  if (dialogForm.carbonQuota && dialogForm.price) return (dialogForm.carbonQuota * dialogForm.price).toLocaleString()
  return '-'
})

const resetDialog = () => {
  dialogForm.side = 'buy'
  dialogForm.enterpriseName = ''
  dialogForm.carbonQuota = null
  dialogForm.price = null
  dialogForm.appId = ''
  dialogForm.certificatePath = ''
  dialogForm.queryPassword = ''
  dialogForm.publicKey = ''
}

const openAdd = () => {
  dialogMode.value = 'add'
  editId.value = null
  resetDialog()
  dialogVisible.value = true
}

const onCancel = () => { dialogVisible.value = false; ElMessage.info('已取消操作') }

const onSave = async () => {
  const valid = await dialogRef.value.validate().catch(() => false)
  if (!valid) { ElMessage.warning('请完善订单信息'); return }

  if (dialogMode.value === 'add') {
    store.addP2POrder({
      side: dialogForm.side,
      enterpriseName: dialogForm.enterpriseName.trim(),
      carbonQuota: dialogForm.carbonQuota,
      price: dialogForm.price,
      appId: dialogForm.appId || 'APP-ECO-NEW',
      certificatePath: dialogForm.certificatePath,
      queryPassword: dialogForm.queryPassword,
      publicKey: dialogForm.publicKey,
    })
    ElMessage.success('P2P订单创建成功')
  } else {
    store.updateP2POrder(editId.value, {
      buyer: dialogForm.side === 'buy' ? dialogForm.enterpriseName : store.currentAccount.companyName,
      seller: dialogForm.side === 'sell' ? dialogForm.enterpriseName : store.currentAccount.companyName,
      carbonQuota: dialogForm.carbonQuota,
      price: dialogForm.price,
      certificatePath: dialogForm.certificatePath,
      publicKey: dialogForm.publicKey,
    })
    ElMessage.success('订单修改成功')
  }

  dialogVisible.value = false
  page.value = 1
}

const onDelete = async (row) => {
  try {
    await ElMessageBox.confirm('确认删除该订单吗？', '删除确认', { confirmButtonText: '确定', cancelButtonText: '取消', type: 'warning' })
    store.deleteP2POrder(row.id)
    selectedRows.value = selectedRows.value.filter(r => r.id !== row.id)
    ElMessage.success('订单已删除')
  } catch { ElMessage.info('已取消删除') }
}

const onConfirmComplete = async (row) => {
  try {
    await ElMessageBox.confirm('确认该订单已完成交易？系统将更新双方账户余额并生成链上交易记录。', '完成确认', { confirmButtonText: '确定', cancelButtonText: '取消', type: 'success' })
    store.updateP2POrderStatus(row.id, ORDER_STATUS.COMPLETED)
    ElMessage.success('订单已完成，区块链交易记录已生成')
  } catch { ElMessage.info('已取消操作') }
}

const onCancelOrder = async (row) => {
  try {
    await ElMessageBox.confirm('确认取消该订单？', '取消确认', { confirmButtonText: '确定', cancelButtonText: '取消', type: 'warning' })
    store.updateP2POrderStatus(row.id, ORDER_STATUS.CANCELLED)
    ElMessage.success('订单已取消')
  } catch { ElMessage.info('已取消操作') }
}

const onQuery = () => { page.value = 1; ElMessage.success('查询完成') }
const onSelectionChange = (rows) => { selectedRows.value = rows }
const onSizeChange = (s) => { pageSize.value = s; page.value = 1 }
const onPageChange = (p) => { page.value = p }
</script>

<template>
  <section class="p2p-orders-page">
    <el-card class="section-card" shadow="never">
      <el-breadcrumb separator="/">
        <el-breadcrumb-item :to="{ path: '/enterprise/carbon/upload' }">首页</el-breadcrumb-item>
        <el-breadcrumb-item>P2P订单管理</el-breadcrumb-item>
        <el-breadcrumb-item>订单管理</el-breadcrumb-item>
      </el-breadcrumb>
    </el-card>

    <el-card class="section-card" shadow="never">
      <div class="search-row">
        <el-input v-model="searchForm.keyword" placeholder="搜索订单号 / 买卖方 / 应用ID" clearable style="width: 320px" />
        <el-select v-model="searchForm.status" placeholder="交易状态" clearable style="width: 140px">
          <el-option v-for="item in statusOptions" :key="item" :label="item" :value="item" />
        </el-select>
        <el-button type="primary" @click="onQuery">查询</el-button>
        <el-button type="success" plain @click="openAdd">创建P2P订单</el-button>
      </div>
    </el-card>

    <el-card class="section-card" shadow="never">
      <div class="table-tip">已选择 {{ selectedRows.length }} 条记录</div>
      <el-table :data="pagedData" border @selection-change="onSelectionChange">
        <el-table-column type="selection" width="56" />
        <el-table-column label="序号" width="68" align="center">
          <template #default="scope">{{ (page - 1) * pageSize + scope.$index + 1 }}</template>
        </el-table-column>
        <el-table-column prop="orderNo" label="订单编号" min-width="170" />
        <el-table-column prop="buyer" label="买方" min-width="140" show-overflow-tooltip />
        <el-table-column prop="seller" label="卖方" min-width="140" show-overflow-tooltip />
        <el-table-column label="碳配额" width="100" align="right">
          <template #default="{ row }">{{ row.carbonQuota.toLocaleString() }}</template>
        </el-table-column>
        <el-table-column label="单价" width="90" align="right">
          <template #default="{ row }">¥{{ row.price.toFixed(2) }}</template>
        </el-table-column>
        <el-table-column label="金额" width="120" align="right">
          <template #default="{ row }">¥{{ row.amount.toLocaleString() }}</template>
        </el-table-column>
        <el-table-column label="公钥" min-width="180" show-overflow-tooltip>
          <template #default="{ row }"><BlockchainHash :hash="row.publicKey" :show-copy="false" /></template>
        </el-table-column>
        <el-table-column label="状态" width="90" align="center">
          <template #default="{ row }">
            <el-tag :type="statusTag(row.status)" size="small">{{ row.status }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="创建时间" min-width="170" />
        <el-table-column label="操作" width="220" fixed="right">
          <template #default="{ row }">
            <el-button link type="success" size="small" @click="onConfirmComplete(row)" v-if="row.status === ORDER_STATUS.PENDING">确认完成</el-button>
            <el-button link type="danger" size="small" @click="onCancelOrder(row)" v-if="row.status === ORDER_STATUS.PENDING">取消</el-button>
            <el-button link type="danger" size="small" @click="onDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-row">
        <el-pagination v-model:current-page="page" v-model:page-size="pageSize" background :page-sizes="[10, 20, 50]" layout="total, sizes, prev, pager, next, jumper" :total="total" @size-change="onSizeChange" @current-change="onPageChange" />
      </div>
    </el-card>

    <el-dialog v-model="dialogVisible" :title="dialogMode === 'add' ? '创建P2P交易订单' : '编辑P2P交易订单'" width="620px" destroy-on-close>
      <el-form ref="dialogRef" :model="dialogForm" :rules="dialogRules" label-width="160px">
        <el-form-item label="交易方向" prop="side">
          <el-radio-group v-model="dialogForm.side">
            <el-radio-button value="buy">买入碳配额</el-radio-button>
            <el-radio-button value="sell">卖出碳配额</el-radio-button>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="交易对手名称" prop="enterpriseName">
          <el-input v-model="dialogForm.enterpriseName" placeholder="请输入交易对手企业名称" />
        </el-form-item>
        <el-form-item label="碳配额数量" prop="carbonQuota">
          <el-input-number v-model="dialogForm.carbonQuota" :min="1" :precision="2" style="width: 100%" controls-position="right" />
        </el-form-item>
        <el-form-item label="交易价格（元/单位）" prop="price">
          <el-input-number v-model="dialogForm.price" :min="0.01" :precision="2" style="width: 100%" controls-position="right" />
        </el-form-item>
        <el-form-item label="预估金额">
          <span class="estimate-amount">¥{{ orderAmount }}</span>
        </el-form-item>
        <el-form-item label="应用ID" prop="appId">
          <el-input v-model="dialogForm.appId" placeholder="如：APP-ECO-1001" />
        </el-form-item>
        <el-form-item label="碳核算证书路径" prop="certificatePath">
          <el-input v-model="dialogForm.certificatePath" placeholder="/cert/xxx.pfx" />
        </el-form-item>
        <el-form-item label="碳核算查询密码" prop="queryPassword">
          <el-input v-model="dialogForm.queryPassword" show-password placeholder="请输入查询密码" />
        </el-form-item>
        <el-form-item label="区块链交易公钥" prop="publicKey">
          <el-input v-model="dialogForm.publicKey" type="textarea" :rows="3" placeholder="请输入区块链交易公钥" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="onCancel">取消</el-button>
        <el-button type="primary" @click="onSave">保存</el-button>
      </template>
    </el-dialog>
  </section>
</template>

<style scoped>
.p2p-orders-page { display: flex; flex-direction: column; gap: 14px; }
.section-card { border: 1px solid var(--border-color); border-radius: 12px; }
.search-row { display: flex; gap: 10px; flex-wrap: wrap; }
.table-tip { margin-bottom: 10px; color: var(--text-secondary); font-size: 13px; }
.pagination-row { margin-top: 14px; display: flex; justify-content: flex-end; }
.estimate-amount { font-size: 18px; font-weight: 700; color: var(--text-primary); }
</style>
