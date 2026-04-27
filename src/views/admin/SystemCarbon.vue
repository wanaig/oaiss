<script setup>
import { computed, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'

const searchForm = reactive({
  deptName: '',
  deptCode: '',
  enterpriseKeyword: '',
})

const tableData = ref([
  {
    id: 1,
    deptName: '华东发电一部',
    deptCode: 'HD-001',
    enterpriseName: '华东发电集团（C-1001）',
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
    enterpriseName: '华北电网平台（C-1003）',
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
    enterpriseName: '南方低碳能源（C-1008）',
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
const editingId = ref(null)
const formRef = ref()

const formModel = reactive({
  deptName: '',
  deptCode: '',
  enterpriseName: '',
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
  enterpriseName: [{ required: true, message: '请输入企业名称或编号', trigger: 'blur' }],
  enterpriseType: [{ required: true, message: '请选择企业类型', trigger: 'change' }],
  coalHeatValue: [{ required: true, message: '请输入燃煤日平均低位热值', trigger: 'blur' }],
  coalConsumption: [{ required: true, message: '请输入燃煤日消耗量', trigger: 'blur' }],
  oilHeatValue: [{ required: true, message: '请输入燃油每批次平均低位热值', trigger: 'blur' }],
  oilConsumption: [{ required: true, message: '请输入燃油每批次消耗量', trigger: 'blur' }],
}

const filteredData = computed(() => {
  const deptName = searchForm.deptName.trim().toLowerCase()
  const deptCode = searchForm.deptCode.trim().toLowerCase()
  const enterpriseKeyword = searchForm.enterpriseKeyword.trim().toLowerCase()

  return tableData.value.filter((item) => {
    const matchDeptName = !deptName || item.deptName.toLowerCase().includes(deptName)
    const matchDeptCode = !deptCode || item.deptCode.toLowerCase().includes(deptCode)
    const matchEnterprise =
      !enterpriseKeyword || item.enterpriseName.toLowerCase().includes(enterpriseKeyword)
    return matchDeptName && matchDeptCode && matchEnterprise
  })
})

const total = computed(() => filteredData.value.length)

const pagedData = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return filteredData.value.slice(start, end)
})

const calcEmission = (payload) => {
  const coal = (payload.coalHeatValue || 0) * (payload.coalConsumption || 0) * 0.12
  const oil = (payload.oilHeatValue || 0) * (payload.oilConsumption || 0) * 0.18
  return Number((coal + oil).toFixed(2))
}

const nowText = () => {
  const now = new Date()
  const pad = (n) => String(n).padStart(2, '0')
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`
}

const resetForm = () => {
  formModel.deptName = ''
  formModel.deptCode = ''
  formModel.enterpriseName = ''
  formModel.enterpriseType = ''
  formModel.coalHeatValue = null
  formModel.coalConsumption = null
  formModel.oilHeatValue = null
  formModel.oilConsumption = null
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
  editingId.value = null
  resetForm()
  dialogVisible.value = true
}

const openEditDialog = (row) => {
  dialogMode.value = 'edit'
  editingId.value = row.id
  formModel.deptName = row.deptName
  formModel.deptCode = row.deptCode
  formModel.enterpriseName = row.enterpriseName
  formModel.enterpriseType = row.enterpriseType
  formModel.coalHeatValue = row.coalHeatValue
  formModel.coalConsumption = row.coalConsumption
  formModel.oilHeatValue = row.oilHeatValue
  formModel.oilConsumption = row.oilConsumption
  dialogVisible.value = true
}

const onCancelDialog = () => {
  dialogVisible.value = false
  ElMessage.info('已取消操作')
}

const onUpload = async () => {
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) {
    ElMessage.warning('请先完善表单内容')
    return
  }

  const payload = {
    deptName: formModel.deptName.trim(),
    deptCode: formModel.deptCode.trim(),
    enterpriseName: formModel.enterpriseName.trim(),
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
      submitTime: nowText(),
      uploaderCode: `UP-${Math.floor(1000 + Math.random() * 9000)}`,
      signed: false,
    })
    ElMessage.success('新增碳核算数据成功')
  } else {
    const idx = tableData.value.findIndex((item) => item.id === editingId.value)
    if (idx > -1) {
      tableData.value[idx] = {
        ...tableData.value[idx],
        ...payload,
        emission: calcEmission(payload),
      }
      ElMessage.success('碳核算数据修改成功')
    }
  }

  dialogVisible.value = false
  currentPage.value = 1
}

const onConfirmSign = async (row) => {
  try {
    await ElMessageBox.confirm('确定要确认签名吗？', '确认签名', {
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
    ElMessage.info('已取消签名确认')
  }
}
</script>

<template>
  <section class="carbon-page">
    <el-card class="section-card" shadow="never">
      <el-breadcrumb separator="/">
        <el-breadcrumb-item :to="'/enterprise/carbon/upload'">首页</el-breadcrumb-item>
        <el-breadcrumb-item>系统管理</el-breadcrumb-item>
        <el-breadcrumb-item>碳核算管理</el-breadcrumb-item>
      </el-breadcrumb>
    </el-card>

    <el-card class="section-card" shadow="never">
      <el-form :inline="true" class="search-form">
        <el-form-item label="部门名称">
          <el-input v-model="searchForm.deptName" placeholder="请输入部门名称" clearable />
        </el-form-item>

        <el-form-item label="部门代码">
          <el-input v-model="searchForm.deptCode" placeholder="请输入部门代码" clearable />
        </el-form-item>

        <el-form-item label="企业名称或编号">
          <el-input v-model="searchForm.enterpriseKeyword" placeholder="请输入企业名称或编号" clearable />
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
        <el-table-column label="序号" width="80">
          <template #default="scope">{{ (currentPage - 1) * pageSize + scope.$index + 1 }}</template>
        </el-table-column>
        <el-table-column prop="deptName" label="部门名称" min-width="140" />
        <el-table-column prop="deptCode" label="部门代码" min-width="120" />
        <el-table-column prop="enterpriseName" label="企业名称" min-width="180" show-overflow-tooltip />
        <el-table-column prop="emission" label="核算后排放量" min-width="130">
          <template #default="{ row }">{{ row.emission }} tCO2e</template>
        </el-table-column>
        <el-table-column prop="submitTime" label="提交时间" min-width="170" />
        <el-table-column prop="uploaderCode" label="上传者编号" min-width="120" />
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="openEditDialog(row)">修改</el-button>
            <el-button link type="success" :disabled="row.signed" @click="onConfirmSign(row)">
              {{ row.signed ? '已签名' : '确认签名' }}
            </el-button>
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
      v-model="dialogVisible"
      :title="dialogMode === 'add' ? '新增碳核算数据' : '修改碳核算数据'"
      width="680px"
      destroy-on-close
    >
      <el-form ref="formRef" :model="formModel" :rules="formRules" label-width="200px">
        <el-form-item label="部门名称" prop="deptName">
          <el-input v-model="formModel.deptName" placeholder="请输入部门名称" />
        </el-form-item>

        <el-form-item label="部门代码" prop="deptCode">
          <el-input v-model="formModel.deptCode" placeholder="请输入部门代码" />
        </el-form-item>

        <el-form-item label="企业名称或编号" prop="enterpriseName">
          <el-input v-model="formModel.enterpriseName" placeholder="请输入企业名称或编号" />
        </el-form-item>

        <el-form-item label="企业类型" prop="enterpriseType">
          <el-select v-model="formModel.enterpriseType" placeholder="请选择企业类型" style="width: 100%">
            <el-option v-for="item in enterpriseTypeOptions" :key="item" :label="item" :value="item" />
          </el-select>
        </el-form-item>

        <el-form-item label="燃煤日平均低位热值" prop="coalHeatValue">
          <el-input-number
            v-model="formModel.coalHeatValue"
            :min="0"
            :precision="2"
            controls-position="right"
            style="width: 100%"
          />
        </el-form-item>

        <el-form-item label="燃煤日消耗量" prop="coalConsumption">
          <el-input-number
            v-model="formModel.coalConsumption"
            :min="0"
            :precision="2"
            controls-position="right"
            style="width: 100%"
          />
        </el-form-item>

        <el-form-item label="燃油每批次平均低位热值" prop="oilHeatValue">
          <el-input-number
            v-model="formModel.oilHeatValue"
            :min="0"
            :precision="2"
            controls-position="right"
            style="width: 100%"
          />
        </el-form-item>

        <el-form-item label="燃油每批次消耗量" prop="oilConsumption">
          <el-input-number
            v-model="formModel.oilConsumption"
            :min="0"
            :precision="2"
            controls-position="right"
            style="width: 100%"
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="onCancelDialog">取消</el-button>
        <el-button type="primary" @click="onUpload">上传</el-button>
      </template>
    </el-dialog>
  </section>
</template>

<style scoped>
.carbon-page {
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
