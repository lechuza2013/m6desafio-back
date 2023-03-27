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
const usersDataRef = db_1.firestoreDB.collection("users");
const roomsDataRef = db_1.firestoreDB.collection("rooms");
// Devuelve un array con los datos de los usuarios ya existentes
app.get("/users", (req, res) => {
    usersDataRef.get().then((usersData) => {
        const docs = usersData.docs;
        const users = docs.map((doc) => {
            res.json(doc.data());
        });
        res.status(200).send({
            ...users,
        });
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
