import "reflect-metadata";
import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import { createClient } from "redis";
import { DataSource } from "typeorm";
import cors from "cors";
import dotenv from "dotenv";
import { User } from "./entities/User";
import { Candidate } from "./entities/Candidate";

dotenv.config();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "*",
  },
});

const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Database Setup
export const AppDataSource = new DataSource({
  type: "postgres",
  url: process.env.DATABASE_URL || "postgres://postgres:password@localhost:5432/cbt_db",
  synchronize: true, // Be careful with this in production
  logging: false,
  entities: [User, Candidate],
  migrations: [],
  subscribers: [],
});

// Redis Client
const redisClient = createClient({
  url: process.env.REDIS_URL || "redis://localhost:6379",
});

redisClient.on("error", (err) => console.log("Redis Client Error", err));

async function startServer() {
  await AppDataSource.initialize();
  console.log("Connected to Postgres");

  await redisClient.connect();
  console.log("Connected to Redis");

  app.get("/", (req, res) => {
    res.send("CBT Backend is running");
  });

  // Get active exam sessions from Redis
  app.get("/api/active-sessions", async (req, res) => {
    try {
      const keys = await redisClient.keys("exam_progress:*");
      const sessions = [];
      for (const key of keys) {
        const data = await redisClient.get(key);
        if (data) {
          const [,, userId, examId] = key.split(":");
          sessions.push({
            userId,
            examId,
            ...JSON.parse(data)
          });
        }
      }
      res.json(sessions);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch active sessions" });
    }
  });

  // Candidate Management
  app.get("/api/candidates", async (req, res) => {
    const candidates = await AppDataSource.getRepository(Candidate).find();
    res.json(candidates);
  });

  app.post("/api/candidates", async (req, res) => {
    try {
      const candidate = AppDataSource.getRepository(Candidate).create(req.body);
      await AppDataSource.getRepository(Candidate).save(candidate);
      res.status(201).json(candidate);
    } catch (error) {
      res.status(400).json({ error: "Failed to create candidate" });
    }
  });

  app.delete("/api/candidates/:examNumber", async (req, res) => {
    await AppDataSource.getRepository(Candidate).delete(req.params.examNumber);
    res.status(204).send();
  });

  // Example Socket.io logic with Redis for real-time state
  io.on("connection", (socket) => {
    console.log("A user connected:", socket.id);

    socket.on("join-exam", async (examId) => {
      socket.join(examId);
    });

    socket.on("update-progress", async (data) => {
      // Store in Redis for speed
      const { userId, examId, progress } = data;
      await redisClient.set(`exam_progress:${userId}:${examId}`, JSON.stringify(progress), {
        EX: 3600, // Expire in 1 hour
      });

      // Optionally broadcast to admin monitoring
      io.to(examId).emit("progress-updated", { userId, progress });
    });

    socket.on("disconnect", () => {
      console.log("User disconnected");
    });
  });

  httpServer.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
}

startServer().catch(console.error);
