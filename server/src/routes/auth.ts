import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { AppDataSource } from "../data-source";
import { User } from "../entities/User";
import { Candidate } from "../entities/Candidate";
import { createLog } from "../lib/logger";

const router = Router();

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
