# Fix Postgres Connection and Admin.tsx Syntax Errors

This plan addresses the recurring Postgres connection failures in the backend and the syntax errors in the frontend `Admin.tsx` file that prevent the application from building.

## User Review Required

> [!IMPORTANT]
> The `DATABASE_URL` in your `server/.env` file uses a Render **Internal** host (`...-a.oregon-postgres.render.com`). Internal hosts are only reachable from within Render's network. To connect from your local machine, you must use the **External** host and ensure your IP address is added to the Render allowlist.
>
> I will propose a local database alternative in the plan, but you may need to update it with your actual external Render URL if you prefer to use the remote database.

## Proposed Changes

### Frontend Fixes

#### [MODIFY] [Admin.tsx](file:///C:/Users/bonmm/Desktop/cbt/src/pages/Admin.tsx)
Remove incorrect escape characters (backslashes) and encoded entities that are causing Vite build errors. This file appears to have been corrupted with unnecessary escaping (e.g., `\'`, `\"`, `\u0026\u0026`).

### Backend Fixes

#### [MODIFY] [.env](file:///C:/Users/bonmm/Desktop/cbt/server/.env)
Update the `DATABASE_URL` to a format reachable from your local environment. I will also ensure it follows the standard `postgres://` or `postgresql://` format without internal-only routing.

## Verification Plan

### Automated Tests
- Run `npm run dev` in the frontend directory to verify the Vite build succeeds.
- Run `npm run dev` in the `server` directory to verify the "Connected to Postgres" log message appears.

### Manual Verification
- Access the Admin dashboard in the browser to ensure the UI renders correctly.
- Check the backend logs for any further connection retries.
