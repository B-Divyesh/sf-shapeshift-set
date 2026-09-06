import { writeFileSync } from 'node:fs';
import { chromium, devices } from 'playwright';
import AxeBuilder from '@axe-core/playwright';

const base = 'https://shapeshift-set.sociobot.in';
const output = new URL('.', import.meta.url).pathname;
const perfect = ['mote', 'nook', 'crown', 'crook', 'wing'];
const loss = [...perfect].reverse();
const numberKey = { mote: '1', nook: '2', wing: '3', crown: '4', crook: '5' };
const report = {
  checkedAt: new Date().toISOString(),
  implementationSha: '08d18d967b84f9ba9b71549f4e069dff608e1824',
  repairSha: '8a861ded577d60d01def314aa6f584b9f67203d4',
  desktop: {}, phone: {}, keyboard: {}, isolation: {}, accessibility: {},
  routes: {}, privacy: {}, recovery: {}, offline: {}, performance: {},
};

function assert(value, message) {
  if (!value) throw new Error(message);
}

async function orient(page, id, mode = 'pointer') {
  const piece = page.locator(`[data-select-piece="${id}"]`);
  if (mode === 'touch') await piece.tap();
  else if (mode === 'keyboard') await page.keyboard.press(numberKey[id]);
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
  throw new Error(`${id} did not reach its habitat orientation`);
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

async function endState(page, score, label) {
  await page.getByRole('heading', { name: `You changed ${score} of 5` }).waitFor();
  const state = {
    score: await page.locator('.score-box strong').textContent(),
    label: await page.getByText(label, { exact: true }).textContent(),
    items: await page.locator('.score-trail li').count(),
    successes: await page.locator('.score-trail li.success').count(),
  };
  assert(state.score === `${score}/5` && state.items === 5 && state.successes === score, `end state ${score}`);
  return state;
}

async function axe(page) {
  const results = await new AxeBuilder({ page }).analyze();
  return results.violations.map(({ id, impact, nodes }) => ({ id, impact, nodes: nodes.length }));
}

const browser = await chromium.launch();
try {
  const desktopContext = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  await desktopContext.grantPermissions(['clipboard-read', 'clipboard-write'], { origin: base });
  const desktop = await desktopContext.newPage();
  const requests = [];
  const errors = [];
  desktop.on('request', request => requests.push({ method: request.method(), url: request.url(), body: request.postData() }));
  desktop.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  desktop.on('pageerror', error => errors.push(String(error)));
  await desktop.goto(`${base}/`, { waitUntil: 'networkidle' });
  const desktopFirst = await desktop.evaluate(() => {
    const action = document.querySelector('.hero-action .button')?.getBoundingClientRect();
    const board = document.querySelector('.board')?.getBoundingClientRect();
    return {
      title: document.title,
      h1: document.querySelector('h1')?.textContent?.trim(),
      audience: document.querySelector('.hero-summary')?.textContent?.trim(),
      action: document.querySelector('.hero-action .button')?.textContent?.trim(),
      actionNote: document.querySelector('.hero-action span')?.textContent?.trim(),
      facts: [...document.querySelectorAll('.plain-facts li')].map(node => node.textContent.trim()),
      actionVisible: Boolean(action && action.top >= 0 && action.bottom <= innerHeight),
      boardVisible: Boolean(board && board.top >= 0 && board.bottom <= innerHeight),
      overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      scrollY,
    };
  });
  assert(desktopFirst.title === 'Shapeshift Set — order five creatures daily', 'desktop title');
  assert(desktopFirst.h1 === 'Place five creatures in the right order', 'desktop job');
  assert(desktopFirst.audience?.includes('daily puzzle players'), 'desktop audience');
  assert(desktopFirst.action === 'Try it with sample data' && desktopFirst.actionVisible, 'desktop action');
  assert(desktopFirst.actionNote === 'Opens a complete sample board.', 'desktop action outcome');
  assert(desktopFirst.facts.length === 3 && desktopFirst.boardVisible && desktopFirst.overflow <= 0 && desktopFirst.scrollY === 0, 'desktop first screen');
  report.desktop.firstScreen = desktopFirst;
  await desktop.screenshot({ path: `${output}/live-first-desktop.png` });

  await desktop.getByRole('link', { name: 'Try it with sample data' }).click();
  await desktop.waitForURL(`${base}/demo`);
  const sample = {
    banner: (await desktop.getByRole('complementary', { name: 'Demo mode' }).textContent())?.trim(),
    date: (await desktop.locator('.game-topline .section-label').textContent())?.trim(),
    boardId: (await desktop.locator('.seed strong').textContent())?.trim(),
  };
  assert(sample.banner?.includes('Demo — sample board, nothing is saved'), 'sample label');
  assert(sample.date?.includes('August 14, 2026') && sample.boardId === '989809312', 'sample contents');
  await desktop.locator('.board-cell.habitat').first().click();
  const noSelection = (await desktop.locator('.status-row').textContent())?.trim();
  await desktop.locator('.board-cell:not(.habitat)').first().click();
  const openGround = (await desktop.locator('.status-row').textContent())?.trim();
  await desktop.locator('[data-select-piece="mote"]').click();
  await desktop.getByRole('button', { name: /Place selected creature in Nook habitat/ }).first().click();
  const wrongShape = (await desktop.locator('.status-row').textContent())?.trim();
  await desktop.locator('[data-rotate="1"]').click();
  await desktop.getByRole('button', { name: /Place selected creature in Mote habitat/ }).first().click();
  const wrongOrientation = (await desktop.locator('.status-row').textContent())?.trim();
  assert(noSelection?.includes('No creature is selected') && openGround?.includes('no habitat'), 'selection recovery');
  assert(wrongShape?.includes('different shape') && wrongOrientation?.includes('do not match'), 'placement recovery');
  await desktop.getByRole('button', { name: 'Reset demo' }).first().click();
  await solve(desktop, loss);
  report.desktop.loss = await endState(desktop, 1, 'Try again (0–2)');
  await desktop.screenshot({ path: `${output}/live-loss-desktop.png`, fullPage: true });
  await desktop.getByRole('button', { name: 'Play this board again' }).click();
  assert((await desktop.locator('.score-box strong').textContent()) === '0/5', 'replay reset');
  await solve(desktop, perfect);
  report.desktop.win = await endState(desktop, 5, 'Perfect (5)');
  await desktop.getByRole('button', { name: 'Copy result' }).click();
  report.desktop.clipboard = await desktop.evaluate(() => navigator.clipboard.readText());
  assert(report.desktop.clipboard.includes('5/5 · Radiant') && report.desktop.clipboard.includes('Board ID 989809312'), 'copy result');
  assert((await desktop.getByRole('complementary', { name: 'Demo mode' }).textContent())?.includes('nothing is saved'), 'sample label persisted');
  await desktop.screenshot({ path: `${output}/live-win-desktop.png`, fullPage: true });
  await desktop.getByRole('button', { name: 'Play this board again' }).click();
  await place(desktop, 'mote');
  await desktop.getByRole('button', { name: 'Undo last piece' }).click();
  report.recovery.undo = {
    score: await desktop.locator('.score-box strong').textContent(),
    items: await desktop.locator('.score-trail li').count(),
    moteAvailable: await desktop.locator('[data-select-piece="mote"]').isEnabled(),
  };
  assert(report.recovery.undo.score === '0/5' && report.recovery.undo.items === 0 && report.recovery.undo.moteAvailable, 'undo reset');
  report.desktop.sample = sample;
  report.recovery.invalid = { noSelection, openGround, wrongShape, wrongOrientation };
  report.privacy.requests = requests;
  report.privacy.consoleErrors = errors;
  assert(requests.every(request => new URL(request.url).origin === base && request.method === 'GET' && !request.body), 'request privacy');
  assert(errors.length === 0, 'desktop console errors');
  await desktopContext.close();

  const isolationContext = await browser.newContext();
  const isolated = await isolationContext.newPage();
  await isolated.goto(`${base}/`, { waitUntil: 'networkidle' });
  const before = await isolated.evaluate(async () => {
    const today = new Date().toISOString().slice(0, 10);
    localStorage.clear();
    localStorage.setItem('shapeshift-set:daily:2026-08-14', JSON.stringify({ date: '2026-08-14', moves: [{ id: 'mote', mutation: true }] }));
    localStorage.setItem(`shapeshift-set:daily:${today}`, JSON.stringify({ date: today, moves: [{ id: 'mote', mutation: true }] }));
    localStorage.setItem('shapeshift-set:daily:sentinel', JSON.stringify({ moves: ['real'] }));
    localStorage.setItem('real-progress-sentinel', 'keep me');
    document.cookie = 'real-progress-cookie=keep; path=/';
    let opfs = { supported: false, contents: null };
    if (navigator.storage.getDirectory) {
      const root = await navigator.storage.getDirectory();
      const file = await root.getFileHandle('real-progress-sentinel.txt', { create: true });
      const writable = await file.createWritable();
      await writable.write('keep this real progress');
      await writable.close();
      opfs = { supported: true, contents: await (await file.getFile()).text() };
    }
    return { today, storage: JSON.stringify(Object.entries(localStorage).sort()), cookie: document.cookie, opfs };
  });
  await isolated.addInitScript(({ prefix }) => {
    const reads = [];
    Object.defineProperty(window, '__realProgressReads', { configurable: true, value: reads });
    const original = Storage.prototype.getItem;
    Storage.prototype.getItem = function getItem(key) {
      if (this === window.localStorage && key.startsWith(prefix)) reads.push(key);
      return original.call(this, key);
    };
  }, { prefix: 'shapeshift-set:daily:' });
  await isolated.goto(`${base}/demo`, { waitUntil: 'networkidle' });
  assert((await isolated.locator('.score-box strong').textContent()) === '0/5', 'demo began clean');
  await place(isolated, perfect[0]);
  await isolated.getByRole('button', { name: 'Reset demo' }).first().click();
  const during = await isolated.evaluate(async () => {
    let opfs = { supported: false, contents: null };
    if (navigator.storage.getDirectory) {
      const root = await navigator.storage.getDirectory();
      const file = await root.getFileHandle('real-progress-sentinel.txt');
      opfs = { supported: true, contents: await (await file.getFile()).text() };
    }
    return { storage: JSON.stringify(Object.entries(localStorage).sort()), cookie: document.cookie, databases: await indexedDB.databases(), opfs, reads: window.__realProgressReads };
  });
  assert(during.storage === before.storage && during.cookie === before.cookie, 'demo changed local data');
  assert(during.databases.length === 0 && JSON.stringify(during.opfs) === JSON.stringify(before.opfs), 'demo changed browser stores');
  assert(during.reads.length === 0, 'demo read real progress');
  await isolated.getByRole('link', { name: 'Start for real' }).click();
  assert((await isolated.locator('.score-trail li').count()) === 1, 'real progress did not load after exit');
  const after = await isolated.evaluate(async () => {
    let opfs = { supported: false, contents: null };
    if (navigator.storage.getDirectory) {
      const root = await navigator.storage.getDirectory();
      const file = await root.getFileHandle('real-progress-sentinel.txt');
      opfs = { supported: true, contents: await (await file.getFile()).text() };
    }
    return { storage: JSON.stringify(Object.entries(localStorage).sort()), cookie: document.cookie, opfs, reads: window.__realProgressReads };
  });
  assert(after.storage === before.storage && after.cookie === before.cookie && JSON.stringify(after.opfs) === JSON.stringify(before.opfs), 'exit changed real data');
  assert(JSON.stringify(after.reads) === JSON.stringify([`shapeshift-set:daily:${before.today}`]), 'read detector did not isolate demo');
  report.isolation = { opfsAvailable: before.opfs.supported, sampleDateKeyPresent: true, during, after };
  const resetButton = isolated.getByRole('button', { name: 'Reset board' });
  await resetButton.click();
  const dialog = isolated.getByRole('dialog');
  assert(await dialog.isVisible(), 'reset dialog missing');
  const focusInside = await isolated.evaluate(() => Boolean(document.activeElement?.closest('dialog')));
  await isolated.keyboard.press('Escape');
  const focusReturned = await resetButton.evaluate(node => node === document.activeElement);
  assert(focusInside && focusReturned, 'dialog focus management');
  report.accessibility.dialog = { focusInside, focusReturned };
  await isolationContext.close();

  const keyboardContext = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const keyboard = await keyboardContext.newPage();
  await keyboard.goto(`${base}/demo`, { waitUntil: 'networkidle' });
  await keyboard.keyboard.press('1');
  await keyboard.keyboard.press('q');
  await keyboard.keyboard.press('e');
  await keyboard.keyboard.press('f');
  await keyboard.keyboard.press('f');
  const moteTarget = keyboard.getByRole('button', { name: /Place selected creature in Mote habitat/ }).first();
  await moteTarget.focus();
  await keyboard.keyboard.press('ArrowRight');
  await keyboard.keyboard.press('ArrowLeft');
  await keyboard.keyboard.press('Space');
  await solve(keyboard, perfect.slice(1), 'keyboard');
  report.keyboard = { ...(await endState(keyboard, 5, 'Perfect (5)')), controls: '1–5, Q, E, F, arrows, Space, Enter' };
  await keyboard.screenshot({ path: `${output}/live-keyboard-win.png`, fullPage: true });
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
    };
  });
  assert(phoneFirst.h1 === desktopFirst.h1 && phoneFirst.audience?.includes('daily puzzle players'), 'phone job and audience');
  assert(phoneFirst.action === 'Try it with sample data' && phoneFirst.actionNote === 'Opens a complete sample board.' && phoneFirst.actionVisible, 'phone action');
  assert(phoneFirst.facts.length === 3 && phoneFirst.boardStartsInViewport && phoneFirst.overflow <= 0, 'phone first screen');
  report.phone.firstScreen = phoneFirst;
  await phone.screenshot({ path: `${output}/live-first-phone.png` });
  await phone.getByRole('link', { name: 'Try it with sample data' }).tap();
  await solve(phone, perfect, 'touch');
  report.phone.win = await endState(phone, 5, 'Perfect (5)');
  report.phone.banner = (await phone.getByRole('complementary', { name: 'Demo mode' }).textContent())?.trim();
  report.phone.overflow = await phone.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  assert(report.phone.overflow <= 0, 'phone end overflow');
  await phone.screenshot({ path: `${output}/live-phone-win.png`, fullPage: true });
  await phone.getByRole('button', { name: 'Play this board again' }).tap();
  assert((await phone.locator('.score-box strong').textContent()) === '0/5' && (await phone.locator('.score-trail li').count()) === 0, 'phone replay');
  await phoneContext.close();

  const routeContext = await browser.newContext();
  const routePage = await routeContext.newPage();
  for (const [path, status, title] of [
    ['/', 200, 'Shapeshift Set — order five creatures daily'],
    ['/demo', 200, 'Demo — Shapeshift Set'],
    ['/privacy', 200, 'Privacy — Shapeshift Set'],
    ['/terms', 200, 'Terms — Shapeshift Set'],
    ['/missing-page-repair-6', 404, 'Page not found — Shapeshift Set'],
  ]) {
    const response = await routePage.goto(`${base}${path}`, { waitUntil: 'networkidle' });
    const result = { status: response?.status(), title: await routePage.title(), h1: await routePage.locator('h1').count(), main: await routePage.locator('main').count(), footer: await routePage.locator('footer').count(), axe: await axe(routePage) };
    assert(result.status === status && result.title === title && result.h1 === 1 && result.main === 1 && result.footer === 1 && result.axe.length === 0, `route ${path}`);
    report.routes[path] = result;
  }
  await routePage.goto(`${base}/`, { waitUntil: 'networkidle' });
  const links = await routePage.locator('a[href]').evaluateAll(nodes => [...new Set(nodes.map(node => node.href))]);
  report.routes.links = [];
  for (const url of links.filter(url => url.startsWith('http'))) {
    const response = await routeContext.request.get(url);
    assert(response.status() >= 200 && response.status() < 400, `dead link ${url}`);
    report.routes.links.push({ url, status: response.status() });
  }
  await routeContext.close();

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
  report.accessibility.text200 = await reflow.evaluate(() => ({ overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth, board: Boolean(document.querySelector('.board')?.getBoundingClientRect().width), controls: [...document.querySelectorAll('.game-tools button')].every(node => node.getBoundingClientRect().width > 0) }));
  assert(report.accessibility.text200.overflow <= 0 && report.accessibility.text200.board && report.accessibility.text200.controls, '200% reflow');
  await reflowContext.close();

  const offlineContext = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const offline = await offlineContext.newPage();
  await offline.goto(`${base}/demo`, { waitUntil: 'networkidle' });
  await offline.waitForFunction(() => Boolean(navigator.serviceWorker.controller));
  await offline.reload({ waitUntil: 'networkidle' });
  await offlineContext.setOffline(true);
  await offline.reload({ waitUntil: 'domcontentloaded' });
  report.offline = { title: await offline.title(), h1: await offline.locator('h1').textContent(), board: await offline.locator('.board').isVisible() };
  assert(report.offline.h1 === 'Place five sample creatures in order' && report.offline.board, 'offline reload');
  await offlineContext.close();

  const performanceContext = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  const performancePage = await performanceContext.newPage();
  const cdp = await performanceContext.newCDPSession(performancePage);
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
  await performancePage.goto(`${base}/demo`, { waitUntil: 'networkidle' });
  report.performance = await performancePage.evaluate(async () => {
    const startTicks = Number(document.documentElement.dataset.gameTicks);
    const frames = await new Promise(resolve => {
      const values = [];
      const sample = time => { values.push(time); values.length === 181 ? resolve(values) : requestAnimationFrame(sample); };
      requestAnimationFrame(sample);
    });
    const intervals = frames.slice(1).map((time, index) => time - frames[index]);
    const elapsed = frames.at(-1) - frames[0];
    const sorted = [...intervals].sort((a, b) => a - b);
    const ticks = Number(document.documentElement.dataset.gameTicks) - startTicks;
    return { target: Number(document.documentElement.dataset.frameTarget), frames: intervals.length, fps: intervals.length * 1000 / elapsed, meanMs: elapsed / intervals.length, p95Ms: sorted[Math.floor(sorted.length * 0.95)], fixedStepHz: ticks * 1000 / elapsed, cpuThrottle: 4 };
  });
  assert(report.performance.fps >= 55 && report.performance.fps <= 65 && report.performance.fixedStepHz >= 55 && report.performance.fixedStepHz <= 65, 'frame rate');
  await performanceContext.close();

  const rejectedContext = await browser.newContext();
  await rejectedContext.addInitScript(() => {
    Storage.prototype.setItem = () => { throw new DOMException('Storage full', 'QuotaExceededError'); };
  });
  const rejected = await rejectedContext.newPage();
  await rejected.goto(`${base}/`, { waitUntil: 'networkidle' });
  await place(rejected, 'mote');
  report.recovery.rejectedWrite = (await rejected.locator('.status-row').textContent())?.trim();
  assert(report.recovery.rejectedWrite === 'Progress could not be saved. This run will not survive reload. Keep this tab open to finish the board.', 'storage warning');
  await rejected.reload({ waitUntil: 'networkidle' });
  report.recovery.rejectedReloadScore = await rejected.locator('.score-box strong').textContent();
  assert(report.recovery.rejectedReloadScore === '0/5', 'storage recovery');
  await rejectedContext.close();
} finally {
  await browser.close();
}

const homeResponse = await fetch(`${base}/`);
report.privacy.headers = {
  hsts: homeResponse.headers.get('strict-transport-security'),
  contentTypeOptions: homeResponse.headers.get('x-content-type-options'),
  referrerPolicy: homeResponse.headers.get('referrer-policy'),
  contentSecurityPolicy: homeResponse.headers.get('content-security-policy'),
  permissionsPolicy: homeResponse.headers.get('permissions-policy'),
};
assert(report.privacy.headers.hsts && report.privacy.headers.contentTypeOptions === 'nosniff', 'security headers');

writeFileSync(`${output}/live-check.json`, `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify({ verdict: 'PASS', ...report }, null, 2));
