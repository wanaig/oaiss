<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useCarbonStore } from '../../store/carbon'
import { AUDIT_STATUS, ENTERPRISE_TYPES, computeEmission } from '../../config/constants'
import PageSaaSWrapper from '../../components/PageSaaSWrapper.vue'

const store = useCarbonStore()

const searchForm = reactive({ deptName: '', deptCode: '', companyName: '' })
const dialogVisible = ref(false); const editId = ref(null); const formRef = ref()
const formModel = reactive({ deptName: '', deptCode: '', enterpriseType: '', companyName: '', coalHeatValue: null, coalConsumption: null, oilHeatValue: null, oilConsumption: null })
const formRules = { deptName: [{ required: true, message: '必填', trigger: 'blur' }], deptCode: [{ required: true, message: '必填', trigger: 'blur' }], enterpriseType: [{ required: true, message: '必选', trigger: 'change' }], companyName: [{ required: true, message: '必填', trigger: 'blur' }], coalHeatValue: [{ required: true, message: '必填', trigger: 'blur' }], coalConsumption: [{ required: true, message: '必填', trigger: 'blur' }], oilHeatValue: [{ required: true, message: '必填', trigger: 'blur' }], oilConsumption: [{ required: true, message: '必填', trigger: 'blur' }] }
const page = ref(1); const pageSize = ref(10); const selectedRows = ref([])

const computedEmission = computed(() => {
  if (!formModel.coalHeatValue && !formModel.coalConsumption && !formModel.oilHeatValue && !formModel.oilConsumption) return null
  return computeEmission(Number(formModel.coalHeatValue || 0), Number(formModel.coalConsumption || 0), Number(formModel.oilHeatValue || 0), Number(formModel.oilConsumption || 0))
})

const filteredData = computed(() => {
  const n = searchForm.deptName.trim().toLowerCase(); const c = searchForm.deptCode.trim().toLowerCase(); const cn = searchForm.companyName.trim().toLowerCase()
  return store.emissionReports.filter(r => (!n || (r.deptName || '').toLowerCase().includes(n)) && (!c || (r.deptCode || '').toLowerCase().includes(c)) && (!cn || (r.companyName || '').toLowerCase().includes(cn)))
})
const pagedData = computed(() => { const s = (page.value - 1) * pageSize.value; return filteredData.value.slice(s, s + pageSize.value) })

const kpi = computed(() => ({
  total: store.emissionReports.length,
  approved: store.emissionReports.filter(r => r.auditStatus === AUDIT_STATUS.APPROVED).length,
  pending: store.emissionReports.filter(r => r.auditStatus === AUDIT_STATUS.PENDING).length,
}))

const auditStatusTag = (s) => ({ 待审核: 'warning', 已通过: 'success', 已驳回: 'danger' }[s] || 'info')

onMounted(() => { store.fetchEmissionReports() })

const openEdit = (row) => {
  editId.value = row.id; Object.assign(formModel, { deptName: row.deptName, deptCode: row.deptCode, enterpriseType: row.enterpriseType, companyName: row.companyName, coalHeatValue: row.coalHeatValue, coalConsumption: row.coalConsumption, oilHeatValue: row.oilHeatValue, oilConsumption: row.oilConsumption }); dialogVisible.value = true
}
const onSaveEdit = async () => {
  if (!(await formRef.value.validate().catch(() => false))) { ElMessage.warning('请完善表单'); return }
  await store.updateEmissionReport(editId.value, { deptName: formModel.deptName.trim(), deptCode: formModel.deptCode.trim(), enterpriseType: formModel.enterpriseType, coalHeatValue: formModel.coalHeatValue, coalConsumption: formModel.coalConsumption, oilHeatValue: formModel.oilHeatValue, oilConsumption: formModel.oilConsumption })
  ElMessage.success('编辑成功'); dialogVisible.value = false; page.value = 1
}
const onDelete = async (row) => {
  try { await ElMessageBox.confirm('确定删除？', '确认', { confirmButtonText: '确定', cancelButtonText: '取消', type: 'warning' }); await store.deleteEmissionReport(row.id); ElMessage.success('已删除') } catch { ElMessage.info('已取消') }
}
</script>

