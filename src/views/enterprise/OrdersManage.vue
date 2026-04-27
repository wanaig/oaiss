<script setup>
import { computed, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'

const searchForm = reactive({
  orderNo: '',
  roleType: '',
  dateRange: [],
})

const roleOptions = ['买方', '卖方']
const statusOptions = ['待支付', '交易中', '已完成', '已取消']

const orderList = ref([
  {
    id: 1,
    orderNo: 'P2P-202604-0101',
    buyer: '华东绿色能源有限公司',
    seller: '华南碳资产交易中心',
    carbonCoin: 126.5,
    carbonEmission: 318.2,
    status: '交易中',
    createdAt: '2026-04-20 10:20:30',
    updatedAt: '2026-04-22 14:11:25',
  },
  {
    id: 2,
    orderNo: 'P2P-202604-0102',
    buyer: '北方清洁电力集团',
    seller: '蓝碳科技有限公司',
    carbonCoin: 88,
    carbonEmission: 206.4,
    status: '待支付',
    createdAt: '2026-04-21 08:31:10',
    updatedAt: '2026-04-21 08:31:10',
  },
  {
    id: 3,
    orderNo: 'P2P-202604-0103',
    buyer: '城市公用事业平台',
    seller: '东南生态企业联盟',
    carbonCoin: 152.3,
    carbonEmission: 402.7,
    status: '已完成',
    createdAt: '2026-04-19 15:09:43',
    updatedAt: '2026-04-23 09:43:58',
  },
])

const selectedRows = ref([])
const currentPage = ref(1)
const pageSize = ref(10)

const detailDialogVisible = ref(false)
const currentDetailOrder = ref(null)

const editDialogVisible = ref(false)
const editMode = ref('add')
const editingId = ref(null)
const editFormRef = ref()
const editForm = reactive({
  buyer: '',
  seller: '',
  carbonCoin: null,
  carbonEmission: null,
  status: '待支付',
})

const editRules = {
  buyer: [{ required: true, message: '请输入买方', trigger: 'blur' }],
  seller: [{ required: true, message: '请输入卖方', trigger: 'blur' }],
  carbonCoin: [{ required: true, message: '请输入碳币数量', trigger: 'blur' }],
  carbonEmission: [{ required: true, message: '请输入碳排放量', trigger: 'blur' }],
  status: [{ required: true, message: '请选择交易状态', trigger: 'change' }],
}

const inDateRange = (dateText, range) => {
  if (!Array.isArray(range) || range.length !== 2 || !range[0] || !range[1]) {
    return true
  }
  const current = new Date(dateText).getTime()
  const start = new Date(range[0]).getTime()
  const end = new Date(range[1]).getTime()
  return current >= start && current <= end
}

const filteredOrders = computed(() => {
  const orderNo = searchForm.orderNo.trim().toLowerCase()
  const role = searchForm.roleType
  const range = searchForm.dateRange

  return orderList.value.filter((item) => {
    const orderNoMatch = !orderNo || item.orderNo.toLowerCase().includes(orderNo)
    const roleMatch =
      !role ||
      (role === '买方' && item.buyer) ||
      (role === '卖方' && item.seller)
    const rangeMatch = inDateRange(item.createdAt, range)
    return orderNoMatch && roleMatch && rangeMatch
  })
})

const total = computed(() => filteredOrders.value.length)

const pagedOrders = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return filteredOrders.value.slice(start, end)
})

