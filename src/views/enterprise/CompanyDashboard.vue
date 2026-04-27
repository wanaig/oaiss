<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import * as echarts from 'echarts'
import { useCarbonStore } from '../../store/carbon'
import { AUDIT_STATUS } from '../../config/constants'

const store = useCarbonStore()
const acc = computed(() => store.currentAccount)

const approved = computed(() =>
  store.emissionReports.filter(r => r.companyId === store.currentCompanyId && r.auditStatus === AUDIT_STATUS.APPROVED)
)
const totalEmission = computed(() => approved.value.reduce((s, r) => s + r.emission, 0))
const totalQuota = computed(() => totalEmission.value)
const creditScore = computed(() => acc.value ? acc.value.creditScore : 0)

const searchKeyword = ref('')
const timeDimension = ref('day')
const chartRefs = [ref(null), ref(null), ref(null), ref(null), ref(null), ref(null)]
const charts = []

const buildBarOption = (data, title) => ({
  tooltip: { trigger: 'axis' },
  grid: { left: 40, right: 20, top: 40, bottom: 30 },
  title: { text: title, left: 'center', textStyle: { fontSize: 13, fontWeight: 600 } },
  xAxis: { type: 'category', data: data.labels },
  yAxis: { type: 'value' },
  series: [{ name: title, type: 'bar', data: data.values, itemStyle: { color: '#18a99a', borderRadius: [4, 4, 0, 0] } }],
})

const buildLineOption = (data, title, color = '#409eff') => ({
  tooltip: { trigger: 'axis' },
  grid: { left: 40, right: 20, top: 40, bottom: 30 },
  title: { text: title, left: 'center', textStyle: { fontSize: 13, fontWeight: 600 } },
  xAxis: { type: 'category', data: data.labels },
  yAxis: { type: 'value' },
  series: [{
    name: title, type: 'line', data: data.values,
    smooth: true, areaStyle: { color: `${color}22` },
    lineStyle: { color, width: 2 }, itemStyle: { color },
  }],
})

const buildPieOption = (data, title) => ({
  tooltip: { trigger: 'item' },
  title: { text: title, left: 'center', textStyle: { fontSize: 13, fontWeight: 600 } },
  series: [{
    name: title, type: 'pie', radius: ['40%', '72%'],
    center: ['50%', '55%'], data: data.map(d => ({ ...d, name: d.label })),
    label: { formatter: '{b}: {d}%' },
  }],
})

const genLabels = () => {
  const now = new Date()
  const labels = []
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now)
    d.setDate(d.getDate() - i)
    labels.push(`${d.getMonth() + 1}/${d.getDate()}`)
  }
  return labels
}

const genValues = (base, count = 12) => Array.from({ length: count }, () => Math.max(0, Math.round(base + (Math.random() - 0.5) * base * 0.6)))

const currentChartData = computed(() => {
  const labels = genLabels()
  const base = Math.max(10, Math.round(totalEmission.value / 100)) * 10
  return {
    labels,
    tradeCount: genValues(base, 12),
    trend: genValues(Math.max(50, base * 3), 12),
    monthlyBase: genValues(Math.max(30, base * 2), 12),
    emissionPie: [
      { label: '气体排放', value: Math.round(totalEmission.value * 0.35) },
      { label: '水体排放', value: Math.round(totalEmission.value * 0.15) },
      { label: '固体排放', value: Math.round(totalEmission.value * 0.20) },
      { label: '预计排放', value: Math.round(totalEmission.value * 0.18) },
      { label: '额定排放', value: Math.round(totalEmission.value * 0.12) },
    ],
    tradePie: [
      { label: '交易支出', value: Math.round(totalQuota.value * 0.25) },
      { label: '碳币转化', value: Math.round(totalQuota.value * 0.20) },
      { label: '区块链生成', value: Math.round(totalQuota.value * 0.15) },
      { label: '原有配额', value: Math.round(totalQuota.value * 0.22) },
      { label: '购入额度', value: Math.round(totalQuota.value * 0.18) },
    ],
    credit: genValues(Math.max(10, creditScore.value), 12),
  }
})

