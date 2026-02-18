import type { BirthInfo } from "@ziwei/core";

import type { CaseLibraryExportV1, SavedCase } from "../types/case";

export const CASE_LIBRARY_STORAGE_KEY = "ziwei:web:case-library:v1";
export const CASE_LIBRARY_FORMAT = "ziwei-case-library";
export const CASE_LIBRARY_VERSION = 1;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function toIsoOrNow(value: unknown): string {
  if (typeof value !== "string") return new Date().toISOString();
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return new Date().toISOString();
  return date.toISOString();
}

function normalizeBirthInfo(value: unknown): BirthInfo | null {
  if (!isRecord(value)) return null;

  const gender = value.gender;
  const datetime = value.datetime;
  const timeIndexRaw = value.timeIndex;

  if ((gender !== "男" && gender !== "女") || typeof datetime !== "string") return null;
  if (typeof timeIndexRaw !== "number" || !Number.isInteger(timeIndexRaw) || timeIndexRaw < 0 || timeIndexRaw > 12) {
    return null;
  }

  const birth: BirthInfo = {
    gender,
    datetime,
    timeIndex: timeIndexRaw as BirthInfo["timeIndex"],
  };

  if (isRecord(value.location)) {
    const location = value.location;
    const nextLocation: NonNullable<BirthInfo["location"]> = {};
    if (typeof location.name === "string") nextLocation.name = location.name;
    if (typeof location.latitude === "number") nextLocation.latitude = location.latitude;
    if (typeof location.longitude === "number") nextLocation.longitude = location.longitude;
    if (typeof location.timeZone === "string") nextLocation.timeZone = location.timeZone;
    if (Object.keys(nextLocation).length > 0) birth.location = nextLocation;
  }

  if (typeof value.note === "string") {
    birth.note = value.note;
  }

  return birth;
}

function normalizeSavedCase(value: unknown): SavedCase | null {
  if (!isRecord(value)) return null;

  const birth = normalizeBirthInfo(value.birth);
  if (!birth) return null;

  const id = typeof value.id === "string" && value.id.trim() ? value.id.trim() : generateCaseId();
  const name = typeof value.name === "string" && value.name.trim() ? value.name.trim() : "未命名命例";
  const createdAt = toIsoOrNow(value.createdAt);
  const updatedAt = toIsoOrNow(value.updatedAt);

  return {
    id,
    name,
    birth,
    createdAt,
    updatedAt,
  };
}

export function normalizeSavedCases(value: unknown): SavedCase[] {
  if (!Array.isArray(value)) return [];
  const deduped = new Map<string, SavedCase>();

  for (const item of value) {
    const normalized = normalizeSavedCase(item);
    if (!normalized) continue;
    deduped.set(normalized.id, normalized);
  }

  return Array.from(deduped.values()).sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt));
}

export function generateCaseId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `case-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export function loadSavedCasesFromStorage(): SavedCase[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(CASE_LIBRARY_STORAGE_KEY);
    if (!raw) return [];
    return normalizeSavedCases(JSON.parse(raw));
  } catch {
    return [];
  }
}

export function persistSavedCasesToStorage(cases: SavedCase[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(CASE_LIBRARY_STORAGE_KEY, JSON.stringify(cases));
  } catch {
    // Ignore storage errors and keep app functional.
  }
}

export function buildCaseLibraryExport(cases: SavedCase[]): CaseLibraryExportV1 {
  return {
    format: CASE_LIBRARY_FORMAT,
    version: CASE_LIBRARY_VERSION,
    exportedAt: new Date().toISOString(),
    cases,
  };
}

export function parseCaseLibraryExport(value: unknown): SavedCase[] | null {
  if (!isRecord(value)) return null;
  if (value.format !== CASE_LIBRARY_FORMAT || value.version !== CASE_LIBRARY_VERSION) return null;
  return normalizeSavedCases(value.cases);
}
