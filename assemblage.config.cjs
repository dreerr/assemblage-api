module.exports = {
  apps: [
    {
      name: "assemblage-api",
      script: "./src/index.js",
      watch: ["src", "contracts"],
      watch_delay: 1000,
      instance_var: "INSTANCE_ID",
      env: {
        NODE_ENV: "production",
      },
    },
  ],
}