<template>
  <PageSaaSWrapper title="碳核算管理" description="管理所有企业的碳排放报告">
    <div class="kpi-row">
      <el-card shadow="never" class="kpi-card"><div class="kpi-label">报告总数</div><div class="kpi-value">{{ kpi.total }}</div></el-card>
      <el-card shadow="never" class="kpi-card"><div class="kpi-label">已通过</div><div class="kpi-value" style="color:var(--saas-success)">{{ kpi.approved }}</div></el-card>
      <el-card shadow="never" class="kpi-card"><div class="kpi-label">待审核</div><div class="kpi-value" style="color:var(--saas-warning)">{{ kpi.pending }}</div></el-card>
    </div>

    <el-card shadow="never">
      <el-form :inline="true" class="search-bar">
        <el-form-item label="部门名称"><el-input v-model="searchForm.deptName" clearable /></el-form-item>
        <el-form-item label="部门代码"><el-input v-model="searchForm.deptCode" clearable /></el-form-item>
        <el-form-item label="企业名称"><el-input v-model="searchForm.companyName" clearable /></el-form-item>
        <el-form-item><el-button type="primary" @click="page = 1">查询</el-button></el-form-item>
      </el-form>
    </el-card>

    <el-card shadow="never">
      <el-table :data="pagedData" border @selection-change="selectedRows = $event">
        <el-table-column type="selection" width="50" />
        <el-table-column label="序号" width="60" align="center"><template #default="s">{{ (page - 1) * pageSize + s.$index + 1 }}</template></el-table-column>
        <el-table-column prop="id" label="报告ID" min-width="140" />
        <el-table-column prop="companyName" label="企业" min-width="140" show-overflow-tooltip />
        <el-table-column prop="deptName" label="部门" min-width="120" />
        <el-table-column label="碳排放量" width="110" align="right"><template #default="{ row }">{{ (row.emission || 0).toLocaleString() }} t</template></el-table-column>
        <el-table-column label="状态" width="80" align="center"><template #default="{ row }"><el-tag :type="auditStatusTag(row.auditStatus)" size="small">{{ row.auditStatus }}</el-tag></template></el-table-column>
        <el-table-column prop="submitTime" label="提交时间" min-width="160" />
        <el-table-column label="操作" width="130" fixed="right"><template #default="{ row }"><el-button link size="small" @click="openEdit(row)">编辑</el-button><el-button link type="danger" size="small" @click="onDelete(row)">删除</el-button></template></el-table-column>
      </el-table>
      <div class="pagination-wrap"><el-pagination v-model:current-page="page" v-model:page-size="pageSize" background :page-sizes="[10,20,50]" layout="total, sizes, prev, pager, next, jumper" :total="filteredData.length" /></div>
    </el-card>

    <el-dialog v-model="dialogVisible" title="编辑报告" width="580px" destroy-on-close>
      <el-form ref="formRef" :model="formModel" :rules="formRules" label-width="110px">
        <el-form-item label="企业名称" prop="companyName"><el-input v-model="formModel.companyName" /></el-form-item>
        <el-form-item label="部门名称" prop="deptName"><el-input v-model="formModel.deptName" /></el-form-item>
        <el-form-item label="部门代码" prop="deptCode"><el-input v-model="formModel.deptCode" /></el-form-item>
        <el-form-item label="企业类型" prop="enterpriseType"><el-select v-model="formModel.enterpriseType" style="width:100%"><el-option v-for="t in ENTERPRISE_TYPES" :key="t" :label="t" :value="t" /></el-select></el-form-item>
        <el-form-item label="燃煤热值" prop="coalHeatValue"><el-input-number v-model="formModel.coalHeatValue" :min="0" :precision="2" style="width:100%" controls-position="right" /></el-form-item>
        <el-form-item label="燃煤消耗量" prop="coalConsumption"><el-input-number v-model="formModel.coalConsumption" :min="0" :precision="2" style="width:100%" controls-position="right" /></el-form-item>
        <el-form-item label="燃油热值" prop="oilHeatValue"><el-input-number v-model="formModel.oilHeatValue" :min="0" :precision="2" style="width:100%" controls-position="right" /></el-form-item>
        <el-form-item label="燃油消耗量" prop="oilConsumption"><el-input-number v-model="formModel.oilConsumption" :min="0" :precision="2" style="width:100%" controls-position="right" /></el-form-item>
        <el-form-item v-if="computedEmission !== null" label="碳排放"><span style="font-weight:700;color:var(--saas-primary)">{{ computedEmission.toLocaleString() }} tCO2e</span></el-form-item>
      </el-form>
      <template #footer><el-button @click="dialogVisible = false">取消</el-button><el-button type="primary" @click="onSaveEdit">保存</el-button></template>
    </el-dialog>
  </PageSaaSWrapper>
</template>

<style scoped>
.kpi-row { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
.kpi-card { text-align: center; padding: 16px 0; }
.kpi-label { font-size: 13px; color: var(--saas-text-secondary); margin-bottom: 6px; }
.kpi-value { font-size: 28px; font-weight: 700; }
.search-bar { display: flex; flex-wrap: wrap; }
.pagination-wrap { margin-top: 16px; display: flex; justify-content: flex-end; }
</style>
