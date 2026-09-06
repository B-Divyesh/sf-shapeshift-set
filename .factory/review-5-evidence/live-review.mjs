import { mkdirSync, writeFileSync } from 'node:fs';
import { chromium, devices } from 'playwright';
import AxeBuilder from '@axe-core/playwright';

const base = 'https://shapeshift-set.sociobot.in';
const output = new URL('.', import.meta.url).pathname;
const perfect = ['mote', 'nook', 'crown', 'crook', 'wing'];
const loss = [...perfect].reverse();
const numbers = { mote: '1', nook: '2', wing: '3', crown: '4', crook: '5' };
const report = {
  base,
  checkedAt: new Date().toISOString(),
  desktop: {},
  phone: {},
  keyboard: {},
  accessibility: {},
  routes: {},
  serviceWorker: {},
  performance: {},
  requests: [],
  consoleErrors: [],
};

function assert(value, message) {
  if (!value) throw new Error(message);
}

async function orient(page, id, mode = 'pointer') {
  const piece = page.locator(`[data-select-piece="${id}"]`);
  if (mode === 'touch') await piece.tap();
  else if (mode === 'keyboard') await page.keyboard.press(numbers[id]);
  else await piece.click();
  for (let flip = 0; flip < 2; flip += 1) {
    for (let turn = 0; turn < 4; turn += 1) {
      if ((await piece.locator('small').textContent()) === 'Ready') return;
      if (mode === 'touch') await page.locator('[data-rotate="1"]').tap();
      else if (mode === 'keyboard') await page.keyboard.press('e');
      else await page.locator('[data-rotate="1"]').click();
    }
    if (mode === 'touch') await page.locator('[data-flip]').tap();
    else if (mode === 'keyboard') await page.keyboard.press('f');
    else await page.locator('[data-flip]').click();
  }
  throw new Error(`${id} did not become ready`);
}

async function place(page, id, mode = 'pointer') {
  await orient(page, id, mode);
  const name = id[0].toUpperCase() + id.slice(1);
  const target = page.getByRole('button', { name: new RegExp(`Place selected creature in ${name} habitat`) }).first();
  if (mode === 'touch') await target.tap();
  else if (mode === 'keyboard') {
    await target.focus();
    await page.keyboard.press('Enter');
  } else await target.click();
}

async function solve(page, order, mode = 'pointer') {
  for (const id of order) await place(page, id, mode);
}

async function axe(page) {
  const result = await new AxeBuilder({ page }).analyze();
  return result.violations.map(({ id, impact, nodes }) => ({ id, impact, nodes: nodes.length }));
}

async function endState(page, score, tier) {
  await page.getByRole('heading', { name: `You changed ${score} of 5` }).waitFor();
  const result = {
    score: await page.locator('.score-box strong').textContent(),
    tier: await page.getByText(tier, { exact: true }).textContent(),
    items: await page.locator('.score-trail li').count(),
    successfulItems: await page.locator('.score-trail li.success').count(),
  };
  assert(result.score === `${score}/5` && result.items === 5 && result.successfulItems === score, `end state ${score}`);
  return result;
}

