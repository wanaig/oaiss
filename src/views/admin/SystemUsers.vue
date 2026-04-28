<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useCarbonStore } from '../../store/carbon'
import PageSaaSWrapper from '../../components/PageSaaSWrapper.vue'

const store = useCarbonStore()

const searchKeyword = ref('')
const filterRole = ref('')
const page = ref(1)
const pageSize = ref(10)

const roleOptions = [
  { label: '企业用户', value: 'enterprise' },
  { label: '审核员', value: 'auditor' },
  { label: '管理员', value: 'admin' },
]

const dialogVisible = ref(false)
const dialogMode = ref('add')
const editId = ref(null)
const formRef = ref()

const formModel = reactive({
  username: '',
  password: '',
  displayName: '',
  phone: '',
  role: '',
  creditScore: null,
})

const formRules = computed(() => {
  if (dialogMode.value === 'add') {
    return {
      username: [{ required: true, message: '必填', trigger: 'blur' }],
      password: [{ required: true, message: '必填', trigger: 'blur' }],
      displayName: [{ required: true, message: '必填', trigger: 'blur' }],
      phone: [{ required: true, message: '必填', trigger: 'blur' }],
      role: [{ required: true, message: '必选', trigger: 'change' }],
    }
  }
  return {
    displayName: [{ required: true, message: '必填', trigger: 'blur' }],
    phone: [{ required: true, message: '必填', trigger: 'blur' }],
  }
})

const assetsVisible = ref(false)
const currentUser = ref(null)
const userAssets = ref(null)

const roleMap = { enterprise: '企业', auditor: '审核', admin: '管理' }

const stats = computed(() => {
  const s = store.userStats
  if (!s) return { enterprise: 0, auditor: 0, admin: 0 }
  return {
    enterprise: s.enterpriseCount ?? 0,
    auditor: s.auditorCount ?? 0,
    admin: s.adminCount ?? 0,
  }
})

const buildParams = () => {
  const params = { page: page.value, size: pageSize.value }
  const kw = searchKeyword.value.trim()
  if (kw) params.keyword = kw
  if (filterRole.value) params.role = filterRole.value
  return params
}

const fetchData = async () => {
  await store.fetchAdminUsers(buildParams())
}

onMounted(() => {
  fetchData()
  store.fetchUserStats()
})

const onSearch = () => {
  page.value = 1
  fetchData()
}

const onPageChange = (p) => {
  page.value = p
  fetchData()
}

const onSizeChange = (s) => {
  pageSize.value = s
  page.value = 1
  fetchData()
}

const resetForm = () => {
  formModel.username = ''
  formModel.password = ''
  formModel.displayName = ''
  formModel.phone = ''
  formModel.role = ''
  formModel.creditScore = null
}

const openAdd = () => {
  dialogMode.value = 'add'
  editId.value = null
  resetForm()
  dialogVisible.value = true
}

const openEdit = (row) => {
  dialogMode.value = 'edit'
  editId.value = row.id
  formModel.displayName = row.displayName || ''
  formModel.username = row.username
  formModel.phone = row.phone || ''
  formModel.role = row.role || ''
  formModel.creditScore = row.creditScore
  dialogVisible.value = true
}

const onSaveUser = async () => {
  if (!(await formRef.value.validate().catch(() => false))) {
    ElMessage.warning('请完善信息')
    return
  }
  try {
    if (dialogMode.value === 'add') {
      await store.addAdminUser({
        username: formModel.username.trim(),
        password: formModel.password,
        displayName: formModel.displayName.trim(),
        phone: formModel.phone.trim(),
        role: formModel.role,
      })
      ElMessage.success('新增成功')
    } else {
      await store.updateAdminUser(editId.value, {
        displayName: formModel.displayName.trim(),
        phone: formModel.phone.trim(),
        creditScore: formModel.creditScore,
      })
      ElMessage.success('修改成功')
    }
    dialogVisible.value = false
    page.value = 1
    await fetchData()
    await store.fetchUserStats()
  } catch {
    ElMessage.error('操作失败，请重试')
  }
}

const onDelete = async (row) => {
  try {
    await ElMessageBox.confirm('确定删除该用户？', '确认', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    })
    await store.deleteAdminUser(row.id)
    ElMessage.success('已删除')
    await fetchData()
    await store.fetchUserStats()
  } catch {
    ElMessage.info('已取消')
  }
}

const toggleCredit = async (row) => {
  const newVal = !row.creditEnabled
  try {
    await store.toggleUserCredit(row.id, newVal)
    row.creditEnabled = newVal
    ElMessage.success(newVal ? '信用已启用' : '信用已禁用')
  } catch {
    ElMessage.error('操作失败，请检查后端服务')
  }
}

const openAssets = async (row) => {
  currentUser.value = row
  userAssets.value = null
  assetsVisible.value = true
  const data = await store.fetchUserAssets(row.id)
  if (data) {
    userAssets.value = data
  }
}
</script>

