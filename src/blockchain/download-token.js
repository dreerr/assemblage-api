import { ethers } from "ethers"
import Moralis from "moralis/node.js"
import dotenv from "dotenv"
import got from "got"
import mime from "mime-types"
import { promisify } from "node:util"
import stream from "stream"
import fs from "node:fs"
import { ERC1155Metadata } from "multi-token-standard-abi"
import dataUriToBuffer from "data-uri-to-buffer"
import path from "path"
import { logger } from "../logger.js"
import { providers, ipfsGateway, openSeaAsset } from "./util.js"

const ERC721 = JSON.parse(
  fs.readFileSync("./node_modules/@nibbstack/erc721/abi/NFTokenMetadata.json")
)
const pipeline = promisify(stream.pipeline)
dotenv.config()
const serverUrl = process.env.MORALIS_SERVER_URL
const appId = process.env.MORALIS_APPLICATION_ID
Moralis.start({ serverUrl, appId })

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
      throw Error(`Error getting metadata (${error.code})`)
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
      if (imageField(metadata)) {
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
    tokenURI = tokenURI.replace(/^ipfs:\/\/(ipfs\/)*/, ipfsGateway)
    metadata = await got(tokenURI).json()
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
  const url = imageField(metadata)
  const filePath = path.join(workingDir, "source")
  if (url.startsWith("<svg")) {
    logger.debug(`Image is SVG`)
    fs.writeFileSync(filePath + ".svg", url)
    return filePath + ".svg"
  } else if (url.startsWith("ipfs")) {
    return await downloadIpfs({ url, filePath })
  } else if (url.startsWith("http")) {
    return await downloadImage({ url, filePath })
  } else {
    throw Error("Could not determine image URL type!")
  }
}

const downloadIpfs = ({ url, filePath }) => {
  url = url.replace(/^ipfs:\/\/(ipfs\/)*/, ipfsGateway)
  return downloadImage({ url, filePath })
}

const downloadImage = async ({ url, filePath }) => {
  const head = await got(url, {
    headers: {
      Range: "bytes=0-16",
    },
  })
  const type = head.headers["content-type"]
  const contentType = mime.contentType(type)
  if (!contentType.startsWith("image/")) {
    throw Error(`${contentType} is not an image`)
  }

  const filePathWithExt = `${filePath}.${mime.extension(contentType)}`
  await pipeline(got.stream.get(url), fs.createWriteStream(filePathWithExt))
  logger.debug(`sucessfully wrote image`)
  return filePathWithExt
}
