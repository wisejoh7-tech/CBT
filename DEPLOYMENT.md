# Deployment Guide - VIVI CBT Portal

## Environment Variables Reference

### Backend Web Service Environment Variables (`server/.env` / Render Node Service)

| Variable | Required | Default | Description |
| :--- | :--- | :--- | :--- |
| `NODE_ENV` | Yes | `development` | Service runtime environment (`production` or `development`) |
| `PORT` | Yes | `10000` | Port for Express API server (Render defaults to `10000`) |
| `DATABASE_URL` | Yes | - | PostgreSQL connection URL (e.g., `postgresql://user:pass@host:5432/dbname`) |
| `JWT_SECRET` | Yes | - | Secret string used for signing and verifying JWT tokens |
| `CORS_ORIGIN` | Recommended | - | Allowed frontend origin URL (e.g., `https://my-exam.onrender.com`) |
| `ALLOWED_ORIGINS` | Optional | - | Comma-separated list of additional allowed origins |
| `INITIAL_ADMIN_PASSWORD` | Optional | `admin123` | Password for initial seeded super admin account |
| `RESEND_API_KEY` | Optional | - | Resend API key (e.g., `re_123456789`) |
| `RESEND_FROM_EMAIL` | Optional | - | Resend sender address (e.g., `VIVI CBT Support <onboarding@resend.dev>`) |
| `MAIL_HOST` | Optional | - | SMTP server hostname (e.g., `smtp.resend.com` or `smtp.gmail.com`) |
| `MAIL_PORT` | Optional | `587` | SMTP server port (`587` for TLS/STARTTLS, `465` for SSL) |
| `MAIL_USER` | Optional | - | SMTP user/email account (`resend` when using Resend SMTP) |
| `MAIL_PASS` | Optional | - | SMTP password or App Password (`re_123456789` when using Resend SMTP) |
| `GEMINI_API_KEY` | Optional | - | Gemini API key for AI features |
| `REDIS_URL` | Optional | - | Redis cache connection string |
| `TWILIO_ACCOUNT_SID` | Optional | - | Twilio Account SID |
| `TWILIO_AUTH_TOKEN` | Optional | - | Twilio Auth Token |
| `TWILIO_PHONE_NUMBER` | Optional | - | Twilio Phone Number |
| `FIREBASE_PROJECT_ID` | Optional | - | Firebase Admin Project ID |
| `FIREBASE_CLIENT_EMAIL` | Optional | - | Firebase Admin Service Account Client Email |
| `FIREBASE_PRIVATE_KEY` | Optional | - | Firebase Admin Service Account Private Key (PEM format) |

#### Example Backend `.env`
```env
NODE_ENV=production
PORT=10000
DATABASE_URL=postgresql://username:password@dpg-xxxxxxxxxxxx-a/cbt_db
JWT_SECRET=a_secure_jwt_secret_key_string
CORS_ORIGIN=https://my-exam.onrender.com
RESEND_API_KEY=re_123456789
RESEND_FROM_EMAIL=VIVI CBT Support <onboarding@resend.dev>
MAIL_HOST=smtp.resend.com
MAIL_PORT=587
MAIL_USER=resend
MAIL_PASS=re_123456789
```

---

### Static Site Frontend Environment Variables (`.env` / Render Static Site)

| Variable | Required | Description |
| :--- | :--- | :--- |
| `VITE_API_URL` | Yes | Public URL of the backend API service (e.g., `https://my-exam-backend.onrender.com`) |
| `VITE_SOCKET_URL` | Yes | Public URL for WebSocket connection (e.g., `https://my-exam-backend.onrender.com`) |
| `VITE_FIREBASE_API_KEY` | Optional | Firebase API Key |
| `VITE_FIREBASE_AUTH_DOMAIN` | Optional | Firebase Auth Domain |
| `VITE_FIREBASE_PROJECT_ID` | Optional | Firebase Project ID |
| `VITE_FIREBASE_STORAGE_BUCKET` | Optional | Firebase Storage Bucket |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Optional | Firebase Messaging Sender ID |
| `VITE_FIREBASE_APP_ID` | Optional | Firebase App ID |
| `VITE_FIREBASE_MEASUREMENT_ID` | Optional | Firebase Measurement ID |

#### Example Frontend `.env`
```env
VITE_API_URL=https://my-exam-backend.onrender.com
VITE_SOCKET_URL=https://my-exam-backend.onrender.com
```

---

## Why Registered Candidates & Staff Disappear On Push/Deploy

When pushing code to GitHub, CI/CD pipelines (e.g. GitHub Actions to AWS ECS, Render Auto-Deploy, Railway) rebuild and redeploy application container instances.

If the application is running without a persistent managed database URL (`DATABASE_URL`), or if `DATABASE_URL` points to `localhost` / internal container storage, the database container or process is recreated on each push. Consequently, all registered candidates, staff, and exam data stored inside the container local filesystem are destroyed upon deployment.

### How To Fix & Ensure Data Persistence Across GitHub Pushes:

