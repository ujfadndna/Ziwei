import { getStemBranch, parseStemBranch, solarToLunar } from "../../calendar";
import { assertIntInRange, required, stemBranchToIndex } from "../../calendar/utils";
import type {
  EarthlyBranch,
  FiveElement,
  HeavenlyStem,
  Hexagram,
  LiuQin,
  LiuyaoChart,
  LiuyaoChartLine,
  LiuyaoInput,
  LiuyaoRuleSet,
  LiuyaoTraceStep,
  Line,
  NajiaLineInfo,
  SixSpirit,
  YinYang,
} from "../../types";
import {
  DEFAULT_HEXAGRAMS64_TABLE,
  DEFAULT_NAJIA_TABLE,
  DEFAULT_SIX_SPIRITS_TABLE,
  DEFAULT_XUNKONG_TABLE,
  getHexagrams64Table,
  getNajiaTable,
  getSixSpiritsTable,
  getXunkongTable,
  registerHexagrams64Table as registerHexTable,
  registerNajiaTable as registerNajia,
  registerSixSpiritsTable as registerSixSpirits,
  registerXunkongTable as registerXunkong,
} from "./tables";

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

interface ResolvedHour {
  hour: number;
  source: "timeIndex" | "datetime";
}

type CoinFace = "heads" | "tails";
type CastLabel = "老阴" | "少阳" | "少阴" | "老阳";
type XunName = "甲子" | "甲戌" | "甲申" | "甲午" | "甲辰" | "甲寅";

const DATETIME_PATTERN =
  /^(\d{4})-(\d{2})-(\d{2})(?:[T\s](\d{2})(?::(\d{2})(?::(\d{2}))?)?(?:\.\d{1,3})?)?(?:([zZ]|[+-]\d{2}:?\d{2}))?$/;

const DEFAULT_TIMEZONE_FALLBACK = "UTC+08:00";

const COIN_SCORE: Record<CoinFace, 2 | 3> = {
  heads: 3,
  tails: 2,
};

const XUN_NAME_BY_START_INDEX: Record<number, XunName> = {
  0: "甲子",
  10: "甲戌",
  20: "甲申",
  30: "甲午",
  40: "甲辰",
  50: "甲寅",
};

