import {
  getDayStemBranch,
  getGanzhiMonthIndexForSolarDate,
  getGanzhiYearForSolarDate,
  getHourStemBranch,
  getLichunDate,
  getMonthStemBranch,
  getSolarTerms,
  getYearStemBranch,
  parseStemBranch,
} from "../calendar";
import { assertIntInRange, mod, required, stemBranchFromIndex, stemBranchToIndex } from "../calendar/utils";
import type {
  BaziChart,
  BaziInput,
  BaziRuleSet,
  FiveElementsCount,
  HiddenStem,
  LuckDirectionDecision,
  LuckPillar,
  Pillar,
  TenGod,
  TraceStep,
} from "../types";
import type { EarthlyBranch, FiveElement, HeavenlyStem, YinYang } from "../types/base";
import type { StemBranch } from "../types/base";

const DAY_MS = 86_400_000;

const DEFAULT_TIMEZONE_FALLBACK = "UTC+08:00";

export const DEFAULT_BAZI_RULESET: BaziRuleSet = {
  yearBoundary: "lichun",
  ziHourRollover: "lateZi",
  monthPillarBy: "solarTerms",
  useTrueSolarTime: false,
};

const STEM_ELEMENT_MAP: Record<HeavenlyStem, FiveElement> = {
  甲: "木",
  乙: "木",
  丙: "火",
  丁: "火",
  戊: "土",
  己: "土",
  庚: "金",
  辛: "金",
  壬: "水",
  癸: "水",
};

const STEM_YINYANG_MAP: Record<HeavenlyStem, YinYang> = {
  甲: "阳",
  乙: "阴",
  丙: "阳",
  丁: "阴",
  戊: "阳",
  己: "阴",
  庚: "阳",
  辛: "阴",
  壬: "阳",
  癸: "阴",
};

const BRANCH_HIDDEN_STEMS: Record<EarthlyBranch, readonly HeavenlyStem[]> = {
  子: ["癸"],
  丑: ["己", "癸", "辛"],
  寅: ["甲", "丙", "戊"],
  卯: ["乙"],
  辰: ["戊", "乙", "癸"],
  巳: ["丙", "庚", "戊"],
  午: ["丁", "己"],
  未: ["己", "丁", "乙"],
  申: ["庚", "壬", "戊"],
  酉: ["辛"],
  戌: ["戊", "辛", "丁"],
  亥: ["壬", "甲"],
};

const ELEMENT_GENERATES: Record<FiveElement, FiveElement> = {
  木: "火",
  火: "土",
  土: "金",
  金: "水",
  水: "木",
};

const ELEMENT_CONTROLS: Record<FiveElement, FiveElement> = {
  木: "土",
  火: "金",
  土: "水",
  金: "木",
  水: "火",
};

interface ParsedBirthDateTime {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
  offsetMinutes: number | null;
  source: "iso-string" | "native-date";
}

interface SolarTermMarker {
  name: string;
  year: number;
  month: number;
  day: number;
  epochMs: number;
}

const DATETIME_PATTERN =
  /^(\d{4})-(\d{2})-(\d{2})(?:[T\s](\d{2})(?::(\d{2})(?::(\d{2}))?)?(?:\.\d{1,3})?)?(?:([zZ]|[+-]\d{2}:?\d{2}))?$/;

function parseOffsetMinutes(token: string): number {
  if (token === "Z" || token === "z") return 0;
  const sign = token.startsWith("-") ? -1 : 1;
  const cleaned = token.slice(1).replace(":", "");
  const hours = Number(cleaned.slice(0, 2));
  const minutes = Number(cleaned.slice(2, 4));
  if (!Number.isInteger(hours) || !Number.isInteger(minutes)) {
    throw new Error(`Invalid timezone offset token: ${token}`);
  }
  return sign * (hours * 60 + minutes);
}

