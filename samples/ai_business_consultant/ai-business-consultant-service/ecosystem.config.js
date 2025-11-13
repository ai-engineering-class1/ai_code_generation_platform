module.exports = {
  apps: [
    {
      name: "ai-consultant",
      script: "dist/index.js", // 你的启动文件路径
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "500M",
      // env: {
      //   NODE_ENV: "production",
      // },
    },
  ],
};
