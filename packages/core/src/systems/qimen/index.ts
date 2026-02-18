import { getDayStemBranch, getHourStemBranch, parseStemBranch, SOLAR_TERMS } from "../../calendar";
import { assertIntInRange, required, stemBranchToIndex } from "../../calendar/utils";
import type {
  EarthlyBranch,
  HeavenlyStem,
  QimenChart,
  QimenDunType,
  QimenInput,
  QimenJuTableDefinition,
  QimenRuleSet,
  QimenSolarTermInfo,
  QimenTraceStep,
  QimenXunInfo,
  QimenYuan,
  QimenZhiFuZhiShiInfo,
} from "../../types";
import { DEFAULT_72_JU_TABLE, getQimenJuTable, registerQimenJuTable as registerJuTable } from "./juTables";

const DAY_MS = 86_400_000;
const SOLAR_TERM_BASE_UTC_MS = Date.UTC(1900, 0, 6, 2, 5);
const TROPICAL_YEAR_MS = 31556925974.7;
const DEFAULT_TIMEZONE_FALLBACK = "UTC+08:00";

const SOLAR_TERM_MINUTE_OFFSETS: ReadonlyArray<number> = [
  0, 21208, 42467, 63836, 85337, 107014, 128867, 150921, 173149, 195551, 218072, 240693, 263343, 285989, 308563,
  331033, 353350, 375494, 397447, 419210, 440795, 462224, 483532, 504758,
];

const LUO_SHU_ORDER = ["1", "8", "3", "4", "9", "2", "7", "6"] as const;
const LUO_SHU_COUNTER_ORDER = ["1", "6", "7", "2", "9", "4", "3", "8"] as const;
const PALACE_ORDER = ["1", "2", "3", "4", "5", "6", "7", "8", "9"] as const;

const DI_PAN_STEM_SEQUENCE: readonly HeavenlyStem[] = ["戊", "己", "庚", "辛", "壬", "癸", "丁", "丙", "乙"];

const BASIC_STAR_BY_PALACE: Record<(typeof LUO_SHU_ORDER)[number], string> = {
  "1": "天蓬",
  "8": "天任",
  "3": "天冲",
  "4": "天辅",
  "9": "天英",
  "2": "天芮",
  "7": "天柱",
  "6": "天心",
};

const BASIC_DOOR_BY_PALACE: Record<(typeof LUO_SHU_ORDER)[number], string> = {
  "1": "休门",
  "8": "生门",
  "3": "伤门",
  "4": "杜门",
  "9": "景门",
  "2": "死门",
  "7": "惊门",
  "6": "开门",
};

const GOD_SEQUENCE = ["值符", "腾蛇", "太阴", "六合", "白虎", "玄武", "九地", "九天"] as const;

const XUN_NAME_BY_START_INDEX = {
  0: "甲子",
  10: "甲戌",
  20: "甲申",
  30: "甲午",
  40: "甲辰",
  50: "甲寅",
} as const;

const XUN_SHOU_BY_XUN: Record<QimenXunInfo["xunName"], QimenXunInfo["xunShou"]> = {
  甲子: "戊",
  甲戌: "己",
  甲申: "庚",
  甲午: "辛",
  甲辰: "壬",
  甲寅: "癸",
};

const XUN_KONG_BRANCHES: Record<QimenXunInfo["xunName"], [EarthlyBranch, EarthlyBranch]> = {
  甲子: ["戌", "亥"],
  甲戌: ["申", "酉"],
  甲申: ["午", "未"],
  甲午: ["辰", "巳"],
  甲辰: ["寅", "卯"],
  甲寅: ["子", "丑"],
};

const BRANCH_TO_PALACE: Record<EarthlyBranch, string> = {
  子: "1",
  丑: "8",
  寅: "8",
  卯: "3",
  辰: "4",
  巳: "4",
  午: "9",
  未: "2",
  申: "2",
  酉: "7",
  戌: "6",
  亥: "6",
};

