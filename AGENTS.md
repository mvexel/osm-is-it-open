# Repository Guidelines

## Project Structure & Module Organization
- `backend/app`: FastAPI service. `main.py` exposes `/api/pois` and `/api/health`, `overpass.py` builds Overpass queries, `opening_hours.py` evaluates opening hours, and `models.py` holds Pydantic schemas with camelCase fields to match the frontend.
- `backend/test_opening_hours.py`: lightweight parser checks runnable without the API server.
- `frontend/src`: React + TypeScript client. `components/Map.tsx` renders MapLibre, `hooks/` stores shared state, `types/` defines POI shapes, `utils/` contains helpers, and `index.css` wires Tailwind.
- `dev.sh`: convenience script to boot backend and frontend together.

## Build, Test, and Development Commands
- Install deps once: `uv pip install -e .` for Python, then `cd frontend && npm install`.
- Run both servers: `./dev.sh` (uses uvicorn + Vite dev server).
- Run separately: `uv run uvicorn backend.app.main:app --reload --port 8000` and `cd frontend && npm run dev`.
- Frontend quality: `cd frontend && npm run lint` (ESLint) and `npm run build` (type-check + bundle).
- Backend checks: `uv run pytest backend` for the suite or `python backend/test_opening_hours.py` for the quick parser script.

## Coding Style & Naming Conventions
- Python: 4-space indentation, type-hinted functions, and double quotes. Format with `uv run black backend` and lint with `uv run ruff check backend`. Use snake_case for internals; keep API payload keys in camelCase to stay aligned with the frontend.
- TypeScript/React: functional components in PascalCase; hooks prefixed with `use` live in `hooks/`; shared types in `types/` in camelCase; prefer explicit props typing and avoid `any`. Keep Tailwind classes concise and grouped by layout > spacing > color.

## Testing Guidelines
- Preferred flow: `uv run pytest backend` before committing. Add new backend tests under `backend/` with descriptive names (e.g., `test_overpass_response.py`).
- Frontend tests are not present; if adding, place `*.test.tsx` alongside components and use the Vite/ESM-friendly setup. For map or UI adjustments, attach a short screen capture or note manual steps taken.

## Commit & Pull Request Guidelines
- The branch has no recorded commits; use clear, imperative messages (recommended: Conventional Commits such as `feat: add map marker popups` or `fix: handle empty opening hours`). Keep scopes small.
- PRs should state purpose, include linked issues, list commands run (`npm run lint`, `npm run build`, `uv run pytest`), and add screenshots/gifs for visible UI changes. Mention any API surface or schema changes so the other side (frontend/backend) can adjust.

## Security & Configuration Tips
- No secrets are required; do not check in tokens or keys. Overpass endpoint is set in `backend/app/overpass.py`; change via env or constant only if you manage load appropriately.
- Keep CORS open only for local dev as shipped; restrict origins before deploying. When touching network code, keep timeouts reasonable to avoid blocking requests (`httpx.AsyncClient` currently uses 30s).
