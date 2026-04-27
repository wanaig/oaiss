<script setup>
import { computed, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'

const taskDialogVisible = ref(false)
const sourceDialogVisible = ref(false)
const currentIndex = ref(0)

const taskList = ref([
  {
    id: 'RPT-202604-001',
    enterpriseName: '华东发电一部',
    enterpriseType: '发电企业',
    emissionValue: 1820.63,
    reportPeriod: '2026-03',
    submitTime: '2026-04-20 09:11:05',
    uploaderCode: 'UP-1201',
    dataCorrect: true,
    dataUntampered: true,
    originalPayload: {
      coalHeatValue: 19.55,
      coalConsumption: 328.2,
      oilHeatValue: 41.3,
      oilConsumption: 24.8,
    },
    audit: {
      pollutionStatus: '',
      impactAssessment: '',
      emissionLevel: '',
      auditPassword: '',
      eventCode: '',
      submitted: false,
      rejected: false,
    },
  },
  {
    id: 'RPT-202604-002',
    enterpriseName: '华北电网调度中心',
    enterpriseType: '电网企业',
    emissionValue: 1350.27,
    reportPeriod: '2026-03',
    submitTime: '2026-04-21 14:23:41',
    uploaderCode: 'UP-0960',
    dataCorrect: true,
    dataUntampered: false,
    originalPayload: {
      coalHeatValue: 18.7,
      coalConsumption: 210.6,
      oilHeatValue: 40.1,
      oilConsumption: 18.4,
    },
    audit: {
      pollutionStatus: '',
      impactAssessment: '',
      emissionLevel: '',
      auditPassword: '',
      eventCode: '',
      submitted: false,
      rejected: false,
    },
  },
  {
    id: 'RPT-202604-003',
    enterpriseName: '华南发电三部',
    enterpriseType: '发电企业',
    emissionValue: 2105.92,
    reportPeriod: '2026-03',
    submitTime: '2026-04-22 08:46:11',
    uploaderCode: 'UP-1654',
    dataCorrect: false,
    dataUntampered: true,
    originalPayload: {
      coalHeatValue: 20.1,
      coalConsumption: 390.5,
      oilHeatValue: 42.2,
      oilConsumption: 28.3,
    },
    audit: {
      pollutionStatus: '',
      impactAssessment: '',
      emissionLevel: '',
      auditPassword: '',
      eventCode: '',
      submitted: false,
      rejected: false,
    },
  },
])

const pollutionOptions = ['正常', '轻度污染', '中度污染', '重度污染']

const currentTask = computed(() => taskList.value[currentIndex.value])
const displayTaskNo = computed(() => `${currentIndex.value + 1}/${taskList.value.length}`)

const requiredFields = [
  { key: 'pollutionStatus', label: '污染情况' },
  { key: 'impactAssessment', label: '影响评估' },
  { key: 'emissionLevel', label: '排放定级' },
  { key: 'auditPassword', label: '审核密码' },
  { key: 'eventCode', label: '事件编号' },
]

const validateAudit = () => {
  for (const field of requiredFields) {
    const value = currentTask.value.audit[field.key]
    if (!String(value || '').trim()) {
      ElMessage.warning(`请完善${field.label}`)
      return false
    }
  }
  return true
}

const openAllTasks = () => {
  taskDialogVisible.value = true
}

const viewSourceData = () => {
  sourceDialogVisible.value = true
}

const rejectTask = async () => {
  try {
    await ElMessageBox.confirm(
      `确认将 ${currentTask.value.enterpriseName} 的报告标记为不允许通过吗？`,
      '不允许通过',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
      },
    )

    currentTask.value.audit.rejected = true
    currentTask.value.audit.submitted = false
    ElMessage.success('已标记为不允许通过')
  } catch {
    ElMessage.info('已取消操作')
  }
}

const submitAuditReport = () => {
  if (!validateAudit()) {
    return
  }

  currentTask.value.audit.submitted = true
  currentTask.value.audit.rejected = false
  ElMessage.success(`报告 ${currentTask.value.id} 已提交`) 
}

const goNextTask = () => {
  if (taskList.value.length === 0) {
    ElMessage.warning('暂无待审核数据')
    return
  }

  currentIndex.value = (currentIndex.value + 1) % taskList.value.length
  ElMessage.success(`已切换到下一份：${currentTask.value.id}`)
}

const switchTask = (index) => {
  currentIndex.value = index
  taskDialogVisible.value = false
  ElMessage.success(`已切换到任务：${currentTask.value.id}`)
}
</script>

