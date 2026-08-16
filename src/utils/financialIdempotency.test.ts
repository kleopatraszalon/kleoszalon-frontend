import {
  createFinancialIdempotencyKey,
  isFinancialMutation,
} from "./financialIdempotency";

describe("financial request idempotency", () => {
  it("protects every financial mutation path", () => {
    expect(isFinancialMutation("/api/transactions/finance-v5/movements", "post")).toBe(true);
    expect(isFinancialMutation("/api/transactions/finance-operations/refunds", "POST")).toBe(true);
    expect(isFinancialMutation("/api/transactions/cashier/workorders/1/settle", "post")).toBe(true);
    expect(isFinancialMutation("/api/transactions/loyalty-cashier/payments/1/refund", "post")).toBe(true);
    expect(isFinancialMutation("/api/transactions/loyalty/vouchers", "post")).toBe(true);
    expect(isFinancialMutation("/api/transactions/workorder-editor/1/payments", "post")).toBe(true);
    expect(isFinancialMutation("/api/workorders/1/settle-recovery", "post")).toBe(true);
  });

  it("does not add keys to reads or unrelated writes", () => {
    expect(isFinancialMutation("/api/transactions/finance-v5/movements", "get")).toBe(false);
    expect(isFinancialMutation("/api/clients", "post")).toBe(false);
  });

  it("generates a valid server-side key", () => {
    expect(createFinancialIdempotencyKey()).toMatch(/^[A-Za-z0-9._:-]{8,120}$/);
  });
});
