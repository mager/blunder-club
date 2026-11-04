import { MAX_GAMES, normalizeImportedGame, type ImportedGame } from './imported-games';

export type LibraryEntry = { game: ImportedGame; baseRevision: number; pending: boolean; conflict?: ImportedGame };
type StoredEntry = LibraryEntry & { key: string; scope: string };
export const libraryScope = (uid: string | null) => uid ? `account:${uid}` : 'guest';

export class LibraryStore {
  private opening?: Promise<IDBDatabase>;
  constructor(private name = 'nextmove-library-v1') {}
  private open(): Promise<IDBDatabase> {
    return this.opening ??= new Promise((resolve, reject) => {
      const request = indexedDB.open(this.name, 1);
      request.onupgradeneeded = () => {
        const records = request.result.createObjectStore('records', { keyPath: 'key' });
        records.createIndex('scope', 'scope');
      };
      request.onsuccess = () => { request.result.onversionchange = () => request.result.close(); resolve(request.result); };
      request.onerror = () => { this.opening = undefined; reject(new Error('Device storage is unavailable. Keep the pasted game and try again.')); };
      request.onblocked = () => reject(new Error('Close other Nextmove tabs, then try saving again.'));
    });
  }
  async list(scope: string): Promise<LibraryEntry[]> {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const request = db.transaction('records').objectStore('records').index('scope').getAll(scope);
      request.onsuccess = () => resolve((request.result as StoredEntry[]).flatMap(row => {
        const game = normalizeImportedGame(row.game);
        if (!game || !Number.isSafeInteger(row.baseRevision) || row.baseRevision < 0) return [];
        const conflict = normalizeImportedGame(row.conflict);
        return [{ game, baseRevision: row.baseRevision, pending: row.pending === true, ...(conflict ? { conflict } : {}) }];
      }));
      request.onerror = () => reject(new Error('Your games could not load from this device. Try again.'));
    });
  }
  async put(scope: string, entry: LibraryEntry): Promise<void> {
    const game = normalizeImportedGame(entry.game);
    if (!game) throw new Error('This game record is not valid. Nothing was saved.');
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('records', 'readwrite');
      const store = tx.objectStore('records');
      let reason = 'Device storage is full or unavailable. Keep the pasted game and try again.';
      const all = store.index('scope').getAll(scope);
      all.onsuccess = () => {
        const active = (all.result as StoredEntry[]).filter(row => !row.game?.deleted && row.game?.id !== game.id);
        if (!game.deleted && active.length >= MAX_GAMES) { reason = 'Your library is full (100 games). Remove a game before saving another.'; tx.abort(); return; }
        store.put({ ...entry, game, key: `${scope}:${game.id}`, scope });
      };
      tx.oncomplete = () => resolve();
      tx.onabort = tx.onerror = () => reject(new Error(reason));
    });
  }
  async remove(scope: string, id: string): Promise<void> {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('records', 'readwrite');
      tx.objectStore('records').delete(`${scope}:${id}`);
      tx.oncomplete = () => resolve();
      tx.onabort = tx.onerror = () => reject(new Error('The transferred game remains on this device. Try sync again.'));
    });
  }
  async close() { (await this.open()).close(); this.opening = undefined; }
}

export interface LibraryRemote {
  list(uid: string): Promise<ImportedGame[]>;
  write(uid: string, game: ImportedGame, expected: number, transfer?: boolean): Promise<ImportedGame>;
}
export class LibraryConflict extends Error {
  constructor(public remote: ImportedGame) { super('This game changed on another device. Your local edit is kept. Choose which version to keep.'); }
}
export type LibraryState = { entries: LibraryEntry[]; loading: boolean; status: string; error: string };

