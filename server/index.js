"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// // SERVER
const db_1 = require("./db");
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const app = express();
const PORT = process.env.PORT || 3000;
console.log(PORT);
app.use(express.json());
app.use(cors());
app.use(bodyParser.json());
const usersCollectionRef = db_1.firestoreDB.collection("users");
const roomsCollectionRef = db_1.firestoreDB.collection("rooms");
// Devuelve un array con los datos de los usuarios ya existentes
app.get("/users", (req, res) => {
    usersCollectionRef.doc().get().then((doc) => {
        const data = doc.data();
        res.json(data);
    });
});
app.get("/env", async (req, res) => {
    res.json({
        enviroment: process.env.NODE_ENV,
    });
});
app.listen(PORT, () => {
    console.log("API Running");
});
