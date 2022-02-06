import schedule from "node-schedule"
import { logger } from "../utils/logger.js"
import { activeChains, contractOnChain } from "../utils/web3.js"
import { processToken } from "./process-token.js"
import { currentProcessCount } from "assemblage-algorithm"

let checking = false

export default async () => {
  checkMintedTokens()
  const rule = new schedule.RecurrenceRule()
  rule.minute = [0, 10, 20, 30, 40, 50]
  schedule.scheduleJob(rule, checkMintedTokens)
}

export const checkMintedTokens = async () => {
  if (checking) {
    logger.info(`checkMintedTokens is running`)
    return
  }
  if (currentProcessCount() > 0) {
    logger.info(`${currentProcessCount()} items in queue, will check later.`)
    return
  }
  checking = true
  activeChains().forEach(async (chainId) => {
    const contract = contractOnChain(chainId)
    let totalSupply = 0
    try {
      totalSupply = await contract.totalSupply()
    } catch (error) {
      logger.error(`Could not get 'contract.totalSupply()' on ${chainId}`)
      return
    }
    logger.debug(`Checking ${totalSupply} tokens on ${chainId}`)
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
  checking = false
}