const nowText = () => {
  const d = new Date()
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

const onQuery = () => {
  currentPage.value = 1
  ElMessage.success('查询完成')
}

const onSelectionChange = (rows) => {
  selectedRows.value = rows
}

const onSizeChange = (size) => {
  pageSize.value = size
  currentPage.value = 1
}

const onCurrentChange = (page) => {
  currentPage.value = page
}

const openDetail = (row) => {
  currentDetailOrder.value = row
  detailDialogVisible.value = true
}

const resetEditForm = () => {
  editForm.buyer = ''
  editForm.seller = ''
  editForm.carbonCoin = null
  editForm.carbonEmission = null
  editForm.status = '待支付'
}

const openAddDialog = () => {
  editMode.value = 'add'
  editingId.value = null
  resetEditForm()
  editDialogVisible.value = true
}

const openEditDialog = (row) => {
  editMode.value = 'edit'
  editingId.value = row.id
  editForm.buyer = row.buyer
  editForm.seller = row.seller
  editForm.carbonCoin = row.carbonCoin
  editForm.carbonEmission = row.carbonEmission
  editForm.status = row.status
  editDialogVisible.value = true
}

const onCancelEdit = () => {
  editDialogVisible.value = false
  ElMessage.info('已取消操作')
}

const onSaveEdit = async () => {
  const valid = await editFormRef.value.validate().catch(() => false)
  if (!valid) {
    ElMessage.warning('请完善订单信息')
    return
  }

  const payload = {
    buyer: editForm.buyer.trim(),
    seller: editForm.seller.trim(),
    carbonCoin: Number(editForm.carbonCoin),
    carbonEmission: Number(editForm.carbonEmission),
    status: editForm.status,
    updatedAt: nowText(),
  }

  if (editMode.value === 'add') {
    orderList.value.unshift({
      id: Date.now(),
      orderNo: `P2P-${Date.now()}`,
      createdAt: nowText(),
      ...payload,
    })
    ElMessage.success('订单新增成功')
  } else {
    const idx = orderList.value.findIndex((item) => item.id === editingId.value)
    if (idx > -1) {
      orderList.value[idx] = {
        ...orderList.value[idx],
        ...payload,
      }
      ElMessage.success('订单修改成功')
    }
  }

  editDialogVisible.value = false
  currentPage.value = 1
}

const onDeleteOrder = async (row) => {
  try {
    await ElMessageBox.confirm('确定要删除该订单吗？', '删除订单', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    })

    orderList.value = orderList.value.filter((item) => item.id !== row.id)
    selectedRows.value = selectedRows.value.filter((item) => item.id !== row.id)
    ElMessage.success('订单删除成功')
  } catch {
    ElMessage.info('已取消删除')
  }
}
</script>

