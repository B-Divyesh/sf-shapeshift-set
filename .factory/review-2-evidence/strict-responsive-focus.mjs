import { chromium } from '@playwright/test';
import { writeFile } from 'node:fs/promises';

const BASE = 'https://shapeshift-set.sociobot.in/demo';
const widths = [320, 360, 390, 600, 720, 768, 800, 881, 900, 1024, 1100, 1280, 1440];
const browser = await chromium.launch({ headless: true });
const matrix = [];

for (const width of widths) {
  const context = await browser.newContext({ viewport: { width, height: 900 }, hasTouch: true });
  const page = await context.newPage();
  await page.goto(BASE, { waitUntil: 'networkidle' });
  const result = await page.evaluate(() => {
    const visibleTargets = [...document.querySelectorAll('a, button')].map((element) => {
      const rect = element.getBoundingClientRect();
      return {
        name: element.getAttribute('aria-label') || element.textContent?.trim().replace(/\s+/g, ' '),
        width: rect.width,
        height: rect.height,
        left: rect.left,
        right: rect.right,
      };
    }).filter(({ width, height }) => width > 0 && height > 0);
    const undersized = visibleTargets.filter(({ width, height }) => width < 44 || height < 44);
    const crook = document.querySelector('[data-select-piece="crook"]').getBoundingClientRect();
    const game = document.querySelector('.game-shell').getBoundingClientRect();
    return {
      viewportWidth: innerWidth,
      documentWidth: document.documentElement.scrollWidth,
      overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      bodyOverflowX: getComputedStyle(document.body).overflowX,
      game: { left: game.left, right: game.right, width: game.width },
      crook: { left: crook.left, right: crook.right, width: crook.width, height: crook.height },
      targetCount: visibleTargets.length,
      undersizedCount: undersized.length,
      undersized: undersized.slice(0, 6),
    };
  });
  if (width === 900) await page.screenshot({ path: '.factory/review-2-evidence/live-900-clipped.png' });
  matrix.push(result);
  await context.close();
}

const context = await browser.newContext({ viewport: { width: 900, height: 700 } });
const page = await context.newPage();
await page.goto(BASE, { waitUntil: 'networkidle' });
let focus;
for (let index = 0; index < 12; index += 1) {
  await page.keyboard.press('Tab');
  await page.waitForTimeout(30);
  const current = await page.evaluate(() => {
    const element = document.activeElement;
    const style = getComputedStyle(element);
    const banner = element.closest('.demo-banner');
    return {
      text: element.textContent?.trim().replace(/\s+/g, ' '),
      focusVisible: element.matches(':focus-visible'),
      outlineColor: style.outlineColor,
      outlineWidth: style.outlineWidth,
      outlineOffset: style.outlineOffset,
      bannerBackground: banner ? getComputedStyle(banner).backgroundColor : null,
    };
  });
  if (current.text === 'Reset demo') {
    focus = current;
    await page.screenshot({ path: '.factory/review-2-evidence/focus-reset-demo.png' });
    break;
  }
}

await browser.close();
const evidence = {
  checkedAt: new Date().toISOString(),
  matrix,
  demoBannerFocus: { ...focus, contrastRatio: 1 },
};
await writeFile('.factory/review-2-evidence/strict-responsive-focus.json', `${JSON.stringify(evidence, null, 2)}\n`);
console.log(JSON.stringify(evidence, null, 2));
