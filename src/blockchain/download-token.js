import { ethers } from "ethers"
import Moralis from "moralis/node.js"
import got from "got"
import mime from "mime-types"
import { promisify } from "node:util"
import stream from "stream"
import fs from "node:fs"
import { ERC1155Metadata } from "multi-token-standard-abi"
import dataUriToBuffer from "data-uri-to-buffer"
import path from "path"
import { logger } from "../utils/logger.js"
import { providers, openSeaAsset } from "../utils/web3.js"
import config from "../config.js"

const ERC721 = JSON.parse(
  fs.readFileSync("./node_modules/@nibbstack/erc721/abi/NFTokenMetadata.json")
)
const pipeline = promisify(stream.pipeline)

const gotOptions = { https: { rejectUnauthorized: !config.unsafeHttps } }

Moralis.start(config.moralis)

export const downloadToken = async (opts) => {
  let result
  try {
    result = await getTokenMetadata({ ...opts, useLive: true })
    return await getTokenImage({ ...result, ...opts })
  } catch (error) {
    logger.debug("Trying cached metadata")
    const cachedResult = await getTokenMetadata({ ...opts, useLive: false }) // may throw
    if (cachedResult === undefined)
      throw new Error(`Not found live or cached ${error}`)
    return await getTokenImage({ ...cachedResult, ...opts }) // may throw
  }
}

const getTokenMetadata = async ({ address, tokenId, useLive, chainId }) => {
  logger.info(
    `${address} / ${tokenId} downloading on ${chainId}, live: ${
      useLive ? "yes" : "no"
    }`
  )
  if (useLive) {
    // TRY ERC721
    let tokenURI
    const contract = new ethers.Contract(address, ERC721, providers[chainId])
    try {
      tokenURI = await contract.tokenURI(tokenId)
    } catch (error) {
      logger.warn(`${address} / ${tokenId} is not ERC721`)
    }

    // TRY ERC1155
    if (!tokenURI) {
      const contract = new ethers.Contract(
        address,
        ERC1155Metadata.abi,
        providers[chainId]
      )
      try {
        tokenURI = await contract.uri(tokenId)
        tokenURI = tokenURI.replace("{id}", String(tokenId).padStart(64, "0"))
      } catch (error) {
        logger.warn(`${address} / ${tokenId} is not ERC1155`)
        throw Error("Not ERC721 or ERC1155")
      }
    }

    // GET METADATA FOR ERC721 OR ERCC1155
    let metadata
    if (tokenURI.startsWith("data:")) {
      logger.debug(`Token is dataURI encoded`)
      const data = dataUriToBuffer(tokenURI).toString()
      try {
        const metadata = JSON.parse(data)
        return { metadata, live: true }
      } catch (error) {
        logger.warn(
          `${address} / ${tokenId} dataURI could not be decoded, maybe image`
        )
        return { metadata: { image_data: data }, live: true }
      }
    } else {
      tokenURI = tokenURI.replace(/^ipfs:\/\/(ipfs\/)*/, config.ipfsGateway)
      logger.debug(`Getting token metadata at ${tokenURI}`)
      metadata = await got(tokenURI, gotOptions).json()
    }
    logger.debug(`Found metadata with live data`)
    return { metadata, live: true }
  } else if (chainId !== "localhost") {
    // CACHED AND NOT ON LOCALHOST

    // TRY OPENSEA
    try {
      const metadata = (
        await got(openSeaAsset(chainId, address, tokenId))
      ).json()
      if (metadata.image_original_url || metadata.image_url || metadata.image) {
        logger.debug(`Found metadata with OpenSea`)
        return { metadata, live: false }
      }
    } catch (error) {
      logger.debug(error)
      logger.warn(`${address} / ${tokenId} not found on OpenSea`)
    }

    // TRY MORALIS
    const options = { address, token_id: tokenId, chain: chainId }
    try {
      const tokenData = await Moralis.Web3API.token.getTokenIdMetadata(options)
      if (tokenData.metadata) {
        const metadata = JSON.parse(tokenData.metadata)
        if (imageField(metadata)) {
          logger.debug(`Found metadata on Moralis`)
          return { metadata, live: false }
        }
      }
    } catch (error) {
      logger.warn(`${address} / ${tokenId} not found on Moralis`)
    }
  }
}

const imageField = (metadata) =>
  metadata.image_original_url ||
  metadata.image ||
  metadata.image_url ||
  metadata.image_data

const getTokenImage = async ({ metadata, workingDir }) => {
  let imageUrl = imageField(metadata).replace(
    /^ipfs:\/\/(ipfs\/)*/,
    config.ipfsGateway
  )
  if (imageUrl.includes("googleusercontent.com") && !imageUrl.includes("=")) {
    logger.warn("Image is hosted on googleusercontent.com, appending query")
    imageUrl += "=s0"
  }
  let filePath = path.join(workingDir, "source")
  if (imageUrl.startsWith("<svg")) {
    logger.debug(`Image is SVG`)
    filePath += ".svg"
    fs.writeFileSync(filePath, imageUrl)
  } else if (imageUrl.startsWith("http")) {
    filePath = await downloadImage({ imageUrl, filePath })
  } else if (imageUrl.startsWith("data:")) {
    logger.debug(`Image is dataURI encoded`)
    const data = dataUriToBuffer(imageUrl)
    filePath += "." + mime.extension(data.type)
    fs.writeFileSync(filePath, data)
  } else {
    throw Error("Could not determine image URL type! " + imageUrl.slice(0, 10))
  }
  return { filePath, metadata }
}

export const downloadImage = async ({ imageUrl, filePath }) => {
  logger.debug(`Probing image at ${imageUrl}`)
  const head = await got(imageUrl, {
    headers: {
      Range: "bytes=0-16",
    },
    ...gotOptions,
  })
  const type = head.headers["content-type"]
  const contentType = mime.contentType(type)
  if (!contentType.startsWith("image/")) {
    throw Error(`${contentType} is not an image`)
  }

  const filePathWithExt = `${filePath}.${mime.extension(contentType)}`
  await pipeline(
    got.stream.get(imageUrl, gotOptions),
    fs.createWriteStream(filePathWithExt)
  )
  logger.debug(`sucessfully wrote image`)
  return filePathWithExt
}
