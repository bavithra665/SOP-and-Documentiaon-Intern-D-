# apps/backend (Django + DRF)

## Setup
1) Create venv and install dependencies

```bash
cd apps/backend
python -m venv .venv
. .venv\Scripts\activate
pip install -r requirements.txt
```

2) Create env

```bash
copy .env.example .env
```

3) Configure DB
- If using Docker: start `infra/docker-compose.yml` from repo root.

4) Migrate and run

```bash
python manage.py migrate
python manage.py runserver 0.0.0.0:8000
```

## Checks
```bash
python manage.py check
```

