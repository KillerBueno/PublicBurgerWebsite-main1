import puppeteer from 'puppeteer';
import { executablePath } from 'puppeteer';

const browser = await puppeteer.launch({
  executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  args: ['--no-sandbox', '--disable-setuid-sandbox'],
});

const page = await browser.newPage();
await page.setViewport({ width: 1920, height: 1080, deviceScaleFactor: 1 });

// Screen 1
await page.goto('http://localhost:5173/display?screen=1', { waitUntil: 'networkidle0' });
await page.screenshot({ path: 'menu-screen-1.jpeg', type: 'jpeg', quality: 95, clip: { x: 0, y: 0, width: 1920, height: 1080 } });
console.log('Screen 1 salvato: menu-screen-1.jpeg');

// Screen 2
await page.goto('http://localhost:5173/display?screen=2', { waitUntil: 'networkidle0' });
await page.screenshot({ path: 'menu-screen-2.jpeg', type: 'jpeg', quality: 95, clip: { x: 0, y: 0, width: 1920, height: 1080 } });
console.log('Screen 2 salvato: menu-screen-2.jpeg');

await browser.close();
