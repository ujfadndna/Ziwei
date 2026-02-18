/**
 * 杂曜/副曜安星（通行版 + 中州派差异项）。
 *
 * 说明：
 * - 这里集中实现「主星之外常见星曜」的落宫算法，便于与主/辅星分层维护。
 * - 绝大多数算法来自传统口诀与业界常见实现（与文墨/iztro系口径一致）。
 */

import type { EarthlyBranch, Gender, HeavenlyStem } from "../../types/base";
import type { MinorStarName } from "../../types/star";
import { assertIntInRange, getBranchIndex, getStemIndex, mod, required } from "../../calendar/utils";
import {
  getLeftAssistantPosition,
  getRightAssistantPosition,
  getWenchangPositionByTimeBranch,
  getWenquPositionByTimeBranch,
} from "./liu-ji";

export interface AdjectiveStarInput {
  yearStem: HeavenlyStem;
  yearBranch: EarthlyBranch;
  lunarMonth: number;
  lunarDay: number;
  timeBranch: EarthlyBranch;
  soulBranch: EarthlyBranch;
  bodyBranch: EarthlyBranch;
  gender: Gender;
  ruleSetId?: string;
}

function branchIndex(branch: EarthlyBranch): number {
  return getBranchIndex(branch);
}

function branchAt<const T extends readonly EarthlyBranch[]>(
  items: T,
  index: number,
  label: string
): EarthlyBranch {
  return required(items[index], `${label} branch not found at index=${index}`);
}

function isIn(branch: EarthlyBranch, group: readonly EarthlyBranch[]): boolean {
  return group.includes(branch);
}

/**
 * 计算杂曜/副曜落宫位置。
 */
