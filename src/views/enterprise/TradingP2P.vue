<script setup>
import { computed, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'

const searchForm = reactive({
  name: '',
  identity: '',
  orderNo: '',
})

const identityOptions = ['买方', '卖方']

const page = ref(1)
const pageSize = ref(10)

const tableData = ref([
  {
    id: 1,
    name: '华东能源集团',
    orderNo: 'P2P-202604-0001',
    carbonQuota: '420.5',
    carbonCoin: '260.2',
    appId: 'APP-ECO-1001',
    identity: '买方',
    callback: 'https://api.example.com/callback/1001',
    status: '待处理',
  },
  {
    id: 2,
    name: '华南低碳科技',
    orderNo: 'P2P-202604-0002',
    carbonQuota: '180.0',
    carbonCoin: '99.6',
    appId: 'APP-ECO-1002',
    identity: '卖方',
    callback: 'https://api.example.com/callback/1002',
    status: '待处理',
  },
  {
    id: 3,
    name: '华北电网平台',
    orderNo: 'P2P-202604-0003',
    carbonQuota: '305.8',
    carbonCoin: '186.4',
    appId: 'APP-ECO-1003',
    identity: '买方',
    callback: 'https://api.example.com/callback/1003',
    status: '待处理',
  },
])

const dialogVisible = ref(false)
const dialogFormRef = ref()
const dialogForm = reactive({
  buySell: '',
  expectedTrade: '',
  certificatePath: '',
  queryPassword: '',
  publicKey: '',
})

const dialogRules = {
  buySell: [{ required: true, message: '请选择买入/卖出', trigger: 'change' }],
  expectedTrade: [{ required: true, message: '请输入P2P交易预期', trigger: 'blur' }],
  certificatePath: [{ required: true, message: '请输入碳核算证书路径', trigger: 'blur' }],
  queryPassword: [{ required: true, message: '请输入碳核算查询密码', trigger: 'blur' }],
  publicKey: [{ required: true, message: '请输入区块链交易公钥', trigger: 'blur' }],
}

const filteredData = computed(() => {
  const name = searchForm.name.trim().toLowerCase()
  const identity = searchForm.identity
  const orderNo = searchForm.orderNo.trim().toLowerCase()

  return tableData.value.filter((item) => {
    const nameMatch = !name || item.name.toLowerCase().includes(name)
    const identityMatch = !identity || item.identity === identity
    const orderMatch = !orderNo || item.orderNo.toLowerCase().includes(orderNo)
    return nameMatch && identityMatch && orderMatch
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

const onSizeChange = (size) => {
  pageSize.value = size
  page.value = 1
}

const onPageChange = (val) => {
  page.value = val
}

const resetDialogForm = () => {
  dialogForm.buySell = ''
  dialogForm.expectedTrade = ''
  dialogForm.certificatePath = ''
  dialogForm.queryPassword = ''
  dialogForm.publicKey = ''
}

const openAddDialog = () => {
  resetDialogForm()
  dialogVisible.value = true
}

const onCancel = () => {
  dialogVisible.value = false
  ElMessage.info('已取消添加')
}

const buildOrderNo = () => `P2P-${Date.now()}`

const onSave = async () => {
  const valid = await dialogFormRef.value.validate().catch(() => false)
  if (!valid) {
    ElMessage.warning('请完善表单信息')
    return
  }

  const identity = dialogForm.buySell === '买入' ? '买方' : '卖方'

  tableData.value.unshift({
    id: Date.now(),
    name: dialogForm.expectedTrade,
    orderNo: buildOrderNo(),
    carbonQuota: '0.0',
    carbonCoin: '0.0',
    appId: 'APP-ECO-NEW',
    identity,
    callback: dialogForm.certificatePath,
    status: '待处理',
    certificatePath: dialogForm.certificatePath,
    queryPassword: dialogForm.queryPassword,
    publicKey: dialogForm.publicKey,
  })

  dialogVisible.value = false
  page.value = 1
  ElMessage.success('新增成功')
}

const applyDecision = async (row, targetStatus) => {
  const actionText = targetStatus === '已同意' ? '同意' : '拒绝'
  try {
    await ElMessageBox.confirm(`确认${actionText}订单 ${row.orderNo} 吗？`, `${actionText}确认`, {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: targetStatus === '已同意' ? 'success' : 'warning',
    })

    const target = tableData.value.find((item) => item.id === row.id)
    if (target) {
      target.status = targetStatus
      ElMessage.success(`已${actionText}该订单`)
    }
  } catch {
    ElMessage.info(`已取消${actionText}`)
  }
}

const onApprove = (row) => applyDecision(row, '已同意')
const onReject = (row) => applyDecision(row, '已拒绝')
</script>

<template>
  <section class="p2p-page">
    <el-card class="section-card" shadow="never">
      <el-breadcrumb separator="/">
        <el-breadcrumb-item>碳交易</el-breadcrumb-item>
        <el-breadcrumb-item>P2P交易</el-breadcrumb-item>
      </el-breadcrumb>
    </el-card>

    <el-card class="section-card" shadow="never">
      <el-form :inline="true" class="search-form">
        <el-form-item label="名称">
          <el-input v-model="searchForm.name" placeholder="请输入名称" clearable />
        </el-form-item>

        <el-form-item label="身份">
          <el-select v-model="searchForm.identity" placeholder="请选择身份" clearable>
            <el-option v-for="item in identityOptions" :key="item" :label="item" :value="item" />
          </el-select>
        </el-form-item>

        <el-form-item label="碳交易订单号">
          <el-input v-model="searchForm.orderNo" placeholder="请输入碳交易订单号" clearable />
        </el-form-item>

        <el-form-item>
          <el-button type="primary" @click="onQuery">查询</el-button>
          <el-button type="success" plain @click="openAddDialog">添加</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card class="section-card" shadow="never">
      <el-table :data="pagedData" border>
        <el-table-column label="序号" width="80">
          <template #default="scope">
            {{ (page - 1) * pageSize + scope.$index + 1 }}
          </template>
        </el-table-column>
        <el-table-column prop="carbonQuota" label="碳额度" min-width="110" />
        <el-table-column prop="carbonCoin" label="碳币数" min-width="110" />
        <el-table-column prop="appId" label="应用ID" min-width="140" />
        <el-table-column prop="identity" label="身份" min-width="90" />
        <el-table-column prop="callback" label="通知回调" min-width="230" show-overflow-tooltip />
        <el-table-column label="操作" width="140" fixed="right">
          <template #default="{ row }">
            <el-button link type="success" @click="onApprove(row)">同意</el-button>
            <el-button link type="danger" @click="onReject(row)">拒绝</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-row">
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

    <el-dialog v-model="dialogVisible" title="添加P2P交易信息" width="620px" destroy-on-close>
      <el-form ref="dialogFormRef" :model="dialogForm" :rules="dialogRules" label-width="150px">
        <el-form-item label="买入/卖出" prop="buySell">
          <el-select v-model="dialogForm.buySell" placeholder="请选择" style="width: 100%">
            <el-option label="买入" value="买入" />
            <el-option label="卖出" value="卖出" />
          </el-select>
        </el-form-item>

        <el-form-item label="P2P交易预期" prop="expectedTrade">
          <el-input v-model="dialogForm.expectedTrade" placeholder="请输入P2P交易预期" />
        </el-form-item>

        <el-form-item label="碳核算证书路径" prop="certificatePath">
          <el-input v-model="dialogForm.certificatePath" placeholder="请输入碳核算证书路径" />
        </el-form-item>

        <el-form-item label="碳核算查询密码" prop="queryPassword">
          <el-input v-model="dialogForm.queryPassword" show-password type="password" placeholder="请输入碳核算查询密码" />
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
.p2p-page {
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

.pagination-row {
  margin-top: 14px;
  display: flex;
  justify-content: flex-end;
}
</style>
