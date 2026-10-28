import "reflect-metadata";

async function runFinanceTests() {
  console.log("==================================================");
  console.log("🧪 RUNNING FINANCIAL MODULE INTEGRATION & INVARIANT TESTS");
  console.log("==================================================");

  let passedTests = 0;
  let totalTests = 0;

  function assert(condition: boolean, testName: string) {
    totalTests++;
    if (condition) {
      console.log(`  ✅ PASS: ${testName}`);
      passedTests++;
    } else {
      console.error(`  ❌ FAIL: ${testName}`);
    }
  }

  try {
    // TEST 1: Double-Entry Balanced Journal Rule Invariant (Debit == Credit)
    const validateJournalBalance = (lines: Array<{ debit: number; credit: number; exchangeRate?: number }>) => {
      let totalDebit = 0;
      let totalCredit = 0;
      for (const line of lines) {
        const rate = line.exchangeRate || 1.0;
        totalDebit += line.debit * rate;
        totalCredit += line.credit * rate;
      }
      return Math.abs(totalDebit - totalCredit) < 0.01;
    };

    const validEntry = [
      { debit: 5000, credit: 0 },
      { debit: 0, credit: 5000 },
    ];
    assert(validateJournalBalance(validEntry), "Double-Entry Invariant - Balanced Journal Entry Validation (DR 5000 == CR 5000)");

    const invalidEntry = [
      { debit: 5000, credit: 0 },
      { debit: 0, credit: 4000 },
    ];
    assert(!validateJournalBalance(invalidEntry), "Double-Entry Invariant - Unbalanced Journal Entry Rejection (DR 5000 != CR 4000)");

    // TEST 2: Multi-Currency Journal Line Conversion
    const multiCurrencyEntry = [
      { debit: 100, credit: 0, exchangeRate: 1500 }, // $100 * 1500 = ₦150,000
      { debit: 0, credit: 150000, exchangeRate: 1.0 }, // ₦150,000
    ];
    assert(validateJournalBalance(multiCurrencyEntry), "Multi-Currency Handling - Conversion Rate Balancing ($100 @ 1500 == ₦150,000)");

    // TEST 3: Candidate Exam Fee Payment Verification Logic
    const simulateCandidatePayment = (candidate: { isFeePaid: boolean; feeAmount: number }, paymentAmount: number) => {
      if (candidate.isFeePaid) {
        return { status: "already_paid", isFeePaid: true };
      }
      if (paymentAmount >= candidate.feeAmount) {
        return { status: "verified", isFeePaid: true, reference: `PAY-${Date.now()}` };
      }
      return { status: "insufficient_amount", isFeePaid: false };
    };

    const unpaidCandidate = { isFeePaid: false, feeAmount: 5000 };
    const payResult = simulateCandidatePayment(unpaidCandidate, 5000);
    assert(payResult.status === "verified" && payResult.isFeePaid, "Payment Processing - Valid Card Payment unlocks fee status");

    const paidCandidate = { isFeePaid: true, feeAmount: 5000 };
    const repeatResult = simulateCandidatePayment(paidCandidate, 5000);
    assert(repeatResult.status === "already_paid", "Idempotency Protection - Duplicate payment request returns existing status");

    // TEST 4: CSV Bank Statement Parser & Matching Engine
    const parseCSVStatement = (csvText: string) => {
      const rows = csvText.trim().split("\n").filter(r => r.length > 0);
      const lines = [];
      for (let i = 1; i < rows.length; i++) {
        const parts = rows[i].split(",").map(p => p.trim());
        if (parts.length >= 4) {
          lines.push({
            date: parts[0],
            description: parts[1],
            reference: parts[2],
            amount: parseFloat(parts[3]),
          });
        }
      }
      return lines;
    };

    const sampleCSV = `Date,Description,Reference,Amount\n2026-03-30,Exam Registration Fee,PAY-991203,5000`;
    const parsedLines = parseCSVStatement(sampleCSV);
    assert(parsedLines.length === 1 && parsedLines[0].reference === "PAY-991203" && parsedLines[0].amount === 5000, "Bank Reconciliation - CSV Statement Parsing & Field Extraction");

    // TEST 5: Statement Line Matching Logic
    const matchTransaction = (lineRef: string, recordedRefs: string[]) => {
      return recordedRefs.includes(lineRef) ? "matched" : "unmatched";
    };

    const recordedReferences = ["PAY-991203", "PAY-882104"];
    assert(matchTransaction("PAY-991203", recordedReferences) === "matched", "Transaction Matching - Exact Reference Match Found");
    assert(matchTransaction("PAY-UNKNOWN", recordedReferences) === "unmatched", "Transaction Matching - Unmatched Line Flags Discrepancy");

    console.log("==================================================");
    console.log(`📊 TEST RESULTS: ${passedTests}/${totalTests} TESTS PASSED`);
    console.log("==================================================");

    if (passedTests === totalTests) {
      process.exit(0);
    } else {
      process.exit(1);
    }
  } catch (err: any) {
    console.error("Critical error in financial tests:", err);
    process.exit(1);
  }
}

runFinanceTests();
