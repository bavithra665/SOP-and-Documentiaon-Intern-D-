# AI-Powered Documentation, SOP Compliance and Knowledge Management System

## Phase 1 (Foundation Only)
This monorepo sets up a production-ready foundation for a SaaS platform:
- Django + Django REST Framework
- PostgreSQL
- JWT authentication
- RBAC scaffolding (Admin/Manager/Employee)
- Service-layer oriented backend folder structure
- React + Vite + Tailwind + Router
- Axios service layer scaffolding
- Shared theme system (Ocean Blue + White)

> Business modules (documentation/SOP/AI/quiz/compliance/analytics) are intentionally not created in this phase.

## Tech Stack
- Frontend: React, Vite, Tailwind CSS, React Router DOM, Axios, Recharts (dev dependency not required yet)
- Backend: Django, Django REST Framework
- Auth: JWT (simplejwt)
- DB: PostgreSQL

## Quick Start (Docker)
1. Copy env templates:
   - `cp .env.example .env` (or create manually)
   - `cp apps/backend/.env.example apps/backend/.env` (optional)
2. Start infrastructure:
   - `docker compose up -d`
3. Backend:
   - `cd apps/backend`
   - Create/activate venv and install requirements (see `apps/backend/README.md`)
   - `python manage.py migrate`
   - `python manage.py runserver`
4. Frontend:
   - `cd apps/frontend`
   - `npm install`
   - `npm run dev`

## Repository Structure
- `apps/backend`: Django project
- `apps/frontend`: React project
- `infra`: docker-compose and infra templates
- `docs/architecture`: architecture docs

