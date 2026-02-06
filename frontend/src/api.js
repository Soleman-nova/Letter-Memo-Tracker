import axios from 'axios'
import { getAccessToken, getRefreshToken, setTokens, clearTokens } from './store/auth'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000',
})

api.interceptors.request.use((config) => {
  const token = getAccessToken()
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

let isRefreshing = false
let queue = []

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config
    if (error.response && error.response.status === 401 && !original._retry) {
      original._retry = true
      if (!isRefreshing) {
        isRefreshing = true
        try {
          const r = await axios.post(`${api.defaults.baseURL}/api/auth/token/refresh/`, { refresh: getRefreshToken() })
          setTokens(r.data.access, r.data.refresh || getRefreshToken())
          queue.forEach((cb) => cb(r.data.access))
          queue = []
          return api(original)
        } catch (e) {
          clearTokens()
          window.location.href = '/login'
          return Promise.reject(e)
        } finally {
          isRefreshing = false
        }
      }
      return new Promise((resolve) => {
        queue.push((token) => {
          original.headers.Authorization = `Bearer ${token}`
          resolve(api(original))
        })
      })
    }
    return Promise.reject(error)
  }
)

export default api
