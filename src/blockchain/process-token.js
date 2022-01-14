import path from "path"
import dotenv from "dotenv"
import config from "../config.js"
import { logger } from "../logger.js"
import { existsSync, mkdirSync, writeFileSync } from "fs"
import { addToQueue } from "assemblage-algorithm"
import { downloadToken } from "./download-token.js"
import { metadata } from "./util.js"
dotenv.config()

export const processToken = async ({
  sourceContract,
  sourceTokenId,
  tokenId,
  chainId,
  ...opts
}) => {
  const workingDir = path.resolve(
    path.join(config.workingDir, chainId.toString(), tokenId.toString())
  )
  logger.info(`Processing ${sourceContract} / ${sourceTokenId} on ${chainId}`)
  const destinationData = path.join(workingDir, "data.json")
  const destinationImage = path.join(workingDir, "image.svg")
  if (!existsSync(workingDir)) {
    mkdirSync(workingDir, { recursive: true })
  }
  // TODO 1. WRITE METADATA
  if (!existsSync(destinationData) || opts.overwrite) {
    writeFileSync(
      destinationData,
      metadata({
        chainId,
        sourceContract,
        sourceTokenId,
        tokenId,
      })
    )
  }

  if (existsSync(destinationImage)) return destinationImage

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
    logger.error(
      `Token #${tokenId} (${sourceContract} / ${sourceTokenId} ` +
        `on ${chainId}) could not download – ${error}`
    )
  }

  // 3. MAKE ASSEMBLAGE
  if (existsSync(sourceImage)) {
    return await addToQueue(sourceImage, destinationImage, {
      seed: sourceContract + sourceTokenId,
    })
  }
}
