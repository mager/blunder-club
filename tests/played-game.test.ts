import 'fake-indexeddb/auto';
import { DEFAULT_POSITION } from 'chess.js';
import { afterEach, expect, it } from 'vitest';
import { editImportedGame, replayGame } from '../src/imported-games';
import { GameLibrary, LibraryConflict, LibraryStore, type LibraryRemote } from '../src/library-store';
import { playedGameDraft, savePlayedGame } from '../src/played-game';

const stores: LibraryStore[] = [];
async function libraryFor(uid: string | null = null, remote: LibraryRemote | null = null) {
  const store = new LibraryStore(`played-game-test-${crypto.randomUUID()}`);
  stores.push(store);
  const library = new GameLibrary(store, remote, () => {});
  await library.selectAccount(uid);
  return { library, store };
}
afterEach(async () => { await Promise.all(stores.splice(0).map(store => store.close())); });

const unfinished = () => playedGameDraft(DEFAULT_POSITION, ['e4', 'e5'], 'casual');

it('captures a complete legal game and its actual result', () => {
  const game = playedGameDraft(DEFAULT_POSITION, ['f3', 'e5', 'g4', 'Qh4#'], 'club');
  expect(game).toEqual({ fen: DEFAULT_POSITION, moves: ['f2f3', 'e7e5', 'g2g4', 'd8h4'],
    white: 'You', black: 'Nextmove (Club)', result: '0-1', date: '?' });
  expect(replayGame(game).isCheckmate()).toBe(true);
});

it('keeps the custom starting side, move number, and promotion', () => {
  const fen = '8/8/8/8/8/5k2/4p3/7K b - - 0 31';
  const game = playedGameDraft(fen, ['e1=Q+'], 'challenge');
  expect(game).toMatchObject({ fen, moves: ['e2e1q'], result: '*', black: 'Nextmove (Challenge)' });
  expect(replayGame(game).get('e1')).toEqual({ type: 'q', color: 'b' });
});

it('uses Nextmove’s draw result for the fifty-move rule', () => {
  const game = playedGameDraft('7k/8/8/8/8/8/6R1/7K w - - 99 50', ['Ra2'], 'casual');
  expect(game.result).toBe('1/2-1/2');
});

it('rejects empty and illegal histories', () => {
  expect(() => playedGameDraft(DEFAULT_POSITION, [], 'casual')).toThrow('at least one move');
  expect(() => playedGameDraft(DEFAULT_POSITION, ['e4', 'e6', 'e6'], 'casual')).toThrow('Move 3');
});

it('saves a replayable unfinished game and keeps existing edits on repeat saves', async () => {
  const { library } = await libraryFor();
  const first = await savePlayedGame(library, unfinished(), true, () => true);
  expect(first).toMatchObject({ result: '*', side: 'w', favorite: true, deleted: false });
  const editing = library.save(editImportedGame(first, { title: 'Evening game', side: 'b' }));
  const second = await savePlayedGame(library, unfinished(), false, () => true);
  expect(second).toEqual(await editing);
  expect(library.state.entries).toHaveLength(1);
});

it('keeps a prior choice to take a game out of favorites', async () => {
  const { library } = await libraryFor();
  const first = await savePlayedGame(library, unfinished(), true, () => true);
  const edit = await library.save(editImportedGame(first, { favorite: false }));
  expect(await savePlayedGame(library, unfinished(), true, () => true)).toEqual(edit);
});

it('keeps one record when two tabs save the same snapshot together', async () => {
  const { library, store } = await libraryFor();
  const other = new GameLibrary(store, null, () => {});
  await other.selectAccount(null);
  const [first, second] = await Promise.all([
    savePlayedGame(library, unfinished(), true, () => true),
    savePlayedGame(other, unfinished(), false, () => true),
  ]);
  expect(first).toEqual(second);
  expect((await store.list('guest')).map(entry => entry.game)).toEqual([first]);
});

it('refuses to save a removed copy again', async () => {
  const { library } = await libraryFor();
  const first = await savePlayedGame(library, unfinished(), false, () => true);
  await library.save(editImportedGame(first, { deleted: true }));
  await expect(savePlayedGame(library, unfinished(), true, () => true)).rejects.toThrow('Restore game');
  expect(library.state.entries[0].game.deleted).toBe(true);
});

it('refuses a repeat save while a library conflict remains unresolved', async () => {
  const remote: LibraryRemote = {
    list: async () => [],
    write: async (_uid, game) => { throw new LibraryConflict({ ...game, revision: 1 }); },
  };
  const { library } = await libraryFor('alice', remote);
  await savePlayedGame(library, unfinished(), false, () => true);
  await library.sync();
  await expect(savePlayedGame(library, unfinished(), false, () => true)).rejects.toThrow('conflict');
});

it('discards a request if the active account switches during game preparation', async () => {
  const { library, store } = await libraryFor('alice');
  let active = true;
  const save = savePlayedGame(library, unfinished(), true, () => active);
  active = false;
  const rejection = expect(save).rejects.toThrow('account changed');
  await library.selectAccount('bob');
  await rejection;
  expect(await store.list('account:bob')).toEqual([]);
  expect(await store.list('account:alice')).toEqual([]);
});
