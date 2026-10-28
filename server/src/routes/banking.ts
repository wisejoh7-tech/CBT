import { Router, Response } from "express";
import { z } from "zod";
import { AppDataSource } from "../data-source";
import { AdminBankAccount } from "../entities/AdminBankAccount";
import { BankStatement } from "../entities/BankStatement";
import { BankStatementLine } from "../entities/BankStatementLine";
import { JournalEntry } from "../entities/JournalEntry";
import { PaymentTransaction } from "../entities/PaymentTransaction";
import { Account } from "../entities/Account";
import { authenticateJWT, authorizeRoles, AuthRequest } from "../middleware/auth";
import { createLog, logger } from "../lib/logger";

const router = Router();

// GET /accounts - List Admin Bank Accounts
router.get("/accounts", authenticateJWT, authorizeRoles("admin", "super_admin", "reg_admin"), async (req: AuthRequest, res: Response) => {
  try {
    const bankAccountRepo = AppDataSource.getRepository(AdminBankAccount);
    const accounts = await bankAccountRepo.find({ order: { createdAt: "DESC" } });
    res.json(accounts);
  } catch (error: any) {
    logger.error("Fetch bank accounts error:", error);
    res.status(500).json({ message: "Failed to fetch bank accounts", error: error.message });
  }
});

// POST /accounts - Create Admin Bank Account
router.post("/accounts", authenticateJWT, authorizeRoles("admin", "super_admin"), async (req: AuthRequest, res: Response) => {
  try {
    const bankAccountSchema = z.object({
      bankName: z.string().min(2, "Bank name is required"),
      accountName: z.string().min(2, "Account name is required"),
      accountNumber: z.string().min(5, "Account number is required"),
      sortCode: z.string().optional(),
      currency: z.string().default("NGN"),
      balance: z.number().default(0),
      description: z.string().optional(),
    });

    const validation = bankAccountSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ message: "Validation failed", errors: validation.error.flatten().fieldErrors });
    }

    const { bankName, accountName, accountNumber, sortCode, currency, balance, description } = validation.data;
    const bankAccountRepo = AppDataSource.getRepository(AdminBankAccount);

    const existingAccount = await bankAccountRepo.findOneBy({ accountNumber });
    if (existingAccount) {
      return res.status(400).json({ message: `Bank account number '${accountNumber}' is already registered` });
    }

    const newBankAccount = bankAccountRepo.create({
      bankName,
      accountName,
      accountNumber,
      sortCode,
      currency,
      balance,
      description,
      isActive: true,
    });

    await bankAccountRepo.save(newBankAccount);

    await createLog({
      type: "finance",
      severity: "info",
      message: `Added Admin Bank Account: ${bankName} (${accountNumber})`,
      userId: req.user?.id || "system",
      metadata: { bankName, accountNumber, accountName }
    });

    res.status(201).json(newBankAccount);
  } catch (error: any) {
    logger.error("Create bank account error:", error);
    res.status(500).json({ message: "Failed to create bank account", error: error.message });
  }
});

// PUT /accounts/:id - Update Admin Bank Account
router.put("/accounts/:id", authenticateJWT, authorizeRoles("admin", "super_admin"), async (req: AuthRequest, res: Response) => {
  try {
    const bankAccountRepo = AppDataSource.getRepository(AdminBankAccount);
    const account = await bankAccountRepo.findOneBy({ id: req.params.id as string });
    if (!account) {
      return res.status(404).json({ message: "Bank account not found" });
    }

    const { bankName, accountName, sortCode, currency, balance, isActive, description } = req.body;
    if (bankName) account.bankName = bankName;
    if (accountName) account.accountName = accountName;
    if (sortCode !== undefined) account.sortCode = sortCode;
    if (currency) account.currency = currency;
    if (balance !== undefined) account.balance = Number(balance);
    if (isActive !== undefined) account.isActive = Boolean(isActive);
    if (description !== undefined) account.description = description;

    await bankAccountRepo.save(account);
    res.json(account);
  } catch (error: any) {
    logger.error("Update bank account error:", error);
    res.status(500).json({ message: "Failed to update bank account", error: error.message });
  }
});

// DELETE /accounts/:id - Delete Admin Bank Account
router.delete("/accounts/:id", authenticateJWT, authorizeRoles("admin", "super_admin"), async (req: AuthRequest, res: Response) => {
  try {
    const bankAccountRepo = AppDataSource.getRepository(AdminBankAccount);
    await bankAccountRepo.delete(req.params.id as string);
    res.status(204).send();
  } catch (error: any) {
    logger.error("Delete bank account error:", error);
    res.status(500).json({ message: "Failed to delete bank account", error: error.message });
  }
});

