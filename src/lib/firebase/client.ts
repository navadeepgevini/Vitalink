"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */

// Firebase client helpers (browser-side only).
//
// Note: we use `require()` to avoid hard module-resolution failures when dependencies
// aren't installed yet. Install `firebase` for this to work.

let firebaseApp: any | null = null;
let messaging: any | null = null;
let auth: any | null = null;
let analytics: any | null = null;

function initFirebase() {
  if (firebaseApp) return firebaseApp;

  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const firebase = require("firebase/app") as any;
  const config = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
  };

  firebaseApp = firebase.initializeApp(config);

  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const firebaseAnalytics = require("firebase/analytics") as any;
    if (config.measurementId) analytics = firebaseAnalytics.getAnalytics(firebaseApp);
  } catch {
    // Analytics is optional.
  }

  return firebaseApp;
}

export function getFirebaseAuth() {
  if (auth) return auth;
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const firebaseAuth = require("firebase/auth") as any;
  auth = firebaseAuth.getAuth(initFirebase());
  return auth;
}

export function getFirebaseMessaging() {
  if (messaging) return messaging;
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const firebaseMessaging = require("firebase/messaging") as any;
  messaging = firebaseMessaging.getMessaging(initFirebase());
  return messaging;
}

export function getFirebaseAnalytics() {
  // Analytics may be null if measurementId isn't provided.
  if (!analytics) initFirebase();
  return analytics;
}

