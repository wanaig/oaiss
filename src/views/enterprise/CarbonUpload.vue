<script setup>
import { computed, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useAppStore } from '../../store'

const appStore = useAppStore()

const searchForm = reactive({
  deptName: '',
  deptCode: '',
})

const tableData = ref([
  {
    id: 1,
    deptName: '华东发电一部',
    deptCode: 'HD-001',
    emission: 1820.63,
    submitTime: '2026-04-18 09:12:03',
    uploaderCode: 'UP-1201',
    enterpriseType: '发电企业',
    coalHeatValue: 19.55,
    coalConsumption: 328.2,
    oilHeatValue: 41.3,
    oilConsumption: 24.8,
    signed: false,
  },
  {
    id: 2,
    deptName: '华北电网调度中心',
    deptCode: 'HB-071',
    emission: 1350.27,
    submitTime: '2026-04-20 14:32:45',
    uploaderCode: 'UP-0960',
    enterpriseType: '电网企业',
    coalHeatValue: 18.7,
    coalConsumption: 210.6,
    oilHeatValue: 40.1,
    oilConsumption: 18.4,
    signed: false,
  },
  {
    id: 3,
    deptName: '华南发电三部',
    deptCode: 'HN-023',
    emission: 2105.92,
    submitTime: '2026-04-22 08:46:11',
    uploaderCode: 'UP-1654',
    enterpriseType: '发电企业',
    coalHeatValue: 20.1,
    coalConsumption: 390.5,
    oilHeatValue: 42.2,
    oilConsumption: 28.3,
    signed: true,
  },
])

const currentPage = ref(1)
const pageSize = ref(10)
const selectedRows = ref([])

const dialogVisible = ref(false)
const dialogMode = ref('add')

const formRef = ref()
const editId = ref(null)
const formModel = reactive({
  deptName: '',
  deptCode: '',
  enterpriseType: '',
  coalHeatValue: null,
  coalConsumption: null,
  oilHeatValue: null,
  oilConsumption: null,
})

const enterpriseTypeOptions = ['发电企业', '电网企业']

const formRules = {
  deptName: [{ required: true, message: '请输入部门名称', trigger: 'blur' }],
  deptCode: [{ required: true, message: '请输入部门代码', trigger: 'blur' }],
  enterpriseType: [{ required: true, message: '请选择企业类型', trigger: 'change' }],
  coalHeatValue: [{ required: true, message: '请输入燃煤日平均低位热值', trigger: 'blur' }],
  coalConsumption: [{ required: true, message: '请输入燃煤日消耗量', trigger: 'blur' }],
  oilHeatValue: [{ required: true, message: '请输入燃油每批次平均低位热值', trigger: 'blur' }],
  oilConsumption: [{ required: true, message: '请输入燃油每批次消耗量', trigger: 'blur' }],
}

const filteredData = computed(() => {
  const name = searchForm.deptName.trim().toLowerCase()
  const code = searchForm.deptCode.trim().toLowerCase()

  return tableData.value.filter((item) => {
    const nameMatch = !name || item.deptName.toLowerCase().includes(name)
    const codeMatch = !code || item.deptCode.toLowerCase().includes(code)
    return nameMatch && codeMatch
  })
})

const total = computed(() => filteredData.value.length)

const pagedData = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return filteredData.value.slice(start, end)
})

const toNumber = (value) => Number((value || 0).toFixed(2))

const calcEmission = (payload) => {
  const coalPart = (payload.coalHeatValue || 0) * (payload.coalConsumption || 0) * 0.12
  const oilPart = (payload.oilHeatValue || 0) * (payload.oilConsumption || 0) * 0.18
  return toNumber(coalPart + oilPart)
}

const resetFormModel = () => {
  formModel.deptName = ''
  formModel.deptCode = ''
  formModel.enterpriseType = ''
  formModel.coalHeatValue = null
  formModel.coalConsumption = null
  formModel.oilHeatValue = null
  formModel.oilConsumption = null
}

