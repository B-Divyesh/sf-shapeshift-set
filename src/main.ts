import './styles.css';
import {
  BOARD_SIZE,
  PIECES,
  SAMPLE_DATE,
  cellHabitat,
  createGame,
  flipPiece,
  hydrateGame,
  isOriented,
  orientCells,
  placeSelected,
  rotatePiece,
  scoreTier,
  undoMove,
  utcDate,
  type Coord,
  type DailyPiece,
  type GameState,
  type PieceId,
} from './core';

const app = document.querySelector<HTMLDivElement>('#app')!;
const STORAGE_PREFIX = 'shapeshift-set:daily:';
let state: GameState;
let demoMode = false;
let statusMessage = '';
let statusTone: 'plain' | 'good' | 'bad' = 'plain';
const FIXED_STEP_MS = 1000 / 60;
let lastFrame = performance.now();
let frameRemainder = 0;
let simulationTicks = 0;

function runGameLoop(now: number): void {
  const elapsed = Math.min(now - lastFrame, 250);
  lastFrame = now;
  if (!document.hidden) {
    frameRemainder += elapsed;
    let steps = 0;
    while (frameRemainder >= FIXED_STEP_MS && steps < 15) {
      frameRemainder -= FIXED_STEP_MS;
      simulationTicks += 1;
      steps += 1;
    }
    document.documentElement.dataset.gameTicks = String(simulationTicks);
  }
  requestAnimationFrame(runGameLoop);
}

document.documentElement.dataset.frameTarget = '60';
requestAnimationFrame(runGameLoop);
document.addEventListener('visibilitychange', () => {
  lastFrame = performance.now();
  frameRemainder = 0;
});

const pieceById = (id: PieceId) => PIECES.find((piece) => piece.id === id)!;

function loadRealGame(date: string): GameState {
  try {
    const raw = localStorage.getItem(`${STORAGE_PREFIX}${date}`);
    return raw ? hydrateGame(JSON.parse(raw), date) : createGame(date);
  } catch {
    statusMessage = 'Saved progress could not be read. A fresh board is ready.';
    statusTone = 'bad';
    return createGame(date);
  }
}

function saveGame(): void {
  if (demoMode) return;
  try {
    localStorage.setItem(`${STORAGE_PREFIX}${state.date}`, JSON.stringify(state));
  } catch {
    statusMessage = 'Progress could not be saved. Keep this tab open to finish the board.';
    statusTone = 'bad';
  }
}

function dateLabel(date: string): string {
  return new Intl.DateTimeFormat('en', {
    month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC',
  }).format(new Date(`${date}T12:00:00Z`));
}

function shapeSvg(cells: Coord[], label: string): string {
  const width = Math.max(...cells.map(([x]) => x)) + 1;
  const height = Math.max(...cells.map(([, y]) => y)) + 1;
  const blocks = cells.map(([x, y]) =>
    `<rect x="${x * 12 + 1}" y="${y * 12 + 1}" width="10" height="10" rx="2" />`).join('');
  return `<svg class="piece-shape" viewBox="0 0 ${width * 12} ${height * 12}" role="img" aria-label="${label} shape">${blocks}</svg>`;
}

function header(): string {
  return `<a class="skip-link" href="#main">Skip to the puzzle</a>
    <header class="site-header">
      <a class="wordmark" href="/" data-link aria-label="Shapeshift Set home">
        <span class="wordmark-mark" aria-hidden="true"><i></i><i></i><i></i></span>
        <span>Shapeshift Set</span>
      </a>
      <nav aria-label="Main navigation">
        <a href="/" data-link>Play</a>
        <a href="/demo" data-link>Demo</a>
        <a href="/#how">How it works</a>
        <a href="/privacy" data-link>Privacy</a>
      </nav>
    </header>`;
}

function footer(): string {
  return `<footer class="site-footer">
      <p>One shared creature puzzle each day.</p>
      <div class="footer-links">
        <a href="/privacy" data-link>Privacy</a>
        <a href="/terms" data-link>Terms</a>
        <a href="https://sociobot.in" rel="external">Built by Param Factory <span class="sr-only">(external site)</span></a>
      </div>
      <p class="footer-note">Version 1.0 · Original game art. The moon garden image was generated for this product.</p>
    </footer>`;
}

