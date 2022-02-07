import { ethers } from "ethers"
import { readFileSync, existsSync } from "fs"
import { logger } from "./logger.js"
import config from "../config.js"
import Web3WsProvider from "web3-providers-ws"

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

export const providers = {}
export const contracts = {}

config.activeChains.forEach((chainId) => {
  providers[chainId] = new ethers.providers.Web3Provider(
    new Web3WsProvider(config.node[chainId], {
      clientConfig: {
        keepalive: true,
        keepaliveInterval: 60000, // ms
      },
      // Enable auto reconnection
      reconnect: {
        auto: true,
        delay: 5000, // ms
        maxAttempts: 5,
        onTimeout: false,
      },
    })
  )

  const contractAddress = addresses.Assemblage[chainNums[chainId]]
  try {
    contracts[chainId] = new ethers.Contract(
      contractAddress,
      contractInterface.abi,
      providers[chainId]
    )
  } catch (error) {
    logger.error(`Could not instanciate contract on chain ${chainId} ${error}`)
  }
})

export const openSeaAsset = (chainId, address, tokenId) => {
  if (chainId === "localhost") return null
  const testnetPrefix = chainId === "mainnet" ? "" : chainId + "-"
  const url = `https://${testnetPrefix}api.opensea.io/api/v1/asset/${address}/${tokenId}/`
  return url
}
