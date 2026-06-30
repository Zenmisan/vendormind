import index from './index.html';

const PORT = Number(process.env.DASHBOARD_PORT) || 5173;

Bun.serve({
  port: PORT,
  routes: {
    // SPA — serve the same HTML for all routes, React Router handles navigation
    '/*': index,
  },
  development: {
    hmr: true,
    console: true,
  },
});

console.log(`VendorMind dashboard running on http://localhost:${PORT}`);
