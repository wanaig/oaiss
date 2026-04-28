<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useCarbonStore } from '../../store/carbon'
import { AUDIT_STATUS_MAP } from '../../config/constants'
import PageSaaSWrapper from '../../components/PageSaaSWrapper.vue'

const router = useRouter()
const store = useCarbonStore()

const filterStatus = ref('')
const page = ref(1); const pageSize = ref(10)

const statusOptions = [
  { label: '待审核', value: 'pending' },
  { label: '已通过', value: 'approved' },
  { label: '已驳回', value: 'rejected' },
]

const filteredData = computed(() => {
  if (!filterStatus.value) return store.emissionReports
  return store.emissionReports.filter(r => r.auditStatus === filterStatus.value)
})
const pagedData = computed(() => { const s = (page.value - 1) * pageSize.value; return filteredData.value.slice(s, s + pageSize.value) })

const kpi = computed(() => ({
  pending: store.emissionReports.filter(r => r.auditStatus === 'pending').length,
  approved: store.emissionReports.filter(r => r.auditStatus === 'approved').length,
  rejected: store.emissionReports.filter(r => r.auditStatus === 'rejected').length,
}))

const auditStatusInfo = (s) => AUDIT_STATUS_MAP[s] || { label: s, type: 'info' }

onMounted(() => { store.fetchAuditTasks() })

const openDetail = (row) => router.push(`/auditor/audit/detail/${row.id}`)
</script>

<template>
  <PageSaaSWrapper title="审核列表" description="查看和管理碳排放报告审核任务">
    <div class="kpi-row">
      <el-card shadow="never" class="kpi-card"><div class="kpi-label">待审核</div><div class="kpi-value" style="color:var(--saas-warning)">{{ kpi.pending }}</div></el-card>
      <el-card shadow="never" class="kpi-card"><div class="kpi-label">已通过</div><div class="kpi-value" style="color:var(--saas-success)">{{ kpi.approved }}</div></el-card>
      <el-card shadow="never" class="kpi-card"><div class="kpi-label">已驳回</div><div class="kpi-value" style="color:var(--saas-danger)">{{ kpi.rejected }}</div></el-card>
    </div>

    <el-card shadow="never">
      <div style="display:flex;gap:12px;align-items:center">
        <el-select v-model="filterStatus" placeholder="全部状态" clearable style="width:160px">
          <el-option v-for="item in statusOptions" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
        <el-button type="primary" @click="page = 1">查询</el-button>
      </div>
    </el-card>

    <el-card shadow="never">
      <el-table :data="pagedData" border>
        <el-table-column label="序号" width="60" align="center"><template #default="s">{{ (page - 1) * pageSize + s.$index + 1 }}</template></el-table-column>
        <el-table-column prop="id" label="报告ID" min-width="140" />
        <el-table-column prop="companyName" label="企业" min-width="140" show-overflow-tooltip />
        <el-table-column prop="deptName" label="部门" min-width="120" />
        <el-table-column label="碳排放量" width="110" align="right"><template #default="{ row }">{{ (row.emission || 0).toLocaleString() }} t</template></el-table-column>
        <el-table-column prop="submitTime" label="提交时间" min-width="160" />
        <el-table-column label="审核状态" width="80" align="center"><template #default="{ row }"><el-tag :type="auditStatusInfo(row.auditStatus).type" size="small">{{ auditStatusInfo(row.auditStatus).label }}</el-tag></template></el-table-column>
        <el-table-column label="操作" width="90" fixed="right" align="center"><template #default="{ row }"><el-button link type="primary" size="small" @click="openDetail(row)">{{ row.auditStatus === 'pending' ? '审核' : '查看' }}</el-button></template></el-table-column>
      </el-table>
      <div class="pagination-wrap"><el-pagination v-model:current-page="page" v-model:page-size="pageSize" background :page-sizes="[10,20,50]" layout="total, sizes, prev, pager, next, jumper" :total="filteredData.length" /></div>
    </el-card>
  </PageSaaSWrapper>
</template>

<style scoped>
.kpi-row { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
.kpi-card { text-align: center; padding: 16px 0; }
.kpi-label { font-size: 13px; color: var(--saas-text-secondary); margin-bottom: 6px; }
.kpi-value { font-size: 28px; font-weight: 700; }
.pagination-wrap { margin-top: 16px; display: flex; justify-content: flex-end; }
</style>
