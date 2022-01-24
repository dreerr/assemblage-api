import schedule from "node-schedule"
import { logger } from "../utils/logger.js"
import { activeChains, contractOnChain } from "./blockchain-utils.js"
import { processToken } from "./process-token.js"

export default async () => {
  checkMintedTokens()
  const rule = new schedule.RecurrenceRule()
  rule.minute = [0, 10, 20, 30, 40, 50]
  schedule.scheduleJob(rule, checkMintedTokens)
}

const checkMintedTokens = async () => {
  activeChains().forEach(async (chainId) => {
    const contract = contractOnChain(chainId)
    let totalSupply = 0
    try {
      totalSupply = await contract.totalSupply()
    } catch (error) {
      logger.error(`Could not get 'contract.totalSupply()' on ${chainId}`)
      return
    }
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
  })
}