export function getAdjectiveStarPositions(input: AdjectiveStarInput): Partial<Record<MinorStarName, number>> {
  const { yearStem, yearBranch, lunarMonth, lunarDay, timeBranch, soulBranch, bodyBranch, gender, ruleSetId } = input;

  assertIntInRange(lunarMonth, 1, 12, "lunarMonth");
  assertIntInRange(lunarDay, 1, 30, "lunarDay");

  const yearStemIndex = getStemIndex(yearStem);
  const yearBranchIndex = branchIndex(yearBranch);
  const timeIndex = branchIndex(timeBranch);
  const soulIndex = branchIndex(soulBranch);
  const bodyIndex = branchIndex(bodyBranch);
  const monthIndex = lunarMonth - 1;
  const dayIndex = lunarDay - 1;

  // 日系星（依左辅/右弼/文昌/文曲与生日安三台八座恩光天贵）
  const zuoIndex = getLeftAssistantPosition(lunarMonth);
  const youIndex = getRightAssistantPosition(lunarMonth);
  const changIndex = getWenchangPositionByTimeBranch(timeBranch);
  const quIndex = getWenquPositionByTimeBranch(timeBranch);

  // 红鸾天喜
  const hongluanIndex = mod(branchIndex("卯") - yearBranchIndex, 12);
  const tianxiIndex = mod(hongluanIndex + 6, 12);

  // 华盖咸池
  let huagaiIndex = 0;
  let xianchiIndex = 0;
  if (isIn(yearBranch, ["寅", "午", "戌"])) {
    huagaiIndex = branchIndex("戌");
    xianchiIndex = branchIndex("卯");
  } else if (isIn(yearBranch, ["申", "子", "辰"])) {
    huagaiIndex = branchIndex("辰");
    xianchiIndex = branchIndex("酉");
  } else if (isIn(yearBranch, ["巳", "酉", "丑"])) {
    huagaiIndex = branchIndex("丑");
    xianchiIndex = branchIndex("午");
  } else {
    huagaiIndex = branchIndex("未");
    xianchiIndex = branchIndex("子");
  }

  // 孤辰寡宿
  let guchenIndex = 0;
  let guasuIndex = 0;
  if (isIn(yearBranch, ["寅", "卯", "辰"])) {
    guchenIndex = branchIndex("巳");
    guasuIndex = branchIndex("丑");
  } else if (isIn(yearBranch, ["巳", "午", "未"])) {
    guchenIndex = branchIndex("申");
    guasuIndex = branchIndex("辰");
  } else if (isIn(yearBranch, ["申", "酉", "戌"])) {
    guchenIndex = branchIndex("亥");
    guasuIndex = branchIndex("未");
  } else {
    guchenIndex = branchIndex("寅");
    guasuIndex = branchIndex("戌");
  }

  // 月系星
  const yuejieIndex = branchIndex(
    branchAt(["申", "戌", "子", "寅", "辰", "午"], Math.floor(monthIndex / 2), "月解")
  );
  const tianyaoIndex = mod(branchIndex("丑") + monthIndex, 12);
  const tianxingIndex = mod(branchIndex("酉") + monthIndex, 12);
  const yinshaIndex = branchIndex(branchAt(["寅", "子", "戌", "申", "午", "辰"], monthIndex % 6, "阴煞"));
  const tianyueIndex = branchIndex(
    branchAt(["戌", "巳", "辰", "寅", "未", "卯", "亥", "未", "寅", "午", "戌", "寅"], monthIndex, "天月")
  );
  const tianwuIndex = branchIndex(branchAt(["巳", "申", "寅", "亥"], monthIndex % 4, "天巫"));

  // 日系星
  const santaiIndex = mod(zuoIndex + dayIndex, 12);
  const bazuoIndex = mod(youIndex - dayIndex, 12);
  const enguangIndex = mod(changIndex + dayIndex - 1, 12);
  const tianguiIndex = mod(quIndex + dayIndex - 1, 12);

  // 时系星
  const taifuIndex = mod(branchIndex("午") + timeIndex, 12);
  const fenggaoIndex = mod(branchIndex("寅") + timeIndex, 12);

  // 年系星
  const tiancaiIndex = mod(soulIndex + yearBranchIndex, 12);
  const tianshouIndex = mod(bodyIndex + yearBranchIndex, 12);
  const tianchuIndex = branchIndex(
    branchAt(["巳", "午", "子", "巳", "午", "申", "寅", "午", "酉", "亥"], yearStemIndex, "天厨")
  );
  const posuiIndex = branchIndex(branchAt(["巳", "丑", "酉"], yearBranchIndex % 3, "破碎"));
  const feilianIndex = branchIndex(
    branchAt(["申", "酉", "戌", "巳", "午", "未", "寅", "卯", "辰", "亥", "子", "丑"], yearBranchIndex, "蜚廉")
  );
  const longchiIndex = mod(branchIndex("辰") + yearBranchIndex, 12);
  const fenggeIndex = mod(branchIndex("戌") - yearBranchIndex, 12);
  const tiankuIndex = mod(branchIndex("午") - yearBranchIndex, 12);
  const tianxuIndex = mod(branchIndex("午") + yearBranchIndex, 12);
  const tianguanIndex = branchIndex(
    branchAt(["未", "辰", "巳", "寅", "卯", "酉", "亥", "酉", "戌", "午"], yearStemIndex, "天官")
  );
  const tianfuIndex = branchIndex(
    branchAt(["酉", "申", "子", "亥", "卯", "寅", "午", "巳", "午", "巳"], yearStemIndex, "天福")
  );
  const tiandeIndex = mod(branchIndex("酉") + yearBranchIndex, 12);
  const yuedeIndex = mod(branchIndex("巳") + yearBranchIndex, 12);
  const tiankongIndex = mod(yearBranchIndex + 1, 12);
  const jieluIndex = branchIndex(branchAt(["申", "午", "辰", "寅", "子"], yearStemIndex % 5, "截路"));
  const kongwangIndex = branchIndex(branchAt(["酉", "未", "巳", "卯", "丑"], yearStemIndex % 5, "空亡"));

  let xunkongIndex = mod(yearBranchIndex + (getStemIndex("癸") - yearStemIndex) + 1, 12);
  if ((yearBranchIndex % 2) !== (xunkongIndex % 2)) {
    xunkongIndex = mod(xunkongIndex + 1, 12);
  }
  const jiekongIndex = (yearBranchIndex % 2) === 0 ? jieluIndex : kongwangIndex;

  const jieshaIndex = (() => {
    if (isIn(yearBranch, ["申", "子", "辰"])) return branchIndex("巳");
    if (isIn(yearBranch, ["亥", "卯", "未"])) return branchIndex("申");
    if (isIn(yearBranch, ["寅", "午", "戌"])) return branchIndex("亥");
    return branchIndex("寅");
  })();
  const nianjieIndex = branchIndex(
    branchAt(["戌", "酉", "申", "未", "午", "巳", "辰", "卯", "寅", "丑", "子", "亥"], yearBranchIndex, "年解")
  );
  const dahaoIndex = branchIndex(
    branchAt(["未", "午", "酉", "申", "亥", "戌", "丑", "子", "卯", "寅", "巳", "辰"], yearBranchIndex, "大耗")
  );

  // 天使/天伤：默认天伤在奴仆，天使在疾厄。中州派在阴阳不同时互换。
  const genderIndex = gender === "男" ? 0 : 1;
  const sameYinYang = (yearBranchIndex % 2) === genderIndex;
  let tianshangIndex = mod(soulIndex + 5, 12);
  let tianshiIndex = mod(soulIndex + 7, 12);
  if (ruleSetId === "zhongzhou" && !sameYinYang) {
    [tianshangIndex, tianshiIndex] = [tianshiIndex, tianshangIndex];
  }

  const positions: Partial<Record<MinorStarName, number>> = {
    红鸾: hongluanIndex,
    天喜: tianxiIndex,
    天姚: tianyaoIndex,
    咸池: xianchiIndex,
    解神: yuejieIndex,
    三台: santaiIndex,
    八座: bazuoIndex,
    恩光: enguangIndex,
    天贵: tianguiIndex,
    龙池: longchiIndex,
    凤阁: fenggeIndex,
    天才: tiancaiIndex,
    天寿: tianshouIndex,
    台辅: taifuIndex,
    封诰: fenggaoIndex,
    天巫: tianwuIndex,
    华盖: huagaiIndex,
    天官: tianguanIndex,
    天福: tianfuIndex,
    天厨: tianchuIndex,
    天月: tianyueIndex,
    天德: tiandeIndex,
    月德: yuedeIndex,
    天空: tiankongIndex,
    旬空: xunkongIndex,
    孤辰: guchenIndex,
    寡宿: guasuIndex,
    蜚廉: feilianIndex,
    破碎: posuiIndex,
    天刑: tianxingIndex,
    阴煞: yinshaIndex,
    天哭: tiankuIndex,
    天虚: tianxuIndex,
    天使: tianshiIndex,
    天伤: tianshangIndex,
    年解: nianjieIndex,
  };

  if (ruleSetId === "zhongzhou") {
    positions.龙德 = mod(yearBranchIndex + 7, 12);
    positions.截空 = jiekongIndex;
    positions.劫煞 = jieshaIndex;
    positions.大耗 = dahaoIndex;
  } else {
    positions.截路 = jieluIndex;
    positions.空亡 = kongwangIndex;
  }

  return positions;
}

