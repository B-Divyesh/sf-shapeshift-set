import { writeFileSync } from 'node:fs';
import { chromium } from 'playwright';

const base = 'https://shapeshift-set.sociobot.in';
const output = new URL('.', import.meta.url).pathname;
const result = { checkedAt: new Date().toISOString(), persistence: {}, rejectedWrite: {}, keyboard: {}, connectivity: {}, metadata: {} };
const assert = (value, message) => { if (!value) throw new Error(message); };

async function placeMote(page) {
  const piece = page.locator('[data-select-piece="mote"]');
  await piece.click();
  for (let flip = 0; flip < 2; flip += 1) {
    for (let turn = 0; turn < 4; turn += 1) {
      if ((await piece.locator('small').textContent()) === 'Ready') {
        await page.getByRole('button', { name: /Place selected creature in Mote habitat/ }).first().click();
        return;
      }
      await page.locator('[data-rotate="1"]').click();
    }
    await page.locator('[data-flip]').click();
  }
  throw new Error('Mote did not become ready');
}

const browser = await chromium.launch();
try {
  const persistentContext = await browser.newContext();
  const persistent = await persistentContext.newPage();
  await persistent.goto(`${base}/`, { waitUntil: 'networkidle' });
  await persistent.evaluate(() => localStorage.clear());
  await persistent.reload({ waitUntil: 'networkidle' });
  await placeMote(persistent);
  const before = await persistent.evaluate(() => ({ keys: Object.keys(localStorage), values: Object.values(localStorage) }));
  await persistent.reload({ waitUntil: 'networkidle' });
  const after = { score: await persistent.locator('.score-box strong').textContent(), trail: await persistent.locator('.score-trail li').count(), moteDisabled: await persistent.locator('[data-select-piece="mote"]').isDisabled() };
  assert(before.keys.length === 1 && before.keys[0].startsWith('shapeshift-set:daily:'), 'real storage namespace');
  assert(after.trail === 1 && after.moteDisabled, 'real persistence after reload');
  result.persistence = { storage: before, after };
  await persistentContext.close();

  const rejectedContext = await browser.newContext();
  await rejectedContext.addInitScript(() => {
    Storage.prototype.setItem = () => { throw new DOMException('Storage full', 'QuotaExceededError'); };
  });
  const rejected = await rejectedContext.newPage();
  await rejected.goto(`${base}/`, { waitUntil: 'networkidle' });
  await placeMote(rejected);
  const warning = (await rejected.locator('.status-row').textContent())?.trim();
  assert(warning === 'Progress could not be saved. This run will not survive reload. Keep this tab open to finish the board.', 'rejected storage warning');
  await rejected.reload({ waitUntil: 'networkidle' });
  const scoreAfterReload = await rejected.locator('.score-box strong').textContent();
  assert(scoreAfterReload === '0/5', 'rejected write recovery');
  result.rejectedWrite = { warning, scoreAfterReload };
  await rejectedContext.close();

  const keyboardContext = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const keyboard = await keyboardContext.newPage();
  await keyboard.goto(`${base}/`, { waitUntil: 'networkidle' });
  await keyboard.keyboard.press('Tab');
  const skip = await keyboard.evaluate(() => ({ text: document.activeElement?.textContent?.trim(), visible: document.activeElement?.matches(':focus-visible'), outline: getComputedStyle(document.activeElement).outline }));
  await keyboard.keyboard.press('Enter');
  const mainFocused = await keyboard.evaluate(() => document.activeElement === document.querySelector('main'));
  assert(skip.text === 'Skip to the puzzle' && skip.visible && !skip.outline.includes('none') && mainFocused, 'skip link');
  result.keyboard = { skip, mainFocused };
  await keyboardContext.close();

  const connectivityContext = await browser.newContext();
  const connectivity = await connectivityContext.newPage();
  await connectivity.goto(`${base}/demo`, { waitUntil: 'networkidle' });
  await placeMote(connectivity);
  await connectivityContext.setOffline(true);
  const offlineMessage = (await connectivity.locator('.status-row').textContent())?.trim();
  const offlineScore = await connectivity.locator('.score-box strong').textContent();
  await connectivityContext.setOffline(false);
  await connectivity.waitForFunction(() => document.querySelector('.status-row')?.textContent?.includes('back online'));
  const onlineMessage = (await connectivity.locator('.status-row').textContent())?.trim();
  const onlineScore = await connectivity.locator('.score-box strong').textContent();
  assert(offlineMessage === 'You are offline. This loaded board still works.' && onlineMessage === 'You are back online. The current board stayed in place.' && offlineScore === '1/5' && onlineScore === '1/5', 'connectivity recovery');
  result.connectivity = { offlineMessage, onlineMessage, offlineScore, onlineScore };
  await connectivityContext.close();

  const metadataContext = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const metadata = await metadataContext.newPage();
  const consoleErrors = [];
  metadata.on('console', message => { if (message.type() === 'error') consoleErrors.push(message.text()); });
  for (const [path, canonical] of [['/', '/'], ['/demo', '/demo'], ['/privacy', '/privacy'], ['/terms', '/terms']]) {
    await metadata.goto(`${base}${path}`, { waitUntil: 'networkidle' });
    const details = await metadata.evaluate(() => ({
      description: document.querySelector('meta[name="description"]')?.content,
      canonical: document.querySelector('link[rel="canonical"]')?.href,
      viewport: document.querySelector('meta[name="viewport"]')?.content,
      imagesMissingAlt: [...document.images].filter(image => !image.hasAttribute('alt')).length,
      audio: document.querySelectorAll('audio,video').length,
    }));
    assert(details.description && details.description.length <= 155, `description ${path}`);
    assert(details.canonical === `${base}${canonical}`, `canonical ${path}`);
    assert(!/user-scalable\s*=\s*no|maximum-scale\s*=\s*1/i.test(details.viewport), `zoom ${path}`);
    assert(details.imagesMissingAlt === 0 && details.audio === 0, `media ${path}`);
    result.metadata[path] = details;
  }
  result.metadata.consoleErrors = [...consoleErrors];
  assert(consoleErrors.length === 0, 'metadata console errors');
  const response = await metadata.goto(`${base}/missing-page-review-5`, { waitUntil: 'networkidle' });
  assert(response.status() === 404 && await metadata.getByRole('link', { name: 'Return to today’s puzzle' }).isVisible(), 'designed 404');
  await metadata.screenshot({ path: `${output}/designed-404-phone.png`, fullPage: true });
  result.metadata.missing = { status: response.status(), title: await metadata.title(), returnAction: true, expected404Console: consoleErrors.slice() };
  await metadataContext.close();
} finally {
  await browser.close();
}

writeFileSync(`${output}/supplemental.json`, `${JSON.stringify(result, null, 2)}\n`);
console.log(JSON.stringify(result, null, 2));
