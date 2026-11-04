import 'fake-indexeddb/auto';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createImportedGame, editImportedGame, parseGamePgn, type ImportedGame } from '../src/imported-games';
import { GameLibrary, LibraryConflict, LibraryStore, type LibraryRemote } from '../src/library-store';

const stores: LibraryStore[] = [];
function store() { const value = new LibraryStore(`test-${crypto.randomUUID()}`); stores.push(value); return value; }
afterEach(async () => { await Promise.all(stores.splice(0).map(s => s.close())); });
const game = (name = 'One') => createImportedGame(parseGamePgn(`[Black "${name}"]\n\n1. e4 e5 *`), 'w');
class Remote implements LibraryRemote {
  rows = new Map<string, ImportedGame>(); failId = '';
  async list(uid: string) { return [...this.rows].filter(([key]) => key.startsWith(uid + '/')).map(([, v]) => v); }
  async write(uid: string, data: ImportedGame, expected: number, transfer = false) {
    if (data.id === this.failId) throw new Error('Offline');
    const key = uid + '/' + data.id; const old = this.rows.get(key);
    if (transfer && old) return old;
    if ((old?.revision || 0) !== expected) throw new LibraryConflict(old!);
    const next = { ...data, revision: expected + 1 }; this.rows.set(key, next); return next;
  }
}
describe('private library storage and sync', () => {
  it('keeps guests and accounts separate and survives a new store instance', async () => {
    const name = `reload-${crypto.randomUUID()}`; const s = new LibraryStore(name); stores.push(s);
    const g = await game(); await s.put('guest', { game: g, baseRevision: 0, pending: false });
    expect(await s.list('account:alice')).toEqual([]);
    await s.close(); const next = new LibraryStore(name); stores.push(next);
    expect((await next.list('guest'))[0].game).toEqual(g);
  });
  it('deduplicates, retains favorites, and requires explicit restore after removal', async () => {
    const library = new GameLibrary(store(), null, () => {}); await library.selectAccount(null);
    const g = await game(); await library.save(g); await library.save(editImportedGame(g, { favorite: true }));
    expect(library.state.entries).toHaveLength(1);
    await library.save(editImportedGame(g, { deleted: true }));
    await expect(library.save(g)).rejects.toThrow('Restore');
    await library.save(g, true); expect(library.state.entries[0].game.deleted).toBe(false);
  });
  it('consumes only guest transfers that committed and retries without duplicates', async () => {
    const s = store(); const remote = new Remote(); const a = await game('A'); const b = await game('B');
    for (const g of [a, b]) await s.put('guest', { game: g, baseRevision: 0, pending: false });
    remote.failId = b.id; const library = new GameLibrary(s, remote, () => {}); await library.selectAccount('alice');
    expect((await s.list('guest')).map(e => e.game.id)).toEqual([b.id]);
    expect(library.state.error).toBe('Offline'); remote.failId = ''; await library.sync();
    expect(await s.list('guest')).toEqual([]); expect(remote.rows.size).toBe(2);
    await library.sync(); expect(remote.rows.size).toBe(2);
  });
  it('retains a pending local edit on conflicts and never restores a remote deletion', async () => {
    const s = store(); const remote = new Remote(); const library = new GameLibrary(s, remote, () => {});
    const g = await game(); await library.selectAccount('alice'); await library.save(g); await library.sync();
    await library.save(editImportedGame(library.state.entries[0].game, { title: 'Local' }));
    remote.rows.set('alice/' + g.id, { ...g, deleted: true, revision: 2 }); await library.sync();
    expect(library.state.entries[0].game.title).toBe('Local');
    expect(library.state.entries[0].conflict?.deleted).toBe(true);
    await library.resolve(g.id, true); expect(library.state.entries[0].game.deleted).toBe(true);
  });
  it('discards late account loads after sign out', async () => {
    const g = await game(); let release!: (games: ImportedGame[]) => void;
    const remote: LibraryRemote = { list: () => new Promise(resolve => { release = resolve; }), write: async (_, value) => value };
    const library = new GameLibrary(store(), remote, () => {});
    const loading = library.selectAccount('alice');
    while (!release) await new Promise(resolve => setTimeout(resolve, 1));
    await library.selectAccount(null); release([g]); await loading;
    expect(library.state.entries).toEqual([]);
    expect(library.state.status).toBe('Saved on this device');
  });
  it('rejects invalid records without replacing valid data', async () => {
    const s = store(); const g = await game(); await s.put('guest', { game: g, baseRevision: 0, pending: false });
    await expect(s.put('guest', { game: { ...g, moves: ['e2e5'] }, baseRevision: 0, pending: false })).rejects.toThrow('not valid');
    expect((await s.list('guest'))[0].game.moves).toEqual(g.moves);
  });
  it('enforces the active-game limit without evicting records', async () => {
    const s = store(); const base = await game();
    for (let i = 0; i < 100; i++) await s.put('guest', { game: { ...base, id: i.toString(16).padStart(64, '0') }, baseRevision: 0, pending: false });
    await expect(s.put('guest', { game: { ...base, id: 'f'.repeat(64) }, baseRevision: 0, pending: false })).rejects.toThrow('100 games');
    expect(await s.list('guest')).toHaveLength(100);
  });
  it('ignores corrupt cache rows while retaining valid games', async () => {
    const s = store(); const g = await game(); await s.put('guest', { game: g, baseRevision: 0, pending: false });
    const db = await (s as any).open() as IDBDatabase;
    await new Promise<void>(resolve => { const tx = db.transaction('records', 'readwrite'); tx.objectStore('records').put({ key: 'guest:bad', scope: 'guest', game: { moves: ['bad'] } }); tx.oncomplete = () => resolve(); });
    expect((await s.list('guest')).map(e => e.game.id)).toEqual([g.id]);
  });
  it('does not announce a save after storage fails', async () => {
    const s = store(); const library = new GameLibrary(s, null, () => {}); await library.selectAccount(null);
    vi.spyOn(s, 'put').mockRejectedValueOnce(new DOMException('Device storage is full', 'QuotaExceededError'));
    await expect(library.save(await game())).rejects.toThrow('storage is full');
    expect(library.state.entries).toEqual([]);
  });
});
