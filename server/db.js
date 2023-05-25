"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.realtimeDB = exports.firestoreDB = void 0;
const firebase_admin_1 = require("firebase-admin");
// import * as serviceAccount from "../key.json";
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
firebase_admin_1.default.initializeApp({
    credential: firebase_admin_1.default.credential.cert(serviceAccount),
    databaseURL: process.env.FIREBASE_DB_URL,
});
//
const firestoreDB = firebase_admin_1.default.firestore();
exports.firestoreDB = firestoreDB;
const realtimeDB = firebase_admin_1.default.database();
exports.realtimeDB = realtimeDB;
