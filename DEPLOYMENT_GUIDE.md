# Klinik Hanenda – Deployment Guide

This document explains two common deployment scenarios for the **React + Node/Express + MySQL** application you are working on:

1. Shared Hosting (cPanel / Plesk style)  
2. VPS Hosting (Ubuntu 20.04 / 22.04 LTS, Nginx & PM2)

> **Tip:** If you are new to server management, the VPS route is usually easier to maintain in the long-run because you have full control; shared hosting often has restrictions.

---

## 1  Deploy to Shared Hosting

Most shared–hosting providers support static files by default and many of them now support Node.js through **cPanel → Setup Node App** or **CloudLinux Passenger**. The steps below assume your host offers that feature. If yours only supports PHP, deploy the *frontend* here and move the *backend* to a small VPS / PaaS (e.g. Railway, Render, Fly.io).

### 1·1  Prepare local build artefacts

```bash
# at project root on your laptop
npm install               # install root dev deps (eslint, etc.)

# Frontend
cd frontend
npm install               # install React deps
npm run build             # creates build/ directory for production

# Backend
cd ../backend
npm install               # installs Express, MySQL2 etc.
```

### 1·2  Create the Node App in cPanel

1. Log-in to **cPanel → Setup Node.js App** (sometimes ‘Application Manager’).  
2. Click **Create Application** and fill in:
   * *Application root*   `hanenda` (this folder will live under `~/`)
   * *Application URL*    `https://yourdomain.com`  
   * *Application startup file*   `src/index.js`
   * *Node version*        Choose the latest LTS available.
3. After cPanel creates the skeleton, open **Terminal** (or File Manager) and **upload the code**:

```bash
cd ~/hanenda
# replace REPO_URL with your Git or manually upload via File Manager
git clone REPO_URL .
```

4. Inside the same terminal:

```bash
npm install   # installs backend deps listed in package.json
```

5. Create `.env`:

```bash
cp .env.example .env
vim .env       # set DB credentials, JWT secret, etc.
```

6. Click **Run NPM Install** / **Restart App** in the cPanel interface to start the server.

### 1·3  Upload and map the React build

*Option A – Same Domain*  
If you want `https://yourdomain.com` to hit the React app and proxy API requests internally:

1. Copy `frontend/build/*` into `~/public_html` (or the doc-root configured in Node App).  
2. Create or edit `.htaccess` inside `public_html` so React SPA routes always serve `index.html`:

```apacheconf
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  RewriteRule ^index\.html$ – [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /index.html [L]
</IfModule>
```

3. In React, set `proxy` in `package.json` to `/api` and inside cPanel enable the **Passenger Proxy** option so `/api/*` routes are forwarded to the Node App port (Passenger does this automatically when both live on same domain).

*Option B – Sub-domain*  
Keep backend on `api.yourdomain.com` (Node App) and serve React build from main domain:

1. Create sub-domain **api.yourdomain.com** in cPanel and point it to your Node App root.  
2. Upload the React build into the main `public_html` as above.
3. Adjust `.env` in React (or in a runtime config file) so Axios calls hit `https://api.yourdomain.com`.

### 1·4  Database

1. **MySQL Databases → Create DB + User**, grant *ALL* privileges.  
2. Import the schema/dump using **phpMyAdmin** → *Import* tab.  
3. Place the credentials in `/home/USER/hanenda/.env`:

```
DB_HOST=localhost
DB_PORT=3306
DB_NAME=hanenda
DB_USER=hanenda_user
DB_PASS=SuperSecret123!
```

### 1·5  SSL (AutoSSL)

Most cPanel hosts provide **AutoSSL / Let’s Encrypt**. Enable it for both root and `api.` sub-domain.

### 1·6  Cron / PM2 Logs

* Passenger restarts app on crash; no extra process manager needed.  
* Check logs in **~/hanenda/tmp** or via cPanel → **Errors**.

---

## 2  Deploy to VPS (Ubuntu 20.04 / 22.04)

### 2·1  Initial server setup (run as root)

```bash
# update & basic tooling
apt update && apt -y upgrade
apt -y install nginx git ufw curl build-essential

# open firewall
ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw enable
```

### 2·2  Install Node.js & PM2

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt -y install nodejs
npm install -g pm2
```

### 2·3  Clone project & build

```bash
adduser hanenda --disabled-password
usermod -aG sudo hanenda
su - hanenda

# SSH keys recommended
mkdir ~/.ssh && chmod 700 ~/.ssh
# add your public key to ~/.ssh/authorized_keys

git clone REPO_URL app
cd app

# backend deps
cd backend && npm install
cd ..

# build frontend
cd frontend && npm install && npm run build
cd ..
```

> The React build ends up in `frontend/build`. We will serve it via Nginx.

### 2·4  Configure environment

```bash
cp backend/.env.example backend/.env
vim backend/.env   # edit DB, JWT, etc.
```

### 2·5  MySQL / MariaDB (optional)

If you need local DB on the VPS:

```bash
apt -y install mariadb-server
mysql_secure_installation
mysql -uroot -p -e "CREATE DATABASE hanenda; CREATE USER 'hanenda'@'localhost' IDENTIFIED BY 'SuperSecret123!'; GRANT ALL ON hanenda.* TO 'hanenda'@'localhost'; FLUSH PRIVILEGES;"
```

Import your dump: `mysql -uhanenda -p hanenda < dump.sql`.

### 2·6  Run backend with PM2

```bash
cd ~/app/backend
pm2 start src/index.js --name hanenda-api
pm2 save
pm2 startup   # shows a command – run it with sudo
```

### 2·7  Nginx reverse-proxy & static files

Create file `/etc/nginx/sites-available/hanenda`:

```nginx
server {
    listen 80;
    server_name example.com www.example.com;

    root /home/hanenda/app/frontend/build;
    index index.html;

    # Serve React build (static)
    location / {
        try_files $uri /index.html;
    }

    # Proxy API
    location /api/ {
        proxy_pass       http://127.0.0.1:3000/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable and reload:

```bash
ln -s /etc/nginx/sites-available/hanenda /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx
```

### 2·8  HTTPS with Let’s Encrypt

```bash
apt -y install certbot python3-certbot-nginx
certbot --nginx -d example.com -d www.example.com
```

Certbot edits the Nginx config and sets up automatic renewal.

### 2·9  Automatic deployment (optional)

Use a CI/CD pipeline or a simple **post-receive Git hook**:

```bash
#!/bin/sh
GIT_WORK_TREE=/home/hanenda/app git checkout -f
cd /home/hanenda/app/frontend && npm run build
cd /home/hanenda/app/backend && npm install --production
pm2 restart hanenda-api
```

---

## 3  Troubleshooting

| Issue                           | Fix / Command                                      |
|--------------------------------|-----------------------------------------------------|
| *App not responding*            | `pm2 logs hanenda-api` / `journalctl -u nginx`      |
| *Port already in use*           | `lsof -i :3000` → kill conflicting process          |
| *CORS errors*                   | Ensure backend sets `Access-Control-Allow-Origin`   |
| *403 Forbidden on React routes* | Nginx `try_files` rule missing → check config       |

---

## 4  Useful commands

```bash
# PM2
pm2 list
pm2 restart hanenda-api
pm2 logs hanenda-api --lines 100

# Nginx
nginx -t        # test config
systemctl reload nginx

# DB backup
mysqldump -uhanenda -p hanenda > backup.sql
```

---

You now have two robust deployment approaches. Pick the one that fits your hosting budget and control requirements.
