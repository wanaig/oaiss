<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import * as echarts from 'echarts'
import { useCarbonStore } from '../../store/carbon'
import { AUDIT_STATUS } from '../../config/constants'
import PageSaaSWrapper from '../../components/PageSaaSWrapper.vue'

const store = useCarbonStore()
const acc = computed(() => store.currentAccount)

const approved = computed(() => store.emissionReports.filter(r => r.auditStatus === AUDIT_STATUS.APPROVED))
const totalEmission = computed(() => approved.value.reduce((s, r) => s + (r.emission || 0), 0))
const totalQuota = computed(() => totalEmission.value)
const creditScore = computed(() => acc.value?.creditScore ?? 0)

const searchKeyword = ref(''); const timeDimension = ref('day')
const chartRefs = [ref(null), ref(null), ref(null), ref(null), ref(null), ref(null)]
const charts = []

const buildBarOption = (data, title) => ({ tooltip: { trigger: 'axis' }, grid: { left: 40, right: 20, top: 40, bottom: 30 }, title: { text: title, left: 'center', textStyle: { fontSize: 13, fontWeight: 600 } }, xAxis: { type: 'category', data: data.labels }, yAxis: { type: 'value' }, series: [{ name: title, type: 'bar', data: data.values, itemStyle: { color: '#4361ee', borderRadius: [4, 4, 0, 0] } }] })
const buildLineOption = (data, title, color = '#4361ee') => ({ tooltip: { trigger: 'axis' }, grid: { left: 40, right: 20, top: 40, bottom: 30 }, title: { text: title, left: 'center', textStyle: { fontSize: 13, fontWeight: 600 } }, xAxis: { type: 'category', data: data.labels }, yAxis: { type: 'value' }, series: [{ name: title, type: 'line', data: data.values, smooth: true, areaStyle: { color: `${color}22` }, lineStyle: { color, width: 2 }, itemStyle: { color } }] })
const buildPieOption = (data, title) => ({ tooltip: { trigger: 'item' }, title: { text: title, left: 'center', textStyle: { fontSize: 13, fontWeight: 600 } }, series: [{ name: title, type: 'pie', radius: ['40%', '72%'], center: ['50%', '55%'], data: data.map(d => ({ ...d, name: d.label })), label: { formatter: '{b}: {d}%' } }] })

const genLabels = () => { const n = new Date(); return Array.from({ length: 12 }, (_, i) => { const d = new Date(n); d.setDate(d.getDate() - (11 - i)); return `${d.getMonth() + 1}/${d.getDate()}` }) }
const genValues = (base, c = 12) => Array.from({ length: c }, () => Math.max(0, Math.round(base + (Math.random() - 0.5) * base * 0.6)))

const currentChartData = computed(() => {
  const labels = genLabels(); const base = Math.max(10, Math.round(totalEmission.value / 100)) * 10
  return { labels, tradeCount: genValues(base), trend: genValues(Math.max(50, base * 3)), monthlyBase: genValues(Math.max(30, base * 2)), emissionPie: [{ label: '气体排放', value: Math.round(totalEmission.value * 0.35) }, { label: '水体排放', value: Math.round(totalEmission.value * 0.15) }, { label: '固体排放', value: Math.round(totalEmission.value * 0.20) }, { label: '预计排放', value: Math.round(totalEmission.value * 0.18) }, { label: '额定排放', value: Math.round(totalEmission.value * 0.12) }], tradePie: [{ label: '交易支出', value: Math.round((totalQuota.value || 0) * 0.25) }, { label: '碳币转化', value: Math.round((totalQuota.value || 0) * 0.20) }, { label: '区块链生成', value: Math.round((totalQuota.value || 0) * 0.15) }, { label: '原有配额', value: Math.round((totalQuota.value || 0) * 0.22) }, { label: '购入额度', value: Math.round((totalQuota.value || 0) * 0.18) }], credit: genValues(Math.max(10, creditScore.value)) }
})

const initCharts = () => {
  const d = currentChartData.value
  const options = [buildBarOption({ labels: d.labels, values: d.tradeCount }, '碳交易笔数'), buildLineOption({ labels: d.labels, values: d.trend }, 'AI预测排放趋势', '#2ec4b6'), buildBarOption({ labels: d.labels, values: d.monthlyBase }, 'AI建议排放量'), buildPieOption(d.emissionPie, '碳排放统计'), buildPieOption(d.tradePie, '碳交易统计'), buildLineOption({ labels: d.labels, values: d.credit }, '信用积分趋势', '#f9a826')]
  charts.forEach(c => c && c.dispose()); charts.length = 0
  chartRefs.forEach((ref, i) => { if (ref.value) { const c = echarts.init(ref.value, null, { renderer: 'canvas' }); c.setOption(options[i]); charts.push(c) } })
}

onMounted(async () => { await Promise.all([store.fetchEmissionReports(), store.fetchAccount()]); initCharts() })
watch(currentChartData, initCharts, { deep: true })
onBeforeUnmount(() => charts.forEach(c => c && c.dispose()))
</script>

<template>
  <PageSaaSWrapper title="数据可视化" description="企业碳资产数据分析看板">
    <div class="kpi-row">
      <el-card shadow="never" class="kpi-card"><div class="kpi-label">碳配额</div><div class="kpi-value" style="color:var(--saas-success)">{{ (acc ? (acc.availableQuota ?? acc.carbonQuota) : 0).toLocaleString() }}</div><div class="kpi-unit">单位</div></el-card>
      <el-card shadow="never" class="kpi-card"><div class="kpi-label">累计排放</div><div class="kpi-value" style="color:var(--saas-primary)">{{ totalEmission.toLocaleString() }}</div><div class="kpi-unit">tCO2e</div></el-card>
      <el-card shadow="never" class="kpi-card"><div class="kpi-label">信用积分</div><div class="kpi-value" style="color:var(--saas-warning)">{{ creditScore }}</div><div class="kpi-unit">分</div></el-card>
    </div>

    <el-card shadow="never">
      <div class="filter-row">
        <el-input v-model="searchKeyword" placeholder="搜索资产编号" clearable style="width:200px" />
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
.kpi-label { font-size: 13px; color: var(--saas-text-secondary); margin-bottom: 4px; }
.kpi-value { font-size: 28px; font-weight: 700; }
.kpi-unit { font-size: 12px; color: var(--saas-text-light); margin-top: 2px; }
.filter-row { display: flex; align-items: center; gap: 12px; }
.chart-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
.chart-card { padding: 4px; }
.chart-box { width: 100%; height: 280px; }
@media (max-width: 1200px) { .chart-grid { grid-template-columns: 1fr 1fr; } }
@media (max-width: 768px) { .chart-grid, .kpi-row { grid-template-columns: 1fr; } }
</style>
