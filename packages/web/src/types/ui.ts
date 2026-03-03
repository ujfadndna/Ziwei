// 选择状态
export interface SelectionState {
  selectedPalaces: number[];
  selectedStars: string[];
  hoveredPalace: number | null;
  hoveredStar: string | null;
}

// 图层状态
export interface LayerState {
  majorStars: boolean;
  minorStars: boolean;
  shaStars: boolean;
  mutagens: boolean;
  relations: boolean;
  flyOverlay: boolean;
  decadal: boolean;
}

// 图层预设
export type LayerPreset = "feixing" | "sihua" | "sanhe";

// 时间轴状态
export interface TimelineState {
  mode: "natal" | "decadal" | "small" | "yearly" | "monthly" | "daily" | "hourly";
  decadalIndex: number;
  age: number;
  year: number;
  month: number;
  day: number;
  hour: number;
}

export type ChartLayout = "wenmo" | "round";

export type AppMode = "ziwei" | "bazi" | "qimen" | "liuyao";
export type UiTheme = "ziwei" | "bazi" | "qimen" | "liuyao";
export type ThemePreference = "auto" | UiTheme;

// 显示模式
export type ViewMode = "overlay" | "replace" | "diff";

// 对比状态
export interface CompareState {
  enabled: boolean;
  leftRuleSet: string;
  rightRuleSet: string;
}

export interface CaseSaveResult {
  ok: boolean;
  message: string;
}
