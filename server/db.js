"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.realtimeDB = exports.firestoreDB = void 0;
const firebase_admin_1 = require("firebase-admin");
const serviceAccount = {
    type: "service_account",
    project_id: process.env.FIREBASE_PROJECT_ID,
    private_key_id: process.env.FIREBASE_KEY_ID,
    private_key: JSON.parse(process.env.FIREBASE_PRIVATE_KEY),
    client_email: process.env.FIREBASE_CLIENT_MAIL,
    client_id: process.env.FIREBASE_CLIENT_ID,
    auth_uri: process.env.FIREBASE_AUTH_URI,
    token_uri: process.env.FIREBASE_TOKEN_URI,
    auth_provider_x509_cert_url: process.env.FIREBASE_CERT,
    client_x509_cert_url: process.env.FIREBASE_CLIENT_CERT,
};
firebase_admin_1.default.initializeApp({
    credential: firebase_admin_1.default.credential.cert(serviceAccount),
    databaseURL: process.env.FIREBASE_DB_URL,
});
const firestoreDB = firebase_admin_1.default.firestore();
exports.firestoreDB = firestoreDB;
const realtimeDB = firebase_admin_1.default.database();
exports.realtimeDB = realtimeDB;
