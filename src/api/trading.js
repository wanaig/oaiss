import request from './request'

export function getOrderBook(side) {
  const params = {}
  if (side) params.side = side
  return request.get('/trading/order-book', { params })
}

export function placeOrder(data) {
  return request.post('/trading/orders', data)
}

export function cancelOrder(id) {
  return request.delete(`/trading/orders/${id}/cancel`)
}

export function getMyOrders(params) {
  return request.get('/trading/orders/my', { params })
}

export function getTradingTransactions(params) {
  return request.get('/trading/transactions', { params })
}

export function getTransactionDetail(id) {
  return request.get(`/trading/transactions/${id}`)
}

export function getMarketStats() {
  return request.get('/trading/stats')
}
