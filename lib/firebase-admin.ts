import { getApps, initializeApp, cert, type App } from "firebase-admin/app";
import { getFirestore, type Firestore } from "firebase-admin/firestore";

/* Accès serveur privilégié (contourne les règles) pour valider/annuler
   un RDV depuis un lien e-mail. Nécessite un compte de service.
   -----------------------------------------------------------------
   Console Firebase → Paramètres → Comptes de service → Générer une clé.
   Colle le JSON (sur une seule ligne) dans la variable FIREBASE_SERVICE_ACCOUNT. */

let cached: Firestore | null = null;

export function adminDb(): Firestore | null {
  if (cached) return cached;
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!raw) return null;
  try {
    const creds = JSON.parse(raw);
    const app: App = getApps().length
      ? getApps()[0]
      : initializeApp({ credential: cert(creds) });
    cached = getFirestore(app);
    return cached;
  } catch {
    return null;
  }
}
