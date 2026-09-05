import { expect, test, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import {
  PIECES,
  SAMPLE_DATE,
  createGame,
  dailyOrder,
  flipPiece,
  isOriented,
  placeSelected,
  rotatePiece,
  type GameState,
  type PieceId,
} from '../src/core';

const perfectOrder: PieceId[] = dailyOrder(SAMPLE_DATE);

function contrastRatio(foreground: string, background: string): number {
  const channels = (color: string): number[] => {
    const values = color.match(/[\d.]+/g)?.slice(0, 3).map(Number);
    if (!values || values.length !== 3) throw new Error(`Expected an RGB color, received ${color}`);
    return values;
  };
  const luminance = (color: string): number => channels(color)
    .map((channel) => channel / 255)
    .map((channel) => channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4)
    .reduce((total, channel, index) => total + channel * [0.2126, 0.7152, 0.0722][index], 0);
  const [first, second] = [luminance(foreground), luminance(background)].sort((a, b) => b - a);
  return (first + 0.05) / (second + 0.05);
}

async function orientPiece(page: Page, id: PieceId): Promise<void> {
  await page.locator(`[data-select-piece="${id}"]`).click();
  for (let flip = 0; flip < 2; flip += 1) {
    for (let turn = 0; turn < 4; turn += 1) {
      const label = await page.locator(`[data-select-piece="${id}"] small`).textContent();
      if (label === 'Ready') return;
      await page.locator('[data-rotate="1"]').click();
    }
    await page.locator('[data-flip]').click();
  }
  throw new Error(`${id} did not reach its target orientation`);
}

async function placePiece(page: Page, id: PieceId): Promise<void> {
  await orientPiece(page, id);
  const name = PIECES.find((piece) => piece.id === id)!.name;
  await page.getByRole('button', { name: new RegExp(`Place selected creature in ${name} habitat`) }).first().click();
}

async function solvePerfect(page: Page): Promise<void> {
  for (const id of perfectOrder) await placePiece(page, id);
}

async function solveOrder(page: Page, order: PieceId[]): Promise<void> {
  for (const id of order) await placePiece(page, id);
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

function orderForScore(date: string, wantedScore: number): PieceId[] {
  for (const order of permutations(PIECES.map((piece) => piece.id))) {
    let state = createGame(date);
    for (const id of order) state = placeSelected(readyPiece(state, id), id).state;
    if (state.score === wantedScore) return order;
  }
  throw new Error(`No order scores ${wantedScore}`);
}

test('@claim:daily-end a full run reaches the scored end screen', async ({ page }) => {
  await page.goto('/demo');
  await solvePerfect(page);
  await expect(page.getByRole('heading', { name: 'You changed 5 of 5' })).toBeVisible();
  await expect(page.getByText('All five neighbors changed. You found the only perfect order.')).toBeVisible();
  await expect(page.locator('.score-trail li.success')).toHaveCount(5);
});

test('@claim:board-size each sample board renders six rows, six columns, and 36 targets', async ({ page }) => {
  await page.goto('/demo');
  const board = await page.locator('.board').evaluate((element) => {
    const cells = [...element.querySelectorAll<HTMLElement>('[data-board-cell]')];
    const positions = cells.map((cell) => {
      const box = cell.getBoundingClientRect();
      return {
        x: Math.round(box.left * 100) / 100,
        y: Math.round(box.top * 100) / 100,
      };
    });
    return {
      cells: cells.length,
      columns: new Set(positions.map((position) => position.x)).size,
      rows: new Set(positions.map((position) => position.y)).size,
    };
  });
  expect(board).toEqual({ cells: 36, columns: 6, rows: 6 });
});

test('the ?demo=1 entry point opens the same isolated sample board', async ({ page }) => {
  await page.goto('/?demo=1');
  await expect(page.getByRole('heading', { name: 'Place five sample creatures in order' })).toBeVisible();
  await expect(page.getByRole('complementary', { name: 'Demo mode' })).toBeVisible();
  expect(await page.evaluate(() => Object.keys(localStorage))).toEqual([]);
});

test('@claim:unique-perfect every generated board has one perfect order and daily answers change', async () => {
  const dates = Array.from({ length: 48 }, (_, index) => new Date(Date.UTC(2026, 7, 1 + index)).toISOString().slice(0, 10));
  for (const [index, date] of dates.entries()) {
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
    if (index > 0) expect(dailyOrder(date)).not.toEqual(dailyOrder(dates[index - 1]));
  }
});

test('@claim:mutation-scoring an arrow scores only after its target creature is placed', async ({ page }) => {
  const target = perfectOrder[0];
  const dependent = perfectOrder[1];
  await page.goto('/demo');
  await placePiece(page, dependent);
  await expect(page.locator('.score-box strong')).toContainText('0/5');
  await expect(page.locator('.score-trail li')).toContainText(`${PIECES.find((piece) => piece.id === target)!.name} was not placed`);
  await placePiece(page, target);
  await expect(page.locator('.score-box strong')).toContainText('1/5');
  await expect(page.locator('.score-trail li').last()).toContainText(`Changed the starting creature`);
});

test('@claim:score-tiers every result tier shows five itemized changed-neighbor results', async ({ page }) => {
  for (const [score, label] of [[1, 'Try again (0–2)'], [3, 'Close (3–4)'], [5, 'Perfect (5)']] as const) {
    await page.goto('/demo');
    await solveOrder(page, orderForScore(SAMPLE_DATE, score));
    await expect(page.getByText(label, { exact: true })).toBeVisible();
    await expect(page.locator('.score-trail li')).toHaveCount(5);
    await expect(page.locator('.score-trail li.success')).toHaveCount(score);
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
  await expect(page.locator('.score-trail li')).toHaveCount(1);
  await page.reload();
  await expect(page.locator('.score-trail li')).toHaveCount(1);
  await expect(page.locator('[data-select-piece="mote"]')).toBeDisabled();
});

test('@claim:demo-isolation demo uses memory only and never reads or changes real progress', async ({ page }) => {
  await page.goto('/');
  const before = await page.evaluate(() => {
    localStorage.clear();
    localStorage.setItem('shapeshift-set:daily:sentinel', JSON.stringify({ moves: ['real'] }));
    localStorage.setItem('real-progress-sentinel', 'keep me');
    document.cookie = 'real-progress-cookie=keep; path=/';
    return { storage: JSON.stringify(Object.entries(localStorage).sort()), cookie: document.cookie };
  });
  await page.goto('/demo');
  await placePiece(page, perfectOrder[0]);
  await page.getByRole('button', { name: 'Reset demo' }).first().click();
  const during = await page.evaluate(async () => ({
    storage: JSON.stringify(Object.entries(localStorage).sort()),
    cookie: document.cookie,
    databases: 'databases' in indexedDB ? await indexedDB.databases() : [],
  }));
  expect(during.storage).toBe(before.storage);
  expect(during.cookie).toBe(before.cookie);
  expect(during.databases).toEqual([]);
  await page.getByRole('link', { name: 'Start for real' }).click();
  await expect(page.locator('.score-box strong')).toContainText('0/5');
  expect(await page.evaluate(() => JSON.stringify(Object.entries(localStorage).sort()))).toBe(before.storage);
});

test('@claim:offline-reload the demo reopens offline after its first visit', async ({ browser }) => {
  // Run twice in fresh contexts. A page is not controlled until the worker
  // claims it, so reload once online before testing the exact offline reload.
  for (let attempt = 0; attempt < 2; attempt += 1) {
    const context = await browser.newContext();
    try {
      const page = await context.newPage();
      await page.goto('http://127.0.0.1:4173/demo');

      await expect.poll(() => page.evaluate(async () => {
        const registration = await navigator.serviceWorker.ready;
        const cacheName = (await caches.keys()).find((name) => name.startsWith('shapeshift-set-'));
        if (!cacheName || !registration.active || !navigator.serviceWorker.controller) return false;
        const cache = await caches.open(cacheName);
        const shell = await cache.match('/index.html');
        const currentAssets = [...document.querySelectorAll<HTMLScriptElement | HTMLLinkElement>('script[src], link[rel="stylesheet"][href]')]
          .map((element) => element instanceof HTMLScriptElement ? element.src : element.href)
          .filter((url) => /\/assets\/index-[^/]+\.(?:js|css)$/.test(url));
        const cachedAssets = await Promise.all(currentAssets.map((url) => cache.match(url)));
        return Boolean(shell && currentAssets.length === 2 && cachedAssets.every(Boolean));
      })).toBe(true);

      await page.reload();
      await expect.poll(() => page.evaluate(() => Boolean(navigator.serviceWorker.controller))).toBe(true);
      await context.setOffline(true);
      await page.reload({ waitUntil: 'domcontentloaded' });
      await expect(page.getByRole('heading', { name: 'Place five sample creatures in order' })).toBeVisible();
      await expect(page.locator('.board')).toBeVisible();
    } finally {
      await context.close();
    }
  }
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

test('@claim:keyboard-controls keyboard controls select, rotate, flip, move, and place a creature', async ({ page }) => {
  await page.goto('/demo');
  await page.keyboard.press('1');
  await expect(page.locator('[data-select-piece="mote"]')).toHaveAttribute('aria-pressed', 'true');
  await page.keyboard.press('q');
  await expect(page.locator('[data-select-piece="mote"] small')).toHaveText('Needs turning');
  await page.keyboard.press('e');
  await expect(page.locator('[data-select-piece="mote"] small')).toHaveText('Ready');
  await page.keyboard.press('f');
  await expect(page.locator('[data-select-piece="mote"] small')).toHaveText('Needs turning');
  await page.keyboard.press('f');
  await expect(page.locator('[data-select-piece="mote"] small')).toHaveText('Ready');
  await page.getByRole('button', { name: /Place selected creature in Mote habitat/ }).first().focus();
  await page.keyboard.press('ArrowRight');
  await expect(page.locator('.board-cell.cursor')).toHaveAttribute('data-x', '1');
  await page.keyboard.press('ArrowLeft');
  await page.keyboard.press('Space');
  await expect(page.locator('.score-box strong')).toContainText('1/5');
});

test('@claim:all-inputs pointer and touch controls select, turn, and place creatures', async ({ browser, page }) => {
  await page.goto('/demo');
  await page.locator('[data-select-piece="mote"]').click();
  await page.locator('[data-rotate="1"]').click();
  await expect(page.locator('[data-select-piece="mote"] small')).toHaveText('Needs turning');
  await page.locator('[data-rotate="-1"]').click();
  await page.getByRole('button', { name: /Place selected creature in Mote habitat/ }).first().click();
  await expect(page.locator('.score-box strong')).toContainText('1/5');

  const touchContext = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  try {
    const touchPage = await touchContext.newPage();
    await touchPage.goto('http://127.0.0.1:4173/demo');
    await touchPage.locator('[data-select-piece="mote"]').tap();
    await touchPage.locator('[data-rotate="1"]').tap();
    await expect(touchPage.locator('[data-select-piece="mote"] small')).toHaveText('Needs turning');
    await touchPage.locator('[data-rotate="-1"]').tap();
    await touchPage.getByRole('button', { name: /Place selected creature in Mote habitat/ }).first().tap();
    await expect(touchPage.locator('.score-box strong')).toContainText('1/5');
  } finally {
    await touchContext.close();
  }
});

test('@claim:undo-last-piece undo returns the latest creature to the tray and removes its score', async ({ page }) => {
  await page.goto('/demo');
  await placePiece(page, 'mote');
  await page.getByRole('button', { name: 'Undo last piece' }).click();
  await expect(page.locator('.score-box strong')).toContainText('0/5');
  await expect(page.locator('[data-select-piece="mote"]')).toBeEnabled();
  await expect(page.locator('.score-trail li')).toHaveCount(0);
  await expect(page.locator('.status-row')).toContainText('The last piece returned to the tray. Its changed-neighbor score was removed.');
});

test('@claim:copy-result copy result puts the completed score, result, and Board ID on the clipboard', async ({ page }) => {
  await page.context().grantPermissions(['clipboard-read', 'clipboard-write'], { origin: 'http://127.0.0.1:4173' });
  await page.goto('/demo');
  await solvePerfect(page);
  await page.getByRole('button', { name: 'Copy result' }).click();
  await expect(page.locator('.status-row')).toContainText('Result copied. It contains the score, result, and Board ID.');
  await expect.poll(() => page.evaluate(() => navigator.clipboard.readText())).toContain('5/5 · Radiant');
  await expect.poll(() => page.evaluate(() => navigator.clipboard.readText())).toContain('Board ID 989809312');
});

test('@claim:session-length a round reaches its result only after its fifth placement', async ({ page }) => {
  await page.goto('/demo');
  for (const id of perfectOrder.slice(0, 4)) await placePiece(page, id);
  await expect(page.getByRole('heading', { name: /You changed/ })).toHaveCount(0);
  await placePiece(page, perfectOrder[4]);
  await expect(page.getByRole('heading', { name: 'You changed 5 of 5' })).toBeVisible();
  await expect(page.locator('.score-trail li')).toHaveCount(5);
});

test('@claim:persistence-recovery rejected progress writes are visible and do not pretend to survive reload', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => {
    localStorage.clear();
    Object.defineProperty(Storage.prototype, 'setItem', {
      configurable: true,
      value: () => { throw new DOMException('Storage full', 'QuotaExceededError'); },
    });
  });
  await placePiece(page, 'mote');
  await expect(page.locator('.score-trail li')).toHaveCount(1);
  await expect(page.locator('.status-row')).toContainText('Progress could not be saved. This run will not survive reload. Keep this tab open to finish the board.');
  await page.reload();
  await expect(page.locator('.score-box strong')).toContainText('0/5');
  await expect(page.locator('[data-select-piece="mote"]')).toBeEnabled();
});

test('@claim:same-origin the demo loads no third-party runtime resources', async ({ page }) => {
  const origins = new Set<string>();
  page.on('request', (request) => origins.add(new URL(request.url()).origin));
  await page.goto('/demo');
  await placePiece(page, 'mote');
  expect([...origins]).toEqual(['http://127.0.0.1:4173']);
});

test('@claim:no-analytics the complete demo flow sends no analytics request or event payload', async ({ page }) => {
  const requests: Array<{ url: string; body: string | null }> = [];
  page.on('request', (request) => requests.push({ url: request.url(), body: request.postData() }));
  await page.goto('/demo');
  await solvePerfect(page);
  await page.getByRole('button', { name: 'Play this board again' }).click();
  expect(requests.filter(({ url, body }) => /analytics|collect|telemetry|track|\/event/i.test(url) || /analytics|telemetry|eventName/i.test(body ?? ''))).toEqual([]);
});

test('@claim:no-leaderboard the complete game shows no leaderboard controls or results', async ({ page }) => {
  await page.goto('/demo');
  await solvePerfect(page);
  await expect(page.locator('a, button').filter({ hasText: /leaderboard|rankings|global score/i })).toHaveCount(0);
  await expect(page.locator('.result-panel')).not.toContainText(/rank|global|player/i);
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

test('game controls keep their visible labels in their accessible names', async ({ page }) => {
  await page.goto('/demo');
  for (const phase of ['starting tray', 'placed creature']) {
    if (phase === 'placed creature') await placePiece(page, 'mote');
    const results = await new AxeBuilder({ page }).withRules('label-content-name-mismatch').analyze();
    expect(results.violations).toEqual([]);
  }
});

test('pages have one h1, clear metadata, no console errors, and no serious axe findings', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (message) => {
    const expectedMissingDocument = message.location().url.endsWith('/missing-page')
      && /server responded with a status of 404/i.test(message.text());
    if (message.type() === 'error' && !expectedMissingDocument) errors.push(message.text());
  });
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

test('the production static host gives unknown routes an actual 404 response', async ({ request }) => {
  const response = await request.get('/missing-page');
  expect(response.status()).toBe(404);
  expect(await response.text()).toContain('This page does not exist');
});

test('an active service worker preserves the host 404 for unknown routes', async ({ page }) => {
  await page.goto('/demo');
  await expect.poll(() => page.evaluate(() => Boolean(navigator.serviceWorker.controller))).toBe(true);
  await page.reload();
  const response = await page.goto('/missing-page');
  expect(response?.status()).toBe(404);
  await expect(page.getByRole('heading', { name: 'This page does not exist' })).toBeVisible();
});

test('the first desktop and mobile screens keep all plain facts visible with the board in view', async ({ page }) => {
  for (const viewport of [{ width: 1440, height: 900 }, { width: 390, height: 844 }]) {
    await page.setViewportSize(viewport);
    for (const path of ['/', '/demo']) {
      await page.goto(path);
      const facts = await page.locator('.plain-facts li').all();
      expect(facts).toHaveLength(3);
      for (const fact of facts) {
        const box = await fact.boundingBox();
        expect(box?.y).toBeGreaterThanOrEqual(0);
        expect((box?.y ?? viewport.height) + (box?.height ?? 0)).toBeLessThanOrEqual(viewport.height);
      }
      if (path === '/') {
        await expect(page.getByText('Opens a complete sample board.', { exact: true })).toBeVisible();
        const note = await page.getByText('Opens a complete sample board.', { exact: true }).boundingBox();
        expect((note?.y ?? viewport.height) + (note?.height ?? 0)).toBeLessThanOrEqual(viewport.height);
      }
      const board = await page.locator('.board').boundingBox();
      expect(board?.y).toBeLessThan(viewport.height);
    }
  }
});

test('the mobile layout keeps controls and 200% text within 390 pixels', async ({ page }) => {
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
  await page.locator('.skip-link').focus();
  const skip = await page.locator('.skip-link').boundingBox();
  expect(skip?.height).toBeGreaterThanOrEqual(44);
  for (const path of ['/', '/demo', '/privacy', '/terms']) {
    await page.goto(path);
    await page.addStyleTag({ content: 'html { font-size: 200% !important; }' });
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(0);
  }
});

test('responsive play keeps board targets large and game controls reachable', async ({ page }) => {
  for (const width of [320, 881, 900, 1024, 1100, 1279, 1280]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/demo');
    const layout = await page.evaluate(() => {
      const viewport = document.documentElement.clientWidth;
      const controls = [...document.querySelectorAll<HTMLElement>('.game-tools button')].map((control) => {
        const box = control.getBoundingClientRect();
        return { left: box.left, right: box.right };
      });
      const cells = [...document.querySelectorAll<HTMLElement>('.board-cell')].map((cell) => {
        const box = cell.getBoundingClientRect();
        return { width: box.width, height: box.height };
      });
      return {
        overflow: document.documentElement.scrollWidth - viewport,
        viewport,
        controls,
        cells,
      };
    });
    expect(layout.overflow).toBeLessThanOrEqual(0);
    expect(layout.cells).toHaveLength(36);
    for (const cell of layout.cells) {
      expect(cell.width).toBeGreaterThanOrEqual(44);
      expect(cell.height).toBeGreaterThanOrEqual(44);
    }
    for (const control of layout.controls) {
      expect(control.left).toBeGreaterThanOrEqual(0);
      expect(control.right).toBeLessThanOrEqual(layout.viewport);
    }
  }
});

test('demo actions show a contrasting visible keyboard focus indicator', async ({ page }) => {
  await page.goto('/demo');
  for (const selector of ['[data-demo-reset]', '.demo-banner a']) {
    const indicator = await page.locator(selector).evaluate((control) => {
      (control as HTMLElement).focus();
      const style = getComputedStyle(control);
      const banner = control.closest<HTMLElement>('.demo-banner')!;
      return {
        focused: control.matches(':focus-visible'),
        outlineColor: style.outlineColor,
        outlineStyle: style.outlineStyle,
        outlineWidth: style.outlineWidth,
        backgroundColor: getComputedStyle(banner).backgroundColor,
      };
    });
    expect(indicator.focused).toBe(true);
    expect(indicator.outlineStyle).toBe('solid');
    expect(Number.parseFloat(indicator.outlineWidth)).toBeGreaterThanOrEqual(2);
    expect(contrastRatio(indicator.outlineColor, indicator.backgroundColor)).toBeGreaterThanOrEqual(3);
  }
});

test('the opening desktop viewport contains a playable board', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');
  const board = await page.locator('.board').boundingBox();
  expect(board?.y).toBeLessThan(900);
  expect((board?.y ?? 900) + (board?.height ?? 0)).toBeLessThanOrEqual(900);
});
