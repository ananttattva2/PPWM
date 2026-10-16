import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "./tests",
  testMatch: "**/*.spec.ts",
  use: { baseURL: "http://localhost:3000", headless: true },
  webServer: [
    {
      command: "npm run dev",
      url: "http://localhost:3000",
      reuseExistingServer: true,
      timeout: 120000,
    },
    {
      command: "npm run local:7000",
      url: "http://127.0.0.1:7000/login",
      reuseExistingServer: true,
      timeout: 120000,
    },
  ],
});
