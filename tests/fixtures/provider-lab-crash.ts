import { Store } from "../../server/store.js";
import { ProviderLab } from "../../server/provider-lab.js";
import { config } from "../../server/config.js";
config.keys.firecrawl = "FIXTURE_ONLY";
config.providerTestBudgetMicros = 10000;
config.providerTestDailyBudgetMicros = 10000;
const store = new Store(process.env.CRASH_TEST_DB!);
const lab = new ProviderLab(store, {
  search: async () => ({ httpStatus: 200, sources: [] }),
  scrape: async () => {
    process.stdout.write(
      JSON.stringify({ ready: true, id: (await lab.list())[0].id }) + "\n",
    );
    await new Promise((resolve) => setTimeout(resolve, 60000));
    return { httpStatus: 200, text: "FIXTURE never settled" };
  },
});
await lab.start({ requestKey: "crash-fixture", providers: ["firecrawl"] });
