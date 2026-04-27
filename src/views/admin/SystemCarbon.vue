<script setup>
import { computed, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useCarbonStore } from '../../store/carbon'
import { AUDIT_STATUS, ENTERPRISE_TYPES, computeEmission } from '../../config/constants'

const store = useCarbonStore()

const searchForm = reactive({ deptName: '', deptCode: '', companyName: '' })

const dialogVisible = ref(false)
const editId = ref(null)
const formRef = ref()
const formModel = reactive({
  deptName: '', deptCode: '', enterpriseType: '',
  companyName: '', coalHeatValue: null, coalConsumption: null,
  oilHeatValue: null, oilConsumption: null,
})

const formRules = {
  deptName: [{ required: true, message: '请输入部门名称', trigger: 'blur' }],
  deptCode: [{ required: true, message: '请输入部门代码', trigger: 'blur' }],
  enterpriseType: [{ required: true, message: '请选择企业类型', trigger: 'change' }],
  companyName: [{ required: true, message: '请输入企业名称', trigger: 'blur' }],
  coalHeatValue: [{ required: true, message: '请输入燃煤热值', trigger: 'blur' }],
  coalConsumption: [{ required: true, message: '请输入燃煤消耗量', trigger: 'blur' }],
  oilHeatValue: [{ required: true, message: '请输入燃油热值', trigger: 'blur' }],
  oilConsumption: [{ required: true, message: '请输入燃油消耗量', trigger: 'blur' }],
}

const computedEmission = computed(() => {
  if (!formModel.coalHeatValue && !formModel.coalConsumption && !formModel.oilHeatValue && !formModel.oilConsumption) return null
  return computeEmission(
    Number(formModel.coalHeatValue || 0), Number(formModel.coalConsumption || 0),
    Number(formModel.oilHeatValue || 0), Number(formModel.oilConsumption || 0)
  )
})

const filteredData = computed(() => {
  const deptName = searchForm.deptName.trim().toLowerCase()
  const deptCode = searchForm.deptCode.trim().toLowerCase()
  const companyName = searchForm.companyName.trim().toLowerCase()
  return store.emissionReports.filter((r) => {
    const n = !deptName || r.deptName.toLowerCase().includes(deptName)
    const c = !deptCode || r.deptCode.toLowerCase().includes(deptCode)
    const cn = !companyName || r.companyName.toLowerCase().includes(companyName)
    return n && c && cn
  })
})

const page = ref(1)
const pageSize = ref(10)
const selectedRows = ref([])
const total = computed(() => filteredData.value.length)
const pagedData = computed(() => {
  const start = (page.value - 1) * pageSize.value
  return filteredData.value.slice(start, start + pageSize.value)
})

const auditStatusTag = (status) => {
  switch (status) {
    case AUDIT_STATUS.PENDING: return 'warning'
    case AUDIT_STATUS.APPROVED: return 'success'
    case AUDIT_STATUS.REJECTED: return 'danger'
    default: return 'info'
  }
}

const openEdit = (row) => {
  editId.value = row.id
  Object.assign(formModel, {
    deptName: row.deptName, deptCode: row.deptCode,
    enterpriseType: row.enterpriseType, companyName: row.companyName,
    coalHeatValue: row.coalHeatValue, coalConsumption: row.coalConsumption,
    oilHeatValue: row.oilHeatValue, oilConsumption: row.oilConsumption,
  })
  dialogVisible.value = true
}

const onCancel = () => { dialogVisible.value = false; ElMessage.info('已取消操作') }

const onSaveEdit = async () => {
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) { ElMessage.warning('请完整填写表单'); return }
  store.updateEmissionReport(editId.value, {
    deptName: formModel.deptName.trim(), deptCode: formModel.deptCode.trim(),
    enterpriseType: formModel.enterpriseType,
    coalHeatValue: formModel.coalHeatValue, coalConsumption: formModel.coalConsumption,
    oilHeatValue: formModel.oilHeatValue, oilConsumption: formModel.oilConsumption,
  })
  ElMessage.success('报告编辑成功')
  dialogVisible.value = false
  page.value = 1
}

const onDelete = async (row) => {
  try {
    await ElMessageBox.confirm('确定要删除该碳排放报告吗？此操作不可恢复。', '删除确认', { confirmButtonText: '确定', cancelButtonText: '取消', type: 'warning' })
    store.deleteEmissionReport(row.id)
    selectedRows.value = selectedRows.value.filter(r => r.id !== row.id)
    ElMessage.success('报告已删除')
  } catch { ElMessage.info('已取消删除') }
}

const onQuery = () => { page.value = 1; ElMessage.success('查询完成') }
const onSelectionChange = (rows) => { selectedRows.value = rows }
const onSizeChange = (s) => { pageSize.value = s; page.value = 1 }
const onPageChange = (p) => { page.value = p }
</script>

