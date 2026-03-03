import { required } from "../../../calendar/utils";
import type { EarthlyBranch, FiveElement, HeavenlyStem, SixSpirit } from "../../../types";

import hexagrams64Raw from "./hexagrams64.json";
import najiaTableRaw from "./najia_table.json";
import sixSpiritsTableRaw from "./six_spirits_table.json";
import xunkongTableRaw from "./xunkong_table.json";

type TrigramName = "乾" | "兑" | "离" | "震" | "巽" | "坎" | "艮" | "坤";

export interface Hexagrams64Entry {
  code: string;
  id: number;
  name: string;
  upperTrigram: TrigramName;
  lowerTrigram: TrigramName;
  palace: TrigramName;
  shiLine: 1 | 2 | 3 | 4 | 5 | 6;
  yingLine: 1 | 2 | 3 | 4 | 5 | 6;
}

export interface Hexagrams64Table {
  id: string;
  version: string;
  codeOrder: "bottom_to_top";
  description: string;
  entries: Hexagrams64Entry[];
}

export interface NajiaTable {
  id: string;
  version: string;
  description: string;
  entries: Record<
    TrigramName,
    {
      lower: [EarthlyBranch, EarthlyBranch, EarthlyBranch];
      upper: [EarthlyBranch, EarthlyBranch, EarthlyBranch];
    }
  >;
  branchElements: Record<EarthlyBranch, FiveElement>;
}

export interface XunkongTable {
  id: string;
  version: string;
  description: string;
  entries: Record<
    "甲子" | "甲戌" | "甲申" | "甲午" | "甲辰" | "甲寅",
    {
      void: [EarthlyBranch, EarthlyBranch];
    }
  >;
}

export interface SixSpiritsTable {
  id: string;
  version: string;
  description: string;
  sequence: [SixSpirit, SixSpirit, SixSpirit, SixSpirit, SixSpirit, SixSpirit];
  starts: Record<HeavenlyStem, SixSpirit>;
}

const DEFAULT_HEXAGRAMS64_TABLE = hexagrams64Raw as unknown as Hexagrams64Table;
const DEFAULT_NAJIA_TABLE = najiaTableRaw as unknown as NajiaTable;
const DEFAULT_XUNKONG_TABLE = xunkongTableRaw as unknown as XunkongTable;
const DEFAULT_SIX_SPIRITS_TABLE = sixSpiritsTableRaw as unknown as SixSpiritsTable;

const hexagrams64Registry = new Map<string, Hexagrams64Table>([[DEFAULT_HEXAGRAMS64_TABLE.id, DEFAULT_HEXAGRAMS64_TABLE]]);
const najiaRegistry = new Map<string, NajiaTable>([[DEFAULT_NAJIA_TABLE.id, DEFAULT_NAJIA_TABLE]]);
const xunkongRegistry = new Map<string, XunkongTable>([[DEFAULT_XUNKONG_TABLE.id, DEFAULT_XUNKONG_TABLE]]);
const sixSpiritsRegistry = new Map<string, SixSpiritsTable>([[DEFAULT_SIX_SPIRITS_TABLE.id, DEFAULT_SIX_SPIRITS_TABLE]]);

export function registerHexagrams64Table(table: Hexagrams64Table): void {
  hexagrams64Registry.set(table.id, table);
}

export function getHexagrams64Table(id: string): Hexagrams64Table {
  return required(hexagrams64Registry.get(id), `Liuyao hexagrams64 table not found: ${id}`);
}

export function registerNajiaTable(table: NajiaTable): void {
  najiaRegistry.set(table.id, table);
}

export function getNajiaTable(id: string): NajiaTable {
  return required(najiaRegistry.get(id), `Liuyao najia table not found: ${id}`);
}

export function registerXunkongTable(table: XunkongTable): void {
  xunkongRegistry.set(table.id, table);
}

export function getXunkongTable(id: string): XunkongTable {
  return required(xunkongRegistry.get(id), `Liuyao xunkong table not found: ${id}`);
}

export function registerSixSpiritsTable(table: SixSpiritsTable): void {
  sixSpiritsRegistry.set(table.id, table);
}

export function getSixSpiritsTable(id: string): SixSpiritsTable {
  return required(sixSpiritsRegistry.get(id), `Liuyao six-spirits table not found: ${id}`);
}

export {
  DEFAULT_HEXAGRAMS64_TABLE,
  DEFAULT_NAJIA_TABLE,
  DEFAULT_SIX_SPIRITS_TABLE,
  DEFAULT_XUNKONG_TABLE,
};
