<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import * as echarts from 'echarts'
import { useCarbonStore } from '../../store/carbon'
import PageSaaSWrapper from '../../components/PageSaaSWrapper.vue'

const store = useCarbonStore()
const dash = computed(() => store.systemDashboard)
const stats = computed(() => dash.value?.stats)
const emissionTrend = computed(() => dash.value?.emissionTrend || [])
const txTrend = computed(() => dash.value?.transactionTrend || [])
const statusDist = computed(() => dash.value?.reportStatusDistribution || [])
const ranking = computed(() => dash.value?.enterpriseRanking || [])

const visibleChartOptions = computed(() => {
  return chartOptions.value
    .map((opt, i) => ({ opt, i }))
    .filter(item => item.opt !== null)
})

const granularity = ref('month')
const chartRefs = []; const setChartRef = (i) => (el) => { if (el) chartRefs[i] = el }
const charts = []

const STATUS_LABEL = { approved: '已通过', pending: '待审核', draft: '草稿', rejected: '已驳回' }
const STATUS_COLOR = { approved: '#2ec4b6', pending: '#f9a826', draft: '#9ca3af', rejected: '#e63946' }

const buildBarOption = (data, title, color = '#4361ee') => ({
  tooltip: { trigger: 'axis' }, grid: { left: 50, right: 20, top: 40, bottom: 30 },
  title: { text: title, left: 'center', textStyle: { fontSize: 13, fontWeight: 600 } },
  xAxis: { type: 'category', data: data.labels, axisLabel: { rotate: 30, fontSize: 11 } },
  yAxis: { type: 'value' },
  series: [{ name: title, type: 'bar', data: data.values, itemStyle: { color, borderRadius: [4, 4, 0, 0] } }],
})

const buildLineOption = (data, title, color = '#4361ee') => ({
  tooltip: { trigger: 'axis' }, grid: { left: 50, right: 20, top: 40, bottom: 30 },
  title: { text: title, left: 'center', textStyle: { fontSize: 13, fontWeight: 600 } },
  xAxis: { type: 'category', data: data.labels, axisLabel: { rotate: 30, fontSize: 11 } },
  yAxis: { type: 'value' },
  series: [{ name: title, type: 'line', data: data.values, smooth: true, areaStyle: { color: `${color}22` }, lineStyle: { color, width: 2 }, itemStyle: { color } }],
})

const buildPieOption = (data, title) => ({
  tooltip: { trigger: 'item' },
  title: { text: title, left: 'center', textStyle: { fontSize: 13, fontWeight: 600 } },
  series: [{ name: title, type: 'pie', radius: ['40%', '72%'], center: ['50%', '55%'], data: data.map(d => ({ ...d, name: d.label })), label: { formatter: '{b}: {d}%' } }],
})

const chartOptions = computed(() => {
  const eLabels = emissionTrend.value.map(t => t.period)
  const eValues = emissionTrend.value.map(t => t.totalEmission)
  const tLabels = txTrend.value.map(t => t.period)
  const tCounts = txTrend.value.map(t => t.transactionCount)
  const tAmounts = txTrend.value.map(t => t.totalAmount)

  const distPie = statusDist.value.map(d => ({
    label: STATUS_LABEL[d.status] || d.status,
    value: d.count,
    itemStyle: { color: STATUS_COLOR[d.status] || '#9ca3af' },
  }))

  const rankNames = ranking.value.map(r => r.companyName)
  const rankEmissions = ranking.value.map(r => r.totalEmission)

  return [
    eLabels.length ? buildLineOption({ labels: eLabels, values: eValues }, '碳排放趋势', '#4361ee') : null,
    tLabels.length ? buildBarOption({ labels: tLabels, values: tCounts }, '交易笔数', '#2ec4b6') : null,
    tLabels.length ? buildLineOption({ labels: tLabels, values: tAmounts }, '交易金额趋势', '#f9a826') : null,
    distPie.length ? buildPieOption(distPie, '报告状态分布') : null,
    rankNames.length ? buildBarOption({ labels: rankNames, values: rankEmissions }, '企业排放排名', '#e63946') : null,
    rankNames.length ? buildBarOption({ labels: rankNames, values: ranking.value.map(r => r.transactionCount) }, '企业交易排名', '#2ec4b6') : null,
  ]
})

