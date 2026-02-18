/**
 * 命盘构建器模块。
 *
 * 整合所有模块完成完整排盘：
 * 1. 历法转换（公历->农历->干支）
 * 2. 命宫身宫计算
 * 3. 五行局计算
 * 4. 十二宫排列
 * 5. 主星安星（紫微系+天府系）
 * 6. 辅星安星（六吉+六煞）
 * 7. 亮度计算
 * 8. 四化标记
 * 9. 大限计算
 */

import type {
  BirthInfo,
  Chart,
  CycleConfig,
  DateInfo,
  EarthlyBranch,
  Gender,
  GanzhiDate,
  HeavenlyStem,
  LunarDate,
  ResolvedCycleConfig,
  SolarDate,
  TimeIndex,
  YinYang,
} from "../types";
import type { DerivationTrace } from "../types/derivation";
import type { Palace, PalaceIndex } from "../types/palace";
import type { MutagenTable } from "../types/ruleset";
import type { MajorStarName, Star, StarName } from "../types/star";

import { solarToLunar, getStemBranch, getYearStemBranch, splitStemBranch } from "../calendar";
import { getBranchIndex, mod } from "../calendar/utils";
import { createTracer, DerivationTracer } from "../derivation";
import {
  getSoulPalaceBranch,
  getBodyPalaceBranch,
  getFiveElementClass,
  arrangePalaces,
  getOriginPalaceIndex,
  getSoulStar,
  getBodyStar,
  type FiveElementClass,
} from "../palace";
import { getZiweiPosition, getZiweiSeriesPositions } from "../star/major/ziwei-series";
import {
  getTianfuPosition,
  getTianfuSeriesPositions,
  getAllMajorStarPositions,
} from "../star/major/tianfu-series";
import {
  getLeftAssistantPosition,
  getRightAssistantPosition,
  getWenchangPositionByTimeBranch,
  getWenquPositionByTimeBranch,
  getTiankuiPosition,
  getTianyuePosition,
} from "../star/minor/liu-ji";
import {
  getLucunPosition,
  getQingyangPosition,
  getTuoluoPosition,
  getFireStarPosition,
  getBellStarPosition,
  getDikongPosition,
  getDijiePosition,
  getTianmaPosition,
} from "../star/minor/liu-sha";
import { getAdjectiveStarPositions } from "../star/minor/adjective";
import { getBrightness } from "../star/brightness";
import { applyMutagens, DEFAULT_MUTAGEN_TABLE } from "../transform";
import { getDecadalPalaces, getStemYinYang, resolveCycleConfig, type DecadalInfo } from "../cycle";
import { 地支 } from "../types/base";

/**
 * 构建选项。
 */
export interface BuildOptions {
  /** 规则集ID，默认'default' */
  ruleSetId?: string;
  /** 是否启用推导追踪，默认true */
  enableTrace?: boolean;
  /** 自定义四化表 */
  mutagenTable?: MutagenTable;
  /** 运限口径覆盖（默认跟随 ruleSetId 预设） */
  cycleConfig?: CycleConfig;
}

/**
 * 构建结果。
 */
export interface ChartResult {
  /** 命盘 */
  chart: Chart;
  /** 推导追踪（如果启用） */
  trace?: DerivationTrace;
}

/**
 * 命盘构建器。
 */
export class ChartBuilder {
  private ruleSetId: string;
  private tracer: DerivationTracer | null;
  private mutagenTable: MutagenTable;
  private cycleConfig: ResolvedCycleConfig;

  constructor(options?: BuildOptions) {
    this.ruleSetId = options?.ruleSetId ?? "default";
    this.tracer = options?.enableTrace !== false ? createTracer() : null;
    this.mutagenTable = options?.mutagenTable ?? DEFAULT_MUTAGEN_TABLE;
    this.cycleConfig = resolveCycleConfig(this.ruleSetId, options?.cycleConfig);
  }

