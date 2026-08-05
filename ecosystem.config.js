module.exports = {
  apps: [
    {
      name: 'academic-workflow',
      script: './server.js',
      exec_mode: 'fork',
      instances: 1,
      autorestart: true,
      max_memory_restart: '512M',
      time: true,
      env: {
        PORT: 3101,
        NODE_ENV: 'production',
      },
    },
  ],
};
