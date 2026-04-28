import request from './request'

export function placeOrder(data) {
  return request.post('/order', data)
}

export function cancelOrder(id) {
  return request.post(`/order/${id}/cancel`)
}

export function getOpenOrders(params) {
  return request.get('/order/open', { params })
}

export function getOrderHistory(params) {
  return request.get('/order/history', { params })
}

export function getTradeHistory(params) {
  return request.get('/trade/history', { params })
}