  /**
   * 主入口：构建命盘。
   */
  build(input: BirthInfo): ChartResult {
    this.tracer?.start(this.ruleSetId);

    // 1. 历法转换
    const dateInfo = this.convertCalendar(input);

    // 2. 计算命宫身宫
    const { soulBranch, bodyBranch } = this.calculateSoulBody(
      dateInfo.lunar.month,
      input.timeIndex
    );

    // 3. 计算五行局
    const yearStem = splitStemBranch(dateInfo.ganzhi.year).stem;
    const fiveElement = this.calculateFiveElement(soulBranch, yearStem);

    // 4. 排列十二宫
    const soulBranchIndex = getBranchIndex(soulBranch);
    let palaces = this.arrangePalaces(soulBranchIndex, yearStem);

    // 5. 安主星
    palaces = this.placeMajorStars(palaces, fiveElement.number, dateInfo.lunar.day);

    // 6. 安辅星
    const yearBranch = splitStemBranch(dateInfo.ganzhi.year).branch;
    const normalizedTimeIndex = mod(input.timeIndex, 12);
    const timeBranch = 地支[normalizedTimeIndex] as EarthlyBranch;
    palaces = this.placeMinorStars(
      palaces,
      yearStem,
      yearBranch,
      dateInfo.lunar.month,
      dateInfo.lunar.day,
      timeBranch,
      soulBranch,
      bodyBranch,
      input.gender
    );

    // 7. 计算亮度
    palaces = this.applyBrightness(palaces);

    // 8. 应用四化
    palaces = this.applyMutagensToChart(palaces, yearStem);

    // 9. 计算大限
    const yearStemYinYang = getStemYinYang(yearStem);
    const decadals = this.calculateDecadals(
      soulBranchIndex,
      input.gender,
      yearStem,
      fiveElement.number
    );

    // 计算命宫和身宫索引
    const mingPalaceIndex = palaces.findIndex((p) => p.name === "命宫") as PalaceIndex;
    const bodyPalaceIndex = palaces.findIndex(
      (p) => p.branch === bodyBranch
    ) as PalaceIndex;
    const originPalaceIndex = getOriginPalaceIndex(palaces, yearStem);

    // 记录命主星和身主星
    const soulStar = getSoulStar(soulBranch);
    const bodyStar = getBodyStar(yearBranch);

    this.tracer?.beginStep("summary", "命盘汇总", "汇总命盘基本信息");
    this.tracer?.recordOutput("命宫地支", soulBranch);
    this.tracer?.recordOutput("身宫地支", bodyBranch);
    this.tracer?.recordOutput("五行局", fiveElement.name);
    this.tracer?.recordOutput("命主星", soulStar);
    this.tracer?.recordOutput("身主星", bodyStar);
    this.tracer?.endStep();

    const trace = this.tracer?.finish();

    const chart: Chart = {
      birth: input,
      date: dateInfo,
      palaces,
      mingPalaceIndex,
      bodyPalaceIndex,
      originPalaceIndex: originPalaceIndex ?? undefined,
      cycleConfig: this.cycleConfig,
      horoscope: {
        decadals,
      },
      trace,
      ruleSetId: this.ruleSetId,
      meta: {
        fiveElement,
        soulStar,
        bodyStar,
        originPalace:
          originPalaceIndex == null
            ? null
            : {
                index: originPalaceIndex,
                name: palaces[originPalaceIndex]?.name ?? null,
                stem: palaces[originPalaceIndex]?.stem ?? null,
                branch: palaces[originPalaceIndex]?.branch ?? null,
              },
        cycleConfig: this.cycleConfig,
      },
    };

    return {
      chart,
      trace,
    };
  }

  /**
   * 历法转换：公历->农历->干支。
   */
  private convertCalendar(input: BirthInfo): DateInfo {
    this.tracer?.beginStep("calendar", "历法转换", "将公历转换为农历和干支");

    const datetime = new Date(input.datetime);
    const solarYear = datetime.getFullYear();
    const solarMonth = datetime.getMonth() + 1;
    const solarDay = datetime.getDate();
    const hour = datetime.getHours();

    this.tracer?.recordInput("公历", `${solarYear}-${solarMonth}-${solarDay}`);
    this.tracer?.recordInput("时辰索引", input.timeIndex);

    const solar: SolarDate = { year: solarYear, month: solarMonth, day: solarDay };
    const lunar = solarToLunar(solarYear, solarMonth, solarDay);
    const calculatedGanzhi = getStemBranch(solarYear, solarMonth, solarDay, hour);
    const yearStemBranch =
      this.cycleConfig.yearDivide === "lunar-year"
        ? getYearStemBranch(lunar.year)
        : calculatedGanzhi.year;
    const ganzhi: GanzhiDate = {
      ...calculatedGanzhi,
      year: yearStemBranch,
    };

    this.tracer?.recordOutput("农历", `${lunar.year}年${lunar.month}月${lunar.day}日${lunar.isLeap ? "(闰)" : ""}`);
    this.tracer?.recordOutput("年界口径", this.cycleConfig.yearDivide === "lunar-year" ? "春节" : "立春");
    this.tracer?.recordOutput("年柱", ganzhi.year);
    this.tracer?.recordOutput("月柱", ganzhi.month);
    this.tracer?.recordOutput("日柱", ganzhi.day);
    this.tracer?.recordOutput("时柱", ganzhi.time);
    this.tracer?.endStep();

    return { solar, lunar, ganzhi };
  }

