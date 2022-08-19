import dotenv from "dotenv"
dotenv.config()

const parseList = (value) => {
  return [null, undefined, "null"].includes(value) ? null : value.split(",")
}

const config = {
  activeChains: Array.from(parseList(process.env.ACTIVE_CHAINS)),
  apiBaseURI: {
    localhost: process.env.BASE_URI_LOCALHOST,
    mainnet: process.env.BASE_URI_MAINNET,
    rinkeby: process.env.BASE_URI_RINKEBY,
  },
  backupDest: process.env.BACKUP_DEST,
  baseUrl: process.env.BASE_URL,
  contractAddress: process.env.CONTRACT_ADRESSESS,
  contractInterface: process.env.CONTRACT_INTERFACE,
  ddosConfig: {
    burst: process.env.DDOS_BRUST,
    limit: process.env.DDOS_LIMIT,
  },
  emails: {
    "api-key": process.env.SEND_GRID_API_KEY,
    from: {
      email: process.env.SENDER_EMAIL,
      name: process.env.SENDER_NAME,
    },
    to: parseList(process.env.SENDER_RECEPIENTS),
  },
  externalBaseURI: {
    localhost: process.env.EXTERNAL_URI_LOCALHOST,
    mainnet: process.env.EXTERNAL_URI_MAINNET,
    rinkeby: process.env.EXTERNAL_URI_RINKEBY,
  },
  env: process.env.NODE_ENV,
  ipfsGateway: process.env.IPFS_GATEWAY,
  moralis: {
    serverUrl: process.env.MORALIS_SERVER_URL,
    appId: process.env.MORALIS_APPLICATION_ID,
  },
  node: {
    mainnet: process.env.NODE_MAINNET,
    rinkeby: process.env.NODE_RINKEBY,
    localhost: process.env.NODE_LOCALHOST,
  },
  port: process.env.PORT,
  telegram: {
    active: process.env.TELEGRAM_ACTIVE,
    token: process.env.TELEGRAM_TOKEN,
    chatId: process.env.TELEGRAM_CHAT_ID,
  },
  unsafeHttps: process.env.UNSAFE_HTTPS,
  workingDir: process.env.WORKING_DIR,
  whitelist: parseList(process.env.WHITE_LIST),
}

export default { ...config }
