import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";

export const firebaseConfig = {
  apiKey: "AIzaSyCDLlqMtCGcKfbchKblBNNLec9Y4AkRXL0",
  authDomain: "student-a866d.firebaseapp.com",
  projectId: "student-a866d",
  storageBucket: "student-a866d.firebasestorage.app",
  messagingSenderId: "742359477068",
  appId: "1:742359477068:web:14f09e105d767ba5a9fde9",
  measurementId: "G-ND55M1H8J4",
};

/**
 * Emails that always have admin access to /admin, regardless of Firestore role.
 * Additional admins can be granted by setting `role: "admin"` on their
 * document in the `users` collection.
 */
export const ADMIN_EMAILS = ["oomg20330@gmail.com"];

export function isOwnerEmail(email: string | null | undefined) {
  if (!email) return false;
  return ADMIN_EMAILS.map((value) => value.toLowerCase()).includes(email.toLowerCase());
}

/** Firebase is browser-only in this app; never touch it during SSR. */
function assertBrowser(feature: string) {
  if (typeof window === "undefined") {
    throw new Error(`Firebase ${feature} is only available in the browser.`);
  }
}

export function getFirebaseApp(): FirebaseApp {
  return getApps().length ? getApp() : initializeApp(firebaseConfig);
}

export function getFirebaseAuth(): Auth {
  assertBrowser("Auth");
  return getAuth(getFirebaseApp());
}

export function getDb(): Firestore {
  assertBrowser("Firestore");
  return getFirestore(getFirebaseApp());
}

/**
 * NOTE: Firebase Storage is intentionally NOT used in this app — it requires the
 * Blaze (pay-as-you-go) plan. All media (photos, logo) is compressed client-side
 * and stored as base64 directly in Firestore instead. See uploadImageAsBase64 in
 * src/lib/cms.ts.
 */
