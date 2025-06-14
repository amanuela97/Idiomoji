import {
  initializeApp,
  getApps,
  cert,
  ServiceAccount,
} from "firebase-admin/app";
import { Firestore, getFirestore } from "firebase-admin/firestore";
import { Auth, getAuth } from "firebase-admin/auth";

// Function to process the private key
function getPrivateKey() {
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;
  if (!privateKey) {
    throw new Error("FIREBASE_PRIVATE_KEY is not set in environment variables");
  }

  // Handle different formats of the private key
  if (privateKey.startsWith('"') && privateKey.endsWith('"')) {
    // If the key is wrapped in quotes, remove them and replace escaped newlines
    return privateKey.slice(1, -1).replace(/\\n/g, "\n");
  }

  // If the key is not wrapped in quotes, just replace escaped newlines
  return privateKey.replace(/\\n/g, "\n");
}

const serviceAccount = {
  type: "service_account",
  project_id: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
  private_key: getPrivateKey(),
  client_email: process.env.FIREBASE_CLIENT_EMAIL,
  client_id: process.env.FIREBASE_CLIENT_ID,
  auth_uri: "https://accounts.google.com/o/oauth2/auth",
  token_uri: "https://oauth2.googleapis.com/token",
  auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
  client_x509_cert_url:
    "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-fbsvc%40idiomoji.iam.gserviceaccount.com",
  universe_domain: "googleapis.com",
};

// Validate required environment variables
const requiredEnvVars = [
  "NEXT_PUBLIC_FIREBASE_PROJECT_ID",
  "FIREBASE_PRIVATE_KEY_ID",
  "FIREBASE_PRIVATE_KEY",
  "FIREBASE_CLIENT_EMAIL",
  "FIREBASE_CLIENT_ID",
];

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    throw new Error(`Missing required environment variable: ${envVar}`);
  }
}

const app = !getApps().length
  ? initializeApp({
      credential: cert(serviceAccount as ServiceAccount),
    })
  : getApps()[0];

const adminFirestore: Firestore = getFirestore(app);
const adminAuth: Auth = getAuth(app);

export { adminFirestore, adminAuth };
