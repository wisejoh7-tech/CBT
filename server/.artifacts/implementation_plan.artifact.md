# Fix Backend Errors

Fix 42 compilation errors in the Node.js backend to allow the application to build and run correctly.

## Proposed Changes

### Core Fixes
- Fix casing in imports within `src/index.ts` (e.g., `./routes/Exam` -> `./routes/exam`).
- Resolve circular/invalid imports in `src/lib/logger.ts`.
- Fix `DeepPartial` type errors in `src/lib/logger.ts` by using proper enums.
- Fix import paths in `src/lib/sms.ts` and `src/redis.ts`.
- Update config property access (e.g., `REDIS_URL` -> `redisUrl`).
- Remove top-level `await` in `src/lib/services.ts` to support standard Node.js environments.

### TypeORM Subscribers
- Add missing imports (`EventSubscriber`, `EntitySubscriberInterface`, etc.) to all files in `src/subscribers/`.
- Import relevant entities (`Candidate`, `Exam`, `Seat`) and utility functions (`sendSMS`).

### Test Scripts
- Fix config access and missing exports in `src/test-email.ts` and `src/test-notifications.ts`.

## Verification Plan

### Automated Tests
- Run `npm run build` to verify all 42 errors are resolved.