function mutationLines(): string {
  const centers = new Map<PieceId, Coord>();
  state.pieces.forEach((piece) => {
    const total = piece.habitat.reduce(([sx, sy], [x, y]) => [sx + x, sy + y] as Coord, [0, 0] as Coord);
    centers.set(piece.id, [total[0] / piece.habitat.length + 0.5, total[1] / piece.habitat.length + 0.5]);
  });
  const lines = state.pieces.filter((piece) => piece.mutates).map((piece) => {
    const from = centers.get(piece.id)!;
    const to = centers.get(piece.mutates!)!;
    const dx = to[0] - from[0];
    const dy = to[1] - from[1];
    const length = Math.hypot(dx, dy);
    const inset = 0.42;
    const x1 = from[0] + (dx / length) * inset;
    const y1 = from[1] + (dy / length) * inset;
    const x2 = to[0] - (dx / length) * inset;
    const y2 = to[1] - (dy / length) * inset;
    return `<line class="mutation-link link-${piece.id}${piece.mutation ? ' changed' : ''}" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" marker-end="url(#arrow)" />`;
  }).join('');
  const mote = centers.get('mote')!;
  return `<svg class="board-links" viewBox="0 0 6 6" aria-hidden="true">
    <defs><marker id="arrow" markerWidth="4" markerHeight="4" refX="3" refY="2" orient="auto"><path d="M0,0 L4,2 L0,4 Z" /></marker></defs>
    ${lines}<circle class="seed-mark" cx="${mote[0]}" cy="${mote[1]}" r="0.13" />
  </svg>`;
}

function boardCell(x: number, y: number): string {
  const habitat = cellHabitat(state, x, y);
  const label = habitat
    ? `Row ${y + 1}, column ${x + 1}. ${habitat.name} habitat, ${habitat.placed ? 'filled' : 'empty'}.`
    : `Row ${y + 1}, column ${x + 1}. Open ground.`;
  const classes = ['board-cell'];
  if (habitat) classes.push('habitat', `piece-${habitat.id}`);
  if (habitat?.placed) classes.push('placed');
  if (habitat?.mutation === true) classes.push('mutated');
  if (habitat?.mutation === false) classes.push('missed');
  if (state.cursor[0] === x && state.cursor[1] === y) classes.push('cursor');
  const symbol = habitat?.placed
    ? `<span aria-hidden="true">${habitat.mutation ? '✦' : '●'}</span>`
    : '';
  return `<button class="${classes.join(' ')}" data-board-cell data-x="${x}" data-y="${y}" aria-label="${label}" ${habitat?.placed ? 'aria-disabled="true"' : ''}>${symbol}</button>`;
}

function trayPiece(piece: DailyPiece, index: number): string {
  const oriented = orientCells(piece.cells, piece.rotation, piece.flipped);
  const selected = state.selected === piece.id;
  return `<button class="tray-piece piece-${piece.id}${selected ? ' selected' : ''}" data-select-piece="${piece.id}"
      ${piece.placed ? 'disabled' : ''} aria-pressed="${selected}" aria-keyshortcuts="${index + 1}">
      <span class="piece-number" aria-hidden="true">${index + 1}</span>
      ${shapeSvg(oriented, piece.name)}
      <span>${piece.name}</span>
      <small>${piece.placed ? (piece.mutation ? 'Changed' : 'Missed') : (isOriented(piece) ? 'Fits' : 'Turn it')}</small>
    </button>`;
}

function scoreTrail(): string {
  if (state.moves.length === 0) {
    return '<p class="empty-trail">Placed mutations will appear here.</p>';
  }
  return `<ol class="score-trail">${state.moves.map((move) => {
    const piece = pieceById(move.id);
    const target = piece.mutates ? pieceById(piece.mutates).name : 'seed tile';
    return `<li class="${move.mutation ? 'success' : 'miss'}"><strong>${piece.name}</strong><span>${move.mutation ? `Changed ${target}` : `${target} was empty`}</span><b aria-label="${move.mutation ? 'scored' : 'did not score'}">${move.mutation ? '+1' : '0'}</b></li>`;
  }).join('')}</ol>`;
}

