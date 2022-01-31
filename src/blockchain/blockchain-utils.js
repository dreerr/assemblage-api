import { ethers } from "ethers"
import { readFileSync, existsSync } from "fs"
import { logger } from "../utils/logger.js"
import config from "../config.js"

if (
  !existsSync(config.contractAddress) ||
  !existsSync(config.contractInterface)
) {
  throw new Error("Contract interface and adresses incomplete")
}

export const addresses = JSON.parse(readFileSync(config.contractAddress))
export const contractInterface = JSON.parse(
  readFileSync(config.contractInterface)
)

const chainNums = {
  localhost: 31337,
  mainnet: 1,
  rinkeby: 4,
}

export const providers = {
  mainnet: new ethers.providers.JsonRpcProvider(config.node.mainnet),
  rinkeby: new ethers.providers.JsonRpcProvider(config.node.rinkeby),
  localhost: new ethers.providers.JsonRpcProvider(config.node.localhost),
}

export const activeChains = () => {
  return Array.from(config.activeChains)
}

const contracts = {}
export const contractOnChain = (chainId) => {
  if (!contracts[chainId]) {
    const contractAddress = addresses.Assemblage[chainNums[chainId]]
    const provider = providers[chainId]
    try {
      contracts[chainId] = new ethers.Contract(
        contractAddress,
        contractInterface.abi,
        provider
      )
    } catch (error) {
      logger.error(
        `Could not instanciate contract on chain ${chainId} ${error}`
      )
      return
    }
  }
  return contracts[chainId]
}

export const openSeaAsset = (chainId, address, tokenId) => {
  if (chainId === "localhost") return null
  const testnetPrefix = chainId === "mainnet" ? "" : chainId + "-"
  const url = `https://${testnetPrefix}api.opensea.io/api/v1/asset/${address}/${tokenId}/`
  return url
}

export const metadata = (opts) => {
  const sourceTokenLink =
    (opts.chainId !== "mainnet"
      ? "https://testnets.opensea.io/"
      : "https://opensea.io/") +
    `assets/${opts.sourceContract}/${opts.sourceTokenId}`
  return JSON.stringify(
    {
      name: `Assemblage #${opts.tokenId}`,
      image: `${config.apiBaseURI[opts.chainId]}${opts.tokenId}/image.png`,
      image_original: `${config.apiBaseURI[opts.chainId]}${
        opts.tokenId
      }/image.svg`,
      source_contract: opts.sourceContract,
      source_token_id: opts.sourceTokenId,
      external_url: `${config.externalBaseURI[opts.chainId]}${opts.tokenId}`,
      description: `Assemblage analyzes the visual features of a token, deconstructs its aesthetics and assembles it into a newly-created piece in the Ethereum blockchain.\n\n[Source Token](${sourceTokenLink})`,
    },
    null,
    2
  )
}
