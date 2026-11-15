import { describe, expect, it } from "vitest";
import { profileSchema } from "../shared/domain";

describe("graduation date validation", () => {
  const graduation = profileSchema.shape.graduation;
  it("accepts the month/year format stored for real accounts", () => {
    expect(graduation.parse("2028-05")).toBe("2028-05");
    expect(graduation.parse("2028-12")).toBe("2028-12");
  });
  it("rejects missing or browser-localized dates with an actionable message", () => {
    for (const value of [
      "",
      "May 2028",
      "05/2028",
      "2028-",
      "-05",
      "2028-00",
      "2028-13",
    ]) {
      const result = graduation.safeParse(value);
      expect(result.success).toBe(false);
      if (!result.success)
        expect(result.error.issues[0].message).toBe(
          "Choose your graduation month and enter a four-digit year.",
        );
    }
  });
});
