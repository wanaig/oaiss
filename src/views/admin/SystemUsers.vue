<script setup>
import { computed, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useCarbonStore } from '../../store/carbon'

const store = useCarbonStore()

const searchKeyword = ref('')
const filterCategory = ref('')
const page = ref(1)
const pageSize = ref(10)

const categoryOptions = ['企业用户', '审核员', '管理员']

const allUsers = ref([
  { id: 1, company: '华东能源集团', username: 'user1001', phone: '139-0001-1001', category: '企业用户', creditScore: 850, creditEnabled: true, companyId: 'C-1001' },
  { id: 2, company: '华南低碳科技', username: 'user1002', phone: '139-0002-1002', category: '企业用户', creditScore: 920, creditEnabled: true, companyId: 'C-1002' },
  { id: 3, company: '华北电网平台', username: 'user1003', phone: '139-0003-1003', category: '企业用户', creditScore: 780, creditEnabled: true, companyId: 'C-1003' },
  { id: 4, company: '蓝碳科技有限公司', username: 'user1004', phone: '139-0004-1004', category: '企业用户', creditScore: 700, creditEnabled: false, companyId: 'C-1004' },
  { id: 5, company: '审核员A', username: 'auditor1', phone: '139-0005-2001', category: '审核员', creditScore: 980, creditEnabled: true, companyId: '' },
  { id: 6, company: '审核员B', username: 'auditor2', phone: '139-0006-2002', category: '审核员', creditScore: 950, creditEnabled: true, companyId: '' },
  { id: 7, company: '系统管理者', username: 'admin1', phone: '139-0007-3001', category: '管理员', creditScore: 1000, creditEnabled: true, companyId: '' },
])

const filteredData = computed(() => {
  const keyword = searchKeyword.value.trim().toLowerCase()
  const category = filterCategory.value
  return allUsers.value.filter(u => {
    const kwMatch = !keyword || u.company.toLowerCase().includes(keyword) || u.username.toLowerCase().includes(keyword) || u.phone.includes(keyword)
    const catMatch = !category || u.category === category
    return kwMatch && catMatch
  })
})

const total = computed(() => filteredData.value.length)
const pagedData = computed(() => {
  const start = (page.value - 1) * pageSize.value
  return filteredData.value.slice(start, start + pageSize.value)
})

const dialogVisible = ref(false)
const dialogMode = ref('add')
const editId = ref(null)
const formRef = ref()
const formModel = reactive({
  company: '', username: '', phone: '', category: '', creditScore: null,
})

const formRules = {
  company: [{ required: true, message: '请输入企业名称', trigger: 'blur' }],
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  phone: [{ required: true, message: '请输入联系电话', trigger: 'blur' }],
  category: [{ required: true, message: '请选择用户类别', trigger: 'change' }],
  creditScore: [{ required: true, message: '请输入信用积分', trigger: 'blur' }],
}

const resetForm = () => {
  formModel.company = ''; formModel.username = ''; formModel.phone = ''
  formModel.category = ''; formModel.creditScore = null
}

const openAdd = () => { dialogMode.value = 'add'; editId.value = null; resetForm(); dialogVisible.value = true }
const openEdit = (row) => {
  dialogMode.value = 'edit'; editId.value = row.id
  formModel.company = row.company; formModel.username = row.username
  formModel.phone = row.phone; formModel.category = row.category
  formModel.creditScore = row.creditScore
  dialogVisible.value = true
}
const onCancel = () => { dialogVisible.value = false; ElMessage.info('已取消操作') }

const onSaveUser = async () => {
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) { ElMessage.warning('请完整填写用户信息'); return }
  if (dialogMode.value === 'add') {
    allUsers.value.unshift({ id: Date.now(), company: formModel.company.trim(), username: formModel.username.trim(), phone: formModel.phone.trim(), category: formModel.category, creditScore: formModel.creditScore, creditEnabled: true, companyId: '' })
    ElMessage.success('用户添加成功')
  } else {
    const u = allUsers.value.find(u => u.id === editId.value)
    if (u) Object.assign(u, { company: formModel.company.trim(), username: formModel.username.trim(), phone: formModel.phone.trim(), category: formModel.category, creditScore: formModel.creditScore })
    ElMessage.success('用户修改成功')
  }
  dialogVisible.value = false; page.value = 1
}

const onDelete = async (row) => {
  try {
    await ElMessageBox.confirm('确定要下线该用户吗？', '用户下线', { confirmButtonText: '确定', cancelButtonText: '取消', type: 'warning' })
    allUsers.value = allUsers.value.filter(u => u.id !== row.id)
    ElMessage.success('用户已下线')
  } catch { ElMessage.info('已取消操作') }
}

const toggleCredit = (row) => {
  const u = allUsers.value.find(u => u.id === row.id)
  if (u) {
    u.creditEnabled = !u.creditEnabled
    ElMessage.success(u.creditEnabled ? '信用积分已启用' : '信用积分已禁用')
  }
}

const tradeRecordVisible = ref(false)
const currentUser = ref(null)
const openTradeRecords = (row) => { currentUser.value = row; tradeRecordVisible.value = true }

const onQuery = () => { page.value = 1; ElMessage.success('查询完成') }
const onSizeChange = (s) => { pageSize.value = s; page.value = 1 }
const onPageChange = (p) => { page.value = p }
</script>

