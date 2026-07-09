module.exports = {
  apps: [
    {
      name: "cdc-media",
      script: "node_modules/next/dist/bin/next",
      args: "start",
      cwd: "C:\\mediacdc",
      instances: "max",
      exec_mode: "cluster",
      autorestart: true,
      watch: false,
      max_memory_restart: "2G",
      env: {
        PORT: 3001,
        NODE_ENV: "production",
        DATABASE_URL: "postgresql://postgres:password@localhost:5432/mediacdc?schema=public",
        UPLOADS_PATH: "/app/uploads",
        JWT_SECRET: "CDC_DaNang_Media_Secret_Token_20#6_Secure_Strong"
      }
    }
  ]
};
