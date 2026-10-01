console.log("SERVER STARTING...");
import "reflect-metadata";

// Prevent unhandled network/DNS promise rejections from crashing the process
process.on('unhandledRejection', (reason: any) => {
  console.warn('[SYSTEM WARN] Unhandled Promise Rejection:', reason?.message || reason);
});

process.on('uncaughtException', (err: any) => {
  console.warn('[SYSTEM WARN] Uncaught Exception:', err?.message || err);
});

import express from "express";
import { createServer } from "http";
import fs from "fs";
import path from "path";
import { Server } from "socket.io";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
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
const PORT = Number(process.env.PORT) || 10000;

// --- 1. IMMEDIATE PORT BINDING (Render Requirement) ---
httpServer.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`[BOOT] Environment: ${process.env.NODE_ENV || 'development'}`);
}).on('error', (err: any) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`\n❌ ERROR: Port ${PORT} is already in use!`);
    console.error(`💡 FIX: Run 'stop-process -Id (Get-NetTCPConnection -LocalPort ${PORT}).OwningProcess -Force' in PowerShell\n`);
    process.exit(1);
  }
});

// --- 2. CORS & SECURITY CONFIGURATION ---
const getCorsOrigins = (): cors.CorsOptions['origin'] => {
  const envOrigins = process.env.CORS_ORIGIN;
  if (!envOrigins || envOrigins === '*') return true;
  const origins = envOrigins.split(',').map(o => o.trim()).filter(Boolean);
  return (origin, callback) => {
    if (!origin || origins.includes(origin) || origins.includes('*')) {
      callback(null, true);
    } else {
      console.warn(`[CORS Warn] Allowing request from origin: ${origin}`);
      callback(null, true);
    }
  };
};

const corsOptions: cors.CorsOptions = {
  origin: getCorsOrigins(),
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  credentials: true,
  optionsSuccessStatus: 200,
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://apis.google.com", "https://www.gstatic.com"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com", "data:"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https:", "http:", "wss://*.onrender.com", "https://*.onrender.com", "https://*.firebaseio.com", "https://*.googleapis.com"],
      frameSrc: ["'self'", "https://*.firebaseapp.com"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: [],
    },
  },
  crossOriginResourcePolicy: { policy: "cross-origin" },
}));

// --- 3. PRIORITY ROUTES ---
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "alive",
    port: PORT,
    database: AppDataSource.isInitialized ? "connected" : "connecting",
    redis: redisClient.isOpen ? "connected" : "fallback_mode"
  });
});

app.get("/", (req, res, next) => {
  const indexPath = path.resolve(__dirname, "../../dist/index.html");
  if (fs.existsSync(indexPath)) {
    return res.sendFile(indexPath);
  }
  res.send("VIVI CBT API - ONLINE");
});
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

// --- STATIC FRONTEND ASSETS & SPA FALLBACK ---
const distPath = path.resolve(__dirname, "../../dist");

if (fs.existsSync(distPath)) {
  console.log(`[BOOT] Serving static frontend from: ${distPath}`);
  app.use(express.static(distPath));
} else {
  console.warn(`[BOOT WARN] Static frontend path not found at: ${distPath}`);
}

// Fallback to index.html for SPA client-side routes
app.get("*", (req, res, next) => {
  const isApiRoute = ["/auth", "/exams", "/analytics", "/center", "/candidates", "/subjects", "/health"].some(route => req.path.startsWith(route));
  if (isApiRoute) {
    return next();
  }
  const indexPath = path.join(distPath, "index.html");
  if (fs.existsSync(indexPath)) {
    return res.sendFile(indexPath);
  }
  res.status(404).send("Page not found");
});

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

        // Seed Default Admin if missing
        const userRepo = AppDataSource.getRepository(User);
        const defaultAdmin = await userRepo.createQueryBuilder("u")
          .where("LOWER(u.email) = LOWER(:email)", { email: "admin@vivicbt.com" })
          .getOne();
        if (!defaultAdmin) {
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
    const io = new Server(httpServer, { cors: corsOptions });

    const adapter = redisClient.getAdapter();
    if (adapter) {
      io.adapter(adapter);
      console.log("✅ Socket.io Redis Adapter Enabled.");
    }

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
