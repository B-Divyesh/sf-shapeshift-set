import { chromium } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { writeFile } from 'node:fs/promises';

const BASE = 'https://shapeshift-set.sociobot.in';
const pieceNames = { mote: 'Mote', nook: 'Nook', wing: 'Wing', crown: 'Crown', crook: 'Crook' };
const perfect = ['mote', 'nook', 'wing', 'crown', 'crook'];
const report = { checks: {}, observations: {} };
const assert = (condition, message) => { if (!condition) throw new Error(message); };

async function orient(page, id, keyboard = false) {
  if (keyboard) {
    await page.keyboard.press(String(perfect.indexOf(id) + 1));
    for (let flip = 0; flip < 2; flip++) {
      for (let turn = 0; turn < 4; turn++) {
        if (await page.locator(`[data-select-piece="${id}"] small`).textContent() === 'Fits') return;
        await page.keyboard.press('e');
      }
      await page.keyboard.press('f');
    }
  } else {
    await page.locator(`[data-select-piece="${id}"]`).click();
    for (let flip = 0; flip < 2; flip++) {
      for (let turn = 0; turn < 4; turn++) {
        if (await page.locator(`[data-select-piece="${id}"] small`).textContent() === 'Fits') return;
        await page.locator('[data-rotate="1"]').click();
      }
      await page.locator('[data-flip]').click();
    }
  }
  throw new Error(`could not orient ${id}`);
}

async function placePointer(page, id) {
  await orient(page, id);
  await page.getByRole('button', { name: new RegExp(`${pieceNames[id]} habitat, empty`) }).first().click();
}

async function tabToHabitat(page, id) {
  const wanted = new RegExp(`${pieceNames[id]} habitat, empty`);
  for (let i = 0; i < 100; i++) {
    const active = await page.evaluate(() => ({ name: document.activeElement?.getAttribute('aria-label') || document.activeElement?.textContent || '', tag: document.activeElement?.tagName }));
    if (active.tag === 'BUTTON' && wanted.test(active.name)) return i;
    await page.keyboard.press('Tab');
  }
  throw new Error(`keyboard could not reach ${id} habitat`);
}

const browser = await chromium.launch({ headless: true });

// One cold demo context covers outbound requests, perfect play, result copy, and restart.
{
  const context = await browser.newContext({ baseURL: BASE, permissions: ['clipboard-read', 'clipboard-write'] });
  const page = await context.newPage();
  const requests = [];
  const errors = [];
  page.on('request', r => requests.push(r.url()));
  page.on('console', m => { if (m.type() === 'error') errors.push(`console: ${m.text()}`); });
  page.on('pageerror', e => errors.push(`page: ${e.message}`));
  await page.goto('/demo', { waitUntil: 'networkidle' });
  assert(await page.getByText('Demo — sample board, nothing is saved').isVisible(), 'demo banner missing');
  assert((await page.evaluate(() => Object.keys(localStorage))).length === 0, 'demo began with storage');
  for (const id of perfect) await placePointer(page, id);
  assert(await page.getByRole('heading', { name: 'You changed 5 of 5' }).isVisible(), 'perfect end missing');
  assert(await page.getByText('Radiant set', { exact: true }).isVisible(), 'perfect tier missing');
  assert(await page.locator('.score-trail li.success').count() === 5, 'perfect trail not five successes');
  assert((await page.evaluate(() => Object.keys(localStorage))).length === 0, 'demo wrote localStorage');
  await page.getByRole('heading', { name: 'You changed 5 of 5' }).scrollIntoViewIfNeeded();
  await page.screenshot({ path: '.factory/verification-artifacts-3/live-perfect-end.png', fullPage: false });
  await page.getByRole('button', { name: 'Copy result' }).click();
  const clipboard = await page.evaluate(() => navigator.clipboard.readText());
  assert(clipboard.includes('5/5 · Radiant') && clipboard.includes('Seed 989809312'), 'clipboard result incomplete');
  await page.getByRole('button', { name: 'Play this board again' }).click();
  assert((await page.locator('.score-box strong').textContent()).includes('0/5'), 'restart score not zero');
  assert(await page.locator('.score-trail li').count() === 0, 'restart trail not empty');
  assert(await page.locator('[data-select-piece]:not([disabled])').count() === 5, 'restart pieces not reset');
  report.checks.perfectRunCopyRestart = 'PASS';
  report.observations.fullDemoRequests = requests;
  report.observations.fullDemoOrigins = [...new Set(requests.map(url => new URL(url).origin))];
  report.observations.fullDemoErrors = errors;
  assert(report.observations.fullDemoOrigins.length === 1 && report.observations.fullDemoOrigins[0] === BASE, 'third-party request found');
  assert(errors.length === 0, 'runtime error in perfect flow');
  await context.close();
}

