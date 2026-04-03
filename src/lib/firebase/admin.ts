/* eslint-disable @typescript-eslint/no-explicit-any */

// Firebase Admin helpers (server-side only).
//
// This uses `firebase-admin` via `require()` so the app can still lint/build in environments
// where dependencies haven't been installed yet. In production, you must install
// `firebase` + `firebase-admin` and provide the required env vars.

let adminApp: any | null = null;

function getAdmin() {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  return require("firebase-admin") as any;
}

function initAdmin() {
  if (adminApp) return adminApp;

  const admin = getAdmin();

  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (!serviceAccountJson) {
    throw new Error(
      "Missing FIREBASE_SERVICE_ACCOUNT_JSON env var (Firebase service account JSON string).",
    );
  }

  const serviceAccount = JSON.parse(serviceAccountJson);

  adminApp = admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });

  return adminApp;
}

export async function verifyFirebaseIdToken(idToken: string): Promise<any> {
  initAdmin();
  const admin = getAdmin();
  return admin.auth().verifyIdToken(idToken);
}

export async function sendPushToTokens(params: {
  tokens: string[];
  title: string;
  body: string;
  data?: Record<string, string>;
}) {
  const { tokens, title, body, data } = params;
  if (!tokens.length) return { successCount: 0, failureCount: 0 };

  initAdmin();
  const admin = getAdmin();

  // FCM requires string values in the `data` payload.
  const dataStrings: Record<string, string> = {};
  if (data) {
    Object.entries(data).forEach(([k, v]) => {
      dataStrings[k] = String(v);
    });
  }

  const message = {
    notification: { title, body },
    data: dataStrings,
    tokens,
  };

  // `sendEachForMulticast` returns success/failure counts.
  const result = await admin.messaging().sendEachForMulticast(message);
  return {
    successCount: result.successCount,
    failureCount: result.failureCount,
  };
}

