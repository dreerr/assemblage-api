import { existsSync, mkdirSync, unlinkSync } from "fs"
import path from "path"
import TelegramBot from "node-telegram-bot-api"
import config from "../config.js"
import glob from "glob"
import { downloadImage } from "../blockchain/download-token.js"
import pkg from "fs-extra"
import { checkMintedTokens } from "../blockchain/contract-scheduler.js"
import { logger } from "./logger.js"
const { copySync } = pkg

process.env.NTBA_FIX_350 = true

const chatId = parseInt(config.telegram.chatId)
const previewDir = path.join(config.workingDir, "mainnet-preview")
const liveDir = path.join(config.workingDir, "mainnet")

const bot = new TelegramBot(config.telegram.token, { polling: true })

export const telegramAdmin = async () => {
  bot.onText(/^\/see (\d+)/, see)
  bot.onText(/^\/source (\d+) ([^\s]+)\s*(.*)$/, source)
  bot.onText(/^\/allow (\d+)/, allow)
  bot.onText(/^\/help/, (msg) => {
    const chatId = msg.chat.id
    bot.sendMessage(
      chatId,
      `Options are:
/allow [tokenId]
/see [tokenId]
/source [tokenId] [url]
/help`
    )
  })
}

const see = (msg, match) => {
  if (!canAccess(msg)) return
  const photoId = match[1]
  const photo = path.resolve(
    path.join(previewDir, photoId.toString(), "image_comparison.png")
  )
  if (!existsSync(photo)) {
    bot.sendMessage(chatId, "Does not exist")
    return
  }
  bot.sendPhoto(chatId, photo, { caption: `#${photoId}` })
}

const source = async (msg, match) => {
  if (!canAccess(msg)) return
  const tokenId = match[1]
  const imageUrl = match[2]
  const overwrite = Boolean(match[3])
  const tokenDir = path.join(liveDir, tokenId)
  const existingSourceToken = glob.sync(path.join(tokenDir, "source.*"))
  if (existingSourceToken.length > 0) {
    if (overwrite) {
      existingSourceToken.forEach((el) => unlinkSync(el))
    } else {
      bot.sendMessage(chatId, `${existingSourceToken[0]} already exists!`)
      return
    }
  }

  mkdirSync(tokenDir, { recursive: true })

  let sourceFile
  try {
    sourceFile = await downloadImage({
      imageUrl,
      filePath: path.join(tokenDir, "source"),
    })
  } catch (error) {
    bot.sendMessage(chatId, `could not download!`)
    return
  }
  bot.sendMessage(chatId, `Downloaded to ${sourceFile}`)
  checkMintedTokens()
}

const allow = (msg, match) => {
  try {
    if (!canAccess(msg)) return
    const tokenId = match[1]
    const tokenPreviewDir = path.join(previewDir, tokenId)
    const tokenLiveDir = path.join(liveDir, tokenId)

    if (existsSync(tokenLiveDir)) {
      bot.sendMessage(chatId, `${tokenLiveDir} already exists`)
      return
    } else if (!existsSync(tokenPreviewDir)) {
      bot.sendMessage(chatId, `${tokenPreviewDir} does not exist`)
      return
    }

    try {
      copySync(tokenPreviewDir, tokenLiveDir)
      bot.sendMessage(chatId, `success`)
    } catch (error) {
      bot.sendMessage(chatId, `Error during copying ${error}`)
    }
  } catch (error) {
    logger.error(`Error while telegram allow ${error}`)
  }
}

export const sendPhoto = (filePath, message) => {
  try {
    bot.sendPhoto(chatId, filePath, { caption: message })
  } catch (error) {
    logger.error(`Error while sendPhoto ${error}`)
  }
}

export const sendText = (message) => {
  try {
    bot.sendMessage(chatId, message)
  } catch (error) {
    logger.error(`Error while sendMessage ${error}`)
  }
}

const canAccess = (msg) => {
  if (msg.chat.id !== chatId)
    logger.warn(`Chat ID ${msg.chat.id} not recognized`)
  return msg.chat.id === chatId
}
