import { expect, test, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import {
  PIECES,
  createGame,
  flipPiece,
  isOriented,
  placeSelected,
  rotatePiece,
  type GameState,
  type PieceId,
} from '../src/core';

const perfectOrder: PieceId[] = ['mote', 'nook', 'wing', 'crown', 'crook'];

async function orientPiece(page: Page, id: PieceId): Promise<void> {
  await page.locator(`[data-select-piece="${id}"]`).click();
  for (let flip = 0; flip < 2; flip += 1) {
    for (let turn = 0; turn < 4; turn += 1) {
      const label = await page.locator(`[data-select-piece="${id}"] small`).textContent();
      if (label === 'Fits') return;
      await page.locator('[data-rotate="1"]').click();
    }
    await page.locator('[data-flip]').click();
  }
  throw new Error(`${id} did not reach its target orientation`);
}

async function placePiece(page: Page, id: PieceId): Promise<void> {
  await orientPiece(page, id);
  const name = PIECES.find((piece) => piece.id === id)!.name;
  await page.getByRole('button', { name: new RegExp(`${name} habitat, empty`) }).first().click();
}

async function solvePerfect(page: Page): Promise<void> {
  for (const id of perfectOrder) await placePiece(page, id);
}

function readyPiece(state: GameState, id: PieceId): GameState {
  let next = { ...state, selected: id };
  for (let flip = 0; flip < 2; flip += 1) {
    for (let turn = 0; turn < 4; turn += 1) {
      const piece = next.pieces.find((item) => item.id === id)!;
      if (isOriented(piece)) return next;
      next = rotatePiece(next, 1);
    }
    next = flipPiece(next);
  }
  throw new Error(`No valid orientation for ${id}`);
}

function permutations<T>(values: T[]): T[][] {
  if (values.length <= 1) return [values];
  return values.flatMap((value, index) =>
    permutations([...values.slice(0, index), ...values.slice(index + 1)]).map((rest) => [value, ...rest]));
}

test('@claim:daily-end a full run reaches the scored end screen', async ({ page }) => {
  await page.goto('/demo');
  await solvePerfect(page);
  await expect(page.getByRole('heading', { name: 'You changed 5 of 5' })).toBeVisible();
  await expect(page.getByText('Every mutation landed. You found the only perfect order.')).toBeVisible();
  await expect(page.locator('.score-trail li.success')).toHaveCount(5);
});

test('@claim:unique-perfect every generated board has one perfect order', async () => {
  for (const date of ['2026-08-14', '2026-09-02', '2027-01-01', '2030-12-31']) {
    let perfect = 0;
    for (const order of permutations(PIECES.map((piece) => piece.id))) {
      let state = createGame(date);
      for (const id of order) {
        state = readyPiece(state, id);
        state = placeSelected(state, id).state;
      }
      if (state.score === 5) perfect += 1;
    }
    expect(perfect).toBe(1);
  }
});

test('@claim:restart replay clears the finished run', async ({ page }) => {
  await page.goto('/demo');
  await solvePerfect(page);
  await page.getByRole('button', { name: 'Play this board again' }).click();
  await expect(page.locator('.score-box strong')).toContainText('0/5');
  await expect(page.locator('.score-trail li')).toHaveCount(0);
  await expect(page.getByRole('heading', { name: /You changed/ })).toHaveCount(0);
});

test('@claim:local-progress real progress survives a reload', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await placePiece(page, 'mote');
  await expect(page.locator('.score-box strong')).toContainText('1/5');
  await page.reload();
  await expect(page.locator('.score-box strong')).toContainText('1/5');
  await expect(page.locator('[data-select-piece="mote"]')).toBeDisabled();
});

test('@claim:demo-isolation demo play writes no local progress', async ({ page }) => {
  await page.goto('/demo');
  await page.evaluate(() => localStorage.clear());
  await placePiece(page, 'mote');
  expect(await page.evaluate(() => Object.keys(localStorage))).toEqual([]);
  await page.getByRole('link', { name: 'Start for real' }).click();
  await expect(page.locator('.score-box strong')).toContainText('0/5');
});

test('@claim:offline-reload the demo reopens offline after its first visit', async ({ browser }) => {
  const context = await browser.newContext();
  const firstVisit = await context.newPage();
  await firstVisit.goto('http://127.0.0.1:4173/demo');
  await firstVisit.evaluate(() => navigator.serviceWorker.ready);
  await expect.poll(() => firstVisit.evaluate(async () => {
    const registration = await navigator.serviceWorker.ready;
    const cacheName = (await caches.keys()).find((name) => name.startsWith('shapeshift-set-'));
    if (!cacheName) return false;
    const cache = await caches.open(cacheName);
    const shell = await cache.match('/index.html');
    const firstLoadAssets = performance.getEntriesByType('resource')
      .map((entry) => entry.name)
      .filter((url) => /\/assets\/index-[^/]+\.(?:js|css)$/.test(url));
    const cachedAssets = await Promise.all(firstLoadAssets.map((url) => cache.match(url)));
    return Boolean(navigator.serviceWorker.controller && registration.active && shell
      && firstLoadAssets.length === 2 && cachedAssets.every(Boolean));
  })).toBe(true);
  await firstVisit.close();
  await context.setOffline(true);
  const page = await context.newPage();
  await page.goto('http://127.0.0.1:4173/demo', { waitUntil: 'domcontentloaded' });
  await expect(page.getByRole('heading', { name: 'Place five sample creatures in order' })).toBeVisible();
  await expect(page.locator('.board')).toBeVisible();
  await context.close();
});

