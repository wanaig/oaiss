<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import * as echarts from 'echarts'

const queryForm = reactive({
  assetNo: '',
  otherCondition: '',
  keyword: '',
})

const appliedFilters = ref({
  assetNo: '',
  otherCondition: '',
  keyword: '',
})

const timeDimension = ref('month')

const assetPool = [
  { assetNo: 'AST-1001', other: '发电', keyword: '华东' },
  { assetNo: 'AST-1002', other: '电网', keyword: '华南' },
  { assetNo: 'AST-1003', other: '化工', keyword: '华北' },
  { assetNo: 'AST-1004', other: '钢铁', keyword: '西南' },
]

const DATA_BY_TIME = {
  day: {
    labels: ['周一', '周二', '周三', '周四', '周五', '周六', '周日'],
    tradeCount: [18, 22, 25, 19, 27, 30, 24],
    aiTrend: [82, 86, 80, 89, 93, 90, 88],
    aiSuggest: [78, 79, 83, 82, 85, 87, 84],
    creditTrend: [680, 688, 692, 695, 701, 707, 710],
    summary: {
      carbonCoinTotal: 12650,
      carbonQuotaTotal: 4320,
      creditScore: 710,
    },
    emissionPie: [
      { name: '气体排放量', value: 31 },
      { name: '水体排放量', value: 17 },
      { name: '固体排放量', value: 14 },
      { name: '预计排放量', value: 24 },
      { name: '额定排放量', value: 14 },
    ],
    tradePie: [
      { name: '交易支出', value: 29 },
      { name: '碳币转化量', value: 22 },
      { name: '区块链生成', value: 16 },
      { name: '原有', value: 13 },
      { name: '碳额度购入', value: 20 },
    ],
  },
  month: {
    labels: ['1月', '2月', '3月', '4月', '5月', '6月'],
    tradeCount: [126, 138, 145, 160, 173, 181],
    aiTrend: [502, 495, 488, 470, 463, 455],
    aiSuggest: [490, 482, 476, 458, 446, 438],
    creditTrend: [652, 668, 679, 691, 703, 716],
    summary: {
      carbonCoinTotal: 86200,
      carbonQuotaTotal: 24800,
      creditScore: 716,
    },
    emissionPie: [
      { name: '气体排放量', value: 35 },
      { name: '水体排放量', value: 15 },
      { name: '固体排放量', value: 10 },
      { name: '预计排放量', value: 22 },
      { name: '额定排放量', value: 18 },
    ],
    tradePie: [
      { name: '交易支出', value: 32 },
      { name: '碳币转化量', value: 26 },
      { name: '区块链生成', value: 14 },
      { name: '原有', value: 11 },
      { name: '碳额度购入', value: 17 },
    ],
  },
  year: {
    labels: ['2021', '2022', '2023', '2024', '2025', '2026'],
    tradeCount: [920, 1060, 1235, 1450, 1598, 1710],
    aiTrend: [6200, 6050, 5860, 5620, 5440, 5290],
    aiSuggest: [5980, 5790, 5600, 5430, 5240, 5090],
    creditTrend: [520, 565, 610, 658, 695, 730],
    summary: {
      carbonCoinTotal: 516000,
      carbonQuotaTotal: 148000,
      creditScore: 730,
    },
    emissionPie: [
      { name: '气体排放量', value: 38 },
      { name: '水体排放量', value: 13 },
      { name: '固体排放量', value: 11 },
      { name: '预计排放量', value: 20 },
      { name: '额定排放量', value: 18 },
    ],
    tradePie: [
      { name: '交易支出', value: 34 },
      { name: '碳币转化量', value: 24 },
      { name: '区块链生成', value: 15 },
      { name: '原有', value: 10 },
      { name: '碳额度购入', value: 17 },
    ],
  },
}

const chartTradeBarRef = ref(null)
const chartTrendLineRef = ref(null)
const chartSuggestBarRef = ref(null)
const chartEmissionPieRef = ref(null)
const chartTradePieRef = ref(null)
const chartCreditLineRef = ref(null)

const chartInstances = []

const filteredAssets = computed(() => {
  const f = appliedFilters.value
  const assetNo = f.assetNo.trim().toLowerCase()
  const otherCondition = f.otherCondition.trim().toLowerCase()
  const keyword = f.keyword.trim().toLowerCase()

  return assetPool.filter((item) => {
    const matchAssetNo = !assetNo || item.assetNo.toLowerCase().includes(assetNo)
    const matchOther = !otherCondition || item.other.toLowerCase().includes(otherCondition)
    const matchKeyword = !keyword || item.keyword.toLowerCase().includes(keyword)
    return matchAssetNo && matchOther && matchKeyword
  })
})

