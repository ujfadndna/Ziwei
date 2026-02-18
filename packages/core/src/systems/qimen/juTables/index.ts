import { required } from "../../../calendar/utils";
import type { QimenJuTableDefinition } from "../../../types";
import { DEFAULT_72_JU_TABLE } from "./default_72";

const juTableRegistry = new Map<string, QimenJuTableDefinition>([[DEFAULT_72_JU_TABLE.id, DEFAULT_72_JU_TABLE]]);

/**
 * 注册或覆盖 72 局查表定义。
 */
export function registerQimenJuTable(table: QimenJuTableDefinition): void {
  juTableRegistry.set(table.id, table);
}

/**
 * 读取指定 id 的局数查表定义。
 */
export function getQimenJuTable(id: string): QimenJuTableDefinition {
  return required(juTableRegistry.get(id), `Qimen ju-table not found: ${id}`);
}

/**
 * 列出当前已注册的全部局数查表。
 */
export function listQimenJuTables(): QimenJuTableDefinition[] {
  return [...juTableRegistry.values()];
}

export { DEFAULT_72_JU_TABLE } from "./default_72";
