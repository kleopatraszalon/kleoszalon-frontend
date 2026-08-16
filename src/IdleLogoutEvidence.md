# Idle logout evidence

The frontend session timeout is fixed at 300000 ms. `clearAuthenticatedSession()` now sends a credentialed keepalive POST to `/api/logout` before clearing browser-held authentication state, so the backend can expire the HttpOnly cookie even when logout is triggered by the idle timer immediately before navigation to `/login?reason=idle`.