  /**
   * 计算命宫身宫地支。
   */
  private calculateSoulBody(
    lunarMonth: number,
    timeIndex: TimeIndex
  ): { soulBranch: EarthlyBranch; bodyBranch: EarthlyBranch } {
    this.tracer?.beginStep("soul-body", "命宫身宫", "计算命宫和身宫地支");
    this.tracer?.recordInput("农历月", lunarMonth);
    this.tracer?.recordInput("时辰索引", timeIndex);
    this.tracer?.recordFormula("命宫：寅起正月顺数至生月，逆数生时");
    this.tracer?.recordFormula("身宫：寅起正月顺数至生月，顺数生时");

    const soulBranch = getSoulPalaceBranch(lunarMonth, timeIndex);
    const bodyBranch = getBodyPalaceBranch(lunarMonth, timeIndex);

    this.tracer?.recordOutput("命宫地支", soulBranch);
    this.tracer?.recordOutput("身宫地支", bodyBranch);
    this.tracer?.endStep();

    return { soulBranch, bodyBranch };
  }

  /**
   * 计算五行局。
   */
  private calculateFiveElement(
    soulBranch: EarthlyBranch,
    yearStem: HeavenlyStem
  ): FiveElementClass {
    this.tracer?.beginStep("five-element", "五行局", "根据命宫干支计算五行局");
    this.tracer?.recordInput("命宫地支", soulBranch);
    this.tracer?.recordInput("年干", yearStem);
    this.tracer?.recordFormula("命宫干支纳音五行决定五行局");

    const fiveElement = getFiveElementClass(soulBranch, yearStem);

    this.tracer?.recordOutput("五行局", fiveElement.name);
    this.tracer?.recordOutput("局数", fiveElement.number);
    this.tracer?.endStep();

    return fiveElement;
  }

  /**
   * 排列十二宫。
   */
  private arrangePalaces(soulBranchIndex: number, yearStem: HeavenlyStem): Palace[] {
    this.tracer?.beginStep("arrange", "排列十二宫", "从命宫起逆时针排列十二宫");
    this.tracer?.recordInput("命宫地支索引", soulBranchIndex);
    this.tracer?.recordInput("年干", yearStem);
    this.tracer?.recordFormula("命宫起，逆时针排列：命宫、兄弟、夫妻、子女、财帛、疾厄、迁移、仆役、官禄、田宅、福德、父母");

    const palaces = arrangePalaces(soulBranchIndex, yearStem);

    this.tracer?.recordOutput("十二宫", palaces.map((p) => `${p.name}(${p.branch})`).join("、"));
    this.tracer?.endStep();

    return palaces;
  }

  /**
   * 安主星（紫微系+天府系）。
   */
  private placeMajorStars(
    palaces: Palace[],
    fiveElementNumber: number,
    lunarDay: number
  ): Palace[] {
    this.tracer?.beginStep("major-stars", "安主星", "安紫微系和天府系十四主星");
    this.tracer?.recordInput("五行局数", fiveElementNumber);
    this.tracer?.recordInput("农历日", lunarDay);
    this.tracer?.recordFormula("紫微定位：根据五行局数和农历日查表");
    this.tracer?.recordFormula("天府定位：与紫微对称");

    const ziweiPos = getZiweiPosition(fiveElementNumber, lunarDay);
    const allPositions = getAllMajorStarPositions(ziweiPos);

    this.tracer?.recordOutput("紫微位置", 地支[ziweiPos]);
    this.tracer?.recordOutput("天府位置", 地支[getTianfuPosition(ziweiPos)]);

    // 将主星放入对应宫位
    const newPalaces = palaces.map((palace) => {
      const branchIndex = getBranchIndex(palace.branch!);
      const starsInPalace: Star[] = [...palace.stars];

      for (const [starName, pos] of Object.entries(allPositions)) {
        if (pos === branchIndex) {
          starsInPalace.push({
            name: starName as MajorStarName,
            type: "major",
          });
        }
      }

      return { ...palace, stars: starsInPalace };
    });

    this.tracer?.endStep();
    return newPalaces;
  }

