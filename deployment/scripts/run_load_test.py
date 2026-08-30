"""Concurrent load testing benchmark script for AI-Risk Analyzer Platform (Phase 10)."""
import asyncio
import statistics
import time
from typing import List
import httpx

BASE_URL = "http://localhost:8000"
CONCURRENCY = 20
TOTAL_REQUESTS = 100


async def benchmark_endpoint(client: httpx.AsyncClient, endpoint: str, results: List[float]) -> None:
    t0 = time.time()
    try:
        res = await client.get(f"{BASE_URL}{endpoint}")
        latency = (time.time() - t0) * 1000
        if res.status_code in (200, 401):  # Count valid response times
            results.append(latency)
    except Exception:
        pass


async def run_load_test():
    print(f"[*] Launching benchmark with {CONCURRENCY} concurrent workers over {TOTAL_REQUESTS} requests...")
    results: List[float] = []

    async with httpx.AsyncClient(timeout=10.0) as client:
        tasks = []
        for _ in range(TOTAL_REQUESTS):
            tasks.append(benchmark_endpoint(client, "/health/live", results))
            if len(tasks) >= CONCURRENCY:
                await asyncio.gather(*tasks)
                tasks = []
        if tasks:
            await asyncio.gather(*tasks)

    if results:
        p50 = statistics.median(results)
        p95 = statistics.quantiles(results, n=20)[18] if len(results) >= 20 else max(results)
        p99 = max(results)
        mean = statistics.mean(results)
        print(f"[+] Total Completed: {len(results)}/{TOTAL_REQUESTS}")
        print(f"[+] Latency - Mean: {mean:.2f}ms | P50: {p50:.2f}ms | P95: {p95:.2f}ms | P99: {p99:.2f}ms")
    else:
        print("[!] No successful responses recorded. Is the API server running?")


if __name__ == "__main__":
    asyncio.run(run_load_test())
