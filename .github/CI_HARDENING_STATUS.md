# CI hardening status

This branch enables deterministic frontend installs, production dependency security gating, and post-merge verification on `main`.

Release checks:
- `npm ci`
- `npm audit --omit=dev --audit-level=high`
- menu/route audit
- complete frontend regression suite
- production build

The package manifest separates runtime dependencies from build/test tooling and removes unused server-side packages from frontend production dependencies. No `npm audit fix --force` is used.