<template>
  <PageSaaSWrapper title="用户管理" description="管理系统用户、角色和权限">
    <div class="kpi-row">
      <el-card shadow="never" class="kpi-card">
        <div class="kpi-label">企业用户</div>
        <div class="kpi-value">{{ stats.enterprise }}</div>
      </el-card>
      <el-card shadow="never" class="kpi-card">
        <div class="kpi-label">审核员</div>
        <div class="kpi-value" style="color:var(--saas-warning)">{{ stats.auditor }}</div>
      </el-card>
      <el-card shadow="never" class="kpi-card">
        <div class="kpi-label">管理员</div>
        <div class="kpi-value" style="color:var(--saas-primary)">{{ stats.admin }}</div>
      </el-card>
    </div>

    <el-card shadow="never">
      <div class="search-row">
        <el-select v-model="filterRole" placeholder="全部角色" clearable style="width:140px">
          <el-option v-for="item in roleOptions" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
        <el-input v-model="searchKeyword" placeholder="搜索名称/用户名/电话" clearable style="width:240px" @keyup.enter="onSearch" />
        <el-button type="primary" @click="onSearch">查询</el-button>
        <el-button type="success" plain @click="openAdd">新增用户</el-button>
      </div>
    </el-card>

    <el-card shadow="never">
      <el-table :data="store.adminUsers" border>
        <el-table-column label="序号" width="60" align="center">
          <template #default="s">{{ (page - 1) * pageSize + s.$index + 1 }}</template>
        </el-table-column>
        <el-table-column prop="displayName" label="显示名称" min-width="140" show-overflow-tooltip />
        <el-table-column prop="username" label="用户名" min-width="110" />
        <el-table-column prop="phone" label="电话" min-width="130" />
        <el-table-column label="角色" width="80" align="center">
          <template #default="{ row }">{{ roleMap[row.role] || row.role }}</template>
        </el-table-column>
        <el-table-column label="信用" width="80" align="center">
          <template #default="{ row }">
            <span :style="{ color: (row.creditScore || 0) >= 800 ? 'var(--saas-success)' : (row.creditScore || 0) >= 600 ? 'var(--saas-warning)' : 'var(--saas-danger)' }">{{ row.creditScore ?? 0 }}</span>
          </template>
        </el-table-column>
        <el-table-column label="信用启用" width="80" align="center">
          <template #default="{ row }">
            <el-switch :model-value="row.creditEnabled" @change="toggleCredit(row)" size="small" />
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button link size="small" @click="openEdit(row)">编辑</el-button>
            <el-button link type="primary" size="small" @click="openAssets(row)">交易</el-button>
            <el-button link type="danger" size="small" @click="onDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
      <div class="pagination-wrap">
        <el-pagination
          :current-page="page"
          :page-size="pageSize"
          background
          :page-sizes="[10,20,50]"
          layout="total, sizes, prev, pager, next, jumper"
          :total="store.userTotal"
          @update:current-page="onPageChange"
          @update:page-size="onSizeChange"
        />
      </div>
    </el-card>

    <el-dialog v-model="dialogVisible" :title="dialogMode === 'add' ? '新增用户' : '编辑用户'" width="520px" destroy-on-close>
      <el-form ref="formRef" :model="formModel" :rules="formRules" label-width="90px">
        <el-form-item label="用户名" prop="username">
          <el-input v-model="formModel.username" :disabled="dialogMode === 'edit'" />
        </el-form-item>
        <el-form-item v-if="dialogMode === 'add'" label="密码" prop="password">
          <el-input v-model="formModel.password" type="password" show-password />
        </el-form-item>
        <el-form-item label="显示名称" prop="displayName">
          <el-input v-model="formModel.displayName" />
        </el-form-item>
        <el-form-item label="电话" prop="phone">
          <el-input v-model="formModel.phone" />
        </el-form-item>
        <el-form-item label="角色" prop="role">
          <el-select v-model="formModel.role" style="width:100%" :disabled="dialogMode === 'edit'">
            <el-option v-for="o in roleOptions" :key="o.value" :label="o.label" :value="o.value" />
          </el-select>
        </el-form-item>
        <el-form-item v-if="dialogMode === 'edit'" label="信用分" prop="creditScore">
          <el-input-number v-model="formModel.creditScore" :min="0" :max="1000" style="width:100%" controls-position="right" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="onSaveUser">保存</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="assetsVisible" :title="`资产信息 — ${currentUser ? currentUser.displayName : ''}`" width="480px">
      <div v-if="userAssets" class="assets-grid">
        <el-card shadow="never">
          <div class="asset-label">资金余额</div>
          <div class="asset-value">¥{{ (userAssets.funds ?? 0).toLocaleString() }}</div>
        </el-card>
        <el-card shadow="never">
          <div class="asset-label">碳配额</div>
          <div class="asset-value">{{ (userAssets.carbonQuota ?? 0).toLocaleString() }} t</div>
        </el-card>
      </div>
      <div v-else class="assets-loading">加载中...</div>
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
.assets-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
.assets-grid .el-card { text-align: center; padding: 20px 0; }
.asset-label { font-size: 13px; color: var(--saas-text-secondary); margin-bottom: 8px; }
.asset-value { font-size: 24px; font-weight: 700; color: var(--saas-primary); }
.assets-loading { text-align: center; padding: 40px 0; color: var(--saas-text-secondary); }
</style>
