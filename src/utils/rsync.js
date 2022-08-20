import Rsync from "rsync"
import config from "../config.js"
import { logger } from "../utils/logger.js"
import { sendText } from "../utils/telegram.js"

const enabled = config.backupDest !== undefined && config.backupDest !== null

if (!enabled) logger.info("rsync backup/upload is disabled!")

const backup = new Rsync()
  .shell("ssh")
  .flags("az")
  .source("./data/mainnet/")
  .destination(config.backupDest)

export default () => {
  if (enabled) {
    backup.execute((error, code) => {
      if (error !== null) {
        logger.error(`Backup failed! Error: ${error}, Code: ${code}`)
        sendText(`🚨 Assemblage Backup failed! Error: ${error}, Code: ${code}`)
      }
    })
  }
}