1. **Use a Managed PostgreSQL Instance**:
   - Create a cloud-managed PostgreSQL database (e.g., Render PostgreSQL, AWS RDS, Supabase, Neon, or Railway Postgres).
2. **Set `DATABASE_URL` in Production Environment**:
   - On **Render**: Go to your Backend Web Service -> **Environment** -> Add `DATABASE_URL` with your external Postgres connection string (`postgresql://user:pass@host:5432/dbname`).
   - On **AWS ECS / GitHub Actions**: Ensure your Task Definition or Secrets store includes `DATABASE_URL` so that ECS tasks connect to external RDS/PostgreSQL.
   - On **Docker / VPS**: Bind a Docker volume for `postgres_data` (as defined in `docker-compose.yml`) or connect to an external PostgreSQL server.
3. **Automatic Schema Migrations**:
   - The backend is configured with TypeORM automatic migrations (`migrationsRun: true`). Schema changes will safely apply without dropping tables or wiping candidates and staff records.

---

## Deploying to Render (Static Site)

1. Connect your repository on [Render](https://render.com).
2. Choose **Static Site** when creating the service (or Blueprint deployment via `render.yaml`).
3. Set the following Build and Publish settings:
   - **Build Command**: `pnpm install && pnpm run build` (or `npm install && npm run build`)
   - **Publish Directory**: `dist`
4. Add any required environment variables (such as `VITE_FIREBASE_API_KEY`, etc.).
5. Deploy!

> **Troubleshooting "Publish directory dist does not exist!":**
> If Render shows `Empty build command; skipping build`, or fails to create `dist`, ensure the **Build Command** field in Render settings is explicitly set to `pnpm install && pnpm run build` (or `npm install && npm run build`) so that dependencies are installed and the `dist` directory is generated before publishing.

## Troubleshooting Firebase Admin & Render Port Scans

### Error: `Firebase Admin initialization error: Failed to parse private key: Error: Invalid PEM formatted message.`
This error occurs when the `FIREBASE_PRIVATE_KEY` environment variable in Render is incorrectly formatted or escaped.

**How to Fix in Render Dashboard:**
1. Navigate to your **backend service** (`my-exam-backend`) -> **Environment**.
2. Find or add `FIREBASE_PRIVATE_KEY`.
3. Ensure the key value contains valid newlines. On Render, copy the exact value from your Firebase service account JSON file (including `-----BEGIN PRIVATE KEY-----` and `-----END PRIVATE KEY-----`).
4. Wrap the value in double quotes (`"-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"`) or replace literal `\n` characters with actual newline characters in the Render environment variable editor.
5. Save changes and trigger a re-deploy.

### Error: `Port scan timeout reached, no open ports detected` / `Application exited early`
If your application exits early due to uncaught errors during startup (such as invalid Firebase PEM private key initialization in a service or library), Render will be unable to detect an open port on `0.0.0.0:10000`. Fixing the environment variable configuration or runtime crashes resolves the port scan timeout error.

---

## Deploying to Live VPS (Docker Setup)

Follow these steps to deploy the project to a live VPS (Ubuntu/Debian recommended).

### 1. Prerequisites
* A VPS with at least 2GB RAM.
* A Domain Name (e.g., `cbt.yourdomain.com`) pointing to your VPS IP.
* Docker and Docker Compose installed.

### 2. Server Setup
SSH into your server and clone your repository:
```bash
git clone <your-repo-url>
cd cbt
```

### 3. Configure Environment Variables
Create a `.env` file in the root directory:
```env
# Database
POSTGRES_PASSWORD=your_secure_db_password
POSTGRES_DB=cbt_db

# Mailer (SMTP)
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USER=your-email@gmail.com
MAIL_PASS=your-app-password

# Auth & Security
JWT_SECRET=generate_a_long_random_string

# Firebase (Frontend)
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_id
VITE_FIREBASE_APP_ID=your_app_id
```

### 4. SSL Setup (HTTPS)
1. Edit `nginx.conf` and replace `yourdomain.com` with your actual domain.
2. Run the temporary Nginx container to verify the domain:
   ```bash
   docker-compose up -d frontend
   ```
3. Request the SSL certificate using Certbot:
   ```bash
   docker run -it --rm --name certbot \
     -v "$(pwd)/certbot/conf:/etc/letsencrypt" \
     -v "$(pwd)/certbot/www:/var/www/certbot" \
     certbot/certbot certonly --webroot -w /var/www/certbot \
     -d yourdomain.com
   ```
4. Follow the prompts. Once successful, restart the full stack.

### 5. Launch
```bash
docker-compose down
docker-compose up -d --build
```

### 6. Firestore Rules
Go to the Firebase Console -> Firestore -> Rules and paste the content of `firestore.rules`.

### 7. Database Initialization
The system uses TypeORM and will automatically create the Postgres tables on the first run.

### Maintenance
* **Logs:** `docker-compose logs -f backend`
* **Restart:** `docker-compose restart`
* **Update Code:** `git pull && docker-compose up -d --build`
