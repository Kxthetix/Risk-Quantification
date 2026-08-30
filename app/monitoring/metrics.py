"""Prometheus metrics collector and exposition generator (Phase 10)."""
import asyncio
from collections import defaultdict
import time
from typing import Dict, Tuple


class MetricsCollector:
    """Thread-safe Prometheus metrics collector for HTTP, security, and business metrics."""

    def __init__(self):
        self._lock = asyncio.Lock()
        # Counters: (name, label_tuple) -> count
        self._counters: Dict[Tuple[str, Tuple[Tuple[str, str], ...]], int] = defaultdict(int)
        # Histograms: (name, label_tuple) -> (count, sum_seconds)
        self._histograms: Dict[Tuple[str, Tuple[Tuple[str, str], ...]], Tuple[int, float]] = defaultdict(lambda: (0, 0.0))

    def record_http_request(self, method: str, path: str, status_code: int, duration_seconds: float) -> None:
        """Record HTTP request completion counter and duration histogram."""
        labels = (("method", method), ("path", path), ("status", str(status_code)))
        self._counters[("http_requests_total", labels)] += 1

        count, total_sum = self._histograms[("http_request_duration_seconds", (("method", method), ("path", path)))]
        self._histograms[("http_request_duration_seconds", (("method", method), ("path", path)))] = (count + 1, total_sum + duration_seconds)

    def record_auth_failure(self, reason: str = "invalid_credentials") -> None:
        """Record authentication failure event."""
        labels = (("reason", reason),)
        self._counters[("security_auth_failures_total", labels)] += 1

    def record_rate_limit_hit(self, tier: str = "ANONYMOUS") -> None:
        """Record rate limiting threshold trigger event."""
        labels = (("tier", tier),)
        self._counters[("security_rate_limit_hits_total", labels)] += 1

    def record_job_execution(self, job_type: str, status: str, duration_seconds: float = 0.0) -> None:
        """Record background job execution."""
        labels = (("job_type", job_type), ("status", status))
        self._counters[("background_jobs_total", labels)] += 1

    def generate_prometheus_metrics(self) -> str:
        """Generate Prometheus exposition text format payload."""
        lines = []

        # 1. HTTP Requests Total
        lines.append("# HELP http_requests_total Total number of HTTP requests processed")
        lines.append("# TYPE http_requests_total counter")
        for (name, labels), count in self._counters.items():
            if name == "http_requests_total":
                label_str = ",".join(f'{k}="{v}"' for k, v in labels)
                lines.append(f"{name}{{{label_str}}} {count}")

        # 2. HTTP Request Duration
        lines.append("# HELP http_request_duration_seconds HTTP request latency in seconds")
        lines.append("# TYPE http_request_duration_seconds summary")
        for (name, labels), (count, total_sum) in self._histograms.items():
            if name == "http_request_duration_seconds":
                label_str = ",".join(f'{k}="{v}"' for k, v in labels)
                lines.append(f"{name}_count{{{label_str}}} {count}")
                lines.append(f"{name}_sum{{{label_str}}} {round(total_sum, 4)}")

        # 3. Security Metrics
        lines.append("# HELP security_auth_failures_total Total failed authentication attempts")
        lines.append("# TYPE security_auth_failures_total counter")
        for (name, labels), count in self._counters.items():
            if name == "security_auth_failures_total":
                label_str = ",".join(f'{k}="{v}"' for k, v in labels)
                lines.append(f"{name}{{{label_str}}} {count}")

        lines.append("# HELP security_rate_limit_hits_total Total rate limit threshold violations")
        lines.append("# TYPE security_rate_limit_hits_total counter")
        for (name, labels), count in self._counters.items():
            if name == "security_rate_limit_hits_total":
                label_str = ",".join(f'{k}="{v}"' for k, v in labels)
                lines.append(f"{name}{{{label_str}}} {count}")

        # 4. Background Job Metrics
        lines.append("# HELP background_jobs_total Total background jobs processed")
        lines.append("# TYPE background_jobs_total counter")
        for (name, labels), count in self._counters.items():
            if name == "background_jobs_total":
                label_str = ",".join(f'{k}="{v}"' for k, v in labels)
                lines.append(f"{name}{{{label_str}}} {count}")

        return "\n".join(lines) + "\n"


metrics_collector = MetricsCollector()
