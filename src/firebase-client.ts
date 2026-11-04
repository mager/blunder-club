import { initializeApp } from 'firebase/app';
import { connectAuthEmulator, getAuth } from 'firebase/auth';
import { connectFirestoreEmulator, getFirestore } from 'firebase/firestore';

const config = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY, authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID, appId: import.meta.env.VITE_FIREBASE_APP_ID,
};
export const cloudConfigured = import.meta.env.VITE_FIREBASE_AUTH_ENABLED === 'true' && Object.values(config).every(Boolean);
let connected = false;
export function cloudServices() {
  if (!cloudConfigured) return null;
  const app = initializeApp(config); const auth = getAuth(app); const db = getFirestore(app);
  // Test-only development origin. Production builds cannot connect to local emulators.
  if (import.meta.env.DEV && import.meta.env.VITE_FIREBASE_EMULATORS === 'true' && !connected) {
    connectAuthEmulator(auth, 'http://127.0.0.1:9098', { disableWarnings: true });
    connectFirestoreEmulator(db, '127.0.0.1', 8088); connected = true;
  }
  return { auth, db };
}