// Loss condition and invalid-input recovery.
{
  const context = await browser.newContext({ baseURL: BASE });
  const page = await context.newPage();
  await page.goto('/demo');
  const moteHabitat = page.getByRole('button', { name: /Mote habitat, empty/ }).first();
  await moteHabitat.click();
  assert((await page.locator('.status-row').textContent()).includes('No creature is selected'), 'no-selection recovery missing');
  await page.getByRole('button', { name: /Open ground/ }).first().click();
  assert((await page.locator('.status-row').textContent()).includes('no habitat'), 'open-ground recovery missing');
  await page.locator('[data-select-piece="wing"]').click();
  await page.getByRole('button', { name: /Wing habitat, empty/ }).first().click();
  assert((await page.locator('.status-row').textContent()).includes('do not match'), 'orientation recovery missing');
  await orient(page, 'mote');
  await page.getByRole('button', { name: /Nook habitat, empty/ }).first().click();
  assert((await page.locator('.status-row').textContent()).includes('different shape'), 'wrong-habitat recovery missing');
  await page.getByRole('button', { name: 'Reset demo' }).first().click();
  await placePointer(page, 'mote');
  await page.locator('[data-select-piece="nook"]').click();
  await page.getByRole('button', { name: /Mote habitat, filled/ }).first().click({ force: true });
  assert((await page.locator('.status-row').textContent()).includes('habitat is filled'), 'occupied-habitat recovery missing');
  await page.getByRole('button', { name: 'Undo last piece' }).click();
  assert((await page.locator('.score-box strong').textContent()).includes('0/5') && await page.locator('[data-select-piece="mote"]').isEnabled(), 'live undo did not restore state');
  await page.getByRole('button', { name: 'Reset demo' }).first().click();
  for (const id of [...perfect].reverse()) await placePointer(page, id);
  assert(await page.getByRole('heading', { name: 'You changed 1 of 5' }).isVisible(), 'loss end missing');
  assert(await page.getByText('Quiet set', { exact: true }).isVisible(), 'loss tier missing');
  assert(await page.locator('.score-trail li.miss').count() === 4, 'loss trail misses incorrect');
  await page.getByRole('heading', { name: 'You changed 1 of 5' }).scrollIntoViewIfNeeded();
  await page.screenshot({ path: '.factory/verification-artifacts-3/live-loss-end.png', fullPage: false });
  report.checks.invalidRecoveryAndLoss = 'PASS';
  await context.close();
}

// The middle tier has an explicit boundary at three successful mutations.
{
  const context = await browser.newContext({ baseURL: BASE });
  const page = await context.newPage();
  await page.goto('/demo');
  for (const id of ['mote', 'crook', 'crown', 'nook', 'wing']) await placePointer(page, id);
  assert(await page.getByRole('heading', { name: 'You changed 3 of 5' }).isVisible(), 'three-point boundary missing');
  assert(await page.getByText('Shifting set', { exact: true }).isVisible(), 'middle tier missing');
  report.checks.middleTierBoundary = 'PASS';
  await context.close();
}

// A complete end-to-end keyboard-only run, including the advertised shortcuts.
{
  const context = await browser.newContext({ baseURL: BASE });
  const page = await context.newPage();
  await page.goto('/demo');
  const tabCounts = [];
  for (let index = 0; index < perfect.length; index++) {
    const id = perfect[index];
    await orient(page, id, true);
    if (index === 0) {
      await page.keyboard.press('q');
      await page.keyboard.press('e');
      await page.keyboard.press('f');
      await page.keyboard.press('f');
      assert(await page.locator(`[data-select-piece="${id}"] small`).textContent() === 'Fits', 'Q/E/F did not preserve usable orientation');
    }
    tabCounts.push(await tabToHabitat(page, id));
    await page.keyboard.press(index % 2 ? 'Enter' : 'Space');
  }
  assert(await page.getByRole('heading', { name: 'You changed 5 of 5' }).isVisible(), 'keyboard run did not reach end');
  report.checks.keyboardOnlyEnd = 'PASS';
  report.observations.keyboardTabCounts = tabCounts;
  await context.close();
}

