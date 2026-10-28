import { Router, Response } from "express";
import { z } from "zod";
import { AppDataSource } from "../data-source";
import { Account, AccountType } from "../entities/Account";
import { JournalEntry } from "../entities/JournalEntry";
import { JournalLine } from "../entities/JournalLine";
import { PaymentTransaction } from "../entities/PaymentTransaction";
import { Candidate } from "../entities/Candidate";
import { authenticateJWT, authorizeRoles, AuthRequest } from "../middleware/auth";
import { createLog, logger } from "../lib/logger";

const router = Router();

// Seed Default Chart of Accounts if empty
export async function ensureDefaultAccounts(): Promise<void> {
  try {
    if (!AppDataSource.isInitialized) return;
    const accountRepo = AppDataSource.getRepository(Account);
    const count = await accountRepo.count();
    if (count === 0) {
      const defaultAccounts = [
        { code: "1010", name: "Main Bank Account", type: "asset" as AccountType, currency: "NGN", description: "Primary operating bank account" },
        { code: "1020", name: "Petty Cash", type: "asset" as AccountType, currency: "NGN", description: "Cash on hand" },
        { code: "1200", name: "Accounts Receivable", type: "asset" as AccountType, currency: "NGN", description: "Student fees pending" },
        { code: "2010", name: "Accounts Payable", type: "liability" as AccountType, currency: "NGN", description: "Vendor payables" },
        { code: "3010", name: "Owner / Institution Equity", type: "equity" as AccountType, currency: "NGN", description: "Institution equity capital" },
        { code: "4010", name: "Exam Fee Revenue", type: "revenue" as AccountType, currency: "NGN", description: "Income from student examination registrations" },
        { code: "4020", name: "Administrative Income", type: "revenue" as AccountType, currency: "NGN", description: "Other services income" },
        { code: "5010", name: "Operating Expenses", type: "expense" as AccountType, currency: "NGN", description: "General operational expenses" },
        { code: "5020", name: "Proctoring & Exam Expenses", type: "expense" as AccountType, currency: "NGN", description: "Exam hall and proctoring costs" },
        { code: "5030", name: "Bank & Transaction Fees", type: "expense" as AccountType, currency: "NGN", description: "Payment processing and bank charges" },
      ];

      for (const acc of defaultAccounts) {
        await accountRepo.save(accountRepo.create(acc));
      }
      logger.info("🌱 Default Chart of Accounts seeded successfully.");
    }
  } catch (err) {
    logger.error("Error seeding default accounts:", err);
  }
}

// GET /accounts - Fetch Chart of Accounts
router.get("/accounts", authenticateJWT, authorizeRoles("admin", "super_admin", "reg_admin"), async (req: AuthRequest, res: Response) => {
  try {
    await ensureDefaultAccounts();
    const accountRepo = AppDataSource.getRepository(Account);
    const accounts = await accountRepo.find({ order: { code: "ASC" } });
    res.json(accounts);
  } catch (error: any) {
    logger.error("Fetch accounts error:", error);
    res.status(500).json({ message: "Failed to fetch accounts", error: error.message });
  }
});

// POST /accounts - Create new Ledger Account
router.post("/accounts", authenticateJWT, authorizeRoles("admin", "super_admin"), async (req: AuthRequest, res: Response) => {
  try {
    const accountSchema = z.object({
      code: z.string().min(1, "Account code is required"),
      name: z.string().min(2, "Account name is required"),
      type: z.enum(["asset", "liability", "equity", "revenue", "expense"]),
      currency: z.string().default("NGN"),
      description: z.string().optional(),
    });

    const validation = accountSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ message: "Validation failed", errors: validation.error.flatten().fieldErrors });
    }

    const { code, name, type, currency, description } = validation.data;
    const accountRepo = AppDataSource.getRepository(Account);

    const existingCode = await accountRepo.findOneBy({ code });
    if (existingCode) {
      return res.status(400).json({ message: `Account code '${code}' already exists` });
    }

    const account = accountRepo.create({ code, name, type: type as AccountType, currency, description, balance: 0 });
    await accountRepo.save(account);

    await createLog({
      type: "finance",
      severity: "info",
      message: `Created account ${code} - ${name} (${type})`,
      userId: req.user?.id || "system",
      metadata: { code, name, type }
    });

    res.status(201).json(account);
  } catch (error: any) {
    logger.error("Create account error:", error);
    res.status(500).json({ message: "Failed to create account", error: error.message });
  }
});

// GET /journal-entries - Fetch Journal Entries
router.get("/journal-entries", authenticateJWT, authorizeRoles("admin", "super_admin", "reg_admin"), async (req: AuthRequest, res: Response) => {
  try {
    const journalRepo = AppDataSource.getRepository(JournalEntry);
    const entries = await journalRepo.find({
      relations: ["lines", "lines.account"],
      order: { entryDate: "DESC", createdAt: "DESC" },
      take: 100,
    });
    res.json(entries);
  } catch (error: any) {
    logger.error("Fetch journal entries error:", error);
    res.status(500).json({ message: "Failed to fetch journal entries", error: error.message });
  }
});

