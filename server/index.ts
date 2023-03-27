// // SERVER
import {realtimeDB, firestoreDB} from "./db";
import * as express from "express";
import * as bodyParser from "body-parser";

// CORS, UUID, BODY-PARSER.
import {v4 as uuidv4} from "uuid";
import * as cors from "cors";

const app = express();
const PORT = process.env.PORT || 3000;
console.log(PORT);

app.use(express.json());
app.use(cors());
app.use(bodyParser.json());

const usersDataRef = firestoreDB.collection("users");
const roomsDataRef = firestoreDB.collection("rooms");

// Devuelve un array con los datos de los usuarios ya existentes
app.get("/users", (req, res) => {
	usersDataRef.get().then((usersData) => {
		const docs = usersData.docs;
		const users = docs.map((doc) => {
			return doc.data();
		});
		res.status(200).send({
			...users,
		});
	});
});

app.get("/env", async (req, res)=>{
   res.json({
      enviroment: process.env.NODE_ENV,
   });
});

app.listen(PORT, ()=>{
   console.log("API Running");
});