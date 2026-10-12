import { AppDataSource } from "./data-source";
import { User } from "./entities/User";
import { ensureDefaultAdmin, getAdminEmail } from "./routes/auth";

async function checkAndSeedAdmin() {
  await AppDataSource.initialize();
  const userRepo = AppDataSource.getRepository(User);

  await ensureDefaultAdmin();

  const users = await userRepo.find();

  console.log("--- EXISTING ADMIN / STAFF ACCOUNTS ---");
  users.forEach(u => {
    console.log(`Email: ${u.email} | Role: ${u.role} | Name: ${u.displayName}`);
  });

  console.log(`✅ Default / Configured admin account ready: ${getAdminEmail()}`);

  await AppDataSource.destroy();
  process.exit(0);
}

checkAndSeedAdmin().catch(err => {
  console.error("Error:", err);
  process.exit(1);
});
