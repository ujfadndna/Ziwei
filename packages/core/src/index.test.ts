import { describe, expect, it } from "vitest";

import { buildBaziChart, buildQimenChart, ZIWEI_CORE_PLACEHOLDER, 六十甲子, 天干, 地支 } from "./index";

describe("@ziwei/core", () => {
  it("exports a placeholder value", () => {
    expect(ZIWEI_CORE_PLACEHOLDER).toBe("core-ready");
  });

  it("exports core chinese constants for domain modeling", () => {
    expect(天干.length).toBe(10);
    expect(天干[0]).toBe("甲");
    expect(地支.length).toBe(12);
    expect(六十甲子.length).toBe(60);
  });

  it("exports bazi builder entry", () => {
    expect(typeof buildBaziChart).toBe("function");
  });

  it("exports qimen builder entry", () => {
    expect(typeof buildQimenChart).toBe("function");
  });
});
