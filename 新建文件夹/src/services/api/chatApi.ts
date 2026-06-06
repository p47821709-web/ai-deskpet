import apiClient from './client'

export const chatApi = {
  createSession: (petId: string) => apiClient.post('/chat/sessions', { pet_id: petId }),
  listSessions: (petId?: string) => apiClient.get('/chat/sessions', { params: { pet_id: petId } }),
  deleteSession: (id: string) => apiClient.delete('/chat/sessions/' + id),
  sendMessage: (sessionId: string, content: string) => apiClient.post('/chat/sessions/' + sessionId + '/messages', { content }),
  getMessages: (sessionId: string, params?: any) => apiClient.get('/chat/sessions/' + sessionId + '/messages', { params }),
  getSummary: (sessionId: string) => apiClient.post('/chat/sessions/' + sessionId + '/summary'),
}
