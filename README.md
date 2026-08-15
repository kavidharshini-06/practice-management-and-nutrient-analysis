# Comprehensive Ayurvedic Dietitian Practice Management & Nutrient Analysis Portal

An advanced, production-ready, cloud-capable web application designed specifically for Ayurvedic dietitians and nutrition practitioners. This system streamlines client onboarding, Prakriti (body constitution) tracking, consultation logs, and integrates an automated **Nutrient Analysis Engine** for scaling and summing calories and macronutrients in personalized daily diet plans.

---

## 🚀 Key Features

* **Role-Based Portals**: Distinct dashboards and view permissions for **Admins**, **Dietitians**, and **Patients**.
* **Clinical Client Directories**: Searchable patient registry including height, weight, BMI, allergies, health goals, and Ayurvedic profiles.
* **Intake Assessment Logs**: Records historical consultations, client complaints, dosha assessments, and follow-up schedules.
* **Interactive Diet Plan Builder**: Multi-meal plan scheduler (Early Morning to Bedtime) with a **Live Nutrient Calculation Engine** that scales values based on grams and serving sizes.
* **Interactive Analytics**: Embedded Recharts metrics detailing patient growth, Prakriti distribution, and appointment timelines.
* **Prakriti (Dosha) Advisory Engine**: Custom warnings and suggestions based on whether the patient is classified as Vata, Pitta, Kapha, or mixed doshas.
* **Printable Diet Reports**: Clean, formatted CSS print styles designed to generate clean PDFs for download/printing with disclaimers.
* **Zero-Config Database Connector**: Primary PostgreSQL connection, with an automatic fallback to local JSON database (`backend/database/db.json`) if no cloud URL is set.

---

## 🛠️ Technology Stack

* **Frontend**: React.js, Vite, Axios, Tailwind CSS, React Router, Recharts, Lucide Icons.
* **Backend**: Node.js, Express.js.
* **Database**: PostgreSQL (Cloud Mode), JSON database emulator (Local Fallback Mode).
* **Authentication**: JWT tokens, bcrypt password hashing, Role-Based Access Control (RBAC).

---

## 📂 Project Structure

```text
├── backend/
│   ├── database/
│   │   ├── schema.sql        # PostgreSQL Schema Definitions
│   │   ├── seed.sql          # Seed data (30+ foods, default credentials)
│   │   └── db.json           # JSON Database (Local Fallback Mode)
│   ├── src/
│   │   ├── config/
│   │   │   └── db.js         # Unified PostgreSQL/JSON Database Connector
│   │   ├── controllers/      # Auth, Patients, Foods, Diet Plans, Appts, Stats
│   │   ├── middleware/       # Auth guards and Role access checks
│   │   ├── routes/           # Central API routes
│   │   └── app.js            # Express config
│   ├── server.js             # Entrypoint
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── components/       # Responsive Sidebar, Header, ProtectedGuard
│   │   ├── context/          # Auth Context (token storage & Axios headers)
│   │   ├── pages/
│   │   │   ├── Auth/         # Login, Register, Forgot, Reset Password
│   │   │   ├── Admin/        # User controls, Dietitians management, Food DB
│   │   │   ├── Dietitian/    # Dashboard, Directory, Consultation Logs, Builder
│   │   │   └── Patient/      # Client Profile, appointments, progress, diets
│   │   ├── services/
│   │   │   └── api.js        # Axios instance configured with token interceptors
│   │   ├── App.jsx           # Routing mapping
│   │   ├── main.jsx          # DOM entrypoint
│   │   └── index.css         # Tailwind directives and print layouts
│   └── package.json
```

---

## 🔑 Default Demo Accounts

For immediate evaluation, you can click the quick-login buttons on the login screen or enter:

| Role | Email | Password | Scope |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@ayurdiet.com` | `admin123` | Control practitioners, food databases, global stats |
| **Dietitian** | `dietitian1@ayurdiet.com` | `dietitian123` | Create patients, write diet plans, book visits |
| **Patient** | `john@gmail.com` | `patient123` | Check assigned meals, log weights, review visits |

---

## 💻 Local Development Setup

### 1. Backend Setup

1. Open a terminal and navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Configure environment variables in `backend/.env` (a pre-filled file is already generated for local sqlite/JSON fallback):
   ```env
   PORT=5000
   DATABASE_URL=
   JWT_SECRET=super_secret_ayurvedic_dietitian_practice_management_key
   FRONTEND_URL=http://localhost:5173
   ```
4. Start the backend developer node:
   ```bash
   npm run dev
   ```

### 2. Frontend Setup

1. Open a separate terminal and navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install --legacy-peer-deps
   ```
3. Verify `frontend/.env` is set:
   ```env
   VITE_API_URL=http://localhost:5000/api
   ```
4. Start the frontend Vite dev server:
   ```bash
   npm run dev
   ```
5. Open your browser and navigate to the listed Vite port (usually [http://localhost:5173](http://localhost:5173)).

---

## ☁️ Deployment Instructions

### Database (PostgreSQL)
Create a free database on [Neon.tech](https://neon.tech) or Render, copy the external database connection URI, and specify it as `DATABASE_URL` in your backend server environments.

### Backend (Render)
1. Link your GitHub repository to Render.
2. Select **Web Service** and choose Node.js environment.
3. Configure settings:
   * Build Command: `npm install`
   * Start Command: `node server.js`
4. Set Environment Variables:
   * `DATABASE_URL`: Your cloud PostgreSQL connection string.
   * `JWT_SECRET`: A secure 32-character string.
   * `FRONTEND_URL`: Your deployed frontend domain (e.g. `https://your-app.vercel.app`).
   * `NODE_ENV`: `production`

### Frontend (Vercel / Netlify)
1. Link your frontend directory to Vercel or Netlify.
2. Set Environment Variables:
   * `VITE_API_URL`: Your deployed Render backend URL prefixed with `/api` (e.g. `https://your-backend.onrender.com/api`).
3. Deploy!
