import { ethers } from "ethers"
import { readFileSync, existsSync } from "fs"
import { logger } from "./logger.js"
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
