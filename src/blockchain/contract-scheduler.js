import { activeChains, contractOnChain } from "./util.js"
import { processToken } from "./process-token.js"

export const checkMintedTokens = async () => {
  activeChains().forEach(async (chainId) => {
    const contract = contractOnChain(chainId)
    const totalSupply = await contract.totalSupply()
    for (let index = 0; index < totalSupply; index++) {
      const source = await contract.sourceTokens(index)
      const opts = {
        sourceContract: source.sourceContract,
        sourceTokenId: source.sourceTokenId.toString(),
        tokenId: index,
        chainId,
        overwrite: true,
      }
      processToken(opts)
    }
  })
}
;(async () => {
  checkMintedTokens()
})()
