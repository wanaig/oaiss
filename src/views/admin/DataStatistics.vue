<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import * as echarts from 'echarts'

const queryForm = reactive({
  companyName: '',
  companyCode: '',
  keyword: '',
})

const appliedFilter = ref({
  companyName: '',
  companyCode: '',
  keyword: '',
})

const timeDimension = ref('month')

const companyPool = [
  { name: '华东发电集团', code: 'C-1001', keyword: '国有' },
  { name: '绿色能源科技', code: 'C-1002', keyword: '私有' },
  { name: '南方电网平台', code: 'C-1003', keyword: '公私合营' },
  { name: 'Blue Carbon Global', code: 'C-1004', keyword: '海外' },
  { name: '城市公用能源', code: 'C-1005', keyword: '个人' },
]

const DATA_BY_TIME = {
  day: {
    labels: ['周一', '周二', '周三', '周四', '周五', '周六', '周日'],
    coinStatus: [120, 132, 125, 146, 160, 171, 168],
    aiTrend: [720, 705, 694, 680, 672, 663, 655],
    aiQuota: [690, 682, 676, 664, 658, 646, 640],
    activeTrade: [48, 52, 49, 56, 61, 64, 60],
    methodPie: [
      { name: '个人', value: 12 },
      { name: '国有企业', value: 35 },
      { name: '私有企业', value: 18 },
      { name: '海外企业', value: 14 },
      { name: '公私合营企业', value: 21 },
    ],
    typePie: [
      { name: '水体排放', value: 16 },
      { name: '固体排放', value: 15 },
      { name: '化学污染排放', value: 19 },
      { name: '气体排放', value: 32 },
      { name: '混合物排放', value: 18 },
    ],
  },
  month: {
    labels: ['1月', '2月', '3月', '4月', '5月', '6月'],
    coinStatus: [900, 1020, 1140, 1260, 1310, 1450],
    aiTrend: [4100, 3980, 3870, 3710, 3600, 3490],
    aiQuota: [3960, 3820, 3710, 3590, 3470, 3360],
    activeTrade: [280, 320, 358, 372, 390, 412],
    methodPie: [
      { name: '个人', value: 10 },
      { name: '国有企业', value: 38 },
      { name: '私有企业', value: 20 },
      { name: '海外企业', value: 13 },
      { name: '公私合营企业', value: 19 },
    ],
    typePie: [
      { name: '水体排放', value: 14 },
      { name: '固体排放', value: 17 },
      { name: '化学污染排放', value: 21 },
      { name: '气体排放', value: 30 },
      { name: '混合物排放', value: 18 },
    ],
  },
  year: {
    labels: ['2021', '2022', '2023', '2024', '2025', '2026'],
    coinStatus: [8800, 9600, 10800, 12200, 13600, 14900],
    aiTrend: [52000, 50300, 48600, 46800, 45100, 43800],
    aiQuota: [49800, 48200, 46500, 44700, 43200, 42000],
    activeTrade: [2900, 3360, 3800, 4160, 4480, 4720],
    methodPie: [
      { name: '个人', value: 8 },
      { name: '国有企业', value: 42 },
      { name: '私有企业', value: 19 },
      { name: '海外企业', value: 12 },
      { name: '公私合营企业', value: 19 },
    ],
    typePie: [
      { name: '水体排放', value: 13 },
      { name: '固体排放', value: 18 },
      { name: '化学污染排放', value: 22 },
      { name: '气体排放', value: 29 },
      { name: '混合物排放', value: 18 },
    ],
  },
}

const chartCoinBarRef = ref(null)
const chartTrendLineRef = ref(null)
const chartQuotaBarRef = ref(null)
const chartMethodPieRef = ref(null)
const chartTypePieRef = ref(null)
const chartTradeLineRef = ref(null)

const chartInstances = []

const filteredCompanies = computed(() => {
  const f = appliedFilter.value
  const name = f.companyName.trim().toLowerCase()
  const code = f.companyCode.trim().toLowerCase()
  const keyword = f.keyword.trim().toLowerCase()

  return companyPool.filter((item) => {
    const nameMatch = !name || item.name.toLowerCase().includes(name)
    const codeMatch = !code || item.code.toLowerCase().includes(code)
    const keyMatch = !keyword || item.keyword.toLowerCase().includes(keyword)
    return nameMatch && codeMatch && keyMatch
  })
})

