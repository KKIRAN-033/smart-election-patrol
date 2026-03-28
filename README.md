# Smart Election Patrol & Incident Response System

This is a complete, deployable, real-time emergency response system featuring smooth live map tracking, automatic assignment of personnel, and ETA/Distance calculations using Haversine formulas.

## 🌟 Features
- **Real-Time Websockets**: Instant alerts to UI using Socket.IO.
- **Smooth Interpolated Movement**: Officers don't jump, they glide smoothly matching professional tracking standards.
- **Auto Assignment**: System automatically calculates the nearest free officer and dispatches them.
- **Custom Aesthetic UI**: Tailor-made Leaflet popups with a modern, glass-like UI, avoiding default markers.

## 🛠️ Tech Stack
- **Frontend**: React, Vite, Tailwind CSS, Leaflet, React-Leaflet
- **Backend**: Node.js, Express, MongoDB Mongoose, Socket.IO

---

## 💻 Local Setup Instructions

### 1. Database Setup
You will need a MongoDB URI. Create a free cluster on MongoDB Atlas if you haven't already.

### 2. Backend Initialization
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Update the `.env` file with your MongoDB URI:
   ```text
   MONGODB_URI=mongodb+srv://<user>:<password>@clusterxyz.mongodb.net/patrol?retryWrites=true&w=majority
   PORT=5000
   ```
4. Seed the database with sample officers:
   ```bash
   npm run seed
   ```
5. Start the server:
   ```bash
   npm start
   ```
   *(Running on port 5000)*

### 3. Frontend Initialization
1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```
   *(Running on port 5173)*

### 4. Running the Demo
1. Open `http://localhost:5173` in your browser.
2. Click anywhere on the map to drop a blue user pin.
3. Click the giant **🚨 REPORT INCIDENT** button.
4. Watch the nearest green officer turn red, and a popup appear over them.
5. Click **Accept Order** in the popup.
6. Watch the officer marker smoothly travel towards the incident location.
7. Observe the Live ETA and Distance updating dynamically in the popup.
8. Once they arrive, click **Force Resolve** or let the auto-resolve trigger kick in to reset their status to free!

---

## 🚀 Deployment Steps (Hackathon Ready)

### 1. Deploying Backend (Render / Railway)
1. Push your code to GitHub.
2. Create a new "Web Service" on [Render.com](https://render.com/).
3. Connect your GitHub repository.
4. Root Directory: `backend`
5. Build Command: `npm install`
6. Start Command: `npm start`
7. Add Environment Variables: `MONGODB_URI` (your atlas string).
8. Once deployed, copy your Render URL (e.g., `https://patrol-api.onrender.com`).

### 2. Deploying Frontend (Vercel)
1. In the `frontend` code, update `src/App.jsx` to replace `http://localhost:5000` with your new Render URL.
   *(Or set `VITE_API_URL` environment variable).*
2. Go to [Vercel.com](https://vercel.com/) and create a new project.
3. Connect the GitHub repository.
4. Framework Preset: **Vite**
5. Root Directory: `frontend`
6. Deploy!

Your Smart Election Patrol system is now live on the internet! 
