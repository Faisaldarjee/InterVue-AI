# -*- coding: utf-8 -*-
"""
In-Memory Rate Limiter for InterVue AI
No external dependencies (no Redis/slowapi needed)
"""

import time
import logging
from collections import defaultdict
from fastapi import Request, HTTPException

logger = logging.getLogger(__name__)


class RateLimiter:
    """
    Simple sliding-window rate limiter.
    Tracks requests per IP with auto-cleanup.
    """

    def __init__(self):
        # { ip: [(timestamp, endpoint_type), ...] }
        self._requests = defaultdict(list)
        self._last_cleanup = time.time()

        # Limits: (max_requests, window_seconds)
        self.LIMITS = {
            'heavy': (5, 60),     # 5 per minute for LLM endpoints
            'medium': (15, 60),   # 15 per minute for moderate endpoints
            'light': (60, 60),    # 60 per minute for light endpoints
        }

        # Which endpoints are "heavy" (LLM-intensive)
        self.HEAVY_ENDPOINTS = {
            '/upload-resume', '/analyze-resume', '/start-rapid-fire',
            '/enhance-bullet', '/submit-answer', '/submit-voice-batch',
        }

        self.MEDIUM_ENDPOINTS = {
            '/user/save-interview', '/user/stats', '/user/learning',
        }

    def _cleanup(self):
        """Remove old entries every 2 minutes"""
        now = time.time()
        if now - self._last_cleanup < 120:
            return

        cutoff = now - 120  # keep 2 minutes of history
        for ip in list(self._requests.keys()):
            self._requests[ip] = [
                (ts, ep) for ts, ep in self._requests[ip] if ts > cutoff
            ]
            if not self._requests[ip]:
                del self._requests[ip]

        self._last_cleanup = now

    def _get_endpoint_type(self, path: str) -> str:
        """Classify endpoint by weight"""
        # Check path prefix (handles path params like /submit-answer/{id})
        for heavy in self.HEAVY_ENDPOINTS:
            if path.startswith(heavy):
                return 'heavy'
        for medium in self.MEDIUM_ENDPOINTS:
            if path.startswith(medium):
                return 'medium'
        return 'light'

    def check(self, request: Request) -> None:
        """
        Check rate limit for request. Raises 429 if exceeded.
        Call this at the start of rate-limited endpoints.
        """
        self._cleanup()

        ip = request.client.host if request.client else "unknown"
        path = request.url.path
        endpoint_type = self._get_endpoint_type(path)
        max_requests, window = self.LIMITS[endpoint_type]

        now = time.time()
        cutoff = now - window

        # Count recent requests of this type from this IP
        recent = [
            (ts, ep) for ts, ep in self._requests[ip]
            if ts > cutoff and ep == endpoint_type
        ]

        if len(recent) >= max_requests:
            retry_after = int(window - (now - recent[0][0])) + 1
            logger.warning(
                f"🚫 Rate limit hit: {ip} exceeded {max_requests}/{window}s for {endpoint_type} endpoints ({path})"
            )
            raise HTTPException(
                status_code=429,
                detail=f"Too many requests. Please wait {retry_after} seconds.",
                headers={"Retry-After": str(retry_after)}
            )

        # Record this request
        self._requests[ip].append((now, endpoint_type))

    def get_status(self, ip: str = None) -> dict:
        """Get rate limiter status for monitoring"""
        total_tracked = sum(len(v) for v in self._requests.values())
        return {
            "total_ips_tracked": len(self._requests),
            "total_requests_tracked": total_tracked,
            "limits": {k: f"{v[0]} per {v[1]}s" for k, v in self.LIMITS.items()},
        }


# Global instance
rate_limiter = RateLimiter()
