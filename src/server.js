import express from "express"
import compress from "compression"
import cors from "cors"
import helmet from "helmet"
import Ddos from "ddos"
import ExpressLogs from "express-server-logs"
import requestIp from "request-ip"
import config from "./config.js"
import api from "./api.js"

const ddosInstance = new Ddos(config.ddosConfig)

const corsOptions = {
  exposedHeaders: "authorization, x-refresh-token, x-token-expiry-time",
  origin: (origin, callback) => {
    if (!config.whitelist || config.whitelist.includes(origin)) {
      callback(null, true)
    } else {
      callback(new Error("Not allowed by CORS"))
    }
  },
}

const app = express()

if (config.env === "development") {
  const xlogs = new ExpressLogs(false)
  app.use(xlogs.logger)
}

app.use(ddosInstance.express)
app.use(express.json())
app.use(requestIp.mw())
app.use(compress())
app.use(helmet())
app.use(cors(corsOptions))

app.use("/api/healthcheck", (req, res) => res.send("OK"))
app.use("/api", api)
app.use("/*", (req, res) => res.send("Not Found"))

export default app