const initCharts = () => {
  const d = currentChartData.value
  const options = [
    buildBarOption({ labels: d.labels, values: d.tradeCount }, '碳交易总笔数'),
    buildLineOption({ labels: d.labels, values: d.trend }, 'AI预测排放趋势', '#18a99a'),
    buildBarOption({ labels: d.labels, values: d.monthlyBase }, 'AI建议未来每月排放量'),
    buildPieOption(d.emissionPie, '碳排放统计'),
    buildPieOption(d.tradePie, '碳交易统计'),
    buildLineOption({ labels: d.labels, values: d.credit }, '信用积分趋势', '#e6a23c'),
  ]

  charts.forEach((c, i) => { if (c) c.dispose() })
  charts.length = 0
  chartRefs.forEach((ref, i) => {
    if (ref.value) {
      const chart = echarts.init(ref.value)
      chart.setOption(options[i])
      charts.push(chart)
    }
  })
}

onMounted(() => { initCharts() })
watch(currentChartData, () => { initCharts() }, { deep: true })
onBeforeUnmount(() => { charts.forEach(c => c && c.dispose()) })

const onQuery = () => {}
</script>

<template>
  <section class="dashboard-page">
    <el-card class="section-card" shadow="never">
      <el-breadcrumb separator="/">
        <el-breadcrumb-item :to="{ path: '/enterprise/account/center' }">首页</el-breadcrumb-item>
        <el-breadcrumb-item>本公司信息</el-breadcrumb-item>
        <el-breadcrumb-item>数据可视化</el-breadcrumb-item>
      </el-breadcrumb>
    </el-card>

    <div class="overview-row">
      <el-card class="overview-card" shadow="never">
        <div class="overview-label">碳配额总数</div>
        <div class="overview-value green">{{ acc ? acc.carbonQuota.toLocaleString() : 0 }}</div>
        <div class="overview-unit">单位碳配额</div>
      </el-card>
      <el-card class="overview-card" shadow="never">
        <div class="overview-label">累计审核排放量</div>
        <div class="overview-value teal">{{ totalEmission.toLocaleString() }}</div>
        <div class="overview-unit">tCO2e</div>
      </el-card>
      <el-card class="overview-card" shadow="never">
        <div class="overview-label">信用积分</div>
        <div class="overview-value blue">{{ creditScore }}</div>
        <div class="overview-unit">分</div>
      </el-card>
    </div>

    <el-card class="section-card" shadow="never">
      <div class="filter-row">
        <el-input v-model="searchKeyword" placeholder="搜索资产编号" clearable style="width: 220px; margin-right: 10px" />
        <el-radio-group v-model="timeDimension">
          <el-radio-button value="day">日</el-radio-button>
          <el-radio-button value="month">月</el-radio-button>
          <el-radio-button value="year">年</el-radio-button>
        </el-radio-group>
        <el-button type="primary" @click="onQuery" style="margin-left: 10px">查询</el-button>
      </div>
    </el-card>

    <div class="chart-grid">
      <el-card class="chart-card" shadow="never"><div ref="chartRefs[0]" class="chart-box" /></el-card>
      <el-card class="chart-card" shadow="never"><div ref="chartRefs[1]" class="chart-box" /></el-card>
      <el-card class="chart-card" shadow="never"><div ref="chartRefs[2]" class="chart-box" /></el-card>
      <el-card class="chart-card" shadow="never"><div ref="chartRefs[3]" class="chart-box" /></el-card>
      <el-card class="chart-card" shadow="never"><div ref="chartRefs[4]" class="chart-box" /></el-card>
      <el-card class="chart-card" shadow="never"><div ref="chartRefs[5]" class="chart-box" /></el-card>
    </div>
  </section>
</template>

<style scoped>
.dashboard-page { display: flex; flex-direction: column; gap: 14px; }
.section-card { border: 1px solid var(--border-color); border-radius: 12px; }
.overview-row { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; }
.overview-card { text-align: center; padding: 8px 0; }
.overview-label { font-size: 13px; color: var(--text-secondary); margin-bottom: 6px; }
.overview-value { font-size: 28px; font-weight: 700; }
.overview-value.green { color: #67c23a; }
.overview-value.teal { color: #18a99a; }
.overview-value.blue { color: #409eff; }
.overview-unit { font-size: 12px; color: var(--text-secondary); margin-top: 4px; }
.filter-row { display: flex; align-items: center; }
.chart-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; }
.chart-card { padding: 4px; }
.chart-box { width: 100%; height: 280px; }
@media (max-width: 1200px) { .chart-grid { grid-template-columns: 1fr 1fr; } }
@media (max-width: 768px) { .chart-grid, .overview-row { grid-template-columns: 1fr; } }
</style>
