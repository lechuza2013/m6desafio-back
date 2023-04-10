// // SERVER
import { realtimeDB, firestoreDB } from "./db";
import * as express from "express";
import * as bodyParser from "body-parser";
import { doc, setDoc } from "firebase/firestore";

// CORS, UUID, BODY-PARSER.
import { v4 as uuidv4 } from "uuid";
import * as cors from "cors";

const app = express();
const PORT = process.env.PORT || 3000;
console.log(PORT);

app.use(express.json());
app.use(cors());
app.use(bodyParser.json());

const usersCollectionRef = firestoreDB.collection("users");
const roomsCollectionRef = firestoreDB.collection("rooms");

const rtdbTestRef = realtimeDB.ref(
  "rooms/164c83ff-d948-4f08-930a-98a482dcca92"
);
const dbtestRef = usersCollectionRef.doc("1arFfQiPvNIxkguRXbGP");
dbtestRef.onSnapshot((doc) => {
  console.log("Current changed data: ", doc.data());
});
// ------------ GET ------------

// Devuelve toda la data de los usuarios ya existentes
app.get("/users", (req, res) => {
  usersCollectionRef.get().then((data) => {
    const doc = data.docs;
    const users = doc.map((item) => {
      return item.data();
    });
    res.json({ users });
  });
});
// Autentica el usuario para iniciar sesión, devolviendo su userId
app.post("/auth", (req, res) => {
  const { email, password } = req.body;
  usersCollectionRef
    .where("email", "==", email)
    .where("password", "==", password)
    .get()
    .then((data) => {
      if (data.empty) {
        res.status(404).send({
          message: "El correo o la contraseña son incorrectos",
        });
      } else if (data.docs) {
        res.status(200).send({
          message: "Usuario encontrado. Sesión iniciada correctamente",
          id: data.docs[0].id,
          name: data.docs[0].get("name"),
          rooms: data.docs[0].get("rooms"),
        });
      }
    });
});

// Devuelve el rtdbRommID recibiendo el ID 'Amigable' [FSDB]
app.post("/getRoomId/:roomId", (req, res) => {
  const { roomId } = req.params; // ID Recibido
  const roomRef = roomsCollectionRef.doc(roomId); // Consulta en la firestore collection

  roomRef.get().then((snap) => {
    if (snap.exists) {
      const snapData = snap.data();
      res.json(snapData);
    } else {
      res.status(404).send({
        message: "La sala no existe o no se encontró",
      });
    }
  });
});
// Devuelve la data de la Room con su ID 'Seguro' [RTDB]
app.post("/getRoomData/:roomId", (req, res) => {
  const { roomId } = req.params; // ID Recibido
  const roomRef = realtimeDB.ref("rooms/" + roomId); // Consulta la room en la RTDB
  roomRef.get().then((snap) => {
    if (snap != null) {
      const snapData = snap.val();
      res.json(snapData);
    } else {
      res.status(404).send({
        message: "La sala no existe o no se encontró",
      });
    }
  });
});

app.post("/getRoomsid/", async (req, res) => {
  var roomsData = [];

  const { userId } = req.body;
  const userRef = usersCollectionRef.doc(userId);
  await userRef.get().then((userData) => {
    const roomsArray = userData.get("rooms");
    console.log("roomsArray: ", roomsArray);

    roomsArray.forEach((id) => {
      const roomRef = roomsCollectionRef.doc(id.toString());

      roomRef.get().then((rtdbRoomid) => {
        const realID = rtdbRoomid.data();
        console.log("id: ", realID.rtdbRoomid);
        const roomRTDBRef = realtimeDB.ref("/rooms/" + realID.rtdbRoomid);

        roomRTDBRef.get().then((snap) => {
          const snapData = snap.val();
          console.log("snapData", snapData);
          roomsData.push(snapData);
          if (roomsData.length == roomsArray.length) {
            res.json(roomsData);
          }
          console.log("RoomsData", roomsData);
        });
      });
    });
  });
});

// ------------ POST ------------

// CREAR USUARIO [Recibe Email, Name y Password, devuelve userId]
app.post("/signup", (req, res) => {
  const { email, name, password } = req.body;
  usersCollectionRef
    .where("email", "==", email)
    .get()
    .then((searchResponse) => {
      if (searchResponse.empty) {
        usersCollectionRef
          .add({
            email,
            name,
            password,
            rooms: [],
          })
          .then((newUserRef) => {
            res.json({
              id: newUserRef.id,
              new: true,
            });
          });
      } else {
        res.status(400).json({
          message: "email already exists",
        });
      }
    });
  usersCollectionRef.doc();
});

