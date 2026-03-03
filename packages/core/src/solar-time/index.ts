import type { TimeIndex } from "../types";

import { equationOfTime } from "./equation-of-time";

function pad2(value: number): string {
  return String(value).padStart(2, "0");
}

function formatLocalDatetime(date: Date): string {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}T${pad2(date.getHours())}:${pad2(date.getMinutes())}:${pad2(date.getSeconds())}`;
}

function isSameCalendarDate(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function timeIndexFromHour(hour: number): TimeIndex {
  if (hour === 23 || hour === 0) return 0;
  if (hour === 1 || hour === 2) return 1;
  if (hour === 3 || hour === 4) return 2;
  if (hour === 5 || hour === 6) return 3;
  if (hour === 7 || hour === 8) return 4;
  if (hour === 9 || hour === 10) return 5;
  if (hour === 11 || hour === 12) return 6;
  if (hour === 13 || hour === 14) return 7;
  if (hour === 15 || hour === 16) return 8;
  if (hour === 17 || hour === 18) return 9;
  if (hour === 19 || hour === 20) return 10;
  return 11;
}

function keepDateForZiHour(adjusted: Date, original: Date): void {
  if (adjusted.getHours() !== 23) return;
  if (isSameCalendarDate(adjusted, original)) return;
  adjusted.setFullYear(original.getFullYear(), original.getMonth(), original.getDate());
}

export interface TrueSolarTimeResult {
  adjustedDatetime: string;
  adjustedTimeIndex: TimeIndex;
  totalAdjustmentMinutes: number;
  timeIndexChanged: boolean;
  breakdown: {
    longitudeCorrectionMinutes: number;
    equationOfTimeMinutes: number;
    originalDatetime: string;
    originalTimeIndex: TimeIndex;
  };
}

export function calculateTrueSolarTime(datetime: string, timeIndex: TimeIndex, longitude: number): TrueSolarTimeResult {
  const originalDate = new Date(datetime);
  if (Number.isNaN(originalDate.getTime())) {
    throw new Error(`Invalid datetime: ${datetime}`);
  }
  if (!Number.isFinite(longitude)) {
    throw new Error(`Invalid longitude: ${longitude}`);
  }

  const year = originalDate.getFullYear();
  const month = originalDate.getMonth() + 1;
  const day = originalDate.getDate();

  const longitudeCorrectionMinutes = (longitude - 120) * 4;
  const equationOfTimeMinutes = equationOfTime(year, month, day);
  const totalAdjustmentMinutes = longitudeCorrectionMinutes + equationOfTimeMinutes;

  const adjustedDate = new Date(originalDate.getTime() + totalAdjustmentMinutes * 60_000);
  keepDateForZiHour(adjustedDate, originalDate);

  const adjustedTimeIndex = timeIndexFromHour(adjustedDate.getHours());

  return {
    adjustedDatetime: formatLocalDatetime(adjustedDate),
    adjustedTimeIndex,
    totalAdjustmentMinutes,
    timeIndexChanged: adjustedTimeIndex !== timeIndex,
    breakdown: {
      longitudeCorrectionMinutes,
      equationOfTimeMinutes,
      originalDatetime: datetime,
      originalTimeIndex: timeIndex,
    },
  };
}

export * from "./cities";
export * from "./equation-of-time";
