<script setup>
import { reactive, ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useCarbonStore } from '../../store/carbon'
import { AUDIT_STATUS_MAP } from '../../config/constants'
import PageSaaSWrapper from '../../components/PageSaaSWrapper.vue'

const route = useRoute(); const router = useRouter()
const store = useCarbonStore()
const reportId = route.params.reportId

const report = ref(null)
const loading = ref(true)

const auditForm = reactive({ pollutionStatus: '', impactAssessment: '', emissionLevel: '', auditPassword: '', eventCode: '' })
const auditStatusInfo = (s) => AUDIT_STATUS_MAP[s] || { label: s, type: 'info' }
const pollutionOptions = ['正常', '轻度污染', '中度污染', '重度污染']
const rejectDialogVisible = ref(false); const rejectReason = ref('')

onMounted(async () => {
  const data = await store.fetchAuditTask(reportId)
  report.value = data
  loading.value = false
})

const onApprove = async () => {
  if (!auditForm.pollutionStatus || !auditForm.impactAssessment || !auditForm.emissionLevel) { ElMessage.warning('请填写完整'); return }
  try {
    await ElMessageBox.confirm('确认审核通过？', '确认', { confirmButtonText: '通过', cancelButtonText: '取消', type: 'success' })
    await store.approveReport(reportId, { pollutionStatus: auditForm.pollutionStatus, impactAssessment: auditForm.impactAssessment, emissionLevel: auditForm.emissionLevel, auditPassword: auditForm.auditPassword, eventCode: auditForm.eventCode })
    ElMessage.success('审核通过')
    router.back()
  } catch { ElMessage.info('已取消') }
}

const onReject = async () => {
  if (!rejectReason.value.trim()) { ElMessage.warning('请填写驳回原因'); return }
  try {
    await ElMessageBox.confirm('确认驳回？', '确认', { confirmButtonText: '驳回', cancelButtonText: '取消', type: 'warning' })
    await store.rejectReport(reportId, rejectReason.value.trim())
    ElMessage.info('已驳回')
    rejectDialogVisible.value = false; router.back()
  } catch { ElMessage.info('已取消') }
}
</script>

<template>
  <PageSaaSWrapper title="审核详情" description="查看报告详情并进行审核操作">
    <el-card shadow="never" v-if="!loading && report">
      <template #header><div style="display:flex;justify-content:space-between;align-items:center"><span>报告信息 — {{ report.id }}</span><el-tag :type="auditStatusInfo(report.auditStatus).type" size="large">{{ auditStatusInfo(report.auditStatus).label }}</el-tag></div></template>
      <el-descriptions :column="2" border>
        <el-descriptions-item label="报告ID">{{ report.id }}</el-descriptions-item>
        <el-descriptions-item label="企业">{{ report.companyName }}</el-descriptions-item>
        <el-descriptions-item label="部门">{{ report.deptName }}</el-descriptions-item>
        <el-descriptions-item label="部门代码">{{ report.deptCode }}</el-descriptions-item>
        <el-descriptions-item label="企业类型">{{ report.enterpriseType }}</el-descriptions-item>
        <el-descriptions-item label="碳排放量">{{ (report.emission || 0).toLocaleString() }} tCO2e</el-descriptions-item>
        <el-descriptions-item label="燃煤热值">{{ (report.coalHeatValue || 0).toLocaleString() }} kJ/kg</el-descriptions-item>
        <el-descriptions-item label="燃煤消耗量">{{ (report.coalConsumption || 0).toLocaleString() }} 吨</el-descriptions-item>
        <el-descriptions-item label="燃油热值">{{ (report.oilHeatValue || 0).toLocaleString() }} kJ/kg</el-descriptions-item>
        <el-descriptions-item label="燃油消耗量">{{ (report.oilConsumption || 0).toLocaleString() }} 吨</el-descriptions-item>
        <el-descriptions-item label="提交时间">{{ report.submitTime }}</el-descriptions-item>
        <el-descriptions-item v-if="report.rejectReason" label="驳回原因" :span="2"><span style="color:var(--saas-danger)">{{ report.rejectReason }}</span></el-descriptions-item>
      </el-descriptions>
      <div v-if="report.auditResult" style="margin-top:16px"><h4 style="margin:0 0 8px">审核结果</h4>
        <el-descriptions :column="2" border>
          <el-descriptions-item label="污染状况">{{ report.auditResult.pollutionStatus }}</el-descriptions-item>
          <el-descriptions-item label="排放等级">{{ report.auditResult.emissionLevel }}</el-descriptions-item>
          <el-descriptions-item label="影响评估" :span="2">{{ report.auditResult.impactAssessment }}</el-descriptions-item>
          <el-descriptions-item label="事件编码">{{ report.auditResult.eventCode || '-' }}</el-descriptions-item>
          <el-descriptions-item label="审核时间">{{ report.auditResult.auditTime }}</el-descriptions-item>
        </el-descriptions>
      </div>
    </el-card>

    <el-card shadow="never" v-if="report && report.auditStatus === 'pending'">
      <template #header><span>审核表单</span></template>
      <el-form label-width="110px">
        <el-form-item label="污染状况"><el-select v-model="auditForm.pollutionStatus" style="width:100%"><el-option v-for="o in pollutionOptions" :key="o" :label="o" :value="o" /></el-select></el-form-item>
        <el-form-item label="影响评估"><el-input v-model="auditForm.impactAssessment" type="textarea" :rows="3" /></el-form-item>
        <el-form-item label="排放等级"><el-input v-model="auditForm.emissionLevel" placeholder="如：一级/二级/三级" /></el-form-item>
        <el-form-item label="审核密码"><el-input v-model="auditForm.auditPassword" show-password /></el-form-item>
        <el-form-item label="事件编码"><el-input v-model="auditForm.eventCode" /></el-form-item>
        <el-form-item><el-button type="success" @click="onApprove">审核通过</el-button><el-button type="danger" @click="rejectDialogVisible = true">驳回</el-button><el-button @click="router.back()">返回</el-button></el-form-item>
      </el-form>
    </el-card>

    <el-card v-else-if="!loading && !report" shadow="never"><el-empty description="未找到该报告"><el-button type="primary" @click="router.back()">返回</el-button></el-empty></el-card>

    <el-dialog v-model="rejectDialogVisible" title="驳回原因" width="480px">
      <el-input v-model="rejectReason" type="textarea" :rows="4" placeholder="请填写驳回原因" />
      <template #footer><el-button @click="rejectDialogVisible = false">取消</el-button><el-button type="danger" @click="onReject">确认驳回</el-button></template>
    </el-dialog>
  </PageSaaSWrapper>
</template>
