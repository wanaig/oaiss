import request from './request'

export function getAccount() {
  return request.get('/account')
}

export function getAccountAssets() {
  return request.get('/account/assets')
}

export function getAccountTransactions() {
  return request.get('/account/transactions')
}
