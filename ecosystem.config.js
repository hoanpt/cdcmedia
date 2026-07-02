module.exports = {
  apps: [
    {
      name: "cdc-media",
      script: "node_modules/next/dist/bin/next",
      args: "start",
      cwd: "C:\\mediacdc",
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "1G",
      env: {
        PORT: 3001,
        NODE_ENV: "production",
        DATABASE_URL: "file:C:/mediacdc/prisma/cdc-media.db",
        UPLOADS_PATH: "C:/cdcmedia-uploads",
        JWT_SECRET: "CDC_DaNang_Media_Secret_Token_20#6_Secure_Strong"
      }
    }
  ]
};
