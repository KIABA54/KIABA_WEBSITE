import { describe, it, expect } from "vitest";
import { isSafeRedirectPath } from "./safeRedirect";

describe("isSafeRedirectPath", () => {
  it("accepts a normal internal path", () => {
    expect(isSafeRedirectPath("/profil")).toBe(true);
    expect(isSafeRedirectPath("/annonces/nouvelle")).toBe(true);
  });

  it("rejects a protocol-relative URL (the open-redirect bypass)", () => {
    // "//evil.com" starts with "/" but a browser treats it as an external
    // redirect — this is the exact case that slipped through before.
    expect(isSafeRedirectPath("//evil.com")).toBe(false);
    expect(isSafeRedirectPath("//evil.com/phishing")).toBe(false);
  });

  it("rejects an absolute external URL", () => {
    expect(isSafeRedirectPath("https://evil.com")).toBe(false);
    expect(isSafeRedirectPath("http://evil.com")).toBe(false);
  });

  it("rejects a path with no leading slash", () => {
    expect(isSafeRedirectPath("evil.com")).toBe(false);
    expect(isSafeRedirectPath("profil")).toBe(false);
  });

  it("rejects null, undefined and empty string", () => {
    expect(isSafeRedirectPath(null)).toBe(false);
    expect(isSafeRedirectPath(undefined)).toBe(false);
    expect(isSafeRedirectPath("")).toBe(false);
  });
});