// Touch, local progress persistence, and reset-dialog focus/recovery.
{
  const context = await browser.newContext({ baseURL: BASE, viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  const page = await context.newPage();
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.locator('[data-select-piece="mote"]').tap();
  for (let turn = 0; turn < 4 && await page.locator('[data-select-piece="mote"] small').textContent() !== 'Fits'; turn++) {
    await page.locator('[data-rotate="1"]').tap();
  }
  assert(await page.locator('[data-select-piece="mote"] small').textContent() === 'Fits', 'touch rotation failed');
  await page.getByRole('button', { name: /Mote habitat, empty/ }).first().tap();
  assert((await page.locator('.score-box strong').textContent()).includes('1/5'), 'touch placement failed');
  const stored = await page.evaluate(() => Object.keys(localStorage).filter(key => key.startsWith('shapeshift-set:daily:')));
  assert(stored.length === 1, 'real progress key missing');
  await page.reload();
  assert((await page.locator('.score-box strong').textContent()).includes('1/5'), 'real progress did not reload');
  await page.getByRole('button', { name: 'Reset board' }).click();
  assert(await page.getByRole('dialog').isVisible(), 'reset dialog missing');
  assert(await page.evaluate(() => document.activeElement?.textContent?.includes('Keep my moves')) === true, 'dialog initial focus incorrect');
  await page.keyboard.press('Escape');
  assert(await page.getByRole('button', { name: 'Reset board' }).evaluate(el => el === document.activeElement), 'dialog focus not restored');
  report.checks.touchPersistenceDialog = 'PASS';
  report.observations.realStorageKeys = stored;
  await context.close();
}

// Accessibility, metadata, responsive reflow, target sizes, reduced motion, routing, and internal links.
{
  const context = await browser.newContext({ baseURL: BASE, viewport: { width: 390, height: 844 }, reducedMotion: 'reduce', bypassCSP: true });
  const page = await context.newPage();
  const routeResults = [];
  for (const path of ['/', '/demo', '/privacy', '/terms']) {
    const response = await page.goto(path, { waitUntil: 'networkidle' });
    const axe = await new AxeBuilder({ page }).analyze();
    const serious = axe.violations.filter(v => ['serious', 'critical'].includes(v.impact || ''));
    const structure = await page.evaluate(() => ({
      title: document.title,
      lang: document.documentElement.lang,
      h1: document.querySelectorAll('h1').length,
      main: document.querySelectorAll('main').length,
      missingAlt: [...document.images].filter(img => !img.hasAttribute('alt')).length,
      overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    }));
    routeResults.push({ path, status: response?.status(), serious: serious.map(v => v.id), structure });
    assert(response?.status() === 200 && serious.length === 0 && structure.lang === 'en' && structure.h1 === 1 && structure.main === 1 && structure.missingAlt === 0 && structure.overflow <= 0, `route QA failed: ${path}`);
  }
  await page.goto('/demo');
  await page.addStyleTag({ content: 'html { font-size: 200% !important; }' });
  const zoomOverflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  assert(zoomOverflow <= 0, '200% text overflow');
  await page.reload();
  const targets = await page.locator('a, button').evaluateAll(elements => elements.filter(el => {
    const r = el.getBoundingClientRect();
    const s = getComputedStyle(el);
    return r.width > 0 && r.height > 0 && s.visibility !== 'hidden';
  }).map(el => { const r = el.getBoundingClientRect(); return { name: el.getAttribute('aria-label') || el.textContent?.trim(), width: r.width, height: r.height }; }));
  const undersized = targets.filter(t => t.width < 44 || t.height < 44);
  assert(undersized.length === 0, `undersized targets: ${JSON.stringify(undersized)}`);
  const focusContext = await browser.newContext({ baseURL: BASE, viewport: { width: 390, height: 844 } });
  const focusPage = await focusContext.newPage();
  await focusPage.goto('/demo');
  await focusPage.keyboard.press('Tab');
  const focusStyle = await focusPage.evaluate(() => { const el = document.activeElement; const s = getComputedStyle(el); return { element: el?.className, focusVisible: el?.matches(':focus-visible'), outlineColor: s.outlineColor, outlineStyle: s.outlineStyle, outlineWidth: s.outlineWidth }; });
  await focusContext.close();
  await page.locator('[data-select-piece="mote"]').click();
  const reduced = await page.locator('.tray-piece.selected').evaluate(el => ({ animation: getComputedStyle(el).animationDuration, transition: getComputedStyle(el).transitionDuration }));
  assert(parseFloat(reduced.animation) <= 0.001 && parseFloat(reduced.transition) <= 0.001, 'reduced motion not effectively instant');
  assert(focusStyle.outlineStyle !== 'none' && parseFloat(focusStyle.outlineWidth) >= 2, `focus indicator missing: ${JSON.stringify(focusStyle)}`);
  await page.getByRole('link', { name: 'Privacy', exact: true }).first().click();
  assert(page.url().endsWith('/privacy') && await page.getByRole('heading', { level: 1 }).evaluate(el => el === document.activeElement), 'SPA route focus failed');
  await page.goBack();
  assert(page.url().endsWith('/demo') && await page.getByRole('heading', { level: 1 }).evaluate(el => el === document.activeElement), 'back route focus failed');
  const links = await page.locator('a[href]').evaluateAll(as => [...new Set(as.map(a => a.href))]);
  const internalLinkResults = [];
  for (const href of links.filter(href => new URL(href).origin === BASE && !new URL(href).hash)) {
    const response = await context.request.get(href);
    internalLinkResults.push({ href, status: response.status() });
    assert(response.status() === 200, `dead internal link: ${href}`);
  }
  const missing = await context.request.get(`${BASE}/missing-page`);
  assert(missing.status() === 404 && (await missing.text()).includes('This page does not exist'), 'real 404 failed');
  report.checks.accessibilityResponsiveRouting = 'PASS';
  report.observations.routes = routeResults;
  report.observations.targets = { count: targets.length, undersized };
  report.observations.reducedMotion = reduced;
  report.observations.focusStyle = focusStyle;
  report.observations.internalLinks = internalLinkResults;
  await context.close();
}

// Service-worker update/offline/404 behavior.
{
  const context = await browser.newContext({ baseURL: BASE });
  const page = await context.newPage();
  await page.goto('/demo');
  const sw = await page.evaluate(async () => {
    const reg = await navigator.serviceWorker.ready;
    await reg.update();
    if (!navigator.serviceWorker.controller) await new Promise(resolve => navigator.serviceWorker.addEventListener('controllerchange', resolve, { once: true }));
    const cacheNames = await caches.keys();
    const name = cacheNames.find(n => n.startsWith('shapeshift-set-'));
    const cache = name ? await caches.open(name) : null;
    const assets = [...document.querySelectorAll('script[src],link[rel="stylesheet"][href]')].map(el => el.src || el.href).filter(Boolean);
    const cached = cache ? await Promise.all(assets.map(async url => Boolean(await cache.match(url)))) : [];
    return { active: Boolean(reg.active), controlled: Boolean(navigator.serviceWorker.controller), cacheNames, assets, cached };
  });
  assert(sw.active && sw.controlled && sw.cached.length === 2 && sw.cached.every(Boolean), 'service-worker shell not current');
  await page.reload();
  await context.setOffline(true);
  await page.reload({ waitUntil: 'domcontentloaded' });
  assert(await page.locator('.board').isVisible(), 'offline board reload failed');
  await context.setOffline(false);
  const unknown = await page.goto('/missing-page');
  assert(unknown?.status() === 404, 'controlled worker masked 404');
  report.checks.serviceWorkerOfflineUpdate = 'PASS';
  report.observations.serviceWorker = sw;
  await context.close();
}

// Measured rendering cadence on a 390 px viewport with 4x CPU throttling.
{
  const context = await browser.newContext({ baseURL: BASE, viewport: { width: 390, height: 844 } });
  const page = await context.newPage();
  const cdp = await context.newCDPSession(page);
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
  await page.goto('/demo');
  const frame = await page.evaluate(() => new Promise(resolve => {
    const times = [];
    const sample = now => {
      times.push(now);
      if (times.length < 181) requestAnimationFrame(sample);
      else {
        const deltas = times.slice(1).map((t, i) => t - times[i]).sort((a, b) => a - b);
        const elapsed = times.at(-1) - times[0];
        resolve({ frames: 180, elapsed, fps: 180000 / elapsed, meanMs: elapsed / 180, p95Ms: deltas[Math.floor(deltas.length * 0.95) - 1] });
      }
    };
    requestAnimationFrame(sample);
  }));
  assert(frame.fps >= 55, `frame rate below target tolerance: ${frame.fps}`);
  report.checks.mobileFrameRate = 'PASS';
  report.observations.mobileFrameRate = frame;
  await context.close();
}

await browser.close();
await writeFile('.factory/verification-artifacts-3/deep-live-qa.json', JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
