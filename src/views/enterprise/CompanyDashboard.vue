<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import * as echarts from 'echarts'
import { useCarbonStore } from '../../store/carbon'
import PageSaaSWrapper from '../../components/PageSaaSWrapper.vue'

const store = useCarbonStore()
const dash = computed(() => store.dashboardData)
const trend = computed(() => dash.value?.emissionTrend || [])

const timeDimension = ref('month')
const chartRefs = []
const setChartRef = (i) => (el) => { if (el) chartRefs[i] = el }
const charts = []

const buildBarOption = (data, title, color = '#4361ee') => ({
  tooltip: { trigger: 'axis' },
  grid: { left: 50, right: 20, top: 40, bottom: 30 },
  title: { text: title, left: 'center', textStyle: { fontSize: 13, fontWeight: 600 } },
  xAxis: { type: 'category', data: data.labels, axisLabel: { fontSize: 11 } },
  yAxis: { type: 'value' },
  series: [{ name: title, type: 'bar', data: data.values, itemStyle: { color, borderRadius: [4, 4, 0, 0] } }],
})

const buildLineOption = (data, title, color = '#4361ee') => ({
  tooltip: { trigger: 'axis' },
  grid: { left: 50, right: 20, top: 40, bottom: 30 },
  title: { text: title, left: 'center', textStyle: { fontSize: 13, fontWeight: 600 } },
  xAxis: { type: 'category', data: data.labels, axisLabel: { fontSize: 11 } },
  yAxis: { type: 'value' },
  series: [{ name: title, type: 'line', data: data.values, smooth: true, areaStyle: { color: `${color}22` }, lineStyle: { color, width: 2 }, itemStyle: { color } }],
})

const buildPieOption = (data, title) => ({
  tooltip: { trigger: 'item' },
  title: { text: title, left: 'center', textStyle: { fontSize: 13, fontWeight: 600 } },
  series: [{ name: title, type: 'pie', radius: ['40%', '72%'], center: ['50%', '55%'], data: data.map(d => ({ ...d, name: d.label })), label: { formatter: '{b}: {d}%' } }],
})