test('@claim:piece-settle-duration a placed creature uses the documented 220 ms settle duration', async ({ page }) => {
  await page.goto('/demo');
  await placePiece(page, 'mote');
  const duration = await page.locator('.board-cell.placed').first().evaluate((cell) =>
    getComputedStyle(cell).animationDuration);
  expect(duration).toBe('0.22s');
});

test('@claim:frame-rate the game loop advances at the 60 frames-per-second target', async ({ page }) => {
  await page.goto('/demo');
  const reading = await page.evaluate(async () => {
    const start = performance.now();
    const startTicks = Number(document.documentElement.dataset.gameTicks);
    await new Promise<void>((resolve) => setTimeout(resolve, 1_000));
    const elapsed = performance.now() - start;
    const ticks = Number(document.documentElement.dataset.gameTicks) - startTicks;
    return { target: document.documentElement.dataset.frameTarget, elapsed, ticks, rate: ticks * 1_000 / elapsed };
  });
  expect(reading.target).toBe('60');
  expect(reading.rate).toBeGreaterThanOrEqual(55);
  expect(reading.rate).toBeLessThanOrEqual(65);
});

test('@claim:keyboard-controls a creature can be selected, turned, and placed by keyboard', async ({ page }) => {
  await page.goto('/demo');
  await page.keyboard.press('1');
  await expect(page.locator('[data-select-piece="mote"]')).toHaveAttribute('aria-pressed', 'true');
  for (let flip = 0; flip < 2; flip += 1) {
    for (let turn = 0; turn < 4; turn += 1) {
      if (await page.locator('[data-select-piece="mote"] small').textContent() === 'Fits') break;
      await page.keyboard.press('e');
    }
    if (await page.locator('[data-select-piece="mote"] small').textContent() === 'Fits') break;
    await page.keyboard.press('f');
  }
  await page.getByRole('button', { name: /Mote habitat, empty/ }).first().focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('.score-box strong')).toContainText('1/5');
});

test('@claim:same-origin the demo loads no third-party runtime resources', async ({ page }) => {
  const origins = new Set<string>();
  page.on('request', (request) => origins.add(new URL(request.url()).origin));
  await page.goto('/demo');
  await placePiece(page, 'mote');
  expect([...origins]).toEqual(['http://127.0.0.1:4173']);
});

test('@claim:utc-daily a date gives one shared seed and the next UTC date gives another', async () => {
  const first = createGame('2026-09-02');
  const same = createGame('2026-09-02');
  const next = createGame('2026-09-03');
  expect(same.seed).toBe(first.seed);
  expect(same.pieces.map((piece) => piece.habitat)).toEqual(first.pieces.map((piece) => piece.habitat));
  expect(next.seed).not.toBe(first.seed);
});

test('@claim:free-no-upsells the complete game has no payment, ad, account, or booster controls', async ({ page }) => {
  await page.goto('/demo');
  await solvePerfect(page);
  await expect(page.locator('a, button').filter({ hasText: /buy|checkout|subscribe|booster|sign in|create account/i })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Play this board again' })).toBeVisible();
});

test('pages have one h1, clear metadata, no console errors, and no serious axe findings', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
  for (const path of ['/', '/demo', '/privacy', '/terms', '/missing-page']) {
    await page.goto(path);
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
    await expect(page.locator('main')).toHaveCount(1);
    await expect(page.locator('h1')).toHaveCount(1);
    await expect(page).toHaveTitle(/Shapeshift Set/);
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations.filter((item) => ['serious', 'critical'].includes(item.impact ?? ''))).toEqual([]);
  }
  expect(errors).toEqual([]);
});

test('the mobile layout keeps the board and controls within 390 pixels', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/demo');
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(0);
  await expect(page.locator('.board')).toBeVisible();
  for (const button of await page.locator('.turn-tools button').all()) {
    const box = await button.boundingBox();
    expect(box?.height).toBeGreaterThanOrEqual(44);
  }
  for (const control of await page.locator('.site-header nav a, .demo-banner button, .demo-banner a, .footer-links a').all()) {
    const box = await control.boundingBox();
    if (!box) continue;
    expect(box?.width).toBeGreaterThanOrEqual(44);
    expect(box?.height).toBeGreaterThanOrEqual(44);
  }
  const board = await page.locator('.board').boundingBox();
  expect(board?.y).toBeLessThan(844);
  expect((board?.y ?? 844) + (board?.height ?? 0)).toBeLessThanOrEqual(844);
  await page.goto('/');
  const realBoard = await page.locator('.board').boundingBox();
  expect((realBoard?.y ?? 844) + (realBoard?.height ?? 0)).toBeLessThanOrEqual(844);
  await expect(page.getByRole('link', { name: 'Try it with sample data' })).toBeVisible();
});

test('the opening desktop viewport contains a playable board', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');
  const board = await page.locator('.board').boundingBox();
  expect(board?.y).toBeLessThan(900);
  expect((board?.y ?? 900) + (board?.height ?? 0)).toBeLessThanOrEqual(900);
});
