import { existsSync, mkdirSync } from "fs"
import path from "path"
import TelegramBot from "node-telegram-bot-api"
import config from "../config.js"
import glob from "glob"
import { downloadImage } from "../blockchain/download-token.js"
import { copySync } from "fs-extra"
import { checkMintedTokens } from "../blockchain/contract-scheduler.js"

process.env.NTBA_FIX_350 = true

const chatId = parseInt(config.telegram.chatId)
const previewDir = path.join(config.workingDir, "mainnet-preview")
const liveDir = path.join(config.workingDir, "mainnet")

const bot = new TelegramBot(config.telegram.token, { polling: true })

export const telegramAdmin = async () => {
  bot.onText(/\/see (\d+)/, see)
  bot.onText(/\/source (\d+) (.+)/, source)
  bot.onText(/\/allow (\d+)/, allow)
  bot.onText(/\/help/, (msg) => {
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
  console.log(photoId)
  const photo = path.resolve(
    path.join(previewDir, photoId.toString(), "image_comparison.png")
  )
  console.log(photo)
  if (!existsSync(photo)) {
    bot.sendMessage(chatId, "Does not exist")
    return
  }
  bot.sendPhoto(chatId, photo, { caption: `#${photoId}` })
}

const source = async (msg, match) => {
  if (!canAccess(msg)) return
  console.log(match)
  const tokenId = match[1]
  const imageUrl = match[2]

  const existingSourceToken = glob.sync(
    path.join(previewDir, tokenId, "source.*")
  )
  if (existingSourceToken.length > 0) {
    bot.sendMessage(chatId, `${existingSourceToken[0]} already exists!`)
    return
  }

  const tokenDir = path.join(previewDir, tokenId)
  mkdirSync(tokenDir, { recursive: true })

  let sourceFile
  try {
    sourceFile = await downloadImage({
      imageUrl,
      filePath: path.join(previewDir, tokenId, "source"),
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
    console.log(error)
  }
}

export const sendPhoto = (filePath, message) => {
  bot.sendPhoto(chatId, filePath, { caption: message })
}

export const sendText = (message) => {
  bot.sendMessage(chatId, message)
}

const canAccess = (msg) => {
  return msg.chat.id === chatId
}
