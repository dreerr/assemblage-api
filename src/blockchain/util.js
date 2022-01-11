import { ethers } from "ethers"
import dotenv from "dotenv"
dotenv.config()

export const providers = {
  mainnet: new ethers.providers.JsonRpcProvider(process.env.NODE_MAINNET),
  rinkeby: new ethers.providers.JsonRpcProvider(process.env.NODE_RINKEBY),
  localhost: new ethers.providers.JsonRpcProvider(process.env.NODE_LOCALHOST),
}

export const chainNum = (chainId) => {
  const chains = {
    localhost: 31337,
    mainnet: 1,
    rinkeby: 4,
  }
  return chains[chainId]
}

export const ipfsGateway = "https://ipfs.moralis.io:2053/ipfs/"
