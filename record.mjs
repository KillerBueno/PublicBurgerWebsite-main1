import puppeteer from 'puppeteer';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const FRAMES_DIR = './frames_tmp';
const FPS = 30;
const DURATION = 4; // secondi — cattura i primi 4 sec con l'animazione in entrata
const TOTAL_FRAMES = FPS * DURATION;

if (fs.existsSync(FRAMES_DIR)) fs.rmSync(FRAMES_DIR, { recursive: true });
fs.mkdirSync(FRAMES_DIR);

const browser = await puppeteer.launch({
  executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  args: ['--no-sandbox'],
});
const page = await browser.newPage();
await page.setViewport({ width: 1920, height: 1080, deviceScaleFactor: 1 });
await page.goto('http://localhost:5173/display?screen=1', { waitUntil: 'networkidle0' });

console.log(`Cattura ${TOTAL_FRAMES} frame a ${FPS}fps...`);
for (let i = 0; i < TOTAL_FRAMES; i++) {
  const num = String(i).padStart(4, '0');
  await page.screenshot({ path: path.join(FRAMES_DIR, `frame_${num}.jpg`), type: 'jpeg', quality: 90 });
  await new Promise(r => setTimeout(r, 1000 / FPS));
  if (i % 15 === 0) process.stdout.write(`\r  frame ${i}/${TOTAL_FRAMES}`);
}
console.log('\nFrame catturati. Creo MP4...');
await browser.close();

const ffmpegBin = (await import('ffmpeg-static')).default;
execSync(`"${ffmpegBin}" -y -framerate ${FPS} -i ${FRAMES_DIR}/frame_%04d.jpg -c:v libx264 -pix_fmt yuv420p -crf 18 menu-screen-1.mp4`);
fs.rmSync(FRAMES_DIR, { recursive: true });
console.log('Salvato: menu-screen-1.mp4');
