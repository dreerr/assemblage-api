import sendGridEmail from "@sendgrid/mail"
import config from "../config"

sendGridEmail.setApiKey(config.emails["api-key"])

export default async (payload) => {
  const msg = {
    from: config.emails.from,
    ...payload,
  }

  try {
    await sendGridEmail.send(msg)
    console.log("Mail has been sent successfully.")
  } catch (err) {
    console.log(`Mail Sent Error. Error Message is: ${err.message}`)
  }
}
