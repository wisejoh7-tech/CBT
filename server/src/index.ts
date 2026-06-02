import "reflect-metadata";
import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import { createClient } from "redis";
import { DataSource } from "typeorm";
import cors from "cors";
import dotenv from "dotenv";
import nodemailer from "nodemailer";
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
  url: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
  synchronize: process.env.NODE_ENV !== "production", // Never sync in production
  logging: process.env.NODE_ENV !== "production",
  entities: [User, Candidate],
  migrations: [],
  subscribers: [],
});

// Redis Client
const redisClient = createClient({
  url: process.env.REDIS_URL || "redis://localhost:6379",
});

redisClient.on("error", (err) => console.log("Redis Client Error", err));

// Mailer Setup
const transporter = nodemailer.createTransport({
  host: process.env.MAIL_HOST || "smtp.gmail.com",
  port: parseInt(process.env.MAIL_PORT || "587"),
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
});

async function startServer() {
  await AppDataSource.initialize();
  console.log("Connected to Postgres");

  await redisClient.connect();
  console.log("Connected to Redis");

  app.get("/", (req, res) => {
    res.send("CBT Backend is running");
  });

  // Get active exam sessions from Redis
  app.get("/active-sessions", async (req, res) => {
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
  app.get("/candidates", async (req, res) => {
    const candidates = await AppDataSource.getRepository(Candidate).find();
    res.json(candidates);
  });

  app.post("/candidates", async (req, res) => {
    try {
      const candidate = AppDataSource.getRepository(Candidate).create(req.body);
      await AppDataSource.getRepository(Candidate).save(candidate);
      res.status(201).json(candidate);
    } catch (error) {
      res.status(400).json({ error: "Failed to create candidate" });
    }
  });

  app.delete("/candidates/:examNumber", async (req, res) => {
    await AppDataSource.getRepository(Candidate).delete(req.params.examNumber);
    res.status(204).send();
  });

  // Email Notification Endpoint
  app.post("/notify-result", async (req, res) => {
    const { email, candidateName, examNumber, pin, totalScore } = req.body;

    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }

    try {
      const mailOptions = {
        from: `"VIVI CBT Portal" <${process.env.MAIL_USER}>`,
        to: email,
        subject: "Your Examination Results Have Been Released",
        html: `
          <div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
            <h2 style="color: #0EA5E9;">Official Result Notification</h2>
            <p>Dear <b>${candidateName}</b>,</p>
            <p>Your examination results for the 2026 session have been officially verified and released.</p>
            <div style="background: #f8fafc; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <p><b>Registration Number:</b> ${examNumber}</p>
              <p><b>Access PIN:</b> ${pin}</p>
              <p style="font-size: 18px; color: #0EA5E9;"><b>Aggregate Score:</b> ${totalScore}</p>
            </div>
            <p>You can now log in to the portal or use the Public Result Checker to download your official transcript.</p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
            <p style="font-size: 10px; color: #999;">This is an automated message. Please do not reply.</p>
          </div>
        `,
      };

      await transporter.sendMail(mailOptions);
      res.json({ message: "Notification sent successfully" });
    } catch (error) {
      console.error("Email error:", error);
      res.status(500).json({ error: "Failed to send email notification" });
    }
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
