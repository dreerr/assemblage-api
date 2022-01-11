import { downloadToken } from "./download-token.js"
import { addToQueue } from 'assemblage-algorithm';
import path from "path"
import fs from "fs"
import config from "../config.js"

export const processToken = async ({
  sourceContract,
  sourceTokenId,
  tokenId,
  chainId,
  transactionHash,
}) => {
  const workingDir = path.join(
    config.workingDir,
    chainId.toString(),
    tokenId.toString()
  )
  console.log(
    `Processing ${sourceContract} / #${sourceTokenId} at "${workingDir}"`
  )
  if (fs.existsSync(workingDir)) {
    console.log("WARNING Path already exists!")
  } else {
    fs.mkdirSync(workingDir, { recursive: true })
  }
  // TODO 1. WRITE INTERIM METADATA

  // 2. GET SOURCE IMAGE
  let sourceImage
  try {
    sourceImage = await downloadToken({
      address: sourceContract,
      tokenId: sourceTokenId,
      chainId,
      workingDir,
    })
  } catch (error) {
    console.log("cannot download source image FATAL!!!", error);
    return
  }

  // 3. MAKE ASSEMBLAGE
  if(fs.existsSync(sourceImage)) {
    sourceImage = path.resolve(sourceImage)
    const destImage = path.resolve(path.join(workingDir, "image.svg"))
    addToQueue(sourceImage, destImage)
  }
}
const testTokens = [
  {
    address: "0x26FD2D6a09A861CC6C16716199eEF6bdB4FD1edf",
    tokenId: "0",
    chainId: "rinkeby",
  },
  {
    address: "0x7B5D6c1ed1d3D2cC0395f680576b0D0bDD7ebdDd",
    tokenId: "6",
    chainId: "rinkeby",
  },
  {
    address: "0xa722f8e783d472ab66fb2e4be1c1ca01bd166c3b",
    tokenId: "32525",
    chainId: "mainnet",
  },
  {
    address: "0xd07dc4262bcdbf85190c01c996b4c06a461d2430",
    tokenId: "103133",
    chainId: "mainnet",
  },
  {
    address: "0x8b4616926705fb61e9c4eeac07cd946a5d4b0760",
    tokenId: "5030",
    chainId: "mainnet",
  },
  {
    address: "0x90d86699b60938fca1cb5817c6e85f65e84663eb",
    tokenId: "147",
    chainId: "mainnet",
  },
  {
    address: "0x6d4530149e5b4483d2f7e60449c02570531a0751",
    tokenId: "2246",
    chainId: "mainnet",
  },
  {
    address: "0xb47e3cd837ddf8e4c57f05d70ab865de6e193bbb",
    tokenId: "547",
    chainId: "mainnet",
  },
  {
    address: "0xc7e5e9434f4a71e6db978bd65b4d61d3593e5f27",
    tokenId: "12146",
    chainId: "mainnet",
  },
  {
    address: "0x33a4cfc925ad40e5bb2b9b2462d7a1a5a5da4476",
    tokenId:
      "57896044618658097711785492504343953929016968901266851264415136113747971538945",
    chainId: "mainnet",
  },
]
;(async () => {
  testTokens.forEach((token, idx) => {
    processToken({
      sourceContract: token.address,
      sourceTokenId: token.tokenId,
      tokenId: idx,
      chainId: token.chainId,
      transactionHash: '0x0',
    })

  })
})()
