import { readFileSync } from 'node:fs';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { assertFails, assertSucceeds, initializeTestEnvironment, type RulesTestEnvironment } from '@firebase/rules-unit-testing';
import { doc, getDoc, getDocs, collection, setDoc, updateDoc, deleteDoc, serverTimestamp, writeBatch } from 'firebase/firestore';
import { createImportedGame, editImportedGame, parseGamePgn } from '../src/imported-games';
import { CloudLibrary } from '../src/library-cloud';
import { LibraryConflict } from '../src/library-store';
import { emptyProgress } from '../src/progress';

const enabled = !!process.env.FIRESTORE_EMULATOR_HOST;
describe.skipIf(!enabled)('game-library Firestore boundaries', () => {
  let env: RulesTestEnvironment;
  beforeAll(async () => { env = await initializeTestEnvironment({ projectId: 'demo-nextmove', firestore: { rules: readFileSync('firestore.rules', 'utf8') } }); }, 30000);
  beforeEach(async () => { await env.clearFirestore(); });
  afterAll(async () => { await env.cleanup(); });
  const db = (user?: string) => user ? env.authenticatedContext(user).firestore() : env.unauthenticatedContext().firestore();
  const game = async () => ({ ...await createImportedGame(parseGamePgn('1. d4 d5 2. c4 *'), 'w'), favorite: true });

  it('keeps progress and game records owner-only, rejects stale and malformed writes', async () => {
    const alice = db('alice'); const cloud = new CloudLibrary(alice as any); const g = await cloud.write('alice', await game(), 0);
    const path = ['users', 'alice', 'games', g.id];
    await assertSucceeds(getDoc(doc(alice, ...path as [string, ...string[]])));
    await assertFails(getDoc(doc(db('bob'), ...path as [string, ...string[]])));
    await assertFails(getDoc(doc(db(), ...path as [string, ...string[]])));
    await assertFails(updateDoc(doc(alice, ...path as [string, ...string[]]), { revision: 1 }));
    await assertFails(updateDoc(doc(alice, ...path as [string, ...string[]]), { revision: 2, payload: 'x'.repeat(40961), updatedAt: serverTimestamp() }));
    await assertFails(deleteDoc(doc(alice, ...path as [string, ...string[]])));
    await assertSucceeds(setDoc(doc(alice, 'users/alice/progress/current'), { schemaVersion: 1, revision: 1, payload: JSON.stringify(emptyProgress()), updatedAt: serverTimestamp() }));
    await assertFails(getDoc(doc(db(), 'users/alice/progress/current')));
    expect((await cloud.list('alice'))[0]).toEqual(g);
  });
  it('publishes a projection, denies listing and other writers, then removes public access', async () => {
    const alice = db('alice'); const cloud = new CloudLibrary(alice as any);
    const g = await cloud.write('alice', await game(), 0);
    const state = await cloud.publish('alice', 'Player', [g], 0); const id = state.settings!.publicId;
    const snapshot = await assertSucceeds(getDoc(doc(db(), 'profiles', id)));
    expect(Object.keys(snapshot.data()!).sort()).toEqual(['games','name','revision','version']);
    await assertFails(getDocs(collection(db(), 'profiles')));
    await assertFails(getDoc(doc(db(), 'profileOwners', id)));
    await assertFails(getDoc(doc(db('bob'), 'profileOwners', id)));
    await assertFails(updateDoc(doc(db('bob'), 'profiles', id), { name: 'Hijack' }));
    await assertFails(deleteDoc(doc(db('bob'), 'profiles', id)));
    await assertFails(updateDoc(doc(alice, 'profileOwners', id), { uid: 'bob' }));
    await assertFails(updateDoc(doc(alice, 'profiles', id), { email: 'private@example.invalid' }));
    await cloud.unpublish('alice', 1);
    expect((await getDoc(doc(db(), 'profiles', id))).exists()).toBe(false);
    await expect(cloud.publish('alice', 'Stale', [g], 1)).rejects.toThrow('changed');
    expect((await cloud.list('alice'))[0].deleted).toBe(false);
  });

  it('publishes canonical details at the length limit for anonymous readers', async () => {
    const cloud = new CloudLibrary(db('alice') as any);
    const g = await cloud.write('alice', await game(), 0);
    const details = { bio: '♞'.repeat(159) + '🎉', avatar: 'q' as const, spotlight: g.publicId, stories: { [g.publicId]: 'My first game' } };
    const state = await cloud.publish('alice', 'Player', [g], 0, details);
    const profile = await new CloudLibrary(db() as any).readPublic(state.settings!.publicId);
    expect(profile?.details).toEqual(details);
  });

  it('validates all eight story slots in a coordinated owner write', async () => {
    const alice = db('alice'); const cloud = new CloudLibrary(alice as any);
    const games = [];
    for (const file of 'abcdefgh') {
      const favorite = { ...await createImportedGame(parseGamePgn(`1. ${file}4 *`), 'w'), favorite: true };
      games.push(await cloud.write('alice', favorite, 0));
    }
    const featured = games.map(game => game.publicId);
    const stories = Object.fromEntries(featured.map((id, index) => [id, `Game ${index}`]));
    const details = { bio: '', avatar: 'n' as const, spotlight: null, stories };
    const state = await cloud.publish('alice', 'Player', games, 0, details);
    const profile = doc(alice, 'profiles', state.settings!.publicId);
    const settings = doc(alice, 'users/alice/profile/settings');
    expect((await getDoc(profile)).data()?.details.stories).toEqual(stories);
    const write = (lastStory: unknown) => {
      const batch = writeBatch(alice as any);
      batch.set(settings, { ...state.settings, revision: 2 });
      batch.set(profile, { ...state.profile, revision: 2, details: { ...details, stories: { ...stories, [featured[7]]: lastStory } } });
      return batch.commit();
    };
    await assertFails(write(7));
    await assertSucceeds(write('Updated game 7'));
    expect((await getDoc(profile)).data()?.details.stories).toEqual({ ...stories, [featured[7]]: 'Updated game 7' });
  });

  it('rejects invalid details in coordinated writes and leaves the last snapshot in place', async () => {
    const alice = db('alice'); const cloud = new CloudLibrary(alice as any);
    const g = await cloud.write('alice', await game(), 0);
    const state = await cloud.publish('alice', 'Player', [g], 0);
    const id = state.settings!.publicId;
    const details = { bio: 'I play for fun', avatar: 'r', spotlight: g.publicId, stories: { [g.publicId]: 'My first game' } };
    const unselected = g.publicId === 'a'.repeat(32) ? 'b'.repeat(32) : 'a'.repeat(32);
    const invalid = [
      { ...details, bio: 'x'.repeat(161) }, { ...details, bio: '\u00a0Untrimmed' }, { ...details, bio: 'No\u007fcontrols' },
      { ...details, avatar: 'p' }, { ...details, spotlight: unselected }, { ...details, email: 'private@example.invalid' },
      { ...details, stories: { [unselected]: 'Private story' } }, { ...details, stories: { [g.publicId]: '🎉'.repeat(161) } },
      { ...details, stories: { [g.publicId]: 'No\u0085controls' } }, { ...details, stories: { [g.publicId]: 'Untrimmed ' } },
      { ...details, stories: { [g.publicId]: 42 } }, { ...details, stories: [] },
    ];
    for (const details of invalid) {
      const batch = writeBatch(alice as any);
      batch.set(doc(alice, 'users/alice/profile/settings'), { ...state.settings, revision: 2 });
      batch.set(doc(alice, 'profiles', id), { ...state.profile, revision: 2, details });
      await assertFails(batch.commit());
    }
    const bob = db('bob');
    const attack = writeBatch(bob as any);
    attack.set(doc(bob, 'users/bob/profile/settings'), { ...state.settings, revision: 1 });
    attack.set(doc(bob, 'profiles', id), { ...state.profile, revision: 2, details });
    await assertFails(attack.commit());
    expect((await getDoc(doc(db(), 'profiles', id))).data()).toEqual(state.profile);
  });

  it.each(['deleting', 'unfavoriting'])('prunes only the removed game story and spotlight when %s', async mode => {
    const alice = db('alice'); const cloud = new CloudLibrary(alice as any);
    const g = await cloud.write('alice', await game(), 0);
    const retained = await cloud.write('alice', { ...await createImportedGame(parseGamePgn('1. e4 e5 *'), 'w'), favorite: true }, 0);
    const details = { bio: 'I play for fun', avatar: 'r' as const, spotlight: g.publicId, stories: { [g.publicId]: 'Removed', [retained.publicId]: 'Kept' } };
    const state = await cloud.publish('alice', 'Player', [g, retained], 0, details);
    const id = state.settings!.publicId;
    const batch = writeBatch(alice as any);
    const edit = { deleted: mode === 'deleting', favorite: false };
    batch.update(doc(alice, 'users', 'alice', 'games', g.id), { ...edit, revision: 2, updatedAt: serverTimestamp() });
    batch.set(doc(alice, 'users/alice/profile/settings'), { ...state.settings, revision: 2, featured: [retained.publicId] });
    batch.set(doc(alice, 'profiles', id), { ...state.profile, revision: 2, games: [state.profile!.games[1]], details });
    await assertFails(batch.commit());
    expect((await cloud.list('alice')).find(game => game.id === g.id)).toEqual(g);
    await cloud.write('alice', editImportedGame(g, edit), 1);
    const profile = await new CloudLibrary(db() as any).readPublic(id);
    expect(profile?.games.map(game => game.id)).toEqual([retained.publicId]);
    expect(profile?.details).toEqual({ bio: 'I play for fun', avatar: 'r', spotlight: null, stories: { [retained.publicId]: 'Kept' } });
    expect(profile?.revision).toBe(2);
  });

  it('removes featured games atomically and stops stale writes from restoring them', async () => {
    const alice = db('alice'); const cloud = new CloudLibrary(alice as any); const g = await cloud.write('alice', await game(), 0);
    const first = await cloud.publish('alice', 'Player', [g], 0); const id = first.settings!.publicId;
    await assertFails(updateDoc(doc(alice, 'users', 'alice', 'games', g.id), { favorite: false, revision: 2, updatedAt: serverTimestamp() }));
    const removed = await cloud.write('alice', editImportedGame(g, { deleted: true, favorite: false }), 1);
    expect((await cloud.readPublic(id))?.games).toHaveLength(0);
    await expect(cloud.write('alice', g, 1)).rejects.toBeInstanceOf(LibraryConflict);
    await expect(cloud.publish('alice', 'Player', [g], 2)).rejects.toThrow('changed');
    expect(await cloud.write('alice', g, 0, true)).toEqual(removed);
  });
  it('rejects malformed public fields even in a coordinated owner transaction', async () => {
    const alice = db('alice'); const cloud = new CloudLibrary(alice as any); const g = await cloud.write('alice', await game(), 0);
    const state = await cloud.publish('alice', 'Player', [g], 0); const id = state.settings!.publicId;
    for (const change of [{ name: 'x'.repeat(41) }, { games: [{ ...state.profile!.games[0], moves: 'bad' }] }, { games: [{ ...state.profile!.games[0], uid: 'alice' }] }, { games: Array(9).fill(state.profile!.games[0]) }]) {
      const batch = writeBatch(alice as any);
      batch.set(doc(alice, 'users/alice/profile/settings'), { ...state.settings, revision: 2 });
      batch.set(doc(alice, 'profiles', id), { ...state.profile, revision: 2, ...change });
      await assertFails(batch.commit());
    }
  });
});
