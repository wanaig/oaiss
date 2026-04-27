<script setup>
import { computed, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'

const searchForm = reactive({
  category: '全部',
  username: '',
  phone: '',
})

const categoryOptions = ['全部', '企业用户', '审核员', '管理员']

const selectedRows = ref([])
const currentPage = ref(1)
const pageSize = ref(10)

const userList = ref([
  {
    id: 1,
    company: '华东发电一部',
    username: 'zhangsan',
    phone: '13800138001',
    category: '企业用户',
    creditScore: 718,
    publicKey: '0x96af12b8abce0001',
    creditEnabled: true,
    tradeRecords: [
      {
        tradeNo: 'TR-202604-1001',
        amount: '128.6',
        peerAddress: '0x8f1eea2ba9c4',
        tradeTime: '2026-04-22 09:34:11',
      },
      {
        tradeNo: 'TR-202604-1002',
        amount: '88.1',
        peerAddress: '0x6d2c9f1e4440',
        tradeTime: '2026-04-22 17:08:52',
      },
    ],
  },
  {
    id: 2,
    company: '华北电网调度中心',
    username: 'lisi',
    phone: '13800138002',
    category: '审核员',
    creditScore: 682,
    publicKey: '0x96af12b8abce0002',
    creditEnabled: false,
    tradeRecords: [
      {
        tradeNo: 'TR-202604-2001',
        amount: '32.0',
        peerAddress: '0x17b3f4bd90ac',
        tradeTime: '2026-04-21 10:05:31',
      },
    ],
  },
  {
    id: 3,
    company: '监管总控中心',
    username: 'wangwu',
    phone: '13800138003',
    category: '管理员',
    creditScore: 760,
    publicKey: '0x96af12b8abce0003',
    creditEnabled: true,
    tradeRecords: [
      {
        tradeNo: 'TR-202604-3001',
        amount: '0.0',
        peerAddress: '0x000000000000',
        tradeTime: '2026-04-20 08:00:00',
      },
    ],
  },
])

const userDialogVisible = ref(false)
const userDialogMode = ref('add')
const userFormRef = ref()
const editingUserId = ref(null)
const userForm = reactive({
  company: '',
  username: '',
  phone: '',
  category: '企业用户',
  creditScore: 650,
  publicKey: '',
})

const userFormRules = {
  company: [{ required: true, message: '请输入公司名称', trigger: 'blur' }],
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  phone: [{ required: true, message: '请输入手机号', trigger: 'blur' }],
  category: [{ required: true, message: '请选择类别', trigger: 'change' }],
  publicKey: [{ required: true, message: '请输入区块链公钥', trigger: 'blur' }],
}

const tradeDialogVisible = ref(false)
const currentTradeUser = ref(null)
const currentTradeRows = ref([])

const filteredUsers = computed(() => {
  const category = searchForm.category
  const username = searchForm.username.trim().toLowerCase()
  const phone = searchForm.phone.trim()

  return userList.value.filter((row) => {
    const categoryMatch = category === '全部' || row.category === category
    const usernameMatch = !username || row.username.toLowerCase().includes(username)
    const phoneMatch = !phone || row.phone.includes(phone)
    return categoryMatch && usernameMatch && phoneMatch
  })
})

const total = computed(() => filteredUsers.value.length)

const pagedUsers = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return filteredUsers.value.slice(start, end)
})

const onQuery = () => {
  currentPage.value = 1
  ElMessage.success('查询完成')
}

const onDepartmentSetting = () => {
  ElMessage.success('部门设置功能占位，后续可扩展')
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

const resetUserForm = () => {
  userForm.company = ''
  userForm.username = ''
  userForm.phone = ''
  userForm.category = '企业用户'
  userForm.creditScore = 650
  userForm.publicKey = ''
}

const openAddUserDialog = () => {
  userDialogMode.value = 'add'
  editingUserId.value = null
  resetUserForm()
  userDialogVisible.value = true
}

const openEditUserDialog = (row) => {
  userDialogMode.value = 'edit'
  editingUserId.value = row.id
  userForm.company = row.company
  userForm.username = row.username
  userForm.phone = row.phone
  userForm.category = row.category
  userForm.creditScore = row.creditScore
  userForm.publicKey = row.publicKey
  userDialogVisible.value = true
}

const closeUserDialog = () => {
  userDialogVisible.value = false
  ElMessage.info('已取消操作')
}

const onSaveUser = async () => {
  const valid = await userFormRef.value.validate().catch(() => false)
  if (!valid) {
    ElMessage.warning('请完善用户信息')
    return
  }

  const payload = {
    company: userForm.company.trim(),
    username: userForm.username.trim(),
    phone: userForm.phone.trim(),
    category: userForm.category,
    creditScore: Number(userForm.creditScore),
    publicKey: userForm.publicKey.trim(),
  }

  if (userDialogMode.value === 'add') {
    userList.value.unshift({
      id: Date.now(),
      ...payload,
      creditEnabled: true,
      tradeRecords: [],
    })
    ElMessage.success('新增用户成功')
  } else {
    const idx = userList.value.findIndex((item) => item.id === editingUserId.value)
    if (idx > -1) {
      userList.value[idx] = {
        ...userList.value[idx],
        ...payload,
      }
      ElMessage.success('修改用户成功')
    }
  }

  userDialogVisible.value = false
  currentPage.value = 1
}

const openTradeDialog = (row) => {
  currentTradeUser.value = row
  currentTradeRows.value = row.tradeRecords || []
  tradeDialogVisible.value = true
}

const onCloseTradeDialog = () => {
  tradeDialogVisible.value = false
  ElMessage.info('已关闭交易记录')
}

const onSaveTradeDialog = () => {
  tradeDialogVisible.value = false
  ElMessage.success('交易记录已确认')
}

const onDeleteUser = async (row) => {
  try {
    await ElMessageBox.confirm('确定要让用户下线吗？', '删除用户', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    })

    userList.value = userList.value.filter((item) => item.id !== row.id)
    selectedRows.value = selectedRows.value.filter((item) => item.id !== row.id)
    ElMessage.success('用户已下线')
  } catch {
    ElMessage.info('已取消删除')
  }
}
</script>

