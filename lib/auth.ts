"use client";

import { auth, isFirebaseReady } from "./firebase";
import {
  signInWithEmailAndPassword,
  signOut as fbSignOut,
  onAuthStateChanged,
} from "firebase/auth";

/** Passcode de secours pour le mode démo (sans Firebase). À changer. */
export const DEMO_PASSCODE = "fd7admin";
const DEMO_KEY = "fd7_admin_ok";

export async function signIn(emailOrPass: string, password: string): Promise<void> {
  if (isFirebaseReady && auth) {
    await signInWithEmailAndPassword(auth, emailOrPass, password);
    return;
  }
  // mode démo : on compare le mot de passe au passcode
  if (password === DEMO_PASSCODE || emailOrPass === DEMO_PASSCODE) {
    localStorage.setItem(DEMO_KEY, "1");
    return;
  }
  throw new Error("Code incorrect");
}

export async function signOut(): Promise<void> {
  if (isFirebaseReady && auth) {
    await fbSignOut(auth);
    return;
  }
  localStorage.removeItem(DEMO_KEY);
}

/** S'abonne à l'état de connexion. Retourne une fonction de désabonnement. */
export function watchAuth(cb: (loggedIn: boolean) => void): () => void {
  if (isFirebaseReady && auth) {
    return onAuthStateChanged(auth, (u) => cb(Boolean(u)));
  }
  cb(typeof window !== "undefined" && localStorage.getItem(DEMO_KEY) === "1");
  return () => {};
}