  /**
   * 安辅星（六吉+六煞+禄存+天马）。
   */
  private placeMinorStars(
    palaces: Palace[],
    yearStem: HeavenlyStem,
    yearBranch: EarthlyBranch,
    lunarMonth: number,
    lunarDay: number,
    timeBranch: EarthlyBranch,
    soulBranch: EarthlyBranch,
    bodyBranch: EarthlyBranch,
    gender: Gender
  ): Palace[] {
    this.tracer?.beginStep("minor-stars", "安辅星", "安六吉星、六煞星及相关星曜");
    this.tracer?.recordInput("年干", yearStem);
    this.tracer?.recordInput("年支", yearBranch);
    this.tracer?.recordInput("农历月", lunarMonth);
    this.tracer?.recordInput("农历日", lunarDay);
    this.tracer?.recordInput("时支", timeBranch);

    // 计算各辅星位置
    const minorPositions: Record<string, number> = {
      左辅: getLeftAssistantPosition(lunarMonth),
      右弼: getRightAssistantPosition(lunarMonth),
      文昌: getWenchangPositionByTimeBranch(timeBranch),
      文曲: getWenquPositionByTimeBranch(timeBranch),
      天魁: getTiankuiPosition(yearStem),
      天钺: getTianyuePosition(yearStem),
      禄存: getLucunPosition(yearStem),
      擎羊: getQingyangPosition(yearStem),
      陀罗: getTuoluoPosition(yearStem),
      火星: getFireStarPosition(yearBranch, timeBranch),
      铃星: getBellStarPosition(yearBranch, timeBranch),
      地空: getDikongPosition(timeBranch),
      地劫: getDijiePosition(timeBranch),
      天马: getTianmaPosition(yearBranch),
    };
    const adjectivePositions = getAdjectiveStarPositions({
      yearStem,
      yearBranch,
      lunarMonth,
      lunarDay,
      timeBranch,
      soulBranch,
      bodyBranch,
      gender,
      ruleSetId: this.ruleSetId,
    });
    const allStarPositions = {
      ...minorPositions,
      ...adjectivePositions,
    };

    this.tracer?.recordOutput(
      "辅杂星位置",
      Object.entries(allStarPositions)
        .map(([name, pos]) => `${name}(${地支[pos]})`)
        .join("、")
    );

    // 将辅星放入对应宫位
    const newPalaces = palaces.map((palace) => {
      const branchIndex = getBranchIndex(palace.branch!);
      const starsInPalace: Star[] = [...palace.stars];

      for (const [starName, pos] of Object.entries(allStarPositions)) {
        if (pos === branchIndex) {
          starsInPalace.push({
            name: starName as StarName,
            type: starName in minorPositions ? "minor" : "adjective",
          });
        }
      }

      return { ...palace, stars: starsInPalace };
    });

    this.tracer?.endStep();
    return newPalaces;
  }

  /**
   * 计算星曜亮度。
   */
  private applyBrightness(palaces: Palace[]): Palace[] {
    this.tracer?.beginStep("brightness", "计算亮度", "根据星曜所在宫位计算亮度");

    const newPalaces = palaces.map((palace) => {
      const newStars = palace.stars.map((star) => {
        const brightness = getBrightness(star.name, palace.branch!);
        if (brightness) {
          return { ...star, brightness };
        }
        return star;
      });
      return { ...palace, stars: newStars };
    });

    this.tracer?.endStep();
    return newPalaces;
  }

  /**
   * 应用四化。
   */
  private applyMutagensToChart(palaces: Palace[], yearStem: HeavenlyStem): Palace[] {
    this.tracer?.beginStep("mutagens", "应用四化", "根据年干应用四化");
    this.tracer?.recordInput("年干", yearStem);

    const entry = this.mutagenTable[yearStem];
    this.tracer?.recordOutput("化禄", entry["化禄"]);
    this.tracer?.recordOutput("化权", entry["化权"]);
    this.tracer?.recordOutput("化科", entry["化科"]);
    this.tracer?.recordOutput("化忌", entry["化忌"]);

    const newPalaces = applyMutagens(palaces, yearStem, "年干", this.mutagenTable);

    this.tracer?.endStep();
    return newPalaces;
  }

  /**
   * 计算大限。
   */
  private calculateDecadals(
    soulPalaceBranchIndex: number,
    gender: Gender,
    yearStem: HeavenlyStem,
    fiveElementNumber: number
  ): DecadalInfo[] {
    this.tracer?.beginStep("decadals", "计算大限", "计算十二个大限");
    this.tracer?.recordInput("命宫地支索引", soulPalaceBranchIndex);
    this.tracer?.recordInput("性别", gender);
    this.tracer?.recordInput("年干", yearStem);
    this.tracer?.recordInput("五行局数", fiveElementNumber);
    this.tracer?.recordFormula("起运年龄 = 五行局数");
    this.tracer?.recordFormula("阳男阴女顺行，阴男阳女逆行");

    const decadals = getDecadalPalaces(
      soulPalaceBranchIndex,
      gender,
      yearStem,
      fiveElementNumber
    );

    this.tracer?.recordOutput("起运年龄", fiveElementNumber);
    this.tracer?.recordOutput("大限", decadals.map((d) => `${d.startAge}-${d.endAge}岁(${d.branch})`).join("、"));
    this.tracer?.endStep();

    return decadals;
  }
}

/**
 * 便捷函数：构建命盘。
 */
export function buildChart(input: BirthInfo, options?: BuildOptions): ChartResult {
  const builder = new ChartBuilder(options);
  return builder.build(input);
}
