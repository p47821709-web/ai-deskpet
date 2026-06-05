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

export default apiClient