interface ParsedDateTime {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
  offsetMinutes: number | null;
  source: "iso-string" | "native-date";
  epochMs: number;
}

interface SolarTermMoment {
  name: string;
  index: number;
  utcMs: number;
  utcIso: string;
  year: number;
}

interface ResolvedHour {
  hour: number;
  source: "timeIndex" | "datetime";
}

interface ZhiFuAnchor {
  zhiFuSourcePalace: string;
  hourStemPalace: string;
}

interface StarDistribution {
  stars: Record<string, string>;
  zhiFuStar: string;
  zhiFuPalace: string;
}

interface DoorDistribution {
  doors: Record<string, string>;
  zhiShiDoor: string;
  zhiShiPalace: string;
}

const DATETIME_PATTERN =
  /^(\d{4})-(\d{2})-(\d{2})(?:[T\s](\d{2})(?::(\d{2})(?::(\d{2}))?)?(?:\.\d{1,3})?)?(?:([zZ]|[+-]\d{2}:?\d{2}))?$/;

/**
 * 时家转盘奇门默认规则（MVP 固定口径）。
 */
export const DEFAULT_QIMEN_RULESET: QimenRuleSet = {
  ziHourRollover: "lateZi",
  yuanSplit: "by5days",
  dunBoundary: "solstice",
  juTableId: "default_72",
  useTrueSolarTime: false,
};

function pushTrace(
  trace: QimenTraceStep[],
  key: string,
  title: string,
  detail: string,
  data?: Record<string, unknown>,
): void {
  if (data === undefined) {
    trace.push({ key, title, detail });
    return;
  }
  trace.push({ key, title, detail, data });
}

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

function parseBirthDateTime(datetime: string): ParsedDateTime {
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

    if (offsetToken) {
      const offsetMinutes = parseOffsetMinutes(offsetToken);
      const epochMs = Date.UTC(year, month - 1, day, hour, minute, second) - offsetMinutes * 60_000;
      return {
        year,
        month,
        day,
        hour,
        minute,
        second,
        offsetMinutes,
        source: "iso-string",
        epochMs,
      };
    }

    const local = new Date(year, month - 1, day, hour, minute, second);
    if (Number.isNaN(local.getTime())) {
      throw new Error(`Invalid datetime: ${datetime}`);
    }
    return {
      year,
      month,
      day,
      hour,
      minute,
      second,
      offsetMinutes: -local.getTimezoneOffset(),
      source: "iso-string",
      epochMs: local.getTime(),
    };
  }

  const fallback = new Date(datetime);
  if (Number.isNaN(fallback.getTime())) {
    throw new Error(`Invalid datetime: ${datetime}`);
  }
  const year = fallback.getFullYear();
  assertIntInRange(year, 1900, 2100, "year");
  return {
    year,
    month: fallback.getMonth() + 1,
    day: fallback.getDate(),
    hour: fallback.getHours(),
    minute: fallback.getMinutes(),
    second: fallback.getSeconds(),
    offsetMinutes: -fallback.getTimezoneOffset(),
    source: "native-date",
    epochMs: fallback.getTime(),
  };
}

function formatOffset(minutes: number): string {
  const sign = minutes >= 0 ? "+" : "-";
  const absolute = Math.abs(minutes);
  const hh = String(Math.floor(absolute / 60)).padStart(2, "0");
  const mm = String(absolute % 60).padStart(2, "0");
  return `UTC${sign}${hh}:${mm}`;
}

function resolveTimezone(input: QimenInput, ruleset: Partial<QimenRuleSet> | undefined, parsed: ParsedDateTime): string {
  if (ruleset?.timezone) return ruleset.timezone;
  if (input.location?.timeZone) return input.location.timeZone;
  if (parsed.offsetMinutes != null) return formatOffset(parsed.offsetMinutes);
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || DEFAULT_TIMEZONE_FALLBACK;
  } catch {
    return DEFAULT_TIMEZONE_FALLBACK;
  }
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

