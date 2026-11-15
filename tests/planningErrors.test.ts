import { expect, it } from "vitest";
import { planningError } from "../src/planningErrors";
it("shows the actual rate limit or Gemini error returned by the server", async () => {
  expect(
    await planningError(
      {
        context: Response.json(
          { error: "Planning limit reached. Try again in an hour." },
          { status: 429 },
        ),
      },
      "https://trojanpath.vercel.app",
    ),
  ).toBe("Planning limit reached. Try again in an hour.");
});
it("distinguishes expired sign-in from a browser connection failure", async () => {
  expect(
    await planningError(
      { context: new Response("", { status: 401 }) },
      "https://trojanpath.vercel.app",
    ),
  ).toContain("sign-in expired");
  expect(await planningError({}, "http://localhost:5174")).toContain(
    "from http://localhost:5174",
  );
});
