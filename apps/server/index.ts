import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";

const app = express();
const server = createServer(app);

app.get("/", (_, res) => {
  res.send("Hello World!");
});

const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
    credentials: true,
  },
});

io.on("connection", (socket) => {
  console.log("Player connected:", socket.id);

  socket.on("move", (data: { x: number; y: number; name: string }) => {
    console.log("Player moved:", socket.id, data);
    socket.broadcast.emit("move", { id: socket.id, ...data });
  });

  socket.on("shoot", (data: { x: number; y: number; angle: number }) => {
    console.log("Player shot:", socket.id, data);
    io.emit("shoot", { id: socket.id, ...data });
  });

  socket.on("disconnect", () => {
    console.log("Player disconnected:", socket.id);
    io.emit("playerLeft", socket.id);
  });
});

server.listen(3000, () => {
  console.log("Server listening on port 3000");
});
