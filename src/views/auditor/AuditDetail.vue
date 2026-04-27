<script setup>
import { computed, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useCarbonStore } from '../../store/carbon'
import { AUDIT_STATUS } from '../../config/constants'

const route = useRoute()
const router = useRouter()
const store = useCarbonStore()

const reportId = route.params.reportId
const report = computed(() => store.emissionReports.find(r => r.id === reportId))

const auditForm = reactive({
  pollutionStatus: '',
  impactAssessment: '',
  emissionLevel: '',
  auditPassword: '',
  eventCode: '',
})

const pollutionOptions = ['正常', '轻度污染', '中度污染', '重度污染']

const onApprove = async () => {
  if (!auditForm.pollutionStatus || !auditForm.impactAssessment || !auditForm.emissionLevel) {
    ElMessage.warning('请填写完整审核信息')
    return
  }
  try {
    await ElMessageBox.confirm('确认审核通过该碳排放报告？将通过后系统将自动发放碳配额至企业账户。', '审核通过确认', {
      confirmButtonText: '确认通过',
      cancelButtonText: '取消',
      type: 'success',
    })
    store.approveReport(reportId, {
      pollutionStatus: auditForm.pollutionStatus,
      impactAssessment: auditForm.impactAssessment,
      emissionLevel: auditForm.emissionLevel,
      auditPassword: auditForm.auditPassword,
      eventCode: auditForm.eventCode,
    })
    const acc = store.accounts[report.value.companyId]
    const quota = report.value.emission
    ElMessage.success(`审核通过，已向「${acc ? acc.companyName : report.value.companyName}」发放 ${quota.toLocaleString()} 单位碳配额`)
    router.back()
  } catch {
    ElMessage.info('已取消操作')
  }
}

const rejectDialogVisible = ref(false)
const rejectReason = ref('')

const onReject = async () => {
  if (!rejectReason.value.trim()) {
    ElMessage.warning('请填写驳回原因')
    return
  }
  try {
    await ElMessageBox.confirm('确认驳回该碳排放报告？', '审核驳回确认', {
      confirmButtonText: '确认驳回',
      cancelButtonText: '取消',
      type: 'warning',
    })
    store.rejectReport(reportId, rejectReason.value.trim())
    ElMessage.info('报告已驳回')
    rejectDialogVisible.value = false
    router.back()
  } catch {
    ElMessage.info('已取消操作')
  }
}

const goBack = () => {
  router.back()
}
</script>

