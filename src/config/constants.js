// 订单状态（交易市场 + P2P 统一）
export const ORDER_STATUS = Object.freeze({
  PENDING: '待成交',
  PARTIAL: '部分成交',
  COMPLETED: '已完成',
  CANCELLED: '已取消',
})

// 审核状态
export const AUDIT_STATUS = Object.freeze({
  PENDING: '待审核',
  APPROVED: '已通过',
  REJECTED: '已驳回',
})

// 企业类型
export const ENTERPRISE_TYPES = Object.freeze(['发电企业', '电网企业'])

// 单位换算：1 tCO2e = 1 碳配额单位 = 1 碳币
export const QUOTA_CONVERSION = 1

// 订单方向
export const ORDER_SIDE = Object.freeze({
  BUY: 'buy',
  SELL: 'sell',
})

export const ORDER_SIDE_LABEL = Object.freeze({
  buy: '买入',
  sell: '卖出',
})

// API 订单状态 → 前端显示映射
export const ORDER_STATUS_MAP = {
  open: { label: 'open', type: '' },
  filled: { label: '已完成', type: 'success' },
  cancelled: { label: '已取消', type: 'info' },
  partial: { label: '部分成交', type: 'warning' },
  pending: { label: '待成交', type: '' },
}

// 排放计算公式
export function computeEmission(coalHeatValue, coalConsumption, oilHeatValue, oilConsumption) {
  return Number(((coalHeatValue * coalConsumption * 0.12 + oilHeatValue * oilConsumption * 0.18)).toFixed(2))
}
