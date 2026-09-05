import { chromium } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { mkdir, writeFile } from 'node:fs/promises';

const BASE = 'https://shapeshift-set.sociobot.in';
const OUT = '.factory/review-2-evidence';
const names = { mote: 'Mote', nook: 'Nook', wing: 'Wing', crown: 'Crown', crook: 'Crook' };
const keys = { mote: '1', nook: '2', wing: '3', crown: '4', crook: '5' };
const perfect = ['mote', 'nook', 'crown', 'crook', 'wing'];
const loss = [...perfect].reverse();
const middle = ['mote', 'crook', 'crown', 'nook', 'wing'];
const report = { base: BASE, checkedAt: new Date().toISOString(), checks: {}, evidence: {} };
const assert = (value, message) => { if (!value) throw new Error(message); };

await mkdir(OUT, { recursive: true });

async function orientPointer(page, id, tap = false) {
  const act = async (locator) => tap ? locator.tap() : locator.click();
  await act(page.locator(`[data-select-piece="${id}"]`));
  for (let flip = 0; flip < 2; flip += 1) {
    for (let turn = 0; turn < 4; turn += 1) {
      if (await page.locator(`[data-select-piece="${id}"] small`).textContent() === 'Ready') return;
      await act(page.locator('[data-rotate="1"]'));
    }
    await act(page.locator('[data-flip]'));
  }
  throw new Error(`Could not orient ${id}`);
}

async function placePointer(page, id, tap = false) {
  await orientPointer(page, id, tap);
  const habitat = page.getByRole('button', { name: new RegExp(`Place selected creature in ${names[id]} habitat`) }).first();
  if (tap) await habitat.tap(); else await habitat.click();
}

async function orientKeyboard(page, id) {
  await page.keyboard.press(keys[id]);
  for (let flip = 0; flip < 2; flip += 1) {
    for (let turn = 0; turn < 4; turn += 1) {
      if (await page.locator(`[data-select-piece="${id}"] small`).textContent() === 'Ready') return;
      await page.keyboard.press('e');
    }
    await page.keyboard.press('f');
  }
  throw new Error(`Could not orient ${id} with keyboard`);
}

async function tabToHabitat(page, id) {
  const wanted = new RegExp(`Place selected creature in ${names[id]} habitat`);
  for (let count = 0; count < 120; count += 1) {
    const active = await page.evaluate(() => ({
      tag: document.activeElement?.tagName,
      name: document.activeElement?.getAttribute('aria-label') || document.activeElement?.textContent || '',
    }));
    if (active.tag === 'BUTTON' && wanted.test(active.name)) return count;
    await page.keyboard.press('Tab');
  }
  throw new Error(`Could not tab to ${id} habitat`);
}

const browser = await chromium.launch({ headless: true });

// Fresh unscrolled desktop: state the job, audience, first action, and show the game.
{
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  const response = await page.goto(`${BASE}/`, { waitUntil: 'networkidle' });
  const first = await page.evaluate(() => ({
    scrollY: window.scrollY,
    h1: document.querySelector('h1')?.textContent?.trim(),
    audience: document.querySelector('.hero-summary')?.textContent?.trim(),
    action: document.querySelector('.hero-action a')?.textContent?.trim(),
    actionResult: document.querySelector('.hero-action span')?.textContent?.trim(),
    facts: [...document.querySelectorAll('.plain-facts li')].map((node) => node.textContent?.trim()),
    boardTop: document.querySelector('.board')?.getBoundingClientRect().top,
    boardBottom: document.querySelector('.board')?.getBoundingClientRect().bottom,
    overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
  }));
  assert(response?.status() === 200, 'Desktop home did not return 200');
  assert(first.scrollY === 0 && first.h1 === 'Place five creatures in the right order', 'Desktop job statement failed');
  assert(first.audience?.includes('daily puzzle players'), 'Desktop audience missing');
  assert(first.action === 'Try it with sample data' && first.actionResult === 'Opens a complete sample board.', 'Desktop first action failed');
  assert(first.facts.length === 3 && first.boardTop < 900 && first.overflow <= 0, 'Desktop first screen failed');
  await page.screenshot({ path: `${OUT}/live-first-desktop.png` });
  await page.getByRole('link', { name: 'Try it with sample data' }).click();
  assert(new URL(page.url()).pathname === '/demo', 'One-click sample did not open /demo');
  assert(await page.getByText('Demo — sample board, nothing is saved').isVisible(), 'Sample label missing');
  assert(await page.getByText('Board ID').isVisible() && await page.locator('[data-select-piece]').count() === 5, 'Sample board is not populated');
  report.checks.desktopFirstReadAndOneClickDemo = 'PASS';
  report.evidence.desktopFirstScreen = first;
  await context.close();
}

