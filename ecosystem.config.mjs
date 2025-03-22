export default {
  apps: [
    {
      name: 'calming-space',
      script: './app.mjs',
      instances: 'max', // Use all available CPU cores
      exec_mode: 'cluster', // Enable cluster mode for zero-downtime reloads
      env: {
        NODE_ENV: 'production',
        PORT: 2113, // Default port for production
      },
      env_staging: {
        NODE_ENV: 'staging',
        PORT: 2114, // Port for staging, can be overridden by --port
      },
    },
  ],
};