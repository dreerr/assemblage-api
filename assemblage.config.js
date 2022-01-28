module.exports = {
  apps : [
      {
        name: "assemblage-api",
        script: "./src/index.js",
        watch: true,
        instance_var: 'INSTANCE_ID',
        env: {
          "NODE_ENV": "production",
        }
      }
  ]
}