// Fresh phone: first screen and real touch operation.
{
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  const page = await context.newPage();
  await page.goto(`${BASE}/`, { waitUntil: 'networkidle' });
  const first = await page.evaluate(() => ({
    scrollY: window.scrollY,
    h1: document.querySelector('h1')?.textContent?.trim(),
    audience: document.querySelector('.hero-summary')?.textContent?.trim(),
    action: document.querySelector('.hero-action a')?.textContent?.trim(),
    actionResult: document.querySelector('.hero-action span')?.textContent?.trim(),
    facts: [...document.querySelectorAll('.plain-facts li')].map((node) => node.textContent?.trim()),
    boardTop: document.querySelector('.board')?.getBoundingClientRect().top,
    overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
  }));
  assert(first.scrollY === 0 && first.boardTop < 844 && first.facts.length === 3 && first.overflow <= 0, 'Phone first screen failed');
  await page.screenshot({ path: `${OUT}/live-first-phone.png` });
  await page.getByRole('link', { name: 'Try it with sample data' }).tap();
  await placePointer(page, 'mote', true);
  assert((await page.locator('.score-box strong').textContent()).includes('1/5'), 'Touch did not place Mote');
  assert(await page.getByText('Demo — sample board, nothing is saved').count() === 1, 'Sample label did not persist after touch move');
  report.checks.phoneFirstReadAndTouch = 'PASS';
  report.evidence.phoneFirstScreen = first;
  await context.close();
}

