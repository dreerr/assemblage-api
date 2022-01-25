import path from "path"
import dotenv from "dotenv"
import config from "../config.js"
import { logger } from "../utils/logger.js"
import { existsSync, mkdirSync, writeFileSync } from "fs"
import { addToQueue } from "assemblage-algorithm"
import { downloadToken } from "./download-token.js"
import { metadata } from "./blockchain-utils.js"
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
  const tokenInfo = `${sourceContract} / ${sourceTokenId} on ${chainId}`
  logger.debug(`Checking ${tokenInfo}`)
  const destinationData = path.join(workingDir, "data.json")
  const destinationImage = path.join(workingDir, "image.svg")
  if (!existsSync(workingDir)) {
    logger.debug(`Creating directory ${workingDir}`)
    mkdirSync(workingDir, { recursive: true })
  }
  // TODO 1. WRITE METADATA
  if (!existsSync(destinationData) || opts.overwrite) {
    logger.debug(`Writing metadata ${destinationData}`)
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

  if (existsSync(destinationImage)) {
    logger.debug(`Already exists ${destinationImage}`)
    return destinationImage
  }
  // 2. GET SOURCE IMAGE
  logger.info(`Getting source image for ${tokenInfo}`)
  let sourceToken
  try {
    sourceToken = await downloadToken({
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
    return
  }

  // 3. MAKE ASSEMBLAGE
  if (sourceToken && existsSync(sourceToken.filePath)) {
    logger.info(`Making Assemblage for ${tokenInfo}`)
    const backgroundColor = sourceToken.metadata.background_color
      ? "#" + sourceToken.metadata.background_color
      : undefined
    return await addToQueue(sourceToken.filePath, destinationImage, {
      backgroundColor,
    })
  }
}
