import { expect, test, type Locator, type Page } from "@playwright/test";

const accent = "rgb(58, 160, 237)";
const white = "rgb(255, 255, 255)";

async function assertNoDarkBlueButtons(page: Page) {
  const failures = await page
    .locator('[data-slot="button"]:visible')
    .evaluateAll((elements) =>
      elements.flatMap((element) => {
        const style = getComputedStyle(element);
        const rgb = style.backgroundColor.match(/[\d.]+/g)?.map(Number);
        if (!rgb || (rgb.length === 4 && rgb[3] === 0)) return [];
        const [r, g, b] = rgb;
        // Ignore charcoal/gray and lighter accent tints; reject darker blue fills.
        const blue = b > r + 30 && g > r + 15 && b > g + 15;
        const darker =
          0.2126 * r + 0.7152 * g + 0.0722 * b <
          0.2126 * 58 + 0.7152 * 160 + 0.0722 * 237 - 1;
        return blue && darker
          ? [{ text: element.textContent, background: style.backgroundColor }]
          : [];
      }),
    );
  expect(
    failures,
    "Visible actions must not reintroduce darker blue fills",
  ).toEqual([]);
}

async function checkStates(
  page: Page,
  control: Locator,
  filled: boolean,
  textColor = accent,
) {
  const assertColors = async () => {
    await expect(control).toHaveCSS("color", filled ? white : textColor);
    await expect(control).toHaveCSS("text-shadow", "none");
    if (filled) {
      await expect(control).toHaveCSS("background-color", accent);
    }
    await assertNoDarkBlueButtons(page);
  };
  await assertColors();
  await control.focus();
  await expect(control).toBeFocused();
  await assertColors();
  await control.hover();
  await assertColors();
  const bounds = (await control.boundingBox())!;
  await page.mouse.move(
    bounds.x + bounds.width / 2,
    bounds.y + bounds.height / 2,
  );
  await page.mouse.down();
  try {
    await expect
      .poll(() => control.evaluate((el) => el.matches(":active")))
      .toBe(true);
    await assertColors();
  } finally {
    // Release elsewhere so checking the pressed style never submits/navigates.
    await page.mouse.move(0, 0);
    await page.mouse.up();
  }
}

for (const route of ["/#home", "/#dashboard/tools"]) {
  test(`approved light-blue actions retain exact fill and white labels at ${route}`, async ({
    page,
  }) => {
    await page.goto(route);
    const button = page
      .locator(
        '[data-slot="button"][data-variant="brand"]:visible:not(:disabled)',
      )
      .first();
    await expect(button).toBeVisible();
    await checkStates(page, button, true);
  });
}

test("the link button variant uses the approved accent without text shadows in every state", async ({
  page,
}) => {
  await page.goto("/#dashboard/tools");
  await expect(
    page.locator('[data-slot="button"][data-variant="brand"]:visible').first(),
  ).toBeVisible();
  // Exercise the shared Button DOM/CSS contract; no current page uses this variant.
  await page.evaluate(() => {
    const probe = document.createElement("button");
    probe.id = "brand-link-style-probe";
    probe.dataset.slot = "button";
    probe.dataset.variant = "link";
    probe.textContent = "Link-style button color check";
    document.querySelector("main")!.prepend(probe);
  });
  await checkStates(page, page.locator("#brand-link-style-probe"), false);
});

test("the funding action has clean labels in desktop and mobile navigation", async ({
  page,
}, testInfo) => {
  await page.goto("/#dashboard/tools");
  if (testInfo.project.name === "mobile")
    await page.getByRole("button", { name: "Open navigation" }).click();
  const funding = page
    .getByRole("navigation", { name: "User navigation" })
    .getByRole("link", { name: "Add test funds", exact: true });
  await checkStates(page, funding, true);
});

test("button labels and nested text remain shadow-free across product surfaces", async ({
  page,
}) => {
  for (const route of [
    "home",
    "dashboard",
    "dashboard/tools",
    "dashboard/keys",
    "dashboard/credits",
    "settings",
    "company/exa",
    "models",
    "lab",
    "sessions",
  ]) {
    await page.goto(`/#${route}`);
    await expect(page.locator("h1").first()).toBeVisible();
    await expect(page.getByRole("button").first()).toBeVisible();
    const shadows = await page
      .locator(
        ':is(button, [role="button"], [data-slot="button"], .button), :is(button, [role="button"], [data-slot="button"], .button) *',
      )
      .evaluateAll((elements) =>
        elements.flatMap((element) => {
          const style = getComputedStyle(element);
          return style.textShadow === "none"
            ? []
            : [
                {
                  text: element.textContent,
                  shadow: style.textShadow,
                },
              ];
        }),
      );
    expect(shadows, route).toEqual([]);
  }
});
