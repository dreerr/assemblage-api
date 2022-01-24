import dotenv from "dotenv"
dotenv.config()

const config = {
  baseUrl: process.env.BASE_URL,
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
    templates: {
      "invite-email": process.env.INVITE_EMAIL_TEMPLATE,
      "reset-password": process.env.RESET_PASSWORD_EMAIL_TEMPLATE,
      verification: process.env.VERIFICATION_EMAIL_TEMPLATE,
    },
  },
  moralis: {
    serverUrl: process.env.MORALIS_SERVER_URL,
    appId: process.env.MORALIS_APPLICATION_ID,
  },
  env: process.env.NODE_ENV,
  port: process.env.PORT,
  unsafeHttps: process.env.UNSAFE_HTTPS,
  workingDir: process.env.WORKING_DIR,
  whitelist: [null, undefined, "null"].includes(process.env.WHITE_LIST)
    ? null
    : process.env.WHITE_LIST.split(","),
}

export default { ...config }
