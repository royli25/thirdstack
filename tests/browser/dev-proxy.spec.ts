import { test, expect } from "@playwright/test";
import { intent } from "../helpers";

for (const origin of [
  "http://127.0.0.1:3101",
  "http://127.0.0.1:3110",
  "http://localhost:3110",
]) {
  test(`browser writes work and foreign origins stay blocked at ${origin}`, async ({
    page,
    request,
  }) => {
    await page.goto(origin);
    // The cold development bundle can reload while lazy dependencies optimize.
    // Wait for the actual app before issuing the single browser mutation.
    await expect(
      page.getByRole("heading", {
        level: 1,
        name: "One connection for your agent’s tools.",
      }),
    ).toBeVisible();
    const saved = await page.evaluate(async (data) => {
      const response = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      return { status: response.status, body: await response.json() };
    }, intent);
    expect(saved.status, JSON.stringify(saved.body)).toBe(201);

    const persisted = await request.get(`${origin}/api/tasks/${saved.body.id}`);
    expect(persisted.status()).toBe(200);
    expect((await persisted.json()).intent.query).toBe(intent.query);

    // Exercise the actual proxy and backend guard, not a mocked response.
    for (const foreignOrigin of [
      "https://unrelated.example",
      "http://127.0.0.1:3999",
    ]) {
      const rejected = await request.post(`${origin}/api/tasks`, {
        headers: { Origin: foreignOrigin },
        data: intent,
      });
      expect(rejected.status()).toBe(403);
      expect(await rejected.json()).toEqual({
        error: "Cross-origin writes are not allowed",
      });
    }
  });

  test(`remote MCP setup reaches the API at ${origin}`, async ({ request }) => {
    const initialize = {
      jsonrpc: "2.0",
      id: 1,
      method: "initialize",
      params: {
        protocolVersion: "2025-11-25",
        capabilities: {},
        clientInfo: { name: "development-proxy-test", version: "1" },
      },
    };
    const headers = {
      Accept: "application/json, text/event-stream",
      Origin: origin,
    };
    const response = await request.post(`${origin}/mcp`, {
      headers,
      data: initialize,
    });
    expect(response.status()).toBe(200);
    expect((await response.json()).result.serverInfo.name).toBe("apilayer");
    const sessionId = response.headers()["mcp-session-id"];
    expect(sessionId).toBeTruthy();

    const rejected = await request.post(`${origin}/mcp`, {
      headers: { ...headers, Origin: "https://unrelated.example" },
      data: initialize,
    });
    expect(rejected.status()).toBe(403);

    const closed = await request.delete(`${origin}/mcp`, {
      headers: { ...headers, "Mcp-Session-Id": sessionId },
    });
    expect(closed.ok()).toBe(true);
  });
}
