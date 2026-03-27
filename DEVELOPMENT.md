# EndowherAI Monorepo

Decoupled monorepo for EndowherAI:

- `frontend/` – Next.js (TypeScript + Tailwind)
- `backend/` – FastAPI (ML inference + agents)
- `machine-learning/` – research notebooks, data, and models
- `supabase/` – database schema and migrations

---

## 1. Prerequisites

Each teammate must have:

- **Node.js** (LTS, e.g. 20.x)
- **npm** (comes with Node)
- **Python 3.10+**
- **Git**

You do **not** need Docker to run the project locally.

---

## 2. Clone the Repository

```bash
git clone https://github.com/edbajric/EndowherAI.git
cd EndowherAI
```

---

## 3. Frontend (Next.js) – How to Run

Folder: `frontend/`

### 3.1 Install dependencies (first time only)

```bash
cd frontend
npm install
```

### 3.2 Run the development server

```bash
npm run dev
```

- The frontend will be available at:  
  `http://localhost:3000`

### 3.3 Stopping the frontend

- Press `Ctrl + C` in the terminal where `npm run dev` is running.

---

## 4. Backend (FastAPI) – How to Run

Folder: `backend/`

### 4.1 Create and activate virtual environment (first time on each machine)

From the **project root**:

```bash
cd backend
```

#### Create the virtual environment

**macOS / Linux (bash / zsh):**

```bash
python3 -m venv .venv
# or, if python3 is mapped:
python -m venv .venv
```

**Windows (PowerShell or cmd):**

```powershell
python -m venv .venv
```

#### Activate the virtual environment

**macOS / Linux (bash / zsh):**

```bash
source .venv/bin/activate
```

**Windows (PowerShell):**

```powershell
.venv\Scripts\Activate.ps1
```

**Windows (cmd):**

```cmd
.venv\Scripts\activate.bat
```

You should see `(.venv)` at the start of your terminal prompt.

### 4.2 Install backend dependencies (first time only)

```bash
pip install -r requirements.txt
# If FastAPI or Uvicorn are missing, install them directly:
pip install fastapi uvicorn
```

### 4.3 Run the FastAPI server

From inside `backend/` with the virtualenv activated:

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

- The backend will be available at:  
  `http://localhost:8000`

### 4.4 Stopping the backend

- Press `Ctrl + C` in the terminal where `uvicorn` is running.
- To deactivate the virtual environment:

**macOS / Linux / Windows (any shell inside venv):**

```bash
deactivate
```

---

## 5. Folder Overview (For Reference)

```text
EndowherAI/
├─ backend/
│  ├─ app/
│  │  ├─ agents/
│  │  ├─ api/
│  │  │  └─ v1/
│  │  ├─ core/
│  │  ├─ models/
│  │  ├─ services/
│  │  └─ main.py
│  └─ requirements.txt
├─ frontend/
│  ├─ public/
│  ├─ src/
│  │  └─ app/
│  ├─ package.json
│  └─ tsconfig.json
├─ machine-learning/
│  ├─ data/
│  ├─ models/
│  └─ notebooks/
├─ supabase/
│  └─ migrations/
└─ .gitignore
```

- **Do not commit**: `frontend/node_modules`, `backend/.venv`, any `.env` files, or `.pkl` model files (already covered by `.gitignore`).

---

## 6. Typical Workflow

1. Open two terminals (or split terminal):
   - **Terminal 1 – Frontend**

     ```bash
     cd EndowherAI/frontend
     npm run dev
     ```

   - **Terminal 2 – Backend**

     ```bash
     cd EndowherAI/backend
     # macOS / Linux:
     source .venv/bin/activate

     # Windows (PowerShell):
     # .venv\Scripts\Activate.ps1

     # Windows (cmd):
     # .venv\Scripts\activate.bat

     uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
     ```

2. Develop UI in `frontend/src/app/...` and APIs / ML logic in `backend/app/...`.

---

If you want, the next step is a tiny “Troubleshooting” block (e.g., “if `python` is not found, install Python 3.x”) tailored to your classmates’ setups.