// Demo isolation, sample reset, loss, replay reset, perfect win, clipboard, and request privacy.
{
  const context = await browser.newContext({ permissions: ['clipboard-read', 'clipboard-write'] });
  const page = await context.newPage();
  const requests = [];
  const runtimeErrors = [];
  page.on('request', (request) => requests.push({ method: request.method(), url: request.url(), body: request.postData() }));
  page.on('console', (message) => { if (message.type() === 'error') runtimeErrors.push(`console: ${message.text()}`); });
  page.on('pageerror', (error) => runtimeErrors.push(`page: ${error.message}`));
  await page.goto(`${BASE}/`);
  const before = await page.evaluate(() => {
    localStorage.clear();
    localStorage.setItem('shapeshift-set:daily:real-sentinel', JSON.stringify({ score: 4, moves: ['real'] }));
    localStorage.setItem('unrelated-real-sentinel', 'unchanged');
    document.cookie = 'real-review-sentinel=unchanged; path=/';
    return { storage: JSON.stringify(Object.entries(localStorage).sort()), cookie: document.cookie };
  });
  await page.getByRole('link', { name: 'Try it with sample data' }).click();
  await placePointer(page, 'mote');
  await page.getByRole('button', { name: 'Reset demo' }).first().click();
  assert((await page.locator('.score-box strong').textContent()).includes('0/5'), 'Reset demo did not clear score');
  assert(await page.locator('.score-trail li').count() === 0, 'Reset demo did not clear result trail');
  const during = await page.evaluate(async () => ({
    storage: JSON.stringify(Object.entries(localStorage).sort()),
    cookie: document.cookie,
    databases: 'databases' in indexedDB ? await indexedDB.databases() : [],
  }));
  assert(during.storage === before.storage && during.cookie === before.cookie && during.databases.length === 0, 'Demo changed real browser data');

  for (const id of loss) await placePointer(page, id);
  assert(await page.getByRole('heading', { name: 'You changed 1 of 5' }).isVisible(), 'Loss end screen missing');
  assert(await page.getByText('Try again (0–2)', { exact: true }).isVisible(), 'Loss tier boundary missing');
  assert(await page.locator('.score-trail li').count() === 5 && await page.locator('.score-trail li.miss').count() === 4, 'Loss result detail is wrong');
  assert(await page.getByText('Demo — sample board, nothing is saved').count() === 1, 'Sample label missing at loss');
  await page.getByRole('heading', { name: 'You changed 1 of 5' }).scrollIntoViewIfNeeded();
  await page.screenshot({ path: `${OUT}/live-loss-desktop.png` });

  await page.getByRole('button', { name: 'Play this board again' }).click();
  assert((await page.locator('.score-box strong').textContent()).includes('0/5'), 'Replay did not reset score');
  assert(await page.locator('.score-trail li').count() === 0 && await page.locator('[data-select-piece]:not([disabled])').count() === 5, 'Replay did not reset board');
  for (const id of perfect) await placePointer(page, id);
  assert(await page.getByRole('heading', { name: 'You changed 5 of 5' }).isVisible(), 'Perfect end screen missing');
  assert(await page.getByText('Perfect (5)', { exact: true }).isVisible(), 'Perfect tier missing');
  assert(await page.locator('.score-trail li.success').count() === 5, 'Perfect result detail is wrong');
  await page.getByRole('button', { name: 'Copy result' }).click();
  const copied = await page.evaluate(() => navigator.clipboard.readText());
  assert(copied.includes('5/5 · Radiant') && copied.includes('Board ID 989809312'), 'Copied result is incomplete');
  await page.getByRole('heading', { name: 'You changed 5 of 5' }).scrollIntoViewIfNeeded();
  await page.screenshot({ path: `${OUT}/live-win-desktop.png` });

  const afterDemo = await page.evaluate(() => ({ storage: JSON.stringify(Object.entries(localStorage).sort()), cookie: document.cookie }));
  assert(afterDemo.storage === before.storage && afterDemo.cookie === before.cookie, 'Completed demo changed real data');
  await page.getByRole('link', { name: 'Start for real' }).click();
  const afterExit = await page.evaluate(() => ({ storage: JSON.stringify(Object.entries(localStorage).sort()), cookie: document.cookie }));
  assert(afterExit.storage === before.storage && afterExit.cookie === before.cookie, 'Leaving demo changed real data');
  assert(requests.every(({ url }) => new URL(url).origin === BASE), 'Third-party runtime request found');
  assert(requests.every(({ method }) => method === 'GET'), 'Unexpected non-GET request found');
  assert(!requests.some(({ url, body }) => /analytics|collect|telemetry|track|\/event/i.test(url) || /analytics|telemetry|eventName/i.test(body || '')), 'Analytics request found');
  assert(runtimeErrors.length === 0, `Runtime errors: ${runtimeErrors.join('; ')}`);
  report.checks.demoIsolationLossResetWinPrivacy = 'PASS';
  report.evidence.demo = { boardId: '989809312', loss: '1/5', win: '5/5', copied, storageUnchanged: true };
  report.evidence.requests = { count: requests.length, origins: [...new Set(requests.map(({ url }) => new URL(url).origin))], methods: [...new Set(requests.map(({ method }) => method))] };
  await context.close();
}

// Invalid actions, recovery, undo, occupied target, and the middle score boundary.
{
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto(`${BASE}/demo`);
  await page.getByRole('button', { name: /Place selected creature in Mote habitat/ }).first().click();
  assert((await page.locator('.status-row').textContent()).includes('No creature is selected'), 'No-selection recovery missing');
  await page.getByRole('button', { name: /Open ground/ }).first().click();
  assert((await page.locator('.status-row').textContent()).includes('no habitat'), 'Open-ground recovery missing');
  const unready = await page.locator('[data-select-piece]').evaluateAll((buttons) => buttons.find((button) => button.querySelector('small')?.textContent === 'Needs turning')?.getAttribute('data-select-piece'));
  assert(unready, 'Sample unexpectedly has no unready creature');
  await page.locator(`[data-select-piece="${unready}"]`).click();
  await page.getByRole('button', { name: new RegExp(`Place selected creature in ${names[unready]} habitat`) }).first().click();
  assert((await page.locator('.status-row').textContent()).includes('do not match'), 'Wrong-orientation recovery missing');
  await orientPointer(page, 'mote');
  await page.getByRole('button', { name: /Place selected creature in Nook habitat/ }).first().click();
  assert((await page.locator('.status-row').textContent()).includes('different shape'), 'Wrong-habitat recovery missing');
  await page.getByRole('button', { name: /Place selected creature in Mote habitat/ }).first().click();
  await page.locator('[data-select-piece="nook"]').click();
  await page.getByRole('button', { name: /Mote habitat, filled/ }).first().click({ force: true });
  assert((await page.locator('.status-row').textContent()).includes('habitat is filled'), 'Occupied-habitat recovery missing');
  await page.getByRole('button', { name: 'Undo last piece' }).click();
  assert((await page.locator('.score-box strong').textContent()).includes('0/5') && await page.locator('[data-select-piece="mote"]').isEnabled(), 'Undo recovery failed');
  await page.getByRole('button', { name: 'Reset demo' }).first().click();
  for (const id of middle) await placePointer(page, id);
  assert(await page.getByRole('heading', { name: 'You changed 3 of 5' }).isVisible(), 'Middle score boundary missing');
  assert(await page.getByText('Close (3–4)', { exact: true }).isVisible(), 'Middle tier label missing');
  report.checks.invalidBoundaryRecovery = 'PASS';
  await context.close();
}