function parseBirthDateTime(datetime: string): ParsedBirthDateTime {
  const matched = DATETIME_PATTERN.exec(datetime.trim());
  if (matched) {
    const year = Number(matched[1]);
    const month = Number(matched[2]);
    const day = Number(matched[3]);
    const hour = Number(matched[4] ?? 0);
    const minute = Number(matched[5] ?? 0);
    const second = Number(matched[6] ?? 0);
    const offsetToken = matched[7] ?? null;
    assertIntInRange(year, 1900, 2100, "year");
    assertIntInRange(month, 1, 12, "month");
    assertIntInRange(day, 1, 31, "day");
    assertIntInRange(hour, 0, 23, "hour");
    assertIntInRange(minute, 0, 59, "minute");
    assertIntInRange(second, 0, 59, "second");
    return {
      year,
      month,
      day,
      hour,
      minute,
      second,
      offsetMinutes: offsetToken ? parseOffsetMinutes(offsetToken) : null,
      source: "iso-string",
    };
  }

  const fallback = new Date(datetime);
  if (Number.isNaN(fallback.getTime())) {
    throw new Error(`Invalid datetime: ${datetime}`);
  }

  const year = fallback.getFullYear();
  const month = fallback.getMonth() + 1;
  const day = fallback.getDate();
  const hour = fallback.getHours();
  const minute = fallback.getMinutes();
  const second = fallback.getSeconds();
  assertIntInRange(year, 1900, 2100, "year");
  return {
    year,
    month,
    day,
    hour,
    minute,
    second,
    offsetMinutes: -fallback.getTimezoneOffset(),
    source: "native-date",
  };
}

function formatOffset(minutes: number): string {
  const sign = minutes >= 0 ? "+" : "-";
  const absolute = Math.abs(minutes);
  const hh = String(Math.floor(absolute / 60)).padStart(2, "0");
  const mm = String(absolute % 60).padStart(2, "0");
  return `UTC${sign}${hh}:${mm}`;
}

function resolveTimezone(input: BaziInput, ruleset: Partial<BaziRuleSet> | undefined, parsed: ParsedBirthDateTime): string {
  if (ruleset?.timezone) return ruleset.timezone;
  if (input.location?.timeZone) return input.location.timeZone;
  if (parsed.offsetMinutes != null) return formatOffset(parsed.offsetMinutes);
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || DEFAULT_TIMEZONE_FALLBACK;
  } catch {
    return DEFAULT_TIMEZONE_FALLBACK;
  }
}

function getDstHint(parsed: ParsedBirthDateTime): boolean | null {
  if (parsed.source !== "native-date") return null;
  const target = new Date(parsed.year, parsed.month - 1, parsed.day, parsed.hour, parsed.minute, parsed.second);
  const janOffset = new Date(parsed.year, 0, 1).getTimezoneOffset();
  const julOffset = new Date(parsed.year, 6, 1).getTimezoneOffset();
  const standardOffset = Math.max(janOffset, julOffset);
  return target.getTimezoneOffset() < standardOffset;
}

function hourFromTimeIndex(timeIndex: number): number {
  switch (timeIndex) {
    case 0:
      return 23;
    case 1:
      return 1;
    case 2:
      return 3;
    case 3:
      return 5;
    case 4:
      return 7;
    case 5:
      return 9;
    case 6:
      return 11;
    case 7:
      return 13;
    case 8:
      return 15;
    case 9:
      return 17;
    case 10:
      return 19;
    case 11:
      return 21;
    default:
      return 12;
  }
}

function resolveHourFromInput(input: BaziInput, parsedHour: number): { hour: number; source: "timeIndex" | "datetime" } {
  if (typeof input.timeIndex === "number" && input.timeIndex >= 0 && input.timeIndex <= 11) {
    return {
      hour: hourFromTimeIndex(input.timeIndex),
      source: "timeIndex",
    };
  }
  return {
    hour: parsedHour,
    source: "datetime",
  };
}

function toPillar(stemBranch: StemBranch): Pillar {
  const parts = parseStemBranch(stemBranch);
  return {
    stem: parts.stem,
    branch: parts.branch,
    stemBranch,
  };
}

