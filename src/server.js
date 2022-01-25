import express from "express"
import compress from "compression"
import helmet from "helmet"
import Ddos from "ddos"
import ExpressLogs from "express-server-logs"
import requestIp from "request-ip"
import config from "./config.js"
import api from "./api.js"

const app = express()

if (config.env === "development") {
  const xlogs = new ExpressLogs(false)
  app.use(xlogs.logger)
}

const ddosInstance = new Ddos(config.ddosConfig)
app.use(ddosInstance.express)
app.use(express.json())
app.use(requestIp.mw())
app.use(compress())
app.use(helmet())

app.use((req, res, next) => {
  const origin = req.headers.origin
  if (config.whitelist.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin)
  }
  res.header("Access-Control-Allow-Methods", "GET, OPTIONS")
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization")
  res.header("Access-Control-Allow-Credentials", true)
  return next()
})

app.use("/api/healthcheck", (req, res) => res.send("OK"))
app.use("/api", api)
app.use("/*", (req, res) => res.send("Not Found"))

export default app
