"use client";

import { useMemo } from "react";
import type { SessionHistoryEntry } from "./useMemorizationSrs";

export default function useMemorizationActivity(sessionHistory: SessionHistoryEntry[]) {
  // Last 7 days for activity graph
  const last7Days = useMemo(() => {
    const days: Array<{ label: string; date: string; reviewed: number; completed: number }> = [];
    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      const entry = sessionHistory.find((e) => e.date === key);
      days.push({
        label: i === 0 ? "Today" : dayNames[d.getDay()],
        date: key,
        reviewed: entry?.reviewed || 0,
        completed: entry?.completed || 0
      });
    }
    return days;
  }, [sessionHistory]);

  // Calculate current streak (consecutive days with activity ending today or yesterday)
  const streak = useMemo(() => {
    let count = 0;
    for (let i = 0; i < 30; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      const entry = sessionHistory.find((e) => e.date === key);
      if (entry && entry.reviewed > 0) {
        count++;
      } else if (i === 0) {
        // Today has no activity — still check yesterday
        continue;
      } else {
        break;
      }
    }
    return count;
  }, [sessionHistory]);

  return { last7Days, streak };
}
