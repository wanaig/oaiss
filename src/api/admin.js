import request from './request'

export function getAdminUsers(params) {
  return request.get('/admin/users', { params })
}

export function getAdminUser(id) {
  return request.get(`/admin/users/${id}`)
}

export function updateAdminUser(id, data) {
  return request.put(`/admin/users/${id}`, data)
}

export function deleteAdminUser(id) {
  return request.delete(`/admin/users/${id}`)
}

export function getAdminConfigs() {
  return request.get('/admin/configs')
}

export function updateAdminConfig(id, data) {
  return request.put(`/admin/configs/${id}`, data)
}
