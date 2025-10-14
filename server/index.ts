// server/index.ts
import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";

const app = express();
app.use(cors());
const httpServer = http.createServer(app);
const io = new Server(httpServer, {
  cors: { origin: "*" },
});

const clients = new Map<string, string>();

io.on("connection", (socket) => {
  console.log("socket connected:", socket.id);

  socket.on("identify", (clientId: string) => {
    clients.set(clientId, socket.id);
    console.log("identify:", clientId, "->", socket.id);
  });

  socket.on("request-connection", (p: { fromId: string; toId: string }) => {
    const toSocket = clients.get(p.toId);
    if (toSocket) {
      io.to(toSocket).emit("connection-request", { fromId: p.fromId });
    } else {
      socket.emit("request-error", { message: "User not online" });
    }
  });

  socket.on("offer", (p: any) => {
    const toSocket = clients.get(p.toId);
    if (toSocket) io.to(toSocket).emit("offer", { fromId: p.fromId, sdp: p.sdp });
  });

  socket.on("answer", (p: any) => {
    const toSocket = clients.get(p.toId);
    if (toSocket) io.to(toSocket).emit("answer", { fromId: p.fromId, sdp: p.sdp });
  });

  socket.on("ice-candidate", (p: any) => {
    const toSocket = clients.get(p.toId);
    if (toSocket) io.to(toSocket).emit("ice-candidate", { fromId: p.fromId, candidate: p.candidate });
  });

  socket.on("disconnect", () => {
    for (const [id, sid] of clients) if (sid === socket.id) clients.delete(id);
    console.log("socket disconnected", socket.id);
  });
});

const PORT = process.env.SIGNALING_PORT || 5000;
httpServer.listen(PORT, () => console.log(`Signaling server running on ${PORT}`));