// POST /import-statement - Upload CSV bank statement content and parse
router.post("/import-statement", authenticateJWT, authorizeRoles("admin", "super_admin"), async (req: AuthRequest, res: Response) => {
  try {
    const importSchema = z.object({
      filename: z.string().default("statement.csv"),
      bankAccountId: z.string().optional(),
      csvContent: z.string().min(1, "CSV content is required"),
    });

    const validation = importSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ message: "Validation failed", errors: validation.error.flatten().fieldErrors });
    }

    const { filename, bankAccountId, csvContent } = validation.data;

    // Parse CSV lines (Format expected: Date, Description, Reference, Amount, Type (credit/debit))
    const rawLines = csvContent.split("\n").map(l => l.trim()).filter(l => l.length > 0);
    if (rawLines.length < 2) {
      return res.status(400).json({ message: "CSV statement is empty or missing data rows" });
    }

    const statementRepo = AppDataSource.getRepository(BankStatement);
    const statementLineRepo = AppDataSource.getRepository(BankStatementLine);

    const statement = statementRepo.create({
      filename,
      bankAccountId,
      importedBy: req.user?.id || "admin",
      totalLines: 0,
      matchedLines: 0,
      unmatchedLines: 0,
    });

    const savedStatement = await statementRepo.save(statement);

    let parsedCount = 0;
    const createdLines: BankStatementLine[] = [];

    // Skip header line
    for (let i = 1; i < rawLines.length; i++) {
      const row = rawLines[i].split(",").map(cell => cell.trim().replace(/^["']|["']$/g, ""));
      if (row.length < 3) continue;

      const dateStr = row[0];
      const description = row[1] || "Bank Transaction";
      const reference = row[2] || undefined;
      const rawAmount = parseFloat(row[3] || "0");
      const type = (row[4] || "credit").toLowerCase() === "debit" ? "debit" : "credit";

      const txDate = isNaN(Date.parse(dateStr)) ? new Date() : new Date(dateStr);
      const amount = isNaN(rawAmount) ? 0 : Math.abs(rawAmount);

      if (amount <= 0) continue;

      const line = statementLineRepo.create({
        statementId: savedStatement.id,
        transactionDate: txDate,
        description,
        reference,
        amount,
        type,
        status: "unmatched",
      });

      createdLines.push(line);
      parsedCount++;
    }

    if (createdLines.length > 0) {
      await statementLineRepo.save(createdLines);
    }

    savedStatement.totalLines = parsedCount;
    savedStatement.unmatchedLines = parsedCount;
    await statementRepo.save(savedStatement);

    await createLog({
      type: "finance",
      severity: "info",
      message: `Imported Bank Statement '${filename}' with ${parsedCount} transaction lines.`,
      userId: req.user?.id || "system",
      metadata: { statementId: savedStatement.id, lineCount: parsedCount }
    });

    res.status(201).json({
      message: "Bank statement imported successfully",
      statement: savedStatement,
      lines: createdLines,
    });
  } catch (error: any) {
    logger.error("Import statement error:", error);
    res.status(500).json({ message: "Failed to import bank statement", error: error.message });
  }
});

// GET /statements - List Imported Statements
router.get("/statements", authenticateJWT, authorizeRoles("admin", "super_admin", "reg_admin"), async (req: AuthRequest, res: Response) => {
  try {
    const statementRepo = AppDataSource.getRepository(BankStatement);
    const statements = await statementRepo.find({
      relations: ["lines"],
      order: { createdAt: "DESC" },
    });
    res.json(statements);
  } catch (error: any) {
    logger.error("Fetch statements error:", error);
    res.status(500).json({ message: "Failed to fetch bank statements", error: error.message });
  }
});

