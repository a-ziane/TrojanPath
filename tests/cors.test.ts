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
