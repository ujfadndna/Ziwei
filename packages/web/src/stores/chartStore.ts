import {
  buildBaziChart,
  buildChart,
  buildLiuyaoChart,
  buildQimenChart,
  type BaziChart,
  type BirthInfo,
  type Chart,
  type CoinThreeThrow,
  type DerivationTrace,
  type LiuyaoChart,
  type MutagenType,
  type QimenChart,
} from "@ziwei/core";
import { create } from "zustand";

import type {
  AppMode,
  CaseSaveResult,
  ChartLayout,
  CompareState,
  LayerPreset,
  LayerState,
  SelectionState,
  ThemePreference,
  TimelineState,
  UiTheme,
  ViewMode,
} from "../types/ui";
import type { SavedCase } from "../types/case";
import { getPresetLayers, migrateLegacyLayerPreset } from "./layerPreset";
import {
  parseThemePreference,
  resolveTheme,
  THEME_PREFERENCE_STORAGE_KEY,
} from "../utils/themeMode";
import {
  generateCaseId,
  loadSavedCasesFromStorage,
  normalizeSavedCases,
  persistSavedCasesToStorage,
} from "../utils/caseLibrary";

type StarSearchResult = { palaceIndex: number; starName: string } | null;
type FlyMutagenFilterState = Record<MutagenType, boolean>;
interface BuildFromBirthOptions {
  liuyaoLineThrows?: readonly CoinThreeThrow[];
}

const DEFAULT_FLY_MUTAGEN_FILTER: FlyMutagenFilterState = {
  化禄: true,
  化权: true,
  化科: true,
  化忌: true,
};

const MIN_SUPPORTED_YEAR = 1900;
const MAX_SUPPORTED_YEAR = 2100;
const LAYER_PRESET_STORAGE_KEY = "ziwei:web:layers:preset-v2";
const LAYER_COMPACT_STORAGE_KEY = "ziwei:web:layers:compact-v1";
const LEGACY_LAYER_PRESET_STORAGE_KEYS = ["ziwei:web:layer-preset", "ziwei:web:layerPreset"] as const;

export interface ChartStoreState {
  // Chart data
  chart: Chart | null;
  trace: DerivationTrace | null;
  lastBirth: BirthInfo | null;
  isBuilding: boolean;
  buildError: string | null;
  baziChart: BaziChart | null;
  qimenChart: QimenChart | null;
  liuyaoChart: LiuyaoChart | null;
  baziFlowYear: number;
  baziSelectedLuckIndex: number;

  // Build options (UI-level)
  ruleSetId: string;
  enableTrace: boolean;

  // UI states
  selection: SelectionState;
  layers: LayerState;
  layerPreset: LayerPreset;
  compactMode: boolean;
  timeline: TimelineState;
  chartLayout: ChartLayout;
  viewMode: ViewMode;
  appMode: AppMode;
  themePreference: ThemePreference;
  resolvedTheme: UiTheme;
  compare: CompareState;
  flyMutagenFilter: FlyMutagenFilterState;
  savedCases: SavedCase[];
  activeCaseId: string | null;

  // Search
  searchQuery: string;
  searchResult: StarSearchResult;

  // Actions
  buildFromBirth: (birth: BirthInfo, options?: BuildFromBirthOptions) => void;
  setRuleSetId: (id: string) => void;
  setEnableTrace: (enabled: boolean) => void;

  clearSelection: () => void;
  selectPalace: (palaceIndex: number, opts?: { additive?: boolean }) => void;
  selectStar: (starName: string, opts?: { additive?: boolean; palaceIndex?: number }) => void;
  setHoveredPalace: (palaceIndex: number | null) => void;
  setHoveredStar: (starName: string | null, opts?: { palaceIndex?: number | null }) => void;

