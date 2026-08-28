import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./src/setupVitest.ts"],
    include: ["src/**/*.{test,spec}.{js,jsx,ts,tsx}"],
    testTimeout: 15000,
  },
});
