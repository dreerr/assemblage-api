import { activeChains, contractOnChain } from "./util.js"
import { processToken } from "./process-token.js"

const setupListeners = () => {
  activeChains.forEach(listenOnChain)
}

const listenOnChain = (chainId) => {
  const contract = contractOnChain(chainId)
  contract.on("SourceTokenMinted", (source, id, to, event) => {
    const opts = {
      sourceContract: source.sourceContract,
      sourceTokenId: source.sourceTokenId.toString(),
      tokenId: id.toNumber(),
      chainId,
    }
    processToken(opts)
  })
}

;(async () => {
  setupListeners()
})()
