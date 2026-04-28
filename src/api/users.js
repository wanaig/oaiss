import request from './request'

export function getUsers(params) {
  return request.get('/users', { params })
}

export function getUserStats() {
  return request.get('/users/stats')
}

export function createUser(data) {
  return request.post('/users', data)
}

export function updateUser(id, data) {
  return request.put(`/users/${id}`, data)
}

export function deleteUser(id) {
  return request.delete(`/users/${id}`)
}

export function toggleCredit(id, creditEnabled) {
  return request.put(`/users/${id}/credit-toggle`, { creditEnabled })
}

export function updateCreditScore(id, creditScore) {
  return request.put(`/users/${id}/credit-score`, { creditScore })
}

export function updateUserStatus(id, status) {
  return request.put(`/users/${id}/status`, { status })
}

export function getUserAssets(id) {
  return request.get(`/users/${id}/assets`)
}
