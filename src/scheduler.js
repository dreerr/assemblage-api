import schedule from "node-schedule"
import { checkMintedTokens } from "./blockchain/contract-scheduler.js"

export default async () => {
  const rule = new schedule.RecurrenceRule()
  rule.minute = [0, 10, 20, 30, 40, 50]
  schedule.scheduleJob(rule, checkMintedTokens)
}