// POST /journal-entries - Post double-entry transaction
router.post("/journal-entries", authenticateJWT, authorizeRoles("admin", "super_admin"), async (req: AuthRequest, res: Response) => {
  const lineSchema = z.object({
    accountId: z.string().uuid("Invalid account ID"),
    debit: z.number().min(0).default(0),
    credit: z.number().min(0).default(0),
    currency: z.string().default("NGN"),
    exchangeRate: z.number().positive().default(1.0),
  });

  const entrySchema = z.object({
    description: z.string().min(3, "Description is required"),
    reference: z.string().optional(),
    entryDate: z.string().optional(),
    lines: z.array(lineSchema).min(2, "At least two lines (debit and credit) are required for double-entry bookkeeping"),
  });

  const validation = entrySchema.safeParse(req.body);
  if (!validation.success) {
    return res.status(400).json({ message: "Validation failed", errors: validation.error.flatten().fieldErrors });
  }

  const { description, reference, entryDate, lines } = validation.data;

  // Validate Double-Entry Invariant: Sum of Debits MUST equal Sum of Credits (converted to base currency)
  let totalDebit = 0;
  let totalCredit = 0;

  for (const line of lines) {
    const debitBase = line.debit * line.exchangeRate;
    const creditBase = line.credit * line.exchangeRate;
    totalDebit += debitBase;
    totalCredit += creditBase;
  }

  // Round to 2 decimal places to avoid floating point precision issue
  const roundedDebit = Math.round(totalDebit * 100) / 100;
  const roundedCredit = Math.round(totalCredit * 100) / 100;

  if (Math.abs(roundedDebit - roundedCredit) > 0.01) {
    return res.status(400).json({
      message: `Journal entry is NOT balanced. Total Debits (${roundedDebit.toFixed(2)}) must equal Total Credits (${roundedCredit.toFixed(2)}).`,
    });
  }

  if (roundedDebit <= 0) {
    return res.status(400).json({ message: "Journal entry total debit and credit amount must be greater than zero." });
  }

  const queryRunner = AppDataSource.createQueryRunner();
  await queryRunner.connect();
  await queryRunner.startTransaction();

  try {
    // Check if reference already exists if provided
    if (reference) {
      const existingEntry = await queryRunner.manager.findOne(JournalEntry, { where: { reference } });
      if (existingEntry) {
        await queryRunner.rollbackTransaction();
        return res.status(400).json({ message: `Journal entry with reference '${reference}' already exists` });
      }
    }

    const entryNumber = `JE-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;

    const journalEntry = queryRunner.manager.create(JournalEntry, {
      entryNumber,
      description,
      reference,
      entryDate: entryDate ? new Date(entryDate) : new Date(),
      status: "posted",
      createdBy: req.user?.id || "system",
    });

    const savedEntry = await queryRunner.manager.save(JournalEntry, journalEntry);

    const lineEntities: JournalLine[] = [];

    for (const line of lines) {
      const account = await queryRunner.manager.findOne(Account, { where: { id: line.accountId } });
      if (!account) {
        throw new Error(`Account with ID '${line.accountId}' not found.`);
      }

      const journalLine = queryRunner.manager.create(JournalLine, {
        journalEntryId: savedEntry.id,
        accountId: line.accountId,
        debit: line.debit,
        credit: line.credit,
        currency: line.currency || account.currency,
        exchangeRate: line.exchangeRate,
      });

      lineEntities.push(journalLine);

      // Update Account Balance based on Normal Account Type Behavior
      // Assets & Expenses: Balance += Debit - Credit
      // Liabilities, Equity, Revenue: Balance += Credit - Debit
      const netChangeBase = (line.debit - line.credit) * line.exchangeRate;
      let balanceDelta = netChangeBase;
      if (["liability", "equity", "revenue"].includes(account.type)) {
        balanceDelta = (line.credit - line.debit) * line.exchangeRate;
      }

      account.balance = Number(account.balance) + balanceDelta;
      await queryRunner.manager.save(Account, account);
    }

    await queryRunner.manager.save(JournalLine, lineEntities);

    await queryRunner.commitTransaction();

    await createLog({
      type: "finance",
      severity: "info",
      message: `Posted Journal Entry ${entryNumber}: ${description} (${roundedDebit.toFixed(2)})`,
      userId: req.user?.id || "system",
      metadata: { entryNumber, reference, totalAmount: roundedDebit }
    });

    res.status(201).json({
      message: "Journal entry posted successfully",
      journalEntry: { ...savedEntry, lines: lineEntities },
    });
  } catch (error: any) {
    await queryRunner.rollbackTransaction();
    logger.error("Journal entry post error:", error);
    res.status(500).json({ message: "Failed to post journal entry", error: error.message });
  } finally {
    await queryRunner.release();
  }
});

// GET /ledger - General Ledger & Summary
router.get("/ledger", authenticateJWT, authorizeRoles("admin", "super_admin", "reg_admin"), async (req: AuthRequest, res: Response) => {
  try {
    await ensureDefaultAccounts();
    const accountRepo = AppDataSource.getRepository(Account);
    const lineRepo = AppDataSource.getRepository(JournalLine);

    const accounts = await accountRepo.find({ order: { code: "ASC" } });

    // Calculate total assets, liabilities, equity, revenue, expenses
    let totalAssets = 0;
    let totalLiabilities = 0;
    let totalEquity = 0;
    let totalRevenue = 0;
    let totalExpenses = 0;

    for (const acc of accounts) {
      const bal = Number(acc.balance);
      if (acc.type === "asset") totalAssets += bal;
      else if (acc.type === "liability") totalLiabilities += bal;
      else if (acc.type === "equity") totalEquity += bal;
      else if (acc.type === "revenue") totalRevenue += bal;
      else if (acc.type === "expense") totalExpenses += bal;
    }

    const recentLines = await lineRepo.find({
      relations: ["journalEntry", "account"],
      order: { journalEntry: { entryDate: "DESC" } },
      take: 50,
    });

    res.json({
      summary: {
        totalAssets,
        totalLiabilities,
        totalEquity,
        totalRevenue,
        totalExpenses,
        netIncome: totalRevenue - totalExpenses,
      },
      accounts,
      recentLines,
    });
  } catch (error: any) {
    logger.error("Fetch ledger error:", error);
    res.status(500).json({ message: "Failed to fetch ledger", error: error.message });
  }
});

// GET /candidate-payment-status/:examNumber - Fetch student payment status
router.get("/candidate-payment-status/:examNumber", authenticateJWT, async (req: AuthRequest, res: Response) => {
  try {
    const { examNumber } = req.params;
    const candidateRepo = AppDataSource.getRepository(Candidate);
    const candidate = await candidateRepo.createQueryBuilder("c")
      .where("LOWER(c.examNumber) = LOWER(:examNumber)", { examNumber })
      .getOne();

    if (!candidate) {
      return res.status(404).json({ message: "Candidate not found" });
    }

    res.json({
      examNumber: candidate.examNumber,
      fullName: candidate.fullName,
      isFeePaid: Boolean(candidate.isFeePaid),
      feeAmount: Number(candidate.feeAmount || 5000.00),
      paymentReference: candidate.paymentReference,
    });
  } catch (error: any) {
    logger.error("Fetch candidate payment status error:", error);
    res.status(500).json({ message: "Failed to fetch candidate payment status", error: error.message });
  }
});

// POST /pay-exam-fee - Student Card Payment Verification
router.post("/pay-exam-fee", authenticateJWT, async (req: AuthRequest, res: Response) => {
  const paySchema = z.object({
    examNumber: z.string().min(1, "Exam number is required"),
    cardHolderName: z.string().min(2, "Cardholder name is required"),
    lastFourDigits: z.string().optional(),
    amount: z.number().optional().default(5000.00),
    idempotencyKey: z.string().optional(),
  });

  const validation = paySchema.safeParse(req.body);
  if (!validation.success) {
    return res.status(400).json({ message: "Validation failed", errors: validation.error.flatten().fieldErrors });
  }

  const { examNumber, cardHolderName, lastFourDigits, amount, idempotencyKey } = validation.data;

  await ensureDefaultAccounts();

  const queryRunner = AppDataSource.createQueryRunner();
  await queryRunner.connect();
  await queryRunner.startTransaction();

  try {
    const candidate = await queryRunner.manager.createQueryBuilder(Candidate, "c")
      .where("LOWER(c.examNumber) = LOWER(:examNumber)", { examNumber })
      .getOne();

    if (!candidate) {
      await queryRunner.rollbackTransaction();
      return res.status(404).json({ message: "Candidate account not found" });
    }

    if (candidate.isFeePaid) {
      await queryRunner.rollbackTransaction();
      return res.status(200).json({
        message: "Exam fee has already been paid and verified for this candidate.",
        isFeePaid: true,
        paymentReference: candidate.paymentReference,
      });
    }

    const reference = `PAY-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

    // 1. Record Payment Transaction
    const paymentTx = queryRunner.manager.create(PaymentTransaction, {
      reference,
      candidateId: candidate.examNumber,
      amount,
      currency: "NGN",
      paymentMethod: "card",
      status: "completed",
      idempotencyKey: idempotencyKey || reference,
      metadata: JSON.stringify({ cardHolderName, lastFourDigits: lastFourDigits || "4242" }),
    });

    await queryRunner.manager.save(PaymentTransaction, paymentTx);

    // 2. Fetch Bank Account (Code 1010) and Revenue Account (Code 4010)
    let bankAcc = await queryRunner.manager.findOne(Account, { where: { code: "1010" } });
    let revAcc = await queryRunner.manager.findOne(Account, { where: { code: "4010" } });

    if (!bankAcc) {
      bankAcc = queryRunner.manager.create(Account, { code: "1010", name: "Main Bank Account", type: "asset", balance: 0 });
      await queryRunner.manager.save(Account, bankAcc);
    }
    if (!revAcc) {
      revAcc = queryRunner.manager.create(Account, { code: "4010", name: "Exam Fee Revenue", type: "revenue", balance: 0 });
      await queryRunner.manager.save(Account, revAcc);
    }

    // 3. Post Balanced Double-Entry Journal Entry (DR: Bank Asset, CR: Exam Fee Revenue)
    const journalEntry = queryRunner.manager.create(JournalEntry, {
      entryNumber: `JE-PAY-${reference}`,
      description: `Exam Fee Payment by ${candidate.fullName} (${candidate.examNumber})`,
      reference,
      status: "posted",
      createdBy: req.user?.id || candidate.examNumber,
    });

    const savedEntry = await queryRunner.manager.save(JournalEntry, journalEntry);

    const drLine = queryRunner.manager.create(JournalLine, {
      journalEntryId: savedEntry.id,
      accountId: bankAcc.id,
      debit: amount,
      credit: 0,
      currency: "NGN",
      exchangeRate: 1.0,
    });

    const crLine = queryRunner.manager.create(JournalLine, {
      journalEntryId: savedEntry.id,
      accountId: revAcc.id,
      debit: 0,
      credit: amount,
      currency: "NGN",
      exchangeRate: 1.0,
    });

    await queryRunner.manager.save(JournalLine, [drLine, crLine]);

    // Update Account Balances
    bankAcc.balance = Number(bankAcc.balance) + amount;
    revAcc.balance = Number(revAcc.balance) + amount;
    await queryRunner.manager.save(Account, [bankAcc, revAcc]);

    // 4. Unlock Candidate Fee Gate
    candidate.isFeePaid = true;
    candidate.paymentReference = reference;
    await queryRunner.manager.save(Candidate, candidate);

    await queryRunner.commitTransaction();

    await createLog({
      type: "finance",
      severity: "info",
      message: `Card Payment Verified for candidate ${candidate.fullName} (${candidate.examNumber}) - Ref: ${reference} (₦${amount})`,
      userId: candidate.examNumber,
      metadata: { examNumber, reference, amount }
    });

    res.status(200).json({
      message: "Card payment verified successfully! Exam access unlocked.",
      isFeePaid: true,
      paymentReference: reference,
      amount,
      candidateName: candidate.fullName,
      paidAt: new Date().toISOString(),
    });
  } catch (error: any) {
    await queryRunner.rollbackTransaction();
    logger.error("Card payment verification error:", error);
    res.status(500).json({ message: "Failed to process payment verification", error: error.message });
  } finally {
    await queryRunner.release();
  }
});

