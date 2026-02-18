import type { EarthlyBranch, FiveElement, HeavenlyStem, StemBranch, StemBranchParts } from "../types/base";
import { 六十甲子, 地支, 天干 } from "../types/base";

/**
 * 正模（避免 JS `%` 对负数的行为影响）。
 */
export function mod(value: number, modulo: number): number {
  if (!Number.isFinite(value) || !Number.isFinite(modulo)) {
    throw new Error(`mod(value, modulo) expects finite numbers, got value=${value}, modulo=${modulo}`);
  }
  if (!Number.isInteger(modulo) || modulo <= 0) {
    throw new Error(`modulo must be a positive integer, got ${modulo}`);
  }
  const r = value % modulo;
  return r < 0 ? r + modulo : r;
}

export function assertIntInRange(value: number, min: number, max: number, name: string): void {
  if (!Number.isInteger(value)) {
    throw new Error(`${name} must be an integer, got ${value}`);
  }
  if (value < min || value > max) {
    throw new Error(`${name} must be in range [${min}, ${max}], got ${value}`);
  }
}

export function required<T>(value: T | undefined, message: string): T {
  if (value === undefined) {
    throw new Error(message);
  }
  return value;
}

export function getStemIndex(stem: HeavenlyStem): number {
  const index = 天干.indexOf(stem);
  if (index < 0) {
    // 兜底：类型层已约束 HeavenlyStem，此处仅为运行时防御。
    throw new Error(`Unknown HeavenlyStem: ${stem}`);
  }
  return index;
}

export function getBranchIndex(branch: EarthlyBranch): number {
  const index = 地支.indexOf(branch);
  if (index < 0) {
    throw new Error(`Unknown EarthlyBranch: ${branch}`);
  }
  return index;
}

/**
 * 由六十甲子索引（0-59）得到干支。
 */
export function stemBranchFromIndex(index: number): StemBranch {
  assertIntInRange(index, 0, 59, "index");
  return required(六十甲子[index], `StemBranch index out of range: ${index}`);
}

/**
 * 由干支得到其在六十甲子中的索引（0-59）。
 */
export function stemBranchToIndex(stemBranch: StemBranch): number {
  const index = 六十甲子.indexOf(stemBranch);
  if (index < 0) {
    // 兜底：StemBranch 类型来自六十甲子常量。
    throw new Error(`StemBranch not found in 六十甲子: ${stemBranch}`);
  }
  return index;
}

/**
 * 将干支拆分为（天干/地支）。
 */
export function splitStemBranch(stemBranch: StemBranch): StemBranchParts {
  const stem = stemBranch.slice(0, 1) as HeavenlyStem;
  const branch = stemBranch.slice(1, 2) as EarthlyBranch;
  // 运行时再校验一次，避免 slice 在异常字符串下产生隐蔽错误。
  getStemIndex(stem);
  getBranchIndex(branch);
  return { stem, branch };
}

/**
 * 由（天干/地支）组合为干支，并确保该组合在六十甲子内。
 */
export function stemBranchFromParts(stem: HeavenlyStem, branch: EarthlyBranch): StemBranch {
  const value = `${stem}${branch}`;
  // 通过查表保证一定是六十甲子中的项。
  const index = 六十甲子.indexOf(value as StemBranch);
  if (index < 0) {
    throw new Error(`Invalid StemBranch combination: ${value}`);
  }
  return required(六十甲子[index], `Invalid StemBranch combination: ${value}`);
}

/**
 * 纳音（五行纳音）：60 甲子每两位对应一个纳音。
 *
 * 约定：
 * - `name` 为纳音名（例如：海中金）
 * - `element` 为其五行归属（木/火/土/金/水）
 */
export interface NaYin {
  name: string;
  element: FiveElement;
}

const NAYIN_PAIRS: ReadonlyArray<NaYin> = [
  { name: "海中金", element: "金" },
  { name: "炉中火", element: "火" },
  { name: "大林木", element: "木" },
  { name: "路旁土", element: "土" },
  { name: "剑锋金", element: "金" },
  { name: "山头火", element: "火" },
  { name: "涧下水", element: "水" },
  { name: "城头土", element: "土" },
  { name: "白蜡金", element: "金" },
  { name: "杨柳木", element: "木" },
  { name: "泉中水", element: "水" },
  { name: "屋上土", element: "土" },
  { name: "霹雳火", element: "火" },
  { name: "松柏木", element: "木" },
  { name: "长流水", element: "水" },
  { name: "沙中金", element: "金" },
  { name: "山下火", element: "火" },
  { name: "平地木", element: "木" },
  { name: "壁上土", element: "土" },
  { name: "金箔金", element: "金" },
  { name: "佛灯火", element: "火" },
  { name: "天河水", element: "水" },
  { name: "大驿土", element: "土" },
  { name: "钗钏金", element: "金" },
  { name: "桑柘木", element: "木" },
  { name: "大溪水", element: "水" },
  { name: "沙中土", element: "土" },
  { name: "天上火", element: "火" },
  { name: "石榴木", element: "木" },
  { name: "大海水", element: "水" },
];

/**
 * 根据干支获取纳音。
 */
export function getNaYin(stemBranch: StemBranch): NaYin {
  const index = stemBranchToIndex(stemBranch);
  const pairIndex = Math.floor(index / 2);
  return required(NAYIN_PAIRS[pairIndex], `NaYin pair not found for StemBranch: ${stemBranch}`);
}