function resultPanel(): string {
  if (!state.finished) return '';
  const tier = scoreTier(state.score);
  const resultText = tier === 'Radiant'
    ? 'Every mutation landed. You found the only perfect order.'
    : tier === 'Shifting'
      ? 'Most mutations landed. Trace each arrow back before another run.'
      : 'Some neighbors were still empty. Place each arrow target first.';
  return `<section class="result-panel tier-${tier.toLowerCase()}" aria-labelledby="result-title">
    <p class="result-kicker">${tier} set</p>
    <h3 id="result-title">You changed ${state.score} of 5</h3>
    <p>${resultText}</p>
    <p class="result-detail">${state.undos} ${state.undos === 1 ? 'undo' : 'undos'} · Seed ${state.seed}</p>
    <div class="result-actions">
      <button class="button primary" data-replay>Play this board again</button>
      <button class="button quiet" data-share>Copy result</button>
    </div>
  </section>`;
}

function game(): string {
  const cells = Array.from({ length: BOARD_SIZE * BOARD_SIZE }, (_, index) => boardCell(index % BOARD_SIZE, Math.floor(index / BOARD_SIZE))).join('');
  const selectedPiece = state.selected ? state.pieces.find((piece) => piece.id === state.selected)! : null;
  return `<section class="game-shell" id="game" aria-labelledby="game-title">
    <div class="game-topline">
      <div>
        <p class="section-label">${demoMode ? 'Sample board' : 'Daily board'} · ${dateLabel(state.date)}</p>
        <h2 id="game-title">Match the habitats</h2>
      </div>
      <div class="seed"><span>Seed</span><strong>${state.seed}</strong></div>
    </div>
    <p class="game-rule">Place an arrow’s target first. Then the creature changes that neighbor and scores one.</p>
    <div class="game-layout">
      <div class="board-column">
        <div class="board-wrap">
          ${mutationLines()}
          <div class="board" role="group" aria-label="Six by six creature habitat board">${cells}</div>
        </div>
        <p class="board-key"><span class="seed-dot" aria-hidden="true"></span>The gold point starts the chain. Each arrow points to a neighbor that must be placed first.</p>
      </div>
      <div class="game-tools">
        <div class="score-box" aria-label="Current score"><strong>${state.score}<span>/5</span></strong><p>mutations</p></div>
        <div class="tool-copy">
          <h3>Choose a creature</h3>
          <p>Match its blocks to one dotted habitat.</p>
        </div>
        <div class="piece-tray">${state.pieces.map(trayPiece).join('')}</div>
        <div class="turn-tools" aria-label="Turn the selected creature">
          <button data-rotate="-1" aria-label="Rotate selected creature left" aria-keyshortcuts="Q" ${selectedPiece ? '' : 'disabled'}>↶ <span>Left</span></button>
          <button data-flip aria-label="Flip selected creature" aria-keyshortcuts="F" ${selectedPiece ? '' : 'disabled'}>↔ <span>Flip</span></button>
          <button data-rotate="1" aria-label="Rotate selected creature right" aria-keyshortcuts="E" ${selectedPiece ? '' : 'disabled'}>↷ <span>Right</span></button>
        </div>
        <div class="history-tools">
          <button class="text-button" data-undo ${state.moves.length ? '' : 'disabled'}>Undo last piece</button>
          <button class="text-button" data-reset>${demoMode ? 'Reset demo' : 'Reset board'}</button>
        </div>
      </div>
    </div>
    <div class="status-row ${statusTone}" aria-live="polite" aria-atomic="true">${statusMessage || 'Choose a creature, turn it, then select its habitat.'}</div>
    <div class="trail-wrap"><h3>Mutation score</h3>${scoreTrail()}</div>
    ${resultPanel()}
  </section>`;
}

function demoBanner(): string {
  return demoMode ? `<aside class="demo-banner" aria-label="Demo mode">
    <strong>Demo — sample board, nothing is saved</strong>
    <div><button data-demo-reset>Reset demo</button><a href="/" data-link>Start for real</a></div>
  </aside>` : '';
}