function resolveHourFromInput(input: QimenInput, parsedHour: number): ResolvedHour {
  if (typeof input.timeIndex === "number" && input.timeIndex >= 0 && input.timeIndex <= 11) {
    return {
      hour: hourFromTimeIndex(input.timeIndex),
      source: "timeIndex",
    };
  }
  return { hour: parsedHour, source: "datetime" };
}

function getSolarTermMomentUtcMs(year: number, termIndex: number): number {
  assertIntInRange(termIndex, 0, 23, "termIndex");
  assertIntInRange(year, 1899, 2101, "year");
  const offsetMinutes = required(
    SOLAR_TERM_MINUTE_OFFSETS[termIndex],
    `Solar term minute offset not found for index=${termIndex}`,
  );
  return SOLAR_TERM_BASE_UTC_MS + TROPICAL_YEAR_MS * (year - 1900) + offsetMinutes * 60_000;
}

function listSolarTermMoments(year: number): SolarTermMoment[] {
  assertIntInRange(year, 1899, 2101, "year");
  return SOLAR_TERMS.map((name, index) => {
    const utcMs = getSolarTermMomentUtcMs(year, index);
    return {
      name,
      index,
      utcMs,
      utcIso: new Date(utcMs).toISOString(),
      year,
    };
  });
}

function resolveSolarTermInfo(targetEpochMs: number, parsedYear: number): QimenSolarTermInfo {
  const moments = [...listSolarTermMoments(parsedYear - 1), ...listSolarTermMoments(parsedYear), ...listSolarTermMoments(parsedYear + 1)].sort(
    (a, b) => a.utcMs - b.utcMs,
  );

  let currentIndex = -1;
  for (let i = 0; i < moments.length; i += 1) {
    if (targetEpochMs >= moments[i]!.utcMs) {
      currentIndex = i;
    } else {
      break;
    }
  }

  if (currentIndex < 0 || currentIndex >= moments.length - 1) {
    throw new Error("Unable to resolve solar-term window for qimen chart");
  }

  const current = required(moments[currentIndex], "Current solar-term moment missing");
  const next = required(moments[currentIndex + 1], "Next solar-term moment missing");
  const dayIndex = Math.floor((targetEpochMs - current.utcMs) / DAY_MS) + 1;
  return {
    name: current.name,
    index: current.index,
    startUtcIso: current.utcIso,
    nextUtcIso: next.utcIso,
    dayIndex,
  };
}

function findLatestTermMoment(
  moments: SolarTermMoment[],
  name: "冬至" | "夏至",
  targetEpochMs: number,
): SolarTermMoment | undefined {
  let candidate: SolarTermMoment | undefined;
  for (const item of moments) {
    if (item.name !== name) continue;
    if (item.utcMs <= targetEpochMs) {
      candidate = item;
    }
  }
  return candidate;
}

function resolveDunBySolstice(
  targetEpochMs: number,
  parsedYear: number,
): { dun: QimenDunType; latestWinterSolstice: SolarTermMoment; latestSummerSolstice: SolarTermMoment } {
  const moments = [...listSolarTermMoments(parsedYear - 1), ...listSolarTermMoments(parsedYear), ...listSolarTermMoments(parsedYear + 1)].sort(
    (a, b) => a.utcMs - b.utcMs,
  );
  const latestWinterSolstice = required(
    findLatestTermMoment(moments, "冬至", targetEpochMs),
    "Unable to resolve latest winter-solstice boundary",
  );
  const latestSummerSolstice = required(
    findLatestTermMoment(moments, "夏至", targetEpochMs),
    "Unable to resolve latest summer-solstice boundary",
  );
  return {
    dun: latestWinterSolstice.utcMs > latestSummerSolstice.utcMs ? "yang" : "yin",
    latestWinterSolstice,
    latestSummerSolstice,
  };
}

function resolveYuan(dayIndex: number): QimenYuan {
  if (dayIndex <= 5) return "upper";
  if (dayIndex <= 10) return "middle";
  return "lower";
}

