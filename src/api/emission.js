import request from './request'

export function getEmissionReports(params) {
  return request.get('/emission-reports', { params })
}

export function getEmissionReport(id) {
  return request.get(`/emission-reports/${id}`)
}

export function createEmissionReport(data) {
  return request.post('/emission-reports', data)
}

export function updateEmissionReport(id, data) {
  return request.put(`/emission-reports/${id}`, data)
}

export function deleteEmissionReport(id) {
  return request.delete(`/emission-reports/${id}`)
}

export function submitEmissionReport(id) {
  return request.post(`/emission-reports/${id}/submit`)
}

export function getEmissionOnChain(id) {
  return request.get(`/emission-reports/${id}/onchain`)
}