function homePage(): string {
  return `${header()}${demoBanner()}<main id="main" tabindex="-1">
    <section class="opening" aria-labelledby="page-title">
      <div class="opening-copy">
        <p class="section-label">One shared 6×6 board each day</p>
        <h1 id="page-title" tabindex="-1">${demoMode ? 'Place five sample creatures in order' : 'Place five creatures in the right order'}</h1>
        <p class="hero-summary">For daily puzzle players who want one shared spatial challenge that ends after five creatures.</p>
        ${demoMode ? `<p class="action-note">The complete sample board is ready to play.</p>` : `<div class="hero-action"><a class="button primary" href="/demo" data-link>Try it with sample data</a><span>It opens a complete sample board.</span></div>`}
        <ul class="plain-facts">
          <li>Free to play.</li>
          <li>Progress stays in this browser.</li>
          <li>A new shared board appears each UTC day.</li>
        </ul>
      </div>
      ${game()}
    </section>
    <section class="landscape" aria-label="Moon garden illustration">
      <div class="hero-art" aria-hidden="true">
        <picture><source media="(max-width: 700px)" srcset="/assets/moon-garden-720.webp"><img src="/assets/moon-garden-1200.webp" width="1200" height="800" alt="" fetchpriority="high" decoding="async"></picture>
        <div class="art-caption">A moon garden built for five shapes</div>
      </div>
    </section>
    <section class="how" id="how" aria-labelledby="how-title">
      <div class="section-intro"><p class="section-label">Three actions</p><h2 id="how-title">How to play</h2></div>
      <ol class="steps">
        <li><span>1</span><div><h3>Read the arrows</h3><p>An arrow scores only when its target creature is already on the board.</p></div></li>
        <li><span>2</span><div><h3>Turn each creature</h3><p>Rotate or flip its blocks until they match one dotted habitat.</p></div></li>
        <li><span>3</span><div><h3>Place all five</h3><p>Finish the board, inspect each mutation, and compare your score tier.</p></div></li>
      </ol>
    </section>
    <section class="limits" aria-labelledby="limits-title">
      <div><p class="section-label">Scope and privacy</p><h2 id="limits-title">One puzzle, then a clear ending</h2></div>
      <div class="limits-copy"><p>There are no accounts, ads, boosters, or public leaderboards.</p><p>Your daily progress uses local browser storage. Demo actions use memory only.</p><p>The game loads from this site and can reopen offline after the first visit.</p></div>
    </section>
  </main>${footer()}${resetDialog()}`;
}

function textPage(kind: 'privacy' | 'terms' | '404'): string {
  const content = kind === 'privacy'
    ? { title: 'Privacy without an account', label: 'Privacy', body: `<p>Shapeshift Set does not ask for your name, email address, or an account.</p><h2>What stays on your device</h2><p>The game saves daily moves, scores, and undo counts in your browser’s local storage. Demo play stays in memory and is discarded when you leave the demo.</p><h2>What this site receives</h2><p>The host may process standard request logs needed to serve and protect the site. The game sends no analytics events and loads no third-party scripts.</p><h2>Clear your progress</h2><p>Use “Reset board” inside the game, or clear this site’s storage in your browser settings.</p><p>Last updated: September 2, 2026.</p>` }
    : kind === 'terms'
      ? { title: 'Terms for fair daily play', label: 'Terms', body: `<p>Shapeshift Set is a free daily browser game for personal use.</p><h2>Using the game</h2><p>You may play, share your result, and inspect the open source code. Do not disrupt the site or use it to harm other people.</p><h2>Availability</h2><p>The game is provided as available. Daily boards or features may change. Local progress can be lost when browser storage is cleared.</p><h2>Ownership</h2><p>The code uses the MIT License. Original game art remains subject to the notices in the repository.</p><p>Last updated: September 2, 2026.</p>` }
      : { title: 'This page does not exist', label: '404', body: `<p>The address does not match a Shapeshift Set page.</p><a class="button primary" href="/" data-link>Return to today’s puzzle</a>` };
  return `${header()}<main id="main" class="text-page" tabindex="-1"><p class="section-label">${content.label}</p><h1 tabindex="-1">${content.title}</h1><div class="prose">${content.body}</div></main>${footer()}`;
}

function resetDialog(): string {
  return `<dialog class="reset-dialog" aria-labelledby="reset-title">
    <div><p class="section-label">Reset progress</p><h2 id="reset-title">Start this board again?</h2><p>Your current moves and score will be cleared.</p><div class="dialog-actions"><button class="button quiet" data-cancel-reset>Keep my moves</button><button class="button danger" data-confirm-reset>Reset board</button></div></div>
  </dialog>`;
}

