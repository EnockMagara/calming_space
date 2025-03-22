module.exports = {
  apps: [
    {
      name: 'calming-space-staging',
      script: './app.mjs',
      instances: 'max',
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'staging',
        PORT: 2114,
      },
    },
    {
      name: 'calming-space',
      script: './app.mjs',
      instances: 'max',
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 2113,
      },
    },
  ],
};