// Complete keyboard-only run, including all documented keys and focus traversal.
{
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto(`${BASE}/demo`);
  const tabCounts = [];
  for (let index = 0; index < perfect.length; index += 1) {
    const id = perfect[index];
    await orientKeyboard(page, id);
    if (index === 0) {
      await page.keyboard.press('q');
      await page.keyboard.press('e');
      await page.keyboard.press('f');
      await page.keyboard.press('f');
      assert(await page.locator(`[data-select-piece="${id}"] small`).textContent() === 'Ready', 'Q/E/F did not preserve orientation');
    }
    tabCounts.push(await tabToHabitat(page, id));
    if (index === 0) {
      const x = Number(await page.locator(':focus').getAttribute('data-x'));
      if (x < 5) {
        await page.keyboard.press('ArrowRight');
        await page.keyboard.press('ArrowLeft');
      } else {
        await page.keyboard.press('ArrowLeft');
        await page.keyboard.press('ArrowRight');
      }
    }
    await page.keyboard.press(index % 2 === 0 ? 'Space' : 'Enter');
  }
  assert(await page.getByRole('heading', { name: 'You changed 5 of 5' }).isVisible(), 'Keyboard-only run did not end in a win');
  await page.screenshot({ path: `${OUT}/live-keyboard-win.png` });
  report.checks.keyboardOnlyCompleteRun = 'PASS';
  report.evidence.keyboardTabCounts = tabCounts;
  await context.close();
}

// Real daily persistence and focus-managed reset recovery.
{
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto(`${BASE}/`);
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await placePointer(page, 'mote');
  assert(await page.locator('.score-trail li').count() === 1 && await page.locator('[data-select-piece="mote"]').isDisabled(), 'Real placement failed');
  const scoreBeforeReload = await page.locator('.score-box strong').textContent();
  const realKeys = await page.evaluate(() => Object.keys(localStorage));
  assert(realKeys.length === 1 && realKeys[0].startsWith('shapeshift-set:daily:'), 'Real progress namespace is wrong');
  await page.reload();
  assert(await page.locator('.score-trail li').count() === 1 && await page.locator('.score-box strong').textContent() === scoreBeforeReload, 'Real progress did not survive reload');
  await page.getByRole('button', { name: 'Reset board' }).click();
  assert(await page.getByRole('dialog').isVisible(), 'Reset confirmation did not open');
  assert(await page.getByRole('button', { name: 'Keep my moves' }).evaluate((node) => node === document.activeElement), 'Reset dialog initial focus is wrong');
  await page.keyboard.press('Escape');
  assert(await page.getByRole('button', { name: 'Reset board' }).evaluate((node) => node === document.activeElement), 'Reset dialog did not restore focus');
  report.checks.realPersistenceAndDialogRecovery = 'PASS';
  report.evidence.realStorageKeys = realKeys;
  await context.close();
}

