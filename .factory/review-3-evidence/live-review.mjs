import { mkdirSync, writeFileSync } from 'node:fs';
import { chromium, devices } from 'playwright';
import AxeBuilder from '@axe-core/playwright';

const base = 'https://shapeshift-set.sociobot.in';
const output = new URL('.', import.meta.url).pathname;
const perfect = ['mote', 'nook', 'crown', 'crook', 'wing'];
const loss = [...perfect].reverse();
const numbers = { mote: '1', nook: '2', wing: '3', crown: '4', crook: '5' };
const report = { base, checkedAt: new Date().toISOString(), desktop: {}, phone: {}, keyboard: {}, routes: {}, offline: {}, accessibility: {}, responsive: {}, performance: {}, requests: [], consoleErrors: [] };

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

async function axeSummary(page) {
  const results = await new AxeBuilder({ page }).analyze();
  return results.violations.map(({ id, impact, nodes }) => ({ id, impact, nodes: nodes.length }));
}

mkdirSync(output, { recursive: true });
const browser = await chromium.launch();
try {
  const desktopContext = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await desktopContext.newPage();
  page.on('request', request => report.requests.push({ method: request.method(), url: request.url(), body: request.postData() }));
  page.on('console', message => { if (message.type() === 'error') report.consoleErrors.push(message.text()); });
  page.on('pageerror', error => report.consoleErrors.push(String(error)));
  await page.goto(`${base}/`, { waitUntil: 'networkidle' });
  const first = await page.evaluate(() => {
    const box = selector => document.querySelector(selector)?.getBoundingClientRect();
    const board = box('.board');
    const action = box('.hero-action .button');
    return {
      title: document.title,
      h1: document.querySelector('h1')?.textContent?.trim(),
      audience: document.querySelector('.hero-summary')?.textContent?.trim(),
      action: document.querySelector('.hero-action .button')?.textContent?.trim(),
      actionNote: document.querySelector('.hero-action span')?.textContent?.trim(),
      facts: [...document.querySelectorAll('.plain-facts li')].map(node => node.textContent.trim()),
      actionVisible: Boolean(action && action.top >= 0 && action.bottom <= innerHeight),
      boardVisible: Boolean(board && board.top >= 0 && board.bottom <= innerHeight),
      scrollY,
    };
  });
  assert(first.h1 === 'Place five creatures in the right order', 'desktop job heading');
  assert(first.audience?.includes('daily puzzle players'), 'desktop audience sentence');
  assert(first.action === 'Try it with sample data' && first.actionVisible, 'desktop primary action');
  assert(first.actionNote === 'Opens a complete sample board.', 'desktop action explanation');
  assert(first.facts.length === 3 && first.boardVisible && first.scrollY === 0, 'desktop first-screen content');
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
  const bannerBefore = await page.getByRole('complementary', { name: 'Demo mode' }).textContent();
  assert(bannerBefore?.includes('Demo — sample board, nothing is saved'), 'persistent demo label');

  await page.getByRole('button', { name: /Row 1, column 1/ }).click();
  const invalidMessage = await page.locator('.status-row').textContent();
  assert(invalidMessage?.includes('No creature is selected'), 'invalid empty-board feedback');

  await page.getByRole('button', { name: /Open ground/ }).first().click();
  const openGroundMessage = await page.locator('.status-row').textContent();
  assert(openGroundMessage?.includes('That tile has no habitat'), 'open-ground recovery feedback');

  await page.locator('[data-select-piece="wing"]').click();
  await page.getByRole('button', { name: /Place selected creature in Wing habitat/ }).first().click();
  const orientationMessage = await page.locator('.status-row').textContent();
  assert(orientationMessage?.includes('The blocks do not match yet'), 'orientation recovery feedback');

  await page.getByRole('button', { name: /Place selected creature in Mote habitat/ }).first().click();
  const wrongHabitatMessage = await page.locator('.status-row').textContent();
  assert(wrongHabitatMessage?.includes('That creature has a different shape'), 'wrong-habitat recovery feedback');

  await place(page, 'mote');
  await page.locator('[data-select-piece="nook"]').click();
  const occupiedCellDisabled = await page.getByRole('button', { name: /Mote habitat, filled/ }).first().isDisabled();
  assert(occupiedCellDisabled, 'filled habitat was not protected from another placement');
  await page.getByRole('button', { name: 'Reset demo' }).first().click();
  assert((await page.locator('.score-box strong').textContent()) === '0/5', 'reset after invalid action');

  await solve(page, loss);
  await page.getByRole('heading', { name: 'You changed 1 of 5' }).waitFor();
  assert((await page.locator('.score-trail li').count()) === 5, 'loss result trail');
  report.desktop.loss = { score: await page.locator('.score-box strong').textContent(), tier: await page.getByText('Try again (0–2)', { exact: true }).textContent(), items: 5 };
  await page.screenshot({ path: `${output}/loss-desktop.png`, fullPage: true });

  await page.getByRole('button', { name: 'Reset demo' }).first().click();
  assert((await page.locator('.score-box strong').textContent()) === '0/5' && (await page.locator('.score-trail li').count()) === 0, 'reset did not clear finished run');
  await solve(page, perfect);
  await page.getByRole('heading', { name: 'You changed 5 of 5' }).waitFor();
  assert((await page.locator('.score-trail li.success').count()) === 5, 'perfect result trail');
  const afterDemo = await page.evaluate(() => ({ storage: JSON.stringify(Object.entries(localStorage).sort()), cookie: document.cookie }));
  assert(afterDemo.storage === sentinel.storage && afterDemo.cookie === sentinel.cookie, 'demo changed real data');
  report.desktop.win = { score: await page.locator('.score-box strong').textContent(), tier: await page.getByText('Perfect (5)', { exact: true }).textContent(), items: 5, banner: await page.getByRole('complementary', { name: 'Demo mode' }).textContent(), realDataUnchanged: true };
  await page.screenshot({ path: `${output}/win-desktop.png`, fullPage: true });

  await page.getByRole('button', { name: 'Play this board again' }).click();
  assert((await page.locator('.score-box strong').textContent()) === '0/5', 'replay did not reset');
  await place(page, 'mote');
  await page.getByRole('button', { name: 'Undo last piece' }).click();
  assert((await page.locator('.score-box strong').textContent()) === '0/5', 'undo did not recover');
  await page.getByRole('button', { name: 'Reset demo' }).first().click();
  assert((await page.locator('.score-box strong').textContent()) === '0/5', 'second reset failed');
  report.desktop.recovery = {
    invalidMessage: invalidMessage.trim(),
    openGroundMessage: openGroundMessage.trim(),
    orientationMessage: orientationMessage.trim(),
    wrongHabitatMessage: wrongHabitatMessage.trim(),
    occupiedCellDisabled,
    replayReset: true,
    undoReset: true,
    demoReset: true,
  };

  const violations = await axeSummary(page);
  assert(!violations.some(item => ['serious', 'critical'].includes(item.impact)), 'serious or critical Axe violation');
  report.accessibility.demoAxe = violations;
  const focusOrder = [];
  await page.getByRole('link', { name: 'Start for real' }).focus();
  await page.keyboard.press('Shift+Tab');
  focusOrder.push(await page.locator('[data-demo-reset]').evaluate(node => ({ text: node.textContent?.trim(), focused: node.matches(':focus-visible'), outline: getComputedStyle(node).outline })));
  await page.keyboard.press('Tab');
  focusOrder.push(await page.getByRole('link', { name: 'Start for real' }).evaluate(node => ({ text: node.textContent?.trim(), focused: node.matches(':focus-visible'), outline: getComputedStyle(node).outline })));
  assert(focusOrder.every(item => item.focused && !item.outline.startsWith('rgb(0, 0, 0) none')), `keyboard focus not visible: ${JSON.stringify(focusOrder)}`);
  report.accessibility.focus = focusOrder;
  await page.getByRole('link', { name: 'Start for real' }).click();
  await page.waitForURL(`${base}/`);
  const realAfter = await page.evaluate(() => ({ storage: JSON.stringify(Object.entries(localStorage).sort()), cookie: document.cookie }));
  assert(realAfter.storage === sentinel.storage && realAfter.cookie === sentinel.cookie, 'leaving demo changed real data');
  await desktopContext.close();

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
  await keyboard.getByRole('heading', { name: 'You changed 5 of 5' }).waitFor();
  report.keyboard = { score: await keyboard.locator('.score-box strong').textContent(), result: await keyboard.getByText('Perfect (5)', { exact: true }).textContent(), controls: 'number, Q, E, F, arrows, Space, Enter' };
  await keyboard.screenshot({ path: `${output}/keyboard-win.png`, fullPage: true });
  await keyboardContext.close();

  const phoneContext = await browser.newContext({ ...devices['iPhone 13'], viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  const phone = await phoneContext.newPage();
  await phone.goto(`${base}/`, { waitUntil: 'networkidle' });
  const phoneFirst = await phone.evaluate(() => {
    const visible = selector => { const box = document.querySelector(selector)?.getBoundingClientRect(); return Boolean(box && box.top >= 0 && box.bottom <= innerHeight); };
    const board = document.querySelector('.board')?.getBoundingClientRect();
    return { h1: document.querySelector('h1')?.textContent?.trim(), audience: document.querySelector('.hero-summary')?.textContent?.trim(), action: document.querySelector('.hero-action .button')?.textContent?.trim(), actionVisible: visible('.hero-action .button'), boardVisible: Boolean(board && board.top < innerHeight), overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth, scrollY };
  });
  assert(phoneFirst.h1 === first.h1 && phoneFirst.audience?.includes('daily puzzle players') && phoneFirst.action === 'Try it with sample data' && phoneFirst.actionVisible && phoneFirst.boardVisible && phoneFirst.overflow <= 0 && phoneFirst.scrollY === 0, 'phone first screen');
  report.phone.firstScreen = phoneFirst;
  await phone.screenshot({ path: `${output}/first-phone.png` });
  await phone.getByRole('link', { name: 'Try it with sample data' }).tap();
  await place(phone, 'mote', 'touch');
  assert((await phone.locator('.score-box strong').textContent()) === '1/5', 'touch placement');
  report.phone.touch = { score: '1/5', banner: await phone.getByRole('complementary', { name: 'Demo mode' }).textContent() };
  await phoneContext.close();

  const reducedContext = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' });
  const reduced = await reducedContext.newPage();
  await reduced.goto(`${base}/demo`, { waitUntil: 'networkidle' });
  await place(reduced, 'mote');
  const motion = await reduced.locator('.board-cell.placed').first().evaluate(node => ({ animation: getComputedStyle(node).animationDuration, transition: getComputedStyle(node).transitionDuration }));
  assert(Number.parseFloat(motion.animation) <= 0.00001 && Number.parseFloat(motion.transition) <= 0.00001, `reduced motion not respected: ${JSON.stringify(motion)}`);
  report.accessibility.reducedMotion = motion;
  await reducedContext.close();

  const reflowContext = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const reflow = await reflowContext.newPage();
  await reflow.goto(`${base}/demo`, { waitUntil: 'networkidle' });
  await reflow.evaluate(() => { document.documentElement.style.fontSize = '200%'; });
  const reflowCheck = await reflow.evaluate(() => ({ overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth, boardVisible: Boolean(document.querySelector('.board')?.getBoundingClientRect().width), controls: [...document.querySelectorAll('.game-tools button')].every(node => { const box = node.getBoundingClientRect(); return box.width > 0 && box.height > 0; }) }));
  assert(reflowCheck.overflow <= 0 && reflowCheck.boardVisible && reflowCheck.controls, `200% text reflow: ${JSON.stringify(reflowCheck)}`);
  report.accessibility.text200 = reflowCheck;
  await reflowContext.close();

  const responsiveContext = await browser.newContext();
  const responsive = await responsiveContext.newPage();
  for (const width of [320, 881, 900, 1024, 1100, 1279, 1280]) {
    await responsive.setViewportSize({ width, height: 900 });
    await responsive.goto(`${base}/demo`, { waitUntil: 'networkidle' });
    const check = await responsive.evaluate(() => {
      const cells = [...document.querySelectorAll('.board-cell')].map(node => node.getBoundingClientRect());
      const tools = [...document.querySelectorAll('.game-tools button')].map(node => node.getBoundingClientRect());
      return { overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth, minCell: Math.min(...cells.map(box => Math.min(box.width, box.height))), controlsInViewport: tools.every(box => box.left >= 0 && box.right <= innerWidth) };
    });
    assert(check.overflow <= 0 && check.minCell >= 44 && check.controlsInViewport, `responsive width ${width}`);
    report.responsive[width] = check;
  }
  await responsiveContext.close();

  const performanceContext = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  const performancePage = await performanceContext.newPage();
  const cdp = await performanceContext.newCDPSession(performancePage);
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
  await performancePage.goto(`${base}/demo`, { waitUntil: 'networkidle' });
  const frameReading = await performancePage.evaluate(async () => {
    const target = Number(document.documentElement.dataset.frameTarget);
    const startTicks = Number(document.documentElement.dataset.gameTicks);
    const timestamps = await new Promise(resolve => {
      const frames = [];
      const sample = time => {
        frames.push(time);
        if (frames.length >= 181) resolve(frames);
        else requestAnimationFrame(sample);
      };
      requestAnimationFrame(sample);
    });
    const intervals = timestamps.slice(1).map((time, index) => time - timestamps[index]);
    const elapsed = timestamps.at(-1) - timestamps[0];
    const sorted = [...intervals].sort((a, b) => a - b);
    const ticks = Number(document.documentElement.dataset.gameTicks) - startTicks;
    return {
      target,
      frames: intervals.length,
      elapsedMs: elapsed,
      fps: intervals.length * 1000 / elapsed,
      meanFrameMs: elapsed / intervals.length,
      p95FrameMs: sorted[Math.floor(sorted.length * 0.95)],
      fixedStepHz: ticks * 1000 / elapsed,
      cpuThrottle: 4,
    };
  });
  assert(frameReading.target === 60 && frameReading.fps >= 55 && frameReading.fps <= 65, `live frame-rate target: ${JSON.stringify(frameReading)}`);
  assert(frameReading.fixedStepHz >= 55 && frameReading.fixedStepHz <= 65, `live fixed-step rate: ${JSON.stringify(frameReading)}`);
  report.performance = frameReading;
  await performanceContext.close();

  const routeContext = await browser.newContext();
  const route = await routeContext.newPage();
  for (const [path, expectedStatus, expectedTitle] of [
    ['/', 200, 'Shapeshift Set — order five creatures daily'],
    ['/demo', 200, 'Demo — Shapeshift Set'],
    ['/privacy', 200, 'Privacy — Shapeshift Set'],
    ['/terms', 200, 'Terms — Shapeshift Set'],
    ['/missing-page', 404, 'Page not found — Shapeshift Set'],
  ]) {
    const response = await route.goto(`${base}${path}`, { waitUntil: 'networkidle' });
    const details = { status: response?.status(), title: await route.title(), h1: await route.locator('h1').count(), main: await route.locator('main').count(), footer: await route.locator('footer').count(), axe: await axeSummary(route) };
    assert(details.status === expectedStatus && details.title === expectedTitle && details.h1 === 1 && details.main === 1 && details.footer === 1, `route ${path}`);
    assert(!details.axe.some(item => ['serious', 'critical'].includes(item.impact)), `route Axe ${path}`);
    report.routes[path] = details;
  }
  await route.goto(`${base}/`, { waitUntil: 'networkidle' });
  const links = await route.locator('a[href]').evaluateAll(nodes => [...new Set(nodes.map(node => node.href))]);
  report.routes.links = [];
  for (const url of links) {
    if (!url.startsWith(base)) continue;
    const response = await routeContext.request.get(url);
    assert(response.status() === 200, `dead link ${url}`);
    report.routes.links.push({ url, status: response.status() });
  }
  await routeContext.close();

  const offlineContext = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const offline = await offlineContext.newPage();
  await offline.goto(`${base}/demo`, { waitUntil: 'networkidle' });
  await offline.waitForFunction(async () => Boolean(navigator.serviceWorker.controller && await navigator.serviceWorker.ready));
  await offline.reload({ waitUntil: 'networkidle' });
  await offlineContext.setOffline(true);
  await offline.reload({ waitUntil: 'domcontentloaded' });
  const offlineResult = { title: await offline.title(), h1: await offline.locator('h1').textContent(), board: await offline.locator('.board').isVisible() };
  assert(offlineResult.h1 === 'Place five sample creatures in order' && offlineResult.board, 'offline reopen');
  report.offline = offlineResult;
  await offlineContext.close();
} finally {
  await browser.close();
}

report.requests = report.requests.filter((item, index, items) => items.findIndex(other => JSON.stringify(other) === JSON.stringify(item)) === index);
assert(report.requests.every(item => new URL(item.url).origin === base), 'third-party request');
assert(report.requests.every(item => item.method === 'GET' && !item.body), 'unexpected event payload');
assert(report.consoleErrors.length === 0, `console errors: ${report.consoleErrors.join('; ')}`);
writeFileSync(`${output}/live-review.json`, `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify({ verdict: 'PASS', desktop: report.desktop, phone: report.phone, keyboard: report.keyboard, offline: report.offline, routes: report.routes, errors: report.consoleErrors }, null, 2));
