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
import { provider, ipfsGateway, openSeaAsset } from "./util.js"
import path from "path"

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
      console.log("Error downloading image, trying with live metadata")
      const liveResult = await getTokenMetadata({ ...opts, useLive: true })
      try {
        return await getTokenImage({ ...liveResult, ...opts })
      } catch (error) {
        console.log("could not download image")
        throw error
      }
    } else {
      console.log("could not download metadata or image")
      throw error
    }
  }
}

const getTokenMetadata = async ({ address, tokenId, useLive, chainId }) => {
  if (!useLive && chainId !== "localhost") {
    // 1. TRY OPENSEA
    try {
      const metadata = await got(openSeaAsset(chainId, address, tokenId)).json()
      if (imageField(metadata)) {
        return { metadata, live: false }
      }
    } catch (error) {
      console.log("no luck with OpenSea")
    }

    // 2.  TRY MORALIS
    const options = { address, token_id: tokenId, chain: chainId }
    try {
      const tokenData = await Moralis.Web3API.token.getTokenIdMetadata(options)
      if (tokenData.metadata) {
        const metadata = JSON.parse(tokenData.metadata)
        if (imageField(metadata)) {
          return { metadata, live: false }
        }
      }
    } catch (error) {
      console.log("No luck with Moralis, falling back to manual")
    }
  }

  // 3. TRY ERC721 MANUAL
  let tokenURI
  const contract = new ethers.Contract(address, ERC721, provider(chainId))
  try {
    tokenURI = await contract.tokenURI(tokenId)
  } catch (error) {
    console.log("No ERC721, trying different")
  }

  // 4. TRY ERC1155
  if (!tokenURI) {
    const contract = new ethers.Contract(
      address,
      ERC1155Metadata.abi,
      provider(chainId)
    )
    try {
      tokenURI = await contract.uri(tokenId)
      tokenURI = tokenURI.replace("{id}", String(tokenId).padStart(64, "0"))
    } catch (error) {
      throw Error("No valid token format!")
    }
  }

  // 5. GET METADATA FOR ERC721 OR ERCC1155
  let metadata
  if (tokenURI.startsWith("data")) {
    const data = dataUriToBuffer(tokenURI).toString()
    try {
      const metadata = JSON.parse(data)
      return { metadata, live: true }
    } catch (error) {
      return { metadata: { image_data: data }, live: true }
    }
  } else {
    tokenURI = tokenURI.replace(/^ipfs:\/\/(ipfs\/)*/, ipfsGateway)
    metadata = await got(tokenURI).json()
  }
  return { metadata, live: true }
}

const imageField = (metadata) =>
  metadata.image_original_url ||
  metadata.image ||
  metadata.image_url ||
  metadata.image_data

const getTokenImage = async ({ metadata, workingDir }) => {
  const url = imageField(metadata)
  fs.mkdirSync(workingDir, { recursive: true })
  const filePath = path.join(workingDir, "source")
  if (url.startsWith("<svg")) {
    fs.writeFileSync(filePath + ".svg", url)
    return filePath + ".svg"
  } else if (url.startsWith("ipfs")) {
    return await downloadIpfs({ url, filePath })
  } else if (url.startsWith("http")) {
    return await downloadImage({ url, filePath })
  } else {
    throw Error("Could not determine url type!")
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
  if (!contentType.startsWith("image/"))
    return new Error(mime.extension(contentType) + " not an image!")

  const filePathWithExt = `${filePath}.${mime.extension(contentType)}`
  await pipeline(got.stream.get(url), fs.createWriteStream(filePathWithExt))
  return filePathWithExt
}
