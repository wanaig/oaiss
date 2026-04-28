<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useCarbonStore } from '../../store/carbon'
import PageSaaSWrapper from '../../components/PageSaaSWrapper.vue'

const store = useCarbonStore()

const searchKeyword = ref(''); const filterCategory = ref('')
const page = ref(1); const pageSize = ref(10)
const categoryOptions = ['企业用户', '审核员', '管理员']
const dialogVisible = ref(false); const dialogMode = ref('add'); const editId = ref(null); const formRef = ref()
const formModel = reactive({ company: '', username: '', phone: '', category: '', creditScore: null })
const formRules = { company: [{ required: true, message: '必填', trigger: 'blur' }], username: [{ required: true, message: '必填', trigger: 'blur' }], phone: [{ required: true, message: '必填', trigger: 'blur' }], category: [{ required: true, message: '必选', trigger: 'change' }], creditScore: [{ required: true, message: '必填', trigger: 'blur' }] }
const tradeRecordVisible = ref(false); const currentUser = ref(null)

onMounted(() => { store.fetchAdminUsers() })

const filteredData = computed(() => {
  const kw = searchKeyword.value.trim().toLowerCase(); const cat = filterCategory.value
  return store.adminUsers.filter(u => {
    const kwMatch = !kw || (u.displayName || '').toLowerCase().includes(kw) || u.username.toLowerCase().includes(kw) || (u.phone || '').includes(kw)
    const catMatch = !cat || cat === (u.role === 'ENTERPRISE' ? '企业用户' : u.role === 'AUDITOR' ? '审核员' : '管理员')
    return kwMatch && catMatch
  })
})
const pagedData = computed(() => { const s = (page.value - 1) * pageSize.value; return filteredData.value.slice(s, s + pageSize.value) })

const kpi = computed(() => ({
  enterprise: store.adminUsers.filter(u => u.role === 'ENTERPRISE').length,
  auditor: store.adminUsers.filter(u => u.role === 'AUDITOR').length,
  admin: store.adminUsers.filter(u => u.role === 'ADMIN').length,
}))

const resetForm = () => { formModel.company = ''; formModel.username = ''; formModel.phone = ''; formModel.category = ''; formModel.creditScore = null }
const openAdd = () => { dialogMode.value = 'add'; editId.value = null; resetForm(); dialogVisible.value = true }
const openEdit = (row) => { dialogMode.value = 'edit'; editId.value = row.id; formModel.company = row.displayName || ''; formModel.username = row.username; formModel.phone = row.phone || ''; formModel.category = row.role === 'ENTERPRISE' ? '企业用户' : row.role === 'AUDITOR' ? '审核员' : '管理员'; formModel.creditScore = row.creditScore; dialogVisible.value = true }

const onSaveUser = async () => {
  if (!(await formRef.value.validate().catch(() => false))) { ElMessage.warning('请完善信息'); return }
  if (dialogMode.value === 'edit' && editId.value) { await store.updateAdminUser(editId.value, { displayName: formModel.company.trim(), username: formModel.username.trim(), phone: formModel.phone.trim(), creditScore: formModel.creditScore }); ElMessage.success('修改成功') }
  dialogVisible.value = false; page.value = 1
}
const onDelete = async (row) => {
  try { await ElMessageBox.confirm('确定删除该用户？', '确认', { confirmButtonText: '确定', cancelButtonText: '取消', type: 'warning' }); await store.deleteAdminUser(row.id); ElMessage.success('已删除') } catch { ElMessage.info('已取消') }
}
const toggleCredit = async (row) => {
  const newVal = !row.creditEnabled; await store.updateAdminUser(row.id, { creditEnabled: newVal }); ElMessage.success(newVal ? '信用已启用' : '信用已禁用')
}
const openTradeRecords = (row) => { currentUser.value = row; tradeRecordVisible.value = true }
</script>

