import { describe, it, expect } from "vitest";
import { slugify, buildAdSlug, extractAdId } from "./slug";

describe("slugify", () => {
  it("lowercases, strips accents, and hyphenates", () => {
    expect(slugify("Belle Rencontre à Abidjan")).toBe("belle-rencontre-a-abidjan");
  });

  it("collapses punctuation into single hyphens", () => {
    expect(slugify("Salut !!! ça va ?? -- oui")).toBe("salut-ca-va-oui");
  });

  it("has no leading or trailing hyphen", () => {
    expect(slugify("  -- test --  ")).toBe("test");
  });

  it("truncates very long titles without a trailing hyphen", () => {
    const longTitle = "a".repeat(100);
    const slug = slugify(longTitle);
    expect(slug.length).toBeLessThanOrEqual(60);
    expect(slug.endsWith("-")).toBe(false);
  });

  it("returns an empty string for content with no alphanumeric characters", () => {
    expect(slugify("!!! ??? ---")).toBe("");
  });
});

describe("buildAdSlug / extractAdId round-trip", () => {
  const uuid = "d133424a-7f65-4cc0-b5b8-53eebef26369";

  it("builds a 'slug-uuid' segment and extracts the same uuid back out", () => {
    const segment = buildAdSlug("Belle rencontre à Abidjan", uuid);
    expect(segment).toBe(`belle-rencontre-a-abidjan-${uuid}`);
    expect(extractAdId(segment)).toBe(uuid);
  });

  it("falls back to the bare id when the title produces an empty slug", () => {
    expect(buildAdSlug("!!!", uuid)).toBe(uuid);
  });

  it("still extracts the id from a bare UUID with no slug prefix (old links)", () => {
    expect(extractAdId(uuid)).toBe(uuid);
  });

  it("is case-insensitive on the uuid segment", () => {
    const upper = uuid.toUpperCase();
    expect(extractAdId(`some-slug-${upper}`)).toBe(upper);
  });

  it("returns the input unchanged when it contains no UUID at all", () => {
    expect(extractAdId("not-a-real-id")).toBe("not-a-real-id");
  });
});
