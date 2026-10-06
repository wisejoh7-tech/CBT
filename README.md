<div align="center">
<img width="1200" height="475" alt="VIVI Banner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# VIVI CBT Simulator & Center Management System

A production-ready Computer Based Testing (CBT) environment designed for VIVI UTME standards, featuring role-based administration, biometric verification, and robust session management.

## 🚀 Key Features

- **VIVI Interface**: High-fidelity simulation of the official VIVI UTME exam player.
- **Multi-Role Administration**: 
  - `super_admin`: Full curriculum and exam item management.
  - `reg_admin`: Candidate onboarding, biometrics, and slip printing.
- **Subject Combination Logic**: Candidates are automatically assigned 4 subjects (English + 3 electives).
- **Database & State Persistence**: Exam progress and candidate records are stored securely in PostgreSQL via TypeORM, allowing candidates to resume sessions across devices.
- **Biometric Simulation**: Integrated fingerprint verification flow for center readiness.
- **Bulk Operations**: Support for CSV bulk upload of thousands of candidates.
- **Result Management**: Instant generation of official-styled UTME performance reports.

## 🛠️ Tech Stack

- **Frontend**: React 19, Vite, Tailwind CSS 4, Framer Motion.
- **Backend API**: Node.js + Express API, TypeORM, Socket.io, Redis.
- **Database**: PostgreSQL.
- **AI**: Gemini 2.0 Flash for automated item explanations.

## 📐 Architecture Flow

```
React + Vite
     ↓
Node.js + Express API
     ↓
PostgreSQL
```

## 🏁 Getting Started

### Prerequisites

- Node.js (v18+)
- PostgreSQL Database

### Installation

1. Install dependencies:
   ```bash
   npm install
   cd server && npm install
   ```

2. Configure Environment Variables:
   Create a `server/.env` file and add your backend variables:
   ```env
   NODE_ENV=development
   PORT=10000
   DATABASE_URL=postgresql://postgres:password@localhost:5432/cbt_db
   JWT_SECRET=your_jwt_secret_key
   ```

3. Run locally:
   ```bash
   # Run frontend and backend concurrently
   npm run dev:full
   ```

## 📋 CSV Upload Format
To bulk upload candidates, use a CSV with the following columns:
`Full Name, Registration Number, Subject 1, Subject 2, Subject 3, Subject 4`

---
*Disclaimer: This is a simulation tool and is not officially affiliated with VIVI.*
