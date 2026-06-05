module.exports = {
  apps: [
    {
      name: 'vm-gateway',
      script: 'src/gateway/server.ts',
      interpreter: 'bun',
      env: {
        NODE_ENV: 'development',
      },
    },
    {
      name: 'vm-fleet-worker',
      script: 'src/fleet/worker.ts',
      interpreter: 'bun',
      env: {
        NODE_ENV: 'development',
      },
    },
    {
      name: 'vm-inbound-processor',
      script: 'src/workers/main.ts',
      interpreter: 'bun',
      env: {
        NODE_ENV: 'development',
      },
    },
    {
      name: 'vm-dashboard',
      script: 'bun x vite',
      cwd: 'dashboard',
      args: '--port 5173 --host 0.0.0.0',
      env: {
        NODE_ENV: 'development',
      },
    },
  ],
};
