import { AppDataSource } from "./data-source";
import { User } from "./entities/User";
import bcrypt from "bcryptjs";

async function checkAndSeedAdmin() {
  await AppDataSource.initialize();
  const userRepo = AppDataSource.getRepository(User);
  const users = await userRepo.find();

  console.log("--- EXISTING ADMIN / STAFF ACCOUNTS ---");
  users.forEach(u => {
    console.log(`Email: ${u.email} | Role: ${u.role} | Name: ${u.displayName}`);
  });

  if (users.length === 0) {
    const hashedPassword = await bcrypt.hash("admin123", 10);
    const superAdmin = userRepo.create({
      email: "admin@vivicbt.com",
      password: hashedPassword,
      displayName: "System Master",
      role: "super_admin"
    });
    await userRepo.save(superAdmin);
    console.log("✅ SEEDED DEFAULT SUPER ADMIN: admin@vivicbt.com / admin123");
  }

  await AppDataSource.destroy();
  process.exit(0);
}

checkAndSeedAdmin().catch(err => {
  console.error("Error:", err);
  process.exit(1);
});
