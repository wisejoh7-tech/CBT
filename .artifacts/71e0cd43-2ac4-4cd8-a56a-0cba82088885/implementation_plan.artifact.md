# Project Production Readiness & Environment Setup Plan

This plan aims to resolve build blockers, fix missing dependencies, and properly configure environment variables to make the VIVI CBT Simulator fully functional.

## User Review Required

> [!IMPORTANT]
> The project currently has several corrupted or missing native binaries (Rollup) and missing backend dependencies (winston, twilio). I will attempt to fix these, but `npm install` has been slow. I will try to use `npm ci` or targeted installs.

> [!NOTE]
> I will switch the Firebase configuration from a static JSON file to environment variables in `.env.local` for better security and flexibility.

## Proposed Changes

### Environment Configuration

#### [MODIFY] [.env.local](file:///C:/Users/bonmm/Desktop/cbt/.env.local)
Update with complete Vite/Firebase variables.

#### [MODIFY] [server/.env](file:///C:/Users/bonmm/Desktop/cbt/server/.env)
Ensure all required backend variables are present.

### Frontend Fixes

#### [MODIFY] [firebase.ts](file:///C:/Users/bonmm/Desktop/cbt/src/lib/firebase.ts)
Change configuration source from `firebase-applet-config.json` to `import.meta.env`.

#### [MODIFY] [package.json](file:///C:/Users/bonmm/Desktop/cbt/package.json)
Fix the `vite` and `rollup` native binary issues by cleaning and targeted re-installation.

### Backend Fixes

#### [MODIFY] [package.json](file:///C:/Users/bonmm/Desktop/cbt/server/package.json)
Add missing dependencies: `winston`, `twilio`.

## Verification Plan

### Automated Tests
- Run `npm run build` in the root directory to verify frontend compilation.
- Run `npm --prefix server run build` to verify backend compilation.

### Manual Verification
- Start the server using `npm run server` and check for "Connected to Postgres" and "Connected to Redis" logs.
- Verify that `.env` files are correctly loaded by checking log outputs for missing variable warnings.
