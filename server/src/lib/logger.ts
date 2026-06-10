import { AppDataSource } from "../data-source";
import { Log } from "../entities/Log";

export async function createLog(data: {
  type: 'auth' | 'security' | 'exam' | 'system';
  severity: 'info' | 'warning' | 'error' | 'critical';
  message: string;
  userId?: string;
  metadata?: any;
}) {
  try {
    const logRepo = AppDataSource.getRepository(Log);
    const log = logRepo.create(data);
    await logRepo.save(log);
  } catch (err) {
    console.error("Failed to create log:", err);
  }
}
