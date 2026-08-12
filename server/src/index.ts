import "reflect-metadata";
import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import bcrypt from "bcryptjs";
import * as mailer from "./mailer";          // matches mailer.ts in src
import { User } from "./entities/User";
import authRoutes from "./routes/auth";
import examRoutes from "./routes/exam";
import analyticsRoutes from "./routes/analytics";
import centerRoutes from "./routes/center";
import candidateRoutes from "./routes/candidate";
import subjectRoutes from "./routes/subject";

import { AppDataSource } from "./data-source";
import { logger } from "./lib/logger";
import { config } from "./lib/config";

if (!config.JWT_SECRET) {
  throw new Error("JWT_SECRET is missing");
}

import { redisClient } from "./lib/services";

const app = express();
app.use(helmet());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
});
app.use("/auth/", limiter);

// HTTP + Socket.io
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: config.NODE_ENV === "production" ? "https://cbt.vivi.com.ng" : "*",
  },
});
app.set("io", io);

// Middleware
app.use(cors({
  origin: config.NODE_ENV === "production" ? "https://cbt.vivi.com.ng" : "*",
}));
app.use(express.json());

// Routes
app.use("/auth", authRoutes);
app.use("/exams", examRoutes);
app.use("/analytics", analyticsRoutes);
app.use("/center", centerRoutes);
app.use("/candidate", candidateRoutes);
app.use("/subjects", subjectRoutes);

async function startServer() {
  try {
    await AppDataSource.initialize();
    logger.info("Connected to Postgres");

    // Seed Default Admin
    const userRepo = AppDataSource.getRepository(User);
    const adminCount = await userRepo.count();
    if (adminCount === 0) {
      const hashedPassword = await bcrypt.hash("admin123", 10);
      const defaultAdmin = userRepo.create({
        email: "admin@vivicbt.com",
        password: hashedPassword,
        displayName: "System Master",
        role: "super_admin",
      });
      await userRepo.save(defaultAdmin);
      logger.info("Default Admin created: admin@vivicbt.com / admin123");
    }

    await redisClient.connect();
    logger.info("Connected to Redis");

    app.get("/", (req, res) => {
      res.send("CBT Backend is running");
    });

    io.on("connection", (socket) => {
      logger.debug(`A user connected: ${socket.id}`);
      socket.on("disconnect", () => {
        logger.debug("User disconnected");
      });
    });

    const server = httpServer.listen(config.PORT, () => {
      logger.info(`Server is running on port ${config.PORT}`);
    });

    const shutdown = async () => {
      logger.info("Shutdown signal received. Closing connections...");
      server.close(async () => {
        logger.info("HTTP server closed.");
        await AppDataSource.destroy();
        logger.info("Postgres connection closed.");
        await redisClient.disconnect();
        logger.info("Redis connection closed.");
        process.exit(0);
      });
    };

    process.on("SIGINT", shutdown);
    process.on("SIGTERM", shutdown);

  } catch (error) {
    logger.error("Failed to start server", error);
    process.exit(1);
  }
}

startServer();
