# VIVI CBT FINANCIAL, BANKING & ACCOUNTING MODULE DOCUMENTATION

## OVERVIEW
The VIVI CBT Financial Module provides a enterprise-grade, double-entry accounting ledger, bank account management, automated reconciliation engine, student fee payment processing, and real-time financial reporting for CBT centers and educational institutions.

---

## 1. DATABASE SCHEMA & ENTITY MODELS

### 1.1 `Account` (Chart of Accounts)
- **Table**: `account`
- **Fields**:
  - `id`: UUID (Primary Key)
  - `code`: String (Unique, e.g., `1010` Main Bank, `4010` Exam Revenue)
  - `name`: String
  - `type`: Enum (`asset`, `liability`, `equity`, `revenue`, `expense`)
  - `currency`: String (Default: `NGN`)
  - `balance`: Decimal (15, 2)
  - `description`: Text

### 1.2 `JournalEntry` & `JournalLine` (Double-Entry Ledger)
- **Tables**: `journal_entry`, `journal_line`
- **Invariants**:
  - Total Debits = Total Credits ($\sum \text{Debit} = \sum \text{Credit}$). Unbalanced postings are rejected atomically via database transactions.
- **Fields (`JournalEntry`)**:
  - `id`: UUID
  - `entryNumber`: String (Unique)
  - `entryDate`: Timestamp
  - `description`: Text
  - `reference`: String (Nullable)
  - `status`: String (`posted`)
- **Fields (`JournalLine`)**:
  - `journalEntryId`: Foreign Key (`JournalEntry`)
  - `accountId`: Foreign Key (`Account`)
  - `debit`: Decimal (15, 2)
  - `credit`: Decimal (15, 2)
  - `currency`: String
  - `exchangeRate`: Decimal (10, 4)

### 1.3 `PaymentTransaction`
- **Table**: `payment_transaction`
- **Fields**:
  - `id`: UUID
  - `reference`: String (Unique)
  - `candidateId`: String (Candidate Exam Number)
  - `amount`: Decimal (15, 2)
  - `currency`: String
  - `paymentMethod`: String (`card`)
  - `status`: String (`completed`)
  - `idempotencyKey`: String (Unique)

### 1.4 `AdminBankAccount`
- **Table**: `admin_bank_account`
- **Fields**:
  - `id`: UUID
  - `bankName`: String (e.g., Zenith Bank, GTBank)
  - `accountName`: String
  - `accountNumber`: String (Unique)
  - `sortCode`: String
  - `currency`: String
  - `balance`: Decimal
  - `isActive`: Boolean

### 1.5 `BankStatement` & `BankStatementLine`
- **Tables**: `bank_statement`, `bank_statement_line`
- **Reconciliation States**: `unmatched`, `matched`, `discrepancy`.

---

## 2. API CONTRACTS

### 2.1 Ledger & Finance Endpoints
- `GET /finance/accounts`: Retrieve Chart of Accounts (Admin/Staff only)
- `POST /finance/accounts`: Create new ledger account (Admin only)
- `GET /finance/journal-entries`: Fetch journal entries with line items
- `POST /finance/journal-entries`: Post balanced double-entry transaction
- `GET /finance/ledger`: Fetch general ledger summary and account balances
- `GET /finance/candidate-payment-status/:examNumber`: Fetch student exam fee payment status
- `POST /finance/pay-exam-fee`: Verify card fee payment and unlock candidate exam terminal access
- `POST /finance/refund-exam-fee`: Process fee refund (Admin only)

### 2.2 Banking & Reconciliation Endpoints
- `GET /banking/accounts`: List admin organization bank accounts
- `POST /banking/accounts`: Register new admin bank account
- `PUT /banking/accounts/:id`: Update bank account details
- `DELETE /banking/accounts/:id`: Remove bank account record
- `POST /banking/import-statement`: Upload and parse CSV bank statement content
- `POST /banking/reconcile`: Trigger automated transaction reference matching
- `POST /banking/reconcile/manual`: Manually confirm match or flag discrepancy
- `GET /banking/dashboard`: Fetch financial metrics (Verified Bank Balance, Revenue, Expenses, Net Profit)

---

## 3. SECURITY ARCHITECTURE & PCI-DSS COMPLIANCE

1. **Zero Storage Policy**: Sensitive card data (full 16-digit card numbers, CVVs, PINs, OTPs, or online bank passwords) are NEVER saved in database, logs, or application state.
2. **Atomic Database Transactions**: All payment verification and ledger postings execute inside isolated TypeORM `QueryRunner` database transactions.
3. **Idempotency Safeguards**: Payment references and idempotency keys prevent duplicate postings or double charges.
4. **Role-Based Access Control**: Finance & Banking administrative endpoints are restricted to authenticated staff with `admin` or `super_admin` roles via `authenticateJWT` and `authorizeRoles`.

---

## 4. BACKUP & DISASTER RECOVERY PROCEDURES

1. **Automated Database Backups**: Perform hourly PostgreSQL WAL archivals and daily full database dumps (`pg_dump`).
2. **Ledger Audit Trail Integrity**: Every journal entry and bank reconciliation state change generates an immutable log entry in the `Log` table.
3. **Restoration Protocol**:
   - Restore database backup using `pg_restore`.
   - Verify ledger balance invariant ($\text{Assets} = \text{Liabilities} + \text{Equity}$).

---

## 5. EXTERNAL PROVIDER INTEGRATION GUIDELINES
When configuring live payment gateway providers (Paystack, Flutterwave, Stripe):
1. Configure webhooks to point to `/finance/pay-exam-fee`.
2. Ensure webhook signatures are verified using provider secret keys before triggering ledger postings.
3. Never simulate or initiate live money transfers without explicit administrative authorization.
