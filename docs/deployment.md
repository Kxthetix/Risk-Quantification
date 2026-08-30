# Complete Production Deployment & Infrastructure Guide

## 1. Production Architecture Overview

The platform uses a layered microservice and container architecture designed for high availability, zero-downtime rolling updates, strict multi-tenant isolation, and automated failover.

```text
                               INTERNET
                                  │
                                  ▼
                         [ DNS / HTTPS (TLS 1.3) ]
                                  │
                                  ▼
                         [ AWS WAF v2 / CDN ]
                                  │
                                  ▼
                      [ Application Load Balancer ]
                                  │
               ┌──────────────────┴──────────────────┐
               ▼                                     ▼
      [ NGINX Reverse Proxy ]               [ Next.js Frontend ]
        (Caching / Rate Limiting)             (Replicated App Pods)
               │                                     │
               └──────────────────┬──────────────────┘
                                  ▼
                       [ FastAPI Backend API ]
                       (Replicated Stateless Pods)
                                  │
        ┌─────────────────────────┼─────────────────────────┐
        ▼                         ▼                         ▼
 [ Celery / Async Workers ]  [ PostgreSQL 16 RDS ]     [ Redis 7 Cache ]
 (Simulation / Sync Jobs)    (Multi-AZ Hot Standby)    (Append-Only Persistence)
```

---

## 2. Deployment Strategies

### 2.1 Docker Compose Deployment (Single-Node / Small Cluster)
```bash
# 1. Configure production environment
cp .env.production.example .env.production

# 2. Build and launch all microservices in detached mode
docker-compose -f deployment/docker/docker-compose.prod.yml up -d --build

# 3. Apply database migrations
docker-compose -f deployment/docker/docker-compose.prod.yml run --rm api alembic upgrade head

# 4. Verify deployment health
python scripts/smoke_test.py --url http://localhost:8000
```

### 2.2 Kubernetes Deployment (Enterprise Multi-Node Cluster)
```bash
# 1. Apply core RBAC, ConfigMaps, Secrets, and Network Policies
kubectl apply -f deployment/kubernetes/serviceaccount.yaml
kubectl apply -f deployment/kubernetes/configmap.yaml
kubectl apply -f deployment/kubernetes/secret.yaml
kubectl apply -f deployment/kubernetes/networkpolicy.yaml

# 2. Deploy workloads and auto-scalers
kubectl apply -f deployment/kubernetes/deployment.yaml
kubectl apply -f deployment/kubernetes/service.yaml
kubectl apply -f deployment/kubernetes/hpa.yaml
kubectl apply -f deployment/kubernetes/pdb.yaml

# 3. Apply Ingress with TLS Termination
kubectl apply -f deployment/kubernetes/ingress.yaml
```

### 2.3 Cloud Infrastructure as Code (Terraform)
```bash
# 1. Initialize Terraform
cd infrastructure
terraform init

# 2. Review execution plan
terraform plan -var="environment=production"

# 3. Apply cloud resources (VPC, Subnets, RDS, WAF, S3)
terraform apply -var="environment=production" -auto-approve
```

---

## 3. Automated CI/CD Deployment Pipeline

The GitHub Actions pipeline (`.github/workflows/ci-cd.yml`) executes the following on every pull request and push to `main`:

1. **Backend CI**:
   - Flake8 linting, `pip-audit` CVE vulnerability scan, Alembic migration test, full Pytest execution across 28+ suites.
2. **Frontend CI**:
   - TypeScript compilation (`npx tsc --noEmit`), Vitest suite execution (54 files, 135+ tests), Next.js production build (`npm run build`).
3. **Containerization & Scanning**:
   - Multi-stage Docker image builds with Trivy security scans for container vulnerabilities.
4. **Production Smoke Testing**:
   - Execution of synthetic verification tests (`scripts/smoke_test.py`).

---

## 4. Zero-Downtime Rolling Updates & Rollback

### Automated Deployment with Rollback Guard
```bash
# Execute automated deployment script
bash scripts/deploy_production.sh
```

### Manual Rollback Procedure
```bash
# If container rollback is required
docker-compose -f deployment/docker/docker-compose.prod.yml up -d --force-recreate api:v1.0.0-previous

# If database migration rollback is required
docker-compose -f deployment/docker/docker-compose.prod.yml run --rm api alembic downgrade -1
```
