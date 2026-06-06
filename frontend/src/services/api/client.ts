import axios from 'axios'

const apiClient = axios.create({
  baseURL: 'http://localhost:8000/api/v1',
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
})

apiClient.interceptors.request.use((config) => {
  const deviceId = localStorage.getItem('device_id')
  if (deviceId) {
    config.headers['X-Device-Id'] = deviceId
  }
  return config
})

// Global error interceptor
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      console.error('[API Error]', error.response.status, error.response.data)
    } else if (error.request) {
      console.error('[API Error] No response received:', error.message)
    } else {
      console.error('[API Error]', error.message)
    }
    return Promise.reject(error)
  }
)

export default apiClient
