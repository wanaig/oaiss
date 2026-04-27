<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import * as echarts from 'echarts'
import { useCarbonStore } from '../../store/carbon'
import { AUDIT_STATUS } from '../../config/constants'

const store = useCarbonStore()

const searchKeyword = ref('')
const timeDimension = ref('day')
const chartRefs = [ref(null), ref(null), ref(null), ref(null), ref(null), ref(null)]
const charts = []

const allAccounts = computed(() => store.accountList)
const totalQuota = computed(() => allAccounts.value.reduce((s, a) => s + a.carbonQuota, 0))
const approvedCount = computed(() => store.emissionReports.filter(r => r.auditStatus === AUDIT_STATUS.APPROVED).length)
const pendingCount = computed(() => store.emissionReports.filter(r => r.auditStatus === AUDIT_STATUS.PENDING).length)

const genLabels = () => {
  const now = new Date()
  return Array.from({ length: 12 }, (_, i) => {
    const d = new Date(now); d.setDate(d.getDate() - (11 - i))
    return `${d.getMonth() + 1}/${d.getDate()}`
  })
}
const genValues = (base, count = 12) => Array.from({ length: count }, () => Math.max(1, Math.round(base + (Math.random() - 0.5) * base * 0.6)))

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
  series: [{ name: title, type: 'line', data: data.values, smooth: true, areaStyle: { color: `${color}22` }, lineStyle: { color, width: 2 }, itemStyle: { color } }],
})

const buildPieOption = (data, title) => ({
  tooltip: { trigger: 'item' },
  title: { text: title, left: 'center', textStyle: { fontSize: 13, fontWeight: 600 } },
  series: [{ name: title, type: 'pie', radius: ['40%', '72%'], center: ['50%', '55%'], data: data.map(d => ({ ...d, name: d.label })), label: { formatter: '{b}: {d}%' } }],
})

const chartData = computed(() => {
  const labels = genLabels()
  const base = Math.max(5, Math.round(totalQuota.value / 500)) * 10
  return {
    labels,
    coinStatus: genValues(base, 12),
    trend: genValues(base * 3, 12),
    limit: genValues(base * 2, 12),
    emissionPie: [{ label: '个人', value: base * 4 }, { label: '国有企业', value: base * 10 }, { label: '私有企业', value: base * 6 }, { label: '海外企业', value: base * 3 }, { label: '公私合营', value: base * 2 }],
    emissionType: [{ label: '水体', value: base * 5 }, { label: '固体', value: base * 4 }, { label: '化学污染', value: base * 3 }, { label: '气体', value: base * 8 }, { label: '混合物', value: base * 2 }],
    activity: genValues(base * 5, 12),
  }
})

const initCharts = () => {
  const d = chartData.value
  const options = [
    buildBarOption({ labels: d.labels, values: d.coinStatus }, '碳币状况'),
    buildLineOption({ labels: d.labels, values: d.trend }, 'AI预测全区碳排放趋势', '#18a99a'),
    buildBarOption({ labels: d.labels, values: d.limit }, 'AI建议未来排放限额'),
    buildPieOption(d.emissionPie, '排放方式统计'),
    buildPieOption(d.emissionType, '碳排放类型统计'),
    buildLineOption({ labels: d.labels, values: d.activity }, '区域交易活跃度', '#e6a23c'),
  ]
  charts.forEach(c => c && c.dispose())
  charts.length = 0
  chartRefs.forEach((ref, i) => {
    if (ref.value) { const c = echarts.init(ref.value); c.setOption(options[i]); charts.push(c) }
  })
}

onMounted(initCharts)
watch(chartData, initCharts, { deep: true })
onBeforeUnmount(() => charts.forEach(c => c && c.dispose()))

const onQuery = () => {}
</script>

<template>
  <section class="dashboard-page">
    <el-card class="section-card" shadow="never">
      <el-breadcrumb separator="/">
        <el-breadcrumb-item>数据管理</el-breadcrumb-item>
        <el-breadcrumb-item>统计数据</el-breadcrumb-item>
      </el-breadcrumb>
    </el-card>

    <div class="overview-row">
      <el-card class="overview-card" shadow="never">
        <div class="overview-label">全系统碳配额</div>
        <div class="overview-value green">{{ totalQuota.toLocaleString() }}</div>
        <div class="overview-unit">单位</div>
      </el-card>
      <el-card class="overview-card" shadow="never">
        <div class="overview-label">已审核通过报告</div>
        <div class="overview-value teal">{{ approvedCount }}</div>
        <div class="overview-unit">份</div>
      </el-card>
      <el-card class="overview-card" shadow="never">
        <div class="overview-label">待审核报告</div>
        <div class="overview-value warning">{{ pendingCount }}</div>
        <div class="overview-unit">份</div>
      </el-card>
    </div>

    <el-card class="section-card" shadow="never">
      <div class="filter-row">
        <el-input v-model="searchKeyword" placeholder="搜索企业" clearable style="width: 220px; margin-right: 10px" />
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
.overview-value.warning { color: #e6a23c; }
.overview-unit { font-size: 12px; color: var(--text-secondary); margin-top: 4px; }
.filter-row { display: flex; align-items: center; }
.chart-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; }
.chart-card { padding: 4px; }
.chart-box { width: 100%; height: 280px; }
@media (max-width: 1200px) { .chart-grid { grid-template-columns: 1fr 1fr; } }
@media (max-width: 768px) { .chart-grid, .overview-row { grid-template-columns: 1fr; } }
</style>
