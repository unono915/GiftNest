import "server-only";

import { cert, getApps, initializeApp, type App } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";

const isEmulator = Boolean(process.env.FIRESTORE_EMULATOR_HOST);

/**
 * Vercel has no Application Default Credentials metadata server (unlike
 * Cloud Functions/Cloud Run), so production also authenticates via an
 * explicit service account. This is a deliberate deviation from PRD 10.4's
 * "prefer runtime default credentials" guidance, which assumes a
 * Firebase/GCP-native runtime; see README for the documented tradeoff.
 */
function buildCredential() {
  const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, "\n");

  if (projectId && clientEmail && privateKey) {
    return { credential: cert({ projectId, clientEmail, privateKey }), projectId };
  }

  // Firestore/Storage/Auth emulators trust *_EMULATOR_HOST env vars alone —
  // no real credential needed, and createCustomToken() falls back to
  // signing unsigned tokens the Auth emulator accepts directly.
  if (isEmulator && projectId) {
    return { credential: undefined, projectId };
  }

  throw new Error(
    "Firebase Admin credentials are missing. Set FIREBASE_ADMIN_PROJECT_ID, FIREBASE_ADMIN_CLIENT_EMAIL, and FIREBASE_ADMIN_PRIVATE_KEY (or run against the emulator with FIRESTORE_EMULATOR_HOST set)."
  );
}

function getAdminApp(): App {
  const existing = getApps();
  if (existing.length > 0) return existing[0];

  const { credential, projectId } = buildCredential();
  return initializeApp({
    ...(credential ? { credential } : {}),
    projectId,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  });
}

export function getAdminAuth() {
  return getAuth(getAdminApp());
}

export function getAdminDb() {
  return getFirestore(getAdminApp());
}

export function getAdminStorage() {
  return getStorage(getAdminApp());
}
