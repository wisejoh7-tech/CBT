import { Router } from "express";
import { AppDataSource } from "../data-source";
import { Seat, SeatStatus } from "../entities/Seat";
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

router.post("/seats/bulk", authenticateJWT, authorizeRoles("admin", "super_admin"), async (req, res) => {
  const { count } = req.body;
  if (!count || count <= 0) return res.status(400).json({ message: "Invalid count" });

  const seatRepo = AppDataSource.getRepository(Seat);

  try {
    // Clear all existing seats first for a clean re-initialization
    await seatRepo.clear();

    const seats = [];
    for (let i = 1; i <= count; i++) {
      seats.push(seatRepo.create({
        seatNumber: i.toString(),
        status: SeatStatus.AVAILABLE
      }));
    }

    await seatRepo.save(seats);
    res.status(201).json({ message: `${count} seats initialized` });
  } catch (error: any) {
    res.status(500).json({ message: "Failed to initialize seats", error: error.message });
  }
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
