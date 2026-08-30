# Observability, Prometheus Metrics & Distributed Tracing Guide

## 1. Metrics Exposition (`/metrics`)

The platform exports rich, standardized Prometheus metrics covering application throughput, latency, risk calculations, financial simulation jobs, worker execution, and security events:

| Metric Name | Type | Description | Labels |
|---|---|---|---|
| `http_requests_total` | Counter | Total HTTP requests handled | `method`, `handler`, `status` |
| `http_request_duration_seconds` | Histogram | Request latency distributions | `method`, `handler` |
| `security_auth_failures_total` | Counter | Failed authentication attempts | `client_ip` |
| `security_rate_limit_hits_total` | Counter | Throttled requests | `tier`, `client_ip` |
| `risk_calculations_total` | Counter | Completed quantitative risk evaluations | `organization_id` |
| `financial_simulations_total` | Counter | Executed Monte Carlo simulations | `iterations`, `status` |
| `integration_sync_records_total`| Counter | Ingested & normalized telemetry records | `connector_type`, `status` |
| `db_connection_pool_active` | Gauge | Active database sessions | `pool` |

---

## 2. Prometheus Alerting Rules Baseline (`deployment/monitoring/alerts.yml`)

```yaml
groups:
  - name: cyber_risk_alerts
    rules:
      - alert: APIDown
        expr: up{job="cyber_risk_api"} == 0
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: "API Service is unreachable"

      - alert: HighErrorRate
        expr: rate(http_requests_total{status=~"5.."}[5m]) / rate(http_requests_total[5m]) > 0.05
        for: 2m
        labels:
          severity: critical
        annotations:
          summary: "HTTP 5xx error rate exceeds 5%"

      - alert: HighRequestLatency
        expr: histogram_quantile(0.95, sum(rate(http_request_duration_seconds_bucket[5m])) by (le)) > 2.0
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "95th percentile API response time is above 2 seconds"

      - alert: AuthBruteForceDetected
        expr: increase(security_auth_failures_total[5m]) > 50
        for: 1m
        labels:
          severity: high
        annotations:
          summary: "Elevated authentication failure spike (> 50 in 5 min)"
```

---

## 3. Structured JSON Logging & Distributed Tracing

Every log entry across frontend, API gateway, worker, and calculation engines outputs structured JSON containing standardized distributed correlation headers:

```json
{
  "timestamp": "2026-08-30T10:00:00.123456Z",
  "level": "INFO",
  "logger": "app.access",
  "message": "POST /api/v1/integrations/sync HTTP/1.1 200 (68.4ms)",
  "environment": "production",
  "client_ip": "10.0.1.5",
  "request_id": "8f83b2d1-97cf-4351-bfa6-1e520ea3b5ec",
  "data": {
    "method": "POST",
    "path": "/api/v1/integrations/sync",
    "status_code": 200,
    "duration_ms": 68.4,
    "records_ingested": 45
  }
}
```

- **Sensitive Data Masking**: Passwords, API tokens, webhook secrets, authorization headers, and database connection strings are automatically sanitized before output.
