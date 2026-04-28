import request from './request'

export function getTicker() {
  return request.get('/market/ticker')
}

export function getDepth() {
  return request.get('/market/depth')
}
