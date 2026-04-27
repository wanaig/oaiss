<script setup>
import { computed, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'

const searchKeyword = ref('')
const selectedRows = ref([])

const page = ref(1)
const pageSize = ref(10)

const dialogVisible = ref(false)
const dialogMode = ref('add')
const editingId = ref(null)

const formRef = ref()
const formModel = reactive({
  identity: '',
  carbonCoin: '',
  emission: '',
})

const identityOptions = ['买方', '卖方']

const tableData = ref([
  {
    id: 1,
    paymentMethod: '银行转账',
    status: '进行中',
    updatedAt: '2026-04-22 09:21:43',
    updatedBy: 'U1001',
    identity: '买方',
    carbonCoin: 'CB-2026-A1',
    emission: '320.5',
  },
  {
    id: 2,
    paymentMethod: '数字钱包',
    status: '已完成',
    updatedAt: '2026-04-22 10:43:08',
    updatedBy: 'U1002',
    identity: '卖方',
    carbonCoin: 'CB-2026-B8',
    emission: '180.0',
  },
  {
    id: 3,
    paymentMethod: '平台托管',
    status: '待支付',
    updatedAt: '2026-04-23 14:15:20',
    updatedBy: 'U1088',
    identity: '买方',
    carbonCoin: 'CB-2026-C3',
    emission: '96.8',
  },
])

const formRules = {
  identity: [{ required: true, message: '请选择身份', trigger: 'change' }],
  carbonCoin: [{ required: true, message: '请输入碳币', trigger: 'blur' }],
  emission: [{ required: true, message: '请输入碳排放量', trigger: 'blur' }],
}

const filteredData = computed(() => {
  const key = searchKeyword.value.trim().toLowerCase()
  if (!key) {
    return tableData.value
  }

  return tableData.value.filter((row) => {
    const source = `${row.paymentMethod} ${row.status} ${row.updatedBy} ${row.identity} ${row.carbonCoin} ${row.emission}`.toLowerCase()
    return source.includes(key)
  })
})

const total = computed(() => filteredData.value.length)

const pagedData = computed(() => {
  const start = (page.value - 1) * pageSize.value
  const end = start + pageSize.value
  return filteredData.value.slice(start, end)
})

const onQuery = () => {
  page.value = 1
  ElMessage.success('查询完成')
}

const onSelectionChange = (rows) => {
  selectedRows.value = rows
}

const onSizeChange = (size) => {
  pageSize.value = size
  page.value = 1
}

const onPageChange = (current) => {
  page.value = current
}

const resetForm = () => {
  formModel.identity = ''
  formModel.carbonCoin = ''
  formModel.emission = ''
}

const openAddDialog = () => {
  dialogMode.value = 'add'
  editingId.value = null
  resetForm()
  dialogVisible.value = true
}

const openEditDialog = (row) => {
  dialogMode.value = 'edit'
  editingId.value = row.id
  formModel.identity = row.identity
  formModel.carbonCoin = row.carbonCoin
  formModel.emission = row.emission
  dialogVisible.value = true
}

const nowString = () => {
  const d = new Date()
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

const statusByIdentity = (identity) => (identity === '买方' ? '待支付' : '进行中')

const onSave = async () => {
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) {
    ElMessage.warning('请完整填写表单')
    return
  }

  const payload = {
    identity: formModel.identity,
    carbonCoin: formModel.carbonCoin.trim(),
    emission: formModel.emission.trim(),
    updatedAt: nowString(),
    updatedBy: '当前用户',
    paymentMethod: formModel.identity === '买方' ? '银行转账' : '平台托管',
    status: statusByIdentity(formModel.identity),
  }

  if (dialogMode.value === 'add') {
    tableData.value.unshift({
      id: Date.now(),
      ...payload,
    })
    ElMessage.success('新增成功')
  } else {
    const targetIndex = tableData.value.findIndex((item) => item.id === editingId.value)
    if (targetIndex > -1) {
      tableData.value[targetIndex] = {
        ...tableData.value[targetIndex],
        ...payload,
      }
      ElMessage.success('编辑成功')
    }
  }

  dialogVisible.value = false
  page.value = 1
}

const onCancelDialog = () => {
  dialogVisible.value = false
  ElMessage.info('已取消操作')
}

const onDelete = async (row) => {
  try {
    await ElMessageBox.confirm('确认删除该条双向拍卖信息吗？', '删除确认', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    })

    tableData.value = tableData.value.filter((item) => item.id !== row.id)
    selectedRows.value = selectedRows.value.filter((item) => item.id !== row.id)
    ElMessage.success('删除成功')

    if ((page.value - 1) * pageSize.value >= filteredData.value.length && page.value > 1) {
      page.value -= 1
    }
  } catch {
    ElMessage.info('已取消删除')
  }
}
</script>

