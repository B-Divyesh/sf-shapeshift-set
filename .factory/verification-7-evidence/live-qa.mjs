import { mkdirSync, writeFileSync } from 'node:fs';
import { chromium, devices } from 'playwright';
import AxeBuilder from '@axe-core/playwright';

const base = 'https://shapeshift-set.sociobot.in';
const output = new URL('.', import.meta.url).pathname;
const perfect = ['mote', 'nook', 'crown', 'crook', 'wing'];
const loss = [...perfect].reverse();
const keys = { mote: '1', nook: '2', wing: '3', crown: '4', crook: '5' };
const report = { checkedAt: new Date().toISOString(), desktop: {}, phone: {}, keyboard: {}, isolation: {}, routes: {}, accessibility: {}, offline: {}, recovery: {}, privacy: {}, performance: {} };
const ensure = (condition, message) => { if (!condition) throw new Error(message); };

async function orient(page, id, input = 'pointer') {
  const piece = page.locator(`[data-select-piece="${id}"]`);
  if (input === 'touch') await piece.tap();
  else if (input === 'keyboard') await page.keyboard.press(keys[id]);
  else await piece.click();
  for (let flip = 0; flip < 2; flip += 1) {
    for (let turn = 0; turn < 4; turn += 1) {
      if (await piece.locator('small').textContent() === 'Ready') return;
      if (input === 'touch') await page.locator('[data-rotate="1"]').tap();
      else if (input === 'keyboard') await page.keyboard.press('e');
      else await page.locator('[data-rotate="1"]').click();
    }
    if (input === 'touch') await page.locator('[data-flip]').tap();
    else if (input === 'keyboard') await page.keyboard.press('f');
    else await page.locator('[data-flip]').click();
  }
  throw new Error(`Could not orient ${id}`);
}

async function place(page, id, input = 'pointer') {
  await orient(page, id, input);
  const name = id[0].toUpperCase() + id.slice(1);
  const target = page.getByRole('button', { name: new RegExp(`Place selected creature in ${name} habitat`) }).first();
  if (input === 'touch') await target.tap();
  else if (input === 'keyboard') { await target.focus(); await page.keyboard.press('Enter'); }
  else await target.click();
}

async function solve(page, ids, input) { for (const id of ids) await place(page, id, input); }
async function end(page, score, label) {
  await page.getByRole('heading', { name: `You changed ${score} of 5` }).waitFor();
  const result = { score: await page.locator('.score-box strong').textContent(), label: await page.getByText(label, { exact: true }).textContent(), items: await page.locator('.score-trail li').count(), successes: await page.locator('.score-trail li.success').count() };
  ensure(result.score === `${score}/5` && result.items === 5 && result.successes === score, `end screen ${score}`);
  return result;
}
async function violations(page) { return (await new AxeBuilder({ page }).analyze()).violations.map(({ id, impact, nodes }) => ({ id, impact, nodes: nodes.length })); }

