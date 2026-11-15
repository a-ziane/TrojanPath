import { afterEach, expect, it, vi } from "vitest";
import { headers } from "../supabase/functions/_shared/http";
afterEach(() => vi.unstubAllGlobals());
it("allows the production website even with an older environment allowlist", () => {
  vi.stubGlobal("Deno", { env: { get: () => "http://127.0.0.1:5173" } });
  expect(
    headers(
      new Request("https://example.com", {
        headers: { Origin: "https://trojanpath.vercel.app" },
      }),
    )["Access-Control-Allow-Origin"],
  ).toBe("https://trojanpath.vercel.app");
  expect(
    headers(
      new Request("https://example.com", {
        headers: { Origin: "https://trojanpath.vercel.app.attacker.example" },
      }),
    )["Access-Control-Allow-Origin"],
  ).toBe("null");
});

it("allows the project's production alias used by Safari", () => {
  vi.stubGlobal("Deno", { env: { get: () => undefined } });
  const origin = "https://trojanpath-a-zianes-projects.vercel.app";
  expect(
    headers(
      new Request("https://example.com", { headers: { Origin: origin } }),
    )["Access-Control-Allow-Origin"],
  ).toBe(origin);
});
