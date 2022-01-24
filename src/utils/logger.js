import winston from "winston"
import TelegramLogger from "winston-telegram"
import dotenv from "dotenv"
dotenv.config()

export const logger = winston.createLogger({
  transports: [
    new winston.transports.Console({
      level: "debug",
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      ),
    }),
    new winston.transports.File({
      filename: "combined.log",
      level: "info",
    }),
    new winston.transports.File({
      filename: "errors.log",
      level: "error",
    }),
  ],
  exceptionHandlers: [
    new winston.transports.File({ filename: "exceptions.log" }),
  ],
})
winston.exceptions.handle(
  new winston.transports.File({ filename: "exceptions.log" })
)

if (process.env.TELEGRAM_ACTIVE) {
  winston.add(
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
