# Cybersecurity Risk Assessment and Financial Impact Analysis Platform

> **Smart India Hackathon (SIH) Prototype — Phase 1: Backend Foundation**

A robust, enterprise-grade, asynchronous backend platform built with **FastAPI**, **SQLAlchemy 2.x**, **PostgreSQL**, **Pydantic v2**, and **Docker**. This foundation provides multi-tenant data isolation, JWT authentication, hierarchical Role-Based Access Control (RBAC), database migrations with Alembic, and centralized exception handling.

---

## 1. Project Overview

The Cybersecurity Risk Assessment and Financial Impact Analysis platform enables organizations to model their digital assets, continuously evaluate vulnerabilities, compute threat-driven risk scores, and quantify financial loss exposure (ALE, Single Loss Expectancy, Business Interruption).

**Phase 1** establishes the mission-critical foundation:
- Secure multi-tenant organizational isolation
- Scalable asynchronous architecture
- JWT-based authentication & hierarchical authorization
- Centralized exception and audit structure
- Complete Docker and migration workflow

---

## 2. Architecture

```
                               ┌───────────────────────────┐
                               │     Client / Frontend     │
                               │     (React / Next.js)     │
                               └─────────────┬─────────────┘
                                             │ HTTP / Bearer JWT
                                             ▼
                       ┌───────────────────────────────────────────┐
                       │               FastAPI App                 │
                       │ ┌───────────────────────────────────────┐ │
                       │ │        CORS & Exception Handlers      │ │
                       │ └───────────────────┬───────────────────┘ │
                       │                     │                     │
                       │ ┌───────────────────▼───────────────────┐ │
                       │ │      API Router (/api/v1)             │ │
                       │ │  - /auth (Register, Login, /me)       │ │
                       │ │  - /organizations (Tenant Isolation)  │ │
                       │ │  - /users (Org User Management)       │ │
                       │ │  - /health (App & DB Health Checks)   │ │
                       │ └───────────────────┬───────────────────┘ │
                       │                     │                     │
                       │ ┌───────────────────▼───────────────────┐ │
                       │ │        Service & RBAC Layer           │ │
                       │ │  - AuthService / UserService          │ │
                       │ │  - OrganizationService                │ │
                       │ │  - RBAC & Isolation Dependencies      │ │
                       │ └───────────────────┬───────────────────┘ │
                       │                     │                     │
                       │ ┌───────────────────▼───────────────────┐ │
                       │ │   Async SQLAlchemy 2.0 ORM Models     │ │
                       │ │        (Base, Org, User)              │ │
                       │ └───────────────────┬───────────────────┘ │
                       └─────────────────────┼─────────────────────┘
                                             │ asyncpg
                                             ▼
                               ┌───────────────────────────┐
                               │    PostgreSQL Database    │
                               │   (Multi-tenant Schema)   │
                               └───────────────────────────┘
```

---

## 3. Technology Stack

- **Runtime & Language**: Python 3.12+
- **Web Framework**: FastAPI (Async ASGI)
- **Database**: PostgreSQL 16 (via `asyncpg` and SQLAlchemy 2.0 AsyncEngine)
- **Data Validation & Settings**: Pydantic v2 & Pydantic Settings
- **Authentication & Security**: PyJWT, bcrypt password hashing (12 salt rounds)
- **Migrations**: Alembic (Async migration runner)
- **Testing**: Pytest & pytest-asyncio, HTTPX AsyncClient, aiosqlite in-memory test engine
- **Containerization**: Docker (multi-stage non-root build), Docker Compose

---

## 4. Project Structure

