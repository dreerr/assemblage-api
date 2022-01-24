import fs from "fs"
import csvWriter from "csv-write-stream"

const setup = (file, headers) => {
  let writer
  if (!fs.existsSync(file)) writer = csvWriter({ headers })
  else writer = csvWriter({ sendHeaders: false })

  writer.pipe(fs.createWriteStream(file, { flags: "a" }))
  process.on("SIGTERM", () => {
    writer.close()
  })
  return writer
}

const mintWriter = setup("log/mints.csv", [
  "hash",
  "token_address",
  "token_id",
  "account",
  "ip",
])

export const logMint = (data) => {
  mintWriter.write(data)
}

const orderWriter = setup("log/orders.csv", ["hash", "order", "ip"])

export const logOrder = (data) => {
  orderWriter.write(data)
}
