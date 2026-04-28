import axios from 'axios'
import { ElMessage } from 'element-plus'

const request = axios.create({
  baseURL: '/api',
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
})

request.interceptors.request.use((config) => {
  const raw = localStorage.getItem('carbon-admin-auth')
  if (raw) {
    try {
      const auth = JSON.parse(raw)
      if (auth.token) {
        config.headers.Authorization = `Bearer ${auth.token}`
      }
    } catch {
    }
  }
  return config
})

request.interceptors.response.use(
  (response) => {
    const body = response.data
    if (body.code !== undefined) {
      if (body.code === 200) {
        return body.data
      }
      const err = new Error(body.message || `请求失败 [${body.code}]`)
      err.code = body.code
      return Promise.reject(err)
    }
    return body
  },
  (error) => {
    if (error.response) {
      const { status, data } = error.response
      if (status === 401) {
        localStorage.removeItem('carbon-admin-auth')
        window.location.href = '/login'
        return Promise.reject(new Error('登录已过期，请重新登录'))
      }
      if (status === 502 || status === 0) {
        console.warn('后端服务可能未启动')
      }
      const err = new Error(data?.message || `请求失败 [${status}]`)
      err.status = status
      return Promise.reject(err)
    }
    const err = new Error('网络异常，请检查后端服务是否启动')
    err.status = 0
    return Promise.reject(err)
  },
)

export default request
