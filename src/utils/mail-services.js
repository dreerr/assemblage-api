import sendGridEmail from "@sendgrid/mail"
import config from "../config.js"
import { logger } from "./logger.js"

sendGridEmail.setApiKey(config.emails["api-key"])

export default async (payload) => {
  const msg = {
    from: config.emails.from,
    ...payload,
  }

  try {
    await sendGridEmail.send(msg)
    logger.info("Mail has been sent successfully.")
  } catch (err) {
    logger.error(`Mail Sent Error. Error Message is: ${err.message}`)
  }
}
