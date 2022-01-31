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
import { providers, openSeaAsset } from "./blockchain-utils.js"
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
    result = await getTokenMetadata(opts)
    return await getTokenImage({ ...result, ...opts })
  } catch (error) {
    if (result && result.live === false) {
      logger.warn("Error downloading image, trying with live metadata")
      const liveResult = await getTokenMetadata({ ...opts, useLive: true })
      return await getTokenImage({ ...liveResult, ...opts }) // may throw
    } else {
      throw Error(`Error getting metadata or image (${error.code || error})`)
    }
  }
}

const getTokenMetadata = async ({ address, tokenId, useLive, chainId }) => {
  logger.info(
    `Getting ${address} / ${tokenId} on ${chainId}, live: ${
      useLive ? "yes" : "no"
    }`
  )
  if (!useLive && chainId !== "localhost") {
    // 1. TRY OPENSEA
    try {
      const metadata = await got(openSeaAsset(chainId, address, tokenId)).json()
      if (metadata.image_original_url) {
        logger.debug(`Found metadata with OpenSea`)
        return { metadata, live: false }
      }
    } catch (error) {
      logger.warn(`${address} / ${tokenId} not found on OpenSea`)
    }

    // 2.  TRY MORALIS
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

  // 3. TRY ERC721 MANUAL
  let tokenURI
  const contract = new ethers.Contract(address, ERC721, providers[chainId])
  try {
    tokenURI = await contract.tokenURI(tokenId)
  } catch (error) {
    logger.warn("No ERC721, trying different")
  }

  // 4. TRY ERC1155
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
      logger.error(`${address} / ${tokenId} has no valid format, do manually!`)
      throw Error("No valid token format!")
    }
  }

  // 5. GET METADATA FOR ERC721 OR ERCC1155
  let metadata
  if (tokenURI.startsWith("data")) {
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
  logger.debug(`Found metadata manually`)
  return { metadata, live: true }
}

const imageField = (metadata) =>
  metadata.image_original_url ||
  metadata.image ||
  metadata.image_url ||
  metadata.image_data

const getTokenImage = async ({ metadata, workingDir }) => {
  const imageUrl = imageField(metadata).replace(
    /^ipfs:\/\/(ipfs\/)*/,
    config.ipfsGateway
  )
  let filePath = path.join(workingDir, "source")
  if (imageUrl.startsWith("<svg")) {
    logger.debug(`Image is SVG`)
    filePath += ".svg"
    fs.writeFileSync(filePath, imageUrl)
  } else if (imageUrl.startsWith("http")) {
    filePath = await downloadImage({ imageUrl, filePath })
  } else {
    throw Error("Could not determine image URL type!")
  }
  return { filePath, metadata }
}

const downloadImage = async ({ imageUrl, filePath }) => {
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