const filterFactor = computed(() => {
  if (filteredCompanies.value.length === 0) {
    return 0
  }
  return filteredCompanies.value.length / companyPool.length
})

const currentData = computed(() => {
  const base = DATA_BY_TIME[timeDimension.value]
  const factor = filterFactor.value
  const convert = (arr) => arr.map((n) => Math.round(n * factor))

  return {
    labels: base.labels,
    coinStatus: convert(base.coinStatus),
    aiTrend: convert(base.aiTrend),
    aiQuota: convert(base.aiQuota),
    activeTrade: convert(base.activeTrade),
    methodPie: base.methodPie,
    typePie: base.typePie,
  }
})

const calcPercentText = (value, data) => {
  const total = data.reduce((sum, n) => sum + n, 0) || 1
  return `${((value / total) * 100).toFixed(2)}%`
}

const buildBarOption = (title, labels, seriesData, color) => ({
  title: { text: title, left: 'center', textStyle: { fontSize: 14, fontWeight: 600 } },
  tooltip: {
    trigger: 'axis',
    formatter: (params) => {
      const row = params[0]
      return `${row.name}<br/>数值：${row.value}<br/>占比：${calcPercentText(row.value, seriesData)}`
    },
  },
  grid: { left: 50, right: 24, top: 52, bottom: 28 },
  xAxis: { type: 'category', data: labels },
  yAxis: { type: 'value' },
  series: [
    {
      type: 'bar',
      data: seriesData,
      barMaxWidth: 30,
      itemStyle: {
        color,
        borderRadius: [5, 5, 0, 0],
      },
    },
  ],
})

const buildLineOption = (title, labels, seriesData, color) => ({
  title: { text: title, left: 'center', textStyle: { fontSize: 14, fontWeight: 600 } },
  tooltip: {
    trigger: 'axis',
    formatter: (params) => {
      const row = params[0]
      return `${row.name}<br/>数值：${row.value}<br/>占比：${calcPercentText(row.value, seriesData)}`
    },
  },
  grid: { left: 50, right: 24, top: 52, bottom: 28 },
  xAxis: { type: 'category', data: labels },
  yAxis: { type: 'value' },
  series: [
    {
      type: 'line',
      smooth: true,
      data: seriesData,
      symbolSize: 7,
      lineStyle: { width: 3, color },
      itemStyle: { color },
      areaStyle: {
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: 'rgba(31, 178, 147, 0.35)' },
          { offset: 1, color: 'rgba(31, 178, 147, 0.04)' },
        ]),
      },
    },
  ],
})

const buildPieOption = (title, pieData) => ({
  title: { text: title, left: 'center', textStyle: { fontSize: 14, fontWeight: 600 } },
  tooltip: {
    trigger: 'item',
    formatter: '{b}<br/>数值：{c}<br/>占比：{d}%',
  },
  legend: { left: 'center', bottom: 2 },
  series: [
    {
      type: 'pie',
      radius: ['38%', '64%'],
      center: ['50%', '48%'],
      label: { formatter: '{b}: {d}%' },
      data: pieData,
    },
  ],
})

const getChartConfigs = () => {
  const d = currentData.value
  return [
    {
      ref: chartCoinBarRef,
      option: buildBarOption('碳币状况柱状图', d.labels, d.coinStatus, '#2fb38f'),
    },
    {
      ref: chartTrendLineRef,
      option: buildLineOption('AI预测全区碳排放趋势折线图', d.labels, d.aiTrend, '#1fa49b'),
    },
    {
      ref: chartQuotaBarRef,
      option: buildBarOption('AI建议未来排放限额柱状图', d.labels, d.aiQuota, '#6ccd84'),
    },
    {
      ref: chartMethodPieRef,
      option: buildPieOption('排放方式统计饼图', d.methodPie),
    },
    {
      ref: chartTypePieRef,
      option: buildPieOption('碳排放类型统计饼图', d.typePie),
    },
    {
      ref: chartTradeLineRef,
      option: buildLineOption('区域交易活跃度折线图', d.labels, d.activeTrade, '#4fa7d6'),
    },
  ]
}

