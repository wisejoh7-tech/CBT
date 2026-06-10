import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { AppDataSource } from "../data-source";
import { User } from "../entities/User";
import { Candidate } from "../entities/Candidate";
import { createLog } from "../lib/logger";
import { redisClient, transporter } from "../index";

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
      from: `"VIVI CBT Registration" <${process.env.MAIL_USER}>`,
      to: email,
      subject: "Your Registration Verification Token",
      html: `
        <div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
          <h2 style="color: #0EA5E9;">Verification Token</h2>
          <p>Use the following token to continue your examination registration:</p>
          <div style="background: #f8fafc; padding: 15px; border-radius: 8px; margin: 20px 0; text-align: center;">
            <span style="font-size: 32px; font-weight: 900; letter-spacing: 5px; color: #0EA5E9;">${token}</span>
          </div>
          <p>This token expires in 10 minutes.</p>
        </div>
      `,
    });

    res.json({ message: "Token sent to email" });
  } catch (error) {
    res.status(500).json({ message: "Failed to send token", error });
  }
});

// Candidate Final Registration
router.post("/candidate/register", async (req, res) => {
  const { email, token, fullName, subjectCombination, dateOfBirth } = req.body;

  try {
    const savedToken = await redisClient.get(`reg_token:${email}`);
    if (!savedToken || savedToken !== token) {
      return res.status(400).json({ message: "Invalid or expired token" });
    }

    const candidateRepository = AppDataSource.getRepository(Candidate);
    const examNumber = `${new Date().getFullYear()}${Math.floor(100000 + Math.random() * 900000)}`;

    const candidate = candidateRepository.create({
      examNumber,
      fullName: fullName.toUpperCase(),
      email,
      subjectCombination,
      dateOfBirth,
      status: "active"
    });

    await candidateRepository.save(candidate);
    await redisClient.del(`reg_token:${email}`);

    res.status(201).json({
      message: "Registration successful",
      candidate: { examNumber, fullName: candidate.fullName }
    });
  } catch (error) {
    res.status(500).json({ message: "Registration failed", error });
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
      process.env.JWT_SECRET || "secret",
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
      process.env.JWT_SECRET || "secret",
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
