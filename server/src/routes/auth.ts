import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { AppDataSource } from "../data-source";
import { User } from "../entities/User";
import { Candidate } from "../entities/Candidate";
import { createLog, logger } from "../lib/logger";
import { redisClient, transporter } from "../index";
import { config } from "../lib/config";

const router = Router();

// Candidate Pre-registration: Send Token
router.post("/candidate/send-token", async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ message: "Email is required" });

  try {
    const candidateRepository = AppDataSource.getRepository(Candidate);
    const existing = await candidateRepository.findOneBy({ email });
    if (existing) return res.status(400).json({ message: "Email already registered" });

    const token = Math.floor(100000 + Math.random() * 900000).toString();
    await redisClient.set(`reg_token:${email}`, token, { EX: 600 }); // 10 minutes

    await transporter.sendMail({
      from: `"VIVI CBT Support" <${config.MAIL_USER}>`,
      to: email,
      subject: "🔒 Verification Token for VIVI CBT Registration",
      html: `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: auto; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden;">
          <div style="background-color: #0EA5E9; padding: 30px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 24px; letter-spacing: -0.5px;">VIVI CBT PORTAL</h1>
          </div>
          <div style="padding: 40px; background-color: white;">
            <h2 style="color: #1e293b; margin-top: 0;">Registration Verification</h2>
            <p style="color: #64748b; line-height: 1.6;">Hello,</p>
            <p style="color: #64748b; line-height: 1.6;">Use the secure verification token below to complete your candidate registration. This token is valid for <b>10 minutes</b>.</p>

            <div style="background-color: #f8fafc; border: 2px dashed #0EA5E9; padding: 20px; border-radius: 12px; margin: 30px 0; text-align: center;">
              <span style="font-size: 42px; font-weight: 900; letter-spacing: 8px; color: #0EA5E9;">${token}</span>
            </div>

            <p style="color: #94a3b8; font-size: 12px;">If you did not request this token, please ignore this email or contact support if you have concerns.</p>
          </div>
          <div style="background-color: #f1f5f9; padding: 20px; text-align: center; border-top: 1px solid #e2e8f0;">
            <p style="color: #94a3b8; font-size: 11px; margin: 0; text-transform: uppercase; letter-spacing: 1px;">&copy; 2026 VIVI CBT SYSTEMS • SECURE EXAMINATION TERMINAL</p>
          </div>
        </div>
      `,
    });

    res.json({ message: "Token sent to email" });
  } catch (error: any) {
    logger.error("Failed to send registration token:", error);
    res.status(500).json({ message: "Failed to send token", error: error.message || "Unknown error" });
  }
});