// POST /refund-exam-fee - Admin Fee Refund
router.post("/refund-exam-fee", authenticateJWT, authorizeRoles("admin", "super_admin"), async (req: AuthRequest, res: Response) => {
  try {
    const { candidateExamNumber, reason } = req.body;
    if (!candidateExamNumber) {
      return res.status(400).json({ message: "Candidate examination number is required" });
    }

    const candidateRepo = AppDataSource.getRepository(Candidate);
    const candidate = await candidateRepo.findOneBy({ examNumber: candidateExamNumber });

    if (!candidate) {
      return res.status(404).json({ message: "Candidate not found" });
    }

    if (!candidate.isFeePaid) {
      return res.status(400).json({ message: "Candidate has not paid any exam fees to refund." });
    }

    candidate.isFeePaid = false;
    const oldRef = candidate.paymentReference;
    candidate.paymentReference = undefined;
    await candidateRepo.save(candidate);

    await createLog({
      type: "finance",
      severity: "warning",
      message: `Exam Fee Refunded for candidate ${candidate.fullName} (${candidate.examNumber}) - Reason: ${reason || 'Admin Refund'}`,
      userId: req.user?.id || "system",
      metadata: { candidateExamNumber, oldRef, reason }
    });

    res.json({ message: `Refund processed for ${candidate.fullName}. Exam access locked.` });
  } catch (error: any) {
    logger.error("Refund error:", error);
    res.status(500).json({ message: "Failed to process refund", error: error.message });
  }
});

export default router;
