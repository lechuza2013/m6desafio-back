import admin from "firebase-admin";

// import * as serviceAccount from "../key.json";
const serviceAccount = {
  type: "service_account",
  project_id: process.env.FIREBASE_PROJECT_ID,
  private_key_id: process.env.FIREBASE_KEY_ID,
  private_key: JSON.parse(process.env.FIREBASE_PRIVATE_KEY),
  client_email: process.env.FIREBASE_CLIENT_MAIL,
  client_id: process.env.FIREBASE_CLIENT_ID,
  auth_uri: "https://accounts.google.com/o/oauth2/auth",
  token_uri: "https://accounts.google.com/o/oauth2/token",
  auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
  client_x509_cert_url: process.env.FIREBASE_CLIENT_CERT,
};

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount as any),
  databaseURL: process.env.FIREBASE_DB_URL,
});

const firestoreDB = admin.firestore();
const realtimeDB = admin.database();

export { firestoreDB, realtimeDB };
