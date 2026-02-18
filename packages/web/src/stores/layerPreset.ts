import type { LayerPreset, LayerState } from "../types/ui";

export interface LayerPresetOption {
  id: LayerPreset;
  label: string;
  desc: string;
}

export const LAYER_PRESET_OPTIONS: readonly LayerPresetOption[] = [
  {
    id: "feixing",
    label: "飞星",
    desc: "突出宫干飞化箭头与化入宫高亮。",
  },
  {
    id: "sihua",
    label: "四化",
    desc: "突出禄权科忌角标与化入落点提示。",
  },
  {
    id: "sanhe",
    label: "三合",
    desc: "突出三方四正结构线与会照关系。",
  },
] as const;

export function getPresetLayers(preset: LayerPreset): LayerState {
  switch (preset) {
    case "sanhe":
      return {
        majorStars: true,
        minorStars: true,
        shaStars: true,
        mutagens: false,
        relations: true,
        flyOverlay: false,
        decadal: false,
      };
    case "sihua":
      return {
        majorStars: true,
        minorStars: true,
        shaStars: true,
        mutagens: true,
        relations: false,
        flyOverlay: false,
        decadal: false,
      };
    case "feixing":
      return {
        majorStars: true,
        minorStars: true,
        shaStars: true,
        mutagens: true,
        relations: false,
        flyOverlay: true,
        decadal: false,
      };
    default: {
      const _exhaustive: never = preset;
      return _exhaustive;
    }
  }
}

export function migrateLegacyLayerPreset(rawPresetId: string | null | undefined): { preset: LayerPreset; compactMode: boolean } {
  if (rawPresetId === "feixing" || rawPresetId === "sihua" || rawPresetId === "sanhe") {
    return { preset: rawPresetId, compactMode: false };
  }

  // 旧版预设迁移策略：
  // - mutagen-only -> sihua：语义最接近“四化”。
  // - clean -> sanhe + compact：保留“信息更简洁”的体验但不再作为独立预设。
  // - beginner/professional -> sanhe：更符合结构导向的默认浏览路径。
  if (rawPresetId === "mutagen-only") return { preset: "sihua", compactMode: false };
  if (rawPresetId === "clean") return { preset: "sanhe", compactMode: true };
  if (rawPresetId === "beginner" || rawPresetId === "professional") return { preset: "sanhe", compactMode: false };

  return { preset: "sanhe", compactMode: false };
}
