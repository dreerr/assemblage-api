import { downloadToken } from "./download-token.js"
import { addToQueue } from "assemblage-algorithm"
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
    console.log("cannot download source image FATAL!!!", error)
  }

  // 3. MAKE ASSEMBLAGE
  if (fs.existsSync(sourceImage)) {
    sourceImage = path.resolve(sourceImage)
    const destImage = path.resolve(path.join(workingDir, "image.svg"))
    return await addToQueue(sourceImage, destImage, { seed: transactionHash })
  }
}