// CREAR ROOM [Recibe UserId y devuelve RoomId - Agrega el roomId amigable a lo dato del usuario]
app.post("/createRoom", (req, res) => {
  //El userId que recibe de la request
  const { userId } = req.body;
  const roomRef = realtimeDB.ref("rooms/" + uuidv4());
  console.log(userId);
  usersCollectionRef
    .doc(userId.toString())
    .get()
    .then((doc) => {
      if (doc.exists) {
        roomRef // Setea en la RTDB la room con su ID largo y las propiedades a considerar para el Juego.
          .set({
            currentGame: {
              [userId]: {
                choice: "",
                name: "",
                online: "",
                start: "",
                score: 0,
              },
              secondPlayer: {
                choice: "",
                name: "",
                online: "",
                start: "",
                score: 0,
              },
            },
          })
          .then(() => {
            // Setea en la Firestore el ID "Amigable" con su ID Seguro, y devuelve el amigable.
            const roomLongId = roomRef.key;
            const roomId = 1000 + Math.floor(Math.random() * 999);
            roomsCollectionRef
              .doc(roomId.toString())
              .set({
                rtdbRoomid: roomLongId,
              })
              .then(() => {
                const userRef = usersCollectionRef.doc(userId);

                userRef.get().then((userData) => {
                  const userUpdated = {
                    name: userData.get("name"),
                    email: userData.get("email"),
                    password: userData.get("password"),
                    rooms: userData.get("rooms"),
                  };
                  userUpdated.rooms.push(roomId);
                  userRef.set(userUpdated);
                });
              })
              .then(() => {
                res.json({
                  id: roomId.toString(), // ID Amigable para joinear a la Room
                  message: "RoomID Agregado al user!",
                });
              });
            //Setea en los datos del usuario la room creada
          });
      } else {
        res.status(401).send({
          message: "UserId Inexistente",
        });
      }
    });
});

// ------------ PATCH ------------

// Establece el estado del jugador (online/offline) recibiendo la roomId(Seguro) y el userId (del que hay que modificar)
app.patch("/gameRoom/:roomId/:userId", (req, res) => {
  // DATA RECIBIDA
  const { roomId, userId } = req.params;
  const userStatus: boolean = req.body.userStatus; // true o false
  const userName: string = req.body.userName; // nombre del usuario

  const roomRef = realtimeDB.ref("/rooms/" + roomId);
  roomRef.get().then((currentGameSnap) => {
    var currentGameSnapData = currentGameSnap.val();

    //Se actualizan los valores de "online" y "name"
    currentGameSnapData.currentGame[userId].online = userStatus;
    currentGameSnapData.currentGame[userId].name = userName;

    //Se guardan en una variable para mandar la data a la RTDB ya actualizada.
    var currentGameUpdated = currentGameSnapData;
    console.log("Variable check: ", currentGameUpdated);

    //Se envian los datos actualizados de la room.
    roomRef.update(currentGameUpdated);
    res.json({ message: "Jugador online!" });
  });
});

// JOINROOM, Recibe el roomId, userId y name.
app.patch("/joinRoom/:roomId/:userId", (req, res) => {
  // DATA RECIBIDA
  const { roomId, userId } = req.params;
  const userStatus: boolean = req.body.userStatus; // true o false
  const userName: string = req.body.userName; // nombre del usuario

  const roomRef = realtimeDB.ref("/rooms/" + roomId);
  roomRef.get().then((currentGameSnap) => {
    var currentGameSnapData = currentGameSnap.val();

    //Se actualiza el userId del segundo jugador, y los valores de "online", "name".
    Object.assign(currentGameSnapData.currentGame, {
      [userId]: {
        choice: "",
        name: userName,
        online: userStatus,
        start: "",
        score: 0,
      },
    });
    delete currentGameSnapData.currentGame.secondPlayer;
    //Se guardan en una variable para mandar la data a la RTDB ya actualizada.
    var currentGameUpdated = currentGameSnapData;
    console.log("Variable check: ", currentGameUpdated);

    roomRef.update(currentGameUpdated);
    res.json({ message: "Segundo jugador online!" });
  });
});

// ------------ LISTEN ------------
app.listen(PORT, () => {
  console.log("API Running");
});

// ENV check
app.get("/env", async (req, res) => {
  res.json({
    enviroment: process.env.NODE_ENV,
  });
});

/*


06/4 -> GET /getRoomsid/, me llego el teclado y lo terminé xd, back terminado

03/4 -> GET /getRoomsid/", 400 Request al pedo, optimizar.


30/3 ->  GET /auth/, ahora te devuelve las rooms que creó este usuario




29/3  -> PATCH /gameRoom/:roomId/:userId"/, El dueño de la Room se conecta y se actualizan los datos "name" y "online" de forma correcta.
      -> PATCH /joinRoom/:roomId/:userId"/, El segundo jugador ya se puede conectar, el userId se actualiza correctamente, y sus datos "name" y "online" también.
      
      SOLUCIONAR: 
        - PATCH /joinRoom/:roomId/:userId"/ 
              ->[En el caso de joinear cuando ya hayan datos en la Firebase]
              -> Posible error: 



28/3 -> POST /createRoom/ Crear Room, ya se crea correctamente en la firestore con su ID Amigable referenciando al ID Seguro, y en la RTDB ya se crea la room con el ID seguro y con las propiedades del CurrentGame
     -> GET /getRoomId/:roomId (Devuelve la ID Segura con la Id Amigable)
     -> GET /getRoomData/:roomId (Devuelve la data de la Room al recibir el ID Seguro)
     -> GET /auth/ andando, devuelve id y name.

      ARREGLAR/FALTA: [HECHO ✔]
         - PATCH: /gameRoom/:roomId/:userId [Error en el update.]

27/3 -> GET /users/ y POST /signup/ andando. 
          
      ARREGLAR/FALTA:  [HECHO ✔]
         - Crear Room [Ver como hacer para ambos jugadores]
         - Autenticar para iniciar sesión
         - Las ID para seguridad

         
*/
