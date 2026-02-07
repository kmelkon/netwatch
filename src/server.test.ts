import { describe, it, expect } from "vitest";
import { computeBodySize } from "./server.js";

describe("computeBodySize", () => {
  it("returns 0 for null", () => {
    expect(computeBodySize(null)).toBe(0);
  });

  it("returns 0 for undefined", () => {
    expect(computeBodySize(undefined)).toBe(0);
  });

  it("computes size for string body", () => {
    expect(computeBodySize("hello")).toBe(5);
  });

  it("computes size for UTF-8 string", () => {
    // Multi-byte characters
    expect(computeBodySize("héllo")).toBe(6);
  });

  it("computes size for object body (serialized)", () => {
    const body = { name: "test", value: 42 };
    const expected = Buffer.byteLength(JSON.stringify(body), "utf-8");
    expect(computeBodySize(body)).toBe(expected);
  });

  it("computes size for empty string", () => {
    expect(computeBodySize("")).toBe(0);
  });

  it("computes size for array body", () => {
    const body = [1, 2, 3];
    expect(computeBodySize(body)).toBe(Buffer.byteLength("[1,2,3]", "utf-8"));
  });
});
