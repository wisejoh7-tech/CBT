import axios from 'axios';

const API_URL = 'http://localhost:5000';

async function testSecurity() {
  console.log("--- VIVI Security System Test ---");

  // 1. Test SQL Injection Detection
  console.log("\n1. Testing SQL Injection Detection...");
  try {
    const res = await axios.post(`${API_URL}/auth/login`, {
      email: "' OR 1=1 --",
      password: "password"
    });
    console.log("❌ Request should have been blocked but wasn't.");
  } catch (error: any) {
    if (error.response?.status === 403) {
      console.log("✅ SQL Injection blocked as expected (403 Forbidden).");
    } else {
      console.log(`⚠️  Received unexpected status: ${error.response?.status}`);
    }
  }

  // 2. Test XSS Detection
  console.log("\n2. Testing XSS Detection...");
  try {
    const res = await axios.get(`${API_URL}/exams?query=<script>alert('xss')</script>`);
    console.log("❌ XSS request should have triggered a warning.");
  } catch (error: any) {
    console.log(`ℹ️  Note: XSS might not block if risk score < 100, but should be in logs.`);
  }

  // 3. Test IP Blocking (Requires the SQLi to have triggered a block)
  console.log("\n3. Testing IP Blocking persistence...");
  try {
    const res = await axios.get(`${API_URL}/`);
    console.log("ℹ️  Checking if main route is blocked now.");
  } catch (error: any) {
    if (error.response?.status === 403) {
      console.log("✅ IP was successfully blocked in Redis.");
    }
  }

  console.log("\n--- Verification Complete ---");
}

// Note: Ensure the server is running before executing this.
// testSecurity();
