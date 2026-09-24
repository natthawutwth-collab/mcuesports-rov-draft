import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getFirestore,
  doc,
  getDocFromServer,
  Firestore,
} from 'firebase/firestore';
import { getAuth, signInAnonymously, onAuthStateChanged, User, Auth } from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';

// Initialize Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

export const db: Firestore = getFirestore(
  app,
  firebaseConfig.firestoreDatabaseId || '(default)'
);

export const auth: Auth = getAuth(app);

let currentUser: User | null = null;
let authInitialized = false;
const authListeners = new Set<(user: User | null) => void>();

// Subscribe to auth state
onAuthStateChanged(auth, (user) => {
  currentUser = user;
  authInitialized = true;
  authListeners.forEach((listener) => listener(user));
});

/**
 * Ensure the user is authenticated (using anonymous auth if not signed in)
 * This allows saving data seamlessly across devices and sessions without mandatory passwords,
 * while still associating data with a persistent Cloud UID.
 */
export async function ensureAuth(): Promise<User> {
  if (currentUser) return currentUser;

  return new Promise((resolve, reject) => {
    if (auth.currentUser) {
      currentUser = auth.currentUser;
      return resolve(auth.currentUser);
    }

    signInAnonymously(auth)
      .then((cred) => {
        currentUser = cred.user;
        resolve(cred.user);
      })
      .catch((err) => {
        console.warn('Anonymous auth failed or offline mode:', err);
        reject(err);
      });
  });
}

export function subscribeAuth(listener: (user: User | null) => void): () => void {
  authListeners.add(listener);
  if (authInitialized) {
    listener(currentUser);
  }
  return () => {
    authListeners.delete(listener);
  };
}

export function getCurrentUser(): User | null {
  return currentUser || auth.currentUser;
}

/**
 * Validate Connection to Firestore (Skill Requirement)
 */
export async function testConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, '_connection_test', 'ping'));
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firebase client is currently offline or unreachable.');
    }
    // Return true or false gracefully without crashing the UI
    return false;
  }
}
