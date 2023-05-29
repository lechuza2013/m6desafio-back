// // SERVER
import { realtimeDB, firestoreDB } from "./db";
import * as express from "express";
import * as bodyParser from "body-parser";

// CORS, UUID, BODY-PARSER.
import { v4 as uuidv4 } from "uuid";
import * as cors from "cors";

const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json());
app.use(cors());
app.use(bodyParser.json());

const usersCollectionRef = firestoreDB.collection("users");
const roomsCollectionRef = firestoreDB.collection("rooms");

// Add Access Control Allow Origin headers
app.use((req, res, next) => {
  res.setHeader(
    "Access-Control-Allow-Origin",
    "https://piedrapapelotijerazo.onrender.com"
    // "http://localhost:1234"
  );
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  );
  next();
});

// ------------ GET ------------

// Autentica el usuario para iniciar sesión, devolviendo su userId
app.post("/auth", (req, res) => {
  const { email, password } = req.body;
  console.log("Email y password recibidos: ", email, password);
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
app.get("/getRoomId/:roomId", (req, res) => {
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
app.get("/getRoomData/:roomId", (req, res) => {
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

// Devuelve todos los rooms creados por el usuario recibiendo el userID
app.get("/getRoomsid/:userId", async (req, res) => {
  var roomsData = [];
  var actualizedRoomsData = [];

  const { userId } = req.params;
  const userRef = usersCollectionRef.doc(userId);
  await userRef.get().then((userData) => {
    // 1 solo llamado
    const roomsArray = userData.get("rooms");
    console.log("roomsArray: ", roomsArray);

    if (roomsArray.length == 0) {
      res.json({ message: "No creaste ninguna gameRoom" });
    } else {
      //Devuelve todas las rtdbRoomsId
      roomsCollectionRef
        .get()
        .then((data) => {
          const doc = data.docs;
          //Devuelve las LongRoomId
          doc.map((item) => {
            roomsArray.forEach((i) => {
              if (i == item.id) {
                roomsData.push({
                  shortRoomID: i,
                  longRoomID: item.data().rtdbRoomid,
                  playerOneName: "",
                  playerOneScore: 0,
                  playerTwoName: "",
                  playerTwoScore: 0,
                });
              }
            });
          });
        })
        .then(() => {
          const roomRefRTDB = realtimeDB.ref("/rooms/");
          roomRefRTDB.get().then((rooms) => {
            var roomsSnapData = rooms.val();
            roomsData.forEach((item) => {
              if (roomsSnapData[item.longRoomID]) {
                item.playerOneName =
                  roomsSnapData[item.longRoomID].currentGame[
                    Object.keys(roomsSnapData[item.longRoomID].currentGame)[0]
                  ].name;
                item.playerOneScore =
                  roomsSnapData[item.longRoomID].currentGame[
                    Object.keys(roomsSnapData[item.longRoomID].currentGame)[0]
                  ].score;
                // Segundo player
                item.playerTwoName =
                  roomsSnapData[item.longRoomID].currentGame[
                    Object.keys(roomsSnapData[item.longRoomID].currentGame)[1]
                  ].name;
                item.playerTwoScore =
                  roomsSnapData[item.longRoomID].currentGame[
                    Object.keys(roomsSnapData[item.longRoomID].currentGame)[1]
                  ].score;
                actualizedRoomsData.push(item);
                console.log("ActualizedData: ", actualizedRoomsData);
              }
            });
            res.json(actualizedRoomsData);
          });
        });
    }
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
          message:
            "El email ingresado ya fue usado, por favor ingrese otro (Me salió una rima)",
        });
      }
    });
  usersCollectionRef.doc();
});

// CREAR ROOM [Recibe UserId y devuelve RoomId - Agrega el roomId amigable a lo dato del usuario]
app.post("/createRoom", (req, res) => {
  //El userId que recibe de la request
  const { userId, userName } = req.body;
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
                name: userName,
                online: true,
                start: false,
                score: 0,
              },
              secondPlayer: {
                choice: "",
                name: "",
                online: false,
                start: false,
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
                  shortId: roomId.toString(), // ID Amigable para joinear a la Room
                  longRoomId: roomLongId,
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

app.post("/addPoint", (req, res) => {
  const { roomId, userId } = req.body;
  const roomRef = realtimeDB.ref("/rooms/" + roomId);

  roomRef.get().then((roomSnap) => {
    var roomSnapData = roomSnap.val();

    roomSnapData.currentGame[userId].score++;
    roomRef.update(roomSnapData);
  });
  res.json("Victoria!");
});

app.post("/sendChoice", (req, res) => {
  const { roomId, userId, choice } = req.body;
  const roomRef = realtimeDB.ref("/rooms/" + roomId);

  roomRef.get().then((roomSnap) => {
    var roomSnapData = roomSnap.val();

    roomSnapData.currentGame[userId].choice = choice;
    roomRef.update(roomSnapData);
  });
  res.json("Jugada hecha");
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
    var message: string;
    //Se actualiza el userId del segundo jugador, y los valores de "online", "name".
    if (currentGameSnapData.currentGame.secondPlayer) {
      Object.assign(currentGameSnapData.currentGame, {
        [userId]: {
          choice: "",
          name: userName,
          online: userStatus,
          start: false,
          score: 0,
        },
      });
      delete currentGameSnapData.currentGame.secondPlayer;
      message = "Te has unido a la sala!";
    } else if (currentGameSnapData.currentGame[userId]) {
      currentGameSnapData.currentGame[userId].online = userStatus;
      currentGameSnapData.currentGame[userId].choice = "";
      (currentGameSnapData.currentGame[userId].start = false),
        (message = "Te has conectado a la sala!");
    } else {
      message = "Sala llena, o tu nombre no coincide con los participantes";
    }
    if (
      message === "Te has unido a la sala!" ||
      "Te has conectado a la sala!"
    ) {
      //Se guardan en una variable para mandar la data a la RTDB ya actualizada.
      var currentGameUpdated = currentGameSnapData;
      roomRef.update(currentGameUpdated);
    }
    res.json({ message });
  });
});

// ¡Jugar! - Espera
app.patch("/gameRoom/:roomId/start/:userId", (req, res) => {
  //El RoomId de la RTDB, y el userId para establecer sus datos.
  const { roomId, userId } = req.params;
  const roomRef = realtimeDB.ref("/rooms/" + roomId);
  roomRef.get().then((currentGameSnap) => {
    var cgsData = currentGameSnap.val();
    cgsData.currentGame[userId].online = true;
    cgsData.currentGame[userId].start = true;

    roomRef.update(cgsData);
  });
});
// Terminó la ronda, se acomodan los datos.
app.patch("/gameRoom/:roomId/restart/", (req, res) => {
  const { roomId } = req.params;
  const roomRef = realtimeDB.ref("/rooms/" + roomId);
  roomRef.get().then((currentGameSnap) => {
    var cgData = currentGameSnap.val();
    // Player 1
    cgData.currentGame[Object.keys(cgData.currentGame)[0]].online = true;
    cgData.currentGame[Object.keys(cgData.currentGame)[0]].start = false;
    cgData.currentGame[Object.keys(cgData.currentGame)[0]].choice = "";
    // Player 2
    cgData.currentGame[Object.keys(cgData.currentGamea)[1]].online = true;
    cgData.currentGame[Object.keys(cgData.currentGame)[1]].start = false;
    cgData.currentGame[Object.keys(cgData.currentGame)[1]].choice = "";
    // cgData.currentGame[Object.keys(cgData)[0]]

    roomRef.update(cgData);
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