function route(): void {
  const path = window.location.pathname.replace(/\/$/, '') || '/';
  demoMode = path === '/demo';
  statusMessage = '';
  statusTone = 'plain';

  if (path === '/' || path === '/demo') {
    const date = demoMode ? SAMPLE_DATE : utcDate();
    state = demoMode ? createGame(date) : loadRealGame(date);
    document.title = demoMode ? 'Demo — Shapeshift Set' : 'Shapeshift Set — place a daily creature puzzle';
    setDescription(demoMode ? 'Try a complete Shapeshift Set sample board without saving progress.' : 'Place five shifting creatures on one shared 6x6 daily board. Finish a spatial puzzle with five placements.');
    setCanonical(demoMode ? '/demo' : '/');
    app.innerHTML = homePage();
  } else if (path === '/privacy') {
    document.title = 'Privacy — Shapeshift Set';
    setDescription('Learn what Shapeshift Set stores in your browser and how the game avoids accounts and third-party tracking.');
    setCanonical('/privacy');
    app.innerHTML = textPage('privacy');
  } else if (path === '/terms') {
    document.title = 'Terms — Shapeshift Set';
    setDescription('Read the terms for playing and sharing Shapeshift Set.');
    setCanonical('/terms');
    app.innerHTML = textPage('terms');
  } else {
    document.title = 'Page not found — Shapeshift Set';
    setDescription('Return to the current Shapeshift Set daily puzzle.');
    setCanonical('/404');
    app.innerHTML = textPage('404');
  }
}

function setCanonical(path: string): void {
  document.querySelector<HTMLLinkElement>('link[rel="canonical"]')!.href = `https://shapeshift-set.sociobot.in${path}`;
}

function setDescription(content: string): void {
  document.querySelector<HTMLMetaElement>('meta[name="description"]')!.content = content;
}

function renderGame(focusSelector?: string): void {
  const shell = document.querySelector<HTMLElement>('.game-shell');
  if (!shell) return;
  const replacement = document.createElement('div');
  replacement.innerHTML = game();
  shell.replaceWith(replacement.firstElementChild!);
  saveGame();
  if (focusSelector) document.querySelector<HTMLElement>(focusSelector)?.focus();
}

function announce(message: string, tone: typeof statusTone = 'plain'): void {
  statusMessage = message;
  statusTone = tone;
}

function selectPiece(id: PieceId): void {
  const piece = state.pieces.find((item) => item.id === id);
  if (!piece || piece.placed) return;
  state = { ...state, selected: id };
  announce(`${piece.name} selected. ${isOriented(piece) ? 'Its shape now fits.' : 'Turn it to match its dotted habitat.'}`);
  renderGame(`[data-select-piece="${id}"]`);
}

function placeAt(x: number, y: number): void {
  const habitat = cellHabitat(state, x, y);
  state = { ...state, cursor: [x, y] };
  if (!habitat) {
    announce('That tile has no habitat. Choose a dotted shape.', 'bad');
    renderGame(`[data-x="${x}"][data-y="${y}"]`);
    return;
  }
  const result = placeSelected(state, habitat.id);
  if (result.error) {
    const messages = {
      select: 'No creature is selected. Choose one from the tray first.',
      occupied: 'That habitat is filled. Choose an empty dotted habitat.',
      'wrong-habitat': 'That creature has a different shape. Choose its matching habitat.',
      orientation: 'The blocks do not match yet. Rotate or flip the creature, then try again.',
    };
    announce(messages[result.error], 'bad');
  } else {
    const move = result.state.moves.at(-1)!;
    const name = pieceById(move.id).name;
    announce(move.mutation ? `${name} changed its neighbor. One mutation scored.` : `${name} was placed, but its target was empty. No mutation scored.`, move.mutation ? 'good' : 'bad');
    state = result.state;
  }
  renderGame(`[data-x="${x}"][data-y="${y}"]`);
}

function resetGame(): void {
  const date = state.date;
  state = createGame(date);
  document.querySelector<HTMLDialogElement>('.reset-dialog')?.close();
  announce(demoMode ? 'The sample board was reset.' : 'Today’s board was reset.');
  renderGame('[data-select-piece="mote"]');
}

function shareResult(): void {
  const marks = state.moves.map((move) => move.mutation ? '✦' : '·').join('');
  const text = `Shapeshift Set ${state.date}\n${marks} ${state.score}/5 · ${scoreTier(state.score)}\nSeed ${state.seed}`;
  navigator.clipboard.writeText(text).then(() => {
    announce('Result copied. It contains the score, tier, and seed.', 'good');
    renderGame('[data-share]');
  }).catch(() => {
    announce('The result could not be copied. Allow clipboard access and try again.', 'bad');
    renderGame('[data-share]');
  });
}