function getTenGod(dayMaster: HeavenlyStem, targetStem: HeavenlyStem): TenGod {
  if (dayMaster === targetStem) return "比肩";
  const dayElement = STEM_ELEMENT_MAP[dayMaster];
  const targetElement = STEM_ELEMENT_MAP[targetStem];
  const samePolarity = STEM_YINYANG_MAP[dayMaster] === STEM_YINYANG_MAP[targetStem];

  if (dayElement === targetElement) {
    return samePolarity ? "比肩" : "劫财";
  }
  if (ELEMENT_GENERATES[dayElement] === targetElement) {
    return samePolarity ? "食神" : "伤官";
  }
  if (ELEMENT_GENERATES[targetElement] === dayElement) {
    return samePolarity ? "偏印" : "正印";
  }
  if (ELEMENT_CONTROLS[dayElement] === targetElement) {
    return samePolarity ? "偏财" : "正财";
  }
  if (ELEMENT_CONTROLS[targetElement] === dayElement) {
    return samePolarity ? "七杀" : "正官";
  }
  throw new Error(`Unable to resolve ten-god for dayMaster=${dayMaster}, targetStem=${targetStem}`);
}

function buildHiddenStems(branch: EarthlyBranch, dayMaster: HeavenlyStem): HiddenStem[] {
  const stems = required(BRANCH_HIDDEN_STEMS[branch], `Hidden stems missing for branch=${branch}`);
  return stems.map((stem) => ({
    stem,
    element: STEM_ELEMENT_MAP[stem],
    tenGod: stem === dayMaster ? "日主" : getTenGod(dayMaster, stem),
    weight: 1,
  }));
}

function emptyElementCount(): FiveElementsCount {
  return {
    金: 0,
    木: 0,
    水: 0,
    火: 0,
    土: 0,
  };
}

function countFiveElements(stems: HeavenlyStem[], hiddenGroups: HiddenStem[][]): FiveElementsCount {
  const count = emptyElementCount();
  for (const stem of stems) {
    count[STEM_ELEMENT_MAP[stem]] += 1;
  }
  for (const group of hiddenGroups) {
    for (const item of group) {
      count[item.element] += item.weight;
    }
  }
  return count;
}

function getLuckDirection(gender: BaziInput["gender"], yearStem: HeavenlyStem): LuckDirectionDecision {
  const yearStemYinYang = STEM_YINYANG_MAP[yearStem];
  const direction =
    (gender === "男" && yearStemYinYang === "阳") || (gender === "女" && yearStemYinYang === "阴")
      ? "forward"
      : "backward";
  return {
    gender,
    yearStem,
    yearStemYinYang,
    direction,
  };
}

function listSolarTermMarkers(year: number): SolarTermMarker[] {
  const terms = getSolarTerms(year);
  return terms.map((item) => ({
    name: item.name,
    year: item.date.year,
    month: item.date.month,
    day: item.date.day,
    epochMs: Date.UTC(item.date.year, item.date.month - 1, item.date.day),
  }));
}

