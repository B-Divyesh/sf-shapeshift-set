export type PieceId = 'mote' | 'nook' | 'wing' | 'crown' | 'crook';
export type Coord = readonly [number, number];

export interface PieceDefinition {
  id: PieceId;
  name: string;
  cells: Coord[];
  color: string;
  mutates: PieceId | null;
}

export interface DailyPiece extends PieceDefinition {
  habitat: Coord[];
  targetSignature: string;
  rotation: number;
  flipped: boolean;
  placed: boolean;
  mutation: boolean | null;
}

export interface PlacedMove {
  id: PieceId;
  mutation: boolean;
}

export interface GameState {
  date: string;
  seed: number;
  pieces: DailyPiece[];
  selected: PieceId | null;
  moves: PlacedMove[];
  score: number;
  undos: number;
  cursor: Coord;
  finished: boolean;
}

export const BOARD_SIZE = 6;

export const PIECES: PieceDefinition[] = [
  { id: 'mote', name: 'Mote', cells: [[0, 0], [1, 0], [0, 1]], color: '#f2c45f', mutates: null },
  { id: 'nook', name: 'Nook', cells: [[0, 0], [1, 0], [0, 1], [1, 1]], color: '#ff7a6e', mutates: 'mote' },
  { id: 'wing', name: 'Wing', cells: [[0, 0], [1, 0], [2, 0], [0, 1]], color: '#7fc6c8', mutates: 'nook' },
  { id: 'crown', name: 'Crown', cells: [[1, 0], [0, 1], [1, 1], [2, 1], [1, 2]], color: '#b9d66b', mutates: 'wing' },
  { id: 'crook', name: 'Crook', cells: [[0, 0], [1, 0], [1, 1], [2, 1]], color: '#cf9ce8', mutates: 'crown' },
];

const BASE_HABITATS: Record<PieceId, Coord[]> = {
  mote: [[0, 0], [1, 0], [0, 1]],
  nook: [[1, 1], [2, 1], [1, 2], [2, 2]],
  wing: [[3, 0], [4, 0], [5, 0], [3, 1]],
  crown: [[3, 2], [2, 3], [3, 3], [4, 3], [3, 4]],
  crook: [[0, 3], [1, 3], [1, 4], [2, 4]],
};

export const SAMPLE_DATE = '2026-08-14';

const DAY_MS = 86_400_000;

/**
 * Select a different dependency chain for each UTC day.  The board still has
 * the same five authored pieces, but their arrows are reassigned in a daily,
 * deterministic order.  Moving through all 120 permutations before cycling
 * guarantees adjacent UTC dates cannot teach the same answer.
 */
export function dailyOrder(date: string): PieceId[] {
  const day = Math.floor(Date.parse(`${date}T00:00:00Z`) / DAY_MS);
  let rank = ((day * 37) % 120 + 120) % 120;
  const available = PIECES.map((piece) => piece.id);
  const order: PieceId[] = [];
  for (let size = available.length; size > 0; size -= 1) {
    let factorial = 1;
    for (let value = 2; value < size; value += 1) factorial *= value;
    const index = Math.floor(rank / factorial);
    rank %= factorial;
    order.push(available.splice(index, 1)[0]);
  }
  return order;
}

export function hashDate(date: string): number {
  let value = 2166136261;
  for (const char of date) {
    value ^= char.charCodeAt(0);
    value = Math.imul(value, 16777619);
  }
  return value >>> 0;
}

export function utcDate(now = new Date()): string {
  return now.toISOString().slice(0, 10);
}

export function normalize(cells: Coord[]): Coord[] {
  const minX = Math.min(...cells.map(([x]) => x));
  const minY = Math.min(...cells.map(([, y]) => y));
  return cells
    .map(([x, y]) => [x - minX, y - minY] as Coord)
    .sort(([ax, ay], [bx, by]) => ay - by || ax - bx);
}

export function signature(cells: Coord[]): string {
  return normalize(cells).map(([x, y]) => `${x},${y}`).join('|');
}

export function orientCells(cells: Coord[], rotation: number, flipped: boolean): Coord[] {
  let result = cells.map(([x, y]) => [flipped ? -x : x, y] as Coord);
  for (let turn = 0; turn < ((rotation % 4) + 4) % 4; turn += 1) {
    result = result.map(([x, y]) => [-y, x] as Coord);
  }
  return normalize(result);
}

function transformBoard(cells: Coord[], rotation: number, flipped: boolean): Coord[] {
  return cells.map(([startX, startY]) => {
    let x = flipped ? BOARD_SIZE - 1 - startX : startX;
    let y = startY;
    for (let turn = 0; turn < rotation; turn += 1) {
      [x, y] = [BOARD_SIZE - 1 - y, x];
    }
    return [x, y] as Coord;
  });
}

export function createGame(date: string): GameState {
  const seed = hashDate(date);
  const boardRotation = seed % 4;
  const boardFlipped = ((seed >>> 3) & 1) === 1;
  const order = dailyOrder(date);
  const pieces = PIECES.map((piece, index): DailyPiece => {
    const habitat = transformBoard(BASE_HABITATS[piece.id], boardRotation, boardFlipped);
    return {
      ...piece,
      mutates: order.indexOf(piece.id) === 0 ? null : order[order.indexOf(piece.id) - 1],
      cells: [...piece.cells],
      habitat,
      targetSignature: signature(habitat),
      rotation: (seed >>> (index * 3 + 1)) % 4,
      flipped: ((seed >>> (index * 3 + 2)) & 1) === 1,
      placed: false,
      mutation: null,
    };
  });
  return {
    date,
    seed,
    pieces,
    selected: null,
    moves: [],
    score: 0,
    undos: 0,
    cursor: [0, 0],
    finished: false,
  };
}

