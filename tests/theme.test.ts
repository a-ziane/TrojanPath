import { describe, expect, it } from "vitest";
import { resolveTheme } from "../src/theme";

describe("resolveTheme", () => {
  it("uses the saved choice over the device setting", () => {
    expect(resolveTheme("light", true)).toBe("light");
    expect(resolveTheme("dark", false)).toBe("dark");
  });

  it("follows the device setting when nothing valid is saved", () => {
    expect(resolveTheme(null, true)).toBe("dark");
    expect(resolveTheme(null, false)).toBe("light");
    expect(resolveTheme("purple", true)).toBe("dark");
  });
});