// Candidate Final Registration
router.post("/candidate/register", async (req, res) => {
  const { email, token, fullName, subjectCombination, dateOfBirth, password } = req.body;

  try {
    const savedToken = await redisClient.get(`reg_token:${email}`);
    if (!savedToken || savedToken !== token) {
      return res.status(400).json({ message: "Invalid or expired token" });
    }

    const candidateRepository = AppDataSource.getRepository(Candidate);

    // Generate alphanumeric exam number (e.g., 2026xY7z9R)
    const chars = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
    let randomPart = "";
    for (let i = 0; i < 6; i++) {
      randomPart += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    const examNumber = `${new Date().getFullYear()}${randomPart}`;

    const hashedPassword = password ? await bcrypt.hash(password, 10) : undefined;

    const candidate = candidateRepository.create({
      examNumber,
      fullName: fullName.toUpperCase(),
      email,
      password: hashedPassword,
      subjectCombination,
      dateOfBirth,
      status: "active"
    });

    await candidateRepository.save(candidate);
    await redisClient.del(`reg_token:${email}`);

    // Send Welcome Email
    try {
      await transporter.sendMail({
        from: `"VIVI CBT Support" <${config.MAIL_USER}>`,
        to: email,
        subject: "🎉 Registration Successful - VIVI CBT 2026",
        html: `
          <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: auto; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden;">
            <div style="background-color: #10b981; padding: 30px; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 24px;">REGISTRATION COMPLETE</h1>
            </div>
            <div style="padding: 40px; background-color: white;">
              <p style="color: #64748b; line-height: 1.6;">Dear <b>${fullName.toUpperCase()}</b>,</p>
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

              <a href="#" style="display: inline-block; background-color: #10b981; color: white; padding: 16px 32px; border-radius: 12px; text-decoration: none; font-weight: bold; margin-top: 20px;">Download Registration Slip</a>
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
  } catch (error) {
    res.status(500).json({ message: "Registration failed", error });
  }
});

// Candidate Login (Email/Password)
router.post("/candidate/login-email", async (req, res) => {
  try {
    const { email, password } = req.body;
    const candidateRepository = AppDataSource.getRepository(Candidate);

    const candidate = await candidateRepository.findOne({
      where: { email },
      select: ["examNumber", "fullName", "email", "password", "status", "subjectCombination", "faceUrl", "waecResultUrl"]
    });

    if (!candidate || !candidate.password) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const isMatch = await bcrypt.compare(password, candidate.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    if (candidate.status !== "active") {
      return res.status(403).json({ message: "Registration is not active" });
    }

    const token = jwt.sign(
      { id: candidate.examNumber, role: "student", examNumber: candidate.examNumber },
      config.JWT_SECRET,
      { expiresIn: "6h" }
    );

    res.json({ token, profile: candidate });
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
});

// Staff/Admin Registration
router.post("/register", async (req, res) => {
  try {
    const { email, password, displayName, role } = req.body;
    const userRepository = AppDataSource.getRepository(User);

    const existingUser = await userRepository.findOneBy({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = userRepository.create({
      email,
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
    const { email, password } = req.body;
    const userRepository = AppDataSource.getRepository(User);

    const user = await userRepository.findOneBy({ email });
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign(
      { id: user.id, role: user.role },
      config.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.json({ token, user: { id: user.id, email: user.email, role: user.role, displayName: user.displayName } });
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
});

// Candidate Login (Exam Number)
router.post("/candidate-login", async (req, res) => {
  try {
    const { examNumber } = req.body;
    const candidateRepository = AppDataSource.getRepository(Candidate);

    const candidate = await candidateRepository.findOneBy({ examNumber });
    if (!candidate) {
      return res.status(404).json({ message: "Invalid Exam Number" });
    }

    if (candidate.status !== "active") {
      return res.status(403).json({ message: "Registration is not active" });
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

    res.json({ token, profile: candidate });
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

export default router;

// Forgot Password
router.post("/forgot-password", async (req, res) => {
  const { email, type } = req.body; // type: 'candidate' or 'staff'
  if (!email) return res.status(400).json({ message: "Email is required" });

  try {
    let userFound = false;
    let name = "User";

    if (type === 'candidate') {
      const candidateRepository = AppDataSource.getRepository(Candidate);
      const candidate = await candidateRepository.findOneBy({ email });
      if (candidate) {
        userFound = true;
        name = candidate.fullName;
      }
    } else {
      const userRepository = AppDataSource.getRepository(User);
      const user = await userRepository.findOneBy({ email });
      if (user) {
        userFound = true;
        name = user.displayName;
      }
    }

    if (!userFound) {
      return res.json({ message: "If your email exists in our system, you will receive a reset token." });
    }

    const token = Math.floor(100000 + Math.random() * 900000).toString();
    await redisClient.set(`reset_token:${email}`, token, { EX: 1800 }); // 30 minutes

    await transporter.sendMail({
      from: `"VIVI CBT Security" <${config.MAIL_USER}>`,
      to: email,
      subject: "🔑 Password Reset Request",
      html: `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: auto; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden;">
          <div style="background-color: #f43f5e; padding: 30px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 24px;">PASSWORD RESET</h1>
          </div>
          <div style="padding: 40px; background-color: white;">
            <p style="color: #64748b; line-height: 1.6;">Dear <b>${name}</b>,</p>
            <p style="color: #64748b; line-height: 1.6;">We received a request to reset your password. Use the verification token below to proceed:</p>

            <div style="background-color: #fff1f2; border: 2px dashed #f43f5e; padding: 20px; border-radius: 12px; margin: 30px 0; text-align: center;">
              <span style="font-size: 42px; font-weight: 900; letter-spacing: 8px; color: #f43f5e;">${token}</span>
            </div>

            <p style="color: #64748b; line-height: 1.6;">This token is valid for <b>30 minutes</b>. If you did not request this, please secure your account immediately.</p>
          </div>
        </div>
      `,
    });

    res.json({ message: "Reset token sent to email" });
  } catch (error) {
    res.status(500).json({ message: "Failed to process request", error });
  }
});

// Reset Password
router.post("/reset-password", async (req, res) => {
  const { email, token, newPassword, type } = req.body;

  try {
    const savedToken = await redisClient.get(`reset_token:${email}`);
    if (!savedToken || savedToken !== token) {
      return res.status(400).json({ message: "Invalid or expired token" });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    if (type === 'candidate') {
      const candidateRepository = AppDataSource.getRepository(Candidate);
      await candidateRepository.update({ email }, { password: hashedPassword });
    } else {
      const userRepository = AppDataSource.getRepository(User);
      await userRepository.update({ email }, { password: hashedPassword });
    }

    await redisClient.del(`reset_token:${email}`);

    res.json({ message: "Password reset successful. You can now log in." });
  } catch (error) {
    res.status(500).json({ message: "Failed to reset password", error });
  }
});