export function isOriented(piece: DailyPiece): boolean {
  return signature(orientCells(piece.cells, piece.rotation, piece.flipped)) === piece.targetSignature;
}

export function rotatePiece(state: GameState, amount: number): GameState {
  if (!state.selected) return state;
  return {
    ...state,
    pieces: state.pieces.map((piece) => piece.id === state.selected && !piece.placed
      ? { ...piece, rotation: (piece.rotation + amount + 4) % 4 }
      : piece),
  };
}

export function flipPiece(state: GameState): GameState {
  if (!state.selected) return state;
  return {
    ...state,
    pieces: state.pieces.map((piece) => piece.id === state.selected && !piece.placed
      ? { ...piece, flipped: !piece.flipped }
      : piece),
  };
}

export type PlaceResult = { state: GameState; error?: 'select' | 'occupied' | 'wrong-habitat' | 'orientation' };

export function placeSelected(state: GameState, habitatId: PieceId): PlaceResult {
  if (!state.selected) return { state, error: 'select' };
  const piece = state.pieces.find((item) => item.id === state.selected)!;
  const habitat = state.pieces.find((item) => item.id === habitatId)!;
  if (habitat.placed) return { state, error: 'occupied' };
  if (piece.id !== habitatId) return { state, error: 'wrong-habitat' };
  if (!isOriented(piece)) return { state, error: 'orientation' };

  const mutation = piece.mutates === null
    || state.pieces.some((item) => item.id === piece.mutates && item.placed);
  const pieces = state.pieces.map((item) => item.id === piece.id
    ? { ...item, placed: true, mutation }
    : item);
  const moves = [...state.moves, { id: piece.id, mutation }];
  return {
    state: {
      ...state,
      pieces,
      selected: null,
      moves,
      score: state.score + (mutation ? 1 : 0),
      finished: moves.length === PIECES.length,
    },
  };
}

export function undoMove(state: GameState): GameState {
  const last = state.moves.at(-1);
  if (!last) return state;
  return {
    ...state,
    pieces: state.pieces.map((piece) => piece.id === last.id
      ? { ...piece, placed: false, mutation: null }
      : piece),
    moves: state.moves.slice(0, -1),
    score: state.score - (last.mutation ? 1 : 0),
    undos: state.undos + 1,
    finished: false,
    selected: last.id,
  };
}

export function scoreTier(score: number): 'Quiet' | 'Shifting' | 'Radiant' {
  if (score === 5) return 'Radiant';
  if (score >= 3) return 'Shifting';
  return 'Quiet';
}

export function cellHabitat(state: GameState, x: number, y: number): DailyPiece | undefined {
  return state.pieces.find((piece) => piece.habitat.some(([cx, cy]) => cx === x && cy === y));
}

export function hydrateGame(saved: unknown, date: string): GameState {
  const fresh = createGame(date);
  if (!saved || typeof saved !== 'object') return fresh;
  const value = saved as Partial<GameState>;
  if (value.date !== date || !Array.isArray(value.moves)) return fresh;
  let state = fresh;
  for (const move of value.moves) {
    if (!move || typeof move !== 'object' || !('id' in move)) return fresh;
    const id = (move as PlacedMove).id;
    const piece = state.pieces.find((item) => item.id === id);
    if (!piece || piece.placed) return fresh;
    piece.rotation = [0, 1, 2, 3].find((rotation) =>
      signature(orientCells(piece.cells, rotation, piece.flipped)) === piece.targetSignature) ?? piece.rotation;
    if (!isOriented(piece)) {
      piece.flipped = !piece.flipped;
      piece.rotation = [0, 1, 2, 3].find((rotation) =>
        signature(orientCells(piece.cells, rotation, piece.flipped)) === piece.targetSignature) ?? piece.rotation;
    }
    state = placeSelected({ ...state, selected: id }, id).state;
  }
  if (Array.isArray(value.pieces)) {
    state.pieces = state.pieces.map((piece) => {
      const savedPiece = value.pieces!.find((item) => item && typeof item === 'object' && 'id' in item && item.id === piece.id) as Partial<DailyPiece> | undefined;
      return savedPiece && Number.isInteger(savedPiece.rotation) && typeof savedPiece.flipped === 'boolean'
        ? { ...piece, rotation: Number(savedPiece.rotation) % 4, flipped: savedPiece.flipped }
        : piece;
    });
  }
  state.undos = typeof value.undos === 'number' ? value.undos : 0;
  const selected = value.selected && state.pieces.some((piece) => piece.id === value.selected && !piece.placed)
    ? value.selected
    : null;
  state.selected = selected;
  if (Array.isArray(value.cursor) && value.cursor.length === 2
      && value.cursor.every((part) => Number.isInteger(part) && part >= 0 && part < BOARD_SIZE)) {
    state.cursor = [value.cursor[0], value.cursor[1]];
  }
  return state;
}