function resolveJu(
  juTable: QimenJuTableDefinition,
  solarTermName: string,
  yuan: QimenYuan,
): { ju: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9; entry: QimenJuTableDefinition["entries"][string] } {
  const entry = required(juTable.entries[solarTermName], `Ju-table entry missing for solar term: ${solarTermName}`);
  const ju = yuan === "upper" ? entry.upper : yuan === "middle" ? entry.middle : entry.lower;
  return { ju, entry };
}

function resolveXunInfo(hourStemBranch: QimenXunInfo["hourStemBranch"]): QimenXunInfo {
  const hourIndex = stemBranchToIndex(hourStemBranch);
  const xunStartIndex = Math.floor(hourIndex / 10) * 10;
  const xunName = required(
    XUN_NAME_BY_START_INDEX[xunStartIndex as keyof typeof XUN_NAME_BY_START_INDEX],
    `Unable to resolve xun-name for stem-branch index ${hourIndex}`,
  );
  const xunShou = required(XUN_SHOU_BY_XUN[xunName], `Unable to resolve xun-shou for ${xunName}`);
  const xunKongBranches = required(XUN_KONG_BRANCHES[xunName], `Unable to resolve xun-kong for ${xunName}`);
  const xunKongPalaces = Array.from(new Set(xunKongBranches.map((branch) => BRANCH_TO_PALACE[branch])));
  return {
    hourStemBranch,
    xunName,
    xunShou,
    xunKongBranches,
    xunKongPalaces,
  };
}

function buildDiPan(dun: QimenDunType, ju: number): Record<string, HeavenlyStem> {
  const result: Record<string, HeavenlyStem> = {};
  if (dun === "yang") {
    const startPalace = ju === 5 ? "2" : String(ju);
    const startIndex = LUO_SHU_ORDER.indexOf(startPalace as (typeof LUO_SHU_ORDER)[number]);
    if (startIndex < 0) {
      throw new Error(`Invalid yang dun ju palace: ${ju}`);
    }
    for (let i = 0; i < LUO_SHU_ORDER.length; i += 1) {
      const palace = required(
        LUO_SHU_ORDER[(startIndex + i) % LUO_SHU_ORDER.length],
        `Luoshu palace missing at index=${(startIndex + i) % LUO_SHU_ORDER.length}`,
      );
      result[palace] = DI_PAN_STEM_SEQUENCE[i]!;
    }
    result["5"] = required(result["2"], "Yang dun di-pan palace 2 missing");
    return result;
  }

  let currentPalace = ju;
  for (let i = 0; i < DI_PAN_STEM_SEQUENCE.length; i += 1) {
    result[String(currentPalace)] = DI_PAN_STEM_SEQUENCE[i]!;
    currentPalace -= 1;
    if (currentPalace === 0) currentPalace = 9;
  }
  return result;
}

function findPalaceByStem(diPan: Record<string, HeavenlyStem>, stem: HeavenlyStem, excludeCenter = true): string | null {
  for (const palace of PALACE_ORDER) {
    if (excludeCenter && palace === "5") continue;
    if (diPan[palace] === stem) return palace;
  }
  return null;
}

function resolveZhiFuAnchor(diPan: Record<string, HeavenlyStem>, xunShou: HeavenlyStem, hourStem: HeavenlyStem): ZhiFuAnchor {
  const zhiFuSourcePalace = findPalaceByStem(diPan, xunShou, true) ?? "2";
  const hourStemPalace = findPalaceByStem(diPan, hourStem, true) ?? zhiFuSourcePalace;
  return { zhiFuSourcePalace, hourStemPalace };
}

