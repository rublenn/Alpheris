"use client";

import { initializeApp, getApps, getApp } from "firebase/app";
import {
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  Firestore,
} from "firebase/firestore";
import { getAuth, signInAnonymously, onAuthStateChanged, Auth } from "firebase/auth";

// Firebase web config is designed to be public — it identifies the project,
// it does not grant access. Actual access control lives in Firestore security
// rules (require an authenticated request) plus Anonymous Auth.
const firebaseConfig = {
  apiKey: "AIzaSyASYQf_qL7qgoQHFYrqrb80KJDMb1SssWc",
  authDomain: "alpheris-os.firebaseapp.com",
  projectId: "alpheris-os",
  storageBucket: "alpheris-os.firebasestorage.app",
  messagingSenderId: "39874701518",
  appId: "1:39874701518:web:c79d04f9855c1b4fa8889f",
};

let firestoreInstance: Firestore | null = null;
let authInstance: Auth | null = null;

function getFirebaseApp() {
  return getApps().length ? getApp() : initializeApp(firebaseConfig);
}

export function getDb(): Firestore {
  if (firestoreInstance) return firestoreInstance;
  const app = getFirebaseApp();
  firestoreInstance = initializeFirestore(app, {
    localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
  });
  return firestoreInstance;
}

export function getFirebaseAuth(): Auth {
  if (authInstance) return authInstance;
  authInstance = getAuth(getFirebaseApp());
  return authInstance;
}

/** Resolves once an anonymous session is signed in (creating one if needed). */
export function ensureAnonymousAuth(): Promise<string> {
  const auth = getFirebaseAuth();
  return new Promise((resolve, reject) => {
    const unsubscribe = onAuthStateChanged(
      auth,
      (user) => {
        if (user) {
          unsubscribe();
          resolve(user.uid);
        } else {
          signInAnonymously(auth).catch((err) => {
            unsubscribe();
            reject(err);
          });
        }
      },
      (err) => {
        unsubscribe();
        reject(err);
      }
    );
  });
}