app.addEventListener('click', (event) => {
  const target = event.target as HTMLElement;
  const link = target.closest<HTMLAnchorElement>('a[data-link]');
  if (link && link.origin === window.location.origin) {
    event.preventDefault();
    history.pushState({}, '', link.href);
    route();
    document.querySelector<HTMLElement>('h1')?.focus({ preventScroll: true });
    window.scrollTo({ top: 0, behavior: 'instant' });
    return;
  }
  const select = target.closest<HTMLButtonElement>('[data-select-piece]');
  if (select) return selectPiece(select.dataset.selectPiece as PieceId);
  const cell = target.closest<HTMLButtonElement>('[data-board-cell]');
  if (cell) return placeAt(Number(cell.dataset.x), Number(cell.dataset.y));
  const rotate = target.closest<HTMLButtonElement>('[data-rotate]');
  if (rotate) {
    state = rotatePiece(state, Number(rotate.dataset.rotate));
    const piece = state.pieces.find((item) => item.id === state.selected)!;
    announce(isOriented(piece) ? `${piece.name} now fits its habitat.` : `${piece.name} turned. The blocks do not match yet.`, isOriented(piece) ? 'good' : 'plain');
    return renderGame(`[data-rotate="${rotate.dataset.rotate}"]`);
  }
  if (target.closest('[data-flip]')) {
    state = flipPiece(state);
    const piece = state.pieces.find((item) => item.id === state.selected)!;
    announce(isOriented(piece) ? `${piece.name} now fits its habitat.` : `${piece.name} flipped. The blocks do not match yet.`, isOriented(piece) ? 'good' : 'plain');
    return renderGame('[data-flip]');
  }
  if (target.closest('[data-undo]')) {
    state = undoMove(state);
    announce('The last piece returned to the tray. Its mutation was removed.');
    return renderGame('[data-undo]');
  }
  if (target.closest('[data-reset]')) {
    if (demoMode || state.moves.length === 0) return resetGame();
    document.querySelector<HTMLDialogElement>('.reset-dialog')?.showModal();
    document.querySelector<HTMLButtonElement>('[data-cancel-reset]')?.focus();
    return;
  }
  if (target.closest('[data-demo-reset]')) return resetGame();
  if (target.closest('[data-cancel-reset]')) {
    target.closest<HTMLDialogElement>('dialog')?.close();
    document.querySelector<HTMLButtonElement>('[data-reset]')?.focus();
    return;
  }
  if (target.closest('[data-confirm-reset]') || target.closest('[data-replay]')) return resetGame();
  if (target.closest('[data-share]')) shareResult();
});

document.addEventListener('keydown', (event) => {
  if (!document.querySelector('.game-shell')) return;
  const key = event.key.toLowerCase();
  if (/^[1-5]$/.test(key) && !event.ctrlKey && !event.metaKey && !event.altKey) {
    event.preventDefault();
    selectPiece(PIECES[Number(key) - 1].id);
  } else if (key === 'q' || key === 'e') {
    if (!state.selected) return;
    event.preventDefault();
    state = rotatePiece(state, key === 'q' ? -1 : 1);
    renderGame(key === 'q' ? '[data-rotate="-1"]' : '[data-rotate="1"]');
  } else if (key === 'f') {
    if (!state.selected) return;
    event.preventDefault();
    state = flipPiece(state);
    renderGame('[data-flip]');
  } else if (event.target instanceof HTMLElement && event.target.matches('[data-board-cell]') && ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.key)) {
    event.preventDefault();
    const [x, y] = state.cursor;
    const next: Coord = event.key === 'ArrowUp' ? [x, Math.max(0, y - 1)]
      : event.key === 'ArrowDown' ? [x, Math.min(BOARD_SIZE - 1, y + 1)]
        : event.key === 'ArrowLeft' ? [Math.max(0, x - 1), y]
          : [Math.min(BOARD_SIZE - 1, x + 1), y];
    state = { ...state, cursor: next };
    renderGame(`[data-x="${next[0]}"][data-y="${next[1]}"]`);
  } else if (event.key === 'Escape' && document.querySelector('.reset-dialog')) {
    document.querySelector<HTMLDialogElement>('.reset-dialog')?.close();
    document.querySelector<HTMLButtonElement>('[data-reset]')?.focus();
  }
});

window.addEventListener('popstate', () => {
  route();
  document.querySelector<HTMLElement>('h1')?.focus({ preventScroll: true });
});
window.addEventListener('online', () => {
  announce('You are back online. The current board stayed in place.', 'good');
  renderGame();
});
window.addEventListener('offline', () => {
  announce('You are offline. This loaded board still works.', 'plain');
  renderGame();
});

route();

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js').catch(() => undefined);
}
