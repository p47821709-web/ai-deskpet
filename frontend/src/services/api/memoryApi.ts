import apiClient from './client'

export const memoryApi = {
  list: (petId: string, params?: any) => apiClient.get('/memories', { params: { pet_id: petId, ...params } }),
  get: (id: string) => apiClient.get('/memories/' + id),
  update: (id: string, data: any) => apiClient.patch('/memories/' + id, data),
  delete: (id: string) => apiClient.delete('/memories/' + id),
  search: (petId: string, query: string) => apiClient.post('/memories/search', { pet_id: petId, query }),
  recall: (id: string) => apiClient.post('/memories/' + id + '/recall'),
  consolidate: (petId: string) => apiClient.post('/memories/consolidate', { pet_id: petId }),
}
