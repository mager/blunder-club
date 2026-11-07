import { DEFAULT_POSITION, type Chess } from 'chess.js';

export type OpeningIndex = { names: string[]; positions: Record<string, number> };
export async function loadOpeningIndex(): Promise<OpeningIndex> {
  return (await import('./data/opening-index.json')).default;
}

function positionKey(fen: string): string {
  return fen.split(' ').slice(0, 4).join(' ');
}

/** The latest named position in this history, not a guess at missing moves. */
export function identifyOpening(game: Chess, index: OpeningIndex): string {
  const history = game.history({ verbose: true });
  const positions = [game.fen(), ...history.slice().reverse().map(move => move.before)];
  for (const fen of positions) {
    const id = index.positions[positionKey(fen)];
    if (id !== undefined) return index.names[id];
  }
  return !history.length && positionKey(game.fen()) === positionKey(DEFAULT_POSITION)
    ? 'Play the first move'
    : 'Not identified';
}