<template>
  <section class="system-users-page">
    <el-card class="section-card" shadow="never">
      <el-breadcrumb separator="/">
        <el-breadcrumb-item>系统管理</el-breadcrumb-item>
        <el-breadcrumb-item>用户管理</el-breadcrumb-item>
      </el-breadcrumb>
    </el-card>

    <el-card class="section-card" shadow="never">
      <div class="search-row">
        <el-select v-model="filterCategory" placeholder="全部用户类别" clearable style="width: 150px">
          <el-option v-for="item in categoryOptions" :key="item" :label="item" :value="item" />
        </el-select>
        <el-input v-model="searchKeyword" placeholder="搜索企业名称 / 用户名 / 电话" clearable style="width: 280px" />
        <el-button type="primary" @click="onQuery">查询</el-button>
        <el-button type="success" plain @click="openAdd">新增用户</el-button>
      </div>
    </el-card>

    <el-card class="section-card" shadow="never">
      <el-table :data="pagedData" border>
        <el-table-column label="序号" width="68" align="center">
          <template #default="scope">{{ (page - 1) * pageSize + scope.$index + 1 }}</template>
        </el-table-column>
        <el-table-column prop="company" label="企业名称" min-width="160" show-overflow-tooltip />
        <el-table-column prop="username" label="用户名" min-width="120" />
        <el-table-column prop="phone" label="联系电话" min-width="150" />
        <el-table-column prop="category" label="用户类别" min-width="110" align="center" />
        <el-table-column label="信用积分" min-width="100" align="center">
          <template #default="{ row }">
            <span :style="{ color: row.creditScore >= 800 ? '#67c23a' : row.creditScore >= 600 ? '#e6a23c' : '#f56c6c' }">{{ row.creditScore }}</span>
          </template>
        </el-table-column>
        <el-table-column label="信用启用" width="90" align="center">
          <template #default="{ row }">
            <el-switch :model-value="row.creditEnabled" @change="toggleCredit(row)" size="small" />
          </template>
        </el-table-column>
        <el-table-column label="操作" width="220" fixed="right">
          <template #default="{ row }">
            <el-button link type="success" size="small" @click="openEdit(row)">编辑</el-button>
            <el-button link type="primary" size="small" @click="openTradeRecords(row)">交易记录</el-button>
            <el-button link type="danger" size="small" @click="onDelete(row)">下线</el-button>
          </template>
        </el-table-column>
      </el-table>
      <div class="pagination-row">
        <el-pagination v-model:current-page="page" v-model:page-size="pageSize" background :page-sizes="[10, 20, 50]" layout="total, sizes, prev, pager, next, jumper" :total="total" @size-change="onSizeChange" @current-change="onPageChange" />
      </div>
    </el-card>

    <el-dialog v-model="dialogVisible" :title="dialogMode === 'add' ? '新增用户' : '编辑用户'" width="560px" destroy-on-close>
      <el-form ref="formRef" :model="formModel" :rules="formRules" label-width="100px">
        <el-form-item label="企业名称" prop="company">
          <el-input v-model="formModel.company" placeholder="请输入企业名称" />
        </el-form-item>
        <el-form-item label="用户名" prop="username">
          <el-input v-model="formModel.username" placeholder="请输入用户名" />
        </el-form-item>
        <el-form-item label="联系电话" prop="phone">
          <el-input v-model="formModel.phone" placeholder="请输入联系电话" />
        </el-form-item>
        <el-form-item label="用户类别" prop="category">
          <el-select v-model="formModel.category" placeholder="请选择" style="width: 100%">
            <el-option v-for="item in categoryOptions" :key="item" :label="item" :value="item" />
          </el-select>
        </el-form-item>
        <el-form-item label="信用积分" prop="creditScore">
          <el-input-number v-model="formModel.creditScore" :min="0" :max="1000" style="width: 100%" controls-position="right" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="onCancel">取消</el-button>
        <el-button type="primary" @click="onSaveUser">保存</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="tradeRecordVisible" :title="`交易记录 — ${currentUser ? currentUser.company : ''}`" width="760px" destroy-on-close>
      <el-table :data="currentUser && currentUser.companyId ? store.transactions.filter(t => t.buyerId === currentUser.companyId || t.sellerId === currentUser.companyId).slice(0, 10) : []" border>
        <el-table-column label="交易哈希" min-width="200" show-overflow-tooltip>
          <template #default="{ row }"><span style="font-family: monospace; font-size: 13px">{{ row.txHash.slice(0, 10) }}...{{ row.txHash.slice(-6) }}</span></template>
        </el-table-column>
        <el-table-column label="数量" width="100" align="right">
          <template #default="{ row }">{{ row.quantity.toLocaleString() }}</template>
        </el-table-column>
        <el-table-column label="金额" width="120" align="right">
          <template #default="{ row }">¥{{ row.totalAmount.toLocaleString() }}</template>
        </el-table-column>
        <el-table-column label="对手方" min-width="140">
          <template #default="{ row }">{{ row.buyerId === currentUser.companyId ? row.sellerName : row.buyerName }}</template>
        </el-table-column>
        <el-table-column prop="timestamp" label="时间" min-width="170" />
      </el-table>
    </el-dialog>
  </section>
</template>

<style scoped>
.system-users-page { display: flex; flex-direction: column; gap: 14px; }
.section-card { border: 1px solid var(--border-color); border-radius: 12px; }
.search-row { display: flex; gap: 10px; flex-wrap: wrap; }
.pagination-row { margin-top: 14px; display: flex; justify-content: flex-end; }
</style>
