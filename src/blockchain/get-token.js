import { ethers } from "ethers";
import Moralis from 'moralis/node.js';
import dotenv from 'dotenv'
import fs from 'fs';
import got from 'got';

import { ERC1155Metadata } from "multi-token-standard-abi";

const ERC721 = JSON.parse(fs.readFileSync('./node_modules/@nibbstack/erc721/abi/NFTokenMetadata.json'));

dotenv.config();
const serverUrl = process.env.MORALIS_SERVER_URL;
const appId = process.env.MORALIS_APPLICATION_ID;
Moralis.start({ serverUrl, appId });
const provider = new ethers.providers.JsonRpcProvider(process.env.MORALIS_NODE_RINKEBY);


export const getToken = async (address, tokenID, opts = {}) => {
  let tokenURI, metadata

  if(!opts.tryManual) {

    // 1. TRY OPENSEA

    // 2.  TRY MORALIS
    const options = { address, token_id: tokenId, chain}
    try {
      const tokenData = await Moralis.Web3API.token.getTokenIdMetadata(options);
      if(tokenData.metadata) {
        metadata = JSON.parse(tokenData.metadata)
      }
    } catch (error) {
      console.log('No luck with Moralis, falling back to manual');
    }
  }

  // 3. TRY ERC721 MANUAL
  if (!metadata) {
    const contract = new ethers.Contract(address, ERC721, provider);
    try {
      tokenURI = await contract.tokenURI(tokenId);
    } catch (error) {
      console.log('No ERC721');
    }

    // TRY ERC1155
    if(!tokenURI) {
      const contract = new ethers.Contract(address, ERC1155Metadata.abi, provider);
      try {
        tokenURI = await contract.uri(tokenId);
      } catch (error) {
        console.log('No ERC1155, out of ideas! Inform boss!');
        return false
      }
    }

    // GET METADATA FOR ERC721 OR ERCC1155
    if (tokenURI.startsWith('http')) {
      try {
        metadata = await got(tokenURI).json();
      } catch (error) {
        console.log('Could not download, Inform boss!', error)
        return false
      }
    } else if (tokenURI.startsWith('ipfs')) {
      console.log('need to parse metadata');
    } else if (tokenURI.startsWith('data')) {
      console.log('need to parse data metadata');
    }
  }

  // TRY TO DOWNLOAD IMAGE
  if(!metadata.image && metadata.image_data && metadata.image_data.startsWith('<svg')) {
    fs.writeFileSync(`./download/${address}-${tokenId}.svg`, metadata.image_data)
  } else if(metadata.image && metadata.image.startsWith('http')) {
    const path = `./download/${address}-${tokenId}`
    got.stream(metadata.image).on('error', function (e) {
      console.log(e);
    }).pipe(fs.createWriteStream(path)).end(e => {console.log("moo", path)})
  }
}

const get



(async () => {

  await getToken('0xa722f8e783d472ab66fb2e4be1c1ca01bd166c3b', '32525', 'Eth')
  await getToken('0x26FD2D6a09A861CC6C16716199eEF6bdB4FD1edf', '0', 'rinkeby')
  await getToken('0x7B5D6c1ed1d3D2cC0395f680576b0D0bDD7ebdDd', '6', 'rinkeby')
  await getToken('0xd07dc4262bcdbf85190c01c996b4c06a461d2430', '103133', 'Eth')
  await getToken('0x8b4616926705fb61e9c4eeac07cd946a5d4b0760', '5030', 'Eth')
  await getToken('0x90d86699b60938fca1cb5817c6e85f65e84663eb', '147', 'Eth')
  await getToken('0x6d4530149e5b4483d2f7e60449c02570531a0751', '2246', 'Eth')
  await getToken('0xb47e3cd837ddf8e4c57f05d70ab865de6e193bbb', '547', 'Eth')
  await getToken('0xc7e5e9434f4a71e6db978bd65b4d61d3593e5f27', '12146', 'Eth')
  await getToken('0x33a4cfc925ad40e5bb2b9b2462d7a1a5a5da4476', '57896044618658097711785492504343953929016968901266851264415136113747971538945', 'Eth')


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