  setLayerPreset: (preset: LayerPreset) => void;
  setCompactMode: (enabled: boolean) => void;
  setLayers: (partial: Partial<LayerState>) => void;
  toggleLayer: (key: keyof LayerState) => void;
  toggleFlyMutagenFilter: (type: MutagenType) => void;
  resetFlyMutagenFilter: () => void;

  setTimeline: (partial: Partial<TimelineState>) => void;
  setChartLayout: (layout: ChartLayout) => void;
  setViewMode: (mode: ViewMode) => void;
  setAppMode: (mode: AppMode) => void;
  setThemePreference: (preference: ThemePreference) => void;
  setTheme: (theme: UiTheme) => void;
  resetThemePreference: () => void;
  setBaziFlowYear: (year: number) => void;
  setBaziLuckIndex: (index: number) => void;
  setCompare: (partial: Partial<CompareState>) => void;
  saveCurrentCase: (name?: string) => CaseSaveResult;
  loadCaseById: (id: string) => void;
  deleteCaseById: (id: string) => void;
  mergeCases: (cases: SavedCase[]) => { added: number; updated: number };
  replaceCases: (cases: SavedCase[]) => void;

  setSearchQuery: (query: string) => void;
  selectSearchResult: () => void;
}

function getDefaultSelection(): SelectionState {
  return {
    selectedPalaces: [],
    selectedStars: [],
    hoveredPalace: null,
    hoveredStar: null,
  };
}

function readStoredLayerPresetId(): string | null {
  if (typeof window === "undefined") return null;
  const next = window.localStorage.getItem(LAYER_PRESET_STORAGE_KEY);
  if (next) return next;
  for (const key of LEGACY_LAYER_PRESET_STORAGE_KEYS) {
    const legacy = window.localStorage.getItem(key);
    if (legacy) return legacy;
  }
  return null;
}

function readStoredCompactMode(): boolean {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(LAYER_COMPACT_STORAGE_KEY) === "1";
}

function persistLayerPresetId(preset: LayerPreset): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(LAYER_PRESET_STORAGE_KEY, preset);
  } catch {
    // Ignore persistence failures and keep app usable.
  }
}

function persistCompactMode(enabled: boolean): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(LAYER_COMPACT_STORAGE_KEY, enabled ? "1" : "0");
  } catch {
    // Ignore persistence failures and keep app usable.
  }
}

function readStoredThemePreference(): ThemePreference {
  if (typeof window === "undefined") return "auto";
  return parseThemePreference(window.localStorage.getItem(THEME_PREFERENCE_STORAGE_KEY));
}

function persistThemePreference(preference: ThemePreference): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(THEME_PREFERENCE_STORAGE_KEY, preference);
  } catch {
    // Ignore persistence failures and keep app usable.
  }
}

function toggleInList<T>(list: readonly T[], item: T): T[] {
  return list.includes(item) ? list.filter((x) => x !== item) : [...list, item];
}

function findStarInChart(chart: Chart, query: string): StarSearchResult {
  const q = query.trim();
  if (!q) return null;

  // Prefer exact match, then substring match.
  const palaces = chart.palaces;
  for (const palace of palaces) {
    const exact = palace.stars.find((s) => s.name === q);
    if (exact) return { palaceIndex: palace.index, starName: exact.name };
  }

  for (const palace of palaces) {
    const hit = palace.stars.find((s) => s.name.includes(q));
    if (hit) return { palaceIndex: palace.index, starName: hit.name };
  }

  return null;
}

const initialSavedCases = loadSavedCasesFromStorage();
const storedPreset = readStoredLayerPresetId();
const migration = migrateLegacyLayerPreset(storedPreset);
const initialCompactMode = readStoredCompactMode() || migration.compactMode;
const initialLayerPreset = migration.preset;
const initialThemePreference = readStoredThemePreference();
const initialAppMode: AppMode = "ziwei";
const initialResolvedTheme = resolveTheme(initialThemePreference, initialAppMode);

function getDefaultCaseName(currentLength: number): string {
  return `命例 ${currentLength + 1}`;
}

