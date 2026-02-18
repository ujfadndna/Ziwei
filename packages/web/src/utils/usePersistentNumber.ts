import { useCallback, useEffect, useState, type Dispatch, type SetStateAction } from "react";

interface UsePersistentNumberOptions {
  storageKey: string;
  initial: number;
  min: number;
  max: number;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function getInitialValue(options: UsePersistentNumberOptions): number {
  const { storageKey, initial, min, max } = options;
  const fallback = clamp(initial, min, max);
  if (typeof window === "undefined") return fallback;

  const raw = window.localStorage.getItem(storageKey);
  if (raw == null) return fallback;

  const parsed = Number(raw);
  if (!Number.isFinite(parsed)) return fallback;

  return clamp(parsed, min, max);
}

export function usePersistentNumber(options: UsePersistentNumberOptions): [number, Dispatch<SetStateAction<number>>] {
  const { storageKey, min, max } = options;
  const [value, setValue] = useState<number>(() => getInitialValue(options));

  const setClampedValue = useCallback<Dispatch<SetStateAction<number>>>(
    (next) => {
      setValue((prev) => {
        const resolved = typeof next === "function" ? (next as (previous: number) => number)(prev) : next;
        return clamp(resolved, min, max);
      });
    },
    [min, max]
  );

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(storageKey, String(value));
  }, [storageKey, value]);

  return [value, setClampedValue];
}