const genLabels = () => { const n = new Date(); return Array.from({ length: 12 }, (_, i) => { const d = new Date(n); d.setMonth(d.getMonth() - (11 - i)); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}` }) }
const genValues = (base, c = 12) => Array.from({ length: c }, () => Math.max(0, Math.round(base + (Math.random() - 0.5) * base * 0.6)))

const currentChartData = computed(() => {
  const trendData = trend.value
  const hasTrend = trendData.length > 0
  const trendLabels = hasTrend ? trendData.map(t => t.month) : genLabels()
  const trendValues = hasTrend ? trendData.map(t => t.emission) : genValues(1000)
  const base = Math.max(10, Math.round((trendValues.reduce((s, v) => s + v, 0) / Math.max(trendValues.length, 1)) / 10)) * 10

  return {
    labels: trendLabels,
    trend: trendValues,
    monthlyBase: genValues(base),
    tradeCount: genValues(base),
    emissionPie: [
      { label: '气体排放', value: Math.round(base * 3.5) },
      { label: '水体排放', value: Math.round(base * 1.5) },
      { label: '固体排放', value: Math.round(base * 2.0) },
      { label: '预计排放', value: Math.round(base * 1.8) },
      { label: '额定排放', value: Math.round(base * 1.2) },
    ],
    tradePie: [
      { label: '交易支出', value: Math.round(base * 2.5) },
      { label: '碳币转化', value: Math.round(base * 2.0) },
      { label: '区块链生成', value: Math.round(base * 1.5) },
      { label: '原有配额', value: Math.round(base * 2.2) },
      { label: '购入额度', value: Math.round(base * 1.8) },
    ],
    credit: genValues(Math.max(10, base)),
  }
})

const initCharts = () => {
  const d = currentChartData.value
  const options = [
    buildLineOption({ labels: d.labels, values: d.trend }, '碳排放趋势', '#4361ee'),
    buildBarOption({ labels: d.labels, values: d.monthlyBase }, '月度排放量', '#2ec4b6'),
    buildBarOption({ labels: d.labels, values: d.tradeCount }, '碳交易笔数', '#f9a826'),
    buildPieOption(d.emissionPie, '碳排放构成'),
    buildPieOption(d.tradePie, '碳交易构成'),
    buildLineOption({ labels: d.labels, values: d.credit }, '信用积分趋势', '#e63946'),
  ]
  charts.forEach(c => c && c.dispose())
  charts.length = 0
  chartRefs.forEach((el, i) => { if (el) { const c = echarts.init(el, null, { renderer: 'canvas' }); c.setOption(options[i]); charts.push(c) } })
}

onMounted(async () => {
  await store.fetchDashboard()
  if (store.dashboardData) {
    nextTick(initCharts)
  }
})

watch(currentChartData, (val) => { if (store.dashboardData) nextTick(initCharts) }, { deep: true })
onBeforeUnmount(() => charts.forEach(c => c && c.dispose()))
</script>

<template>
  <PageSaaSWrapper title="数据可视化" description="企业碳资产数据分析看板">
    <div class="kpi-row" v-if="dash">
      <el-card shadow="never" class="kpi-card">
        <div class="kpi-label">碳配额总量</div>
        <div class="kpi-value" style="color:var(--saas-success)">{{ (dash.carbonQuota || 0).toLocaleString() }}</div>
        <div class="kpi-sub">已用 {{ (dash.usedQuota || 0).toLocaleString() }} · 剩余 {{ (dash.remainingQuota || 0).toLocaleString() }}</div>
      </el-card>
      <el-card shadow="never" class="kpi-card">
        <div class="kpi-label">累计排放量</div>
        <div class="kpi-value" style="color:var(--saas-primary)">{{ (dash.cumulativeEmission || 0).toLocaleString() }}</div>
        <div class="kpi-sub">tCO2e · 配额使用率 {{ (dash.quotaUsageRate || 0).toFixed(1) }}%</div>
      </el-card>
      <el-card shadow="never" class="kpi-card">
        <div class="kpi-label">信用积分</div>
        <div class="kpi-value" style="color:var(--saas-warning)">{{ dash.creditScore ?? 0 }}</div>
        <div class="kpi-sub">企业评分 · 冻结 {{ (dash.frozenQuota || 0).toLocaleString() }}</div>
      </el-card>
    </div>

    <div class="summary-card" v-if="dash?.companyInfo">
      <div class="summary-item"><span class="summary-lbl">企业名称</span><span class="summary-val">{{ dash.companyInfo.name }}</span></div>
      <div class="summary-item"><span class="summary-lbl">企业编号</span><span class="summary-val">{{ dash.companyInfo.code }}</span></div>
      <div class="summary-item"><span class="summary-lbl">企业类型</span><span class="summary-val">{{ dash.companyInfo.type }}</span></div>
    </div>

    <el-card shadow="never">
      <div class="filter-row">
        <el-radio-group v-model="timeDimension">
          <el-radio-button value="month">月</el-radio-button>
          <el-radio-button value="quarter">季</el-radio-button>
          <el-radio-button value="year">年</el-radio-button>
        </el-radio-group>
      </div>
    </el-card>

    <div class="chart-grid">
      <el-card v-for="(_, i) in 6" :key="i" shadow="never" class="chart-card"><div :ref="setChartRef(i)" class="chart-box" /></el-card>
    </div>
  </PageSaaSWrapper>
</template>

<style scoped>
.kpi-row { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
.kpi-card { text-align: center; padding: 16px 0; }
.kpi-label { font-size: 13px; color: var(--saas-text-secondary); margin-bottom: 4px; }
.kpi-value { font-size: 26px; font-weight: 700; }
.kpi-sub { font-size: 12px; color: var(--saas-text-light); margin-top: 4px; }
.summary-card { display: flex; gap: 24px; padding: 16px 20px; background: var(--saas-surface); border-radius: var(--saas-radius); box-shadow: var(--saas-shadow); }
.summary-item { display: flex; gap: 8px; align-items: center; }
.summary-lbl { font-size: 13px; color: var(--saas-text-secondary); }
.summary-val { font-size: 14px; font-weight: 600; color: var(--saas-text); }
.filter-row { display: flex; align-items: center; gap: 12px; }
.chart-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
.chart-card { padding: 4px; }
.chart-box { width: 100%; height: 280px; }
@media (max-width: 1200px) { .chart-grid { grid-template-columns: 1fr 1fr; } }
@media (max-width: 768px) { .chart-grid, .kpi-row { grid-template-columns: 1fr; } }
</style>
