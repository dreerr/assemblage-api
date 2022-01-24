import express from "express"
import { logMint, logOrder } from "./utils/csv.js"
import { logger } from "./utils/logger.js"
const router = express.Router()

router.post("/mint", function (req, res) {
  const fields = ["hash", "token_address", "token_id", "account"]
  if (fields.filter((field) => req.body[field] === undefined).length > 0) {
    return res.status(400).send({ status: "error" })
  }
  const data = {
    hash: req.body.hash,
    token_address: req.body.token_address,
    token_id: req.body.token_id,
    account: req.body.account,
    ip: req.clientIp,
  }
  logMint(data)
  logger.info(`New mint ${JSON.stringify(data)}`)
  res.send({ status: "ok" })
})

router.post("/order", function (req, res) {
  const fields = ["hash", "order"]
  if (fields.filter((field) => req.body[field] === undefined).length > 0) {
    return res.status(400).send({ status: "error" })
  }
  const data = {
    hash: req.body.hash,
    order: req.body.order,
    ip: req.clientIp,
  }
  logOrder(data)
  logger.info(`New order ${JSON.stringify(data)}`)
  res.send({ status: "ok" })
})

export default router
