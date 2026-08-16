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
import { Subject } from "./entities/Subject";
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

// 0. Emergency Health Check (Bypass all middleware)
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "alive",
    port: config.PORT,
    db: AppDataSource.isInitialized
  });
});

app.get("/", (req, res) => res.send("VIVI CBT API - ONLINE"));

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
app.use("/candidates", candidateRoutes);
app.use("/subjects", subjectRoutes);

// Global Error Handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error(`Unhandled Error: ${err.message}`);
  res.status(err.status || 500).json({
    message: "Internal Server Error",
    error: err.message
  });
});

async function startServer() {
  const PORT = config.PORT || 5000;

  // 1. Start listening immediately
  const server = httpServer.listen(PORT, "0.0.0.0", () => {
    logger.info(`🚀 Server is live on port ${PORT}`);
    console.log(`RENDER_PORT_SCAN_MATCH: ${PORT}`); // Explicit log for Render
  });

  server.on('error', (error: any) => {
    logger.error("Server listen error:", error);
    if (error.code === 'EADDRINUSE') {
      logger.error(`Port ${PORT} is already in use.`);
    }
  });

  try {
    const maxRetries = 5;
    let retries = 0;
// ... (rest of the function stays same)

    // 2. Connect to Postgres in the background
    while (retries < maxRetries) {
      try {
        await AppDataSource.initialize();
        logger.info("Connected to Postgres");

        // Seed logic (only after DB is ready)
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
          logger.info("Default Admin created.");
        }

        // Seed Subjects
        try {
          const subjectRepo = AppDataSource.getRepository(Subject);
          const defaults = ["English Language", "Mathematics", "Physics", "Chemistry", "Biology", "Economics", "Government"];
          for (const name of defaults) {
            const existing = await subjectRepo.findOneBy({ name });
            if (!existing) await subjectRepo.save(subjectRepo.create({ name, isActive: true }));
          }
          logger.info("Curriculum synchronization complete.");
        } catch (sErr) { logger.error("Subject seed error"); }

        break;
      } catch (error: any) {
        retries++;
        logger.error(`Failed to connect to Postgres (Attempt ${retries}/${maxRetries}): ${error.message}`);
        if (retries >= maxRetries) break;
        await new Promise(res => setTimeout(res, 5000));
      }
    }

    // 3. Connect to Redis in the background
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
        if (AppDataSource.isInitialized) {
          await AppDataSource.destroy();
          logger.info("Postgres connection closed.");
        }
        if (redisClient.isOpen) {
          await redisClient.disconnect();
          logger.info("Redis connection closed.");
        }
        process.exit(0);
      });
    };

    process.on("SIGINT", shutdown);
    process.on("SIGTERM", shutdown);

  } catch (error) {
    logger.error("Failed to initialize backend services", error);
  }
}

startServer();
