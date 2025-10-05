// server.js
const { createServer } = require("node:http");
const { Server } = require("socket.io");

const current = { players: {} };

// Create a plain HTTP server (no HTML)
const server = createServer();

// Initialize Socket.IO server
const io = new Server(server, {
  cors: {
    origin: "*", // In production, replace with your actual client URL
    methods: ["GET", "POST"]
  }
});

// Handle client connections
io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  const playerId = "P" + (Object.keys(current.players).length + 1);

  current.players[socket.id] = {
    id: playerId,
    name: "Player " + playerId,
    x: 100,
    y: 100,
    health: 100,
    score: 0,
    stamina: 100,
    ammo: 10,
    animation: "Idle"
  };

  current.maxValues = {
    score: 999,
    health: 100,
    stamina: 100,
    ammo: 10
  };

  current.minValues = {
    score: 0,
    health: 0,
    stamina: 0,
    ammo: 0
  };

  io.emit("playerJoined", current.players[socket.id]);
  socket.emit("playersList", Object.values(current.players));

  console.log("Current players:", current.players);

  socket.on("request_setup", () => {
    if (current.players[socket.id]) {
      socket.emit("setupinfo", current.players[socket.id]);
      socket.emit("maxValues", current.maxValues);
      socket.emit("minValues", current.minValues);
      socket.emit("playersList", Object.values(current.players));
      console.log("Sent setup info to", socket.id);
    }
  });

  socket.on("chatMessage", (msg) => {
    console.log("Received from client:", msg);
    const fromId = current.players[socket.id]
      ? current.players[socket.id].id
      : socket.id;
    io.emit("chatMessage", { from: fromId, text: msg });
  });

  socket.on("updateState", (payload) => {
    const p = current.players[socket.id];
    if (p && payload && typeof payload === "object") {
      Object.assign(p, payload);
      socket.broadcast.emit("playerState", { id: p.id, state: payload });
      console.log(payload);
    }
  });

  socket.on("disconnect", (reason) => {
    const left = current.players[socket.id];
    console.log("User disconnected:", socket.id, reason);
    if (left) {
      io.emit("playerLeft", { id: left.id });
      delete current.players[socket.id];
    }
  });
});

// ✅ Use Railway's dynamic port
const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log(`Socket.IO server running on port ${PORT}`);
});
