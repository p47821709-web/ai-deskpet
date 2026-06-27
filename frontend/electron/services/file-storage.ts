import path from 'path'
import fs from 'fs'
import { app } from 'electron'

export class FileStorage {
  private basePath: string

  constructor() {
    this.basePath = path.join(app.getPath('userData'), 'storage')
    if (!fs.existsSync(this.basePath)) {
      fs.mkdirSync(this.basePath, { recursive: true })
    }
  }

  getPath(subpath: string): string {
    return path.join(this.basePath, subpath)
  }

  readFile(filename: string): Buffer | null {
    const p = path.join(this.basePath, filename)
    if (!fs.existsSync(p)) return null
    return fs.readFileSync(p)
  }

  writeFile(filename: string, data: Buffer | string) {
    fs.writeFileSync(path.join(this.basePath, filename), data)
  }

  deleteFile(filename: string) {
    const p = path.join(this.basePath, filename)
    if (fs.existsSync(p)) fs.unlinkSync(p)
  }
}
