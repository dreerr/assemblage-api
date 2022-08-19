import rsync from "rsync"
import config from "../config.js"
import { sendText } from "../utils/telegram.js"

const backup = new rsync()
  .shell("ssh")
  .flags("az")
  .source("./data/mainnet/")
  .destination(config.backupDest)

export default () => {
  if (config.backupDest !== undefined && config.backupDest !== null) {
    backup.execute((error, code) => {
      if (error !== null) {
        sendText(`🚨 Assemblage Backup failed! Error: ${error}, Code: ${code}`)
      }
    })
  }
}
