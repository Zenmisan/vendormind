import index from './index.html';
import { join } from 'path';

const PORT = Number(process.env.DASHBOARD_PORT) || 5173;
const PUBLIC_DIR = join(import.meta.dir, 'public');

Bun.serve({
  port: PORT,
  routes: {
    '/logo-light.png': () => new Response(Bun.file(join(PUBLIC_DIR, 'logo-light.png'))),
    '/logo-dark.png': () => new Response(Bun.file(join(PUBLIC_DIR, 'logo-dark.png'))),
    '/*': index,
  },
  development: {
    hmr: true,
    console: true,
  },
});

console.log(`VendorMind dashboard running on http://localhost:${PORT}`);
