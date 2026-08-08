# VIVI CBT Production & Desktop Deployment Guide

This document outlines the steps to take your project from development to a professional production environment and package it as a desktop application.

---

## 1. Production Backend (Node.js + PostgreSQL + Redis)

Your backend is built with Express and TypeORM. For production, you need a server that supports these technologies.

### Recommended Hosting:
- **Render.com** (Easiest: Supports Node.js, Managed Postgres, and Redis)
- **Railway.app** (Great for quick deployments)
- **DigitalOcean** (More control, requires VPS management)

### Steps to Deploy Backend:
1.  **Database**: Create a production PostgreSQL database.
2.  **Redis**: Create a production Redis instance (required for real-time monitoring and chat).
3.  **Environment Variables**: Set the following on your host:
    - `NODE_ENV=production`
    - `DATABASE_URL` (From your production Postgres)
    - `REDIS_URL` (From your production Redis)
    - `JWT_SECRET` (Use a long, random string: `openssl rand -base64 32`)
    - `GEMINI_API_KEY` (Your Google AI key)
    - `MAIL_USER` / `MAIL_PASS` (For sending result emails)
4.  **Build**: Run `npm run build` in the `server` directory to compile TypeScript to JavaScript.
5.  **Start**: Run `npm start` to launch the compiled server.

---

## 2. Production Frontend (Vite + Firebase)

The frontend is a React application that should be served as static files.

### Steps to Deploy Frontend:
1.  **Configure API**: Ensure `.env.production` contains your live backend URL:
    ```env
    VITE_API_URL=https://your-api-url.com
    VITE_SOCKET_URL=https://your-api-url.com
    ```
2.  **Firebase CLI**: Install the CLI if you haven't: `npm install -g firebase-tools`.
3.  **Login & Init**:
    - `firebase login`
    - `firebase init` (Select Hosting, use `dist` as public directory, configure as single-page app).
4.  **Deploy**: Run the pre-configured script:
    ```bash
    npm run deploy
    ```

---

## 3. Desktop App Conversion (Electron)

Your project is already configured with Electron. This will wrap your web app into a `.exe` (Windows) or `.dmg` (Mac) file.

### Features Included:
- **Automatic Fullscreen**: For real exams, the app will force fullscreen mode.
- **Secure Browser**: Disables developer tools and context menus for candidates.
- **Offline Resilience**: Automatically points to your production API.

### Build Instructions:
1.  **Prerequisite**: Ensure you have run a full build of the frontend (`npm run build`).
2.  **Package**: Run the electron build command:
    ```bash
    npm run electron:build
    ```
3.  **Output**: Find your installer in the `dist_electron` folder.

---

## 4. Final Checklist for "Productive" Status
- [ ] **Security**: Ensure CORS is restricted to your specific domain in `server/src/index.ts`.
- [ ] **Backups**: Set up automated daily backups for your Postgres database.
- [ ] **Monitoring**: Use a tool like **UptimeRobot** to monitor if your API goes offline.
- [ ] **SSL**: Ensure your API and Frontend are strictly using `https://`.

---

> [!TIP]
> Always test the "Reset Metrics" and "Email Release" features in a staging environment before doing a live run with real candidates.
