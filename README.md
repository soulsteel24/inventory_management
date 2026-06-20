# Inventory SYNC

Welcome to **Inventory SYNC**, a state-of-the-art corporate hardware tracking and inventory order management system. It features a premium light/dark responsive dashboard layout, asset reporting tools, and a secure authentication system integrated with Clerk.

---

## 🚀 Key Features

- **Hardware Overview Dashboard**: Real-time corporate metrics summary (Total Assets, Assigned utilization rates, and Pending Repairs) styled precisely with visual graphs and detailed activity trackers.
- **Dynamic Charting**: Built-in visual analytics showcasing item distribution across product categories (Laptops, Phones, Tablets, and Monitors).
- **Secure Authentication**: Clerk-powered user authentication, supporting sign-in, registration, and user profiles.
- **Theme Switching Context**: Dynamic theme integration allowing instant switching between premium Light and Dark themes, persisted via browser `localStorage`.
- **Relational Databases**: Backed by PostgreSQL (with SQLite compatibility for local testing) using SQLAlchemy relationships (Products, Customers, Orders, and Order Items).
- **Containerized Deployment**: Ready-to-go environment wrapper using Docker and Docker Compose.

---

## 🛠️ Technology Stack

- **Backend**: FastAPI (Python 3.13), SQLAlchemy, PostgreSQL / SQLite.
- **Frontend**: React (v18), Vite, Tailwind CSS (v4), Axios, Lucide React icons, Clerk Auth.
- **Deployment**: Docker, Docker Compose, Nginx.

---

## 📂 Project Structure

```text
inventory_management/
├── backend/                  # Python FastAPI application
│   ├── app/
│   │   ├── routers/          # API Endpoints (products, customers, orders, auth)
│   │   ├── auth.py           # JWT helper utilities (if needed)
│   │   ├── models.py         # SQLAlchemy Database models
│   │   ├── schemas.py        # Pydantic validation schemas
│   │   └── main.py           # CORS setup and Router imports
│   └── requirements.txt
├── frontend/                 # React SPA application
│   ├── src/
│   │   ├── context/          # Auth Context (Clerk Wrapper), Theme Context, Toast alerts
│   │   ├── pages/            # Login, Signup, Dashboard, Inventory (Products), Customers, Orders
│   │   ├── api.js            # Axios configuration (withCredentials: true)
│   │   └── App.jsx           # Main router, Clerk Provider & layout wrappers
│   └── package.json
└── docker-compose.yml        # Orchestrates db, backend, and frontend
```

---

## ⚙️ Environment Configuration

Before running the application, make sure to configure your environment variables.

1. **Root Directory**:
   Create a `.env` file based on `.env.example`:
   ```env
   # Clerk Authentication Config
   VITE_CLERK_PUBLISHABLE_KEY=pk_test_...
   CLERK_SECRET_KEY=sk_test_...

   # Database Credentials & Port Configuration
   POSTGRES_USER=postgres
   POSTGRES_PASSWORD=postgres
   POSTGRES_DB=inventory
   DATABASE_URL=postgresql://postgres:postgres@db:5432/inventory
   ```

2. **Frontend Directory**:
   Vite requires `VITE_CLERK_PUBLISHABLE_KEY` in the frontend environment (e.g., `frontend/.env.local` or environment variables):
   ```env
   VITE_CLERK_PUBLISHABLE_KEY=pk_test_...
   ```

---

## 💻 Running the Application

### Option 1: Docker Compose (Recommended)

To launch the database, FastAPI service, and React frontend in a single command:

1. Build and run the services:
   ```bash
   docker-compose up --build
   ```
2. Access the frontend application at:
   - [http://localhost:3000](http://localhost:3000)
3. Access the interactive API docs at:
   - [http://localhost:8000/docs](http://localhost:8000/docs)

### Option 2: Running Services Locally

#### 1. Backend Setup
1. Move to the backend folder:
   ```bash
   cd backend
   ```
2. Activate your virtual environment and install requirements:
   ```bash
   .venv\Scripts\activate
   pip install -r requirements.txt
   ```
3. Run the development API server:
   ```bash
   uvicorn backend.app.main:app --reload
   ```

#### 2. Frontend Setup
1. Move to the frontend folder:
   ```bash
   cd ../frontend
   ```
2. Install dependency modules:
   ```bash
   npm install
   ```
3. Boot the Vite development workspace:
   ```bash
   npm run dev
   ```
4. Access the site locally via [http://localhost:5173](http://localhost:5173).
