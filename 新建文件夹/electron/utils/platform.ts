import { platform } from 'os'

export const isWindows = platform() === 'win32'
export const isMac = platform() === 'darwin'
export const isLinux = platform() === 'linux'
