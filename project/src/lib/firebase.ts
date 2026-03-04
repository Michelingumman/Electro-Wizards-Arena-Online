import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getDatabase, ref, onValue } from 'firebase/database';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export const rtdb = getDatabase(app);

// ─── Server Clock Sync (RTDB V2 WITH DEEP LOGGING) ──────────────
let _serverOffset = 0;
let _offsetReady = false;

export async function initServerTimeOffset(): Promise<void> {
  if (_offsetReady) return;

  console.log('[SYNC] initServerTimeOffset initializing. RTDB URL:', firebaseConfig.databaseURL);
  const offsetRef = ref(rtdb, '.info/serverTimeOffset');
  onValue(offsetRef, (snap) => {
    const offset = snap.val();
    if (typeof offset === 'number') {
      _serverOffset = offset;
      _offsetReady = true;
      console.log(`[SYNC] offset updated -> ${offset}ms. Current local time: ${Date.now()}. Adjusted server time: ${serverNow()}`);
    } else {
      console.warn('[SYNC] offset is not a number:', offset);
    }
  });
}

/** Returns local time adjusted by the Firebase server offset. */
export function serverNow(): number {
  return Date.now() + _serverOffset;
}

export function isServerTimeReady(): boolean {
  return _offsetReady;
}