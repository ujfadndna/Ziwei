// 类型
export * from "./types";

// 历法
export {
  solarToLunar,
  lunarToSolar,
  getStemBranch,
  getStemBranchOfYear,
  getStemBranchOfMonth,
  getStemBranchOfDay,
  getStemBranchOfHour,
  getYearStemBranch,
  getMonthStemBranch,
  getDayStemBranch,
  getHourStemBranch,
  parseStemBranch,
} from "./calendar";

// 宫位
export {
  getSoulPalaceBranch,
  getBodyPalaceBranch,
  getSoulStar,
  getBodyStar,
  getFiveElementClass,
  getElementNumber,
  arrangePalaces,
  getPalaceStem,
  getPalaceBranchIndex,
  getPalaceByBranch,
  getOriginPalaceIndex,
  PALACE_NAMES,
  FIVE_ELEMENT_CLASSES,
} from "./palace";

// 星曜
export {
  getZiweiPosition,
  getZiweiSeriesPositions,
  getTianfuPosition,
  getTianfuSeriesPositions,
  getAllMajorStarPositions,
  getLeftAssistantPosition,
  getRightAssistantPosition,
  getWenchangPosition,
  getWenchangPositionByTimeBranch,
  getWenquPosition,
  getWenquPositionByTimeBranch,
  getTiankuiPosition,
  getTianyuePosition,
  getLucunPosition,
  getQingyangPosition,
  getTuoluoPosition,
  getFireStarPosition,
  getBellStarPosition,
  getDikongPosition,
  getDijiePosition,
  getTianmaPosition,
  getAdjectiveStarPositions,
  getBrightness,
  isAuspiciousBrightness,
  isInauspiciousBrightness,
  ZIWEI_SERIES_STARS,
  TIANFU_SERIES_STARS,
  BRIGHTNESS_TABLE,
  type AdjectiveStarInput,
} from "./star";

// 四化
export {
  getMutagens,
  applyMutagens,
  findMutagenType,
  DEFAULT_MUTAGEN_TABLE,
  type MutagenResult,
} from "./transform";

// 运限
export {
  getDecadalStartAge,
  getDecadalDirection,
  getStemYinYang,
  getDecadalPalaces,
  findDecadalByAge,
  getYearlyPalaceIndex,
  getYearlyMutagens,
  getYearlyStars,
  getYearlyPalaceIndices,
  getCycleRulePreset,
  listCycleRulePresets,
  resolveCycleConfig,
  getMonthlyStemBranch,
  getSmallLimitPalaceIndex,
  getYearStemBranchByDivide,
  resolveCycleRulePreset,
  readDecadalOverview,
  findDecadalOverviewByAge,
  buildCycleYearRow,
  buildCycleRowsInAgeRange,
  buildMonthlyCycleRow,
  buildDailyCycleRow,
  buildHourlyCycleRow,
  buildCycleSnapshot,
  compareYearlyRows,
  getDaysInSolarMonth,
  clampSolarDay,
  getVirtualAgeByYear,
  getYearByVirtualAge,
  getPalaceLabel,
  createCycleQuery,
  normalizePalaceIndex,
  CycleQuery,
  type DecadalInfo,
  type StarPosition,
  type CycleRulePreset,
  type DecadalOverviewItem,
  type CycleYearRow,
  type MonthlyCycleRow,
  type DailyCycleRow,
  type HourlyCycleRow,
  type CycleSnapshot,
  type YearlyComparison,
  type CycleDateTimeInput,
  type CycleQueryInput,
} from "./cycle";

// 推导
export {
  createTracer,
  DerivationTracer,
  formatTraceAsText,
  formatTraceAsMarkdown,
  formatStep,
} from "./derivation";

// 八字
export { buildBaziChart, getBaziTenGod, DEFAULT_BAZI_RULESET } from "./bazi";

// 奇门
export {
  buildQimenChart,
  DEFAULT_QIMEN_RULESET,
  registerQimenJuTable,
  getQimenJuTable,
  DEFAULT_72_JU_TABLE,
} from "./systems/qimen";

// 六爻（文王纳甲）
export {
  buildLiuyaoChart,
  DEFAULT_LIUYAO_RULESET,
  registerLiuyaoHexagrams64Table,
  registerLiuyaoNajiaTable,
  registerLiuyaoXunkongTable,
  registerLiuyaoSixSpiritsTable,
  getLiuyaoHexagrams64Table,
  getLiuyaoNajiaTable,
  getLiuyaoXunkongTable,
  getLiuyaoSixSpiritsTable,
  DEFAULT_HEXAGRAMS64_TABLE,
  DEFAULT_NAJIA_TABLE,
  DEFAULT_XUNKONG_TABLE,
  DEFAULT_SIX_SPIRITS_TABLE,
} from "./systems/liuyao";

// 规则引擎
export * from "./rule-engine";

// 构建器
export { ChartBuilder, buildChart, type BuildOptions, type ChartResult } from "./builder";

// 真太阳时
export {
  calculateTrueSolarTime,
  searchCities,
  getCitiesByProvince,
  CHINA_CITIES,
  type CityEntry,
  type TrueSolarTimeResult,
} from "./solar-time";

export const ZIWEI_CORE_PLACEHOLDER = "core-ready";
