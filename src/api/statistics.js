import request from './request'

export function getStatistics() {
  return request.get('/statistics')
}

export function getSystemDashboard(params) {
  return request.get('/statistics/system-dashboard', { params })
}