// POST /reconcile - Automated Matching Engine
router.post("/reconcile", authenticateJWT, authorizeRoles("admin", "super_admin"), async (req: AuthRequest, res: Response) => {
  try {
    const statementLineRepo = AppDataSource.getRepository(BankStatementLine);
    const journalEntryRepo = AppDataSource.getRepository(JournalEntry);
    const paymentTxRepo = AppDataSource.getRepository(PaymentTransaction);

    const unmatchedLines = await statementLineRepo.find({ where: { status: "unmatched" } });
    let matchedCount = 0;

    for (const line of unmatchedLines) {
      // 1. Match by exact Reference against PaymentTransaction or JournalEntry
      let matchFound = false;

      if (line.reference) {
        const paymentMatch = await paymentTxRepo.findOneBy({ reference: line.reference });
        if (paymentMatch) {
          line.status = "matched";
          line.matchedAt = new Date();
          await statementLineRepo.save(line);
          matchFound = true;
          matchedCount++;
        } else {
          const journalMatch = await journalEntryRepo.findOneBy({ reference: line.reference });
          if (journalMatch) {
            line.status = "matched";
            line.matchedJournalEntryId = journalMatch.id;
            line.matchedAt = new Date();
            await statementLineRepo.save(line);
            matchFound = true;
            matchedCount++;
          }
        }
      }

      // 2. Fuzzy match by amount & date if reference match failed
      if (!matchFound) {
        const potentialJournal = await journalEntryRepo.createQueryBuilder("je")
          .innerJoinAndSelect("je.lines", "jl")
          .where("jl.debit = :amt OR jl.credit = :amt", { amt: line.amount })
          .getOne();

        if (potentialJournal) {
          line.status = "matched";
          line.matchedJournalEntryId = potentialJournal.id;
          line.matchedAt = new Date();
          await statementLineRepo.save(line);
          matchedCount++;
        }
      }
    }

    res.json({
      message: `Reconciliation pass completed. ${matchedCount} lines matched automatically.`,
      matchedCount,
    });
  } catch (error: any) {
    logger.error("Automated reconcile error:", error);
    res.status(500).json({ message: "Failed to perform reconciliation", error: error.message });
  }
});

// POST /reconcile/manual - Manual Matching
router.post("/reconcile/manual", authenticateJWT, authorizeRoles("admin", "super_admin"), async (req: AuthRequest, res: Response) => {
  try {
    const { statementLineId, status, journalEntryId } = req.body;
    const statementLineRepo = AppDataSource.getRepository(BankStatementLine);

    const line = await statementLineRepo.findOneBy({ id: statementLineId });
    if (!line) {
      return res.status(404).json({ message: "Statement line not found" });
    }

    line.status = status || "matched";
    if (journalEntryId) line.matchedJournalEntryId = journalEntryId;
    line.matchedAt = new Date();

    await statementLineRepo.save(line);

    res.json({ message: "Reconciliation status updated", line });
  } catch (error: any) {
    logger.error("Manual reconcile error:", error);
    res.status(500).json({ message: "Failed to manually reconcile statement line", error: error.message });
  }
});

// GET /dashboard - Financial & Banking Analytics Overview
router.get("/dashboard", authenticateJWT, authorizeRoles("admin", "super_admin", "reg_admin"), async (req: AuthRequest, res: Response) => {
  try {
    const bankAccountRepo = AppDataSource.getRepository(AdminBankAccount);
    const accountRepo = AppDataSource.getRepository(Account);
    const lineRepo = AppDataSource.getRepository(BankStatementLine);
    const paymentRepo = AppDataSource.getRepository(PaymentTransaction);

    const bankAccounts = await bankAccountRepo.find();
    const ledgerAccounts = await accountRepo.find();

    let totalVerifiedBankBalance = bankAccounts.reduce((sum, b) => sum + Number(b.balance), 0);
    let totalRecordedAssets = ledgerAccounts.filter(a => a.type === "asset").reduce((sum, a) => sum + Number(a.balance), 0);
    let totalRevenue = ledgerAccounts.filter(a => a.type === "revenue").reduce((sum, a) => sum + Number(a.balance), 0);
    let totalExpenses = ledgerAccounts.filter(a => a.type === "expense").reduce((sum, a) => sum + Number(a.balance), 0);

    const unmatchedCount = await lineRepo.count({ where: { status: "unmatched" } });
    const totalTransactionsCount = await paymentRepo.count();

    res.json({
      verifiedBankBalance: totalVerifiedBankBalance,
      recordedLedgerAssets: totalRecordedAssets,
      totalRevenue,
      totalExpenses,
      netProfit: totalRevenue - totalExpenses,
      unmatchedBankStatementLines: unmatchedCount,
      totalCardPaymentsCount: totalTransactionsCount,
      bankAccounts,
    });
  } catch (error: any) {
    logger.error("Banking dashboard error:", error);
    res.status(500).json({ message: "Failed to load banking dashboard metrics", error: error.message });
  }
});

export default router;