const initCharts = () => {
  const opts = chartOptions.value
  charts.forEach(c => c && c.dispose())
  charts.length = 0
  chartRefs.forEach((el, i) => {
    if (el && opts[i]) {
      const c = echarts.init(el, null, { renderer: 'canvas' })
      c.setOption(opts[i])
      charts.push(c)
    }
  })
}

onMounted(async () => {
  await store.fetchSystemDashboard({ granularity: granularity.value })
  if (store.systemDashboard) nextTick(initCharts)
})

watch(granularity, async () => {
  await store.fetchSystemDashboard({ granularity: granularity.value })
  if (store.systemDashboard) nextTick(initCharts)
})

watch(chartOptions, () => { if (store.systemDashboard) nextTick(initCharts) }, { deep: true })
onBeforeUnmount(() => charts.forEach(c => c && c.dispose()))
</script>

<template>
  <PageSaaSWrapper title="系统数据统计" description="全局碳交易与碳排放数据分析看板">
    <div class="kpi-row" v-if="stats">
      <el-card shadow="never" class="kpi-card"><div class="kpi-label">用户总数</div><div class="kpi-value">{{ stats.totalUsers }}</div></el-card>
      <el-card shadow="never" class="kpi-card"><div class="kpi-label">报告总数</div><div class="kpi-value" style="color:var(--saas-success)">{{ stats.totalReports }}</div></el-card>
      <el-card shadow="never" class="kpi-card"><div class="kpi-label">交易总数</div><div class="kpi-value" style="color:var(--saas-primary)">{{ stats.totalTransactions }}</div></el-card>
    </div>

    <el-card shadow="never">
      <div class="filter-row">
        <el-radio-group v-model="granularity">
          <el-radio-button value="month">月度</el-radio-button>
          <el-radio-button value="quarter">季度</el-radio-button>
          <el-radio-button value="year">年度</el-radio-button>
        </el-radio-group>
      </div>
    </el-card>

    <div class="chart-grid">
      <el-card v-for="{ opt, i } in visibleChartOptions" :key="i" shadow="never" class="chart-card"><div :ref="setChartRef(i)" class="chart-box" /></el-card>
    </div>

    <el-card shadow="never" v-if="ranking.length">
      <template #header><span>企业排放与交易排名</span></template>
      <el-table :data="ranking" border>
        <el-table-column label="排名" width="60" align="center"><template #default="s">{{ s.$index + 1 }}</template></el-table-column>
        <el-table-column prop="companyName" label="企业名称" min-width="160" />
        <el-table-column prop="companyId" label="企业编号" min-width="110" />
        <el-table-column label="总排放量" width="120" align="right"><template #default="{ row }">{{ (row.totalEmission || 0).toLocaleString() }} t</template></el-table-column>
        <el-table-column label="交易笔数" width="100" align="right"><template #default="{ row }">{{ (row.transactionCount || 0).toLocaleString() }}</template></el-table-column>
      </el-table>
    </el-card>
  </PageSaaSWrapper>
</template>

<style scoped>
.kpi-row { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
.kpi-card { text-align: center; padding: 16px 0; }
.kpi-label { font-size: 13px; color: var(--saas-text-secondary); margin-bottom: 6px; }
.kpi-value { font-size: 28px; font-weight: 700; }
.filter-row { display: flex; align-items: center; gap: 12px; }
.chart-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
.chart-card { padding: 4px; }
.chart-box { width: 100%; height: 280px; }
@media (max-width: 1200px) { .chart-grid { grid-template-columns: 1fr 1fr; } }
@media (max-width: 768px) { .chart-grid, .kpi-row { grid-template-columns: 1fr; } }
</style>
