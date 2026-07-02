"""Prometheus metrics configuration for the application.

This module sets up and configures Prometheus metrics for monitoring the application.
"""

from prometheus_client import Counter, Histogram, Gauge, generate_latest, CONTENT_TYPE_LATEST
from starlette.responses import Response

# Request metrics
http_requests_total = Counter("http_requests_total", "Total number of HTTP requests", ["method", "endpoint", "status"])

http_request_duration_seconds = Histogram(
    "http_request_duration_seconds", "HTTP request duration in seconds", ["method", "endpoint"]
)

# Database metrics
db_connections = Gauge("db_connections", "Number of active database connections")

# Custom business metrics
orders_processed = Counter("orders_processed_total", "Total number of orders processed")


def setup_metrics(app):
    """Expose the Prometheus /metrics endpoint.

    Request counters/histograms are populated by the app's own MetricsMiddleware;
    this only exposes the default registry. (starlette-prometheus dropped: it
    duplicated that middleware and crashes on FastAPI 0.121 routes.)

    Args:
        app: FastAPI application instance
    """

    async def metrics(request):
        return Response(generate_latest(), media_type=CONTENT_TYPE_LATEST)

    app.add_route("/metrics", metrics)
