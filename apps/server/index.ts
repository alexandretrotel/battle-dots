import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";

const app = express();
const server = createServer(app);

app.get("/", (req, res) => {
  res.send("Hello World!");
});

const io = new Server(server);

io.on("connection", (socket) => {
  console.log("Player connected:", socket.id);

  socket.on("move", (data: { x: number; y: number }) => {
    socket.broadcast.emit("move", { id: socket.id, ...data });
  });

  socket.on("shoot", (data: { x: number; y: number; angle: number }) => {
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
