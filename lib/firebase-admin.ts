import { getApps, initializeApp, cert, type App } from "firebase-admin/app";
import { getFirestore, type Firestore } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";

/* Accès serveur privilégié (contourne les règles Firestore).
   Nécessite un compte de service dans FIREBASE_SERVICE_ACCOUNT (JSON). */

let app: App | null = null;

export function adminApp(): App | null {
  if (app) return app;
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!raw) return null;
  try {
    const creds = JSON.parse(raw);
    app = getApps().length ? getApps()[0] : initializeApp({ credential: cert(creds) });
    return app;
  } catch {
    return null;
  }
}

export function adminDb(): Firestore | null {
  const a = adminApp();
  return a ? getFirestore(a) : null;
}

/** Vérifie le jeton de connexion admin envoyé par le navigateur. */
export async function isAdminRequest(req: Request): Promise<boolean> {
  const a = adminApp();
  const header = req.headers.get("authorization") ?? "";
  if (!a || !header.startsWith("Bearer ")) return false;
  try {
    await getAuth(a).verifyIdToken(header.slice(7));
    return true;
  } catch {
    return false;
  }
}
