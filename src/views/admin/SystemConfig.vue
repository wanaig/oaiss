<script setup>
import { computed, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'

const searchForm = reactive({
  description: '',
  name: '',
})

const configList = ref([
  {
    id: 1,
    description: '核心业务服务配置',
    name: 'core-service',
    host: '10.0.8.21',
    env: 'NODE_ENV=production',
    serviceUrl: 'https://core.example.com/api',
    updatedBy: 'admin01',
  },
  {
    id: 2,
    description: '区块链网关配置',
    name: 'chain-gateway',
    host: '10.0.8.31',
    env: 'CHAIN_MODE=mainnet',
    serviceUrl: 'https://chain.example.com/gateway',
    updatedBy: 'admin02',
  },
  {
    id: 3,
    description: '审核服务配置',
    name: 'audit-service',
    host: '10.0.8.41',
    env: 'AUDIT_REGION=east',
    serviceUrl: 'https://audit.example.com/v1',
    updatedBy: 'admin03',
  },
])

const selectedRows = ref([])
const page = ref(1)
const pageSize = ref(10)

const dialogVisible = ref(false)
const dialogMode = ref('add')
const editingId = ref(null)
const formRef = ref()
const formModel = reactive({
  description: '',
  name: '',
  host: '',
  env: '',
  serviceUrl: '',
})

const formRules = {
  description: [{ required: true, message: '请输入设置描述', trigger: 'blur' }],
  name: [{ required: true, message: '请输入设置名称', trigger: 'blur' }],
  host: [{ required: true, message: '请输入服务器主机', trigger: 'blur' }],
  env: [{ required: true, message: '请输入环境变量', trigger: 'blur' }],
  serviceUrl: [{ required: true, message: '请输入网络服务地址', trigger: 'blur' }],
}

const filteredData = computed(() => {
  const description = searchForm.description.trim().toLowerCase()
  const name = searchForm.name.trim().toLowerCase()

  return configList.value.filter((item) => {
    const descriptionMatch = !description || item.description.toLowerCase().includes(description)
    const nameMatch = !name || item.name.toLowerCase().includes(name)
    return descriptionMatch && nameMatch
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

const onCurrentChange = (current) => {
  page.value = current
}

const resetForm = () => {
  formModel.description = ''
  formModel.name = ''
  formModel.host = ''
  formModel.env = ''
  formModel.serviceUrl = ''
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
  formModel.description = row.description
  formModel.name = row.name
  formModel.host = row.host
  formModel.env = row.env
  formModel.serviceUrl = row.serviceUrl
  dialogVisible.value = true
}

const onCancelDialog = () => {
  dialogVisible.value = false
  ElMessage.info('已取消操作')
}

const onSaveDialog = async () => {
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) {
    ElMessage.warning('请完善配置内容')
    return
  }

  const payload = {
    description: formModel.description.trim(),
    name: formModel.name.trim(),
    host: formModel.host.trim(),
    env: formModel.env.trim(),
    serviceUrl: formModel.serviceUrl.trim(),
    updatedBy: '当前管理员',
  }

  if (dialogMode.value === 'add') {
    configList.value.unshift({
      id: Date.now(),
      ...payload,
    })
    ElMessage.success('新增配置成功')
  } else {
    const idx = configList.value.findIndex((item) => item.id === editingId.value)
    if (idx > -1) {
      configList.value[idx] = {
        ...configList.value[idx],
        ...payload,
      }
      ElMessage.success('配置修改成功')
    }
  }

  dialogVisible.value = false
  page.value = 1
}

const onDelete = async (row) => {
  try {
    await ElMessageBox.confirm('确定删除当前配置吗？', '删除确认', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    })

    configList.value = configList.value.filter((item) => item.id !== row.id)
    selectedRows.value = selectedRows.value.filter((item) => item.id !== row.id)
    ElMessage.success('配置删除成功')

    if ((page.value - 1) * pageSize.value >= filteredData.value.length && page.value > 1) {
      page.value -= 1
    }
  } catch {
    ElMessage.info('已取消删除')
  }
}
</script>

<template>
  <section class="config-page">
    <el-card class="section-card" shadow="never">
      <el-breadcrumb separator="/">
        <el-breadcrumb-item>系统管理</el-breadcrumb-item>
        <el-breadcrumb-item>系统配置</el-breadcrumb-item>
      </el-breadcrumb>
    </el-card>

    <el-card class="section-card" shadow="never">
      <el-form :inline="true" class="search-form">
        <el-form-item label="设置描述">
          <el-input v-model="searchForm.description" placeholder="请输入设置描述" clearable />
        </el-form-item>

        <el-form-item label="设置名称">
          <el-input v-model="searchForm.name" placeholder="请输入设置名称" clearable />
        </el-form-item>

        <el-form-item>
          <el-button type="primary" @click="onQuery">查询</el-button>
          <el-button type="success" plain @click="openAddDialog">添加</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card class="section-card" shadow="never">
      <div class="table-tip">已选择 {{ selectedRows.length }} 条记录，支持单选或多选。</div>

      <el-table :data="pagedData" border @selection-change="onSelectionChange">
        <el-table-column type="selection" width="56" />
        <el-table-column prop="host" label="服务器主机" min-width="140" />
        <el-table-column prop="env" label="环境变量" min-width="180" show-overflow-tooltip />
        <el-table-column prop="serviceUrl" label="网络服务地址" min-width="220" show-overflow-tooltip />
        <el-table-column prop="updatedBy" label="修改人" min-width="120" />
        <el-table-column label="操作" width="160" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="openEditDialog(row)">编辑</el-button>
            <el-button link type="danger" @click="onDelete(row)">删除</el-button>
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
          @current-change="onCurrentChange"
        />
      </div>
    </el-card>

    <el-dialog
      v-model="dialogVisible"
      :title="dialogMode === 'add' ? '新增系统配置' : '编辑系统配置'"
      width="640px"
      destroy-on-close
    >
      <el-form ref="formRef" :model="formModel" :rules="formRules" label-width="110px">
        <el-form-item label="设置描述" prop="description">
          <el-input v-model="formModel.description" placeholder="请输入设置描述" />
        </el-form-item>

        <el-form-item label="设置名称" prop="name">
          <el-input v-model="formModel.name" placeholder="请输入设置名称" />
        </el-form-item>

        <el-form-item label="服务器主机" prop="host">
          <el-input v-model="formModel.host" placeholder="请输入服务器主机" />
        </el-form-item>

        <el-form-item label="环境变量" prop="env">
          <el-input v-model="formModel.env" placeholder="请输入环境变量" />
        </el-form-item>

        <el-form-item label="网络服务地址" prop="serviceUrl">
          <el-input v-model="formModel.serviceUrl" placeholder="请输入网络服务地址" />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="onCancelDialog">取消</el-button>
        <el-button type="primary" @click="onSaveDialog">保存</el-button>
      </template>
    </el-dialog>
  </section>
</template>

<style scoped>
.config-page {
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
