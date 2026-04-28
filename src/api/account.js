import request from './request'

export function getAccount() {
  return request.get('/account')
}

export function getAccountTransactions() {
  return request.get('/account/transactions')
}