<template>
  <section class="orders-page">
    <el-card class="section-card" shadow="never">
      <el-breadcrumb separator="/">
        <el-breadcrumb-item :to="'/enterprise/carbon/upload'">首页</el-breadcrumb-item>
        <el-breadcrumb-item>P2P订单管理</el-breadcrumb-item>
        <el-breadcrumb-item>订单管理</el-breadcrumb-item>
      </el-breadcrumb>
    </el-card>

    <el-card class="section-card" shadow="never">
      <el-form :inline="true" class="search-form">
        <el-form-item label="订单编号">
          <el-input v-model="searchForm.orderNo" placeholder="请输入订单编号" clearable />
        </el-form-item>

        <el-form-item label="身份">
          <el-select v-model="searchForm.roleType" placeholder="买方/卖方" clearable style="width: 130px">
            <el-option v-for="item in roleOptions" :key="item" :label="item" :value="item" />
          </el-select>
        </el-form-item>

        <el-form-item label="日期范围">
          <el-date-picker
            v-model="searchForm.dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            value-format="YYYY-MM-DD"
          />
        </el-form-item>

        <el-form-item>
          <el-button type="primary" @click="onQuery">查询</el-button>
          <el-button type="success" plain @click="openAddDialog">添加</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card class="section-card" shadow="never">
      <div class="table-tip">已选择 {{ selectedRows.length }} 条记录，支持单选或多选。</div>
      <el-table :data="pagedOrders" border @selection-change="onSelectionChange">
        <el-table-column type="selection" width="56" />
        <el-table-column label="序号" width="80">
          <template #default="scope">
            {{ (currentPage - 1) * pageSize + scope.$index + 1 }}
          </template>
        </el-table-column>
        <el-table-column prop="orderNo" label="订单编号" min-width="160" />
        <el-table-column prop="buyer" label="买方" min-width="160" show-overflow-tooltip />
        <el-table-column prop="seller" label="卖方" min-width="160" show-overflow-tooltip />
        <el-table-column prop="carbonCoin" label="碳币数量" min-width="100" />
        <el-table-column prop="carbonEmission" label="碳排放量" min-width="110" />
        <el-table-column prop="status" label="交易状态" min-width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === '已完成' ? 'success' : row.status === '已取消' ? 'danger' : 'warning'">
              {{ row.status }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="创建时间" min-width="170" />
        <el-table-column prop="updatedAt" label="修改时间" min-width="170" />
        <el-table-column label="操作" width="220" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="openDetail(row)">查看详情</el-button>
            <el-button link type="success" @click="openEditDialog(row)">修改</el-button>
            <el-button link type="danger" @click="onDeleteOrder(row)">删除订单</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-row">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          background
          :page-sizes="[10, 20, 50]"
          layout="total, sizes, prev, pager, next, jumper"
          :total="total"
          @size-change="onSizeChange"
          @current-change="onCurrentChange"
        />
      </div>
    </el-card>

    <el-dialog v-model="detailDialogVisible" title="订单详情" width="700px">
      <el-descriptions :column="2" border v-if="currentDetailOrder">
        <el-descriptions-item label="订单编号">{{ currentDetailOrder.orderNo }}</el-descriptions-item>
        <el-descriptions-item label="交易状态">{{ currentDetailOrder.status }}</el-descriptions-item>
        <el-descriptions-item label="买方信息">{{ currentDetailOrder.buyer }}</el-descriptions-item>
        <el-descriptions-item label="卖方信息">{{ currentDetailOrder.seller }}</el-descriptions-item>
        <el-descriptions-item label="碳币数量">{{ currentDetailOrder.carbonCoin }}</el-descriptions-item>
        <el-descriptions-item label="碳排放量">{{ currentDetailOrder.carbonEmission }}</el-descriptions-item>
        <el-descriptions-item label="创建时间">{{ currentDetailOrder.createdAt }}</el-descriptions-item>
        <el-descriptions-item label="修改时间">{{ currentDetailOrder.updatedAt }}</el-descriptions-item>
      </el-descriptions>
    </el-dialog>

    <el-dialog
      v-model="editDialogVisible"
      :title="editMode === 'add' ? '新增订单' : '编辑订单'"
      width="620px"
      destroy-on-close
    >
      <el-form ref="editFormRef" :model="editForm" :rules="editRules" label-width="110px">
        <el-form-item label="买方" prop="buyer">
          <el-input v-model="editForm.buyer" placeholder="请输入买方" />
        </el-form-item>

        <el-form-item label="卖方" prop="seller">
          <el-input v-model="editForm.seller" placeholder="请输入卖方" />
        </el-form-item>

        <el-form-item label="碳币数量" prop="carbonCoin">
          <el-input-number v-model="editForm.carbonCoin" :min="0" :precision="2" style="width: 100%" />
        </el-form-item>

        <el-form-item label="碳排放量" prop="carbonEmission">
          <el-input-number v-model="editForm.carbonEmission" :min="0" :precision="2" style="width: 100%" />
        </el-form-item>

        <el-form-item label="交易状态" prop="status">
          <el-select v-model="editForm.status" style="width: 100%">
            <el-option v-for="item in statusOptions" :key="item" :label="item" :value="item" />
          </el-select>
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="onCancelEdit">取消</el-button>
        <el-button type="primary" @click="onSaveEdit">保存</el-button>
      </template>
    </el-dialog>
  </section>
</template>

<style scoped>
.orders-page {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.section-card {
  border: 1px solid var(--border-color);
  border-radius: 12px;
}

.search-form {
  display: flex;
  flex-wrap: wrap;
}

.table-tip {
  margin-bottom: 10px;
  color: var(--text-secondary);
  font-size: 13px;
}

.pagination-row {
  margin-top: 14px;
  display: flex;
  justify-content: flex-end;
}
</style>
