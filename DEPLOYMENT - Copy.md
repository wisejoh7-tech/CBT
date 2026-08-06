# Deployment Guide - VIVI CBT Portal

Follow these steps to deploy the project to a live VPS (Ubuntu/Debian recommended).

## 1. Prerequisites
* A VPS with at least 2GB RAM.
* A Domain Name (e.g., `cbt.yourdomain.com`) pointing to your VPS IP.
* Docker and Docker Compose installed.

## 2. Server Setup
SSH into your server and clone your repository:
```bash
git clone <your-repo-url>
cd cbt
```

## 3. Configure Environment Variables
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

## 4. SSL Setup (HTTPS)
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

## 5. Launch
```bash
docker-compose down
docker-compose up -d --build
```

## 6. Firestore Rules
Go to the Firebase Console -> Firestore -> Rules and paste the content of `firestore.rules`.

## 7. Database Initialization
The system uses TypeORM and will automatically create the Postgres tables on the first run.

## Maintenance
* **Logs:** `docker-compose logs -f backend`
* **Restart:** `docker-compose restart`
* **Update Code:** `git pull && docker-compose up -d --build`
