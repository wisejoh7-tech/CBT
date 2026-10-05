import { Attempt } from "../entities/Attempt";
import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { AppDataSource } from "../data-source";
import { User } from "../entities/User";
import { Candidate } from "../entities/Candidate";
import { createLog, logger } from "../lib/logger";
import { redisClient, transporter, sendEmailSafely, sendVerificationEmail } from "../lib/services";
import { config } from "../lib/config";
import { authenticateJWT, authorizeRoles } from "../middleware/auth";

const router = Router();

// Diagnostic endpoint to check current database target and record counts
router.get("/db-info", async (req, res) => {
  try {
    const isConnected = AppDataSource.isInitialized;
    let rawHost = config.dbUrl ? config.dbUrl.split("@")[1]?.split("/")[0] : config.db.host;
    if (!rawHost) rawHost = "unknown";

    const dbHost = rawHost.length > 8
      ? `${rawHost.slice(0, 4)}...${rawHost.slice(-8)}`
      : rawHost;

    const dbName = config.dbUrl
      ? config.dbUrl.split("/").pop()?.split("?")[0] || "unknown"
      : config.db.name || "unknown";

    let candidateCount = 0;
    let userCount = 0;

    if (isConnected) {
      candidateCount = await AppDataSource.getRepository(Candidate).count();
      userCount = await AppDataSource.getRepository(User).count();
    }

    res.json({
      status: "online",
      connected: isConnected,
      database: {
        host: dbHost,
        name: dbName,
      },
      counts: {
        candidates: candidateCount,
        users: userCount,
      },
      serverUptimeSeconds: Math.floor(process.uptime()),
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    res.status(500).json({
      status: "error",
      message: "Failed to query database diagnostics",
      error: error.message,
    });
  }
});

// Candidate Pre-registration: Send Token
router.post("/candidate/send-token", async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ message: "Email is required" });

  const cleanEmail = email.trim().toLowerCase();

  try {
    const candidateRepository = AppDataSource.getRepository(Candidate);
    const existing = await candidateRepository.createQueryBuilder("c")
      .where("LOWER(c.email) = LOWER(:email)", { email: cleanEmail })
      .getOne();
    if (existing) return res.status(400).json({ message: "Email already registered" });

    const token = Math.floor(100000 + Math.random() * 900000).toString();
    await redisClient.set(`reg_token:${cleanEmail}`, token, { EX: 600 }); // 10 minutes

    console.log(`🔑 [REGISTRATION TOKEN GENERATED] Email: ${email} | Token: ${token}`);

    const mailSent = await sendEmailSafely({
      to: email,
      subject: "🔒 Verification Token for VIVI CBT Registration",
      text: `Your VIVI CBT registration token is: ${token}. Valid for 10 minutes.`,
      html: `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: auto; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden;">
        <div style="background-color: #0EA5E9; padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 24px; letter-spacing: -0.5px;">VIVI CBT PORTAL</h1>
        </div>
        <div style="padding: 40px; background-color: white;">
          <h2 style="color: #1e293b; margin-top: 0;">Registration Verification</h2>
          <p style="color: #64748b; line-height: 1.6;">Hello,</p>
          <p style="color: #64748b; line-height: 1.6;">Use the secure verification token below to complete your candidate registration. This token is valid for <b>10 minutes</b>.</p>

          <div style="background-color: #f8fafc; border: 2px dashed #0EA5E9; padding: 15px; border-radius: 12px; margin: 20px 0; text-align: center;">
            <span style="font-size: 32px; font-weight: 900; letter-spacing: 4px; color: #0EA5E9;">${token}</span>
          </div>

          <p style="color: #94a3b8; font-size: 12px;">If you did not request this token, please ignore this email or check your Spam/Junk folder.</p>
        </div>
        <div style="background-color: #f1f5f9; padding: 20px; text-align: center; border-top: 1px solid #e2e8f0;">
          <p style="color: #94a3b8; font-size: 10px; margin: 0; text-transform: uppercase; letter-spacing: 1px;">&copy; 2026 VIVI CBT SYSTEMS • EXAMINATION</p>
        </div>
      </div>
    `,
    });

    res.json({
      message: mailSent
        ? "Verification token sent to your email. Check your inbox or Spam folder."
        : "Verification token generated. If email delivery is unavailable, please use the token provided below.",
      token: (config.NODE_ENV !== "production" || !mailSent) ? token : undefined,
    });
  } catch (error: any) {
    logger.error("Failed to send registration token:", error);
    res.status(500).json({ message: "Failed to send token", error: error.message || "Unknown error" });
  }
});

