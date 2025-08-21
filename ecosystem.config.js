module.exports = {
  apps: [
    {
      name: 'collaborative-editor-server',
      script: 'docker-compose up',
      watch: true,
      env: {
        NODE_ENV: 'production',
      },
      restart_delay: 3000,
      max_restarts: 10,
    },
  ],
};
