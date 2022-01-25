import { ethers } from "ethers"
import { readFileSync, existsSync } from "fs"
import { logger } from "../utils/logger.js"
import dotenv from "dotenv"
dotenv.config()

if (
  !existsSync(process.env.CONTRACT_ADRESSESS) ||
  !existsSync(process.env.CONTRACT_INTERFACE)
) {
  throw new Error("Contract interface and adresses incomplete")
}

export const addresses = JSON.parse(
  readFileSync(process.env.CONTRACT_ADRESSESS)
)
export const contractInterface = JSON.parse(
  readFileSync(process.env.CONTRACT_INTERFACE)
)

const chainNums = {
  localhost: 31337,
  mainnet: 1,
  rinkeby: 4,
}

export const providers = {
  mainnet: new ethers.providers.JsonRpcProvider(process.env.NODE_MAINNET),
  rinkeby: new ethers.providers.JsonRpcProvider(process.env.NODE_RINKEBY),
  localhost: new ethers.providers.JsonRpcProvider(process.env.NODE_LOCALHOST),
}

export const activeChains = () => {
  if (process.env.NODE_ENV === "production") {
    return Array.from(["mainnet", "rinkeby"])
  } else {
    return Array.from(["localhost", "rinkeby"])
  }
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

export const ipfsGateway = "https://ipfs.moralis.io:2053/ipfs/"

const imageBaseURI = {
  localhost: process.env.BASE_URI_LOCALHOST,
  mainnet: process.env.BASE_URI_MAINNET,
  rinkeby: process.env.BASE_URI_RINKEBY,
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
      image: `${imageBaseURI[opts.chainId]}${opts.tokenId}/image.png`,
      image_original: `${imageBaseURI[opts.chainId]}${opts.tokenId}/image.svg`,
      sourceContract: opts.sourceContract,
      sourceTokenId: opts.sourceTokenId,
      description: `Assemblage analyzes the visual features of a token, deconstructs its aesthetics and assembles it into a newly-created piece in the Ethereum blockchain.
      [Source Token](${sourceTokenLink})`,
    },
    null,
    2
  )
}
