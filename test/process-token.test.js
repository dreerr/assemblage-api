import chai from "chai"
import chaiAsPromised from "chai-as-promised"
import { processToken } from "../src/blockchain/process-token.js"
const { expect } = chai
chai.use(chaiAsPromised)

const testTokens = [
  {
    address: "0x26FD2D6a09A861CC6C16716199eEF6bdB4FD1edf",
    tokenId: "0",
    chainId: "rinkeby",
  },
  {
    address: "0x7B5D6c1ed1d3D2cC0395f680576b0D0bDD7ebdDd",
    tokenId: "6",
    chainId: "rinkeby",
  },
  {
    address: "0xa722f8e783d472ab66fb2e4be1c1ca01bd166c3b",
    tokenId: "32525",
    chainId: "mainnet",
  },
  {
    address: "0xd07dc4262bcdbf85190c01c996b4c06a461d2430",
    tokenId: "103133",
    chainId: "mainnet",
  },
  {
    address: "0x8b4616926705fb61e9c4eeac07cd946a5d4b0760",
    tokenId: "5030",
    chainId: "mainnet",
  },
  {
    address: "0x90d86699b60938fca1cb5817c6e85f65e84663eb",
    tokenId: "147",
    chainId: "mainnet",
  },
  {
    address: "0x6d4530149e5b4483d2f7e60449c02570531a0751",
    tokenId: "2246",
    chainId: "mainnet",
  },
  {
    address: "0xb47e3cd837ddf8e4c57f05d70ab865de6e193bbb",
    tokenId: "547",
    chainId: "mainnet",
  },
  {
    address: "0xc7e5e9434f4a71e6db978bd65b4d61d3593e5f27",
    tokenId: "12146",
    chainId: "mainnet",
  },
  {
    address: "0x33a4cfc925ad40e5bb2b9b2462d7a1a5a5da4476",
    tokenId:
      "57896044618658097711785492504343953929016968901266851264415136113747971538945",
    chainId: "mainnet",
  },
]

describe("Processing", function () {
  testTokens.forEach((token, idx) => {
    it("Processes Example Token " + idx, async function () {
      const promise = processToken({
        sourceContract: token.address,
        sourceTokenId: token.tokenId,
        tokenId: idx,
        chainId: token.chainId,
      })
      await expect(promise).to.eventually.contain("/image.")
    }).timeout(120000)
  })
})
