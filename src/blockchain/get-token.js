import { ethers } from "ethers"
import Moralis from "moralis/node.js"
import dotenv from "dotenv"
import got from "got"
import mime from "mime-types"
import { promisify } from "node:util"
import stream from "stream"
import fs from "node:fs"
import { ERC1155Metadata } from "multi-token-standard-abi"
import { providers, ipfsGateway } from "./util.js"

const ERC721 = JSON.parse(
  fs.readFileSync("./node_modules/@nibbstack/erc721/abi/NFTokenMetadata.json")
)
const pipeline = promisify(stream.pipeline)
dotenv.config()

const serverUrl = process.env.MORALIS_SERVER_URL
const appId = process.env.MORALIS_APPLICATION_ID
Moralis.start({ serverUrl, appId })

export const getToken = async (address, tokenId, chain) => {
  const opts = { address, tokenId, chain }
  let result
  result = await getTokenImageUrl(opts)
  try {
    return await getTokenImage({ ...result, ...opts })
  } catch (error) {
    if (result && result.live === false) {
      console.log("Error downloading image, trying with live metadata")
      try {
        const result = await getTokenImageUrl({ ...opts, useLive: true })
        return await getTokenImage({ ...result, ...opts })
      } catch (error) {
        console.log("throwing second try with live")
        // throw Error(error)
      }
    } else {
      console.log("throwing no metadata", error.code)
      // throw Error(error)
    }
  }
}

const getTokenImageUrl = async ({ address, tokenId, useLive, chain }) => {
  let tokenURI
  let metadata
  let isLive = false

  if (!useLive) {
    // 1. TRY OPENSEA
    const testnetPrefix = chain === "Eth" ? "" : chain + "-"
    const url = `https://${testnetPrefix}api.opensea.io/api/v1/asset/${address}/${tokenId}/`
    try {
      const opensea = await got(url).json()
      if (opensea.image_original_url) {
        return { url: opensea.image_original_url, live: false }
      }
    } catch (error) {
      console.log("no luck with opensea")
    }

    // 2.  TRY MORALIS
    const options = { address, token_id: tokenId, chain: chain }
    try {
      const tokenData = await Moralis.Web3API.token.getTokenIdMetadata(options)
      if (tokenData.metadata) {
        metadata = JSON.parse(tokenData.metadata)
      }
    } catch (error) {
      console.log("No luck with Moralis, falling back to manual")
    }
  }

  // 3. TRY ERC721 MANUAL
  if (!metadata) {
    isLive = true
    const provider = chain === "rinkeby" ? providers.rinkeby : providers.mainnet
    const contract = new ethers.Contract(address, ERC721, provider)
    try {
      tokenURI = await contract.tokenURI(tokenId)
    } catch (error) {
      console.log("No ERC721, trying different")
    }

    // TRY ERC1155
    if (!tokenURI) {
      const contract = new ethers.Contract(
        address,
        ERC1155Metadata.abi,
        provider
      )
      try {
        tokenURI = await contract.uri(tokenId)
        tokenURI = tokenURI.replace("{id}", String(tokenId).padStart(64, "0"))
      } catch (error) {
        throw Error("No valid token format!")
      }
    }

    // GET METADATA FOR ERC721 OR ERCC1155
    if (tokenURI.startsWith("data")) {
      console.log("need to parse data metadata")
      throw Error("need to implement")
    }

    tokenURI = url.replace(/^ipfs:\/\/(ipfs\/)*/, ipfsGateway)

    metadata = await got(tokenURI).json()
  }
  const imageUrl =
    metadata.image ||
    metadata.image_url ||
    metadata.image_original_url ||
    metadata.image_data
  return { url: imageUrl, live: isLive }
}

const getTokenImage = async ({ url, address, tokenId }) => {
  const path = `./download/${address}--${tokenId}`
  if (url.startsWith("<svg")) {
    fs.writeFileSync(path + ".svg", url)
    return path + ".svg"
  } else if (url.startsWith("ipfs")) {
    return await downloadIpfs({ url, path })
  } else if (url.startsWith("http")) {
    return await downloadImage({ url, path })
  } else {
    throw Error("Could not determine url type!")
  }
}

const downloadIpfs = ({ url, path }) => {
  url = url.replace(/^ipfs:\/\/(ipfs\/)*/, ipfsGateway)
  return downloadImage({ url, path })
}

const downloadImage = async ({ url, path }) => {
  const head = await got(url, {
    headers: {
      Range: "bytes=0-16",
    },
  })
  console.log(mime.contentType(head.headers["content-type"]))
  const type = head.headers["content-type"]
  const contentType = mime.contentType(type)
  if (!contentType.startsWith("image/"))
    return new Error(mime.extension(contentType) + " not an image!")

  const filepath = `${path}.${mime.extension(contentType)}`
  await pipeline(got.stream.get(url), fs.createWriteStream(filepath))
  return filepath
}

;(async () => {
  // downloadImage({
  //   url: 'https://jpgpeople.s3.amazonaws.com/file/e54c34a35d564c78a32205e430643fe4.PNG?AWSAccessKeyId=AKIAZQNE2GMLEW5C7V5T&Signature=3csdxxkIF2AlGyuY7rY8B%2BwyMLM%3D&Expires=1641834653',
  //   path: './download/',
  //   filename: 'source'
  // }).then(file => console.log(file))
  // .catch(error => console.log(error))

  // await getToken('0x26FD2D6a09A861CC6C16716199eEF6bdB4FD1edf', '0', 'rinkeby')
  await getToken("0x7B5D6c1ed1d3D2cC0395f680576b0D0bDD7ebdDd", "6", "rinkeby")
  await getToken("0xa722f8e783d472ab66fb2e4be1c1ca01bd166c3b", "32525", "Eth")
  await getToken("0xd07dc4262bcdbf85190c01c996b4c06a461d2430", "103133", "Eth")
  await getToken("0x8b4616926705fb61e9c4eeac07cd946a5d4b0760", "5030", "Eth")
  await getToken("0x90d86699b60938fca1cb5817c6e85f65e84663eb", "147", "Eth")
  await getToken("0x6d4530149e5b4483d2f7e60449c02570531a0751", "2246", "Eth")
  await getToken("0xb47e3cd837ddf8e4c57f05d70ab865de6e193bbb", "547", "Eth")
  await getToken("0xc7e5e9434f4a71e6db978bd65b4d61d3593e5f27", "12146", "Eth")
  await getToken(
    "0x33a4cfc925ad40e5bb2b9b2462d7a1a5a5da4476",
    "57896044618658097711785492504343953929016968901266851264415136113747971538945",
    "Eth"
  )
})()

// // Receive an event when ANY transfer occurs
// daiContract.on("Transfer", (from, to, amount, event) => {
//   console.log(`${from} sent ${formatEther(amount)} to ${to}`);
//   // The event object contains the verbatim log data, the
//   // EventFragment and functions to fetch the block,
//   // transaction and receipt and event functions
// });

// // A filter for when a specific address receives tokens
// myAddress = "0x8ba1f109551bD432803012645Ac136ddd64DBA72";
// filter = daiContract.filters.Transfer(null, myAddress)
// // {
// //   address: 'dai.tokens.ethers.eth',
// //   topics: [
// //     '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef',
// //     null,
// //     '0x0000000000000000000000008ba1f109551bd432803012645ac136ddd64dba72'
// //   ]
// // }

// // Receive an event when that filter occurs
// daiContract.on(filter, (from, to, amount, event) => {
//   // The to will always be "address"
//   console.log(`I got ${formatEther(amount)} from ${from}.`);
// });
