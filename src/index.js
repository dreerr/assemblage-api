import config from './config.js'
import server from './server.js'
import scheduler from './scheduler.js'
// import { createAdmin, counter } from './bootstrap.js';

server.listen(config.port, () => {
  scheduler(server)
  console.info(`Server started on port ${config.port} (${config.env})`)

  // createAdmin();
  // counter();
})

const src = server

export default src