const formatNow = () => {
  const now = new Date()
  const pad = (n) => String(n).padStart(2, '0')
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`
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

const openAddDialog = () => {
  dialogMode.value = 'add'
  editId.value = null
  resetFormModel()
  dialogVisible.value = true
}

const openEditDialog = (row) => {
  dialogMode.value = 'edit'
  editId.value = row.id
  formModel.deptName = row.deptName
  formModel.deptCode = row.deptCode
  formModel.enterpriseType = row.enterpriseType
  formModel.coalHeatValue = row.coalHeatValue
  formModel.coalConsumption = row.coalConsumption
  formModel.oilHeatValue = row.oilHeatValue
  formModel.oilConsumption = row.oilConsumption
  dialogVisible.value = true
}

const onSubmitForm = async () => {
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) {
    ElMessage.warning('请先完善表单内容')
    return
  }

  const payload = {
    deptName: formModel.deptName.trim(),
    deptCode: formModel.deptCode.trim(),
    enterpriseType: formModel.enterpriseType,
    coalHeatValue: Number(formModel.coalHeatValue),
    coalConsumption: Number(formModel.coalConsumption),
    oilHeatValue: Number(formModel.oilHeatValue),
    oilConsumption: Number(formModel.oilConsumption),
  }

  if (dialogMode.value === 'add') {
    tableData.value.unshift({
      id: Date.now(),
      ...payload,
      emission: calcEmission(payload),
      submitTime: formatNow(),
      uploaderCode: `UP-${Math.floor(1000 + Math.random() * 9000)}`,
      signed: false,
    })
    ElMessage.success('新增成功')
  } else {
    const idx = tableData.value.findIndex((item) => item.id === editId.value)
    if (idx > -1) {
      const old = tableData.value[idx]
      tableData.value[idx] = {
        ...old,
        ...payload,
        emission: calcEmission(payload),
      }
      ElMessage.success('修改成功')
    }
  }

  dialogVisible.value = false
  currentPage.value = 1
}

const onCancelDialog = () => {
  dialogVisible.value = false
  ElMessage.info('已取消操作')
}

const onSignConfirm = async (row) => {
  try {
    await ElMessageBox.confirm(`是否确认提交编号 ${row.uploaderCode} 的签名？`, '确认签名', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    })

    const target = tableData.value.find((item) => item.id === row.id)
    if (target) {
      target.signed = true
      ElMessage.success('签名确认成功')
    }
  } catch {
    ElMessage.info('已取消签名')
  }
}
</script>

<template>
  <section class="upload-page">
    <el-card class="section-card" shadow="never">
      <el-breadcrumb separator="/">
        <el-breadcrumb-item>碳核算</el-breadcrumb-item>
        <el-breadcrumb-item>上传审核</el-breadcrumb-item>
      </el-breadcrumb>
    </el-card>

    <el-card class="section-card" shadow="never">
      <el-form :inline="true" :model="searchForm" class="search-form">
        <el-form-item label="部门名称">
          <el-input v-model="searchForm.deptName" placeholder="请输入部门名称" clearable />
        </el-form-item>
        <el-form-item label="部门代码">
          <el-input v-model="searchForm.deptCode" placeholder="请输入部门代码" clearable />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="onQuery">查询</el-button>
          <el-button type="success" plain @click="openAddDialog">添加</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card class="section-card" shadow="never">
      <div class="table-tip">当前已选择 {{ selectedRows.length }} 条，支持单选或多选。</div>
      <el-table :data="pagedData" border @selection-change="onSelectionChange">
        <el-table-column type="selection" width="56" />
        <el-table-column prop="emission" label="核算后排放量" min-width="150">
          <template #default="{ row }">{{ row.emission }} tCO2e</template>
        </el-table-column>
        <el-table-column prop="submitTime" label="提交时间" min-width="180" />
        <el-table-column prop="uploaderCode" label="上传者编号" min-width="140" />
        <el-table-column label="操作" width="220" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="openEditDialog(row)">修改</el-button>
            <el-button link type="success" :disabled="row.signed" @click="onSignConfirm(row)">
              {{ row.signed ? '已签名' : '确认签名' }}
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-card class="section-card" shadow="never">
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
    </el-card>

    <el-dialog
      v-model="dialogVisible"
      :title="dialogMode === 'add' ? '添加核算数据' : '修改核算数据'"
      width="640px"
      destroy-on-close
    >
      <el-form ref="formRef" :model="formModel" :rules="formRules" label-width="200px">
        <el-form-item label="部门名称" prop="deptName">
          <el-input v-model="formModel.deptName" placeholder="请输入部门名称" />
        </el-form-item>

        <el-form-item label="部门代码" prop="deptCode">
          <el-input v-model="formModel.deptCode" placeholder="请输入部门代码" />
        </el-form-item>

        <el-form-item label="企业类型" prop="enterpriseType">
          <el-select v-model="formModel.enterpriseType" placeholder="请选择企业类型" style="width: 100%">
            <el-option v-for="item in enterpriseTypeOptions" :key="item" :label="item" :value="item" />
          </el-select>
        </el-form-item>

        <el-form-item label="燃煤日平均低位热值" prop="coalHeatValue">
          <el-input-number v-model="formModel.coalHeatValue" :min="0" :precision="2" controls-position="right" style="width: 100%" />
        </el-form-item>

        <el-form-item label="燃煤日消耗量" prop="coalConsumption">
          <el-input-number v-model="formModel.coalConsumption" :min="0" :precision="2" controls-position="right" style="width: 100%" />
        </el-form-item>

        <el-form-item label="燃油每批次平均低位热值" prop="oilHeatValue">
          <el-input-number v-model="formModel.oilHeatValue" :min="0" :precision="2" controls-position="right" style="width: 100%" />
        </el-form-item>

        <el-form-item label="燃油每批次消耗量" prop="oilConsumption">
          <el-input-number v-model="formModel.oilConsumption" :min="0" :precision="2" controls-position="right" style="width: 100%" />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="onCancelDialog">取消</el-button>
        <el-button type="primary" @click="onSubmitForm">提交</el-button>
      </template>
    </el-dialog>
  </section>
</template>

<style scoped>
.upload-page {
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
  gap: 6px;
}

.search-form :deep(.el-form-item) {
  margin-bottom: 8px;
}

.table-tip {
  color: var(--text-secondary);
  font-size: 13px;
  margin-bottom: 10px;
}

@media (max-width: 768px) {
  .upload-page {
    gap: 12px;
  }

  .search-form :deep(.el-input) {
    width: 100%;
  }
}
</style>
