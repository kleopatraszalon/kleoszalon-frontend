import "@testing-library/jest-dom/vitest";
import { vi } from "vitest";
import { TextDecoder, TextEncoder } from "util";

// A handful of legacy tests still use Jest's mock API. Vitest's `vi`
// implements the same fn/spy/restore surface, so expose it only in the
// Vitest setup instead of rewriting otherwise portable test logic.
Object.defineProperty(globalThis, "jest", {
  configurable: true,
  writable: true,
  value: vi,
});

if (typeof globalThis.TextEncoder === "undefined") {
  Object.defineProperty(globalThis, "TextEncoder", {
    configurable: true,
    writable: true,
    value: TextEncoder,
  });
}

if (typeof globalThis.TextDecoder === "undefined") {
  Object.defineProperty(globalThis, "TextDecoder", {
    configurable: true,
    writable: true,
    value: TextDecoder,
  });
}
