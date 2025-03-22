export default {
  apps: [{
    name: 'calming-space',
    script: 'app.mjs',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 2113
    }
  }]
}; 