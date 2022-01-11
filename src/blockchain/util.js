import { ethers } from "ethers"
import dotenv from "dotenv"
dotenv.config()

export const provider = (chainId) => {
  const providers = {
    mainnet: new ethers.providers.JsonRpcProvider(process.env.NODE_MAINNET),
    rinkeby: new ethers.providers.JsonRpcProvider(process.env.NODE_RINKEBY),
    localhost: new ethers.providers.JsonRpcProvider(process.env.NODE_LOCALHOST),
  }
  return providers[chainId]
}

export const chainNum = (chainId) => {
  const chains = {
    localhost: 31337,
    mainnet: 1,
    rinkeby: 4,
  }
  return chains[chainId]
}

export const openSeaAsset = (chainId, address, tokenId) => {
  if (chainId === "localhost") return null
  const testnetPrefix = chainId === "mainnet" ? "" : chainId + "-"
  const url = `https://${testnetPrefix}api.opensea.io/api/v1/asset/${address}/${tokenId}/`
  return url
}

export const ipfsGateway = "https://ipfs.moralis.io:2053/ipfs/"