mkdirSync(output, { recursive: true });
const browser = await chromium.launch();
try {
  const desktopContext = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  await desktopContext.grantPermissions(['clipboard-read', 'clipboard-write'], { origin: base });
  const page = await desktopContext.newPage();
  page.on('request', request => report.requests.push({ method: request.method(), url: request.url(), body: request.postData() }));
  page.on('console', message => { if (message.type() === 'error') report.consoleErrors.push(message.text()); });
  page.on('pageerror', error => report.consoleErrors.push(String(error)));
  await page.goto(`${base}/`, { waitUntil: 'networkidle' });
  const first = await page.evaluate(() => {
    const rect = selector => document.querySelector(selector)?.getBoundingClientRect();
    const action = rect('.hero-action .button');
    const board = rect('.board');
    return {
      title: document.title,
      h1: document.querySelector('h1')?.textContent?.trim(),
      audience: document.querySelector('.hero-summary')?.textContent?.trim(),
      action: document.querySelector('.hero-action .button')?.textContent?.trim(),
      actionNote: document.querySelector('.hero-action span')?.textContent?.trim(),
      facts: [...document.querySelectorAll('.plain-facts li')].map(node => node.textContent.trim()),
      actionFullyVisible: Boolean(action && action.top >= 0 && action.bottom <= innerHeight),
      boardFullyVisible: Boolean(board && board.top >= 0 && board.bottom <= innerHeight),
      overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      scrollY,
    };
  });
  assert(first.title === 'Shapeshift Set — order five creatures daily', 'desktop title');
  assert(first.h1 === 'Place five creatures in the right order', 'desktop job');
  assert(first.audience?.includes('daily puzzle players'), 'desktop audience');
  assert(first.action === 'Try it with sample data' && first.actionFullyVisible, 'desktop first action');
  assert(first.actionNote === 'Opens a complete sample board.', 'desktop action outcome');
  assert(first.facts.length === 3 && first.boardFullyVisible && first.overflow <= 0 && first.scrollY === 0, 'desktop opening viewport');
  report.desktop.firstScreen = first;
  await page.screenshot({ path: `${output}/first-desktop.png` });

  const sentinel = await page.evaluate(() => {
    localStorage.setItem('shapeshift-set:daily:sentinel', JSON.stringify({ moves: ['real'] }));
    localStorage.setItem('real-progress-sentinel', 'keep me');
    document.cookie = 'real-progress-cookie=keep; path=/';
    return { storage: JSON.stringify(Object.entries(localStorage).sort()), cookie: document.cookie };
  });
  await page.getByRole('link', { name: 'Try it with sample data' }).click();
  await page.waitForURL(`${base}/demo`);
  const banner = await page.getByRole('complementary', { name: 'Demo mode' }).textContent();
  const boardId = await page.locator('.seed strong').textContent();
  assert(banner?.includes('Demo — sample board, nothing is saved'), 'persistent demo label');
  assert(boardId?.includes('989809312'), 'realistic sample board ID');

  await page.getByRole('button', { name: /Row 1, column 1/ }).click();
  const noSelection = (await page.locator('.status-row').textContent())?.trim();
  assert(noSelection?.includes('No creature is selected'), 'no selection recovery');
  await page.getByRole('button', { name: /Open ground/ }).first().click();
  const openGround = (await page.locator('.status-row').textContent())?.trim();
  assert(openGround?.includes('That tile has no habitat'), 'open ground recovery');
  await page.locator('[data-select-piece="wing"]').click();
  await page.getByRole('button', { name: /Place selected creature in Wing habitat/ }).first().click();
  const wrongOrientation = (await page.locator('.status-row').textContent())?.trim();
  assert(wrongOrientation?.includes('The blocks do not match yet'), 'wrong orientation recovery');
  await page.getByRole('button', { name: /Place selected creature in Mote habitat/ }).first().click();
  const wrongShape = (await page.locator('.status-row').textContent())?.trim();
  assert(wrongShape?.includes('That creature has a different shape'), 'wrong shape recovery');
  await place(page, 'mote');
  await page.locator('[data-select-piece="nook"]').click();
  const filledDisabled = await page.getByRole('button', { name: /Mote habitat, filled/ }).first().isDisabled();
  assert(filledDisabled, 'filled habitat protection');
  await page.getByRole('button', { name: 'Reset demo' }).first().click();
  assert((await page.locator('.score-box strong').textContent()) === '0/5', 'reset after invalid paths');

  await solve(page, loss);
  report.desktop.loss = await endState(page, 1, 'Try again (0–2)');
  await page.screenshot({ path: `${output}/loss-desktop.png`, fullPage: true });
  await page.getByRole('button', { name: 'Reset demo' }).first().click();
  assert((await page.locator('.score-box strong').textContent()) === '0/5' && (await page.locator('.score-trail li').count()) === 0, 'reset finished loss');
  await solve(page, perfect);
  report.desktop.win = await endState(page, 5, 'Perfect (5)');
  await page.getByRole('button', { name: 'Copy result' }).click();
  report.desktop.clipboard = await page.evaluate(() => navigator.clipboard.readText());
  assert(report.desktop.clipboard.includes('5/5') && report.desktop.clipboard.includes('Radiant') && report.desktop.clipboard.includes('Board ID 989809312'), 'copy result');
  const demoAfter = await page.evaluate(() => ({ storage: JSON.stringify(Object.entries(localStorage).sort()), cookie: document.cookie }));
  assert(demoAfter.storage === sentinel.storage && demoAfter.cookie === sentinel.cookie, 'demo changed real data');
  report.desktop.sample = { boardId, banner, realDataUnchanged: true };
  await page.screenshot({ path: `${output}/win-desktop.png`, fullPage: true });

  await page.getByRole('button', { name: 'Play this board again' }).click();
  assert((await page.locator('.score-box strong').textContent()) === '0/5', 'replay reset');
  await place(page, 'mote');
  await page.getByRole('button', { name: 'Undo last piece' }).click();
  assert((await page.locator('.score-box strong').textContent()) === '0/5' && (await page.locator('.score-trail li').count()) === 0, 'undo reset');

  const demoAxe = await axe(page);
  assert(demoAxe.length === 0, `demo Axe: ${JSON.stringify(demoAxe)}`);
  report.accessibility.demoAxe = demoAxe;
  await page.getByRole('link', { name: 'Start for real' }).focus();
  await page.keyboard.press('Shift+Tab');
  const resetFocus = await page.locator('[data-demo-reset]').evaluate(node => ({ visible: node.matches(':focus-visible'), outline: getComputedStyle(node).outline }));
  await page.keyboard.press('Tab');
  const realFocus = await page.getByRole('link', { name: 'Start for real' }).evaluate(node => ({ visible: node.matches(':focus-visible'), outline: getComputedStyle(node).outline }));
  assert(resetFocus.visible && realFocus.visible && !resetFocus.outline.includes('none') && !realFocus.outline.includes('none'), 'demo banner focus');
  report.accessibility.demoBannerFocus = { resetFocus, realFocus };
  await page.getByRole('link', { name: 'Start for real' }).click();
  const realAfter = await page.evaluate(() => ({ storage: JSON.stringify(Object.entries(localStorage).sort()), cookie: document.cookie }));
  assert(realAfter.storage === sentinel.storage && realAfter.cookie === sentinel.cookie, 'leaving demo changed real data');
  const resetButton = page.getByRole('button', { name: 'Reset board' });
  await place(page, 'mote');
  await resetButton.click();
  const dialog = page.getByRole('dialog');
  await dialog.waitFor();
  const dialogState = {
    labelledBy: await dialog.getAttribute('aria-labelledby'),
    focusInside: await page.evaluate(() => Boolean(document.activeElement?.closest('dialog'))),
  };
  await page.keyboard.press('Tab');
  dialogState.tabStayedInside = await page.evaluate(() => Boolean(document.activeElement?.closest('dialog')));
  await page.keyboard.press('Escape');
  dialogState.closed = !(await dialog.isVisible());
  dialogState.focusReturned = await resetButton.evaluate(node => node === document.activeElement);
  assert(dialogState.labelledBy === 'reset-title' && dialogState.focusInside && dialogState.tabStayedInside && dialogState.closed && dialogState.focusReturned, 'dialog focus management');
  report.accessibility.dialog = dialogState;
  report.desktop.recovery = { noSelection, openGround, wrongOrientation, wrongShape, filledDisabled, replayReset: true, undoReset: true };
  await desktopContext.close();

  const keyboardContext = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const keyboard = await keyboardContext.newPage();
  await keyboard.goto(`${base}/demo`, { waitUntil: 'networkidle' });
  await keyboard.keyboard.press('1');
  await keyboard.keyboard.press('q');
  await keyboard.keyboard.press('e');
  await keyboard.keyboard.press('f');
  await keyboard.keyboard.press('f');
  const firstTarget = keyboard.getByRole('button', { name: /Place selected creature in Mote habitat/ }).first();
  await firstTarget.focus();
  await keyboard.keyboard.press('ArrowRight');
  await keyboard.keyboard.press('ArrowLeft');
  await keyboard.keyboard.press('Space');
  await solve(keyboard, perfect.slice(1), 'keyboard');
  report.keyboard = { ...(await endState(keyboard, 5, 'Perfect (5)')), controls: 'number, Q, E, F, arrows, Space, Enter' };
  await keyboard.screenshot({ path: `${output}/keyboard-win.png`, fullPage: true });
  await keyboardContext.close();

  const phoneContext = await browser.newContext({ ...devices['iPhone 13'], viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  const phone = await phoneContext.newPage();
  await phone.goto(`${base}/`, { waitUntil: 'networkidle' });
  const phoneFirst = await phone.evaluate(() => {
    const action = document.querySelector('.hero-action .button')?.getBoundingClientRect();
    const board = document.querySelector('.board')?.getBoundingClientRect();
    return {
      h1: document.querySelector('h1')?.textContent?.trim(),
      audience: document.querySelector('.hero-summary')?.textContent?.trim(),
      action: document.querySelector('.hero-action .button')?.textContent?.trim(),
      actionNote: document.querySelector('.hero-action span')?.textContent?.trim(),
      facts: [...document.querySelectorAll('.plain-facts li')].map(node => node.textContent.trim()),
      actionVisible: Boolean(action && action.top >= 0 && action.bottom <= innerHeight),
      boardStartsInViewport: Boolean(board && board.top < innerHeight),
      overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      scrollY,
    };
  });
  assert(phoneFirst.h1 === first.h1 && phoneFirst.audience?.includes('daily puzzle players'), 'phone job and audience');
  assert(phoneFirst.action === 'Try it with sample data' && phoneFirst.actionNote === 'Opens a complete sample board.' && phoneFirst.actionVisible, 'phone first action');
  assert(phoneFirst.facts.length === 3 && phoneFirst.boardStartsInViewport && phoneFirst.overflow <= 0 && phoneFirst.scrollY === 0, 'phone opening viewport');
  report.phone.firstScreen = phoneFirst;
  await phone.screenshot({ path: `${output}/first-phone.png` });
  await phone.getByRole('link', { name: 'Try it with sample data' }).tap();
  await solve(phone, perfect, 'touch');
  report.phone.win = await endState(phone, 5, 'Perfect (5)');
  report.phone.banner = await phone.getByRole('complementary', { name: 'Demo mode' }).textContent();
  report.phone.overflowAtEnd = await phone.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  assert(report.phone.overflowAtEnd <= 0, 'phone end overflow');
  await phone.screenshot({ path: `${output}/phone-win.png`, fullPage: true });
  await phone.getByRole('button', { name: 'Play this board again' }).tap();
  report.phone.replay = { score: await phone.locator('.score-box strong').textContent(), items: await phone.locator('.score-trail li').count() };
  assert(report.phone.replay.score === '0/5' && report.phone.replay.items === 0, 'phone replay');
  await phoneContext.close();

  const reducedContext = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' });
  const reduced = await reducedContext.newPage();
  await reduced.goto(`${base}/demo`, { waitUntil: 'networkidle' });
  await place(reduced, 'mote');
  const motion = await reduced.locator('.board-cell.placed').first().evaluate(node => ({ animation: getComputedStyle(node).animationDuration, transition: getComputedStyle(node).transitionDuration }));
  assert(Number.parseFloat(motion.animation) <= 0.00001 && Number.parseFloat(motion.transition) <= 0.00001, 'reduced motion');
  report.accessibility.reducedMotion = motion;
  await reducedContext.close();

  const reflowContext = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const reflow = await reflowContext.newPage();
  await reflow.goto(`${base}/demo`, { waitUntil: 'networkidle' });
  await reflow.evaluate(() => { document.documentElement.style.fontSize = '200%'; });
  const text200 = await reflow.evaluate(() => ({
    overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    boardVisible: Boolean(document.querySelector('.board')?.getBoundingClientRect().width),
    controlsVisible: [...document.querySelectorAll('.game-tools button')].every(node => node.getBoundingClientRect().width > 0),
  }));
  assert(text200.overflow <= 0 && text200.boardVisible && text200.controlsVisible, '200% text reflow');
  report.accessibility.text200 = text200;
  await reflowContext.close();

  const matrixContext = await browser.newContext();
  const matrix = await matrixContext.newPage();
  report.accessibility.responsive = {};
  for (const width of [320, 390, 881, 900, 1024, 1100, 1279, 1280, 1440]) {
    await matrix.setViewportSize({ width, height: 900 });
    await matrix.goto(`${base}/demo`, { waitUntil: 'networkidle' });
    const result = await matrix.evaluate(() => {
      const cells = [...document.querySelectorAll('.board-cell')].map(node => node.getBoundingClientRect());
      const controls = [...document.querySelectorAll('button, a')].filter(node => node.offsetParent !== null).map(node => node.getBoundingClientRect());
      return {
        overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
        minBoardTarget: Math.min(...cells.map(box => Math.min(box.width, box.height))),
        controlsWithinViewport: controls.every(box => box.left >= 0 && box.right <= innerWidth),
      };
    });
    assert(result.overflow <= 0 && result.minBoardTarget >= 44 && result.controlsWithinViewport, `responsive ${width}`);
    report.accessibility.responsive[width] = result;
  }
  await matrixContext.close();

  const performanceContext = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  const performancePage = await performanceContext.newPage();
  const cdp = await performanceContext.newCDPSession(performancePage);
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
  await performancePage.goto(`${base}/demo`, { waitUntil: 'networkidle' });
  report.performance = await performancePage.evaluate(async () => {
    const startTicks = Number(document.documentElement.dataset.gameTicks);
    const timestamps = await new Promise(resolve => {
      const values = [];
      const sample = time => {
        values.push(time);
        if (values.length === 181) resolve(values);
        else requestAnimationFrame(sample);
      };
      requestAnimationFrame(sample);
    });
    const intervals = timestamps.slice(1).map((time, index) => time - timestamps[index]);
    const elapsed = timestamps.at(-1) - timestamps[0];
    const sorted = [...intervals].sort((a, b) => a - b);
    const ticks = Number(document.documentElement.dataset.gameTicks) - startTicks;
    return { target: Number(document.documentElement.dataset.frameTarget), frames: intervals.length, fps: intervals.length * 1000 / elapsed, meanMs: elapsed / intervals.length, p95Ms: sorted[Math.floor(sorted.length * 0.95)], fixedStepHz: ticks * 1000 / elapsed, cpuThrottle: 4 };
  });
  assert(report.performance.target === 60 && report.performance.fps >= 55 && report.performance.fps <= 65, 'frame rate');
  assert(report.performance.fixedStepHz >= 55 && report.performance.fixedStepHz <= 65, 'fixed step');
  await performanceContext.close();

  const routeContext = await browser.newContext();
  const route = await routeContext.newPage();
  for (const [path, status, title] of [
    ['/', 200, 'Shapeshift Set — order five creatures daily'],
    ['/demo', 200, 'Demo — Shapeshift Set'],
    ['/privacy', 200, 'Privacy — Shapeshift Set'],
    ['/terms', 200, 'Terms — Shapeshift Set'],
    ['/missing-page-review-5', 404, 'Page not found — Shapeshift Set'],
  ]) {
    const response = await route.goto(`${base}${path}`, { waitUntil: 'networkidle' });
    const details = {
      status: response?.status(),
      title: await route.title(),
      h1: await route.locator('h1').count(),
      main: await route.locator('main').count(),
      footer: await route.locator('footer').count(),
      axe: await axe(route),
    };
    assert(details.status === status && details.title === title && details.h1 === 1 && details.main === 1 && details.footer === 1, `route ${path}`);
    assert(details.axe.length === 0, `route Axe ${path}: ${JSON.stringify(details.axe)}`);
    report.routes[path] = details;
  }
  await route.goto(`${base}/`, { waitUntil: 'networkidle' });
  const links = await route.locator('a[href]').evaluateAll(nodes => [...new Set(nodes.map(node => node.href))]);
  report.routes.links = [];
  for (const url of links) {
    if (!url.startsWith('http')) continue;
    const response = await routeContext.request.get(url);
    assert(response.status() >= 200 && response.status() < 400, `dead link ${url}: ${response.status()}`);
    report.routes.links.push({ url, status: response.status() });
  }
  await route.goto(`${base}/`, { waitUntil: 'networkidle' });
  await route.evaluate(() => scrollTo({ top: document.body.scrollHeight, behavior: 'instant' }));
  await route.waitForTimeout(500);
  const scrollBefore = await route.evaluate(() => scrollY);
  await route.getByRole('link', { name: 'Privacy' }).last().click();
  await route.waitForURL(`${base}/privacy`);
  const privacyFocus = await route.evaluate(() => ({ focused: document.activeElement === document.querySelector('h1'), announcement: document.querySelector('[aria-live]')?.textContent?.trim() }));
  await route.goBack();
  await route.waitForURL(`${base}/`);
  await route.waitForTimeout(700);
  const back = await route.evaluate(() => ({ focused: document.activeElement === document.querySelector('h1'), scrollY }));
  assert(scrollBefore > 0 && privacyFocus.focused && privacyFocus.announcement === 'Privacy page loaded.' && back.focused && back.scrollY > 0, 'route focus/history');
  report.routes.history = { scrollBefore, privacyFocus, back };
  await routeContext.close();

  const offlineContext = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const offline = await offlineContext.newPage();
  await offline.goto(`${base}/demo`, { waitUntil: 'networkidle' });
  await offline.waitForFunction(async () => Boolean(navigator.serviceWorker.controller && await navigator.serviceWorker.ready));
  const worker = await offline.evaluate(async () => {
    const registration = await navigator.serviceWorker.ready;
    const cacheName = (await caches.keys()).find(name => name.startsWith('shapeshift-set-'));
    const cache = await caches.open(cacheName);
    const assets = [...document.querySelectorAll('script[src],link[rel="stylesheet"]')].map(node => node.src || node.href).filter(url => /\/assets\/index-/.test(url));
    return { controller: Boolean(navigator.serviceWorker.controller), active: registration.active?.state, waiting: Boolean(registration.waiting), installing: Boolean(registration.installing), cacheName, assets, assetsCached: (await Promise.all(assets.map(url => cache.match(url)))).every(Boolean) };
  });
  assert(worker.controller && worker.active === 'activated' && !worker.waiting && !worker.installing && worker.assetsCached, 'service worker state');
  await offline.reload({ waitUntil: 'networkidle' });
  await offlineContext.setOffline(true);
  await offline.reload({ waitUntil: 'domcontentloaded' });
  const offlineResult = { title: await offline.title(), h1: await offline.locator('h1').textContent(), boardVisible: await offline.locator('.board').isVisible() };
  assert(offlineResult.h1 === 'Place five sample creatures in order' && offlineResult.boardVisible, 'offline reopen');
  report.serviceWorker = { ...worker, offlineResult };
  await offlineContext.close();
} finally {
  await browser.close();
}

report.requests = report.requests.filter((item, index, items) => items.findIndex(other => JSON.stringify(other) === JSON.stringify(item)) === index);
assert(report.requests.every(item => new URL(item.url).origin === base), 'third-party request');
assert(report.requests.every(item => item.method === 'GET' && !item.body), 'unexpected request payload');
assert(report.consoleErrors.length === 0, `console errors: ${report.consoleErrors.join('; ')}`);
writeFileSync(`${output}/live-review.json`, `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify({ verdict: 'PASS', desktop: report.desktop, phone: report.phone, keyboard: report.keyboard, accessibility: report.accessibility, routes: report.routes, serviceWorker: report.serviceWorker, performance: report.performance, consoleErrors: report.consoleErrors }, null, 2));
