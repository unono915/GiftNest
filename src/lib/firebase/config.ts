export const firebaseWebConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

/**
 * MVP runs a single fixed family space (PRD 7.1), so the id is not a secret —
 * Firestore/Storage Security Rules are what actually gate access, not
 * knowledge of this string. It is echoed to the client so the browser can
 * build `families/{familyId}/...` subscription paths directly.
 */
export const FAMILY_ID = process.env.NEXT_PUBLIC_FAMILY_ID || process.env.FAMILY_ID || "family-main";
