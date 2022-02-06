import config from "./config.js"
import server from "./server.js"
import contractListener from "./blockchain/contract-listener.js"
import contractScheduler from "./blockchain/contract-scheduler.js"
import { logger } from "./utils/logger.js"
import { telegramAdmin } from "./utils/telegram.js"

if (config.unsafeHttps) {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0"
}

logger.info(`########### SERVER STARTING ###########`)

server.listen(config.port, () => {
  contractListener()
  contractScheduler()
  telegramAdmin()
  console.info(`Server started on port ${config.port} (${config.env})`)
})

export default server
