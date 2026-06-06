import apiClient from './client'

export const petApi = {
  list: (params?: any) => apiClient.get('/pets', { params }),
  get: (id: string) => apiClient.get('/pets/' + id),
  create: (data: any) => apiClient.post('/pets', data),
  update: (id: string, data: any) => apiClient.patch('/pets/' + id, data),
  delete: (id: string) => apiClient.delete('/pets/' + id),
  updatePosition: (id: string, x: number, y: number) => apiClient.patch('/pets/' + id + '/position', { x, y }),
  updateStatus: (id: string, status: string) => apiClient.patch('/pets/' + id + '/status', { status }),
}
