"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// // SERVER
const db_1 = require("./db");
const express = require("express");
const cors = require("cors");
const app = express();
const PORT = 3000;
// const PORT = process.env.PORT;
console.log(PORT);
app.use(express.json());
app.use(cors());
const userCollection = db_1.firestore.collection("users");
const roomCollection = db_1.firestore.collection("rooms");
app.get("/rooms", async (req, res) => {
    res.json({ "noob": "vos" });
    console.log("noob");
    // roomCollection.get().then((roomSnap)=>{
    //    const roomCollectionSnap = roomSnap;
    //    console.log("RoomSnap: ", roomCollectionSnap);
    //    res.json(roomCollectionSnap);
    // });
    // PROBAR SI LA API EN EL DEPLOY 
    // PROBAR CON POSTMAN
});
app.get("/env", async (req, res) => {
    res.json({
        enviroment: process.env.NODE_ENV,
    });
});
app.listen(PORT, () => {
    console.log("API Running");
});
