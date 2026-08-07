import "reflect-metadata";
import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import { createClient } from "redis";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import nodemailer from "nodemailer";
import bcrypt from "bcryptjs";
import { User } from "./entities/User";
import { Candidate } from "./entities/Candidate";
import authRoutes from "./routes/auth";
import examRoutes from "./routes/exam";
import analyticsRoutes from "./routes/analytics";
import centerRoutes from "./routes/center";
import candidateRoutes from "./routes/candidate";
import { authenticateJWT, authorizeRoles } from "./middleware/auth";
import { AppDataSource } from "./data-source";
import { logger } from "./lib/logger";
import { config } from "./lib/config";
import { redisClient, transporter } from "./lib/services";

export { AppDataSource };

const app = express();
app.use(helmet());

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
});
app.use("/auth/", limiter);

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: config.NODE_ENV === "production" ? "https://cbt.vivi.com.ng" : "*",
  },
});
app.set("io", io);

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
        role: "super_admin"
      });
      await userRepo.save(defaultAdmin);
      logger.info("Default Admin created: admin@vivicbt.com / admin123");
    }

    await redisClient.connect();
    logger.info("Connected to Redis");

    app.get("/", (req, res) => {
      res.send("CBT Backend is running");
    });

    // Get active exam sessions from Redis
    app.get("/active-sessions", authenticateJWT, authorizeRoles("admin", "super_admin"), async (req, res) => {
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
        logger.error("Failed to fetch active sessions", error);
        res.status(500).json({ error: "Failed to fetch active sessions" });
      }
    });

    // Candidate Management
    app.get("/candidates", authenticateJWT, authorizeRoles("admin", "super_admin", "reg_admin"), async (req, res) => {
      const candidates = await AppDataSource.getRepository(Candidate).find();
      res.json(candidates);
    });

    app.post("/candidates/bulk", authenticateJWT, authorizeRoles("admin", "super_admin", "reg_admin"), async (req, res) => {
      try {
        const candidateRepo = AppDataSource.getRepository(Candidate);
        const candidates = candidateRepo.create(req.body as any[]);
        await candidateRepo.save(candidates);
        res.status(201).json({ message: `Successfully registered ${candidates.length} candidates` });
      } catch (error) {
        logger.error("Bulk upload failed", error);
        res.status(400).json({ error: "Bulk upload failed" });
      }
    });

    app.post("/candidates", authenticateJWT, authorizeRoles("admin", "super_admin", "reg_admin"), async (req, res) => {
      try {
        const candidateRepo = AppDataSource.getRepository(Candidate);
        const data = req.body;

        // Auto-generate alphanumeric exam number if not provided
        if (!data.examNumber) {
          const chars = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
          let randomPart = "";
          for (let i = 0; i < 6; i++) {
            randomPart += chars.charAt(Math.floor(Math.random() * chars.length));
          }
          data.examNumber = `${new Date().getFullYear()}${randomPart}`;
        }

        // Hash password if provided
        if (data.password) {
          data.password = await bcrypt.hash(data.password, 10);
        }

        const candidate = candidateRepo.create(data);
        await candidateRepo.save(candidate);
        res.status(201).json(candidate);
      } catch (error: any) {
        logger.error("Failed to create candidate", error);
        res.status(400).json({ error: error.message || "Failed to create candidate" });
      }
    });

    app.delete("/candidates/:examNumber", authenticateJWT, authorizeRoles("admin", "super_admin"), async (req, res) => {
      await AppDataSource.getRepository(Candidate).delete(req.params.examNumber as any);
      res.status(204).send();
    });

    app.put("/candidates/:examNumber/waec", authenticateJWT, async (req, res) => {
      try {
        const { waecResultUrl } = req.body;
        const candidateRepo = AppDataSource.getRepository(Candidate);
        await candidateRepo.update(req.params.examNumber, { waecResultUrl });
        res.json({ message: "WAEC result updated successfully" });
      } catch (error) {
        res.status(500).json({ error: "Failed to update WAEC result" });
      }
    });

    // Email Notification Endpoint
    app.post("/notify-result", authenticateJWT, authorizeRoles("admin", "super_admin"), async (req, res) => {
      const { email, candidateName, examNumber, pin, totalScore } = req.body;

      if (!email) {
        return res.status(400).json({ error: "Email is required" });
      }

      try {
        const mailOptions = {
          from: `"VIVI CBT Examination Board" <${config.MAIL_USER}>`,
          to: email,
          subject: "📄 Official Result Notification - 2026 Session",
          html: `
            <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 650px; margin: auto; border: 2px solid #e2e8f0; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);">
              <div style="background: linear-gradient(135deg, #0EA5E9 0%, #2563EB 100%); padding: 40px; text-align: center; color: white;">
                <div style="background: rgba(255,255,255,0.2); width: 60px; height: 60px; border-radius: 15px; display: flex; align-items: center; justify-content: center; margin: 0 auto 20px auto; font-size: 30px; font-weight: bold;">V</div>
                <h1 style="margin: 0; font-size: 24px; letter-spacing: 1px; text-transform: uppercase;">Official Result Release</h1>
                <p style="margin: 10px 0 0 0; opacity: 0.8; font-size: 14px;">VIVI Computer Based Testing Management System</p>
              </div>
              <div style="padding: 40px; background-color: white;">
                <p style="color: #1e293b; font-size: 16px;">Dear <b>${candidateName}</b>,</p>
                <p style="color: #64748b; line-height: 1.6;">Your examination performance for the 2026 session has been processed and is now available for viewing. Below is your aggregate summary:</p>
                <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 16px; padding: 25px; margin: 30px 0;">
                  <table style="width: 100%; border-collapse: collapse;">
                    <tr>
                      <td style="padding-bottom: 10px; color: #94a3b8; font-size: 12px; text-transform: uppercase;">Registration Number</td>
                      <td style="padding-bottom: 10px; color: #1e293b; font-weight: bold; text-align: right;">${examNumber}</td>
                    </tr>
                    <tr>
                      <td style="padding-bottom: 10px; color: #94a3b8; font-size: 12px; text-transform: uppercase;">Access PIN</td>
                      <td style="padding-bottom: 10px; color: #1e293b; font-weight: bold; text-align: right;">${pin}</td>
                    </tr>
                    <tr style="border-top: 1px solid #e2e8f0;">
                      <td style="padding-top: 15px; color: #0EA5E9; font-weight: 900; font-size: 18px;">AGGREGATE SCORE</td>
                      <td style="padding-top: 15px; color: #0EA5E9; font-weight: 900; font-size: 32px; text-align: right;">${totalScore}</td>
                    </tr>
                  </table>
                </div>
                <div style="text-align: center; margin-top: 40px;">
                  <p style="color: #64748b; font-size: 14px; margin-bottom: 20px;">To view your full subject breakdown and download your result slip, please visit our portal:</p>
                  <a href="#" style="display: inline-block; background-color: #0EA5E9; color: white; padding: 18px 40px; border-radius: 14px; text-decoration: none; font-weight: 900; letter-spacing: 1px; text-transform: uppercase; font-size: 14px; box-shadow: 0 4px 6px -1px rgba(14, 165, 233, 0.3);">Check Full Result</a>
                </div>
              </div>
              <div style="background-color: #f1f5f9; padding: 30px; text-align: center;">
                <p style="color: #94a3b8; font-size: 12px; line-height: 1.5; margin: 0;">
                  <b>Security Notice:</b> This is a secure system-generated document. <br/>
                  If you suspect any discrepancy in your result, please visit our nearest center.
                </p>
              </div>
            </div>
          `,
        };

        await transporter.sendMail(mailOptions);
        res.json({ message: "Notification sent successfully" });
      } catch (error) {
        logger.error("Email error:", error);
        res.status(500).json({ error: "Failed to send email notification" });
      }
    });

    // Example Socket.io logic with Redis for real-time state
    io.on("connection", (socket) => {
      logger.debug(`A user connected: ${socket.id}`);

      socket.on("join-exam", async (examId) => {
        socket.join(examId);
      });

      socket.on("update-progress", async (data) => {
        const { userId, examId, progress } = data;
        await redisClient.set(`exam_progress:${userId}:${examId}`, JSON.stringify(progress), {
          EX: 3600,
        });
        io.to(examId).emit("progress-updated", { userId, progress });
      });

      socket.on("send-message", (data) => {
        const { to, message, from, fromName } = data;
        if (to === 'admin') {
          io.to('admin-room').emit('new-message', { from, fromName, message, timestamp: new Date() });
        } else {
          io.to(to).emit('new-message', { from: 'admin', fromName: 'Proctor', message, timestamp: new Date() });
        }
      });

      socket.on("join-admin", () => {
        socket.join('admin-room');
      });

      socket.on("join-candidate-chat", (userId) => {
        socket.join(userId);
      });

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
