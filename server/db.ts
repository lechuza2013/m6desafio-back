import admin from "firebase-admin";

import * as serviceAccount from "../key.json";
// const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount as any),
  databaseURL: "https://probandoapx-default-rtdb.firebaseio.com",
});

// process.env.FIREBASE_DB_URL

const firestoreDB = admin.firestore();
const realtimeDB = admin.database();

export { firestoreDB, realtimeDB };
