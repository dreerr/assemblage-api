module.exports = {
  apps: [
    {
      name: "assemblage-api",
      script: "./src/index.js",
      watch: ["src", "contracts"],
      watch_delay: 1000,
      cron_restart: '0 0 * * *',
      instance_var: "INSTANCE_ID",
      env: {
        NODE_ENV: "production",
      },
    },
  ],
}
