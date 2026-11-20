import { mkdir } from "node:fs/promises";
import { join } from "node:path";
import { test, type Page } from "@playwright/test";

export async function captureJourney(page: Page, name: string) {
  const directory =
    process.env.OCTOLAB_QA_SCREENSHOTS || "/tmp/octolab-launch-qa";
  await mkdir(directory, { recursive: true });
  await page.screenshot({
    path: join(directory, `${test.info().project.name}-${name}.png`),
    fullPage: true,
  });
}