<template>
  <section class="system-carbon-page">
    <el-card class="section-card" shadow="never">
      <el-breadcrumb separator="/">
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
        <el-form-item label="企业名称">
          <el-input v-model="searchForm.companyName" placeholder="请输入企业名称" clearable />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="onQuery">查询</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card class="section-card" shadow="never">
      <div class="table-tip">已选择 {{ selectedRows.length }} 条记录。管理员可编辑/删除任意企业的碳排放报告。</div>
      <el-table :data="pagedData" border @selection-change="onSelectionChange">
        <el-table-column type="selection" width="56" />
        <el-table-column label="序号" width="80">
          <template #default="scope">{{ (page - 1) * pageSize + scope.$index + 1 }}</template>
        </el-table-column>
        <el-table-column prop="id" label="报告ID" min-width="150" />
        <el-table-column prop="companyName" label="企业名称" min-width="150" show-overflow-tooltip />
        <el-table-column prop="deptName" label="部门名称" min-width="130" />
        <el-table-column prop="enterpriseType" label="企业类型" min-width="100" />
        <el-table-column label="碳排放量" min-width="120" align="right">
          <template #default="{ row }">{{ row.emission.toLocaleString() }} tCO2e</template>
        </el-table-column>
        <el-table-column label="审核状态" min-width="90" align="center">
          <template #default="{ row }">
            <el-tag :type="auditStatusTag(row.auditStatus)" size="small">{{ row.auditStatus }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="submitTime" label="提交时间" min-width="170" />
        <el-table-column label="操作" width="160" fixed="right">
          <template #default="{ row }">
            <el-button link type="success" size="small" @click="openEdit(row)">编辑</el-button>
            <el-button link type="danger" size="small" @click="onDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-row">
        <el-pagination
          v-model:current-page="page" v-model:page-size="pageSize"
          background :page-sizes="[10, 20, 50]"
          layout="total, sizes, prev, pager, next, jumper"
          :total="total" @size-change="onSizeChange" @current-change="onPageChange"
        />
      </div>
    </el-card>

    <el-dialog v-model="dialogVisible" title="编辑碳排放核算报告" width="620px" destroy-on-close>
      <el-form ref="formRef" :model="formModel" :rules="formRules" label-width="180px">
        <el-form-item label="企业名称" prop="companyName">
          <el-input v-model="formModel.companyName" placeholder="请输入企业名称" />
        </el-form-item>
        <el-form-item label="部门名称" prop="deptName">
          <el-input v-model="formModel.deptName" placeholder="请输入部门名称" />
        </el-form-item>
        <el-form-item label="部门代码" prop="deptCode">
          <el-input v-model="formModel.deptCode" placeholder="请输入部门代码" />
        </el-form-item>
        <el-form-item label="企业类型" prop="enterpriseType">
          <el-select v-model="formModel.enterpriseType" placeholder="请选择" style="width: 100%">
            <el-option v-for="item in ENTERPRISE_TYPES" :key="item" :label="item" :value="item" />
          </el-select>
        </el-form-item>
        <el-form-item label="燃煤日平均低位热值" prop="coalHeatValue">
          <el-input-number v-model="formModel.coalHeatValue" :min="0" :precision="2" style="width: 100%" controls-position="right" />
        </el-form-item>
        <el-form-item label="燃煤日消耗量" prop="coalConsumption">
          <el-input-number v-model="formModel.coalConsumption" :min="0" :precision="2" style="width: 100%" controls-position="right" />
        </el-form-item>
        <el-form-item label="燃油每批次平均低位热值" prop="oilHeatValue">
          <el-input-number v-model="formModel.oilHeatValue" :min="0" :precision="2" style="width: 100%" controls-position="right" />
        </el-form-item>
        <el-form-item label="燃油每批次消耗量" prop="oilConsumption">
          <el-input-number v-model="formModel.oilConsumption" :min="0" :precision="2" style="width: 100%" controls-position="right" />
        </el-form-item>
        <el-form-item label="预估碳排放量" v-if="computedEmission !== null">
          <span class="estimate-emission">{{ computedEmission.toLocaleString() }} tCO2e</span>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="onCancel">取消</el-button>
        <el-button type="primary" @click="onSaveEdit">保存</el-button>
      </template>
    </el-dialog>
  </section>
</template>

<style scoped>
.system-carbon-page { display: flex; flex-direction: column; gap: 14px; }
.section-card { border: 1px solid var(--border-color); border-radius: 12px; }
.search-form { display: flex; flex-wrap: wrap; }
.table-tip { margin-bottom: 10px; color: var(--text-secondary); font-size: 13px; }
.pagination-row { margin-top: 14px; display: flex; justify-content: flex-end; }
.estimate-emission { font-size: 18px; font-weight: 700; color: var(--teal, #18a99a); }
</style>
