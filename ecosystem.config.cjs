module.exports = {
  apps: [
    {
      name: 'calming-space',
      script: './app.mjs',
      instances: 'max',
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 2113,
      },
      env_staging: {
        NODE_ENV: 'staging',
        PORT: 2114,
      },
    },
  ],
};
