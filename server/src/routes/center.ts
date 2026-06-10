import { Router } from "express";
import { AppDataSource } from "../data-source";
import { Seat } from "../entities/Seat";
import { authenticateJWT, authorizeRoles } from "../middleware/auth";

const router = Router();

router.get("/seats", authenticateJWT, async (req, res) => {
  const seats = await AppDataSource.getRepository(Seat).find({ order: { seatNumber: "ASC" } });
  res.json(seats);
});

router.post("/seats", authenticateJWT, authorizeRoles("admin", "super_admin"), async (req, res) => {
  const seatRepo = AppDataSource.getRepository(Seat);
  const seat = seatRepo.create(req.body);
  await seatRepo.save(seat);
  res.status(201).json(seat);
});

router.put("/seats/:id", authenticateJWT, authorizeRoles("admin", "super_admin"), async (req, res) => {
  const seatRepo = AppDataSource.getRepository(Seat);
  const seat = await seatRepo.findOneBy({ id: req.params.id as any });
  if (!seat) return res.status(404).json({ message: "Seat not found" });
  seatRepo.merge(seat, req.body);
  await seatRepo.save(seat);
  res.json(seat);
});

export default router;
