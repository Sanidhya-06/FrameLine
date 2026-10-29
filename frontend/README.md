# FrameLine frontend

Screen A (search) and Screen B (collection) are built with React 18, TypeScript, Vite, Tailwind CSS, React Router, Framer Motion, and Zustand. `/map` and `/methodology` are later-phase placeholders.

## Run frontend and backend together

From the repository root, create/configure `.env` from `.env.example` and ensure `FRAMELINE_CONTACT_URL` is set. The backend CORS allowlist includes `http://localhost:5173` by default.

Terminal 1, from the repository root:

```powershell
.\venv\Scripts\python.exe -m uvicorn backend.main:app --reload --port 8000
```

Terminal 2:

```powershell
cd frontend
npm install
$env:VITE_API_URL = "http://localhost:8000"
npm run dev
```

Open `http://localhost:5173`. The browser communicates only with FastAPI. Set `VITE_API_URL` to the backend origin when it runs elsewhere. Search starts `POST /analyze/jobs`; the collection screen polls `GET /analyze/jobs/{job_id}` until the backend reports a terminal stage.

Build the static frontend bundle with `npm run build`.
