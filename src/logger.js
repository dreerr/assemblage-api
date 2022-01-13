import { createLogger, transports, format } from "winston"
import TelegramLogger from "winston-telegram"
import dotenv from "dotenv"
dotenv.config()

export const logger = createLogger({
  transports: [
    new transports.Console({
      level: "debug",
      format: format.combine(format.colorize(), format.simple()),
    }),
    new transports.File({
      filename: "combined.log",
      level: "info",
    }),
    new transports.File({
      filename: "errors.log",
      level: "error",
    }),
  ],
  exceptionHandlers: [new transports.File({ filename: "exceptions.log" })],
})

logger.exceptions.handle(new transports.File({ filename: "exceptions.log" }))

if (process.env.TELEGRAM_ACTIVE) {
  logger.add(
    new TelegramLogger({
      token: process.env.TELEGRAM_TOKEN,
      chatId: process.env.TELEGRAM_CHAT_ID,
      level: "error",
      formatMessage: function (options) {
        let message = options.message
        if (options.level === "error") {
          message = "🛑 " + message
        }
        return message
      },
    })
  )
}