<template>
  <section class="audit-page" v-if="currentTask">
    <el-card class="section-card" shadow="never">
      <el-breadcrumb separator="/">
        <el-breadcrumb-item>审核材料</el-breadcrumb-item>
        <el-breadcrumb-item>碳排放数据</el-breadcrumb-item>
      </el-breadcrumb>
    </el-card>

    <el-card class="section-card" shadow="never">
      <div class="title-row">
        <div>
          <h2 class="title">审核页面</h2>
          <p class="sub-title">当前任务 {{ displayTaskNo }}，报告单号：{{ currentTask.id }}</p>
        </div>
        <div class="title-actions">
          <el-button @click="openAllTasks">查看全部任务</el-button>
          <el-button type="danger" plain @click="rejectTask">不允许通过</el-button>
        </div>
      </div>
    </el-card>

    <el-card class="section-card" shadow="never">
      <template #header>
        <div class="section-header">当前企业报告单</div>
      </template>

      <el-descriptions :column="2" border>
        <el-descriptions-item label="企业名称">{{ currentTask.enterpriseName }}</el-descriptions-item>
        <el-descriptions-item label="企业类型">{{ currentTask.enterpriseType }}</el-descriptions-item>
        <el-descriptions-item label="核算排放量">{{ currentTask.emissionValue }} tCO2e</el-descriptions-item>
        <el-descriptions-item label="上报周期">{{ currentTask.reportPeriod }}</el-descriptions-item>
        <el-descriptions-item label="提交时间">{{ currentTask.submitTime }}</el-descriptions-item>
        <el-descriptions-item label="上传者编号">{{ currentTask.uploaderCode }}</el-descriptions-item>
        <el-descriptions-item label="数据是否正确">
          <el-tag :type="currentTask.dataCorrect ? 'success' : 'danger'">
            {{ currentTask.dataCorrect ? '正确' : '待核验' }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="数据是否未被篡改">
          <el-tag :type="currentTask.dataUntampered ? 'success' : 'warning'">
            {{ currentTask.dataUntampered ? '未被篡改' : '疑似篡改' }}
          </el-tag>
        </el-descriptions-item>
      </el-descriptions>

      <div class="report-actions">
        <el-button type="primary" plain @click="viewSourceData">查看原始提交数据</el-button>
      </div>
    </el-card>

    <el-card class="section-card" shadow="never">
      <template #header>
        <div class="section-header">审核表单</div>
      </template>

      <el-form label-width="120px">
        <el-form-item label="污染情况">
          <el-select v-model="currentTask.audit.pollutionStatus" placeholder="请选择污染情况">
            <el-option v-for="item in pollutionOptions" :key="item" :label="item" :value="item" />
          </el-select>
        </el-form-item>

        <el-form-item label="影响评估">
          <el-input v-model="currentTask.audit.impactAssessment" placeholder="请输入影响评估" />
        </el-form-item>

        <el-form-item label="排放定级">
          <el-input v-model="currentTask.audit.emissionLevel" placeholder="请输入排放定级" />
        </el-form-item>

        <el-form-item label="审核密码">
          <el-input
            v-model="currentTask.audit.auditPassword"
            show-password
            type="password"
            placeholder="请输入审核密码"
          />
        </el-form-item>

        <el-form-item label="事件编号">
          <el-input v-model="currentTask.audit.eventCode" placeholder="请输入事件编号" />
        </el-form-item>

        <el-form-item>
          <el-space wrap>
            <el-button type="primary" @click="submitAuditReport">提交碳核算报告</el-button>
            <el-button type="success" plain @click="goNextTask">下一份排放数据</el-button>
          </el-space>
        </el-form-item>
      </el-form>

      <div class="audit-state-row">
        <el-tag :type="currentTask.audit.submitted ? 'success' : 'info'">
          {{ currentTask.audit.submitted ? '状态：已提交' : '状态：未提交' }}
        </el-tag>
        <el-tag :type="currentTask.audit.rejected ? 'danger' : 'info'">
          {{ currentTask.audit.rejected ? '审核结论：不允许通过' : '审核结论：待审核' }}
        </el-tag>
      </div>
    </el-card>

    <el-dialog v-model="taskDialogVisible" title="全部审核任务" width="760px">
      <el-table :data="taskList" border>
        <el-table-column prop="id" label="报告单号" min-width="140" />
        <el-table-column prop="enterpriseName" label="企业名称" min-width="180" />
        <el-table-column prop="emissionValue" label="核算排放量" min-width="120">
          <template #default="{ row }">{{ row.emissionValue }} tCO2e</template>
        </el-table-column>
        <el-table-column label="操作" width="120">
          <template #default="scope">
            <el-button link type="primary" @click="switchTask(scope.$index)">切换</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-dialog>

    <el-dialog v-model="sourceDialogVisible" title="原始提交数据" width="640px">
      <el-descriptions :column="2" border>
        <el-descriptions-item label="报告单号">{{ currentTask.id }}</el-descriptions-item>
        <el-descriptions-item label="企业名称">{{ currentTask.enterpriseName }}</el-descriptions-item>
        <el-descriptions-item label="燃煤日平均低位热值">{{ currentTask.originalPayload.coalHeatValue }}</el-descriptions-item>
        <el-descriptions-item label="燃煤日消耗量">{{ currentTask.originalPayload.coalConsumption }}</el-descriptions-item>
        <el-descriptions-item label="燃油每批次平均低位热值">{{ currentTask.originalPayload.oilHeatValue }}</el-descriptions-item>
        <el-descriptions-item label="燃油每批次消耗量">{{ currentTask.originalPayload.oilConsumption }}</el-descriptions-item>
      </el-descriptions>
    </el-dialog>
  </section>
</template>

<style scoped>
.audit-page {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.section-card {
  border: 1px solid var(--border-color);
  border-radius: 12px;
}

.title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}

.title {
  margin: 0;
  font-size: 22px;
  color: var(--text-primary);
}

.sub-title {
  margin: 8px 0 0;
  color: var(--text-secondary);
  font-size: 13px;
}

.title-actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.section-header {
  font-size: 15px;
  font-weight: 700;
}

.report-actions {
  margin-top: 14px;
}

.audit-state-row {
  margin-top: 8px;
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}
</style>
