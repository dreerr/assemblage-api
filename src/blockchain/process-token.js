import path from "path"
import dotenv from "dotenv"
import config from "../config.js"
import { logger } from "../utils/logger.js"
import { existsSync, mkdirSync, writeFileSync } from "fs"
import { addToQueue } from "assemblage-algorithm"
import { downloadToken } from "./download-token.js"
import metadata from "../utils/metadata.js"
import glob from "glob"
import { sendPhoto, sendText } from "../utils/telegram.js"
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
  const tokenInfo = `${sourceContract} / ${sourceTokenId.substr(
    0,
    5
  )} on ${chainId}`
  const destinationData = path.join(workingDir, "data.json")
  const destinationImage = path.join(workingDir, "image.svg")
  const comparisonImage = path.join(workingDir, "image_comparison.png")
  let existingSourceToken = glob.sync(path.join(workingDir, "source.*"))
  existingSourceToken = existingSourceToken[0] || undefined
  if (!existsSync(workingDir)) {
    logger.debug(`#${tokenId}: Creating directory ${workingDir}`)
    mkdirSync(workingDir, { recursive: true })
  }
  // TODO 1. WRITE METADATA
  if (!existsSync(destinationData) || opts.overwrite) {
    logger.debug(`#${tokenId}: Writing metadata ${destinationData}`)
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
    logger.info(`#${tokenId}: Getting source image for ${tokenInfo}`)
    try {
      sourceToken = await downloadToken({
        address: sourceContract,
        tokenId: sourceTokenId,
        chainId,
        workingDir,
        id: tokenId,
      })
    } catch (error) {
      processError({
        tokenId,
        sourceContract,
        sourceTokenId,
        chainId,
        error,
      })
      return
    }
  } else {
    sourceToken = { filePath: existingSourceToken, metadata: {} }
  }

  if (existsSync(destinationImage) && opts.overwrite !== true) {
    return destinationImage
  }

  // 3. MAKE ASSEMBLAGE
  if (sourceToken && existsSync(sourceToken.filePath)) {
    logger.info(`#${tokenId}: Making Assemblage for ${tokenInfo}`)
    const backgroundColor = sourceToken.metadata.background_color
      ? "#" + sourceToken.metadata.background_color
      : undefined
    try {
      await addToQueue(sourceToken.filePath, destinationImage, {
        backgroundColor,
      })
      logger.info(`#${tokenId}: Finished Assemblage for ${tokenInfo}`)
      sendPhoto(comparisonImage, `New Assemblage #${tokenId}`)
    } catch (error) {
      processError({
        tokenId,
        sourceContract,
        sourceTokenId,
        chainId,
        error,
      })
    }
  }
}

const processError = (opts) => {
  logger.error(
    `#${opts.tokenId}: (${opts.sourceContract} / ${opts.sourceTokenId} ` +
      `on ${opts.chainId}) could not download – ${opts.error}`
  )
  const sourceTokenLink =
    (opts.chainId !== "mainnet"
      ? "https://testnets.opensea.io/"
      : "https://opensea.io/") +
    `assets/${opts.sourceContract}/${opts.sourceTokenId}`
  sendText(
    `🚨 Assemblage #${opts.tokenId}\nSource: ${sourceTokenLink}\n${opts.error}`
  )
}
