import { defineConfig, devices } from "@playwright/test";
export default defineConfig({
  testDir: "tests/browser",
  fullyParallel: false,
  workers: 1,
  use: { baseURL: "http://127.0.0.1:3101", trace: "retain-on-failure" },
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
  webServer: [
    {
      command:
        "API_TOKEN= FIXTURE_API_KEYS=true FIXTURE_PORT=3107 node --import tsx tests/fixtures/server.ts",
      url: "http://127.0.0.1:3107",
      reuseExistingServer: false,
    },
    {
      command:
        "STORAGE_BACKEND=sqlite DATABASE_URL= PORT=3101 DB_PATH=:memory: EXA_API_KEY= TAVILY_API_KEY= FIRECRAWL_API_KEY= JINA_API_KEY= STRIPE_TEST_ENABLED= DEPOSITS_TESTNET_ENABLED= API_TOKEN= npm start",
      url: "http://127.0.0.1:3101",
      reuseExistingServer: false,
    },
    {
      command: "PORT=3101 npx vite --host 127.0.0.1 --port 3110 --strictPort",
      url: "http://127.0.0.1:3110",
      reuseExistingServer: false,
    },
    {
      command: "API_TOKEN= node --import tsx tests/fixtures/server.ts",
      url: "http://127.0.0.1:3102",
      reuseExistingServer: false,
    },
    {
      command:
        "API_TOKEN= FIXTURE_EXTRACTION_ONLY=true FIXTURE_PORT=3106 node --import tsx tests/fixtures/server.ts",
      url: "http://127.0.0.1:3106",
      reuseExistingServer: false,
    },
    {
      command:
        "API_TOKEN= FIXTURE_ALL_PROVIDERS=true FIXTURE_PORT=3108 node --import tsx tests/fixtures/server.ts",
      url: "http://127.0.0.1:3108",
      reuseExistingServer: false,
    },
  ],
});
