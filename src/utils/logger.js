import pkg from "winston"
const { createLogger, format, transports, exceptions } = pkg
const logLevel = process.env.NODE_ENV === "production" ? "info" : "debug"

export const logger = createLogger({
  format: format.combine(
    format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
    format.json()
  ),
  transports: [
    new transports.Console({
      level: logLevel,
      format: format.combine(
        format.colorize(),
        format.printf(
          (info) =>
            `\u001b[36m${info.timestamp}\u001b[39m ${info.level}: ${info.message}`
        )
      ),
    }),
    new transports.File({
      filename: "./log/combined.log",
      level: "debug",
    }),
    new transports.File({
      filename: "./log/errors.log",
      level: "error",
    }),
  ],
  exceptionHandlers: [
    new transports.File({ filename: "./log/exceptions.log" }),
  ],
})
exceptions.handle(new transports.File({ filename: "./log/exceptions.log" }))
