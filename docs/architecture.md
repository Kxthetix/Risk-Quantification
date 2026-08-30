# Production Architecture Overview

## 1. System Topology
The platform is designed as a stateless, horizontally scalable, multi-tenant cybersecurity risk quantification backend.

```text
                                  INTERNET / ENTERPRISE WAN
                                              │
                                              ▼
                                   ┌─────────────────────┐
                                   │ HTTPS Load Balancer │
                                   └──────────┬──────────┘
                                              │ TLS Termination (Port 443)
                                              ▼
                                   ┌─────────────────────┐
                                   │ NGINX Ingress Proxy │
                                   └──────────┬──────────┘
                                              │ Rate Limiting & Sec Headers
                                              ▼
                    ┌─────────────────────────┼─────────────────────────┐
                    ▼                         ▼                         ▼
         ┌─────────────────────┐   ┌─────────────────────┐   ┌─────────────────────┐
         │ FastAPI Instance #1 │   │ FastAPI Instance #2 │   │ FastAPI Instance #3 │
         └──────────┬──────────┘   └──────────┬──────────┘   └──────────┬──────────┘
                    │                         │                         │
                    └─────────────────────────┼─────────────────────────┘
                                              │
                    ┌─────────────────────────┼─────────────────────────┐
                    ▼                         ▼                         ▼
         ┌─────────────────────┐   ┌─────────────────────┐   ┌─────────────────────┐
         │ PostgreSQL Primary  │   │     Redis Cache     │   │ Background Workers  │
         │  (Relational Data)  │   │ (Tokens & Throttles)│   │(Monte Carlo/Reports)│
         └─────────────────────┘   └─────────────────────┘   └─────────────────────┘
```

## 2. Stateless Design & Scaling
- **Stateless Application Tier**: No user sessions or temporary tokens are kept in volatile local memory. Token identifiers and revocations are persisted to PostgreSQL/Redis.
- **Horizontal Autoscaling (HPA)**: Kubernetes HPA scales API pods based on CPU ($> 70\%$) and Memory ($> 80\%$) thresholds.
- **Zero-Downtime Deployments**: Uses Kubernetes RollingUpdates (`maxSurge: 1`, `maxUnavailable: 0`) and graceful shutdown lifecycle hooks.
