import { mkdirSync, writeFileSync } from 'node:fs';
import { chromium, devices } from 'playwright';
import AxeBuilder from '@axe-core/playwright';

const base = 'https://shapeshift-set.sociobot.in';
const evidenceDirectory = new URL('.', import.meta.url).pathname;
const perfectOrder = ['mote', 'nook', 'crown', 'crook', 'wing'];
const reverseOrder = [...perfectOrder].reverse();
const pieceNumber = { mote: 1, nook: 2, wing: 3, crown: 4, crook: 5 };
const report = { base, desktop: {}, phone: {}, keyboard: {}, offline: {}, routes: {}, responsive: {}, focus: {}, requests: [], errors: [] };

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function orient(page, id, input = 'pointer') {
  const piece = page.locator(`[data-select-piece="${id}"]`);
  if (input === 'touch') await piece.tap();
  else if (input === 'keyboard') await page.keyboard.press(String(pieceNumber[id]));
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
  throw new Error(`${id} did not become ready`);
}

async function place(page, id, input = 'pointer') {
  await orient(page, id, input);
  const name = id[0].toUpperCase() + id.slice(1);
  const habitat = page.getByRole('button', { name: new RegExp(`Place selected creature in ${name} habitat`) }).first();
  if (input === 'touch') await habitat.tap();
  else if (input === 'keyboard') {
    await habitat.focus();
    await page.keyboard.press('Enter');
  } else await habitat.click();
}

async function solve(page, order, input = 'pointer') {
  for (const id of order) await place(page, id, input);
}

function contrastRatio(foreground, background) {
  const channels = (color) => color.match(/[\d.]+/g).slice(0, 3).map(Number);
  const luminance = (color) => channels(color).map((channel) => channel / 255)
    .map((channel) => channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4)
    .reduce((sum, channel, index) => sum + channel * [0.2126, 0.7152, 0.0722][index], 0);
  const [light, dark] = [luminance(foreground), luminance(background)].sort((a, b) => b - a);
  return (light + 0.05) / (dark + 0.05);
}

