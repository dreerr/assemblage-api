import express from "express"
import compress from "compression"
import cors from "cors"
import helmet from "helmet"
import Ddos from "ddos"
import ExpressLogs from "express-server-logs"
import requestIp from "request-ip"
import routes from "./router.js"
import config from "./config.js"

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

/**
 * Express instance
 * @public
 */

const app = express()
const xlogs = new ExpressLogs(false)

// npm module for preventing ddos attack. See more https://www.npmjs.com/package/ddos
app.use(ddosInstance.express)

// parse body params and attache them to req.body
app.use(express.json())
app.use(express.urlencoded({ extended: false }))
app.use(requestIp.mw())
app.use(xlogs.logger)

// gzip compression
app.use(compress())

// secure apps by setting various HTTP headers
app.use(helmet())

// enable CORS - Cross Origin Resource Sharing
app.use(cors(corsOptions))

// mount api v1 routes
app.use("/healthcheck", (req, res) => res.send("OK"))
app.use("/api", routes)
app.use("/*", (req, res) => res.send("Not Found"))

// if error is not an instanceOf APIError, convert it.
// app.use(error.converter);

// // catch 404 and forward to error handler
// app.use(error.notFound);

// // error handler, send stacktrace only during development
// app.use(error.handler);

export default app