mkdirSync(output, { recursive: true });
const browser = await chromium.launch();
try {
  const desktopContext = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  await desktopContext.grantPermissions(['clipboard-read', 'clipboard-write'], { origin: base });
  const page = await desktopContext.newPage();
  const requests = [], errors = [];
  page.on('request', request => requests.push({ method: request.method(), origin: new URL(request.url()).origin, body: request.postData() }));
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  page.on('pageerror', error => errors.push(String(error)));
  await page.goto(`${base}/`, { waitUntil: 'networkidle' });
  report.desktop.first = await page.evaluate(() => {
    const inView = element => { const rect = element?.getBoundingClientRect(); return Boolean(rect && rect.top >= 0 && rect.bottom <= innerHeight); };
    return { title: document.title, h1: document.querySelector('h1')?.textContent?.trim(), audience: document.querySelector('.hero-summary')?.textContent?.trim(), action: document.querySelector('.hero-action .button')?.textContent?.trim(), actionNote: document.querySelector('.hero-action span')?.textContent?.trim(), facts: [...document.querySelectorAll('.plain-facts li')].map(item => item.textContent.trim()), actionVisible: inView(document.querySelector('.hero-action .button')), boardVisible: inView(document.querySelector('.board')), overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth };
  });
  ensure(report.desktop.first.title === 'Shapeshift Set — order five creatures daily' && report.desktop.first.h1 === 'Place five creatures in the right order' && report.desktop.first.audience.includes('daily puzzle players') && report.desktop.first.action === 'Try it with sample data' && report.desktop.first.actionNote === 'Opens a complete sample board.' && report.desktop.first.facts.length === 3 && report.desktop.first.actionVisible && report.desktop.first.boardVisible && report.desktop.first.overflow <= 0, 'desktop first screen');
  await page.screenshot({ path: `${output}/first-desktop.png` });
  await page.getByRole('link', { name: 'Try it with sample data' }).click();
  await page.waitForURL(`${base}/demo`);
  report.desktop.sample = { banner: await page.getByRole('complementary', { name: 'Demo mode' }).textContent(), date: await page.locator('.game-topline .section-label').textContent(), boardId: await page.locator('.seed strong').textContent() };
  ensure(report.desktop.sample.banner.includes('Demo — sample board, nothing is saved') && report.desktop.sample.date.includes('August 14, 2026') && report.desktop.sample.boardId === '989809312', 'sample presentation');
  await page.locator('.board-cell.habitat').first().click(); const noSelection = await page.locator('.status-row').textContent();
  await page.locator('.board-cell:not(.habitat)').first().click(); const openGround = await page.locator('.status-row').textContent();
  await page.locator('[data-select-piece="mote"]').click(); await page.getByRole('button', { name: /Place selected creature in Nook habitat/ }).first().click(); const wrongShape = await page.locator('.status-row').textContent();
  await page.locator('[data-rotate="1"]').click(); await page.getByRole('button', { name: /Place selected creature in Mote habitat/ }).first().click(); const wrongOrientation = await page.locator('.status-row').textContent();
  ensure(noSelection.includes('No creature is selected') && openGround.includes('no habitat') && wrongShape.includes('different shape') && wrongOrientation.includes('do not match'), 'invalid-input recovery');
  report.recovery.invalid = { noSelection, openGround, wrongShape, wrongOrientation };
  await page.getByRole('button', { name: 'Reset demo' }).first().click(); await solve(page, loss); report.desktop.loss = await end(page, 1, 'Try again (0–2)'); await page.screenshot({ path: `${output}/loss-desktop.png`, fullPage: true });
  await page.getByRole('button', { name: 'Play this board again' }).click(); ensure(await page.locator('.score-box strong').textContent() === '0/5' && await page.locator('.score-trail li').count() === 0, 'replay reset');
  await solve(page, perfect); report.desktop.win = await end(page, 5, 'Perfect (5)'); await page.getByRole('button', { name: 'Copy result' }).click(); report.desktop.clipboard = await page.evaluate(() => navigator.clipboard.readText()); ensure(report.desktop.clipboard.includes('5/5 · Radiant') && report.desktop.clipboard.includes('Board ID 989809312'), 'copy result'); await page.screenshot({ path: `${output}/win-desktop.png`, fullPage: true });
  await page.getByRole('button', { name: 'Play this board again' }).click(); await place(page, 'mote'); await page.getByRole('button', { name: 'Undo last piece' }).click(); report.recovery.undo = { score: await page.locator('.score-box strong').textContent(), moves: await page.locator('.score-trail li').count(), available: await page.locator('[data-select-piece="mote"]').isEnabled() }; ensure(report.recovery.undo.score === '0/5' && report.recovery.undo.moves === 0 && report.recovery.undo.available, 'undo recovery');
  report.privacy = { requests, errors }; ensure(requests.every(request => request.origin === base && request.method === 'GET' && !request.body) && errors.length === 0, 'same-origin/no-error live run');
  await desktopContext.close();

  const isolationContext = await browser.newContext(); const isolated = await isolationContext.newPage(); await isolated.goto(`${base}/`, { waitUntil: 'networkidle' });
  const before = await isolated.evaluate(async () => { const today = new Date().toISOString().slice(0, 10); localStorage.clear(); localStorage.setItem('shapeshift-set:daily:2026-08-14', JSON.stringify({ date: '2026-08-14', moves: [{ id: 'mote' }] })); localStorage.setItem(`shapeshift-set:daily:${today}`, JSON.stringify({ date: today, moves: [{ id: 'mote' }] })); localStorage.setItem('real-progress-sentinel', 'keep'); document.cookie = 'real-progress-cookie=keep; path=/'; let opfs = null; if (navigator.storage.getDirectory) { const root = await navigator.storage.getDirectory(); const file = await root.getFileHandle('real-progress-sentinel.txt', { create: true }); const out = await file.createWritable(); await out.write('keep'); await out.close(); opfs = await (await file.getFile()).text(); } return { today, storage: JSON.stringify(Object.entries(localStorage).sort()), cookie: document.cookie, opfs }; });
  await isolated.addInitScript(() => { window.__realReads = []; const get = Storage.prototype.getItem; Storage.prototype.getItem = function(key) { if (this === window.localStorage && key.startsWith('shapeshift-set:daily:')) window.__realReads.push(key); return get.call(this, key); }; });
  await isolated.goto(`${base}/demo`, { waitUntil: 'networkidle' }); await place(isolated, 'mote'); await isolated.getByRole('button', { name: 'Reset demo' }).first().click();
  const during = await isolated.evaluate(async () => { let opfs = null; if (navigator.storage.getDirectory) { const root = await navigator.storage.getDirectory(); opfs = await (await (await root.getFileHandle('real-progress-sentinel.txt')).getFile()).text(); } return { storage: JSON.stringify(Object.entries(localStorage).sort()), cookie: document.cookie, databases: await indexedDB.databases(), opfs, reads: window.__realReads }; });
  ensure(during.storage === before.storage && during.cookie === before.cookie && during.databases.length === 0 && during.opfs === before.opfs && during.reads.length === 0, 'demo isolation while active');
  await isolated.getByRole('link', { name: 'Start for real' }).click(); const after = await isolated.evaluate(async () => { let opfs = null; if (navigator.storage.getDirectory) { const root = await navigator.storage.getDirectory(); opfs = await (await (await root.getFileHandle('real-progress-sentinel.txt')).getFile()).text(); } return { storage: JSON.stringify(Object.entries(localStorage).sort()), cookie: document.cookie, opfs, reads: window.__realReads }; });
  ensure(after.storage === before.storage && after.cookie === before.cookie && after.opfs === before.opfs && JSON.stringify(after.reads) === JSON.stringify([`shapeshift-set:daily:${before.today}`]), 'demo isolation after exit'); report.isolation = { before, during, after };
  const reset = isolated.getByRole('button', { name: 'Reset board' }); await reset.click(); const dialog = isolated.getByRole('dialog'); const focusInside = await isolated.evaluate(() => Boolean(document.activeElement?.closest('dialog'))); await isolated.keyboard.press('Escape'); const focusReturned = await reset.evaluate(node => node === document.activeElement); ensure(focusInside && focusReturned, 'dialog focus'); report.accessibility.dialog = { focusInside, focusReturned }; await isolationContext.close();

  const keyContext = await browser.newContext({ viewport: { width: 1440, height: 900 } }); const keyboard = await keyContext.newPage(); await keyboard.goto(`${base}/demo`, { waitUntil: 'networkidle' }); await keyboard.keyboard.press('1'); await keyboard.keyboard.press('q'); await keyboard.keyboard.press('e'); await keyboard.keyboard.press('f'); await keyboard.keyboard.press('f'); const moteTarget = keyboard.getByRole('button', { name: /Place selected creature in Mote habitat/ }).first(); await moteTarget.focus(); await keyboard.keyboard.press('ArrowRight'); await keyboard.keyboard.press('ArrowLeft'); await keyboard.keyboard.press('Space'); await solve(keyboard, perfect.slice(1), 'keyboard'); report.keyboard = await end(keyboard, 5, 'Perfect (5)'); await keyboard.screenshot({ path: `${output}/win-keyboard.png`, fullPage: true }); await keyContext.close();

  const phoneContext = await browser.newContext({ ...devices['iPhone 13'], viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true }); const phone = await phoneContext.newPage(); await phone.goto(`${base}/`, { waitUntil: 'networkidle' }); report.phone.first = await phone.evaluate(() => { const action = document.querySelector('.hero-action .button')?.getBoundingClientRect(); const board = document.querySelector('.board')?.getBoundingClientRect(); return { h1: document.querySelector('h1')?.textContent?.trim(), action: document.querySelector('.hero-action .button')?.textContent?.trim(), facts: [...document.querySelectorAll('.plain-facts li')].map(item => item.textContent.trim()), actionVisible: Boolean(action && action.bottom <= innerHeight), boardVisible: Boolean(board && board.top < innerHeight), overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth }; }); ensure(report.phone.first.h1 === 'Place five creatures in the right order' && report.phone.first.action === 'Try it with sample data' && report.phone.first.facts.length === 3 && report.phone.first.actionVisible && report.phone.first.boardVisible && report.phone.first.overflow <= 0, 'phone first screen'); await phone.screenshot({ path: `${output}/first-phone.png` }); await phone.getByRole('link', { name: 'Try it with sample data' }).tap(); await solve(phone, perfect, 'touch'); report.phone.win = await end(phone, 5, 'Perfect (5)'); report.phone.overflow = await phone.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth); ensure(report.phone.overflow <= 0, 'phone end screen overflow'); await phone.screenshot({ path: `${output}/win-phone.png`, fullPage: true }); await phoneContext.close();

  const routes = await browser.newContext(); const routePage = await routes.newPage(); for (const [path, status, title] of [['/', 200, 'Shapeshift Set — order five creatures daily'], ['/demo', 200, 'Demo — Shapeshift Set'], ['/privacy', 200, 'Privacy — Shapeshift Set'], ['/terms', 200, 'Terms — Shapeshift Set'], ['/missing-page-verification-7', 404, 'Page not found — Shapeshift Set']]) { const response = await routePage.goto(`${base}${path}`, { waitUntil: 'networkidle' }); const result = { status: response?.status(), title: await routePage.title(), h1: await routePage.locator('h1').count(), main: await routePage.locator('main').count(), footer: await routePage.locator('footer').count(), axe: await violations(routePage) }; ensure(result.status === status && result.title === title && result.h1 === 1 && result.main === 1 && result.footer === 1 && result.axe.length === 0, `route ${path}`); report.routes[path] = result; } await routes.close();

  const reducedContext = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' }); const reduced = await reducedContext.newPage(); await reduced.goto(`${base}/demo`, { waitUntil: 'networkidle' }); await place(reduced, 'mote'); report.accessibility.reducedMotion = await reduced.locator('.board-cell.placed').first().evaluate(node => ({ animation: getComputedStyle(node).animationDuration, transition: getComputedStyle(node).transitionDuration })); ensure(Number.parseFloat(report.accessibility.reducedMotion.animation) <= .00001 && Number.parseFloat(report.accessibility.reducedMotion.transition) <= .00001, 'reduced motion'); await reducedContext.close();
  const offlineContext = await browser.newContext({ viewport: { width: 390, height: 844 } }); const offline = await offlineContext.newPage(); await offline.goto(`${base}/demo`, { waitUntil: 'networkidle' }); await offline.waitForFunction(() => Boolean(navigator.serviceWorker.controller)); await offline.reload({ waitUntil: 'networkidle' }); await offlineContext.setOffline(true); await offline.reload({ waitUntil: 'domcontentloaded' }); report.offline = { h1: await offline.locator('h1').textContent(), board: await offline.locator('.board').isVisible() }; ensure(report.offline.h1 === 'Place five sample creatures in order' && report.offline.board, 'offline reload'); await offlineContext.close();
  const performanceContext = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true }); const performance = await performanceContext.newPage(); const cdp = await performanceContext.newCDPSession(performance); await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 }); await performance.goto(`${base}/demo`, { waitUntil: 'networkidle' }); report.performance = await performance.evaluate(async () => { const initial = Number(document.documentElement.dataset.gameTicks); const frames = await new Promise(resolve => { const times = []; const tick = time => { times.push(time); times.length === 181 ? resolve(times) : requestAnimationFrame(tick); }; requestAnimationFrame(tick); }); const elapsed = frames.at(-1) - frames[0]; return { fps: 180000 / elapsed, fixedStepHz: (Number(document.documentElement.dataset.gameTicks) - initial) * 1000 / elapsed, target: document.documentElement.dataset.frameTarget }; }); ensure(report.performance.fps >= 55 && report.performance.fps <= 65 && report.performance.fixedStepHz >= 55 && report.performance.fixedStepHz <= 65 && report.performance.target === '60', 'frame rate'); await performanceContext.close();
} finally { await browser.close(); }
const response = await fetch(`${base}/`); report.headers = { hsts: response.headers.get('strict-transport-security'), nosniff: response.headers.get('x-content-type-options'), csp: response.headers.get('content-security-policy') }; ensure(report.headers.hsts && report.headers.nosniff === 'nosniff' && report.headers.csp.includes("frame-ancestors 'none'"), 'security headers');
writeFileSync(`${output}/live-qa.json`, `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify({ verdict: 'PASS', ...report }, null, 2));
