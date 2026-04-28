import request from './request'

export function getAdminConfigs() {
  return request.get('/admin/configs')
}

export function updateAdminConfig(id, data) {
  return request.put(`/admin/configs/${id}`, data)
}
