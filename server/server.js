require("dotenv").config();
const express = require("express");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
const connectDB = require("./config/db");

connectDB();

const app = express();
app.use(cors());
app.use(express.json());

/* ================= SOCKET SETUP ================= */
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173", // your frontend port
    methods: ["GET", "POST"],
  },
});

app.set("io", io);

io.on("connection", (socket) => {
  console.log("⚡ New client connected:", socket.id);

  socket.on("disconnect", () => {
    console.log("❌ Client disconnected:", socket.id);
  });
});

/* ================= ROUTES ================= */
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/students", require("./routes/studentRoutes"));

app.get("/", (req, res) => {
  res.send("IARS API Running");
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () =>
  console.log(`🚀 Server running on port ${PORT}`)
);
