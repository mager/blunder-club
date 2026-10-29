import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, onAuthStateChanged, signInWithPopup, signOut, type User } from 'firebase/auth';
import { getFirestore, doc, runTransaction, serverTimestamp } from 'firebase/firestore';
import { emptyProgress, mergeProgress, normalizeProgress, type Progress } from './progress';
export type SaveStatus = 'guest' | 'loading' | 'saving' | 'saved' | 'offline' | 'conflict';
const config = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};
export const cloudConfigured = import.meta.env.VITE_FIREBASE_AUTH_ENABLED === 'true' && Object.values(config).every(Boolean);
const GUEST = 'blunder-club-v1';
export function createProgressSync(callbacks: { apply: (data: Progress) => void; account: (user: User | null) => void; status: (status: SaveStatus) => void; error: (message: string) => void }) {
  const app = cloudConfigured ? initializeApp(config) : null;
  const auth = app ? getAuth(app) : null;
  const db = app ? getFirestore(app) : null;
  let user: User | null = null; let ready = false; let revision = 0; let generation = 0;
  let latest: Progress | null = null; let timer: ReturnType<typeof setTimeout> | undefined;
  let writing: Promise<void> = Promise.resolve(); let unsubscribe = () => {};
  const key = () => user ? `blunder-school-user-${user.uid}` : GUEST;
  const read = (storageKey: string): Progress | null => { try { const raw = localStorage.getItem(storageKey); return raw ? normalizeProgress(JSON.parse(raw)) : null; } catch { return null; } };
  const cache = (data: Progress) => { try { localStorage.setItem(key(),JSON.stringify(data)); } catch { callbacks.error('Browser storage is full or unavailable. Keep this tab open until your progress is saved.'); } };
  async function flush() {
    clearTimeout(timer);
    writing = writing.then(async () => {
      if (!ready || !user || !db || !latest) return;
      const data = latest; latest = null;
      const uid = user.uid; const epoch = generation;
      callbacks.status('saving');
      try {
        const next = await runTransaction(db,async tx => {
          const ref = doc(db,'users',uid,'progress','current');
          const snap = await tx.get(ref);
          const remoteRevision = snap.exists() ? snap.data().revision : 0;
          if (remoteRevision !== revision) throw new Error('progress-conflict');
          tx.set(ref,{schemaVersion:1,revision:revision+1,payload:JSON.stringify(data),updatedAt:serverTimestamp()});
          return revision+1;
        });
        if (epoch !== generation) return;
        revision = next; callbacks.status(latest ? 'saving' : 'saved');
      } catch (error) {
        if (epoch !== generation) return;
        latest ??= data;
        const conflict = error instanceof Error && error.message === 'progress-conflict';
        if (conflict) ready = false;
        callbacks.status(conflict ? 'conflict' : 'offline');
        if (conflict) callbacks.error('Progress changed on another device. This device keeps a local copy. Sign out and sign in again to combine your lessons.');
      }
    });
    await writing;
  }
  async function load(next: User | null) {
    const epoch = ++generation; clearTimeout(timer); latest = null; ready = false; user = next;
    callbacks.account(next); callbacks.status('loading');
    if (!next || !db) {
      callbacks.apply(read(GUEST) ?? emptyProgress()); ready = true; callbacks.status('guest'); return;
    }
    try {
      const guest = read(GUEST); const cached = read(key());
      const result = await runTransaction(db,async tx => {
        const ref = doc(db,'users',next.uid,'progress','current');
        const snap = await tx.get(ref);
        const remote = snap.exists() ? normalizeProgress(JSON.parse(snap.data().payload)) : emptyProgress();
        let merged = cached ? mergeProgress(remote,cached) : remote;
        if (guest) merged = mergeProgress(merged,guest);
        const rev = (snap.exists() ? snap.data().revision : 0) + 1;
        tx.set(ref,{schemaVersion:1,revision:rev,payload:JSON.stringify(merged),updatedAt:serverTimestamp()});
        return {data:merged,revision:rev};
      });
      if (epoch !== generation) return;
      revision = result.revision; cache(result.data);
      // Consume guest progress only after the account import has committed.
      try { localStorage.removeItem(GUEST); } catch { /* The account copy is safe. */ }
      callbacks.apply(result.data); ready = true; callbacks.status('saved');
    } catch {
      if (epoch !== generation) return;
      callbacks.apply(read(key()) ?? emptyProgress()); callbacks.status('offline');
      callbacks.error('Account progress could not load. Your device copy is available. Check your connection, then retry cloud sync.');
    }
  }
  const online = () => { if (!ready && user) void load(user); else void flush(); };
  return {
    start() { window.addEventListener('online',online); if (auth) unsubscribe = onAuthStateChanged(auth,next => void load(next)); else void load(null); },
    save(data: Progress) { cache(data); if (ready && user) { latest = data; callbacks.status('saving'); clearTimeout(timer); timer = setTimeout(() => void flush(),700); } },
    async login() { if (!auth) return; const provider = new GoogleAuthProvider(); provider.setCustomParameters({prompt:'select_account'}); await signInWithPopup(auth,provider); },
    async logout() { await flush(); if (auth) await signOut(auth); },
    retry() { if (!ready && user) void load(user); else void flush(); },
    dispose() { generation++; clearTimeout(timer); unsubscribe(); window.removeEventListener('online',online); },
  };
}