// Route semantics, metadata, accessibility, links, target size, zoom, reduced motion, and navigation focus.
{
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce', bypassCSP: true });
  const page = await context.newPage();
  const errors = [];
  page.on('console', (message) => {
    const expected404 = /server responded with a status of 404/i.test(message.text());
    if (message.type() === 'error' && !expected404) errors.push(message.text());
  });
  page.on('pageerror', (error) => errors.push(error.message));
  const routes = [];
  for (const path of ['/', '/demo', '/privacy', '/terms', '/missing-page']) {
    const response = await page.goto(`${BASE}${path}`, { waitUntil: 'networkidle' });
    const axe = await new AxeBuilder({ page }).analyze();
    const labels = path === '/demo' ? await new AxeBuilder({ page }).withRules('label-content-name-mismatch').analyze() : { violations: [], incomplete: [] };
    const state = await page.evaluate(() => ({
      title: document.title,
      lang: document.documentElement.lang,
      h1: document.querySelectorAll('h1').length,
      main: document.querySelectorAll('main').length,
      missingAlt: [...document.images].filter((image) => !image.hasAttribute('alt')).length,
      description: document.querySelector('meta[name="description"]')?.getAttribute('content'),
      canonical: document.querySelector('link[rel="canonical"]')?.getAttribute('href'),
      ogImage: document.querySelector('meta[property="og:image"]')?.getAttribute('content'),
      overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    }));
    const expectedStatus = path === '/missing-page' ? 404 : 200;
    assert(response?.status() === expectedStatus, `${path} returned ${response?.status()}`);
    assert(state.lang === 'en' && state.h1 === 1 && state.main === 1 && state.missingAlt === 0 && state.description && state.canonical && state.ogImage && state.overflow <= 0, `${path} structure failed`);
    assert(axe.violations.length === 0, `${path} axe violations: ${axe.violations.map((item) => item.id).join(', ')}`);
    assert(labels.violations.length === 0, `Label-in-name violations: ${labels.violations.length}`);
    routes.push({ path, status: response?.status(), ...state, axeViolations: [], labelNameViolations: labels.violations.length });
  }
  await page.goto(`${BASE}/demo`);
  await page.addStyleTag({ content: 'html { font-size: 200% !important; }' });
  const zoomOverflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  assert(zoomOverflow <= 0, `200% text caused ${zoomOverflow}px overflow`);
  await page.reload();
  const targets = await page.locator('a, button').evaluateAll((elements) => elements.filter((element) => {
    const rect = element.getBoundingClientRect();
    const style = getComputedStyle(element);
    return rect.width > 0 && rect.height > 0 && style.visibility !== 'hidden';
  }).map((element) => {
    const rect = element.getBoundingClientRect();
    return { name: element.getAttribute('aria-label') || element.textContent?.trim(), width: rect.width, height: rect.height };
  }));
  const undersized = targets.filter(({ width, height }) => width < 44 || height < 44);
  assert(undersized.length === 0, `Undersized targets: ${JSON.stringify(undersized)}`);
  await page.keyboard.press('Tab');
  await page.waitForTimeout(100);
  const focus = await page.evaluate(() => {
    const style = getComputedStyle(document.activeElement);
    return { text: document.activeElement?.textContent?.trim(), focusVisible: document.activeElement?.matches(':focus-visible'), outlineColor: style.outlineColor, outlineStyle: style.outlineStyle, outlineWidth: style.outlineWidth };
  });
  assert(focus.focusVisible && focus.outlineStyle !== 'none' && parseFloat(focus.outlineWidth) >= 2, `Focus indicator failed: ${JSON.stringify(focus)}`);
  await page.locator('[data-select-piece="mote"]').click();
  const reduced = await page.locator('.tray-piece.selected').evaluate((node) => ({ animation: getComputedStyle(node).animationDuration, transition: getComputedStyle(node).transitionDuration }));
  assert(parseFloat(reduced.animation) <= 0.001 && parseFloat(reduced.transition) <= 0.001, 'Reduced motion is not effectively instant');
  await page.getByRole('link', { name: 'Privacy', exact: true }).first().click();
  assert(new URL(page.url()).pathname === '/privacy' && await page.getByRole('heading', { level: 1 }).evaluate((node) => node === document.activeElement), 'Route change did not focus h1');
  await page.goBack();
  assert(new URL(page.url()).pathname === '/demo' && await page.getByRole('heading', { level: 1 }).evaluate((node) => node === document.activeElement), 'Back did not restore route focus');
  const hrefs = await page.locator('a[href]').evaluateAll((anchors) => [...new Set(anchors.map((anchor) => anchor.href))]);
  const linkStatuses = [];
  for (const href of hrefs.filter((href) => new URL(href).origin === BASE && !new URL(href).hash)) {
    const response = await context.request.get(href);
    linkStatuses.push({ href, status: response.status() });
    assert(response.status() === 200, `Dead internal link: ${href}`);
  }
  assert(errors.length === 0, `Route runtime errors: ${errors.join('; ')}`);
  report.checks.accessibilityRoutesAndResponsive = 'PASS';
  report.evidence.routes = routes;
  report.evidence.responsive = { zoomOverflow, targets: targets.length, undersized, focus, reduced };
  report.evidence.internalLinks = linkStatuses;
  await context.close();
}

