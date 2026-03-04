import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc, getDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);

// ─── Server Clock Sync ───────────────────────────────────────────
// Estimates the offset between this device's clock and the Firestore
// server clock. Used to keep reaction-game green-light timing fair
// across devices with different local clocks.
let _serverOffset = 0;
let _offsetReady = false;

export async function initServerTimeOffset(): Promise<void> {
  try {
    const tempId = `_sync_${Math.random().toString(36).slice(2, 10)}`;
    const tempRef = doc(db, '_timeSync', tempId);
    const beforeMs = Date.now();
    await setDoc(tempRef, { t: serverTimestamp() });
    const snap = await getDoc(tempRef);
    const afterMs = Date.now();
    const serverMs: number = (snap.data()?.t as { toMillis(): number })?.toMillis?.() ?? afterMs;
    // Server timestamp was set approximately at the midpoint of the round-trip
    _serverOffset = serverMs - Math.round((beforeMs + afterMs) / 2);
    _offsetReady = true;
    // Clean up the temp doc (fire and forget)
    deleteDoc(tempRef).catch(() => { });
  } catch (e) {
    console.warn('[serverSync] Failed to estimate offset, using 0:', e);
    _serverOffset = 0;
    _offsetReady = true;
  }
}

/** Returns the current time aligned to the Firestore server clock. */
export function serverNow(): number {
  return Date.now() + _serverOffset;
}

/** Whether the offset has been estimated at least once. */
export function isServerTimeReady(): boolean {
  return _offsetReady;
}