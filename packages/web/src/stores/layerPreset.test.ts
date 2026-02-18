import { describe, expect, it } from "vitest";

import { getPresetLayers, migrateLegacyLayerPreset } from "./layerPreset";

describe("layerPreset", () => {
  it("uses sanhe preset as structure-oriented default", () => {
    const layers = getPresetLayers("sanhe");
    expect(layers.relations).toBe(true);
    expect(layers.flyOverlay).toBe(false);
    expect(layers.mutagens).toBe(false);
  });

  it("uses sihua preset with mutagen focus and no fly lines", () => {
    const layers = getPresetLayers("sihua");
    expect(layers.mutagens).toBe(true);
    expect(layers.flyOverlay).toBe(false);
    expect(layers.relations).toBe(false);
  });

  it("uses feixing preset with fly lines enabled", () => {
    const layers = getPresetLayers("feixing");
    expect(layers.mutagens).toBe(true);
    expect(layers.flyOverlay).toBe(true);
    expect(layers.relations).toBe(false);
  });

  it("migrates legacy preset ids", () => {
    expect(migrateLegacyLayerPreset("mutagen-only")).toEqual({ preset: "sihua", compactMode: false });
    expect(migrateLegacyLayerPreset("clean")).toEqual({ preset: "sanhe", compactMode: true });
    expect(migrateLegacyLayerPreset("beginner")).toEqual({ preset: "sanhe", compactMode: false });
    expect(migrateLegacyLayerPreset("professional")).toEqual({ preset: "sanhe", compactMode: false });
  });
});
