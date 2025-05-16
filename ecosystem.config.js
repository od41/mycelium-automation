module.exports = {
    apps: [{
      name: 'mycelium-automation',
      script: 'dist/src/manager/index.js',  // Assuming TypeScript compiles to dist/
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        // Don't put sensitive env vars here
      }
    }]
  };