const PALACE_ELEMENT: Record<Hexagram["palace"], FiveElement> = {
  乾: "金",
  兑: "金",
  离: "火",
  震: "木",
  巽: "木",
  坎: "水",
  艮: "土",
  坤: "土",
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

/**
 * 文王纳甲六爻默认规则（MVP 固定口径）。
 */
export const DEFAULT_LIUYAO_RULESET: LiuyaoRuleSet = {
  ziHourRollover: "lateZi",
  castingMethod: "coin_3",
  najiaTableId: "default_najia_v1",
  shiYingTableId: "default_shiying_v1",
  sixSpiritsRule: "byDayStem_default",
  xunkongRule: "default_xunkong_v1",
};

function pushTrace(
  trace: LiuyaoTraceStep[],
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

function getDstHint(parsed: ParsedDateTime): boolean | null {
  if (parsed.source !== "native-date") return null;
  const target = new Date(parsed.year, parsed.month - 1, parsed.day, parsed.hour, parsed.minute, parsed.second);
  const janOffset = new Date(parsed.year, 0, 1).getTimezoneOffset();
  const julOffset = new Date(parsed.year, 6, 1).getTimezoneOffset();
  const standardOffset = Math.max(janOffset, julOffset);
  return target.getTimezoneOffset() < standardOffset;
}

function formatOffset(minutes: number): string {
  const sign = minutes >= 0 ? "+" : "-";
  const absolute = Math.abs(minutes);
  const hh = String(Math.floor(absolute / 60)).padStart(2, "0");
  const mm = String(absolute % 60).padStart(2, "0");
  return `UTC${sign}${hh}:${mm}`;
}

function resolveTimezone(input: LiuyaoInput, ruleset: Partial<LiuyaoRuleSet> | undefined, parsed: ParsedDateTime): string {
  if (ruleset?.timezone) return ruleset.timezone;
  if (input.timezone) return input.timezone;
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

function resolveHourFromInput(input: LiuyaoInput, parsedHour: number): ResolvedHour {
  if (typeof input.timeIndex === "number" && input.timeIndex >= 0 && input.timeIndex <= 11) {
    return {
      hour: hourFromTimeIndex(input.timeIndex),
      source: "timeIndex",
    };
  }
  return { hour: parsedHour, source: "datetime" };
}

function resolveRuleSet(input: LiuyaoInput, ruleset: Partial<LiuyaoRuleSet> | undefined, parsed: ParsedDateTime): LiuyaoRuleSet {
  if (ruleset?.ziHourRollover && ruleset.ziHourRollover !== "lateZi") {
    throw new Error(`Unsupported ziHourRollover: ${ruleset.ziHourRollover}`);
  }
  if (ruleset?.castingMethod && ruleset.castingMethod !== "coin_3") {
    throw new Error(`Unsupported castingMethod: ${ruleset.castingMethod}`);
  }
  const timezone = resolveTimezone(input, ruleset, parsed);
  return {
    ...DEFAULT_LIUYAO_RULESET,
    ...(ruleset ?? {}),
    ziHourRollover: "lateZi",
    castingMethod: "coin_3",
    timezone,
  };
}

function hashSeed(input: LiuyaoInput): number {
  const raw = `${input.gender}|${input.datetime}|${input.timeIndex}|${input.location?.timeZone ?? ""}|${input.note ?? ""}`;
  let hash = 2166136261;
  for (let i = 0; i < raw.length; i += 1) {
    hash ^= raw.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function createDeterministicCoinLines(seedInput: number): ReadonlyArray<readonly [CoinFace, CoinFace, CoinFace]> {
  let state = (seedInput >>> 0) || 0x9e3779b9;
  const next = () => {
    state ^= state << 13;
    state ^= state >>> 17;
    state ^= state << 5;
    return state >>> 0;
  };
  const lines: Array<[CoinFace, CoinFace, CoinFace]> = [];
  for (let line = 0; line < 6; line += 1) {
    const lineCoins: [CoinFace, CoinFace, CoinFace] = ["heads", "heads", "heads"];
    for (let i = 0; i < 3; i += 1) {
      lineCoins[i] = (next() & 1) === 0 ? "heads" : "tails";
    }
    lines.push(lineCoins);
  }
  return lines;
}

function normalizeCoinLine(raw: readonly string[], lineIndex: number): readonly [CoinFace, CoinFace, CoinFace] {
  if (raw.length !== 3) {
    throw new Error(`coin_3 requires 3 coins per line, got lineIndex=${lineIndex}, coins=${raw.length}`);
  }
  const normalized = raw.map((item) => {
    const value = item.trim().toLowerCase();
    if (value === "heads" || value === "h") return "heads";
    if (value === "tails" || value === "t") return "tails";
    throw new Error(`Invalid coin face at lineIndex=${lineIndex}: ${item}`);
  }) as CoinFace[];
  return [normalized[0]!, normalized[1]!, normalized[2]!];
}

function resolveCoinLines(input: LiuyaoInput): {
  lines: ReadonlyArray<readonly [CoinFace, CoinFace, CoinFace]>;
  source: "input" | "deterministic";
  seed?: number;
} {
  const rawLines = input.casting?.lineThrows;
  if (rawLines && rawLines.length > 0) {
    if (rawLines.length !== 6) {
      throw new Error(`coin_3 requires exactly 6 lines, got ${rawLines.length}`);
    }
    const normalized = rawLines.map((coins, idx) => normalizeCoinLine(coins as readonly string[], idx + 1));
    return {
      lines: normalized,
      source: "input",
    };
  }
  const seed = input.casting?.seed ?? hashSeed(input);
  return {
    lines: createDeterministicCoinLines(seed),
    source: "deterministic",
    seed,
  };
}

function mapCoinLineToCast(
  coinThrow: readonly [CoinFace, CoinFace, CoinFace],
  lineIndex: number,
): {
  line: Line;
  coinSum: 6 | 7 | 8 | 9;
  castLabel: CastLabel;
} {
  const sum = coinThrow.reduce((acc, coin) => acc + COIN_SCORE[coin], 0);
  if (sum === 6) {
    return {
      line: { yinYang: "阴", moving: true, lineIndex: lineIndex as Line["lineIndex"] },
      coinSum: 6,
      castLabel: "老阴",
    };
  }
  if (sum === 7) {
    return {
      line: { yinYang: "阳", moving: false, lineIndex: lineIndex as Line["lineIndex"] },
      coinSum: 7,
      castLabel: "少阳",
    };
  }
  if (sum === 8) {
    return {
      line: { yinYang: "阴", moving: false, lineIndex: lineIndex as Line["lineIndex"] },
      coinSum: 8,
      castLabel: "少阴",
    };
  }
  if (sum === 9) {
    return {
      line: { yinYang: "阳", moving: true, lineIndex: lineIndex as Line["lineIndex"] },
      coinSum: 9,
      castLabel: "老阳",
    };
  }
  throw new Error(`coin_3 produced invalid sum: ${sum}`);
}

function flipYinYang(value: YinYang): YinYang {
  return value === "阳" ? "阴" : "阳";
}

function linesToCode(lines: readonly { yinYang: YinYang }[]): string {
  return lines.map((item) => (item.yinYang === "阳" ? "1" : "0")).join("");
}

function toHexagram(entry: {
  id: number;
  name: string;
  upperTrigram: Hexagram["upperTrigram"];
  lowerTrigram: Hexagram["lowerTrigram"];
  palace: Hexagram["palace"];
  shiLine: Hexagram["shiLine"];
  yingLine: Hexagram["yingLine"];
}): Hexagram {
  return {
    id: entry.id,
    name: entry.name,
    upperTrigram: entry.upperTrigram,
    lowerTrigram: entry.lowerTrigram,
    palace: entry.palace,
    shiLine: entry.shiLine,
    yingLine: entry.yingLine,
  };
}

function resolveRelative(palaceElement: FiveElement, lineElement: FiveElement): LiuQin {
  if (lineElement === palaceElement) return "兄弟";
  if (ELEMENT_GENERATES[lineElement] === palaceElement) return "父母";
  if (ELEMENT_GENERATES[palaceElement] === lineElement) return "子孙";
  if (ELEMENT_CONTROLS[lineElement] === palaceElement) return "官鬼";
  return "妻财";
}

function buildNajiaInfo(
  lineIndex: number,
  yinYang: YinYang,
  moving: boolean,
  hexagram: Hexagram,
  spiritsByLine: readonly SixSpirit[],
  voidSet: ReadonlySet<EarthlyBranch>,
  najiaTable: ReturnType<typeof getNajiaTable>,
  addChangedMarker: boolean,
): NajiaLineInfo {
  const useLower = lineIndex <= 3;
  const linePos = useLower ? lineIndex : lineIndex - 3;
  const trigram = useLower ? hexagram.lowerTrigram : hexagram.upperTrigram;
  const branches = useLower ? najiaTable.entries[trigram].lower : najiaTable.entries[trigram].upper;
  const branch = required(branches[linePos - 1], `Najia branch missing at trigram=${trigram}, linePos=${linePos}`);
  const element = required(najiaTable.branchElements[branch], `Branch element missing for ${branch}`);
  const spirit = required(spiritsByLine[lineIndex - 1], `Six spirit missing at lineIndex=${lineIndex}`);
  const palaceElement = PALACE_ELEMENT[hexagram.palace];
  const relative = resolveRelative(palaceElement, element);
  const isVoid = voidSet.has(branch);
  const markers: string[] = [];
  if (lineIndex === hexagram.shiLine) markers.push("世");
  if (lineIndex === hexagram.yingLine) markers.push("应");
  if (moving && !addChangedMarker) markers.push("动");
  if (moving && addChangedMarker) markers.push("变");
  if (isVoid) markers.push("空");
  if (yinYang === "阳") markers.push("阳");
  if (yinYang === "阴") markers.push("阴");
  return {
    branch,
    element,
    relative,
    spirit,
    isVoid,
    markers,
  };
}

/**
 * 构建文王纳甲六爻排盘（MVP）。
 */
export function buildLiuyaoChart(input: LiuyaoInput, ruleset?: Partial<LiuyaoRuleSet>): LiuyaoChart {
  const trace: LiuyaoTraceStep[] = [];
  const parsed = parseBirthDateTime(input.datetime);
  const resolvedRuleSet = resolveRuleSet(input, ruleset, parsed);
  const dstHint = getDstHint(parsed);
  const resolvedHour = resolveHourFromInput(input, parsed.hour);
  const lateZiWindow = resolvedHour.hour === 23 || resolvedHour.hour === 0;

  const hexTable = getHexagrams64Table(resolvedRuleSet.shiYingTableId);
  const najiaTable = getNajiaTable(resolvedRuleSet.najiaTableId);
  const xunkongTable = getXunkongTable(resolvedRuleSet.xunkongRule);
  const sixSpiritsTable = getSixSpiritsTable(resolvedRuleSet.sixSpiritsRule);

  pushTrace(trace, "ruleset", "规则集", "记录本次六爻排盘实际使用的规则口径", {
    ziHourRollover: resolvedRuleSet.ziHourRollover,
    castingMethod: resolvedRuleSet.castingMethod,
    najiaTableId: resolvedRuleSet.najiaTableId,
    shiYingTableId: resolvedRuleSet.shiYingTableId,
    sixSpiritsRule: resolvedRuleSet.sixSpiritsRule,
    xunkongRule: resolvedRuleSet.xunkongRule,
    timezone: resolvedRuleSet.timezone,
    datetimeSource: parsed.source,
    offsetMinutes: parsed.offsetMinutes,
    dstHint,
  });

  pushTrace(trace, "late-zi", "晚子换日判定", "默认晚子口径：23:00-01:00 仍算当日，不跨日", {
    ziHourRollover: resolvedRuleSet.ziHourRollover,
    resolvedHour: resolvedHour.hour,
    hourSource: resolvedHour.source,
    lateZiWindow,
    dayShift: 0,
  });

  const coinLines = resolveCoinLines(input);
  const castRows = coinLines.lines.map((coins, idx) => {
    const cast = mapCoinLineToCast(coins, idx + 1);
    return {
      lineIndex: cast.line.lineIndex,
      coinThrow: coins,
      coinSum: cast.coinSum,
      castLabel: cast.castLabel,
      yinYang: cast.line.yinYang,
      moving: cast.line.moving,
    };
  });
  pushTrace(trace, "casting", "起卦（3-coin）", "每爻按三枚硬币求和：6老阴、7少阳、8少阴、9老阳（自下而上）", {
    castingMethod: resolvedRuleSet.castingMethod,
    source: coinLines.source,
    seed: coinLines.seed,
    lines: castRows,
  });

  const baseLines: Line[] = castRows.map((row) => ({
    yinYang: row.yinYang,
    moving: row.moving,
    lineIndex: row.lineIndex,
  }));
  const changedLineStates = baseLines.map((line) => ({
    yinYang: line.moving ? flipYinYang(line.yinYang) : line.yinYang,
    moving: false,
    lineIndex: line.lineIndex,
  }));

  const baseCode = linesToCode(baseLines);
  const changedCode = linesToCode(changedLineStates);
  const entryByCode = new Map(hexTable.entries.map((entry) => [entry.code, entry] as const));
  const baseEntry = required(entryByCode.get(baseCode), `Hexagram not found for base code: ${baseCode}`);
  const changedEntry = required(entryByCode.get(changedCode), `Hexagram not found for changed code: ${changedCode}`);
  const baseHexagram = toHexagram(baseEntry);
  const changedHexagram = toHexagram(changedEntry);

  pushTrace(trace, "hexagram", "本卦/变卦推导", "由六爻阴阳（自下而上）推导上下卦，再查得本卦与变卦", {
    baseCode,
    changedCode,
    baseHexagram: {
      id: baseHexagram.id,
      name: baseHexagram.name,
      upperTrigram: baseHexagram.upperTrigram,
      lowerTrigram: baseHexagram.lowerTrigram,
    },
    changedHexagram: {
      id: changedHexagram.id,
      name: changedHexagram.name,
      upperTrigram: changedHexagram.upperTrigram,
      lowerTrigram: changedHexagram.lowerTrigram,
    },
  });

  pushTrace(trace, "shiying", "卦宫/世应查表", "按卦码在64卦表（含卦宫与世应）查得本卦与变卦定位", {
    shiYingTableId: resolvedRuleSet.shiYingTableId,
    baseLookupKey: baseCode,
    changedLookupKey: changedCode,
    baseResult: {
      palace: baseHexagram.palace,
      shiLine: baseHexagram.shiLine,
      yingLine: baseHexagram.yingLine,
    },
    changedResult: {
      palace: changedHexagram.palace,
      shiLine: changedHexagram.shiLine,
      yingLine: changedHexagram.yingLine,
    },
  });

  const ganzhi = getStemBranch(parsed.year, parsed.month, parsed.day, resolvedHour.hour);
  const lunar = solarToLunar(parsed.year, parsed.month, parsed.day);
  const monthBuild = parseStemBranch(ganzhi.month).branch;
  const dayParts = parseStemBranch(ganzhi.day);
  const dayChen = dayParts.branch;
  const dayStem = dayParts.stem;
  const dayStemBranchIndex = stemBranchToIndex(ganzhi.day);
  const xunStartIndex = Math.floor(dayStemBranchIndex / 10) * 10;
  const xun = required(XUN_NAME_BY_START_INDEX[xunStartIndex], `Unable to resolve xun for day stem-branch index: ${dayStemBranchIndex}`) as XunName;
  const xunkongEntry = required(xunkongTable.entries[xun], `Xunkong table missing xun: ${xun}`);
  const voidBranches = xunkongEntry.void;
  const voidSet = new Set<EarthlyBranch>(voidBranches);

  pushTrace(trace, "xunkong", "旬空判定", "按日柱所属旬（甲子/甲戌/甲申/甲午/甲辰/甲寅）查旬空", {
    xunkongRule: resolvedRuleSet.xunkongRule,
    dayStemBranch: ganzhi.day,
    dayStemBranchIndex,
    xun,
    voidBranches,
  });

  const startSpirit = required(sixSpiritsTable.starts[dayStem], `Six spirit start missing for day stem: ${dayStem}`);
  const startSpiritIndex = sixSpiritsTable.sequence.indexOf(startSpirit);
  if (startSpiritIndex < 0) {
    throw new Error(`Start spirit not found in sequence: ${startSpirit}`);
  }
  const spiritsByLine = Array.from({ length: 6 }, (_, idx) => {
    const spirit = sixSpiritsTable.sequence[(startSpiritIndex + idx) % sixSpiritsTable.sequence.length];
    return required(spirit, `Six spirit sequence missing at idx=${idx}`);
  });

  pushTrace(trace, "six-spirits", "六神排布", "按日干起六神，自下而上顺排", {
    sixSpiritsRule: resolvedRuleSet.sixSpiritsRule,
    dayStem,
    startSpirit,
    sequence: spiritsByLine,
  });

  const lines: LiuyaoChartLine[] = baseLines.map((line, idx) => {
    const changedYinYang = changedLineStates[idx]!.yinYang;
    const baseInfo = buildNajiaInfo(
      line.lineIndex,
      line.yinYang,
      line.moving,
      baseHexagram,
      spiritsByLine,
      voidSet,
      najiaTable,
      false,
    );
    const changedInfo = buildNajiaInfo(
      line.lineIndex,
      changedYinYang,
      line.moving,
      changedHexagram,
      spiritsByLine,
      voidSet,
      najiaTable,
      true,
    );
    return {
      line,
      changedYinYang,
      base: baseInfo,
      changed: changedInfo,
      coinThrow: castRows[idx]!.coinThrow,
      coinSum: castRows[idx]!.coinSum,
      castLabel: castRows[idx]!.castLabel,
    };
  });

  pushTrace(trace, "najia", "纳甲映射", "按（卦位=内/外卦 + 爻位）查地支并推导五行", {
    najiaTableId: resolvedRuleSet.najiaTableId,
    lines: lines.map((item) => ({
      lineIndex: item.line.lineIndex,
      base: {
        branch: item.base.branch,
        element: item.base.element,
        markers: item.base.markers,
      },
      changed: {
        branch: item.changed.branch,
        element: item.changed.element,
        markers: item.changed.markers,
      },
    })),
  });

  pushTrace(trace, "liuqin", "六亲推导", "以卦宫五行为“我”，对每爻五行计算六亲关系", {
    basePalace: baseHexagram.palace,
    basePalaceElement: PALACE_ELEMENT[baseHexagram.palace],
    changedPalace: changedHexagram.palace,
    changedPalaceElement: PALACE_ELEMENT[changedHexagram.palace],
    lines: lines.map((item) => ({
      lineIndex: item.line.lineIndex,
      base: {
        branch: item.base.branch,
        element: item.base.element,
        relative: item.base.relative,
      },
      changed: {
        branch: item.changed.branch,
        element: item.changed.element,
        relative: item.changed.relative,
      },
    })),
  });

  return {
    input: {
      datetime: input.datetime,
      timeIndex: input.timeIndex,
    },
    baseHexagram,
    changedHexagram,
    lines,
    lunarInfo: {
      solar: {
        year: parsed.year,
        month: parsed.month,
        day: parsed.day,
      },
      lunar,
      ganzhi,
      monthBuild,
      dayChen,
      timezone: resolvedRuleSet.timezone ?? DEFAULT_TIMEZONE_FALLBACK,
      dstHint,
    },
    xunkong: {
      dayStemBranch: ganzhi.day,
      xun,
      voidBranches,
    },
    rulesApplied: {
      ziHourRollover: resolvedRuleSet.ziHourRollover,
      castingMethod: resolvedRuleSet.castingMethod,
      najiaTableId: resolvedRuleSet.najiaTableId,
      shiYingTableId: resolvedRuleSet.shiYingTableId,
      sixSpiritsRule: resolvedRuleSet.sixSpiritsRule,
      xunkongRule: resolvedRuleSet.xunkongRule,
      timezone: resolvedRuleSet.timezone ?? DEFAULT_TIMEZONE_FALLBACK,
    },
    trace,
  };
}

/**
 * 注册可替换 64卦（含世应）查表。
 */
export const registerLiuyaoHexagrams64Table = registerHexTable;

/**
 * 注册可替换纳甲表。
 */
export const registerLiuyaoNajiaTable = registerNajia;

/**
 * 注册可替换旬空表。
 */
export const registerLiuyaoXunkongTable = registerXunkong;

/**
 * 注册可替换六神起例表。
 */
export const registerLiuyaoSixSpiritsTable = registerSixSpirits;

export {
  DEFAULT_HEXAGRAMS64_TABLE,
  DEFAULT_NAJIA_TABLE,
  DEFAULT_SIX_SPIRITS_TABLE,
  DEFAULT_XUNKONG_TABLE,
  getHexagrams64Table as getLiuyaoHexagrams64Table,
  getNajiaTable as getLiuyaoNajiaTable,
  getSixSpiritsTable as getLiuyaoSixSpiritsTable,
  getXunkongTable as getLiuyaoXunkongTable,
};
