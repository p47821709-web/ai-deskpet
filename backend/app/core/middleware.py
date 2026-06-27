from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
import time

class RequestLogMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        start = time.time()
        response = await call_next(request)
        elapsed = time.time() - start
        response.headers["X-Process-Time"] = str(elapsed)
        return response