```text
cyber-risk-backend/
├── app/
│   ├── main.py                  # FastAPI app factory, CORS, Lifespan, Exceptions
│   │
│   ├── core/                    # Core infrastructural configuration
│   │   ├── config.py            # Pydantic v2 Settings (env vars, validation)
│   │   ├── database.py          # Async SQLAlchemy 2.x engine, session, Base
│   │   ├── security.py          # Password hashing (bcrypt) & JWT management
│   │   ├── dependencies.py      # Current user, get_db, RBAC & tenant dependencies
│   │   └── exceptions.py        # Custom error hierarchy & unified exception handlers
│   │
│   ├── models/                  # SQLAlchemy 2.0 ORM Models
│   │   ├── __init__.py          # Base, Model exports
│   │   ├── organization.py      # Organization entity (Tenant boundary)
│   │   └── user.py              # User entity & UserRole enum
│   │
│   ├── schemas/                 # Pydantic v2 Data Transfer Objects
│   │   ├── __init__.py          # Schema exports
│   │   ├── common.py            # Generic API envelopes, Health schemas
│   │   ├── user.py              # UserCreate, UserLogin, UserResponse, etc.
│   │   └── organization.py      # OrganizationCreate, OrganizationUpdate, Response
│   │
│   ├── api/                     # API Routers & Controllers
│   │   ├── __init__.py          # Main API router
│   │   └── v1/
│   │       ├── __init__.py      # Router aggregation for /api/v1
│   │       ├── auth.py          # /api/v1/auth (register, login, me)
│   │       ├── users.py         # /api/v1/users (list, get, create, update)
│   │       ├── organizations.py # /api/v1/organizations (get, update)
│   │       └── health.py        # /api/v1/health & /health
│   │
│   ├── services/                # Business Logic Layer
│   │   ├── __init__.py
│   │   ├── auth_service.py      # Registration, login, token issuing logic
│   │   ├── user_service.py      # User CRUD & org isolation logic
│   │   └── organization_service.py # Org management & tenant isolation
│   │
│   └── utils/                   # Shared utility functions
│       └── __init__.py
│
├── migrations/                  # Alembic database migration scripts
│   ├── env.py                   # Async Alembic environment
│   ├── script.py.mako           # Migration template
│   └── versions/                # Version migration files
│       └── 001_initial_schema.py
│
├── tests/                       # Comprehensive Pytest suite (28+ tests)
│   ├── __init__.py
│   ├── conftest.py              # Async DB fixtures, HTTP client, test user fixtures
│   ├── test_health.py           # Health & DB connectivity test
│   ├── test_auth.py             # Register, login, JWT validation, /me tests
│   ├── test_organizations.py    # Organization isolation and RBAC tests
│   └── test_users.py            # User listing & permissions tests
│
├── .env.example                 # Template for environment variables
├── .gitignore                   # Ignored files and directories
├── requirements.txt             # Python dependencies
├── Dockerfile                   # Multi-stage production container definition
├── docker-compose.yml           # Backend and PostgreSQL service definition
├── alembic.ini                  # Alembic configuration
├── Makefile                     # Shortcut commands for dev/test/docker
└── README.md                    # Project documentation
```

---

## 5. Database Schema

### `organizations`
| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | UUID | Primary Key | Unique organization identifier |
| `name` | VARCHAR(255) | Unique, Not Null, Indexed | Organization legal/operating name |
| `description` | TEXT | Nullable | Organization summary / description |
| `industry` | VARCHAR(100) | Nullable, Indexed | Industry classification |
| `created_at` | TIMESTAMPTZ | Not Null, Default `now()` | Record creation timestamp |
| `updated_at` | TIMESTAMPTZ | Not Null, Default `now()` | Record last update timestamp |

### `users`
| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | UUID | Primary Key | Unique user identifier |
| `organization_id` | UUID | Foreign Key (`organizations.id` ON DELETE CASCADE), Indexed | Tenant boundary reference |
| `full_name` | VARCHAR(255) | Not Null | User's full name |
| `email` | VARCHAR(255) | Unique, Not Null, Indexed | Normalized lowercase email |
| `password_hash` | VARCHAR(255) | Not Null | Bcrypt hashed password |
| `role` | VARCHAR(50) | Not Null, Default `VIEWER`, Indexed | Role: `ADMIN`, `SECURITY_ANALYST`, `MANAGER`, `VIEWER` |
| `is_active` | BOOLEAN | Not Null, Default `TRUE` | Account active state |
| `created_at` | TIMESTAMPTZ | Not Null, Default `now()` | Record creation timestamp |
| `updated_at` | TIMESTAMPTZ | Not Null, Default `now()` | Record last update timestamp |

---

## 6. Environment Configuration

Copy `.env.example` to `.env` and adjust variables as needed:

```bash
cp .env.example .env
```

| Variable | Default Value | Description |
|---|---|---|
| `APP_ENV` | `development` | Environment mode (`development`, `testing`, `production`) |
| `DEBUG` | `True` | Debug mode toggle |
| `DATABASE_URL` | `postgresql+asyncpg://postgres:postgres@localhost:5432/cyber_risk_db` | Async PostgreSQL connection string |
| `JWT_SECRET_KEY` | *(change in prod)* | Secret key used for signing JWTs |
| `JWT_ALGORITHM` | `HS256` | JWT cryptographic algorithm |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | `60` | Token expiration lifetime |
| `CORS_ORIGINS` | `http://localhost:3000,http://localhost:5173` | Allowed CORS origins (comma-separated) |
| `HOST` | `0.0.0.0` | Bind address |
| `PORT` | `8000` | Bind port |

---

