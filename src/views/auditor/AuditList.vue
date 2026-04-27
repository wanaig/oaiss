<script setup>
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useCarbonStore } from '../../store/carbon'
import { AUDIT_STATUS } from '../../config/constants'

const router = useRouter()
const store = useCarbonStore()

const filterStatus = ref('')
const page = ref(1)
const pageSize = ref(10)

const statusOptions = [
  { label: '待审核', value: AUDIT_STATUS.PENDING },
  { label: '已通过', value: AUDIT_STATUS.APPROVED },
  { label: '已驳回', value: AUDIT_STATUS.REJECTED },
]

const filteredData = computed(() => {
  const allReports = store.emissionReports.filter(r => r.signed)
  if (!filterStatus.value) return allReports
  return allReports.filter(r => r.auditStatus === filterStatus.value)
})

const total = computed(() => filteredData.value.length)
const pagedData = computed(() => {
  const start = (page.value - 1) * pageSize.value
  return filteredData.value.slice(start, start + pageSize.value)
})

const pendingCount = computed(() => store.emissionReports.filter(r => r.signed && r.auditStatus === AUDIT_STATUS.PENDING).length)
const approvedCount = computed(() => store.emissionReports.filter(r => r.auditStatus === AUDIT_STATUS.APPROVED).length)
const rejectedCount = computed(() => store.emissionReports.filter(r => r.auditStatus === AUDIT_STATUS.REJECTED).length)

const auditStatusTag = (status) => {
  switch (status) {
    case AUDIT_STATUS.PENDING: return 'warning'
    case AUDIT_STATUS.APPROVED: return 'success'
    case AUDIT_STATUS.REJECTED: return 'danger'
    default: return 'info'
  }
}

const openDetail = (row) => {
  router.push(`/auditor/audit/detail/${row.id}`)
}

const onQuery = () => { page.value = 1 }
const onSizeChange = (s) => { pageSize.value = s; page.value = 1 }
const onPageChange = (p) => { page.value = p }
</script>

<template>
  <section class="audit-list-page">
    <el-card class="section-card" shadow="never">
      <el-breadcrumb separator="/">
        <el-breadcrumb-item>审核材料</el-breadcrumb-item>
        <el-breadcrumb-item>审核列表</el-breadcrumb-item>
      </el-breadcrumb>
    </el-card>

    <div class="stats-row">
      <el-card class="stat-card" shadow="never">
        <div class="stat-label">待审核</div>
        <div class="stat-value warning">{{ pendingCount }}</div>
      </el-card>
      <el-card class="stat-card" shadow="never">
        <div class="stat-label">已通过</div>
        <div class="stat-value success">{{ approvedCount }}</div>
      </el-card>
      <el-card class="stat-card" shadow="never">
        <div class="stat-label">已驳回</div>
        <div class="stat-value danger">{{ rejectedCount }}</div>
      </el-card>
    </div>

    <el-card class="section-card" shadow="never">
      <div class="search-row">
        <el-select v-model="filterStatus" placeholder="全部审核状态" clearable style="width: 160px">
          <el-option v-for="item in statusOptions" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
        <el-button type="primary" @click="onQuery">查询</el-button>
      </div>
    </el-card>

    <el-card class="section-card" shadow="never">
      <el-table :data="pagedData" border>
        <el-table-column label="序号" width="68" align="center">
          <template #default="scope">{{ (page - 1) * pageSize + scope.$index + 1 }}</template>
        </el-table-column>
        <el-table-column prop="id" label="报告ID" min-width="150" />
        <el-table-column prop="companyName" label="企业名称" min-width="150" show-overflow-tooltip />
        <el-table-column prop="deptName" label="部门名称" min-width="130" />
        <el-table-column prop="enterpriseType" label="企业类型" min-width="100" />
        <el-table-column label="碳排放量" min-width="120" align="right">
          <template #default="{ row }">{{ row.emission.toLocaleString() }} tCO2e</template>
        </el-table-column>
        <el-table-column prop="submitTime" label="提交时间" min-width="170" />
        <el-table-column label="审核状态" min-width="90" align="center">
          <template #default="{ row }">
            <el-tag :type="auditStatusTag(row.auditStatus)" size="small">{{ row.auditStatus }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="110" fixed="right" align="center">
          <template #default="{ row }">
            <el-button link type="primary" size="small" @click="openDetail(row)">
              {{ row.auditStatus === AUDIT_STATUS.PENDING ? '审核' : '查看详情' }}
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-row">
        <el-pagination
          v-model:current-page="page" v-model:page-size="pageSize"
          background :page-sizes="[10, 20, 50]"
          layout="total, sizes, prev, pager, next, jumper"
          :total="total"
          @size-change="onSizeChange" @current-change="onPageChange"
        />
      </div>
    </el-card>
  </section>
</template>

<style scoped>
.audit-list-page { display: flex; flex-direction: column; gap: 14px; }
.section-card { border: 1px solid var(--border-color); border-radius: 12px; }
.stats-row { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; }
.stat-card { text-align: center; padding: 4px 0; }
.stat-label { font-size: 13px; color: var(--text-secondary); margin-bottom: 6px; }
.stat-value { font-size: 32px; font-weight: 700; }
.stat-value.warning { color: #e6a23c; }
.stat-value.success { color: #67c23a; }
.stat-value.danger { color: #f56c6c; }
.search-row { display: flex; gap: 10px; }
.pagination-row { margin-top: 14px; display: flex; justify-content: flex-end; }
</style>
