module.exports = {
  apps: [
    {
      name: 'vm-gateway',
      script: 'src/gateway/server.ts',
      interpreter: 'bun',
      env: { NODE_ENV: 'development' },
    },
    {
      name: 'vm-fleet-worker',
      script: 'src/fleet/worker.ts',
      interpreter: 'bun',
      env: { NODE_ENV: 'development' },
    },
    {
      name: 'vm-inbound-processor',
      script: 'src/workers/main.ts',
      interpreter: 'bun',
      env: { NODE_ENV: 'development' },
    },
    {
      name: 'vm-release-worker',
      script: 'src/workers/releaseMain.ts',
      interpreter: 'bun',
      env: { NODE_ENV: 'development' },
    },
    {
      name: 'vm-embed-worker',
      script: 'src/workers/embedMain.ts',
      interpreter: 'bun',
      env: { NODE_ENV: 'development' },
    },
    {
      name: 'vm-dashboard',
      script: 'index.ts',
      interpreter: 'bun',
      cwd: 'dashboard',
      env: { NODE_ENV: 'development', DASHBOARD_PORT: '5173' },
    },
  ],
};