/** All work is serialized and tied to an account generation; stale callbacks cannot cross accounts. */
export class GameLibrary {
  private uid: string | null = null;
  private generation = 0;
  private queue: Promise<unknown> = Promise.resolve();
  state: LibraryState = { entries: [], loading: true, status: '', error: '' };
  constructor(private store: LibraryStore, private remote: LibraryRemote | null, private changed: (state: LibraryState) => void) {}
  private emit(change: Partial<LibraryState>) { this.state = { ...this.state, ...change }; this.changed(this.state); }
  private async refresh(epoch: number, scope: string) {
    const entries = await this.store.list(scope);
    if (epoch === this.generation) this.emit({ entries });
  }
  async selectAccount(uid: string | null) {
    this.uid = uid; const epoch = ++this.generation;
    this.emit({ entries: [], loading: true, status: '', error: '' });
    try {
      await this.refresh(epoch, libraryScope(uid));
      if (epoch !== this.generation) return;
      this.emit({ loading: false, status: uid ? 'Checking cloud games…' : 'Saved on this device' });
      if (uid) await this.sync();
    } catch (e) { if (epoch === this.generation) this.emit({ loading: false, error: message(e) }); }
  }
  private run<T>(work: (epoch: number, uid: string | null) => Promise<T>): Promise<T> {
    const epoch = this.generation; const uid = this.uid;
    const result = this.queue.then(() => {
      if (epoch !== this.generation) throw new Error('The account changed. Open the game in the correct account.');
      return work(epoch, uid);
    });
    this.queue = result.catch(() => {});
    return result;
  }
  save(game: ImportedGame, restore = false): Promise<ImportedGame> {
    return this.run(async (epoch, uid) => {
      const scope = libraryScope(uid);
      const entries = await this.store.list(scope);
      const old = entries.find(row => row.game.id === game.id);
      if (old?.game.deleted && !game.deleted && !restore) throw new Error('This game was removed. Choose Restore game to keep it again.');
      if (old?.conflict) throw new Error('Resolve this game’s sync conflict before editing it.');
      const next = { ...game, publicId: old?.game.publicId || game.publicId, revision: old?.game.revision || 0 };
      if (epoch !== this.generation) throw new Error('The account changed. Try again.');
      await this.store.put(scope, { game: next, baseRevision: old?.baseRevision || 0, pending: !!uid });
      await this.refresh(epoch, scope);
      if (epoch === this.generation) this.emit({ error: '', status: uid ? 'Saved here. Cloud save pending.' : 'Saved on this device' });
      return next;
    });
  }
  async resolve(id: string, useLocal: boolean) {
    await this.run(async (epoch, uid) => {
      const scope = libraryScope(uid); const entry = (await this.store.list(scope)).find(row => row.game.id === id);
      if (!entry?.conflict) return;
      const remote = entry.conflict;
      // Deleted games require the separate explicit restore flow, never a stale local overwrite.
      const game = useLocal && !remote.deleted ? { ...entry.game, revision: remote.revision, publicId: remote.publicId } : remote;
      await this.store.put(scope, { game, baseRevision: remote.revision, pending: useLocal && !remote.deleted });
      await this.refresh(epoch, scope);
    });
    await this.sync();
  }
  sync(): Promise<void> {
    return this.run(async (epoch, uid) => {
      if (!uid || !this.remote) return;
      const scope = libraryScope(uid);
      const active = () => epoch === this.generation;
      this.emit({ status: 'Syncing games…', error: '' });
      try {
        const remoteGames = await this.remote.list(uid);
        if (!active()) return;
        const local = await this.store.list(scope);
        for (const remote of remoteGames) {
          if (!active()) return;
          const cached = local.find(row => row.game.id === remote.id);
          if (cached?.pending) {
            if (remote.revision !== cached.baseRevision) await this.store.put(scope, { ...cached, conflict: remote });
          } else await this.store.put(scope, { game: remote, baseRevision: remote.revision, pending: false });
        }
        for (const entry of await this.store.list(scope)) {
          if (!active()) return;
          if (!entry.pending || entry.conflict) continue;
          try {
            const saved = await this.remote.write(uid, entry.game, entry.baseRevision);
            if (!active()) return;
            await this.store.put(scope, { game: saved, baseRevision: saved.revision, pending: false });
          } catch (e) {
            if (e instanceof LibraryConflict) { if (active()) await this.store.put(scope, { ...entry, conflict: e.remote }); }
            else throw e;
          }
        }
        for (const guest of await this.store.list('guest')) {
          if (!active()) return;
          if (guest.game.deleted) continue;
          // A local pending account edit must not be replaced by a guest transfer.
          const cached = (await this.store.list(scope)).find(row => row.game.id === guest.game.id);
          if (cached?.pending || cached?.conflict) continue;
          const saved = await this.remote.write(uid, guest.game, 0, true);
          if (!active()) return;
          await this.store.put(scope, { game: saved, baseRevision: saved.revision, pending: false });
          await this.store.remove('guest', guest.game.id);
        }
        if (active()) {
          await this.refresh(epoch, scope);
          this.emit({ status: this.state.entries.some(e => e.conflict) ? 'Some games need a sync choice.' : 'Games saved to your account' });
        }
      } catch (e) { if (active()) this.emit({ status: 'Cloud save pending. Public removals may still be visible.', error: message(e) }); }
      finally { if (active()) { await this.refresh(epoch, scope); this.emit({ loading: false }); } }
    });
  }
  dispose() { this.generation++; }
}
export const message = (error: unknown) => error instanceof Error ? error.message : 'That action failed. Try again.';