function buildTianPan(
  diPan: Record<string, HeavenlyStem>,
  anchor: ZhiFuAnchor,
  dun: QimenDunType,
): { tianPan: Record<string, HeavenlyStem>; rotationSteps: number } {
  const zhiFuIndex = LUO_SHU_ORDER.indexOf(anchor.zhiFuSourcePalace as (typeof LUO_SHU_ORDER)[number]);
  const hourIndex = LUO_SHU_ORDER.indexOf(anchor.hourStemPalace as (typeof LUO_SHU_ORDER)[number]);
  if (zhiFuIndex < 0 || hourIndex < 0) {
    throw new Error(`Unable to rotate tian-pan, anchor=${JSON.stringify(anchor)}`);
  }
  const rotationSteps =
    dun === "yang"
      ? (hourIndex - zhiFuIndex + LUO_SHU_ORDER.length) % LUO_SHU_ORDER.length
      : (zhiFuIndex - hourIndex + LUO_SHU_ORDER.length) % LUO_SHU_ORDER.length;

  const tianPan: Record<string, HeavenlyStem> = {};
  for (let i = 0; i < LUO_SHU_ORDER.length; i += 1) {
    const sourcePalace = required(LUO_SHU_ORDER[i], `Luoshu palace missing at index=${i}`);
    const sourceStem = required(diPan[sourcePalace], `Di-pan stem missing at palace ${sourcePalace}`);
    const targetIndex =
      dun === "yang"
        ? (i + rotationSteps) % LUO_SHU_ORDER.length
        : (i - rotationSteps + LUO_SHU_ORDER.length) % LUO_SHU_ORDER.length;
    const targetPalace = required(LUO_SHU_ORDER[targetIndex], `Luoshu palace missing at index=${targetIndex}`);
    tianPan[targetPalace] = sourceStem;
  }
  tianPan["5"] = required(tianPan["2"], "Tian-pan palace 2 missing");
  return { tianPan, rotationSteps };
}

function buildStars(anchor: ZhiFuAnchor): StarDistribution {
  const zhiFuStar = required(
    BASIC_STAR_BY_PALACE[anchor.zhiFuSourcePalace as (typeof LUO_SHU_ORDER)[number]],
    `Unable to resolve zhi-fu star at palace=${anchor.zhiFuSourcePalace}`,
  );
  const sourceIndex = LUO_SHU_ORDER.indexOf(anchor.zhiFuSourcePalace as (typeof LUO_SHU_ORDER)[number]);
  const targetIndex = LUO_SHU_ORDER.indexOf(anchor.hourStemPalace as (typeof LUO_SHU_ORDER)[number]);
  if (sourceIndex < 0 || targetIndex < 0) {
    throw new Error(`Unable to rotate stars, anchor=${JSON.stringify(anchor)}`);
  }
  const steps = (targetIndex - sourceIndex + LUO_SHU_ORDER.length) % LUO_SHU_ORDER.length;
  const stars: Record<string, string> = { "5": "" };
  for (let i = 0; i < LUO_SHU_ORDER.length; i += 1) {
    const sourcePalace = required(LUO_SHU_ORDER[i], `Luoshu palace missing at index=${i}`);
    const sourceStar = sourcePalace === "2" ? "禽芮" : BASIC_STAR_BY_PALACE[sourcePalace];
    const rotatedPalace = required(
      LUO_SHU_ORDER[(i + steps) % LUO_SHU_ORDER.length],
      `Luoshu palace missing at index=${(i + steps) % LUO_SHU_ORDER.length}`,
    );
    stars[rotatedPalace] = sourceStar;
  }
  return { stars, zhiFuStar, zhiFuPalace: anchor.hourStemPalace };
}

