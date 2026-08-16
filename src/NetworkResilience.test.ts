import { isRetryableReadFailure, nextReadRetryDelayMs } from "./api/api";

describe("KLEO-NFR-RES-001-AC-02 – transient read recovery", () => {
  test("GET/HEAD transient failures are retryable", () => {
    expect(isRetryableReadFailure({ config: { method: "get" }, code: "ERR_NETWORK" })).toBe(true);
    expect(isRetryableReadFailure({ config: { method: "head" }, response: { status: 503 } })).toBe(true);
    expect(isRetryableReadFailure({ config: { method: "GET" }, response: { status: 504 } })).toBe(true);
  });

  test("business writes are never auto-retried by the read-recovery interceptor", () => {
    for (const method of ["post", "put", "patch", "delete"]) {
      expect(isRetryableReadFailure({ config: { method }, code: "ERR_NETWORK" })).toBe(false);
      expect(isRetryableReadFailure({ config: { method }, response: { status: 503 } })).toBe(false);
    }
  });

  test("client errors and explicit cancellation are not retried", () => {
    expect(isRetryableReadFailure({ config: { method: "get" }, response: { status: 400 } })).toBe(false);
    expect(isRetryableReadFailure({ config: { method: "get" }, response: { status: 401 } })).toBe(false);
    expect(isRetryableReadFailure({ config: { method: "get" }, code: "ERR_CANCELED" })).toBe(false);
  });

  test("retry backoff stays comfortably inside the 60 second recovery window", () => {
    const delays = [1, 2, 3].map(nextReadRetryDelayMs);
    expect(delays).toEqual([750, 1500, 3000]);
    expect(delays.reduce((sum, value) => sum + value, 0)).toBeLessThan(60_000);
  });
});
