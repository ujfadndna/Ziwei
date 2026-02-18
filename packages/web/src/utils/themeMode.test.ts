import { describe, expect, it } from "vitest";

import { defaultThemeByAppMode, parseThemePreference, parseUiTheme, resolveTheme } from "./themeMode";

describe("themeMode", () => {
  it("resolves auto preference by app mode", () => {
    expect(resolveTheme("auto", "ziwei")).toBe("ziwei");
    expect(resolveTheme("auto", "bazi")).toBe("bazi");
    expect(resolveTheme("auto", "qimen")).toBe("qimen");
  });

  it("keeps explicit theme preference", () => {
    expect(resolveTheme("ziwei", "qimen")).toBe("ziwei");
    expect(resolveTheme("bazi", "ziwei")).toBe("bazi");
    expect(resolveTheme("qimen", "bazi")).toBe("qimen");
  });

  it("maps app mode to default theme", () => {
    expect(defaultThemeByAppMode("ziwei")).toBe("ziwei");
    expect(defaultThemeByAppMode("bazi")).toBe("bazi");
    expect(defaultThemeByAppMode("qimen")).toBe("qimen");
  });

  it("parses persisted theme preference safely", () => {
    expect(parseThemePreference("auto")).toBe("auto");
    expect(parseThemePreference("ziwei")).toBe("ziwei");
    expect(parseThemePreference("bazi")).toBe("bazi");
    expect(parseThemePreference("qimen")).toBe("qimen");
    expect(parseThemePreference("unknown")).toBe("auto");
    expect(parseThemePreference(null)).toBe("auto");
  });

  it("parses theme value safely", () => {
    expect(parseUiTheme("ziwei")).toBe("ziwei");
    expect(parseUiTheme("bazi")).toBe("bazi");
    expect(parseUiTheme("qimen")).toBe("qimen");
    expect(parseUiTheme("bad")).toBeNull();
    expect(parseUiTheme(undefined)).toBeNull();
  });
});

