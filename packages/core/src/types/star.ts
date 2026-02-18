import type { HeavenlyStem, StemBranch } from "./base";

/**
 * 星曜相关类型定义（星曜类别、亮度、四化等）。
 */

/**
 * 星曜类别（主星/辅星/杂曜等）。
 *
 * 说明：这里用英文值便于在代码中作为判别字段使用。
 */
export const 星曜类型 = ["major", "minor", "adjective"] as const;

/**
 * Star Type（星曜类别）。
 */
export type StarType = (typeof 星曜类型)[number];

/**
 * 亮度（庙旺得利平不陷）。
 */
export const 亮度 = ["庙", "旺", "得", "利", "平", "不", "陷"] as const;

/**
 * Brightness（星曜亮度）。
 */
export type Brightness = (typeof 亮度)[number];

/**
 * 四化类型（禄/权/科/忌）。
 */
export const 四化类型 = ["化禄", "化权", "化科", "化忌"] as const;

/**
 * Mutagen Type（四化类型）。
 */
export type MutagenType = (typeof 四化类型)[number];

/**
 * 四化来源（年干/宫干/运限等）。
 *
 * 说明：不同派别对四化来源的处理会有差异，因此这里保持“来源标签”抽象层级。
 */
export const 四化来源 = ["年干", "宫干", "大限", "流年", "流月", "流日", "自化", "飞化", "派生"] as const;

/**
 * Mutagen Source（四化来源）。
 */
export type MutagenSource = (typeof 四化来源)[number];

/**
 * 四化信息（类型 + 来源 + 可选的干支依据）。
 */
export interface Mutagen {
  /** 四化类型（化禄/化权/化科/化忌） */
  type: MutagenType;
  /** 四化来源（年干/宫干/运限等） */
  source: MutagenSource;
  /** 触发四化的天干（如果可追溯） */
  stem?: HeavenlyStem;
  /** 触发四化的干支（如果可追溯） */
  stemBranch?: StemBranch;
  /** 备注（可选） */
  note?: string;
}

/**
 * 主星名称（十四主星）。
 */
export const 主星名称 = [
  "紫微",
  "天机",
  "太阳",
  "武曲",
  "天同",
  "廉贞",
  "天府",
  "太阴",
  "贪狼",
  "巨门",
  "天相",
  "天梁",
  "七杀",
  "破军",
] as const;

/**
 * Major Star Name（十四主星名称）。
 */
export type MajorStarName = (typeof 主星名称)[number];

/**
 * 辅星/杂曜名称（常用集合）。
 *
 * 说明：
 * - 紫微斗数星曜体系在不同派别/软件中会有扩展差异
 * - 这里优先覆盖常见且高频的辅星/煞曜/桃花曜/杂曜
 */
export const 辅星名称 = [
  "左辅",
  "右弼",
  "文昌",
  "文曲",
  "天魁",
  "天钺",
  "禄存",
  "擎羊",
  "陀罗",
  "火星",
  "铃星",
  "地空",
  "地劫",
  "天马",
  "天姚",
  "红鸾",
  "天喜",
  "咸池",
  "天刑",
  "天月",
  "天巫",
  "天福",
  "天官",
  "天贵",
  "龙池",
  "凤阁",
  "天厨",
  "天伤",
  "天使",
  "解神",
  "阴煞",
  "天虚",
  "天哭",
  "天寿",
  "天才",
  "孤辰",
  "寡宿",
  "破碎",
  "蜚廉",
  "华盖",
  "台辅",
  "封诰",
  "三台",
  "八座",
  "恩光",
  "天德",
  "月德",
  "天德合",
  "月德合",
  "天恩",
  "天寡",
  "天煞",
  "劫煞",
  "灾煞",
  "天火",
  "天乙",
  "天牢",
  "天威",
  "天贵人",
  "天孙",
  "大耗",
  "小耗",
  "岁建",
  "晦气",
  "丧门",
  "贯索",
  "官符",
  "小耗星",
  "大耗星",
  "白虎",
  "吊客",
  "病符",
  "伏兵",
  "将军",
  "奏书",
  "飞廉",
  "喜神",
  "华盖星",
  "龙德",
  "攀鞍",
  "岁驿",
  "息神",
  "劫煞星",
  "灾煞星",
  "天煞星",
  "指背",
  "咸池星",
  "月煞",
  "亡神",
  "年解",
  "旬空",
  "截路",
  "空亡",
  "截空",
  "天空",
  "天哭星",
  "天虚星",
  "天月星",
  "天官星",
  "天福星",
  "天德星",
  "月德星",
] as const;

/**
 * Minor Star Name（辅星/杂曜名称）。
 */
export type MinorStarName = (typeof 辅星名称)[number];

/**
 * 星曜名称（主星 + 辅星/杂曜）。
 */
export type StarName = MajorStarName | MinorStarName;

/**
 * 星曜定义。
 */
export interface Star {
  /** 星曜名称 */
  name: StarName;
  /** 星曜类别 */
  type: StarType;
  /** 亮度（可选；不同星曜/派别可能不使用） */
  brightness?: Brightness;
  /** 四化（可选；星曜可能被化禄/权/科/忌） */
  mutagen?: Mutagen;
  /** 标签（可选；用于规则引擎/解释层扩展） */
  tags?: readonly string[];
  /** 备注（可选） */
  note?: string;
}
