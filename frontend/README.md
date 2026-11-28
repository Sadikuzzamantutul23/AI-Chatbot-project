# Clarity AI workspace

React + Vite frontend for the existing FastAPI chatbot backend.

## Run locally

1. Copy `.env.example` to `.env` and set `VITE_API_BASE_URL` to the backend URL (the default is `http://localhost:8000`).
2. Install dependencies with `npm install`.
3. Start the frontend with `npm run dev`.

The backend still owns Gemini credentials. Set `FRONTEND_ORIGINS` in `backend/.env` to a comma-separated list of allowed frontend origins for deployment; local Vite origins are allowed by default. Keep `SECRET_KEY`, `GEMINI_API_KEY`, and database credentials in the backend environment only.

## Checks

- `npm run build` creates the production bundle.
- `npm run lint` checks the frontend source.