function persistCases(cases: SavedCase[]): SavedCase[] {
  persistSavedCasesToStorage(cases);
  return cases;
}

function cloneBirthInfo(birth: BirthInfo): BirthInfo {
  const cloned: BirthInfo = {
    gender: birth.gender,
    datetime: birth.datetime,
    timeIndex: birth.timeIndex,
  };
  if (birth.location) cloned.location = { ...birth.location };
  if (typeof birth.note === "string") cloned.note = birth.note;
  return cloned;
}

function clampInt(value: number, min: number, max: number, fallback: number): number {
  const normalized = Number.isFinite(value) ? Math.floor(value) : fallback;
  return Math.min(max, Math.max(min, normalized));
}

function getDaysInMonth(year: number, month: number): number {
  const normalizedYear = clampInt(year, MIN_SUPPORTED_YEAR, MAX_SUPPORTED_YEAR, new Date().getFullYear());
  const normalizedMonth = clampInt(month, 1, 12, 1);
  return new Date(normalizedYear, normalizedMonth, 0).getDate();
}

function normalizeTimelineState(timeline: TimelineState, chart: Chart | null): TimelineState {
  const year = clampInt(timeline.year, MIN_SUPPORTED_YEAR, MAX_SUPPORTED_YEAR, new Date().getFullYear());
  const month = clampInt(timeline.month, 1, 12, 1);
  const day = clampInt(timeline.day, 1, getDaysInMonth(year, month), 1);
  const hour = clampInt(timeline.hour, 0, 23, 0);
  const decadalIndex = Math.max(0, Math.floor(Number.isFinite(timeline.decadalIndex) ? timeline.decadalIndex : 0));
  let age = Math.max(1, Math.floor(Number.isFinite(timeline.age) ? timeline.age : 1));

  if (chart) {
    const maxAgeByYear = Math.max(1, MAX_SUPPORTED_YEAR - chart.date.solar.year + 1);
    age = Math.min(age, maxAgeByYear);
  }

  return {
    ...timeline,
    year,
    month,
    day,
    hour,
    age,
    decadalIndex,
  };
}

function buildBaziFromBirthAndFlowYear(birth: BirthInfo, flowYear: number): BaziChart {
  return buildBaziChart({
    ...birth,
    flowYear,
  });
}

function buildQimenFromBirth(birth: BirthInfo): QimenChart {
  return buildQimenChart(birth);
}

function buildLiuyaoFromBirth(birth: BirthInfo, options?: BuildFromBirthOptions): LiuyaoChart {
  const lineThrows = options?.liuyaoLineThrows;
  if (lineThrows && lineThrows.length === 6) {
    return buildLiuyaoChart({
      ...birth,
      casting: {
        method: "coin_3",
        lineThrows,
      },
    });
  }
  return buildLiuyaoChart(birth);
}

function resolveBaziLuckIndexByAge(chart: BaziChart, age: number): number {
  const pillars = chart.luck.pillars;
  if (!pillars.length) return 0;
  const first = pillars[0];
  if (!first) return 0;
  const hit = pillars.findIndex((item) => age >= item.startAge && age <= item.endAge);
  if (hit >= 0) return hit;
  if (age < first.startAge) return 0;
  return pillars.length - 1;
}

