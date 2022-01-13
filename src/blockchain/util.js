import { ethers } from "ethers"
import { readFileSync } from "fs"
import dotenv from "dotenv"
dotenv.config()

export const addresses = JSON.parse(readFileSync("./contracts/addresses.json"))
export const contractInterface = JSON.parse(
  readFileSync("./contracts/Assemblage.json")
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
    contracts[chainId] = new ethers.Contract(
      contractAddress,
      contractInterface.abi,
      provider
    )
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

export const metadata = (opts) =>
  JSON.stringify(
    {
      name: `Assemblage #${opts.tokenId}`,
      image: `${imageBaseURI[opts.chainId]}image.png`,
      sourceContract: opts.address,
      sourceTokenId: opts.tokenId,
      description: `Lorem ipsum`,
    },
    null,
    2
  )