mkdirSync(evidenceDirectory, { recursive: true });
const browser = await chromium.launch();
try {
  const desktop = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await desktop.newPage();
  page.on('request', (request) => report.requests.push(request.url()));
  page.on('console', (message) => { if (message.type() === 'error') report.errors.push(message.text()); });
  page.on('pageerror', (error) => report.errors.push(String(error)));
  await page.goto(`${base}/`, { waitUntil: 'networkidle' });
  const first = await page.evaluate(() => {
    const box = (selector) => document.querySelector(selector)?.getBoundingClientRect();
    const board = box('.board');
    const action = box('.hero-action .button');
    return { title: document.title, h1: document.querySelector('h1')?.textContent?.trim(), action: document.querySelector('.hero-action .button')?.textContent?.trim(), actionVisible: Boolean(action && action.top >= 0 && action.bottom <= innerHeight), boardVisible: Boolean(board && board.top < innerHeight) };
  });
  assert(first.h1 === 'Place five creatures in the right order', 'Desktop job heading is wrong');
  assert(first.action === 'Try it with sample data' && first.actionVisible, 'Desktop first action is not visible');
  assert(first.boardVisible, 'Desktop first screen does not show the board');
  report.desktop.firstScreen = first;
  await page.screenshot({ path: `${evidenceDirectory}/live-first-desktop.png` });
  const realSentinel = await page.evaluate(() => {
    localStorage.setItem('shapeshift-set:daily:sentinel', JSON.stringify({ moves: ['real'] }));
    localStorage.setItem('real-progress-sentinel', 'keep me');
    document.cookie = 'real-progress-cookie=keep; path=/';
    return { storage: JSON.stringify(Object.entries(localStorage).sort()), cookie: document.cookie };
  });

  await page.getByRole('link', { name: 'Try it with sample data' }).click();
  await page.waitForURL(`${base}/demo`);
  await page.getByRole('button', { name: /Row 1, column 1/ }).click();
  await page.locator('[data-demo-reset]').click();
  await solve(page, reverseOrder);
  await page.getByRole('heading', { name: 'You changed 1 of 5' }).waitFor();
  await page.getByText('Try again (0–2)', { exact: true }).waitFor();
  assert(await page.locator('.score-trail li').count() === 5, 'Loss end screen is missing its result trail');
  await page.screenshot({ path: `${evidenceDirectory}/live-loss-desktop.png`, fullPage: true });
  await page.locator('[data-demo-reset]').click();
  assert(await page.locator('.score-trail li').count() === 0, 'Reset demo did not clear the trail');
  assert(await page.locator('.score-box strong').textContent() === '0/5', 'Reset demo did not clear the score');
  await solve(page, perfectOrder);
  await page.getByRole('heading', { name: 'You changed 5 of 5' }).waitFor();
  await page.getByText('Perfect (5)', { exact: true }).waitFor();
  await page.screenshot({ path: `${evidenceDirectory}/live-win-desktop.png`, fullPage: true });
  const demoStorage = await page.evaluate(() => ({ storage: JSON.stringify(Object.entries(localStorage).sort()), cookie: document.cookie }));
  assert(demoStorage.storage === realSentinel.storage && demoStorage.cookie === realSentinel.cookie, 'Demo changed real browser data');
  report.desktop.demo = { banner: await page.getByRole('complementary', { name: 'Demo mode' }).textContent(), score: await page.locator('.score-box strong').textContent(), resultItems: await page.locator('.score-trail li.success').count(), storagePreserved: true };
  const axe = await new AxeBuilder({ page }).analyze();
  assert(axe.violations.filter((violation) => ['serious', 'critical'].includes(violation.impact ?? '')).length === 0, 'Live demo has serious or critical Axe findings');
  const focus = [];
  for (const [selector, previous] of [['[data-demo-reset]', '.demo-banner a'], ['.demo-banner a', '[data-demo-reset]']]) {
    await page.locator(previous).focus();
    await page.keyboard.press(selector === '[data-demo-reset]' ? 'Shift+Tab' : 'Tab');
    const details = await page.locator(selector).evaluate((control) => {
      const style = getComputedStyle(control);
      return { focused: control.matches(':focus-visible'), color: style.outlineColor, style: style.outlineStyle, width: style.outlineWidth, background: getComputedStyle(control.closest('.demo-banner')).backgroundColor };
    });
    details.contrast = contrastRatio(details.color, details.background);
    assert(details.focused && details.style === 'solid' && Number.parseFloat(details.width) >= 2 && details.contrast >= 3, `Demo focus is not visible enough: ${JSON.stringify(details)}`);
    focus.push(details);
  }
  report.focus.demoActions = focus;
  await page.getByRole('link', { name: 'Start for real' }).click();
  await page.waitForURL(`${base}/`);
  const returnedStorage = await page.evaluate(() => ({ storage: JSON.stringify(Object.entries(localStorage).sort()), cookie: document.cookie }));
  assert(returnedStorage.storage === realSentinel.storage && returnedStorage.cookie === realSentinel.cookie, 'Leaving demo changed real browser data');
  report.desktop.realExit = { storagePreserved: true, path: new URL(page.url()).pathname };
  assert(report.errors.length === 0, `Live desktop errors: ${report.errors.join('; ')}`);
  await desktop.close();

  const keyboardContext = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const keyboard = await keyboardContext.newPage();
  await keyboard.goto(`${base}/demo`, { waitUntil: 'networkidle' });
  await keyboard.keyboard.press('1');
  await keyboard.keyboard.press('q');
  await keyboard.keyboard.press('e');
  await keyboard.keyboard.press('f');
  await keyboard.keyboard.press('f');
  const moteHabitat = keyboard.getByRole('button', { name: /Place selected creature in Mote habitat/ }).first();
  await moteHabitat.focus();
  await keyboard.keyboard.press('ArrowRight');
  await keyboard.keyboard.press('ArrowLeft');
  await keyboard.keyboard.press('Space');
  await solve(keyboard, perfectOrder.slice(1), 'keyboard');
  await keyboard.getByRole('heading', { name: 'You changed 5 of 5' }).waitFor();
  await keyboard.screenshot({ path: `${evidenceDirectory}/live-keyboard-win.png`, fullPage: true });
  report.keyboard = { score: await keyboard.locator('.score-box strong').textContent(), result: await keyboard.getByText('Perfect (5)', { exact: true }).textContent() };
  await keyboardContext.close();

  const phone = await browser.newContext({ ...devices['iPhone 13'], viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  const phonePage = await phone.newPage();
  await phonePage.goto(`${base}/`, { waitUntil: 'networkidle' });
  const phoneFirst = await phonePage.evaluate(() => {
    const board = document.querySelector('.board')?.getBoundingClientRect();
    const action = document.querySelector('.hero-action .button')?.getBoundingClientRect();
    return { h1: document.querySelector('h1')?.textContent?.trim(), actionVisible: Boolean(action && action.top >= 0 && action.bottom <= innerHeight), boardVisible: Boolean(board && board.top < innerHeight), overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth };
  });
  assert(phoneFirst.h1 === 'Place five creatures in the right order' && phoneFirst.actionVisible && phoneFirst.boardVisible && phoneFirst.overflow <= 0, 'Phone first screen does not meet the game-first requirement');
  await phonePage.screenshot({ path: `${evidenceDirectory}/live-first-phone.png` });
  await phonePage.getByRole('link', { name: 'Try it with sample data' }).tap();
  await place(phonePage, 'mote', 'touch');
  await phonePage.locator('.score-box strong').filter({ hasText: '1/5' }).waitFor();
  report.phone = { firstScreen: phoneFirst, scoreAfterTouchPlacement: await phonePage.locator('.score-box strong').textContent(), demoBanner: await phonePage.getByRole('complementary', { name: 'Demo mode' }).textContent() };
  await phone.close();

  const offline = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const offlinePage = await offline.newPage();
  await offlinePage.goto(`${base}/demo`, { waitUntil: 'networkidle' });
  await offlinePage.waitForFunction(async () => Boolean(navigator.serviceWorker.controller && await navigator.serviceWorker.ready));
  await offlinePage.reload({ waitUntil: 'networkidle' });
  await offline.setOffline(true);
  await offlinePage.reload({ waitUntil: 'domcontentloaded' });
  await offlinePage.getByRole('heading', { name: 'Place five sample creatures in order' }).waitFor();
  report.offline = { heading: await offlinePage.locator('h1').textContent(), boardVisible: await offlinePage.locator('.board').isVisible() };
  await offline.close();

  const routeContext = await browser.newContext();
  const routePage = await routeContext.newPage();
  for (const [path, status] of [['/', 200], ['/demo', 200], ['/privacy', 200], ['/terms', 200], ['/missing-page', 404]]) {
    const response = await routePage.goto(`${base}${path}`, { waitUntil: 'networkidle' });
    assert(response?.status() === status, `${path} returned ${response?.status()}`);
    report.routes[path] = { status: response?.status(), title: await routePage.title(), h1Count: await routePage.locator('h1').count(), mainCount: await routePage.locator('main').count() };
  }
  await routeContext.close();

  const responsiveContext = await browser.newContext();
  const responsivePage = await responsiveContext.newPage();
  for (const width of [320, 881, 900, 1024, 1100, 1279, 1280]) {
    await responsivePage.setViewportSize({ width, height: 900 });
    await responsivePage.goto(`${base}/demo`, { waitUntil: 'networkidle' });
    const layout = await responsivePage.evaluate(() => ({
      overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      cells: [...document.querySelectorAll('.board-cell')].map((cell) => { const box = cell.getBoundingClientRect(); return { width: box.width, height: box.height }; }),
      controls: [...document.querySelectorAll('.game-tools button')].map((control) => { const box = control.getBoundingClientRect(); return { left: box.left, right: box.right, viewport: innerWidth }; }),
    }));
    assert(layout.overflow <= 0 && layout.cells.every((cell) => cell.width >= 44 && cell.height >= 44) && layout.controls.every((control) => control.left >= 0 && control.right <= control.viewport), `Responsive failure at ${width}px`);
    report.responsive[width] = layout;
  }
  await responsiveContext.close();
} finally {
  await browser.close();
}

report.requests = [...new Set(report.requests)];
assert(report.requests.every((url) => new URL(url).origin === base), `Unexpected request origin: ${report.requests.join(', ')}`);
writeFileSync(`${evidenceDirectory}/live-browser-check.json`, `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify({ status: 'passed', desktop: report.desktop, phone: report.phone, keyboard: report.keyboard, offline: report.offline }, null, 2));
