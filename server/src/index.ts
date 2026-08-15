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

import { socGateway } from "./middleware/soc-gateway";
import { ipBlocker } from "./middleware/ip-blocker";
import { automationEngine } from "./lib/automation-engine";
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
    origin: "*", // More permissive for setup
  },
});
app.set("io", io);
automationEngine.setSocketIO(io);

// Middleware
app.use(cors({
  origin: "*", // More permissive for setup
}));
app.use(express.json());
app.use(ipBlocker);
app.use(socGateway);

// Routes
app.use("/auth", authRoutes);
app.use("/exams", examRoutes);
app.use("/analytics", analyticsRoutes);
app.use("/center", centerRoutes);
app.use("/candidate", candidateRoutes);
app.use("/subjects", subjectRoutes);

async function startServer() {
  try {
    const server = httpServer.listen(config.PORT, "0.0.0.0", () => {
      logger.info(`Server is running on port ${config.PORT}`);
    });

    const maxRetries = 5;
    let retries = 0;
    let postgresConnected = false;

    while (retries < maxRetries) {
      try {
        await AppDataSource.initialize();
        logger.info("Connected to Postgres");
        postgresConnected = true;
        break;
      } catch (error: any) {
        retries++;
        logger.error(`Failed to connect to Postgres (Attempt ${retries}/${maxRetries}):`, error.message);
        if (retries >= maxRetries) {
          logger.error("FATAL: Could not connect to Postgres after maximum retries.");
        } else {
          await new Promise(res => setTimeout(res, 5000));
        }
      }
    }

    if (postgresConnected) {
      // Seed Default Admin
      const userRepo = AppDataSource.getRepository(User);
      const adminCount = await userRepo.count();
      if (adminCount === 0) {
        const defaultPassword = process.env.INITIAL_ADMIN_PASSWORD || "admin123";
        const hashedPassword = await bcrypt.hash(defaultPassword, 10);
        const defaultAdmin = userRepo.create({
          email: "admin@vivicbt.com",
          password: hashedPassword,
          displayName: "System Master",
          role: "super_admin",
        });
        await userRepo.save(defaultAdmin);

        if (config.NODE_ENV === "production" && defaultPassword === "admin123") {
          logger.warn("⚠️ SECURITY RISK: Default admin created with insecure password 'admin123'. Change this immediately!");
        } else {
          logger.info(`Default Admin created: admin@vivicbt.com / ${defaultPassword}`);
        }
      }
    }

    let redisRetries = 0;
    while (redisRetries < maxRetries) {
      try {
        await redisClient.connect();
        logger.info("Connected to Redis");
        break;
      } catch (err: any) {
        redisRetries++;
        logger.error(`Failed to connect to Redis (Attempt ${redisRetries}/${maxRetries}):`, err.message);
        if (redisRetries >= maxRetries) break;
        await new Promise(res => setTimeout(res, 5000));
      }
    }

    app.get("/", (req, res) => {
      res.send("CBT Backend is running");
    });

    app.get("/health", (req, res) => {
      res.status(200).json({ status: "ok", postgres: postgresConnected });
    });

    io.on("connection", (socket) => {
      logger.debug(`A user connected: ${socket.id}`);
      socket.on("disconnect", () => {
        logger.debug("User disconnected");
      });
    });

    const shutdown = async () => {
      logger.info("Shutdown signal received. Closing connections...");
      server.close(async () => {
        logger.info("HTTP server closed.");
        if (postgresConnected) {
          await AppDataSource.destroy();
          logger.info("Postgres connection closed.");
        }
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
