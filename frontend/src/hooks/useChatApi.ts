export function useChatApi() {
  return {
    sendMessage: async (sessionId: string, content: string) => {},
    createSession: async (petId: string) => null,
    fetchHistory: async (sessionId: string) => [],
  }
}
