export function useElectronIpc() {
  return {
    spawnPet: (petId: string) => {},
    recallPet: () => {},
    updatePosition: (x: number, y: number) => {},
    openChat: (petId: string) => {},
  }
}
