import { defineConfig, devices } from "@playwright/test";
export default defineConfig({
  testDir: "tests/browser",
  testMatch: "auth.spec.ts",
  workers: 1,
  fullyParallel: false,
  use: { baseURL: "http://127.0.0.1:3702", trace: "retain-on-failure" },
  projects: [
    {
      name: "desktop",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1440, height: 1050 },
      },
    },
    {
      name: "mobile",
      use: { ...devices["iPhone 13"], defaultBrowserType: "chromium" },
    },
  ],
  webServer: {
    command:
      "API_TOKEN= FIXTURE_PORT=3702 node --import tsx tests/fixtures/server.ts",
    url: "http://127.0.0.1:3702",
    reuseExistingServer: false,
  },
});
