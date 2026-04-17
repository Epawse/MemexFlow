import { describe, it, expect } from "vitest";
import { normalizeUrl } from "./captures";

describe("normalizeUrl", () => {
  it("passes through a fully-formed https URL", () => {
    expect(normalizeUrl("https://example.com/a")).toBe("https://example.com/a");
  });

  it("passes through an http URL", () => {
    expect(normalizeUrl("http://example.com")).toBe("http://example.com/");
  });

  it("prepends https:// when the scheme is missing", () => {
    expect(normalizeUrl("example.com")).toBe("https://example.com/");
  });

  it("trims leading/trailing whitespace", () => {
    expect(normalizeUrl("  https://example.com  ")).toBe("https://example.com/");
  });

  it("accepts a host with a port", () => {
    expect(normalizeUrl("example.com:8080/path")).toBe(
      "https://example.com:8080/path",
    );
  });

  it("rejects an empty string", () => {
    expect(() => normalizeUrl("")).toThrow("URL is required");
    expect(() => normalizeUrl("   ")).toThrow("URL is required");
  });

  it("rejects numeric input (prevents IPv4 coercion by new URL)", () => {
    expect(() => normalizeUrl("123")).toThrow(/doesn't look like a valid URL/);
  });

  it("rejects input without a TLD", () => {
    expect(() => normalizeUrl("notaurl")).toThrow(
      /doesn't look like a valid URL/,
    );
  });

  it("rejects input that parses but has no hostname", () => {
    // new URL("https://") throws, so this hits the parse-error branch.
    expect(() => normalizeUrl("https://")).toThrow(
      /doesn't look like a valid URL/,
    );
  });
});