// Service-worker update, exact cached shell, offline recovery, and controlled 404 behavior.
{
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto(`${BASE}/demo`);
  const worker = await page.evaluate(async () => {
    const registration = await navigator.serviceWorker.ready;
    await registration.update();
    if (!navigator.serviceWorker.controller) {
      await new Promise((resolve) => navigator.serviceWorker.addEventListener('controllerchange', resolve, { once: true }));
    }
    const cacheNames = await caches.keys();
    const cacheName = cacheNames.find((name) => name.startsWith('shapeshift-set-'));
    const cache = cacheName ? await caches.open(cacheName) : null;
    const assets = [...document.querySelectorAll('script[src], link[rel="stylesheet"][href]')].map((node) => node.src || node.href).filter(Boolean);
    const cached = cache ? await Promise.all(assets.map(async (url) => Boolean(await cache.match(url)))) : [];
    return { active: Boolean(registration.active), controlled: Boolean(navigator.serviceWorker.controller), cacheNames, assets, cached };
  });
  assert(worker.active && worker.controlled && worker.cached.length === 2 && worker.cached.every(Boolean), 'Current service-worker shell is not cached');
  await page.reload();
  await context.setOffline(true);
  await page.reload({ waitUntil: 'domcontentloaded' });
  assert(await page.getByRole('heading', { name: 'Place five sample creatures in order' }).isVisible() && await page.locator('.board').isVisible(), 'Offline demo reopen failed');
  await context.setOffline(false);
  const missing = await page.goto(`${BASE}/missing-page`);
  assert(missing?.status() === 404 && await page.getByRole('heading', { name: 'This page does not exist' }).isVisible(), 'Controlled 404 failed');
  report.checks.serviceWorkerUpdateOfflineAnd404 = 'PASS';
  report.evidence.serviceWorker = worker;
  await context.close();
}

// Fixed-step and rendered frame timing on a throttled phone viewport.
{
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await context.newPage();
  const cdp = await context.newCDPSession(page);
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
  await page.goto(`${BASE}/demo`);
  const fixed = await page.evaluate(async () => {
    const start = performance.now();
    const startTicks = Number(document.documentElement.dataset.gameTicks);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    const elapsed = performance.now() - start;
    const ticks = Number(document.documentElement.dataset.gameTicks) - startTicks;
    return { elapsed, ticks, rate: ticks * 1000 / elapsed, target: document.documentElement.dataset.frameTarget };
  });
  const rendered = await page.evaluate(() => new Promise((resolve) => {
    const times = [];
    const sample = (now) => {
      times.push(now);
      if (times.length < 181) requestAnimationFrame(sample);
      else {
        const deltas = times.slice(1).map((time, index) => time - times[index]).sort((a, b) => a - b);
        const elapsed = times.at(-1) - times[0];
        resolve({ frames: 180, elapsed, fps: 180000 / elapsed, meanMs: elapsed / 180, p95Ms: deltas[Math.floor(deltas.length * 0.95) - 1] });
      }
    };
    requestAnimationFrame(sample);
  }));
  assert(fixed.target === '60' && fixed.rate >= 55 && fixed.rate <= 65, `Fixed-step rate failed: ${fixed.rate}`);
  assert(rendered.fps >= 55, `Rendered frame rate failed: ${rendered.fps}`);
  report.checks.phoneTiming = 'PASS';
  report.evidence.timing = { fixed, rendered };
  await context.close();
}

await browser.close();
await writeFile(`${OUT}/live-review.json`, `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report, null, 2));