const renderCharts = async () => {
  await nextTick()
  const configs = getChartConfigs()

  configs.forEach(({ ref: domRef, option }, index) => {
    const dom = domRef.value
    if (!dom) {
      return
    }

    if (!chartInstances[index]) {
      chartInstances[index] = echarts.init(dom)
    }

    chartInstances[index].setOption(option, true)
  })
}

const onSearch = () => {
  appliedFilter.value = {
    companyName: queryForm.companyName,
    companyCode: queryForm.companyCode,
    keyword: queryForm.keyword,
  }
  ElMessage.success('筛选完成')
}

const onResize = () => {
  chartInstances.forEach((chart) => {
    if (chart) {
      chart.resize()
    }
  })
}

watch([timeDimension, filteredCompanies], () => {
  renderCharts()
})

onMounted(() => {
  renderCharts()
  window.addEventListener('resize', onResize)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', onResize)
  chartInstances.forEach((chart) => {
    if (chart) {
      chart.dispose()
    }
  })
})
</script>

<template>
  <section class="stats-page">
    <el-card class="section-card" shadow="never">
      <el-breadcrumb separator="/">
        <el-breadcrumb-item>数据管理</el-breadcrumb-item>
        <el-breadcrumb-item>统计数据</el-breadcrumb-item>
      </el-breadcrumb>
    </el-card>

    <el-card class="section-card" shadow="never">
      <div class="search-row">
        <div class="search-left">
          <el-input v-model="queryForm.companyName" placeholder="公司名称输入" clearable />
          <el-input v-model="queryForm.companyCode" placeholder="公司编号输入" clearable />
          <el-input v-model="queryForm.keyword" placeholder="文本输入" clearable />
          <el-button type="primary" @click="onSearch">搜索</el-button>
        </div>

        <div class="search-right">
          <span class="time-label">时间维度：</span>
          <el-radio-group v-model="timeDimension">
            <el-radio-button label="day">日</el-radio-button>
            <el-radio-button label="month">月</el-radio-button>
            <el-radio-button label="year">年</el-radio-button>
          </el-radio-group>
        </div>
      </div>
    </el-card>

    <div class="charts-grid">
      <el-card class="chart-card" shadow="never"><div ref="chartCoinBarRef" class="chart-box" /></el-card>
      <el-card class="chart-card" shadow="never"><div ref="chartTrendLineRef" class="chart-box" /></el-card>
      <el-card class="chart-card" shadow="never"><div ref="chartQuotaBarRef" class="chart-box" /></el-card>
      <el-card class="chart-card" shadow="never"><div ref="chartMethodPieRef" class="chart-box" /></el-card>
      <el-card class="chart-card" shadow="never"><div ref="chartTypePieRef" class="chart-box" /></el-card>
      <el-card class="chart-card" shadow="never"><div ref="chartTradeLineRef" class="chart-box" /></el-card>
    </div>
  </section>
</template>

<style scoped>
.stats-page {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.section-card,
.chart-card {
  border: 1px solid var(--border-color);
  border-radius: 12px;
}

.search-row {
  display: flex;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;
}

.search-left {
  display: grid;
  grid-template-columns: repeat(4, minmax(130px, 1fr));
  gap: 10px;
  flex: 1;
}

.search-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.time-label {
  color: var(--text-secondary);
  font-size: 13px;
}

.charts-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(280px, 1fr));
  gap: 12px;
}

.chart-box {
  width: 100%;
  height: 330px;
}

@media (max-width: 1280px) {
  .search-left {
    grid-template-columns: repeat(2, minmax(180px, 1fr));
  }
}

@media (max-width: 768px) {
  .search-left,
  .charts-grid {
    grid-template-columns: 1fr;
  }

  .search-right {
    width: 100%;
    justify-content: flex-start;
  }
}
</style>