const filteredFactor = computed(() => {
  if (filteredAssets.value.length === 0) {
    return 0
  }
  return filteredAssets.value.length / assetPool.length
})

const currentData = computed(() => {
  const base = DATA_BY_TIME[timeDimension.value]
  const factor = filteredFactor.value
  const round = (n) => Math.round(n)

  return {
    labels: base.labels,
    tradeCount: base.tradeCount.map((v) => round(v * factor)),
    aiTrend: base.aiTrend.map((v) => round(v * factor)),
    aiSuggest: base.aiSuggest.map((v) => round(v * factor)),
    creditTrend: base.creditTrend.map((v) => round(v * (0.9 + factor * 0.1))),
    summary: {
      carbonCoinTotal: round(base.summary.carbonCoinTotal * factor),
      carbonQuotaTotal: round(base.summary.carbonQuotaTotal * factor),
      creditScore: round(base.summary.creditScore * (0.9 + factor * 0.1)),
    },
    emissionPie: base.emissionPie,
    tradePie: base.tradePie,
  }
})

const overviewCards = computed(() => [
  { label: '碳币总数', value: currentData.value.summary.carbonCoinTotal, unit: '枚' },
  { label: '碳额度总数', value: currentData.value.summary.carbonQuotaTotal, unit: 'tCO2e' },
  { label: '信用积分', value: currentData.value.summary.creditScore, unit: '分' },
])

const percentFormatter = (params, sourceArr) => {
  const total = sourceArr.reduce((sum, n) => sum + n, 0) || 1
  const percent = ((params.value / total) * 100).toFixed(2)
  return `${params.name}<br/>数值：${params.value}<br/>占比：${percent}%`
}

const buildBarOption = (title, labels, data, color) => ({
  title: { text: title, left: 'center', textStyle: { fontSize: 14, fontWeight: 600 } },
  tooltip: {
    trigger: 'axis',
    formatter: (params) => percentFormatter(params[0], data),
  },
  grid: { left: 50, right: 24, top: 50, bottom: 28 },
  xAxis: { type: 'category', data: labels },
  yAxis: { type: 'value' },
  series: [
    {
      type: 'bar',
      data,
      barMaxWidth: 30,
      itemStyle: {
        color,
        borderRadius: [5, 5, 0, 0],
      },
    },
  ],
})

const buildLineOption = (title, labels, data, color) => ({
  title: { text: title, left: 'center', textStyle: { fontSize: 14, fontWeight: 600 } },
  tooltip: {
    trigger: 'axis',
    formatter: (params) => percentFormatter(params[0], data),
  },
  grid: { left: 50, right: 24, top: 50, bottom: 28 },
  xAxis: { type: 'category', data: labels },
  yAxis: { type: 'value' },
  series: [
    {
      type: 'line',
      smooth: true,
      data,
      symbolSize: 7,
      lineStyle: { color, width: 3 },
      itemStyle: { color },
      areaStyle: {
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: 'rgba(24, 169, 154, 0.35)' },
          { offset: 1, color: 'rgba(24, 169, 154, 0.02)' },
        ]),
      },
    },
  ],
})

const buildPieOption = (title, data) => ({
  title: { text: title, left: 'center', textStyle: { fontSize: 14, fontWeight: 600 } },
  tooltip: {
    trigger: 'item',
    formatter: '{b}<br/>数值：{c}<br/>占比：{d}%',
  },
  legend: {
    bottom: 4,
    left: 'center',
  },
  series: [
    {
      type: 'pie',
      radius: ['38%', '64%'],
      center: ['50%', '48%'],
      avoidLabelOverlap: true,
      label: {
        formatter: '{b}: {d}%',
      },
      data,
    },
  ],
})

