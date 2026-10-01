import express from "express";
import http from "http";
import { Server } from "socket.io";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import mongoSanitize from "@exortek/express-mongo-sanitize";
import hpp from "hpp";

import authRoutes from "./routes/authRoutes.js";
import workspaceRoutes from "./routes/workspaceRoutes.js";
import boardRoutes from "./routes/boardRoutes.js";
import listRoutes from "./routes/listRoutes.js";
import cardRoutes from "./routes/cardRoutes.js";
import searchRoutes from "./routes/searchRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import { initSocket } from "./socket/socketHandler.js";

dotenv.config();

const app = express();

/* =========================================
   CORS
========================================= */

// --- CORS ---
const allowedOrigins = [
  "http://localhost:5173",
  "https://kanban-kjic1fmb5-anup24.vercel.app",
  "https://kanban-app-iota-navy.vercel.app",
];

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests without origin (Postman, server-to-server, etc.)
    if (!origin) {
      return callback(null, true);
    }

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    return callback(new Error("Not allowed by CORS"));
  },
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  credentials: true,
};

app.use(cors(corsOptions));

/* =========================================
   Security middleware
========================================= */

app.use(helmet());

app.use(express.json({ limit: "10kb" }));

app.use(mongoSanitize());

app.use(hpp());

/* =========================================
   Rate limiting
========================================= */

const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  message: {
    message: "Too many requests, please try again later.",
  },
});

app.use("/api", generalLimiter);

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: {
    message: "Too many auth attempts, please try again later.",
  },
});

app.use("/api/auth/login", authLimiter);
app.use("/api/auth/signup", authLimiter);

/* =========================================
   Health check
========================================= */

app.get("/api/health", (req, res) => {
  res.json({
    status: "Server running fine ✅",
  });
});

/* =========================================
   Routes
========================================= */

app.use("/api/auth", authRoutes);

app.use("/api/workspaces", workspaceRoutes);

app.use("/api/boards", boardRoutes);

app.use("/api/lists", listRoutes);

app.use("/api/cards", cardRoutes);

app.use("/api/search", searchRoutes);

app.use("/api/notifications", notificationRoutes);

/* =========================================
   Global error handler
========================================= */

app.use((err, req, res, next) => {
  console.error("Unhandled error:", err.stack);

  res.status(500).json({
    message: "Something went wrong on the server",
  });
});

/* =========================================
   HTTP + Socket.IO
========================================= */

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
    credentials: true,
  },
});

initSocket(io);

app.set("io", io);

/* =========================================
   Start server
========================================= */

const PORT = process.env.PORT || 5000;

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB connected");

    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err);
  });
