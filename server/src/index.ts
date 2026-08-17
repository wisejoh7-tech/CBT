import "reflect-metadata";
import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";
import helmet from "helmet";
import bcrypt from "bcryptjs";
import { User } from "./entities/User";
import { Subject } from "./entities/Subject";
import authRoutes from "./routes/auth";
import examRoutes from "./routes/exam";
import analyticsRoutes from "./routes/analytics";
import centerRoutes from "./routes/center";
import candidateRoutes from "./routes/candidate";
import subjectRoutes from "./routes/subject";

import { ipBlocker } from "./middleware/ip-blocker";
import { automationEngine } from "./lib/automation-engine";
import { AppDataSource } from "./data-source";
import { config } from "./lib/config";
import { redisClient } from "./lib/services";

const app = express();
const httpServer = createServer(app);
const PORT = Number(process.env.PORT) || 5001;

// --- 1. IMMEDIATE PORT BINDING (Render Requirement) ---
httpServer.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 DEPLOYMENT STATUS: Port ${PORT} is now OPEN and listening.`);
  console.log(`[BOOT] Environment: ${process.env.NODE_ENV || 'development'}`);
}).on('error', (err: any) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`\n❌ ERROR: Port ${PORT} is already in use!`);
    console.error(`💡 FIX: Run 'stop-process -Id (Get-NetTCPConnection -LocalPort ${PORT}).OwningProcess -Force' in PowerShell\n`);
    process.exit(1);
  }
});

// --- 2. PRIORITY ROUTES (Bypass all middleware) ---
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "alive",
    port: PORT,
    database: AppDataSource.isInitialized ? "connected" : "connecting",
    redis: redisClient.isOpen ? "connected" : "fallback_mode"
  });
});

app.get("/", (req, res) => res.send("VIVI CBT API - ONLINE"));

// --- 3. MIDDLEWARE & SECURITY ---
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({ origin: "*" }));
app.use(express.json());
app.use(ipBlocker);

// Database availability middleware
app.use((req, res, next) => {
  const dbIgnoredPaths = ["/health", "/"];
  if (!AppDataSource.isInitialized && !dbIgnoredPaths.includes(req.path)) {
    return res.status(503).json({
      message: "System initializing. Please wait a moment...",
      retryAfter: 5
    });
  }
  next();
});

// --- 4. APPLICATION ROUTES ---
app.use("/auth", authRoutes);
app.use("/exams", examRoutes);
app.use("/analytics", analyticsRoutes);
app.use("/center", centerRoutes);
app.use("/candidates", candidateRoutes);
app.use("/subjects", subjectRoutes);

// --- 5. BACKGROUND SERVICE INITIALIZATION ---
async function initializeServices() {
  console.log("[BOOT] Starting background service connections...");

  try {
    // Database Connection
    let dbRetries = 0;
    while (dbRetries < 5) {
      try {
        await AppDataSource.initialize();
        console.log("✅ Postgres Connected Successfully.");

        // Seed Default Admin
        const userRepo = AppDataSource.getRepository(User);
        if (await userRepo.count() === 0) {
          const hashedPassword = await bcrypt.hash(process.env.INITIAL_ADMIN_PASSWORD || "admin123", 10);
          await userRepo.save(userRepo.create({
            email: "admin@vivicbt.com",
            password: hashedPassword,
            displayName: "System Master",
            role: "super_admin",
          }));
          console.log("🌱 Default Admin Seeded.");
        }
        break;
      } catch (err: any) {
        dbRetries++;
        console.error(`[DB ERROR] Attempt ${dbRetries}: ${err.message}`);

        // Log the full error to see hidden properties
        console.log("[DIAGNOSTIC] Full Error Object:", JSON.stringify(err, Object.getOwnPropertyNames(err)));

        if (config.dbUrl?.includes("-a.oregon-postgres.render.com") || config.db.host?.includes("-a.oregon-postgres.render.com")) {
          console.warn("⚠️ TROUBLESHOOTING: You are using an INTERNAL Render URL. Please switch to the EXTERNAL URL in your .env file.");
        }

        if (err.message?.includes("connection timeout") || err.message?.includes("terminated unexpectedly")) {
          console.warn("⚠️ TROUBLESHOOTING: Potential Network/IP Block.");
          console.warn("👉 1. Verify your IP (105.117.7.230) is in Render dashboard -> Postgres -> Access Control.");
          console.warn("👉 2. If it still fails, try adding '0.0.0.0/0' to Render Access Control to confirm connectivity.");
        }

        if (dbRetries < 5) await new Promise(r => setTimeout(r, 5000));
      }
    }

    // Redis Connection
    const isRedisConnected = await redisClient.connect();
    if (isRedisConnected) {
      console.log("✅ Redis Connected.");
    } else {
      console.warn("⚠️ Redis unavailable, using Memory Fallback.");
    }

    // Socket.io Setup
    const io = new Server(httpServer, { cors: { origin: "*" } });
    app.set("io", io);
    automationEngine.setSocketIO(io);

    io.on("connection", (socket) => {
      socket.on("disconnect", () => {});
    });

  } catch (criticalError) {
    console.error("FATAL: Background initialization failed", criticalError);
  }
}

initializeServices();

// Global Error Handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(`Runtime Error: ${err.message}`);
  res.status(err.status || 500).json({ message: "Internal Server Error" });
});
