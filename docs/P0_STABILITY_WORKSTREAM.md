# VIR P0 frontend stability workstream

This branch is reserved for the frontend half of the VIR 1.0 stability gate. The backend tenant-schema compatibility fix is handled independently so it can be validated and shipped without coupling unrelated UI changes.

Planned frontend P0 checks:
- role-specific dashboard availability;
- menu -> canonical route integrity;
- authenticated session expiry handling;
- 401/403 distinction and user-facing fallback;
- critical receptionist, salon manager, HR, accounting and staff navigation smoke coverage.

No production behavior is changed by this marker commit.