export const useChartStore = create<ChartStoreState>((set, get) => ({
  chart: null,
  trace: null,
  lastBirth: null,
  isBuilding: false,
  buildError: null,
  baziChart: null,
  qimenChart: null,
  liuyaoChart: null,
  baziFlowYear: new Date().getFullYear(),
  baziSelectedLuckIndex: 0,

  ruleSetId: "default",
  enableTrace: true,

  selection: getDefaultSelection(),
  layerPreset: initialLayerPreset,
  layers: getPresetLayers(initialLayerPreset),
  compactMode: initialCompactMode,
  timeline: {
    mode: "yearly",
    decadalIndex: 0,
    age: 1,
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1,
    day: new Date().getDate(),
    hour: new Date().getHours(),
  },
  chartLayout: "wenmo",
  viewMode: "overlay",
  appMode: initialAppMode,
  themePreference: initialThemePreference,
  resolvedTheme: initialResolvedTheme,
  compare: {
    enabled: false,
    leftRuleSet: "default",
    rightRuleSet: "zhongzhou",
  },
  flyMutagenFilter: { ...DEFAULT_FLY_MUTAGEN_FILTER },
  savedCases: initialSavedCases,
  activeCaseId: null,

  searchQuery: "",
  searchResult: null,

  buildFromBirth: (birth, options) => {
    set({ isBuilding: true, buildError: null });
    try {
      const result = buildChart(birth, { ruleSetId: get().ruleSetId, enableTrace: get().enableTrace });
      const currentTimeline = get().timeline;
      const birthYear = result.chart.date.solar.year;
      const nextYear = clampInt(Math.max(currentTimeline.year, birthYear), MIN_SUPPORTED_YEAR, MAX_SUPPORTED_YEAR, birthYear);
      const nextAge = Math.min(Math.max(1, nextYear - birthYear + 1), Math.max(1, MAX_SUPPORTED_YEAR - birthYear + 1));
      const birthDate = new Date(birth.datetime);
      const nextMonthRaw = Number.isNaN(birthDate.getTime()) ? currentTimeline.month : birthDate.getMonth() + 1;
      const nextMonth = clampInt(nextMonthRaw, 1, 12, currentTimeline.month);
      const nextDayRaw = Number.isNaN(birthDate.getTime()) ? currentTimeline.day : birthDate.getDate();
      const nextDay = clampInt(nextDayRaw, 1, getDaysInMonth(nextYear, nextMonth), currentTimeline.day);
      const nextHourRaw = Number.isNaN(birthDate.getTime()) ? currentTimeline.hour : birthDate.getHours();
      const nextHour = clampInt(nextHourRaw, 0, 23, currentTimeline.hour);
      const rawDecadals = (result.chart.horoscope as unknown as
        | { decadals?: Array<{ startAge: number; endAge: number }> }
        | undefined)?.decadals;

      let nextDecadalIndex = currentTimeline.decadalIndex;
      if (Array.isArray(rawDecadals) && rawDecadals.length > 0) {
        const matched = rawDecadals.findIndex((item) => nextAge >= item.startAge && nextAge <= item.endAge);
        nextDecadalIndex = matched >= 0 ? matched : 0;
      }

      const nextTimeline = normalizeTimelineState(
        {
          ...currentTimeline,
          year: nextYear,
          age: nextAge,
          month: nextMonth,
          day: nextDay,
          hour: nextHour,
          decadalIndex: nextDecadalIndex,
        },
        result.chart
      );
      const nextBazi = buildBaziFromBirthAndFlowYear(birth, nextTimeline.year);
      const nextQimen = buildQimenFromBirth(birth);
      const nextLiuyao = buildLiuyaoFromBirth(birth, options);
      const nextBaziLuckIndex = resolveBaziLuckIndexByAge(nextBazi, nextTimeline.age);

      set({
        chart: result.chart,
        trace: result.trace ?? null,
        lastBirth: birth,
        baziChart: nextBazi,
        qimenChart: nextQimen,
        liuyaoChart: nextLiuyao,
        baziFlowYear: nextTimeline.year,
        baziSelectedLuckIndex: nextBaziLuckIndex,
        selection: {
          selectedPalaces: [result.chart.mingPalaceIndex],
          selectedStars: [],
          hoveredPalace: null,
          hoveredStar: null,
        },
        timeline: nextTimeline,
        isBuilding: false,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      set({ isBuilding: false, buildError: message });
    }
  },

  setRuleSetId: (id) => set({ ruleSetId: id }),
  setEnableTrace: (enabled) => set({ enableTrace: enabled }),

  clearSelection: () =>
    set({
      selection: getDefaultSelection(),
    }),

  selectPalace: (palaceIndex, opts) => {
    const additive = opts?.additive === true;
    set((state) => {
      const nextSelectedPalaces = additive
        ? toggleInList(state.selection.selectedPalaces, palaceIndex)
        : [palaceIndex];

      return {
        selection: {
          ...state.selection,
          selectedPalaces: nextSelectedPalaces,
          // When user "focus-selects" a palace, clear stars to keep Inspector unambiguous.
          selectedStars: additive ? state.selection.selectedStars : [],
        },
      };
    });
  },

  selectStar: (starName, opts) => {
    const additive = opts?.additive === true;
    const palaceIndexFromCaller = opts?.palaceIndex;

    set((state) => {
      const nextSelectedStars = additive
        ? toggleInList(state.selection.selectedStars, starName)
        : [starName];

      const nextSelectedPalaces =
        palaceIndexFromCaller == null
          ? state.selection.selectedPalaces
          : additive
            ? toggleInList(state.selection.selectedPalaces, palaceIndexFromCaller)
            : [palaceIndexFromCaller];

      return {
        selection: {
          ...state.selection,
          selectedStars: nextSelectedStars,
          selectedPalaces: nextSelectedPalaces,
        },
      };
    });
  },

  setHoveredPalace: (palaceIndex) =>
    set((state) => ({
      selection: {
        ...state.selection,
        hoveredPalace: palaceIndex,
      },
    })),

  setHoveredStar: (starName, opts) =>
    set((state) => ({
      selection: {
        ...state.selection,
        hoveredStar: starName,
        hoveredPalace: opts?.palaceIndex ?? state.selection.hoveredPalace,
      },
    })),

  setLayerPreset: (preset) => {
    persistLayerPresetId(preset);
    set({ layerPreset: preset, layers: getPresetLayers(preset), flyMutagenFilter: { ...DEFAULT_FLY_MUTAGEN_FILTER } });
  },
  setCompactMode: (enabled) => {
    persistCompactMode(enabled);
    set({ compactMode: enabled });
  },
  setLayers: (partial) =>
    set((state) => ({
      layers: { ...state.layers, ...partial },
    })),
  toggleLayer: (key) =>
    set((state) => ({
      layers: { ...state.layers, [key]: !state.layers[key] },
    })),
  toggleFlyMutagenFilter: (type) =>
    set((state) => {
      const current = state.flyMutagenFilter[type];
      if (current) {
        const enabledCount = Object.values(state.flyMutagenFilter).filter(Boolean).length;
        if (enabledCount <= 1) {
          return state;
        }
      }
      return {
        flyMutagenFilter: {
          ...state.flyMutagenFilter,
          [type]: !state.flyMutagenFilter[type],
        },
      };
    }),
  resetFlyMutagenFilter: () =>
    set({
      flyMutagenFilter: { ...DEFAULT_FLY_MUTAGEN_FILTER },
    }),

  setTimeline: (partial) =>
    set((state) => ({
      timeline: normalizeTimelineState({ ...state.timeline, ...partial }, state.chart),
    })),
  setChartLayout: (layout) => set({ chartLayout: layout }),
  setViewMode: (mode) => set({ viewMode: mode }),
  setAppMode: (mode) =>
    set((state) => ({
      appMode: mode,
      resolvedTheme: resolveTheme(state.themePreference, mode),
    })),
  setThemePreference: (preference) => {
    persistThemePreference(preference);
    set((state) => ({
      themePreference: preference,
      resolvedTheme: resolveTheme(preference, state.appMode),
    }));
  },
  setTheme: (theme) => {
    persistThemePreference(theme);
    set({
      themePreference: theme,
      resolvedTheme: theme,
    });
  },
  resetThemePreference: () => {
    persistThemePreference("auto");
    set((state) => ({
      themePreference: "auto",
      resolvedTheme: resolveTheme("auto", state.appMode),
    }));
  },
  setBaziFlowYear: (year) => {
    const normalizedYear = clampInt(year, MIN_SUPPORTED_YEAR, MAX_SUPPORTED_YEAR, new Date().getFullYear());
    const birth = get().lastBirth;
    const currentBazi = get().baziChart;
    if (!birth || !currentBazi) {
      set({ baziFlowYear: normalizedYear });
      return;
    }

    try {
      const nextBazi = buildBaziFromBirthAndFlowYear(birth, normalizedYear);
      const currentAge = get().timeline.age;
      const nextLuckIndex = resolveBaziLuckIndexByAge(nextBazi, currentAge);
      set({
        baziChart: nextBazi,
        baziFlowYear: normalizedYear,
        baziSelectedLuckIndex: nextLuckIndex,
        buildError: null,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      set({ buildError: message, baziFlowYear: normalizedYear });
    }
  },
  setBaziLuckIndex: (index) =>
    set((state) => {
      const maxIndex = Math.max(0, (state.baziChart?.luck.pillars.length ?? 1) - 1);
      const normalized = Math.max(0, Math.min(maxIndex, Math.floor(Number.isFinite(index) ? index : 0)));
      return {
        baziSelectedLuckIndex: normalized,
      };
    }),
  setCompare: (partial) => set((state) => ({ compare: { ...state.compare, ...partial } })),
  saveCurrentCase: (name) => {
    const birth = get().lastBirth;
    if (!birth) {
      return {
        ok: false,
        message: "请先排盘，再保存命例。",
      };
    }

    const trimmed = name?.trim() ?? "";
    const now = new Date().toISOString();
    const nextCase: SavedCase = {
      id: generateCaseId(),
      name: trimmed || getDefaultCaseName(get().savedCases.length),
      birth: cloneBirthInfo(birth),
      createdAt: now,
      updatedAt: now,
    };

    set((state) => {
      const nextCases = persistCases(normalizeSavedCases([nextCase, ...state.savedCases]));
      return {
        savedCases: nextCases,
        activeCaseId: nextCase.id,
      };
    });

    return {
      ok: true,
      message: `已保存命例：${nextCase.name}`,
    };
  },
  loadCaseById: (id) => {
    const target = get().savedCases.find((item) => item.id === id);
    if (!target) return;
    set({ activeCaseId: id });
    get().buildFromBirth(cloneBirthInfo(target.birth));
  },
  deleteCaseById: (id) =>
    set((state) => {
      const nextCases = persistCases(state.savedCases.filter((item) => item.id !== id));
      return {
        savedCases: nextCases,
        activeCaseId: state.activeCaseId === id ? null : state.activeCaseId,
      };
    }),
  mergeCases: (cases) => {
    const incoming = normalizeSavedCases(cases);
    const existingById = new Map(get().savedCases.map((item) => [item.id, item] as const));
    let added = 0;
    let updated = 0;

    for (const item of incoming) {
      if (existingById.has(item.id)) updated += 1;
      else added += 1;
      existingById.set(item.id, item);
    }

    const merged = persistCases(normalizeSavedCases(Array.from(existingById.values())));
    set({ savedCases: merged });
    return { added, updated };
  },
  replaceCases: (cases) => {
    const nextCases = persistCases(normalizeSavedCases(cases));
    set((state) => ({
      savedCases: nextCases,
      activeCaseId: nextCases.some((item) => item.id === state.activeCaseId) ? state.activeCaseId : null,
    }));
  },

  setSearchQuery: (query) => {
    const chart = get().chart;
    const nextResult = chart ? findStarInChart(chart, query) : null;

    set({
      searchQuery: query,
      searchResult: nextResult,
    });
  },

  selectSearchResult: () => {
    const hit = get().searchResult;
    if (!hit) return;
    get().selectStar(hit.starName, { additive: false, palaceIndex: hit.palaceIndex });
  },
}));
