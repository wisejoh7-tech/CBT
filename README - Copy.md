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
- **Firestore State Persistence**: Exam progress is synced to the cloud every 30 seconds, allowing candidates to resume sessions across different devices.
- **Biometric Simulation**: Integrated fingerprint verification flow for center readiness.
- **Bulk Operations**: Support for CSV bulk upload of thousands of candidates.
- **Result Management**: Instant generation of official-styled UTME performance reports.

## 🛠️ Tech Stack

- **Frontend**: React 19, Vite, Tailwind CSS 4, Framer Motion.
- **Backend**: Firebase (Auth, Firestore, Hosting).
- **AI**: Gemini 2.0 Flash for automated item explanations.

## 🏁 Getting Started

### Prerequisites

- Node.js (v18+)
- Firebase Account

### Installation

1. Install dependencies:
   ```bash
   npm install
   ```

2. Configure Environment Variables:
   Create a `.env.local` file and add your keys:
   ```env
   VITE_FIREBASE_API_KEY=your_key
   VITE_FIREBASE_AUTH_DOMAIN=your_domain
   VITE_FIREBASE_PROJECT_ID=your_id
   VITE_FIREBASE_STORAGE_BUCKET=your_bucket
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   VITE_FIREBASE_APP_ID=your_app_id
   GEMINI_API_KEY=your_gemini_key
   ```

3. Run locally:
   ```bash
   npm run dev
   ```

### Deployment

1. Build the project:
   ```bash
   npm run build
   ```

2. Deploy to Firebase:
   ```bash
   firebase deploy
   ```

## 📋 CSV Upload Format
To bulk upload candidates, use a CSV with the following columns:
`Full Name, Registration Number, Subject 1, Subject 2, Subject 3, Subject 4`

---
*Disclaimer: This is a simulation tool and is not officially affiliated with VIVI.*
