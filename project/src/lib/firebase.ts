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
const isRtdbTimeSyncEnabled = import.meta.env.VITE_ENABLE_RTDB_TIME_SYNC === 'true';

// ─── Server Clock Sync ────────────────────────────────────────────
let _serverOffset = 0;
let _offsetReady = false;
let _offsetInitStarted = false;

export async function initServerTimeOffset(): Promise<void> {
  if (_offsetReady || _offsetInitStarted) return;
  _offsetInitStarted = true;

  if (!isRtdbTimeSyncEnabled) {
    _offsetReady = true;
    return;
  }

  if (!firebaseConfig.databaseURL) {
    console.warn('[SYNC] No RTDB URL configured. Falling back to local clock.');
    _offsetReady = true;
    return;
  }

  try {
    const offsetRef = ref(rtdb, '.info/serverTimeOffset');
    onValue(
      offsetRef,
      (snap) => {
        const offset = snap.val();
        if (typeof offset === 'number') {
          _serverOffset = offset;
        }
        _offsetReady = true;
      },
      (error) => {
        console.warn('[SYNC] Failed to read server time offset. Falling back to local clock.', error);
        _offsetReady = true;
      }
    );
  } catch (error) {
    console.warn('[SYNC] Server time sync init failed. Falling back to local clock.', error);
    _offsetReady = true;
  }
}

/** Returns local time adjusted by the Firebase server offset. */
export function serverNow(): number {
  return Date.now() + _serverOffset;
}

export function isServerTimeReady(): boolean {
  return _offsetReady;
}
