const express = require("express");
const fs = require("fs");
const forge = require('node-forge')
const cors=require('cors')
    forge.options.usePureJavaScript = true
    var pki = forge.pki;
    var keys = pki.rsa.generateKeyPair(2048);
    var cert = pki.createCertificate();
    
    cert.publicKey = keys.publicKey;
    cert.serialNumber = '01';
    cert.validity.notBefore = new Date();
    cert.validity.notAfter = new Date();
    cert.validity.notAfter.setFullYear(cert.validity.notBefore.getFullYear()+1);
    
    var attrs = [{
        name: 'commonName',
        value: 'lol.lol'
      }, {
        name: 'countryName',
        value: 'TW'
      }, {
        shortName: 'ST',
        value: 'Illinois'
      }, {
        name: 'localityName',
        value: 'loli'
      }, {
        name: 'organizationName',
        value: 'Loli'
      }, {
        shortName: 'OU',
        value: 'Loli'
      }];
    cert.setSubject(attrs);
    cert.setIssuer(attrs);
    cert.setExtensions([{
        name: 'basicConstraints',
        cA: true
      }, {
        name: 'keyUsage',
        keyCertSign: true,
        digitalSignature: true,
        nonRepudiation: true,
        keyEncipherment: true,
        dataEncipherment: true
      }, {
        name: 'extKeyUsage',
        serverAuth: true,
        clientAuth: true,
        codeSigning: true,
        emailProtection: true,
        timeStamping: true
      }, {
        name: 'nsCertType',
        client: true,
        server: true,
        email: true,
        objsign: true,
        sslCA: true,
        emailCA: true,
        objCA: true
      }, {
        name: 'subjectAltName',
        altNames: [{
          type: 6, // URI
          value: 'http://lol.lol.lol'
        }, {
          type: 7, // IP
          ip: '127.0.0.1'
        }]
      }, {
        name: 'subjectKeyIdentifier'
      }]);
    cert.sign(keys.privateKey);
    
    var private_key = pki.privateKeyToPem(keys.privateKey);
    var public_key = pki.certificateToPem(cert);
    
    // In case you need the newly generated keys displayed or saved
    // console.log(public_key);
    // console.log(private_key);
    fs.writeFileSync("private.pem",private_key)
    fs.writeFileSync("public.crt",public_key)
    console.log("saved private_key, public_key.");
    
    
    const options = {
        key: private_key,
        cert: public_key
    };
    
const app = express();
app.use(cors())
const server = require("https").Server(options, app);
const io = require("socket.io")(server,{cors:{ origin: "*"}});
const peer = require("peer");
//const { v4: uuidV4 } = require('uuid')

// const httpsServer = https.createServer({
//   key: fs.readFileSync('server-key.pem'),
//   cert: fs.readFileSync('server-cert.pem')
// }, app)

console.log("start server");
app.set("view engine", "ejs");
app.use(express.static("public"));
app.use(express.static("views"));

// app.get('/', (req, res) => {
//   res.redirect(`/${uuidV4()}`)
// })
const users = {};
// 測試
const i = 0;
app.get("/:room", (req, res) => {
  res.render("room", { roomId: req.params.room });
  //console.log("room")
});

let peerIds = {}; // Key: socket.id, Value: peerId
io.on("connection", (socket) => {
  socket.on("join-room", (roomId, userId) => {
    socket.join(roomId);
    socket.to(roomId).emit("user-connected", userId);
    peerIds[socket.id] = userId;
    //console.log(roomId,userId,'joined-room')

    socket.on("new-user", (name) => {
      users[socket.id] = name;
      io.emit("user-connected__", name);
      // console.log
      //console.log(users[socket.Id])
      console.log(name, "new user connected");
    });

    socket.on("send-chat-message", (message) => {
      io.emit("chat-message", { name: users[socket.id], message: message });
      // console.log chat message
      console.log(users[socket.id], ":chat message sent", message);
    });

    socket.on("disconnect", () => {
      //socket.to(roomId).emit('user-disconnected', userId)
      io.emit("user-disconnected", users[socket.id]);
      // disconnect 可以觸發
      io.emit("remove-video-" + peerIds[socket.id]);
      console.log(users[socket.id], "user disconnected");
      delete users[socket.id];
      delete peerIds[socket.id];
    });
  });
});

let myPeerServer = peer.PeerServer({
  port: 3001,
  path: "/",
});

server.listen(444, () => {
  console.log("Server listening on port 444");
});
