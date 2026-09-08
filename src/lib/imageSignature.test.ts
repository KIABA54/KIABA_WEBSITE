import { describe, it, expect } from "vitest";
import { detectImageMimeType } from "./imageSignature";

describe("detectImageMimeType", () => {
  it("detects a real JPEG from its magic bytes", () => {
    const buf = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46]);
    expect(detectImageMimeType(buf)).toBe("image/jpeg");
  });

  it("detects a real PNG from its magic bytes", () => {
    const buf = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00]);
    expect(detectImageMimeType(buf)).toBe("image/png");
  });

  it("detects a real WEBP from its RIFF/WEBP header", () => {
    const buf = Buffer.concat([
      Buffer.from("RIFF", "ascii"),
      Buffer.from([0x00, 0x00, 0x00, 0x00]), // taille (peu importe pour la détection)
      Buffer.from("WEBP", "ascii"),
    ]);
    expect(detectImageMimeType(buf)).toBe("image/webp");
  });

  it("rejects a file whose declared type would be spoofed (real bytes are HTML/script)", () => {
    // Cas concret visé par le correctif : un client pourrait envoyer un
    // fichier nommé "photo.jpg" avec Content-Type: image/jpeg mais un
    // contenu HTML/JS — sans vérification des octets réels, il aurait été
    // accepté et stocké tel quel.
    const buf = Buffer.from("<script>alert(1)</script>", "utf8");
    expect(detectImageMimeType(buf)).toBeNull();
  });

  it("rejects an empty or truncated buffer", () => {
    expect(detectImageMimeType(Buffer.alloc(0))).toBeNull();
    expect(detectImageMimeType(Buffer.from([0xff, 0xd8]))).toBeNull();
  });

  it("does not confuse a RIFF file that isn't WEBP", () => {
    const buf = Buffer.concat([
      Buffer.from("RIFF", "ascii"),
      Buffer.from([0x00, 0x00, 0x00, 0x00]),
      Buffer.from("WAVE", "ascii"),
    ]);
    expect(detectImageMimeType(buf)).toBeNull();
  });

  it("rejects a PDF disguised with a .jpg extension (checked upstream, but bytes matter here)", () => {
    const buf = Buffer.concat([Buffer.from("%PDF-1.4", "ascii"), Buffer.alloc(20)]);
    expect(detectImageMimeType(buf)).toBeNull();
  });

  it("rejects a GIF (not in the allow-list, even though it's a real image format)", () => {
    const buf = Buffer.from("GIF89a", "ascii");
    expect(detectImageMimeType(buf)).toBeNull();
  });

  it("ignores trailing garbage after a valid JPEG signature (still detects it)", () => {
    const buf = Buffer.concat([Buffer.from([0xff, 0xd8, 0xff]), Buffer.from("garbage-not-image-data")]);
    expect(detectImageMimeType(buf)).toBe("image/jpeg");
  });

  it("does not misdetect a PNG as JPEG or vice versa when only the first byte overlaps", () => {
    // 0x89 pourrait à tort matcher un test trop permissif sur le premier octet.
    const almostPng = Buffer.from([0x89, 0x00, 0x00, 0x00]);
    expect(detectImageMimeType(almostPng)).toBeNull();
  });

  it("requires the full 8-byte PNG signature, not just the first few bytes", () => {
    const truncatedPng = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a]); // manque 0x1a 0x0a
    expect(detectImageMimeType(truncatedPng)).toBeNull();
  });
});
