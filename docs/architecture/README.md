# Architecture Overview (Foundation Only)

This document describes the enterprise architecture and folder organization for the platform.

## System Goals
- Multi-tenant SaaS-ready foundation (scaffolding only)
- Clean separation of concerns:
  - API layer (DRF views)
  - Service/use-case layer
  - Domain entities/permissions helpers
  - Infrastructure concerns (DB, logging)
- API-first communication between frontend and backend
- Production-ready settings split by environment

## High-Level Components
### Backend (Django + DRF)
- **config/**: environment-based Django settings and URL routing
- **apps/**:
  - `core`: common settings, shared helpers
  - `authentication`: JWT auth scaffolding + RBAC scaffolding
- **services/** (service-layer pattern): future use-cases entry points
- **api/** (base response/exception strategy and DRF scaffolding)

### Frontend (React + Vite)
- **src/app/**: router and app shell
- **src/services/**: Axios client and API adapters
- **src/theme/**: shared theme system (Ocean Blue + White)
- **src/components/**: reusable UI primitives

## Error Handling Strategy (Backend)
- DRF exception handler converts internal errors into consistent JSON:
  - `code`, `message`, `details`, `request_id`
- Client-safe messages; internal traces logged only.

## Logging Strategy (Backend)
- Structured logs (JSON-like format where possible)
- `request_id` propagation middleware scaffold

## Security Baseline
- JWT access tokens (short-lived) and refresh tokens scaffolding
- CORS restricted via env vars
- RBAC helper checks roles at permission layer scaffold

> This phase does not implement any business modules.

