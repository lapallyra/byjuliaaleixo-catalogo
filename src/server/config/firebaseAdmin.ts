import { initializeApp, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

// Initialize Firebase Admin
if (getApps().length === 0) {
  initializeApp({
    projectId: "gen-lang-client-0841512066",
  });
}

export const dbAdmin = getFirestore("ai-studio-c4cc2b71-da7b-4f2b-a88e-7badffe10d83");
