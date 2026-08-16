const FINANCIAL_MUTATION = /\/api\/transactions\/(?:finance(?:-[^/?]+)?|cashier|loyalty(?:-[^/?]+)?|workorder-(?:editor|finalization))(?:\/|\?|$)|\/api\/workorders\/[^/?]+\/settle-recovery(?:\?|$)/i;
const MUTATION_METHODS = new Set(["post", "put", "patch", "delete"]);

export function isFinancialMutation(url: unknown, method: unknown) {
  const normalizedMethod = String(method || "get").toLowerCase();
  return MUTATION_METHODS.has(normalizedMethod) && FINANCIAL_MUTATION.test(String(url || ""));
}

export function createFinancialIdempotencyKey() {
  const cryptoApi = typeof globalThis !== "undefined" ? globalThis.crypto : undefined;
  if (cryptoApi && typeof cryptoApi.randomUUID === "function") {
    return `kleo-${cryptoApi.randomUUID()}`;
  }
  const random = Math.random().toString(36).slice(2);
  return `kleo-${Date.now().toString(36)}-${random}`;
}

export function idempotencyKeyFor(url: unknown, method: unknown) {
  return isFinancialMutation(url, method) ? createFinancialIdempotencyKey() : null;
}