## 7. Installation & Local Development

### Prerequisites
- Python 3.12+
- PostgreSQL 16 (or Docker)

### Setup Virtual Environment
```bash
python -m venv .venv
# On Windows
.venv\Scripts\activate
# On Linux/macOS
source .venv/bin/activate

pip install -r requirements.txt
```

### Apply Migrations
```bash
alembic upgrade head
```

### Run Server
```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

---

## 8. Docker Setup

Build and run both the PostgreSQL database and FastAPI backend with Docker Compose:

```bash
docker compose up --build
```

Access:
- **Interactive Swagger Docs**: `http://localhost:8000/docs`
- **ReDoc Documentation**: `http://localhost:8000/redoc`
- **Health Check**: `http://localhost:8000/health`

To stop containers:
```bash
docker compose down
```

---

## 9. API Endpoints

### Health Check
- `GET /health` — Root health check for load balancers
- `GET /api/v1/health` — Application health check
- `GET /api/v1/health/database` — PostgreSQL live query and latency check

### Authentication
- `POST /api/v1/auth/register` — Register a new user & organization
- `POST /api/v1/auth/login` — Authenticate and receive JWT Bearer token
- `GET /api/v1/auth/me` — Retrieve current authenticated user profile

### Organizations
- `GET /api/v1/organizations/{organization_id}` — Get organization info (tenant isolated)
- `PUT /api/v1/organizations/{organization_id}` — Update organization (requires `MANAGER` or `ADMIN`)

### Users
- `GET /api/v1/users` — List users in organization
- `GET /api/v1/users/{user_id}` — Get user details
- `POST /api/v1/users` — Create user in organization (requires `ADMIN`)
- `PUT /api/v1/users/{user_id}` — Update user role/status (requires `ADMIN`)

---

## 10. Example API Requests

### 1. Register User & Organization
```bash
curl -X POST http://localhost:8000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "full_name": "Chief Security Officer",
    "email": "cso@cyberdefense.com",
    "password": "SecurePassword123!",
    "organization_name": "Cyber Defense Inc",
    "industry": "Financial Services",
    "description": "Global SOC & Risk Unit"
  }'
```

### 2. Login
```bash
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "cso@cyberdefense.com",
    "password": "SecurePassword123!"
  }'
```

Response:
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "expires_in": 3600
}
```

### 3. Access `/auth/me`
```bash
curl -X GET http://localhost:8000/api/v1/auth/me \
  -H "Authorization: Bearer <ACCESS_TOKEN>"
```

### 4. Update Organization
```bash
curl -X PUT http://localhost:8000/api/v1/organizations/<ORG_ID> \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "description": "Updated Global Risk & SOC Division",
    "industry": "Fintech & Banking"
  }'
```

---

## 11. Running Tests

Run the complete Pytest asynchronous test suite:

```bash
python -m pytest -v
```

Output:
```text
====================== 28 passed, 0 failed in 18.5s =======================
```

Tests cover:
- Health and database connectivity
- Registration (success, duplicate, invalid email, short password, missing fields)
- Login (valid, incorrect password, unknown email, inactive account)
- JWT validation (valid, expired, invalid, missing)
- Organization multi-tenant data isolation (cross-tenant access rejected with HTTP 403)
- Hierarchical RBAC authorization (`ADMIN` > `SECURITY_ANALYST` > `MANAGER` > `VIEWER`)

---

## 12. SIH Platform Development Roadmap

```text
Phase 1  - Backend Foundation (COMPLETED)
Phase 2  - Asset & Software Management
Phase 3  - Vulnerability Intelligence & CVE Ingestion
Phase 4  - Vulnerability Validation & Exploit Verification
Phase 5  - Threat-Driven Risk Assessment Engine
Phase 6  - Financial Impact & Loss Quantification Engine (FAIR/ALE)
Phase 7  - Attack Path & Blast Radius Analysis
Phase 8  - AI/ML Threat Correlation & Anomaly Detection
Phase 9  - Actionable Remediation & Recommendation Engine
Phase 10 - Executive Reporting & Production Hardening
```

### How Phase 2 Connects to This Foundation:
- **Tenant Scoping**: All future entities (`Asset`, `SoftwareInventory`, `VulnerabilityFinding`) will reference `organization_id` with foreign keys and cascade rules.
- **Dependency Reusability**: Endpoints will utilize the `get_current_user` and `require_role(...)` dependencies established in Phase 1 to guarantee zero cross-tenant data leakage.
- **Service Layer Pattern**: New services (`AssetService`, `ScanService`) will adhere to the clean async service pattern established in `UserService` and `OrganizationService`.
