import request from './request'

export function getAuditTasks(params) {
  return request.get('/audit/tasks', { params })
}

export function getAuditTask(id) {
  return request.get(`/audit/tasks/${id}`)
}

export function approveAudit(id, data) {
  return request.post(`/audit/tasks/${id}/approve`, data)
}

export function rejectAudit(id, data) {
  return request.post(`/audit/tasks/${id}/reject`, data)
}

export function getAuditRecords(id) {
  return request.get(`/audit/tasks/${id}/records`)
}
