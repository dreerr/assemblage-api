import { ethers } from "ethers"
import { readFileSync } from "fs"
import { providers, chainNum } from "./util.js"
import { processMint } from "./process-token.js"
import config from "../config.js"

const addresses = JSON.parse(readFileSync("./contracts/addresses.json"))
const contractInterface = JSON.parse(
  readFileSync("./contracts/Assemblage.json")
)

const listenAllChains = () => {
  if (config.env === "production") {
    listenOnChain("mainnet")
    listenOnChain("rinkeby")
  } else {
    listenOnChain("rinkeby")
    listenOnChain("localhost")
  }
}

const listenOnChain = (chainId) => {
  const contractAddress = addresses.Assemblage[chainNum(chainId)]
  const provider = providers[chainId]
  const contract = new ethers.Contract(
    contractAddress,
    contractInterface.abi,
    provider
  )
  contract.on("SourceTokenMinted", (source, id, to, event) => {
    const opts = {
      sourceContract: source.sourceContract,
      sourceTokenId: source.sourceTokenId.toNumber(),
      tokenId: id.toNumber(),
      chainId,
      transactionHash: event.transactionHash,
    }
    processMint(opts)
  })
}

;(async () => {
  listenAllChains()
})()
