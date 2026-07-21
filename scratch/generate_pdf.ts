import puppeteer from 'puppeteer-core';
import path from 'path';

async function renderPdf() {
  const htmlPath = path.resolve('/home/zenmi/Projects/vendormind/vendormind_pitch_deck.html');
  const pdfWorkspacePath = path.resolve('/home/zenmi/Projects/vendormind/vendormind_pitch_deck.pdf');
  const pdfArtifactPath = '/home/zenmi/.gemini/antigravity-cli/brain/b53f12d1-d1d0-4f57-a4bf-aef3ecc7b6c4/vendormind_pitch_deck.pdf';

  console.log('🚀 Launching Puppeteer with Chromium binary at /usr/bin/chromium...');
  const browser = await puppeteer.launch({
    executablePath: '/usr/bin/chromium',
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu'
    ]
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 720, deviceScaleFactor: 2 });
  await page.goto(`file://${htmlPath}`, { waitUntil: 'networkidle0' });

  console.log('📄 Rendering 16:9 PDF slides...');
  await page.pdf({
    path: pdfWorkspacePath,
    printBackground: true,
    width: '1280px',
    height: '720px',
    margin: { top: 0, right: 0, bottom: 0, left: 0 }
  });

  await page.pdf({
    path: pdfArtifactPath,
    printBackground: true,
    width: '1280px',
    height: '720px',
    margin: { top: 0, right: 0, bottom: 0, left: 0 }
  });

  await browser.close();
  console.log(`✅ PDF Pitch Deck successfully generated with Puppeteer!`);
  console.log(`📍 Workspace PDF: ${pdfWorkspacePath}`);
  console.log(`📍 Artifact PDF: ${pdfArtifactPath}`);
}

renderPdf().catch(err => {
  console.error('❌ PDF generation failed:', err);
  process.exit(1);
});
