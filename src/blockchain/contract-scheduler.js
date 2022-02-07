import fs from "fs"
import schedule from "node-schedule"
import { currentProcessCount } from "assemblage-algorithm"
import config from "../config.js"
import { logger } from "../utils/logger.js"
import { processToken } from "./process-token.js"
import { contracts } from "../utils/web3.js"

export default async () => {
  checkMintedTokens()
  const rule = new schedule.RecurrenceRule()
  rule.minute = [0, 10, 20, 30, 40, 50]
  schedule.scheduleJob(rule, checkMintedTokens)
}

export const checkMintedTokens = async () => {
  logger.debug("Starting new scheduled Job checkMintedTokens")
  if (currentProcessCount() > 0) {
    logger.info(`${currentProcessCount()} items in queue, will check later.`)
    return
  }
  config.activeChains.forEach(async (chainId) => {
    const contract = contracts[chainId]
    let totalSupply = 0
    try {
      totalSupply = await contract.totalSupply()
    } catch (error) {
      logger.error(`Could not get 'contract.totalSupply()' on ${chainId}`)
      return
    }
    writeTotalSupply(totalSupply)
    logger.info(`Checking ${totalSupply} tokens on ${chainId}`)
    for (let index = 0; index < totalSupply; index++) {
      const source = await contract.sourceTokens(index)
      const opts = {
        sourceContract: source.sourceContract,
        sourceTokenId: source.sourceTokenId.toString(),
        tokenId: index,
        chainId,
        overwrite: false,
      }
      processToken(opts)
    }
    logger.debug(`Done checking ${totalSupply} tokens on ${chainId}`)
  })
}

const writeTotalSupply = (totalSupply) => {
  const filePath = "data/status.json"
  let info = {}
  try {
    info = JSON.parse(fs.readFileSync(filePath))
  } catch (error) {
    logger.warn("Could not read status file")
  }
  info.count = parseInt(totalSupply)
  const data = JSON.stringify(info)
  try {
    fs.writeFileSync(filePath, data)
  } catch (error) {
    logger.warn("Could not write status file")
  }
}