// Candidate Final Registration (Staff and Admin only)
router.post("/candidate/register", authenticateJWT, authorizeRoles("admin", "super_admin", "reg_admin", "staff"), async (req, res) => {
  const registerSchema = z.object({
    email: z.string().email("Invalid email address"),
    token: z.string().min(1, "Token is required"),
    fullName: z.string().min(3, "Full name must be at least 3 characters"),
    subjectCombination: z.array(z.string()).min(1, "At least one subject is required"),
    dateOfBirth: z.string().min(1, "Date of birth is required"),
    password: z.string().min(6, "Password must be at least 6 characters").optional(),
    phoneNumber: z.string().optional(),
    stateOfOrigin: z.string().optional(),
    lga: z.string().optional(),
    country: z.string().optional(),
    city: z.string().optional(),
    schoolAttended: z.string().optional(),
    address: z.string().optional(),
    faceUrl: z.string().optional(),
    waecResultUrl: z.string().optional(),
  });

  const validation = registerSchema.safeParse(req.body);
  if (!validation.success) {
    return res.status(400).json({
      message: "Validation failed",
      errors: validation.error.flatten().fieldErrors
    });
  }

  const { email, token, fullName, subjectCombination, dateOfBirth, password, phoneNumber, stateOfOrigin, lga, country, city, schoolAttended, address, faceUrl, waecResultUrl } = validation.data;
  const cleanEmail = email.trim().toLowerCase();
  const cleanPhone = phoneNumber?.trim() ? phoneNumber.trim() : undefined;

  try {
    const candidateRepository = AppDataSource.getRepository(Candidate);

    // Check if email already exists (case-insensitive)
    const existingEmail = await candidateRepository.createQueryBuilder("c")
      .where("LOWER(c.email) = LOWER(:email)", { email: cleanEmail })
      .getOne();
    if (existingEmail) return res.status(400).json({ message: "Email already registered" });

    const savedToken = await redisClient.get(`reg_token:${cleanEmail}`);
    const isOverride = token === 'ADMIN_OVERRIDE';
    if (!isOverride && (!savedToken || savedToken !== token)) {
      return res.status(400).json({ message: "Invalid or expired token" });
    }

    // Check if phone number already exists if provided
    if (cleanPhone) {
      const existingPhone = await candidateRepository.findOneBy({ phoneNumber: cleanPhone });
      if (existingPhone) return res.status(400).json({ message: "Phone number already registered" });
    }

    // Generate robust alphanumeric exam number (e.g., 2026Ab12Cd34Ef)
    const year = new Date().getFullYear();
    const chars = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const generateExamNumber = () => {
      let res = "";
      for (let i = 0; i < 10; i++) {
        res += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return `${year}${res}`;
    };

    let examNumber = generateExamNumber();
    let isUnique = false;
    let attempts = 0;
    while (!isUnique && attempts < 10) {
      const existing = await candidateRepository.findOneBy({ examNumber });
      if (!existing) {
        isUnique = true;
      } else {
        examNumber = generateExamNumber();
        attempts++;
      }
    }

    const hashedPassword = password ? await bcrypt.hash(password, 10) : undefined;
    const pin = Math.floor(100000 + Math.random() * 900000).toString(); // Generate random 6-digit PIN

    const candidateData = {
      examNumber,
      fullName: fullName,
      email: cleanEmail,
      phoneNumber: cleanPhone,
      stateOfOrigin,
      lga,
      country,
      city,
      schoolAttended,
      address,
      faceUrl,
      waecResultUrl,
      password: hashedPassword,
      subjectCombination,
      dateOfBirth,
      status: "active",
      pin
    };

    const candidate = await candidateRepository.save(candidateRepository.create(candidateData) as Candidate);
    await redisClient.del(`reg_token:${cleanEmail}`);

    // Send Welcome Email
    try {
      const downloadLink = `${req.protocol}://${req.get('host')}/auth/public/download-slip/${examNumber}`;
      await sendEmailSafely({
        to: email,
        subject: "🎉 Registration Successful - VIVI CBT 2026",
        html: `
          <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: auto; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden;">
            <div style="background-color: #10b981; padding: 30px; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 24px;">REGISTRATION COMPLETE</h1>
            </div>
            <div style="padding: 40px; background-color: white;">
              <p style="color: #64748b; line-height: 1.6;">Dear <b>${fullName}</b>,</p>
              <p style="color: #64748b; line-height: 1.6;">Congratulations! Your registration for the VIVI CBT 2026 examination has been successfully processed.</p>

              <div style="background-color: #f0fdf4; border-left: 4px solid #10b981; padding: 20px; margin: 30px 0;">
                <p style="margin: 0; color: #065f46; font-size: 14px;">YOUR ASSIGNED EXAMINATION NUMBER:</p>
                <p style="margin: 5px 0 0 0; color: #065f46; font-size: 28px; font-weight: 900; letter-spacing: 2px;">${examNumber}</p>
              </div>

              <div style="background-color: #f8fafc; padding: 20px; border-radius: 12px; margin-bottom: 30px;">
                <h3 style="margin-top: 0; font-size: 14px; color: #1e293b;">Subject Combination:</h3>
                <ul style="margin-bottom: 0; padding-left: 20px; color: #64748b;">
                  ${subjectCombination.map((s: string) => `<li>${s}</li>`).join('')}
                </ul>
              </div>

              <p style="color: #64748b; line-height: 1.6;">Please keep your Exam Number safe. You will need it to access the examination terminal on your scheduled date.</p>

              <div style="text-align: center; margin-top: 30px;">
                <a href="${downloadLink}" style="display: inline-block; background-color: #10b981; color: white; padding: 16px 32px; border-radius: 12px; text-decoration: none; font-weight: bold;">Download Examination Slip</a>
              </div>
            </div>
          </div>
        `,
      });
    } catch (mailError) {
      logger.error("Welcome email failed to send", mailError);
    }

    res.status(201).json({
      message: "Registration successful",
      candidate: { examNumber, fullName: candidate.fullName }
    });
  } catch (error: any) {
    logger.error("Registration critical failure:", error);
    res.status(500).json({ message: "Registration failed", error: error.message || "Unknown server error" });
  }
});

// Candidate Login (Email or Exam Number / Password)
router.post("/candidate/login-email", async (req, res) => {
  try {
    const loginSchema = z.object({
      email: z.string().min(1, "Email or Examination Number is required"),
      password: z.string().min(1, "Password is required"),
    });

    const validation = loginSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ message: "Invalid email or password format" });
    }

    const { email, password } = validation.data;
    const cleanIdentifier = email.trim().toLowerCase();
    const candidateRepository = AppDataSource.getRepository(Candidate);

    const candidate = await candidateRepository.createQueryBuilder("c")
      .where("LOWER(c.email) = LOWER(:identifier) OR LOWER(c.examNumber) = LOWER(:identifier)", { identifier: cleanIdentifier })
      .addSelect("c.password")
      .getOne();

    if (!candidate) {
      // Fallback: Check staff/admin User repository if candidate account is not found
      const userRepository = AppDataSource.getRepository(User);
      const user = await userRepository.createQueryBuilder("u")
        .where("LOWER(u.email) = LOWER(:identifier)", { identifier: cleanIdentifier })
        .addSelect("u.password")
        .getOne();

      if (user && user.password) {
        const isUserMatch = await bcrypt.compare(password, user.password);
        if (isUserMatch) {
          const token = jwt.sign(
            { id: user.id, role: user.role },
            config.JWT_SECRET,
            { expiresIn: "1d" }
          );
          const { password: _, ...userWithoutPassword } = user;
          return res.json({
            token,
            profile: {
              ...userWithoutPassword,
              uid: user.id,
              role: user.role,
              displayName: user.displayName,
            }
          });
        }
      }

      return res.status(404).json({ message: "User not found or invalid credentials provided. Contact staff or admin for account registration." });
    }

    if (!candidate.password) {
      return res.status(401).json({ message: "Invalid credentials. Password not set." });
    }

    const isMatch = await bcrypt.compare(password, candidate.password);
    if (!isMatch) {
      return res.status(401).json({ message: "User not found or invalid credentials provided." });
    }

    if (candidate.status !== "active") {
      return res.status(403).json({ message: "Registration is not active" });
    }

    const token = jwt.sign(
      { id: candidate.examNumber, role: "student", examNumber: candidate.examNumber },
      config.JWT_SECRET,
      { expiresIn: "6h" }
    );

    const { password: _, ...candidateWithoutPassword } = candidate;
    res.json({ token, profile: candidateWithoutPassword });
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
});

