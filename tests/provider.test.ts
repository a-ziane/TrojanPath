import { afterEach, expect, it, vi } from "vitest";
import { GeminiProvider } from "../supabase/functions/_shared/provider";
import { demoProfile, emptyState } from "../shared/domain";
import { fallbackSpec } from "../shared/planner";
const state = { ...emptyState(), profile: demoProfile };
afterEach(() => vi.unstubAllGlobals());
it("fails explicitly without an AI key and leaves existing state untouched", async () => {
  vi.stubGlobal("Deno", { env: { get: () => undefined } });
  await expect(
    new GeminiProvider().generate(demoProfile, state),
  ).rejects.toThrow("credentials missing");
  expect(state.plans).toHaveLength(0);
});
it("uses structured output and sends only needed confirmed data", async () => {
  vi.stubGlobal("Deno", {
    env: {
      get: (key: string) => (key === "GEMINI_API_KEY" ? "test-key" : undefined),
    },
  });
  const fetcher = vi.fn(
    async () =>
      new Response(
        JSON.stringify({
          candidates: [
            {
              content: {
                parts: [
                  { text: JSON.stringify(fallbackSpec(demoProfile, state)) },
                ],
              },
            },
          ],
        }),
        { status: 200 },
      ),
  );
  vi.stubGlobal("fetch", fetcher);
  const result = await new GeminiProvider().generate(demoProfile, state);
  expect(result.tasks.length).toBeGreaterThan(0);
  const options = fetcher.mock.calls[0] as unknown as [string, RequestInit];
  expect(String(options[1].body)).not.toContain(demoProfile.email);
  expect(String(options[1].body)).toContain("responseJsonSchema");
  expect(options[1].signal).toBeInstanceOf(AbortSignal);
});
it("rejects provider errors and invented resource URLs", async () => {
  vi.stubGlobal("Deno", { env: { get: () => "test-key" } });
  vi.stubGlobal("fetch", async () => new Response("", { status: 503 }));
  await expect(
    new GeminiProvider().generate(demoProfile, state),
  ).rejects.toThrow("unavailable");
  const spec = fallbackSpec(demoProfile, state);
  spec.direction = "Visit https://invented.example.com for an internship";
  vi.stubGlobal(
    "fetch",
    async () =>
      new Response(
        JSON.stringify({
          candidates: [
            { content: { parts: [{ text: JSON.stringify(spec) }] } },
          ],
        }),
      ),
  );
  await expect(
    new GeminiProvider().generate(demoProfile, state),
  ).rejects.toThrow("Unapproved URL");
});
