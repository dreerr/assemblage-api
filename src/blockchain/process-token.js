import path from "path"
import dotenv from "dotenv"
import config from "../config.js"
import { logger } from "../utils/logger.js"
import { existsSync, mkdirSync, writeFileSync } from "fs"
import { addToQueue } from "assemblage-algorithm"
import { downloadToken } from "./download-token.js"
import metadata from "../utils/metadata.js"
import glob from "glob"
dotenv.config()

export const processToken = async ({
  sourceContract,
  sourceTokenId,
  tokenId,
  chainId,
  ...opts
}) => {
  const workingDir = path.resolve(
    path.join(
      config.workingDir,
      chainId.toString() + "-preview",
      tokenId.toString()
    )
  )
  const tokenInfo = `${sourceContract} / ${sourceTokenId} on ${chainId}`
  const destinationData = path.join(workingDir, "data.json")
  const destinationImage = path.join(workingDir, "image.svg")
  let existingSourceToken = glob.sync(path.join(workingDir, "source.*"))
  existingSourceToken = existingSourceToken[0] || undefined
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

  // 2. GET SOURCE IMAGE
  let sourceToken
  if (!existsSync(existingSourceToken)) {
    logger.info(`Getting source image for ${tokenInfo}`)
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
  } else {
    logger.debug(`Source exists ${existingSourceToken}`)
    sourceToken = { filePath: existingSourceToken, metadata: {} }
  }

  if (existsSync(destinationImage) && opts.overwrite !== true) {
    logger.debug(`Already exists ${destinationImage}`)
    return destinationImage
  }

  // 3. MAKE ASSEMBLAGE
  if (sourceToken && existsSync(sourceToken.filePath)) {
    logger.info(`Making Assemblage for ${tokenInfo}`)
    const backgroundColor = sourceToken.metadata.background_color
      ? "#" + sourceToken.metadata.background_color
      : undefined
    try {
      await addToQueue(sourceToken.filePath, destinationImage, {
        backgroundColor,
      })
      logger.info(`Finished Assemblage for ${tokenInfo}`)
    } catch (error) {
      logger.error(`Error with  ${tokenInfo}: ${error}`)
    }
  }
}
