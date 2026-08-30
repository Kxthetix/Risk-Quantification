# Database Schema, Indexing & Performance Architecture

## 1. Database Architecture & Technology Stack

- **RDBMS**: PostgreSQL 16+
- **Driver**: `asyncpg` via SQLAlchemy 2.0 async engine
- **Connection Pool**: Sized for high concurrency with `DB_POOL_SIZE=20`, `DB_MAX_OVERFLOW=10`, `DB_POOL_TIMEOUT=30s`, `DB_POOL_RECYCLE=1800s`.
- **Migration Framework**: Alembic

---

## 2. Multi-Tenant Indexing Strategy

All primary data entities enforce high-selectivity composite indexes partitioned by `organization_id`:

| Table | Index Columns | Purpose |
|---|---|---|
| `assets` | `(organization_id, id)` | Fast tenant-isolated asset retrieval and IDOR prevention |
| `assets` | `(organization_id, ip_address)` | Accelerated telemetry correlation and deduplication |
| `assets` | `(organization_id, criticality)` | Risk filtering and executive distribution aggregations |
| `vulnerabilities` | `(cve_id)` (UNIQUE) | Global vulnerability catalog deduplication |
| `asset_vulnerabilities` | `(asset_id, vulnerability_id)` | Fast junction matching and status tracking |
| `risk_assessments` | `(asset_id, created_at DESC)` | Historical trend querying and risk score lookups |
| `financial_assessments` | `(organization_id, created_at DESC)`| Rapid financial exposure and Monte Carlo retrieval |
| `audit_logs` | `(organization_id, created_at DESC)`| Fast compliance and forensic audit filtering |
| `integrations` | `(organization_id, connector_type)` | Fast connector catalog lookups |

---

## 3. Query Optimization & Performance Guidelines

1. **Avoid N+1 Queries**:
   - Utilize SQLAlchemy `joinedload` / `selectinload` when querying relationships (e.g. `Asset -> Vulnerabilities -> Software`).
2. **Server-Side Pagination**:
   - All listing endpoints enforce `limit <= 100` and `offset >= 0` to prevent memory exhaustion on large datasets.
3. **Connection Lifecycle**:
   - Database sessions are managed per-request using FastAPI's dependency injection (`Depends(get_db)`), ensuring connections are immediately returned to the pool after response generation.
