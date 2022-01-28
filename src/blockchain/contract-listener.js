import { activeChains, contractOnChain } from "./blockchain-utils.js"
import { processToken } from "./process-token.js"
import { logger } from "../utils/logger.js"

export default () => {
  activeChains().forEach(listenOnChain)
}

const listenOnChain = (chainId) => {
  const contract = contractOnChain(chainId)
  if (!contract) return
  logger.info(`Listening for 'SourceTokenMinted' on ${chainId}`)
  contract.on("SourceTokenMinted", (source, id, to, event) => {
    const opts = {
      sourceContract: source.sourceContract,
      sourceTokenId: source.sourceTokenId.toString(),
      tokenId: id.toNumber(),
      chainId,
      overwrite: true,
    }
    processToken(opts)
  })
}
