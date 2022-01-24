import config from "./config.js"
import server from "./server.js"
import contractListener from "./blockchain/contract-listener.js"
import contractScheduler from "./blockchain/contract-scheduler.js"

if (config.unsafeHttps) {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0"
}

server.listen(config.port, () => {
  contractListener()
  contractScheduler()
  console.info(`Server started on port ${config.port} (${config.env})`)
})

const src = server

export default src
