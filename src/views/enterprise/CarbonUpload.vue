<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useAppStore } from '../../store'
import { useCarbonStore } from '../../store/carbon'
import { AUDIT_STATUS, ENTERPRISE_TYPES, computeEmission } from '../../config/constants'
import PageSaaSWrapper from '../../components/PageSaaSWrapper.vue'

const appStore = useAppStore()
const store = useCarbonStore()

const searchForm = reactive({ deptName: '', deptCode: '' })
const dialogVisible = ref(false)
const dialogMode = ref('add')
const editingId = ref(null)
const formRef = ref()
const formModel = reactive({
  deptName: '', deptCode: '', enterpriseType: '',
  coalHeatValue: null, coalConsumption: null, oilHeatValue: null, oilConsumption: null,
})

const formRules = {
  deptName: [{ required: true, message: '请输入部门名称', trigger: 'blur' }],
  deptCode: [{ required: true, message: '请输入部门代码', trigger: 'blur' }],
  enterpriseType: [{ required: true, message: '请选择企业类型', trigger: 'change' }],
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

const page = ref(1)
const pageSize = ref(10)
const selectedRows = ref([])

const filteredData = computed(() => {
  const n = searchForm.deptName.trim().toLowerCase()
  const c = searchForm.deptCode.trim().toLowerCase()
  return store.myReports.filter(r => (!n || r.deptName?.toLowerCase().includes(n)) && (!c || r.deptCode?.toLowerCase().includes(c)))
})
const total = computed(() => filteredData.value.length)
const pagedData = computed(() => {
  const start = (page.value - 1) * pageSize.value
  return filteredData.value.slice(start, start + pageSize.value)
})

const kpi = computed(() => ({
  total: store.emissionReports.length,
  approved: store.emissionReports.filter(r => r.auditStatus === AUDIT_STATUS.APPROVED).length,
  pending: store.emissionReports.filter(r => r.auditStatus === AUDIT_STATUS.PENDING).length,
}))

const auditStatusTag = (s) => ({ 待审核: 'warning', 已通过: 'success', 已驳回: 'danger' }[s] || 'info')

const resetForm = () => { Object.assign(formModel, { deptName: '', deptCode: '', enterpriseType: '', coalHeatValue: null, coalConsumption: null, oilHeatValue: null, oilConsumption: null }) }
const openAddDialog = () => { dialogMode.value = 'add'; editingId.value = null; resetForm(); dialogVisible.value = true }
const openEditDialog = (row) => {
  dialogMode.value = 'edit'; editingId.value = row.id
  Object.assign(formModel, { deptName: row.deptName, deptCode: row.deptCode, enterpriseType: row.enterpriseType, coalHeatValue: row.coalHeatValue, coalConsumption: row.coalConsumption, oilHeatValue: row.oilHeatValue, oilConsumption: row.oilConsumption })
  dialogVisible.value = true
}

const onSave = async () => {
  if (!(await formRef.value.validate().catch(() => false))) { ElMessage.warning('请完整填写表单'); return }
  const payload = {
    deptName: formModel.deptName.trim(), deptCode: formModel.deptCode.trim(), enterpriseType: formModel.enterpriseType,
    coalHeatValue: formModel.coalHeatValue, coalConsumption: formModel.coalConsumption,
    oilHeatValue: formModel.oilHeatValue, oilConsumption: formModel.oilConsumption,
    companyId: store.currentCompanyId || appStore.username || '',
    emission: computedEmission.value,
  }
  if (dialogMode.value === 'add') {
    await store.addEmissionReport(payload)
    ElMessage.success('提交成功')
  } else {
    await store.updateEmissionReport(editingId.value, payload)
    ElMessage.success('编辑成功')
  }
  dialogVisible.value = false; page.value = 1
}

const onSubmitForAudit = async (row) => {
  if (row.signed) { ElMessage.warning('已提交审核'); return }
  try {
    await ElMessageBox.confirm('确认提交审核？提交后将不可修改。', '提交审核', { confirmButtonText: '确定提交', cancelButtonText: '取消', type: 'info' })
    await store.submitForAudit(row.id)
    ElMessage.success('报告已提交审核')
  } catch { ElMessage.info('已取消') }
}

const onDelete = async (row) => {
  if (row.auditStatus === AUDIT_STATUS.APPROVED) { ElMessage.warning('已通过的报告不可删除'); return }
  try {
    await ElMessageBox.confirm('确定删除该报告吗？', '删除确认', { confirmButtonText: '确定', cancelButtonText: '取消', type: 'warning' })
    await store.deleteEmissionReport(row.id)
    ElMessage.success('删除成功')
  } catch { ElMessage.info('已取消') }
}

onMounted(() => { store.fetchEmissionReports() })
</script>

<template>
  <PageSaaSWrapper title="碳核算报告" description="提交碳排放数据并跟踪审核进度">
    <div class="kpi-row">
      <el-card shadow="never" class="kpi-card"><div class="kpi-label">报告总数</div><div class="kpi-value">{{ kpi.total }}</div></el-card>
      <el-card shadow="never" class="kpi-card"><div class="kpi-label">已通过</div><div class="kpi-value kpi-green">{{ kpi.approved }}</div></el-card>
      <el-card shadow="never" class="kpi-card"><div class="kpi-label">待审核</div><div class="kpi-value kpi-orange">{{ kpi.pending }}</div></el-card>
    </div>

    <el-card shadow="never">
      <el-form :inline="true" class="search-bar">
        <el-form-item label="部门名称"><el-input v-model="searchForm.deptName" placeholder="请输入" clearable /></el-form-item>
        <el-form-item label="部门代码"><el-input v-model="searchForm.deptCode" placeholder="请输入" clearable /></el-form-item>
        <el-form-item>
          <el-button type="primary" @click="page = 1">查询</el-button>
          <el-button type="success" plain @click="openAddDialog">新增报告</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card shadow="never">
      <el-table :data="pagedData" border @selection-change="selectedRows = $event">
        <el-table-column type="selection" width="50" />
        <el-table-column label="序号" width="60" align="center"><template #default="s">{{ (page - 1) * pageSize + s.$index + 1 }}</template></el-table-column>
        <el-table-column prop="id" label="报告ID" min-width="140" />
        <el-table-column prop="deptName" label="部门" min-width="120" show-overflow-tooltip />
        <el-table-column label="碳排放量" min-width="110" align="right"><template #default="{ row }">{{ (row.emission || 0).toLocaleString() }} t</template></el-table-column>
        <el-table-column label="审核状态" width="90" align="center"><template #default="{ row }"><el-tag :type="auditStatusTag(row.auditStatus)" size="small">{{ row.auditStatus }}</el-tag></template></el-table-column>
        <el-table-column prop="submitTime" label="提交时间" min-width="160" />
        <el-table-column label="操作" width="220" fixed="right">
          <template #default="{ row }">
            <el-button link size="small" @click="onSubmitForAudit(row)" :disabled="row.signed || row.auditStatus === AUDIT_STATUS.APPROVED">提交审核</el-button>
            <el-button link size="small" @click="openEditDialog(row)" :disabled="row.auditStatus === AUDIT_STATUS.APPROVED">编辑</el-button>
            <el-button link type="danger" size="small" @click="onDelete(row)" :disabled="row.auditStatus === AUDIT_STATUS.APPROVED">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
      <div class="pagination-wrap">
        <el-pagination v-model:current-page="page" v-model:page-size="pageSize" background :page-sizes="[10,20,50]" layout="total, sizes, prev, pager, next, jumper" :total="total" />
      </div>
    </el-card>

    <el-dialog v-model="dialogVisible" :title="dialogMode === 'add' ? '新增报告' : '编辑报告'" width="600px" destroy-on-close>
      <el-form ref="formRef" :model="formModel" :rules="formRules" label-width="120px">
        <el-form-item label="部门名称" prop="deptName"><el-input v-model="formModel.deptName" /></el-form-item>
        <el-form-item label="部门代码" prop="deptCode"><el-input v-model="formModel.deptCode" /></el-form-item>
        <el-form-item label="企业类型" prop="enterpriseType"><el-select v-model="formModel.enterpriseType" style="width:100%"><el-option v-for="t in ENTERPRISE_TYPES" :key="t" :label="t" :value="t" /></el-select></el-form-item>
        <el-form-item label="燃煤热值" prop="coalHeatValue"><el-input-number v-model="formModel.coalHeatValue" :min="0" :precision="2" style="width:100%" controls-position="right" /></el-form-item>
        <el-form-item label="燃煤消耗量" prop="coalConsumption"><el-input-number v-model="formModel.coalConsumption" :min="0" :precision="2" style="width:100%" controls-position="right" /></el-form-item>
        <el-form-item label="燃油热值" prop="oilHeatValue"><el-input-number v-model="formModel.oilHeatValue" :min="0" :precision="2" style="width:100%" controls-position="right" /></el-form-item>
        <el-form-item label="燃油消耗量" prop="oilConsumption"><el-input-number v-model="formModel.oilConsumption" :min="0" :precision="2" style="width:100%" controls-position="right" /></el-form-item>
        <el-form-item v-if="computedEmission !== null" label="预估碳排放"><span style="font-weight:700;color:var(--saas-primary)">{{ computedEmission.toLocaleString() }} tCO2e</span></el-form-item>
      </el-form>
      <template #footer><el-button @click="dialogVisible = false">取消</el-button><el-button type="primary" @click="onSave">保存</el-button></template>
    </el-dialog>
  </PageSaaSWrapper>
</template>

<style scoped>
.kpi-row { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
.kpi-card { text-align: center; padding: 16px 0; }
.kpi-label { font-size: 13px; color: var(--saas-text-secondary); margin-bottom: 6px; }
.kpi-value { font-size: 28px; font-weight: 700; }
.kpi-green { color: var(--saas-success); }
.kpi-orange { color: var(--saas-warning); }
.search-bar { display: flex; flex-wrap: wrap; }
.pagination-wrap { margin-top: 16px; display: flex; justify-content: flex-end; }
</style>
