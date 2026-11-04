import { collection, doc, getDocFromServer, getDocsFromServer, runTransaction, serverTimestamp, type Firestore, type DocumentData } from 'firebase/firestore';
import { gameIdentity, normalizeImportedGame, publicId, validPublicId, type ImportedGame } from './imported-games';
import { LibraryConflict, type LibraryRemote } from './library-store';
import { normalizePublicProfile, projectProfile, type ProfileOwnerState, type ProfileSettings, type PublicProfile } from './profile';

async function decode(data: DocumentData): Promise<ImportedGame> {
  let game: ImportedGame | null = null;
  try { game = normalizeImportedGame(JSON.parse(data.payload)); } catch { /* Invalid records are isolated by the caller. */ }
  if (!game || game.revision !== data.revision || game.deleted !== data.deleted || game.favorite !== data.favorite || game.publicId !== data.publicId || await gameIdentity(game) !== game.id) throw new Error('A cloud game is damaged. Your device copy is kept.');
  return game;
}
function settings(value: DocumentData | undefined): ProfileSettings | null {
  if (!value) return null;
  if (!validPublicId(value.publicId) || !Number.isSafeInteger(value.revision) || value.revision < 1 || !Array.isArray(value.featured)
    || value.featured.length > 8 || !value.featured.every((id: unknown) => typeof id === 'string' && validPublicId(id)) || typeof value.published !== 'boolean') throw new Error('Profile settings could not load. Try again.');
  return { publicId: value.publicId, revision: value.revision, featured: value.featured, published: value.published };
}

export class CloudLibrary implements LibraryRemote {
  constructor(private db: Firestore) {}
  async list(uid: string) {
    const docs = await getDocsFromServer(collection(this.db, 'users', uid, 'games'));
    const records = await Promise.all(docs.docs.map(async snap => {
      try { const game = await decode(snap.data()); return game.id === snap.id ? game : null; } catch { return null; }
    }));
    return records.filter((g): g is ImportedGame => !!g);
  }
  async write(uid: string, game: ImportedGame, expected: number, transfer = false): Promise<ImportedGame> {
    return runTransaction(this.db, async tx => {
      const ref = doc(this.db, 'users', uid, 'games', game.id);
      const stateRef = doc(this.db, 'users', uid, 'profile', 'settings');
      const snap = await tx.get(ref); const prior = snap.exists() ? await decode(snap.data()) : null;
      if (transfer && prior) return prior;
      if ((prior?.revision || 0) !== expected) {
        if (prior) throw new LibraryConflict(prior);
        throw new Error('The remote game is missing. Reload your account games before retrying.');
      }
      const stateSnap = await tx.get(stateRef); const state = settings(stateSnap.data());
      const removePublic = state?.featured.includes(game.publicId) && (game.deleted || !game.favorite);
      const profileRef = state ? doc(this.db, 'profiles', state.publicId) : null;
      const profileSnap = removePublic && profileRef ? await tx.get(profileRef) : null;
      const next = normalizeImportedGame({ ...game, revision: expected + 1, publicId: prior?.publicId || game.publicId });
      if (!next || await gameIdentity(next) !== next.id) throw new Error('This game is not valid. Nothing was uploaded.');
      if (removePublic && state && profileRef) {
        const revision = state.revision + 1;
        tx.set(stateRef, { ...state, revision, featured: state.featured.filter(id => id !== game.publicId) });
        if (profileSnap?.exists()) {
          const profile = normalizePublicProfile(profileSnap.data());
          if (!profile) throw new Error('The public profile could not load. Public removal is pending.');
          tx.set(profileRef, { ...profile, revision, games: profile.games.filter(g => g.id !== game.publicId) });
        }
      }
      tx.set(ref, { schemaVersion: 1, revision: next.revision, payload: JSON.stringify(next), publicId: next.publicId,
        favorite: next.favorite, deleted: next.deleted, updatedAt: serverTimestamp() });
      return next;
    });
  }
  async readPublic(id: string): Promise<PublicProfile | null> {
    if (!validPublicId(id)) throw new Error('That profile link is not valid.');
    const snap = await getDocFromServer(doc(this.db, 'profiles', id));
    if (!snap.exists()) return null;
    const profile = normalizePublicProfile(snap.data());
    if (!profile) throw new Error('This public profile contains an invalid game and cannot be opened.');
    return profile;
  }
  async ownerState(uid: string): Promise<ProfileOwnerState> {
    const snap = await getDocFromServer(doc(this.db, 'users', uid, 'profile', 'settings'));
    const state = settings(snap.data());
    return { settings: state, profile: state?.published ? await this.readPublic(state.publicId) : null };
  }
  async publish(uid: string, name: string, games: ImportedGame[], expected: number): Promise<ProfileOwnerState> {
    const candidate = publicId();
    return runTransaction(this.db, async tx => {
      const stateRef = doc(this.db, 'users', uid, 'profile', 'settings');
      const stateSnap = await tx.get(stateRef); const prior = settings(stateSnap.data());
      if ((prior?.revision || 0) !== expected) throw new Error('The public profile changed. Reload its preview before publishing.');
      // Publish only cloud-committed favorites; stale local data cannot resurrect a removed game.
      const committed: ImportedGame[] = [];
      for (const game of games) {
        const snap = await tx.get(doc(this.db, 'users', uid, 'games', game.id));
        if (!snap.exists()) throw new Error('Save your games to the account before publishing.');
        const remote = await decode(snap.data());
        if (remote.revision !== game.revision || !remote.favorite || remote.deleted) throw new Error('A selected game changed. Sync games and reload the preview.');
        committed.push(remote);
      }
      const profile = projectProfile(name, committed, expected + 1);
      const state: ProfileSettings = { publicId: prior?.publicId || candidate, revision: expected + 1, published: true, featured: profile.games.map(g => g.id) };
      if (!prior) tx.set(doc(this.db, 'profileOwners', state.publicId), { uid });
      tx.set(stateRef, state); tx.set(doc(this.db, 'profiles', state.publicId), profile);
      return { settings: state, profile };
    });
  }
  async unpublish(uid: string, expected: number): Promise<ProfileOwnerState> {
    return runTransaction(this.db, async tx => {
      const stateRef = doc(this.db, 'users', uid, 'profile', 'settings');
      const snap = await tx.get(stateRef); const prior = settings(snap.data());
      if (!prior || prior.revision !== expected) throw new Error('The profile changed. Reload it before removing public access.');
      const next = { ...prior, revision: prior.revision + 1, published: false, featured: [] };
      tx.set(stateRef, next); tx.delete(doc(this.db, 'profiles', prior.publicId));
      return { settings: next, profile: null };
    });
  }
}
