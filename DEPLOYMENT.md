# LifeFlow Deployment Guide 🩸

This guide contains step-by-step instructions on how to host the **LifeFlow** full-stack web application on various platforms.

---

## Architecture Overview
The application is structured as:
* **Frontend**: React (Vite, TypeScript) in the `client` directory.
* **Backend**: Express (Node.js, TypeScript) in the `server` directory.

### Production Setup (Monolith Serving)
To make hosting simple, inexpensive, and robust, the application is pre-configured to build the frontend assets into `client/dist` and let the backend Express server serve them directly in production. This avoids:
1. CORS issues
2. Setting up and paying for two separate web services
3. Domain mapping complexities

---

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Hosting Option A: Render (Easiest & Free Tier)](#hosting-option-a-render-easiest--free-tier)
3. [Hosting Option B: Railway (Fastest)](#hosting-option-b-railway-fastest)
4. [Hosting Option C: VPS / Docker (Run Anywhere)](#hosting-option-c-vps--docker-run-anywhere)
5. [Hosting Option D: Fly.io (Scalable Edge Container)](#hosting-option-d-flyio-scalable-edge-container)
6. [Environment Variables Reference](#environment-variables-reference)

---

## Prerequisites
Before hosting, ensure you have:
1. A **MongoDB Atlas** database. Register and get a free connection string at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas).
2. A GitHub repository containing this project's code.

---

## Hosting Option A: Render (Easiest & Free Tier)
Render is an excellent platform for hosting full-stack applications.

1. Go to [Render](https://render.com/) and log in.
2. Click **New +** and select **Web Service**.
3. Connect your GitHub repository.
4. Configure the Web Service settings:
   * **Name**: `lifeflow`
   * **Language**: `Node`
   * **Branch**: `main` (or your default branch)
   * **Build Command**: `npm run build`
   * **Start Command**: `npm run start`
5. Click **Advanced** to add the following **Environment Variables**:
   * `NODE_ENV`: `production`
   * `PORT`: `5000` (Render will map this automatically)
   * `MONGODB_URI`: *Your MongoDB connection string*
   * `JWT_SECRET`: *A secure random string (e.g. `your_production_secret`)*
   * `JWT_EXPIRES_IN`: `7d`
   * `CLIENT_URL`: *The Render URL of your web service (e.g. `https://lifeflow.onrender.com`)*
6. Click **Create Web Service**. Render will automatically clone, install dependencies, compile the React frontend and Express backend, and start the site!

---

## Hosting Option B: Railway (Fastest)
Railway is extremely fast and has a simple setup.

1. Go to [Railway](https://railway.app/) and sign in.
2. Click **New Project** -> **Deploy from GitHub repo**.
3. Select your repository.
4. Railway will auto-detect the root `package.json`.
5. Click **Variables** on the service and add:
   * `NODE_ENV` = `production`
   * `MONGODB_URI` = *Your MongoDB connection string*
   * `JWT_SECRET` = *Your secret key*
   * `JWT_EXPIRES_IN` = `7d`
   * `CLIENT_URL` = `${{RAILWAY_PUBLIC_DOMAIN}}` (Railway will automatically use your public domain here!)
6. Under **Settings**, click **Generate Domain** to get your public URL.
7. Deployment happens automatically on push.

---

## Hosting Option C: VPS / Docker (Run Anywhere)
If you have a Virtual Private Server (VPS) on DigitalOcean, Linode, AWS, Hetzner, etc., you can deploy the app using Docker.

### 1. Build and Run via Docker
To build and run the container locally or on your server:
```bash
# Build the Docker image
docker build -t lifeflow .

# Run the container
docker run -d \
  -p 5000:5000 \
  -e NODE_ENV=production \
  -e MONGODB_URI="your_mongodb_connection_string" \
  -e JWT_SECRET="your_jwt_secret" \
  -e JWT_EXPIRES_IN="7d" \
  -e CLIENT_URL="http://your-server-ip:5000" \
  --name lifeflow-app \
  lifeflow
```

### 2. Run via Docker Compose (Recommended)
Rename `.env.example` to `.env` on your server, customize the variables, and run:
```bash
docker compose up -d --build
```
This spins up the application and runs it in the background, restarting automatically if it crashes or the server restarts.

---

## Hosting Option D: Fly.io (Scalable Edge Container)
Fly.io runs your application globally on micro-VMs.

1. Install the flyctl CLI:
   * **macOS/Linux**: `curl -L https://fly.io/install.sh | sh`
   * **Windows (PowerShell)**: `pwsh -Command "iwr https://fly.io/install.ps1 | iex"`
2. Log in: `fly auth login`
3. Run initialization: `fly launch`
   * Fly.io will automatically scan the directory and detect the `Dockerfile`.
   * Follow the prompts to name the application and choose a region.
   * When asked if you want to deploy now, say **No** (so you can set secrets first).
4. Set your production secrets securely:
   ```bash
   fly secrets set MONGODB_URI="your_mongodb_connection_string" JWT_SECRET="your_jwt_secret"
   ```
5. Deploy: `fly deploy`
6. Open your browser to the deployed app: `fly open`

---

## Environment Variables Reference

| Variable | Description | Recommended Value |
| :--- | :--- | :--- |
| `NODE_ENV` | Mode environment | `production` |
| `PORT` | Listening port for Express | `5000` (or leave default for hosts) |
| `MONGODB_URI` | Connection URI for database | MongoDB Atlas cloud string |
| `JWT_SECRET` | Secret key used for signing JWTs | A long random string |
| `JWT_EXPIRES_IN` | Token duration | `7d` |
| `CLIENT_URL` | Main application URL | Deployed site's URL (e.g. `https://lifeflow.onrender.com`) |
| `VITE_API_URL` | Frontend API endpoint path | `/api` (default) |