<template>
  <section class="market-page">
    <el-card class="section-card" shadow="never">
      <el-breadcrumb separator="/">
        <el-breadcrumb-item>碳交易</el-breadcrumb-item>
        <el-breadcrumb-item>双向拍卖</el-breadcrumb-item>
      </el-breadcrumb>
    </el-card>

    <el-card class="section-card" shadow="never">
      <div class="search-row">
        <el-input
          v-model="searchKeyword"
          placeholder="请输入关键字（支付方式/状态/修改人/身份/碳币）"
          clearable
          class="search-input"
        />
        <el-button type="primary" @click="onQuery">查询</el-button>
        <el-button type="success" plain @click="openAddDialog">添加</el-button>
      </div>
    </el-card>

    <el-card class="section-card" shadow="never">
      <div class="table-tip">已选择 {{ selectedRows.length }} 条记录，支持单选或多选。</div>
      <el-table :data="pagedData" border @selection-change="onSelectionChange">
        <el-table-column type="selection" width="56" />
        <el-table-column label="序号" width="80">
          <template #default="scope">
            {{ (page - 1) * pageSize + scope.$index + 1 }}
          </template>
        </el-table-column>
        <el-table-column prop="paymentMethod" label="支付方式" min-width="120" />
        <el-table-column prop="status" label="状态" min-width="110">
          <template #default="{ row }">
            <el-tag :type="row.status === '已完成' ? 'success' : row.status === '待支付' ? 'warning' : 'info'">
              {{ row.status }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="updatedAt" label="修改时间" min-width="180" />
        <el-table-column prop="updatedBy" label="修改人" min-width="120" />
        <el-table-column label="操作" width="160" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="openEditDialog(row)">编辑</el-button>
            <el-button link type="danger" @click="onDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pager-row">
        <el-pagination
          v-model:current-page="page"
          v-model:page-size="pageSize"
          background
          :page-sizes="[10, 20, 50]"
          layout="total, sizes, prev, pager, next, jumper"
          :total="total"
          @size-change="onSizeChange"
          @current-change="onPageChange"
        />
      </div>
    </el-card>

    <el-dialog
      v-model="dialogVisible"
      :title="dialogMode === 'add' ? '添加双向拍卖信息' : '编辑双向拍卖信息'"
      width="560px"
      destroy-on-close
    >
      <el-form ref="formRef" :model="formModel" :rules="formRules" label-width="100px">
        <el-form-item label="身份" prop="identity">
          <el-select v-model="formModel.identity" placeholder="请选择身份" style="width: 100%">
            <el-option v-for="item in identityOptions" :key="item" :label="item" :value="item" />
          </el-select>
        </el-form-item>

        <el-form-item label="碳币" prop="carbonCoin">
          <el-input v-model="formModel.carbonCoin" placeholder="请输入碳币" />
        </el-form-item>

        <el-form-item label="碳排放量" prop="emission">
          <el-input v-model="formModel.emission" placeholder="请输入碳排放量" />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="onCancelDialog">取消</el-button>
        <el-button type="primary" @click="onSave">保存</el-button>
      </template>
    </el-dialog>
  </section>
</template>

<style scoped>
.market-page {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.section-card {
  border: 1px solid var(--border-color);
  border-radius: 12px;
}

.search-row {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.search-input {
  width: 420px;
  max-width: 100%;
}

.table-tip {
  margin-bottom: 10px;
  color: var(--text-secondary);
  font-size: 13px;
}

.pager-row {
  margin-top: 14px;
  display: flex;
  justify-content: flex-end;
}
</style>