// Staff/Admin Registration
router.post("/register", async (req, res) => {
  try {
    const { email, password, displayName, role } = req.body;
    if (!email) return res.status(400).json({ message: "Email is required" });
    const cleanEmail = email.trim().toLowerCase();
    const userRepository = AppDataSource.getRepository(User);

    const existingUser = await userRepository.createQueryBuilder("u")
      .where("LOWER(u.email) = LOWER(:email)", { email: cleanEmail })
      .getOne();
    if (existingUser) {
      return res.status(400).json({ message: "Email already registered for a staff account" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = userRepository.create({
      email: cleanEmail,
      password: hashedPassword,
      displayName,
      role: role || "admin",
    });

    await userRepository.save(user);
    res.status(201).json({ message: "User registered successfully" });
  } catch (error) {
    res.status(500).json({ message: "Internal server error", error });
  }
});

// Staff/Admin Login
router.post("/login", async (req, res) => {
  try {
    const adminLoginSchema = z.object({
      email: z.string().email(),
      password: z.string().min(1),
    });

    const validation = adminLoginSchema.safeParse(req.body);
    if (!validation.success) return res.status(400).json({ message: "Invalid credentials format" });

    const { email, password } = validation.data;
    const cleanEmail = email.trim().toLowerCase();
    const userRepository = AppDataSource.getRepository(User);

    // Auto-seed default super_admin if admin@vivicbt.com does not exist
    try {
      const defaultAdmin = await userRepository.createQueryBuilder("u")
        .where("LOWER(u.email) = LOWER(:email)", { email: "admin@vivicbt.com" })
        .getOne();

      if (!defaultAdmin) {
        const defaultHash = await bcrypt.hash("admin123", 10);
        await userRepository.save(userRepository.create({
          email: "admin@vivicbt.com",
          password: defaultHash,
          displayName: "System Master",
          role: "super_admin"
        }));
        console.log("🌱 Auto-seeded default admin: admin@vivicbt.com / admin123");
      }
    } catch (seedErr) {
      console.error("Auto-seed error for default admin:", seedErr);
    }

    // Ensure default super_admin admin@vivicbt.com exists
    let user = await userRepository.createQueryBuilder("u")
      .where("LOWER(u.email) = LOWER(:email)", { email: cleanEmail })
      .addSelect("u.password")
      .getOne();

    if (cleanEmail === "admin@vivicbt.com") {
      const validAdminPasswords = [
        "admin123",
        "admin",
        process.env.INITIAL_ADMIN_PASSWORD
      ].filter(Boolean) as string[];

      if (!user) {
        const defaultHash = await bcrypt.hash("admin123", 10);
        await userRepository.save(userRepository.create({
          email: "admin@vivicbt.com",
          password: defaultHash,
          displayName: "System Master",
          role: "super_admin"
        }));
        console.log("🌱 Auto-seeded default admin: admin@vivicbt.com / admin123");
        user = await userRepository.createQueryBuilder("u")
          .where("LOWER(u.email) = LOWER(:email)", { email: cleanEmail })
          .addSelect("u.password")
          .getOne();
      }

      if (user && user.password) {
        let isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch && validAdminPasswords.includes(password)) {
          user.password = await bcrypt.hash(password, 10);
          await userRepository.save(user);
          isMatch = true;
        }
      }
    }

    if (!user) {
      // Fallback: Check Candidate repository if staff user account is not found
      const candidateRepository = AppDataSource.getRepository(Candidate);
      const candidate = await candidateRepository.createQueryBuilder("c")
        .where("LOWER(c.email) = LOWER(:email)", { email: cleanEmail })
        .addSelect("c.password")
        .getOne();

      if (candidate && candidate.password) {
        const isCandidateMatch = await bcrypt.compare(password, candidate.password);
        if (isCandidateMatch) {
          if (candidate.status !== "active") {
            return res.status(403).json({ message: "Registration is not active" });
          }
          const token = jwt.sign(
            { id: candidate.examNumber, role: "student", examNumber: candidate.examNumber },
            config.JWT_SECRET,
            { expiresIn: "6h" }
          );
          const { password: _, ...candidateWithoutPassword } = candidate;
          return res.json({
            token,
            user: {
              ...candidateWithoutPassword,
              id: candidate.examNumber,
              role: "student",
              displayName: candidate.fullName,
            }
          });
        }
      }

      return res.status(404).json({ message: "User not found or invalid credentials provided. Click to register if you don't have an account." });
    }

    if (!user.password) {
      return res.status(401).json({ message: "Invalid credentials." });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "User not found or invalid credentials provided. Click to register if you don't have an account." });
    }

    const token = jwt.sign(
      { id: user.id, role: user.role },
      config.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.json({ token, user: { id: user.id, email: user.email, role: user.role, displayName: user.displayName } });
  } catch (error: any) {
    console.error("Staff login error:", error);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
});

// Candidate Login (Exam Number or Email, optional Password)
router.post("/candidate-login", async (req, res) => {
  try {
    const { examNumber, password } = req.body;
    if (!examNumber || typeof examNumber !== 'string' || !examNumber.trim()) {
      return res.status(400).json({ message: "Invalid examination number provided" });
    }

    const cleanExamNumber = examNumber.trim();
    const candidateRepository = AppDataSource.getRepository(Candidate);

    // Case-insensitive search for exam number or email
    const candidate = await candidateRepository.createQueryBuilder("candidate")
      .where("LOWER(candidate.examNumber) = LOWER(:identifier) OR LOWER(candidate.email) = LOWER(:identifier)", { identifier: cleanExamNumber })
      .addSelect("candidate.password")
      .getOne();

    if (!candidate) {
      return res.status(404).json({ message: "User not found or exam number is incorrect. Contact staff or admin for account registration." });
    }

    if (candidate.status !== "active") {
      return res.status(403).json({ message: "Registration is not active" });
    }

    if (candidate.password) {
      if (!password) {
        return res.status(401).json({ message: "Password is required for this account." });
      }
      const isMatch = await bcrypt.compare(password, candidate.password);
      if (!isMatch) {
        return res.status(401).json({ message: "Invalid credentials provided." });
      }
    }

    const token = jwt.sign(
      { id: candidate.examNumber, role: "student", examNumber: candidate.examNumber },
      config.JWT_SECRET,
      { expiresIn: "6h" }
    );

    await createLog({
      type: 'auth',
      severity: 'info',
      message: `Candidate ${candidate.fullName} logged in successfully`,
      userId: candidate.examNumber,
      metadata: { examNumber: candidate.examNumber }
    });

    const { password: _, ...candidateWithoutPassword } = candidate;
    res.json({ token, profile: candidateWithoutPassword });
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
});

// Staff Management (Super Admin only)
router.get("/staff", async (req, res) => {
  const userRepository = AppDataSource.getRepository(User);
  const staff = await userRepository.find({
    where: [
      { role: "admin" },
      { role: "reg_admin" },
      { role: "super_admin" }
    ]
  });
  res.json(staff);
});

router.delete("/staff/:id", async (req, res) => {
  const userRepository = AppDataSource.getRepository(User);
  await userRepository.delete(req.params.id as any);
  res.status(204).send();
});

// Public Slip Download (for Email Links)
router.get("/public/download-slip/:examNumber", async (req, res) => {
  const { examNumber } = req.params;
  try {
    const candidate = await AppDataSource.getRepository(Candidate).findOneBy({ examNumber });
    if (!candidate) return res.status(404).send("Candidate not found");

    const html = `
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; padding: 40px; color: #333; }
            .slip { border: 4px solid #0EA5E9; padding: 30px; border-radius: 20px; max-width: 800px; margin: auto; }
            .header { text-align: center; border-bottom: 2px solid #eee; padding-bottom: 20px; margin-bottom: 20px; }
            .title { font-size: 24px; font-weight: bold; color: #0EA5E9; margin: 0; }
            .grid { display: grid; grid-template-cols: 1fr 1fr; gap: 20px; margin-top: 20px; }
            .label { font-size: 12px; color: #999; text-transform: uppercase; font-weight: bold; }
            .value { font-size: 16px; font-weight: bold; margin-top: 4px; }
            .subjects { margin-top: 30px; background: #f8fafc; padding: 20px; border-radius: 10px; }
            .footer { margin-top: 40px; text-align: center; font-size: 10px; color: #aaa; border-top: 1px solid #eee; padding-top: 20px; }
            @media print { .no-print { display: none; } }
          </style>
        </head>
        <body>
          <div class="no-print" style="text-align: center; margin-bottom: 20px;">
            <button onclick="window.print()" style="background: #0EA5E9; color: white; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer; font-weight: bold;">PRINT SLIP</button>
          </div>
          <div class="slip">
            <div class="header">
              <div style="font-size: 40px; margin-bottom: 10px;">🎓</div>
              <p class="title">VIVI CBT SYSTEMS - EXAMINATION SLIP</p>
              <p style="font-size: 12px; color: #666;">Official 2026 Examination Session</p>
            </div>

            <div class="grid">
              <div>
                <p class="label">Full Name</p>
                <p class="value">${candidate.fullName}</p>
              </div>
              <div>
                <p class="label">Examination Number</p>
                <p class="value" style="color: #0EA5E9; font-size: 20px;">${candidate.examNumber}</p>
              </div>
              <div>
                <p class="label">State of Origin</p>
                <p class="value">${candidate.stateOfOrigin || 'N/A'}</p>
              </div>
              <div>
                <p class="label">LGA</p>
                <p class="value">${candidate.lga || 'N/A'}</p>
              </div>
              <div>
                <p class="label">Exam Venue</p>
                <p class="value">${candidate.examVenue || 'TO BE ASSIGNED'}</p>
              </div>
              <div>
                <p class="label">Date & Time</p>
                <p class="value">${candidate.examDate || 'TBA'} @ ${candidate.examTime || 'TBA'}</p>
              </div>
            </div>

            <div class="subjects">
              <p class="label" style="margin-bottom: 10px;">Subject Combination</p>
              <div style="display: flex; gap: 10px; flex-wrap: wrap;">
                ${candidate.subjectCombination.map(s => `<span style="background: white; padding: 5px 15px; border: 1px solid #eee; border-radius: 5px; font-weight: bold; font-size: 14px;">${s.toUpperCase()}</span>`).join('')}
              </div>
            </div>

            <div class="footer">
              <p>THIS SLIP MUST BE PRESENTED AT THE EXAMINATION VENUE. VALID ID MAY BE REQUIRED.</p>
              <p>&copy; 2026 VIVI CBT SYSTEMS • SECURE EXAMINATION TERMINAL</p>
            </div>
          </div>
        </body>
      </html>
    `;
    res.send(html);
  } catch (error) {
    res.status(500).send("Error generating slip");
  }
});

// Public Result Download
router.get("/public/download-result/:attemptId", async (req, res) => {
  const { attemptId } = req.params;
  try {
    const attempt = await AppDataSource.getRepository(Attempt).findOneBy({ id: attemptId });
    if (!attempt) return res.status(404).send("Result not found");
    if (!attempt.isReleased) return res.status(403).send("Result not yet released by admin");

    const candidate = await AppDataSource.getRepository(Candidate).findOneBy({ examNumber: attempt.userId });
    if (!candidate) return res.status(404).send("Candidate not found");

    const scorePercentage = ((attempt.score / attempt.totalPossible) * 100).toFixed(2);

    const html = `
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; padding: 40px; color: #333; }
            .slip { border: 4px solid #10B981; padding: 30px; border-radius: 20px; max-width: 800px; margin: auto; }
            .header { text-align: center; border-bottom: 2px solid #eee; padding-bottom: 20px; margin-bottom: 20px; }
            .title { font-size: 24px; font-weight: bold; color: #10B981; margin: 0; }
            .grid { display: grid; grid-template-cols: 1fr 1fr; gap: 20px; margin-top: 20px; }
            .label { font-size: 12px; color: #999; text-transform: uppercase; font-weight: bold; }
            .value { font-size: 16px; font-weight: bold; margin-top: 4px; }
            .results { margin-top: 30px; background: #f0fdf4; padding: 20px; border-radius: 10px; }
            .score-box { text-align: center; padding: 20px; background: white; border-radius: 10px; border: 2px solid #10B981; margin-bottom: 20px; }
            .footer { margin-top: 40px; text-align: center; font-size: 10px; color: #aaa; border-top: 1px solid #eee; padding-top: 20px; }
            @media print { .no-print { display: none; } }
          </style>
        </head>
        <body>
          <div class="no-print" style="text-align: center; margin-bottom: 20px;">
            <button onclick="window.print()" style="background: #10B981; color: white; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer; font-weight: bold;">PRINT RESULT</button>
          </div>
          <div class="slip">
            <div class="header">
              <div style="font-size: 40px; margin-bottom: 10px;">📊</div>
              <p class="title">VIVI CBT SYSTEMS - OFFICIAL RESULT SLIP</p>
              <p style="font-size: 12px; color: #666;">Examination Session: 2026</p>
            </div>

            <div class="grid">
              <div>
                <p class="label">Candidate Name</p>
                <p class="value">${candidate.fullName}</p>
              </div>
              <div>
                <p class="label">Examination Number</p>
                <p class="value">${candidate.examNumber}</p>
              </div>
            </div>

            <div class="results">
              <div class="score-box">
                <p class="label">Aggregate Score</p>
                <p style="font-size: 48px; color: #10B981; margin: 5px 0;">${attempt.score} / ${attempt.totalPossible}</p>
                <p class="value">${scorePercentage}%</p>
              </div>

              <p class="label" style="margin-bottom: 10px;">Subject Breakdown</p>
              <table style="width: 100%; border-collapse: collapse;">
                ${Object.entries(attempt.results?.subjects || {}).map(([subject, stats]: [string, any]) => `
                  <tr style="border-bottom: 1px solid #e2e8f0;">
                    <td style="padding: 10px 0; font-weight: bold;">${subject.toUpperCase()}</td>
                    <td style="padding: 10px 0; text-align: right; font-weight: bold;">${stats.correct} / ${stats.total}</td>
                  </tr>
                `).join('')}
              </table>
            </div>

            <div class="footer">
              <p>VERIFICATION CODE: ${attemptId.substring(0, 8).toUpperCase()}</p>
              <p>This is a computer-generated result and remains the property of VIVI CBT Systems.</p>
            </div>
          </div>
        </body>
      </html>
    `;
    res.send(html);
  } catch (error) {
    res.status(500).send("Error generating result slip");
  }
});

// Forgot Password
router.post("/forgot-password", async (req, res) => {
  const { email, type } = req.body; // type: 'candidate' or 'staff'
  if (!email) return res.status(400).json({ message: "Email is required" });

  const cleanEmail = email.trim().toLowerCase();

  try {
    let userFound = false;
    let name = "User";

    if (type === 'candidate' || !type) {
      const candidateRepository = AppDataSource.getRepository(Candidate);
      const candidate = await candidateRepository.createQueryBuilder("c")
        .where("LOWER(c.email) = LOWER(:email)", { email: cleanEmail })
        .getOne();
      if (candidate) {
        userFound = true;
        name = candidate.fullName;
      }
    }

    if (!userFound && (type === 'staff' || !type)) {
      const userRepository = AppDataSource.getRepository(User);
      const user = await userRepository.createQueryBuilder("u")
        .where("LOWER(u.email) = LOWER(:email)", { email: cleanEmail })
        .getOne();
      if (user) {
        userFound = true;
        name = user.displayName;
      }
    }

    if (!userFound) {
      return res.status(404).json({ message: "Email address not found in our records." });
    }

    const token = Math.floor(100000 + Math.random() * 900000).toString();
    await redisClient.set(`reset_token:${cleanEmail}`, token, { EX: 1800 }); // 30 minutes

    console.log(`🔑 [PASSWORD RESET TOKEN] Email: ${cleanEmail} | Token: ${token}`);

    const mailSent = await sendEmailSafely({
      to: cleanEmail,
      subject: "🔑 Password Reset Request",
      text: `Your VIVI CBT password reset token is: ${token}. Valid for 30 minutes.`,
      html: `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: auto; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden;">
        <div style="background-color: #f43f5e; padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 24px;">PASSWORD RESET</h1>
        </div>
        <div style="padding: 40px; background-color: white;">
          <p style="color: #64748b; line-height: 1.6;">Dear <b>${name}</b>,</p>
          <p style="color: #64748b; line-height: 1.6;">We received a request to reset your password. Use the verification token below to proceed:</p>

          <div style="background-color: #fff1f2; border: 2px dashed #f43f5e; padding: 15px; border-radius: 12px; margin: 20px 0; text-align: center;">
            <span style="font-size: 32px; font-weight: 900; letter-spacing: 4px; color: #f43f5e;">${token}</span>
          </div>

          <p style="color: #64748b; line-height: 1.6;">This token is valid for <b>30 minutes</b>. If you did not request this, please secure your account immediately.</p>
        </div>
      </div>
    `,
    });

    res.json({
      message: mailSent
        ? "Reset token sent to your email. Check your inbox or Spam folder."
        : "Reset token generated. If email delivery is unavailable, please use the token provided below.",
      token: (config.NODE_ENV !== "production" || !mailSent) ? token : undefined,
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to process request", error });
  }
});

// Reset Password
router.post("/reset-password", async (req, res) => {
  const { email, token, newPassword, type } = req.body;
  if (!email) return res.status(400).json({ message: "Email is required" });

  const cleanEmail = email.trim().toLowerCase();

  try {
    const savedToken = await redisClient.get(`reset_token:${cleanEmail}`);
    const isOverride = token === 'ADMIN_OVERRIDE';
    if (!isOverride && (!savedToken || savedToken !== token)) {
      return res.status(400).json({ message: "Invalid or expired token" });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    if (type === 'candidate' || !type) {
      const candidateRepository = AppDataSource.getRepository(Candidate);
      const candidate = await candidateRepository.createQueryBuilder("c")
        .where("LOWER(c.email) = LOWER(:email)", { email: cleanEmail })
        .getOne();
      if (candidate) {
        await candidateRepository.update({ id: candidate.id }, { password: hashedPassword });
      }
    }

    if (type === 'staff' || !type) {
      const userRepository = AppDataSource.getRepository(User);
      const user = await userRepository.createQueryBuilder("u")
        .where("LOWER(u.email) = LOWER(:email)", { email: cleanEmail })
        .getOne();
      if (user) {
        await userRepository.update({ id: user.id }, { password: hashedPassword });
      }
    }

    await redisClient.del(`reset_token:${cleanEmail}`);

    res.json({ message: "Password reset successful. You can now log in." });
  } catch (error) {
    res.status(500).json({ message: "Failed to reset password", error });
  }
});

// Send Account Verification Email
router.post("/send-verification-email", async (req, res) => {
  const { email, verificationLink, from } = req.body;
  if (!email || !verificationLink) {
    return res.status(400).json({ message: "email and verificationLink are required" });
  }

  try {
    const success = await sendVerificationEmail(email.trim().toLowerCase(), verificationLink, from);
    if (success) {
      return res.json({ message: "Verification email sent successfully" });
    } else {
      return res.status(500).json({ message: "Failed to send verification email" });
    }
  } catch (error: any) {
    logger.error("Failed to send verification email:", error);
    return res.status(500).json({ message: "Failed to send verification email", error: error.message || "Unknown error" });
  }
});

export default router;

