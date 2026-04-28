<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import * as echarts from 'echarts'
import { useCarbonStore } from '../../store/carbon'
import { AUDIT_STATUS } from '../../config/constants'
import PageSaaSWrapper from '../../components/PageSaaSWrapper.vue'

const store = useCarbonStore()

const searchKeyword = ref(''); const timeDimension = ref('day')
const chartRefs = [ref(null), ref(null), ref(null), ref(null), ref(null), ref(null)]
const charts = []

const totalUsers = computed(() => store.statistics?.totalUsers ?? '-')
const totalReports = computed(() => store.statistics?.totalReports ?? '-')
const totalTransactions = computed(() => store.statistics?.totalTransactions ?? '-')

const genLabels = () => { const n = new Date(); return Array.from({ length: 12 }, (_, i) => { const d = new Date(n); d.setDate(d.getDate() - (11 - i)); return `${d.getMonth() + 1}/${d.getDate()}` }) }
const genValues = (base, c = 12) => Array.from({ length: c }, () => Math.max(1, Math.round(base + (Math.random() - 0.5) * base * 0.6)))

const buildBarOption = (data, title) => ({ tooltip: { trigger: 'axis' }, grid: { left: 40, right: 20, top: 40, bottom: 30 }, title: { text: title, left: 'center', textStyle: { fontSize: 13, fontWeight: 600 } }, xAxis: { type: 'category', data: data.labels }, yAxis: { type: 'value' }, series: [{ name: title, type: 'bar', data: data.values, itemStyle: { color: '#4361ee', borderRadius: [4, 4, 0, 0] } }] })
const buildLineOption = (data, title, color = '#4361ee') => ({ tooltip: { trigger: 'axis' }, grid: { left: 40, right: 20, top: 40, bottom: 30 }, title: { text: title, left: 'center', textStyle: { fontSize: 13, fontWeight: 600 } }, xAxis: { type: 'category', data: data.labels }, yAxis: { type: 'value' }, series: [{ name: title, type: 'line', data: data.values, smooth: true, areaStyle: { color: `${color}22` }, lineStyle: { color, width: 2 }, itemStyle: { color } }] })
const buildPieOption = (data, title) => ({ tooltip: { trigger: 'item' }, title: { text: title, left: 'center', textStyle: { fontSize: 13, fontWeight: 600 } }, series: [{ name: title, type: 'pie', radius: ['40%', '72%'], center: ['50%', '55%'], data: data.map(d => ({ ...d, name: d.label })), label: { formatter: '{b}: {d}%' } }] })

const chartData = computed(() => {
  const labels = genLabels(); const base = Math.max(5, Math.round((totalReports.value || 100) / 10)) * 10
  return { labels, coinStatus: genValues(base), trend: genValues(base * 3), limit: genValues(base * 2), emissionPie: [{ label: '个人', value: base * 4 }, { label: '国有企业', value: base * 10 }, { label: '私有企业', value: base * 6 }, { label: '海外企业', value: base * 3 }, { label: '公私合营', value: base * 2 }], emissionType: [{ label: '水体', value: base * 5 }, { label: '固体', value: base * 4 }, { label: '化学', value: base * 3 }, { label: '气体', value: base * 8 }, { label: '混合物', value: base * 2 }], activity: genValues(base * 5) }
})

const initCharts = () => {
  const d = chartData.value; const options = [buildBarOption({ labels: d.labels, values: d.coinStatus }, '碳币状况'), buildLineOption({ labels: d.labels, values: d.trend }, 'AI预测碳排放趋势', '#2ec4b6'), buildBarOption({ labels: d.labels, values: d.limit }, 'AI建议排放限额'), buildPieOption(d.emissionPie, '排放方式占比'), buildPieOption(d.emissionType, '排放类型占比'), buildLineOption({ labels: d.labels, values: d.activity }, '交易活跃度', '#f9a826')]
  charts.forEach(c => c && c.dispose()); charts.length = 0
  chartRefs.forEach((ref, i) => { if (ref.value) { const c = echarts.init(ref.value, null, { renderer: 'canvas' }); c.setOption(options[i]); charts.push(c) } })
}

onMounted(async () => { await Promise.all([store.fetchStatistics(), store.fetchEmissionReports()]); initCharts() })
watch(chartData, initCharts, { deep: true })
onBeforeUnmount(() => charts.forEach(c => c && c.dispose()))
</script>

<template>
  <PageSaaSWrapper title="数据统计" description="系统级碳交易数据分析看板">
    <div class="kpi-row">
      <el-card shadow="never" class="kpi-card"><div class="kpi-label">用户总数</div><div class="kpi-value">{{ totalUsers }}</div></el-card>
      <el-card shadow="never" class="kpi-card"><div class="kpi-label">报告总数</div><div class="kpi-value" style="color:var(--saas-success)">{{ totalReports }}</div></el-card>
      <el-card shadow="never" class="kpi-card"><div class="kpi-label">交易总数</div><div class="kpi-value" style="color:var(--saas-primary)">{{ totalTransactions }}</div></el-card>
    </div>

    <el-card shadow="never">
      <div class="filter-row">
        <el-input v-model="searchKeyword" placeholder="搜索企业" clearable style="width:200px" />
        <el-radio-group v-model="timeDimension"><el-radio-button value="day">日</el-radio-button><el-radio-button value="month">月</el-radio-button><el-radio-button value="year">年</el-radio-button></el-radio-group>
      </div>
    </el-card>

    <div class="chart-grid">
      <el-card v-for="(ref, i) in chartRefs" :key="i" shadow="never" class="chart-card"><div :ref="chartRefs[i]" class="chart-box" /></el-card>
    </div>
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