<template>
  <section class="users-page">
    <el-card class="section-card" shadow="never">
      <el-breadcrumb separator="/">
        <el-breadcrumb-item>系统管理</el-breadcrumb-item>
        <el-breadcrumb-item>用户管理</el-breadcrumb-item>
      </el-breadcrumb>
    </el-card>

    <el-card class="section-card" shadow="never">
      <el-form :inline="true" class="search-form">
        <el-form-item label="类别">
          <el-select v-model="searchForm.category" placeholder="请选择类别" style="width: 140px">
            <el-option v-for="item in categoryOptions" :key="item" :label="item" :value="item" />
          </el-select>
        </el-form-item>

        <el-form-item label="用户名">
          <el-input v-model="searchForm.username" placeholder="请输入用户名" clearable />
        </el-form-item>

        <el-form-item label="手机号">
          <el-input v-model="searchForm.phone" placeholder="请输入手机号" clearable />
        </el-form-item>

        <el-form-item>
          <el-button type="primary" @click="onQuery">查询</el-button>
          <el-button type="success" plain @click="openAddUserDialog">添加</el-button>
          <el-button plain @click="onDepartmentSetting">部门设置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card class="section-card" shadow="never">
      <div class="table-tip">已选择 {{ selectedRows.length }} 条记录，支持单选或多选。</div>
      <el-table :data="pagedUsers" border @selection-change="onSelectionChange">
        <el-table-column type="selection" width="56" />
        <el-table-column prop="company" label="公司" min-width="180" />
        <el-table-column prop="username" label="用户名" min-width="120" />
        <el-table-column prop="category" label="类别" min-width="120" />
        <el-table-column prop="creditScore" label="信用分" min-width="100" />
        <el-table-column prop="publicKey" label="区块链公钥" min-width="200" show-overflow-tooltip />
        <el-table-column label="信用情况" min-width="120">
          <template #default="{ row }">
            <el-switch
              v-model="row.creditEnabled"
              inline-prompt
              active-text="开"
              inactive-text="关"
            />
          </template>
        </el-table-column>
        <el-table-column label="操作" width="220" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="openEditUserDialog(row)">修改</el-button>
            <el-button link type="success" @click="openTradeDialog(row)">交易记录</el-button>
            <el-button link type="danger" @click="onDeleteUser(row)">删除用户</el-button>
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

    <el-dialog
      v-model="userDialogVisible"
      :title="userDialogMode === 'add' ? '新增用户' : '修改用户'"
      width="620px"
      destroy-on-close
    >
      <el-form ref="userFormRef" :model="userForm" :rules="userFormRules" label-width="110px">
        <el-form-item label="公司" prop="company">
          <el-input v-model="userForm.company" placeholder="请输入公司名称" />
        </el-form-item>

        <el-form-item label="用户名" prop="username">
          <el-input v-model="userForm.username" placeholder="请输入用户名" />
        </el-form-item>

        <el-form-item label="手机号" prop="phone">
          <el-input v-model="userForm.phone" placeholder="请输入手机号" />
        </el-form-item>

        <el-form-item label="类别" prop="category">
          <el-select v-model="userForm.category" style="width: 100%">
            <el-option label="企业用户" value="企业用户" />
            <el-option label="审核员" value="审核员" />
            <el-option label="管理员" value="管理员" />
          </el-select>
        </el-form-item>

        <el-form-item label="信用分" prop="creditScore">
          <el-input-number v-model="userForm.creditScore" :min="0" :max="1000" style="width: 100%" />
        </el-form-item>

        <el-form-item label="区块链公钥" prop="publicKey">
          <el-input v-model="userForm.publicKey" placeholder="请输入区块链公钥" />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="closeUserDialog">取消</el-button>
        <el-button type="primary" @click="onSaveUser">保存</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="tradeDialogVisible" title="交易记录查询" width="760px">
      <div class="trade-title">当前用户：{{ currentTradeUser?.username || '-' }}</div>
      <el-table :data="currentTradeRows" border>
        <el-table-column prop="tradeNo" label="交易单号" min-width="160" />
        <el-table-column prop="amount" label="碳币金额" min-width="120" />
        <el-table-column prop="peerAddress" label="对方地址" min-width="180" show-overflow-tooltip />
        <el-table-column prop="tradeTime" label="交易时间" min-width="180" />
      </el-table>

      <template #footer>
        <el-button @click="onCloseTradeDialog">取消</el-button>
        <el-button type="primary" @click="onSaveTradeDialog">保存</el-button>
      </template>
    </el-dialog>
  </section>
</template>

<style scoped>
.users-page {
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

.trade-title {
  margin-bottom: 12px;
  color: var(--text-secondary);
  font-size: 13px;
}
</style>
