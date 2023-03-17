// // SERVER
import {realtimeDB, firestoreDB} from "./db";
import {ref, set, push} from "firebase/database";
import * as express from "express";

// CORS, UUID.
import {v4 as uuidv4} from "uuid";
import * as cors from "cors";

const app = express();
const PORT = 3000;
// const PORT = process.env.PORT;
console.log(PORT);

app.use(express.json());
app.use(cors());

// const userCollection = firestore.collection("users");
// const roomCollection = firestore.collection("rooms");

app.get("/rooms", async (req, res)=>{
   res.json({"noob": "vos"});
   console.log("noob");
   // roomCollection.get().then((roomSnap)=>{
   //    const roomCollectionSnap = roomSnap;
   //    console.log("RoomSnap: ", roomCollectionSnap);
   //    res.json(roomCollectionSnap);
   // });
   // PROBAR SI LA API EN EL DEPLOY 
   // PROBAR CON POSTMAN
});

app.get("/env", async (req, res)=>{
   res.json({
      enviroment: process.env.NODE_ENV,
   });
});

app.listen(PORT, ()=>{
   console.log("API Running");
});