const getChartConfigs = () => {
  const d = currentData.value
  return [
    {
      ref: chartTradeBarRef,
      option: buildBarOption('碳交易总笔数柱状图', d.labels, d.tradeCount, '#2fb38f'),
    },
    {
      ref: chartTrendLineRef,
      option: buildLineOption('AI预测排放趋势折线图', d.labels, d.aiTrend, '#22a49a'),
    },
    {
      ref: chartSuggestBarRef,
      option: buildBarOption('AI建议未来每月排放量柱状图', d.labels, d.aiSuggest, '#5ec97f'),
    },
    {
      ref: chartEmissionPieRef,
      option: buildPieOption('碳排放统计饼图', d.emissionPie),
    },
    {
      ref: chartTradePieRef,
      option: buildPieOption('碳交易统计饼图', d.tradePie),
    },
    {
      ref: chartCreditLineRef,
      option: buildLineOption('信用积分趋势折线图', d.labels, d.creditTrend, '#4fa7d6'),
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
  appliedFilters.value = {
    assetNo: queryForm.assetNo,
    otherCondition: queryForm.otherCondition,
    keyword: queryForm.keyword,
  }
  ElMessage.success('筛选完成')
}

const onResize = () => {
  chartInstances.forEach((instance) => {
    if (instance) {
      instance.resize()
    }
  })
}

watch([timeDimension, filteredAssets], () => {
  renderCharts()
})

onMounted(() => {
  renderCharts()
  window.addEventListener('resize', onResize)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', onResize)
  chartInstances.forEach((instance) => {
    if (instance) {
      instance.dispose()
    }
  })
})
</script>

<template>
  <section class="dashboard-page">
    <el-card class="section-card" shadow="never">
      <el-breadcrumb separator="/">
        <el-breadcrumb-item>本公司信息</el-breadcrumb-item>
        <el-breadcrumb-item>数据可视化</el-breadcrumb-item>
      </el-breadcrumb>
    </el-card>

    <el-card class="section-card" shadow="never">
      <div class="search-row">
        <div class="search-left">
          <el-input v-model="queryForm.assetNo" placeholder="资产编号" clearable />
          <el-input v-model="queryForm.otherCondition" placeholder="其他条件输入" clearable />
          <el-input v-model="queryForm.keyword" placeholder="文本输入" clearable />
          <el-button type="primary" @click="onSearch">搜索</el-button>
        </div>

        <div class="search-right">
          <span class="dimension-label">时间维度：</span>
          <el-radio-group v-model="timeDimension">
            <el-radio-button label="day">日</el-radio-button>
            <el-radio-button label="month">月</el-radio-button>
            <el-radio-button label="year">年</el-radio-button>
          </el-radio-group>
        </div>
      </div>
    </el-card>

    <div class="overview-grid">
      <el-card v-for="item in overviewCards" :key="item.label" class="overview-card" shadow="hover">
        <div class="metric-label">{{ item.label }}</div>
        <div class="metric-value">{{ item.value }}</div>
        <div class="metric-unit">{{ item.unit }}</div>
      </el-card>
    </div>

    <div class="chart-grid">
      <el-card class="chart-card" shadow="never"><div ref="chartTradeBarRef" class="chart-box" /></el-card>
      <el-card class="chart-card" shadow="never"><div ref="chartTrendLineRef" class="chart-box" /></el-card>
      <el-card class="chart-card" shadow="never"><div ref="chartSuggestBarRef" class="chart-box" /></el-card>
      <el-card class="chart-card" shadow="never"><div ref="chartEmissionPieRef" class="chart-box" /></el-card>
      <el-card class="chart-card" shadow="never"><div ref="chartTradePieRef" class="chart-box" /></el-card>
      <el-card class="chart-card" shadow="never"><div ref="chartCreditLineRef" class="chart-box" /></el-card>
    </div>
  </section>
</template>

<style scoped>
.dashboard-page {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.section-card,
.chart-card,
.overview-card {
  border: 1px solid var(--border-color);
  border-radius: 12px;
}

.search-row {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
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

.dimension-label {
  color: var(--text-secondary);
  font-size: 13px;
}

.overview-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(180px, 1fr));
  gap: 12px;
}

.overview-card {
  background: linear-gradient(130deg, rgba(20, 167, 154, 0.12), rgba(69, 190, 117, 0.1));
}

.metric-label {
  color: var(--text-secondary);
  font-size: 13px;
}

.metric-value {
  font-size: 30px;
  margin-top: 10px;
  color: #0f3d40;
  font-weight: 700;
  line-height: 1;
}

.metric-unit {
  margin-top: 8px;
  color: #2f6268;
  font-size: 12px;
}

.chart-grid {
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
  .search-left {
    grid-template-columns: 1fr;
  }

  .overview-grid,
  .chart-grid {
    grid-template-columns: 1fr;
  }

  .search-right {
    width: 100%;
    justify-content: flex-start;
  }
}
</style>
