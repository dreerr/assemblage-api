import { contracts } from "../utils/web3.js"
import { processToken } from "./process-token.js"
import { logger } from "../utils/logger.js"
import config from "../config.js"

export default () => {
  config.activeChains.forEach(listenOnChain)
}

const listenOnChain = (chainId) => {
  const contract = contracts[chainId]
  if (!contract) throw Error(`Could not get contract for ${chainId}`)
  logger.info(
    `Listening for 'SourceTokenMinted' on ${chainId} / ${contract.address}`
  )
  contract.on("SourceTokenMinted", (source, id) => {
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
