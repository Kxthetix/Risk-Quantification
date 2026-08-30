"""OpenTelemetry-compatible distributed trace context propagation (Phase 10)."""
from typing import Dict, Optional
import uuid

from fastapi import Request


def extract_trace_context(request: Request) -> Dict[str, Optional[str]]:
    """Extract W3C traceparent or generate new trace and span IDs."""
    traceparent = request.headers.get("traceparent")
    if traceparent and len(traceparent.split("-")) == 4:
        parts = traceparent.split("-")
        return {
            "version": parts[0],
            "trace_id": parts[1],
            "parent_span_id": parts[2],
            "trace_flags": parts[3],
        }

    # Generate synthetic OpenTelemetry-compliant 128-bit trace ID and 64-bit span ID
    trace_id = uuid.uuid4().hex
    span_id = uuid.uuid4().hex[:16]
    return {
        "version": "00",
        "trace_id": trace_id,
        "parent_span_id": None,
        "span_id": span_id,
        "trace_flags": "01",
    }
