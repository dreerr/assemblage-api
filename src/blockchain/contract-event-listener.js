import dotenv from "dotenv"
import { ethers } from "ethers"
import fs from "fs"
import { providers, ipfsGateway, chainNum } from "./util.js"

const addresses = JSON.parse(fs.readFileSync("./contracts/addresses.json"))
const abi = JSON.parse(fs.readFileSync("./contracts/Assemblage.json"))

const listenAllChains = () => {
  listenOnChain("rinkeby")
  listenOnChain("localhost")
}

const listenOnChain = (chainId) => {
  const contractAddress = addresses.Assemblage[chainNum(chainId)]
  console.log(contractAddress)
  const contract = new ethers.Contract(contractAddress, abi, provider[chainId])
  contract.on("SourceTokenMinted", (source, id, to, event) => {
    console.log({
      source,
      id,
      to,
      data: event,
    })
  })
}

;(async () => {
  listenAllChains()
})()