<template>
  <PageSaaSWrapper title="用户管理" description="管理系统用户、角色和权限">
    <div class="kpi-row">
      <el-card shadow="never" class="kpi-card"><div class="kpi-label">企业用户</div><div class="kpi-value">{{ kpi.enterprise }}</div></el-card>
      <el-card shadow="never" class="kpi-card"><div class="kpi-label">审核员</div><div class="kpi-value" style="color:var(--saas-warning)">{{ kpi.auditor }}</div></el-card>
      <el-card shadow="never" class="kpi-card"><div class="kpi-label">管理员</div><div class="kpi-value" style="color:var(--saas-primary)">{{ kpi.admin }}</div></el-card>
    </div>

    <el-card shadow="never">
      <div class="search-row">
        <el-select v-model="filterCategory" placeholder="全部类别" clearable style="width:140px"><el-option v-for="item in categoryOptions" :key="item" :label="item" :value="item" /></el-select>
        <el-input v-model="searchKeyword" placeholder="搜索名称/用户名/电话" clearable style="width:240px" />
        <el-button type="primary" @click="page = 1">查询</el-button>
        <el-button type="success" plain @click="openAdd">新增用户</el-button>
      </div>
    </el-card>

    <el-card shadow="never">
      <el-table :data="pagedData" border>
        <el-table-column label="序号" width="60" align="center"><template #default="s">{{ (page - 1) * pageSize + s.$index + 1 }}</template></el-table-column>
        <el-table-column prop="displayName" label="显示名称" min-width="140" show-overflow-tooltip />
        <el-table-column prop="username" label="用户名" min-width="110" />
        <el-table-column prop="phone" label="电话" min-width="130" />
        <el-table-column label="角色" width="80" align="center"><template #default="{ row }">{{ row.role === 'ENTERPRISE' ? '企业' : row.role === 'AUDITOR' ? '审核' : '管理' }}</template></el-table-column>
        <el-table-column label="信用" width="80" align="center"><template #default="{ row }"><span :style="{ color: (row.creditScore || 0) >= 800 ? 'var(--saas-success)' : (row.creditScore || 0) >= 600 ? 'var(--saas-warning)' : 'var(--saas-danger)' }">{{ row.creditScore || 0 }}</span></template></el-table-column>
        <el-table-column label="信用启用" width="80" align="center"><template #default="{ row }"><el-switch :model-value="row.creditEnabled" @change="toggleCredit(row)" size="small" /></template></el-table-column>
        <el-table-column label="操作" width="200" fixed="right"><template #default="{ row }"><el-button link size="small" @click="openEdit(row)">编辑</el-button><el-button link type="primary" size="small" @click="openTradeRecords(row)">交易</el-button><el-button link type="danger" size="small" @click="onDelete(row)">删除</el-button></template></el-table-column>
      </el-table>
      <div class="pagination-wrap"><el-pagination v-model:current-page="page" v-model:page-size="pageSize" background :page-sizes="[10,20,50]" layout="total, sizes, prev, pager, next, jumper" :total="filteredData.length" /></div>
    </el-card>

    <el-dialog v-model="dialogVisible" :title="dialogMode === 'add' ? '新增用户' : '编辑用户'" width="520px" destroy-on-close>
      <el-form ref="formRef" :model="formModel" :rules="formRules" label-width="90px">
        <el-form-item label="显示名称" prop="company"><el-input v-model="formModel.company" /></el-form-item>
        <el-form-item label="用户名" prop="username"><el-input v-model="formModel.username" /></el-form-item>
        <el-form-item label="电话" prop="phone"><el-input v-model="formModel.phone" /></el-form-item>
        <el-form-item label="类别" prop="category"><el-select v-model="formModel.category" style="width:100%"><el-option v-for="o in categoryOptions" :key="o" :label="o" :value="o" /></el-select></el-form-item>
        <el-form-item label="信用分" prop="creditScore"><el-input-number v-model="formModel.creditScore" :min="0" :max="1000" style="width:100%" controls-position="right" /></el-form-item>
      </el-form>
      <template #footer><el-button @click="dialogVisible = false">取消</el-button><el-button type="primary" @click="onSaveUser">保存</el-button></template>
    </el-dialog>

    <el-dialog v-model="tradeRecordVisible" :title="`交易记录 — ${currentUser ? currentUser.displayName : ''}`" width="720px">
      <el-table :data="store.transactions.slice(0, 10)" border>
        <el-table-column label="交易哈希" min-width="180" show-overflow-tooltip><template #default="{ row }"><span style="font-family:monospace;font-size:12px">{{ (row.txHash || '').slice(0, 10) }}...{{ (row.txHash || '').slice(-6) }}</span></template></el-table-column>
        <el-table-column label="数量" width="80" align="right"><template #default="{ row }">{{ (row.quantity || 0).toLocaleString() }}</template></el-table-column>
        <el-table-column label="金额" width="110" align="right"><template #default="{ row }">¥{{ (row.totalAmount || 0).toLocaleString() }}</template></el-table-column>
        <el-table-column label="对手方" min-width="120"><template #default="{ row }">{{ row.buyerId === (currentUser?.companyId) ? row.sellerName : row.buyerName }}</template></el-table-column>
        <el-table-column prop="timestamp" label="时间" min-width="160" />
      </el-table>
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
