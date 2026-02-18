/**
 * 运限模块导出。
 */

// 大限
export {
  getDecadalStartAge,
  getDecadalDirection,
  getStemYinYang,
  getDecadalPalaces,
  findDecadalByAge,
  type DecadalInfo,
} from "./decadal";

// 流年
export {
  getYearlyPalaceIndex,
  getYearlyMutagens,
  getYearlyStars,
  getYearlyPalaceIndices,
  type StarPosition,
} from "./yearly";

// 口径配置
export {
  getCycleRulePreset,
  listCycleRulePresets,
  resolveCycleConfig,
  type CycleRulePreset,
} from "./config";

// 运行时运限辅助
export {
  getMonthlyStemBranch,
  getSmallLimitPalaceIndex,
  getYearStemBranchByDivide,
} from "./runtime";

// Query 风格运限 API
export {
  CycleQuery,
  buildCycleRowsInAgeRange,
  buildCycleSnapshot,
  buildCycleYearRow,
  buildDailyCycleRow,
  buildHourlyCycleRow,
  buildMonthlyCycleRow,
  clampSolarDay,
  compareYearlyRows,
  createCycleQuery,
  findDecadalOverviewByAge,
  getDaysInSolarMonth,
  getPalaceLabel,
  getVirtualAgeByYear,
  getYearByVirtualAge,
  normalizePalaceIndex,
  readDecadalOverview,
  resolveCycleRulePreset,
  type CycleDateTimeInput,
  type CycleQueryInput,
  type CycleSnapshot,
  type CycleYearRow,
  type DailyCycleRow,
  type DecadalOverviewItem,
  type HourlyCycleRow,
  type MonthlyCycleRow,
  type YearlyComparison,
} from "./query";
