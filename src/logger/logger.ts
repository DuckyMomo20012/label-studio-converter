import process from 'node:process'
import { createLogger, format, transports } from 'winston'
import 'dotenv/config'

// 1. The ultra-readable format for your active console debugging
const prettyConsoleFormat = format.combine(
  format.colorize({ all: true }),
  format.timestamp({ format: 'HH:mm:ss' }),
  format.splat(),
  format.printf(({ timestamp, level, message, ...metadata }) => {
    // eslint-disable-next-line ts/restrict-template-expressions
    let msg = `[${timestamp}] ${level}: ${message}`
    if (Object.keys(metadata).length > 0) {
      const metaString = JSON.stringify(metadata, null, 2)
      if (metaString !== '{}') {
        msg += `\n${metaString}`
      }
    }
    return msg
  }),
)

// 2. The structural format for your permanent file logs (no color codes)
const cleanFileFormat = format.combine(
  format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  format.splat(),
  format.json(),
)

const logger = createLogger({
  level: process.env.LOG_LEVEL ?? 'info',
  transports: [
    // Console gets the pretty, human-readable layout
    new transports.Console({
      format: prettyConsoleFormat,
    }),
    // File gets the clean, production-ready JSON layout
    new transports.File({
      filename: 'scraping.log',
      format: cleanFileFormat,
    }),
  ],
})

export { logger }