function toIsoDate(year: number, month: number, day: number): string {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function resolveLuckStart(
  direction: "forward" | "backward",
  parsed: ParsedBirthDateTime
): { startAge: number; startDate: string; marker: SolarTermMarker; deltaDays: number } {
  const birthEpochMs = Date.UTC(parsed.year, parsed.month - 1, parsed.day, parsed.hour, parsed.minute, parsed.second);
  const markers = [...listSolarTermMarkers(parsed.year - 1), ...listSolarTermMarkers(parsed.year), ...listSolarTermMarkers(parsed.year + 1)].sort(
    (a, b) => a.epochMs - b.epochMs
  );
  const marker =
    direction === "forward"
      ? markers.find((item) => item.epochMs >= birthEpochMs)
      : [...markers].reverse().find((item) => item.epochMs <= birthEpochMs);
  if (!marker) {
    throw new Error("Unable to resolve luck start marker from solar terms");
  }
  const deltaDays = Math.abs(marker.epochMs - birthEpochMs) / DAY_MS;
  const startAge = Number((deltaDays / 3).toFixed(2));
  return {
    startAge,
    startDate: toIsoDate(marker.year, marker.month, marker.day),
    marker,
    deltaDays: Number(deltaDays.toFixed(4)),
  };
}

function buildLuckPillars(
  monthPillar: Pillar,
  direction: "forward" | "backward",
  startAge: number,
  birthSolarYear: number
): LuckPillar[] {
  const monthIndex = stemBranchToIndex(monthPillar.stemBranch);
  const step = direction === "forward" ? 1 : -1;
  const pillars: LuckPillar[] = [];
  for (let i = 0; i < 10; i += 1) {
    const index = mod(monthIndex + step * (i + 1), 60);
    const stemBranch = stemBranchFromIndex(index);
    const parts = parseStemBranch(stemBranch);
    const startAgeStep = Number((startAge + i * 10).toFixed(2));
    const endAgeStep = Number((startAgeStep + 9.99).toFixed(2));
    const startYear = birthSolarYear + Math.floor(startAgeStep);
    pillars.push({
      index: i + 1,
      stem: parts.stem,
      branch: parts.branch,
      stemBranch,
      startAge: startAgeStep,
      endAge: endAgeStep,
      startYear,
      endYear: startYear + 9,
    });
  }
  return pillars;
}

function resolveFlowYear(flowYear: number | undefined): number | undefined {
  if (flowYear == null) return undefined;
  assertIntInRange(Math.floor(flowYear), 1900, 2100, "flowYear");
  return Math.floor(flowYear);
}

function pushTrace(trace: TraceStep[], key: string, title: string, detail: string, data?: Record<string, unknown>): void {
  if (data === undefined) {
    trace.push({ key, title, detail });
    return;
  }
  trace.push({ key, title, detail, data });
}

/**
 * 构建八字排盘（MVP）：
 * - 立春换年
 * - 晚子（23:00-01:00 不跨日）
 * - 节气定月
 * - 真太阳时关闭
 */
export function buildBaziChart(input: BaziInput, ruleset?: Partial<BaziRuleSet>): BaziChart {
  const trace: TraceStep[] = [];
  const parsed = parseBirthDateTime(input.datetime);
  const timezone = resolveTimezone(input, ruleset, parsed);
  const dstActive = getDstHint(parsed);
  const resolvedRules: BaziRuleSet = {
    ...DEFAULT_BAZI_RULESET,
    timezone,
  };

  pushTrace(trace, "timezone", "时区与 DST", "记录本次排盘所用时区与 DST 提示信息", {
    timezone,
    dstActive,
    datetimeSource: parsed.source,
    offsetMinutes: parsed.offsetMinutes,
  });

  const resolvedHour = resolveHourFromInput(input, parsed.hour);
  const lateZiWindow = resolvedHour.hour === 23 || resolvedHour.hour === 0;
  pushTrace(trace, "late-zi", "晚子换日判定", "默认晚子口径：23:00-01:00 仍视为当日，不跨日", {
    ziHourRollover: resolvedRules.ziHourRollover,
    resolvedHour: resolvedHour.hour,
    hourSource: resolvedHour.source,
    lateZiWindow,
    dayShift: 0,
  });

  const lichun = getLichunDate(parsed.year);
  const passedLichun =
    parsed.month > lichun.month || (parsed.month === lichun.month && parsed.day >= lichun.day);
  const ganzhiYear = getGanzhiYearForSolarDate(parsed.year, parsed.month, parsed.day);
  pushTrace(trace, "year-boundary", "立春换年判定", "按立春边界确定干支年", {
    inputDate: toIsoDate(parsed.year, parsed.month, parsed.day),
    lichunDate: toIsoDate(lichun.year, lichun.month, lichun.day),
    passedLichun,
    ganzhiYear,
  });

  const monthIndex = getGanzhiMonthIndexForSolarDate(parsed.year, parsed.month, parsed.day);
  pushTrace(trace, "month-boundary", "节气定月柱", "按节气月（寅月=1 ... 丑月=12）确定月柱索引", {
    monthPillarBy: resolvedRules.monthPillarBy,
    monthIndex,
  });

  const yearStemBranch = getYearStemBranch(ganzhiYear);
  const yearParts = parseStemBranch(yearStemBranch);
  const monthStemBranch = getMonthStemBranch(ganzhiYear, monthIndex);
  const monthParts = parseStemBranch(monthStemBranch);
  const dayStemBranch = getDayStemBranch(parsed.year, parsed.month, parsed.day);
  const dayParts = parseStemBranch(dayStemBranch);
  const hourStemBranch = getHourStemBranch(dayParts.stem, resolvedHour.hour);
  const hourParts = parseStemBranch(hourStemBranch);

  const pillars = {
    year: toPillar(yearStemBranch),
    month: toPillar(monthStemBranch),
    day: toPillar(dayStemBranch),
    hour: toPillar(hourStemBranch),
  };

  pushTrace(trace, "pillars", "四柱计算", "输出年/月/日/时四柱", {
    year: pillars.year.stemBranch,
    month: pillars.month.stemBranch,
    day: pillars.day.stemBranch,
    hour: pillars.hour.stemBranch,
  });

  const dayMaster = dayParts.stem;
  const hiddenStems = {
    yearBranch: buildHiddenStems(yearParts.branch, dayMaster),
    monthBranch: buildHiddenStems(monthParts.branch, dayMaster),
    dayBranch: buildHiddenStems(dayParts.branch, dayMaster),
    hourBranch: buildHiddenStems(hourParts.branch, dayMaster),
  };

  pushTrace(trace, "hidden-stems", "地支藏干", "按四柱地支展开藏干，并映射十神", {
    yearBranch: hiddenStems.yearBranch.map((item) => `${item.stem}(${item.tenGod})`),
    monthBranch: hiddenStems.monthBranch.map((item) => `${item.stem}(${item.tenGod})`),
    dayBranch: hiddenStems.dayBranch.map((item) => `${item.stem}(${item.tenGod})`),
    hourBranch: hiddenStems.hourBranch.map((item) => `${item.stem}(${item.tenGod})`),
  });

  const fiveElementsCount = countFiveElements(
    [yearParts.stem, monthParts.stem, dayParts.stem, hourParts.stem],
    [hiddenStems.yearBranch, hiddenStems.monthBranch, hiddenStems.dayBranch, hiddenStems.hourBranch]
  );
  pushTrace(trace, "five-elements", "五行统计", "按天干 + 藏干出现次数统计五行", fiveElementsCount);

  const directionDecision = getLuckDirection(input.gender, yearParts.stem);
  const luckStart = resolveLuckStart(directionDecision.direction, parsed);
  const luckPillars = buildLuckPillars(pillars.month, directionDecision.direction, luckStart.startAge, parsed.year);
  pushTrace(trace, "luck", "大运起运", "按性别与年干阴阳判顺逆，并基于节气差计算起运", {
    ...directionDecision,
    startAge: luckStart.startAge,
    startDate: luckStart.startDate,
    boundarySolarTerm: `${luckStart.marker.name}(${luckStart.marker.year}-${luckStart.marker.month}-${luckStart.marker.day})`,
    deltaDays: luckStart.deltaDays,
    conversion: "deltaDays / 3",
    firstLuck: luckPillars[0]?.stemBranch ?? null,
  });

  const flowYear = resolveFlowYear(input.flowYear);
  const flow = flowYear
    ? {
        year: {
          year: flowYear,
          stemBranch: getYearStemBranch(flowYear),
        },
      }
    : {};
  if (flowYear) {
    pushTrace(trace, "flow-year", "流年", "按指定年份计算流年干支", {
      year: flowYear,
      stemBranch: flow.year?.stemBranch ?? null,
    });
  }

  return {
    pillars,
    dayMaster,
    hiddenStems,
    tenGods: {
      stems: {
        year: yearParts.stem === dayMaster ? "日主" : getTenGod(dayMaster, yearParts.stem),
        month: monthParts.stem === dayMaster ? "日主" : getTenGod(dayMaster, monthParts.stem),
        day: "日主",
        hour: hourParts.stem === dayMaster ? "日主" : getTenGod(dayMaster, hourParts.stem),
      },
      hiddenStems: hiddenStems,
    },
    fiveElementsCount,
    luck: {
      direction: directionDecision.direction,
      startAge: luckStart.startAge,
      startDate: luckStart.startDate,
      pillars: luckPillars,
    },
    flow,
    rulesApplied: {
      yearBoundary: resolvedRules.yearBoundary,
      ziHourRollover: resolvedRules.ziHourRollover,
      monthPillarBy: resolvedRules.monthPillarBy,
      useTrueSolarTime: false,
      timezone,
    },
    trace,
  };
}

export function getBaziTenGod(dayMaster: HeavenlyStem, targetStem: HeavenlyStem): TenGod {
  if (dayMaster === targetStem) return "日主";
  return getTenGod(dayMaster, targetStem);
}
