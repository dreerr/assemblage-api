import Rsync from "rsync"
import config from "../config.js"
import { logger } from "../utils/logger.js"
import { sendText } from "../utils/telegram.js"

const backup = new Rsync()
  .shell("ssh")
  .flags("az")
  .source("./data/mainnet/")
  .destination(config.backupDest)

export default () => {
  if (config.backupDest !== undefined && config.backupDest !== null) {
    backup.execute((error, code) => {
      if (error !== null) {
        logger.error(`Backup failed! Error: ${error}, Code: ${code}`)
        sendText(`🚨 Assemblage Backup failed! Error: ${error}, Code: ${code}`)
      }
    })
  }
}
