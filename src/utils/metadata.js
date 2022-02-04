/* eslint camelcase: off */
import config from "../config.js"
export default (opts) => {
  const sourceTokenLink =
    (opts.chainId !== "mainnet"
      ? "https://testnets.opensea.io/"
      : "https://opensea.io/") +
    `assets/${opts.sourceContract}/${opts.sourceTokenId}`
  const baseUri = config.apiBaseURI[opts.chainId]
  const image = `${baseUri}${opts.tokenId}/image.png`
  const image_original = `${baseUri}${opts.tokenId}/image.svg`
  const image_comparison = `${baseUri}${opts.tokenId}/image_comparison.png`
  const external_url = `${config.externalBaseURI[opts.chainId]}${opts.tokenId}`
  return JSON.stringify(
    {
      name: `Assemblage #${opts.tokenId}`,
      image,
      image_original,
      source_contract: opts.sourceContract,
      source_token_id: opts.sourceTokenId,
      external_url,
      description: `Assemblage analyzes the visual features of a token, deconstructs its aesthetics and assembles it into a newly-created piece in the Ethereum blockchain.

[Source Token](${sourceTokenLink})

[View side by side](${image_comparison})`,
    },
    null,
    2
  )
}
