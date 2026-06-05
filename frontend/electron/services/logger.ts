/**
 * Logger — 生产环境日志服务
 *
 * 使用 electron-log，支持：
 * - 日志文件轮转（按大小/日期）
 * - 日志分级 (error/warn/info/debug)
 * - 未捕获异常自动记录
 * - Promise 拒绝自动记录
 * - 日志文件路径统一管理
 */

import log from 'electron-log'
import { app } from 'electron'
import path from 'path'

// ── 日志配置 ────────────────────────────────────────────────

const LOG_CONFIG = {
  /** 日志文件最大字节数 (5 MB) */
  maxSize: 5 * 1024 * 1024,
  /** 保留的日志文件数 */
  maxFiles: 7,
  /** 日志级别: error, warn, info, debug */
  level: app.isPackaged ? 'info' : 'debug',
  /** 日志文件名 */
  fileName: 'deskpet.log',
  /** 错误日志单独文件名 */
  errorFileName: 'deskpet-error.log',
}

// ── 日志目录 ────────────────────────────────────────────────

function getLogDir(): string {
  return path.join(app.getPath('userData'), 'logs')
}

// ── 初始化 ──────────────────────────────────────────────────

function initializeLogger(): void {
  const logDir = getLogDir()

  // ── electron-log 配置 ──
  log.transports.file.maxSize = LOG_CONFIG.maxSize
  log.transports.file.maxLogs = LOG_CONFIG.maxFiles
  log.transports.file.fileName = LOG_CONFIG.fileName
  log.transports.file.format = '[{y}-{m}-{d} {h}:{i}:{s}.{ms}] [{level}] {text}'
  log.transports.console.level = app.isPackaged ? false : LOG_CONFIG.level
  log.transports.file.level = LOG_CONFIG.level

  // 错误日志单独写入
  log.transports.file.file = (message) => {
    const isError = message.level === 'error' || message.level === 'warn'
    return isError ? LOG_CONFIG.errorFileName : LOG_CONFIG.fileName
  }

  // ── 记录启动信息 ──
  log.info('========================================')
  log.info('  AI DeskPet v' + app.getVersion())
  log.info('  Platform: ' + process.platform)
  log.info('  Arch: ' + process.arch)
  log.info('  Logs: ' + logDir)
  log.info('  Packaged: ' + app.isPackaged)
  log.info('========================================')
}

// ── 全局异常处理 ───────────────────────────────────────────

function setupGlobalErrorHandling(): void {
  // 未捕获的 Promise 拒绝
  process.on('unhandledRejection', (reason: unknown) => {
    log.error('[UnhandledRejection]', reason)
  })

  // 未捕获的异常
  process.on('uncaughtException', (err: Error) => {
    log.error('[UncaughtException]', err.message)
    log.error(err.stack || '')

    // 如果是生产环境，优雅退出
    if (app.isPackaged) {
      app.exit(1)
    }
  })
}

// ── 日志清理 ────────────────────────────────────────────────

function cleanOldLogs(): void {
  const fs = require('fs')
  const logDir = getLogDir()

  try {
    const files = fs.readdirSync(logDir)
      .filter((f: string) => f.startsWith('deskpet') && f.endsWith('.log'))
      .map((f: string) => ({
        name: f,
        time: fs.statSync(path.join(logDir, f)).mtime.getTime(),
      }))
      .sort((a: { time: number }, b: { time: number }) => b.time - a.time)

    // 保留最近 N 个文件，删除更早的
    if (files.length > LOG_CONFIG.maxFiles) {
      files.slice(LOG_CONFIG.maxFiles).forEach((f: { name: string }) => {
        fs.unlinkSync(path.join(logDir, f.name))
        log.info('[Logger] Cleaned old log: %s', f.name)
      })
    }
  } catch {
    // 清理失败不影响主程序
  }
}

// ── 公开 API ────────────────────────────────────────────────

export const logger = {
  error: (...args: unknown[]) => log.error(...args),
  warn: (...args: unknown[]) => log.warn(...args),
  info: (...args: unknown[]) => log.info(...args),
  debug: (...args: unknown[]) => log.debug(...args),

  /** 初始化日志系统 (应在 app 启动最早阶段调用) */
  init(): void {
    initializeLogger()
    setupGlobalErrorHandling()
    cleanOldLogs()
  },

  /** 获取日志目录路径 */
  getLogDir,
}
