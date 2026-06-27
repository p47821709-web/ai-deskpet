import apiClient from './client'

export const userApi = {
  register: (deviceId: string) => apiClient.post('/users/register', { device_id: deviceId }),
  me: () => apiClient.get('/users/me'),
  update: (data: any) => apiClient.patch('/users/me', data),
  delete: () => apiClient.delete('/users/me'),
}
