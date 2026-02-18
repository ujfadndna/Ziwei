import type { BirthInfo } from "@ziwei/core";

export interface SavedCase {
  id: string;
  name: string;
  birth: BirthInfo;
  createdAt: string;
  updatedAt: string;
}

export interface CaseLibraryExportV1 {
  format: "ziwei-case-library";
  version: 1;
  exportedAt: string;
  cases: SavedCase[];
}