function buildDoors(anchor: ZhiFuAnchor, dun: QimenDunType): DoorDistribution {
  const zhiShiDoor = required(
    BASIC_DOOR_BY_PALACE[anchor.zhiFuSourcePalace as (typeof LUO_SHU_ORDER)[number]],
    `Unable to resolve zhi-shi door at palace=${anchor.zhiFuSourcePalace}`,
  );
  const sourceIndex = LUO_SHU_ORDER.indexOf(anchor.zhiFuSourcePalace as (typeof LUO_SHU_ORDER)[number]);
  const targetIndex = LUO_SHU_ORDER.indexOf(anchor.hourStemPalace as (typeof LUO_SHU_ORDER)[number]);
  if (sourceIndex < 0 || targetIndex < 0) {
    throw new Error(`Unable to rotate doors, anchor=${JSON.stringify(anchor)}`);
  }

  const baseSteps = (targetIndex - sourceIndex + LUO_SHU_ORDER.length) % LUO_SHU_ORDER.length;
  const steps = (baseSteps * 2) % LUO_SHU_ORDER.length;
  const doors: Record<string, string> = { "5": "" };
  let zhiShiPalace = anchor.hourStemPalace;

  for (let i = 0; i < LUO_SHU_ORDER.length; i += 1) {
    const sourcePalace = required(LUO_SHU_ORDER[i], `Luoshu palace missing at index=${i}`);
    const sourceDoor = BASIC_DOOR_BY_PALACE[sourcePalace];
    const rotatedIndex =
      dun === "yang"
        ? (i + steps) % LUO_SHU_ORDER.length
        : (i - steps + LUO_SHU_ORDER.length) % LUO_SHU_ORDER.length;
    const rotatedPalace = required(LUO_SHU_ORDER[rotatedIndex], `Luoshu palace missing at index=${rotatedIndex}`);
    doors[rotatedPalace] = sourceDoor;
    if (sourceDoor === zhiShiDoor) zhiShiPalace = rotatedPalace;
  }

  return { doors, zhiShiDoor, zhiShiPalace };
}

function buildGods(zhiFuPalace: string, dun: QimenDunType): Record<string, string> {
  const gods: Record<string, string> = {
    "1": "",
    "2": "",
    "3": "",
    "4": "",
    "5": "",
    "6": "",
    "7": "",
    "8": "",
    "9": "",
  };
  const order = dun === "yang" ? LUO_SHU_ORDER : LUO_SHU_COUNTER_ORDER;
  const startPalace = zhiFuPalace === "5" ? "2" : zhiFuPalace;
  const startIndex = order.indexOf(startPalace as (typeof LUO_SHU_ORDER)[number]);
  if (startIndex < 0) {
    throw new Error(`Unable to rotate gods from palace=${startPalace}`);
  }
  for (let i = 0; i < order.length; i += 1) {
    const palace = required(order[(startIndex + i) % order.length], `God-order palace missing at index=${i}`);
    gods[palace] = GOD_SEQUENCE[i]!;
  }
  gods["5"] = "";
  return gods;
}

function buildPalaces(
  doors: Record<string, string>,
  stars: Record<string, string>,
  gods: Record<string, string>,
  diPan: Record<string, HeavenlyStem>,
  tianPan: Record<string, HeavenlyStem>,
  zhiFuZhiShi: QimenZhiFuZhiShiInfo,
  xunKongPalaces: string[],
): QimenChart["palaces"] {
  const xunKongSet = new Set(xunKongPalaces);
  const palaces: QimenChart["palaces"] = {};
  for (const palace of PALACE_ORDER) {
    palaces[palace] = {
      palace,
      door: doors[palace] ?? "",
      star: stars[palace] ?? "",
      god: gods[palace] ?? "",
      diPanStem: required(diPan[palace], `Di-pan stem missing for palace=${palace}`),
      tianPanStem: required(tianPan[palace], `Tian-pan stem missing for palace=${palace}`),
      isZhiFu: palace === zhiFuZhiShi.zhiFuPalace,
      isZhiShi: palace === zhiFuZhiShi.zhiShiPalace,
      isXunKong: xunKongSet.has(palace),
    };
  }
  return palaces;
}