<template>
  <section class="audit-detail-page" v-if="report">
    <el-card class="section-card" shadow="never">
      <el-breadcrumb separator="/">
        <el-breadcrumb-item :to="{ path: '/auditor/audit/list' }">审核列表</el-breadcrumb-item>
        <el-breadcrumb-item>审核详情</el-breadcrumb-item>
      </el-breadcrumb>
    </el-card>

    <el-card class="section-card" shadow="never">
      <template #header>
        <div class="card-header-row">
          <span class="card-title">报告信息 — {{ report.id }}</span>
          <el-tag :type="report.auditStatus === AUDIT_STATUS.PENDING ? 'warning' : report.auditStatus === AUDIT_STATUS.APPROVED ? 'success' : 'danger'" size="large">{{ report.auditStatus }}</el-tag>
        </div>
      </template>
      <el-descriptions :column="2" border>
        <el-descriptions-item label="报告ID">{{ report.id }}</el-descriptions-item>
        <el-descriptions-item label="企业名称">{{ report.companyName }}</el-descriptions-item>
        <el-descriptions-item label="部门名称">{{ report.deptName }}</el-descriptions-item>
        <el-descriptions-item label="部门代码">{{ report.deptCode }}</el-descriptions-item>
        <el-descriptions-item label="企业类型">{{ report.enterpriseType }}</el-descriptions-item>
        <el-descriptions-item label="上传编号">{{ report.uploaderCode }}</el-descriptions-item>
        <el-descriptions-item label="提交时间">{{ report.submitTime }}</el-descriptions-item>
        <el-descriptions-item label="碳排放量">{{ report.emission.toLocaleString() }} tCO2e</el-descriptions-item>
        <el-descriptions-item label="燃煤热值">{{ report.coalHeatValue.toLocaleString() }} kJ/kg</el-descriptions-item>
        <el-descriptions-item label="燃煤消耗量">{{ report.coalConsumption.toLocaleString() }} 吨</el-descriptions-item>
        <el-descriptions-item label="燃油热值">{{ report.oilHeatValue.toLocaleString() }} kJ/kg</el-descriptions-item>
        <el-descriptions-item label="燃油消耗量">{{ report.oilConsumption.toLocaleString() }} 吨</el-descriptions-item>
        <el-descriptions-item v-if="report.rejectReason" label="驳回原因" :span="2">
          <span style="color: #f56c6c">{{ report.rejectReason }}</span>
        </el-descriptions-item>
      </el-descriptions>

      <div v-if="report.auditResult" class="audit-result-section">
        <h4>审核结果</h4>
        <el-descriptions :column="2" border>
          <el-descriptions-item label="污染状况">{{ report.auditResult.pollutionStatus }}</el-descriptions-item>
          <el-descriptions-item label="排放等级">{{ report.auditResult.emissionLevel }}</el-descriptions-item>
          <el-descriptions-item label="影响评估" :span="2">{{ report.auditResult.impactAssessment }}</el-descriptions-item>
          <el-descriptions-item label="事件编码">{{ report.auditResult.eventCode || '-' }}</el-descriptions-item>
          <el-descriptions-item label="审核时间">{{ report.auditResult.auditTime }}</el-descriptions-item>
        </el-descriptions>
      </div>
    </el-card>

    <el-card class="section-card" shadow="never" v-if="report.auditStatus === AUDIT_STATUS.PENDING">
      <template #header><span class="card-title">审核表单</span></template>
      <el-form label-width="120px">
        <el-form-item label="污染状况">
          <el-select v-model="auditForm.pollutionStatus" placeholder="请选择" style="width: 100%">
            <el-option v-for="item in pollutionOptions" :key="item" :label="item" :value="item" />
          </el-select>
        </el-form-item>
        <el-form-item label="影响评估">
          <el-input v-model="auditForm.impactAssessment" type="textarea" :rows="3" placeholder="请输入碳排放影响评估" />
        </el-form-item>
        <el-form-item label="排放等级">
          <el-input v-model="auditForm.emissionLevel" placeholder="如：一级 / 二级 / 三级" />
        </el-form-item>
        <el-form-item label="审核密码">
          <el-input v-model="auditForm.auditPassword" show-password placeholder="请输入审核密码" />
        </el-form-item>
        <el-form-item label="事件编码">
          <el-input v-model="auditForm.eventCode" placeholder="如：EVT-001" />
        </el-form-item>
        <el-form-item>
          <el-button type="success" @click="onApprove">审核通过，发放配额</el-button>
          <el-button type="danger" @click="rejectDialogVisible = true">驳回报告</el-button>
          <el-button @click="goBack">返回列表</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-dialog v-model="rejectDialogVisible" title="驳回原因" width="500px">
      <el-input v-model="rejectReason" type="textarea" :rows="4" placeholder="请填写驳回原因" />
      <template #footer>
        <el-button @click="rejectDialogVisible = false">取消</el-button>
        <el-button type="danger" @click="onReject">确认驳回</el-button>
      </template>
    </el-dialog>
  </section>

  <el-card v-else class="section-card" shadow="never">
    <el-empty description="未找到该报告">
      <el-button type="primary" @click="goBack">返回审核列表</el-button>
    </el-empty>
  </el-card>
</template>

<style scoped>
.audit-detail-page { display: flex; flex-direction: column; gap: 14px; }
.section-card { border: 1px solid var(--border-color); border-radius: 12px; }
.card-header-row { display: flex; justify-content: space-between; align-items: center; }
.card-title { font-size: 15px; font-weight: 700; }
.audit-result-section { margin-top: 18px; }
.audit-result-section h4 { margin: 0 0 10px 0; font-size: 14px; font-weight: 600; }
</style>
