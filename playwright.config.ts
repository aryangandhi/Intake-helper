import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  timeout: 90_000,
  workers: 1,
  fullyParallel: false,
  use: { baseURL: "http://localhost:3000", trace: "off" },
  webServer: {
    command: "npm run dev",
    env: { DISABLE_LOGIN: "false" }, // tests exercise the real login screens
    url: "http://localhost:3000",
    reuseExistingServer: false,
    timeout: 120_000,
  },
});