function resolveRuleSet(input: QimenInput, ruleset: Partial<QimenRuleSet> | undefined, parsed: ParsedDateTime): QimenRuleSet {
  if (ruleset?.ziHourRollover && ruleset.ziHourRollover !== "lateZi") {
    throw new Error(`Unsupported ziHourRollover: ${ruleset.ziHourRollover}`);
  }
  if (ruleset?.yuanSplit && ruleset.yuanSplit !== "by5days") {
    throw new Error(`Unsupported yuanSplit: ${ruleset.yuanSplit}`);
  }
  if (ruleset?.dunBoundary && ruleset.dunBoundary !== "solstice") {
    throw new Error(`Unsupported dunBoundary: ${ruleset.dunBoundary}`);
  }
  if (ruleset?.useTrueSolarTime && ruleset.useTrueSolarTime !== false) {
    throw new Error("useTrueSolarTime=true is not supported in MVP");
  }
  const timezone = resolveTimezone(input, ruleset, parsed);
  return {
    ...DEFAULT_QIMEN_RULESET,
    ...(ruleset ?? {}),
    useTrueSolarTime: false,
    timezone,
  };
}

/**
 * 构建时家转盘奇门命盘（MVP）。
 */
export function buildQimenChart(input: QimenInput, ruleset?: Partial<QimenRuleSet>): QimenChart {
  const trace: QimenTraceStep[] = [];
  const parsed = parseBirthDateTime(input.datetime);
  const resolvedRuleSet = resolveRuleSet(input, ruleset, parsed);
  const juTable = getQimenJuTable(resolvedRuleSet.juTableId);
  const resolvedHour = resolveHourFromInput(input, parsed.hour);
  const lateZiWindow = resolvedHour.hour === 23 || resolvedHour.hour === 0;

  pushTrace(trace, "ruleset", "规则集", "记录本次排盘实际使用的规则口径", {
    ziHourRollover: resolvedRuleSet.ziHourRollover,
    yuanSplit: resolvedRuleSet.yuanSplit,
    dunBoundary: resolvedRuleSet.dunBoundary,
    juTableId: resolvedRuleSet.juTableId,
    useTrueSolarTime: resolvedRuleSet.useTrueSolarTime,
    timezone: resolvedRuleSet.timezone,
    datetimeSource: parsed.source,
    offsetMinutes: parsed.offsetMinutes,
  });

  pushTrace(trace, "late-zi", "晚子换日判定", "默认晚子口径：23:00-01:00 仍算当日，不跨日", {
    ziHourRollover: resolvedRuleSet.ziHourRollover,
    resolvedHour: resolvedHour.hour,
    hourSource: resolvedHour.source,
    lateZiWindow,
    dayShift: 0,
  });

  const solarTerm = resolveSolarTermInfo(parsed.epochMs, parsed.year);
  pushTrace(trace, "solar-term", "节气判定", "按出生时刻落入的节气窗口计算（含精确 UTC 时刻）", {
    currentSolarTerm: solarTerm.name,
    termIndex: solarTerm.index,
    startUtcIso: solarTerm.startUtcIso,
    nextUtcIso: solarTerm.nextUtcIso,
    dayIndex: solarTerm.dayIndex,
    targetUtcIso: new Date(parsed.epochMs).toISOString(),
  });

  const dunDecision = resolveDunBySolstice(parsed.epochMs, parsed.year);
  pushTrace(trace, "dun", "阴阳遁判定", "按冬至/夏至分界（冬至后阳遁，夏至后阴遁）", {
    dunBoundary: resolvedRuleSet.dunBoundary,
    latestWinterSolstice: dunDecision.latestWinterSolstice.utcIso,
    latestSummerSolstice: dunDecision.latestSummerSolstice.utcIso,
    result: dunDecision.dun,
  });

  const yuan = resolveYuan(solarTerm.dayIndex);
  pushTrace(trace, "yuan", "三元判定", "按节气起始后的日序（1-5/6-10/11+）划分上中下元", {
    yuanSplit: resolvedRuleSet.yuanSplit,
    dayIndex: solarTerm.dayIndex,
    yuan,
  });

  const juLookup = resolveJu(juTable, solarTerm.name, yuan);
  pushTrace(trace, "ju-lookup", "局数查表", "按节气 + 三元在 72 局表中查得局数", {
    juTableId: juTable.id,
    solarTerm: solarTerm.name,
    yuan,
    ju: juLookup.ju,
    tableRecommendedDun: juLookup.entry.recommendedDun,
  });

  const dayStemBranch = getDayStemBranch(parsed.year, parsed.month, parsed.day);
  const dayParts = parseStemBranch(dayStemBranch);
  const hourStemBranch = getHourStemBranch(dayParts.stem, resolvedHour.hour);
  const xun = resolveXunInfo(hourStemBranch);
  pushTrace(trace, "xun", "旬首旬空", "以时干支所属旬计算旬首六仪与旬空", {
    dayStemBranch,
    hourStemBranch,
    xunName: xun.xunName,
    xunShou: xun.xunShou,
    xunKongBranches: xun.xunKongBranches,
    xunKongPalaces: xun.xunKongPalaces,
  });

  const diPan = buildDiPan(dunDecision.dun, juLookup.ju);
  const hourStem = parseStemBranch(hourStemBranch).stem;
  const anchor = resolveZhiFuAnchor(diPan, xun.xunShou, hourStem);
  const tianPanResult = buildTianPan(diPan, anchor, dunDecision.dun);
  const stars = buildStars(anchor);
  const doors = buildDoors(anchor, dunDecision.dun);
  const gods = buildGods(stars.zhiFuPalace, dunDecision.dun);

  const zhiFuZhiShi: QimenZhiFuZhiShiInfo = {
    zhiFuSourcePalace: anchor.zhiFuSourcePalace,
    zhiFuPalace: stars.zhiFuPalace,
    zhiFuStar: stars.zhiFuStar,
    zhiShiDoor: doors.zhiShiDoor,
    zhiShiPalace: doors.zhiShiPalace,
  };

  pushTrace(trace, "zhi-fu-zhi-shi", "值符值使定位规则", "值符由旬首六仪定位，值使由值符宫原门并随转盘规则落宫", {
    xunShou: xun.xunShou,
    hourStem,
    zhiFuSourcePalace: zhiFuZhiShi.zhiFuSourcePalace,
    zhiFuPalace: zhiFuZhiShi.zhiFuPalace,
    zhiFuStar: zhiFuZhiShi.zhiFuStar,
    zhiShiDoor: zhiFuZhiShi.zhiShiDoor,
    zhiShiPalace: zhiFuZhiShi.zhiShiPalace,
    tianPanRotationSteps: tianPanResult.rotationSteps,
  });

  const palaces = buildPalaces(
    doors.doors,
    stars.stars,
    gods,
    diPan,
    tianPanResult.tianPan,
    zhiFuZhiShi,
    xun.xunKongPalaces,
  );

  pushTrace(trace, "palaces", "九宫排布", "输出门/星/神/天盘干/地盘干的九宫结果", {
    zhiFuPalace: zhiFuZhiShi.zhiFuPalace,
    zhiShiPalace: zhiFuZhiShi.zhiShiPalace,
    xunKongPalaces: xun.xunKongPalaces,
  });

  return {
    input: {
      datetime: input.datetime,
      timeIndex: input.timeIndex,
    },
    solarTerm,
    dun: dunDecision.dun,
    yuan,
    ju: juLookup.ju,
    xun,
    zhiFuZhiShi,
    palaces,
    rulesApplied: {
      ziHourRollover: resolvedRuleSet.ziHourRollover,
      yuanSplit: resolvedRuleSet.yuanSplit,
      dunBoundary: resolvedRuleSet.dunBoundary,
      juTableId: resolvedRuleSet.juTableId,
      useTrueSolarTime: false,
      timezone: resolvedRuleSet.timezone ?? DEFAULT_TIMEZONE_FALLBACK,
    },
    trace,
  };
}

/**
 * 注册可替换 72 局查表。
 */
export const registerQimenJuTable = registerJuTable;

export { DEFAULT_72_JU_TABLE, getQimenJuTable };
