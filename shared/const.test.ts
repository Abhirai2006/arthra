import { describe, expect, it } from "vitest";
import { safePostAuthPath } from "./const";

describe("safePostAuthPath", () => {
  it("defaults a new sign-in to the protected dashboard", () => {
    expect(safePostAuthPath()).toBe("/dashboard");
    expect(safePostAuthPath("https://example.com")).toBe("/dashboard");
    expect(safePostAuthPath("//example.com")).toBe("/dashboard");
  });

  it("keeps valid local workspace and invitation destinations", () => {
    expect(safePostAuthPath("/dashboard")).toBe("/dashboard");
    expect(safePostAuthPath("/join/example-token")).toBe("/join/example-token");
  });
});
