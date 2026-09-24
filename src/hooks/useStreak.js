import { useEffect, useMemo, useState } from "react";
import { db } from "../firebase";
import {
  collection,
  onSnapshot,
  orderBy,
  query,
  doc,
  setDoc,
  arrayUnion,
  increment,
  serverTimestamp,
} from "firebase/firestore";
import { plantTulip } from "../utils/garden.js";

// The two people whose notes count toward the streak.
export const STREAK_USERS = ["Macky", "Trixie"];

const STREAK_TULIP_KEY = "olw_streak_tulip_planted_on";

// A single restore fills in at most this many missing days at once —
// keeps it a "we forgot a few days" fix, not a way to bridge a
// months-old dead streak back to life.
const MAX_RESTORE_GAP_DAYS = 14;
const MONTHLY_RESTORE_LIMIT = 5;

const STREAK_META_DOC = doc(db, "meta", "streak");

function toDateKey(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate(),
  ).padStart(2, "0")}`;
}

function fromDateKey(key) {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function addDays(d, n) {
  const copy = new Date(d);
  copy.setDate(copy.getDate() + n);
  return copy;
}

function diffDays(a, b) {
  return Math.round((b - a) / 86400000);
}

function toMonthKey(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

// A calendar day only counts toward the streak once BOTH people have
// left a note that day — same spirit as a two-person TikTok streak.
// `restoredDates` is a Set of date keys ("YYYY-MM-DD") that have been
// manually patched in via the Restore feature and count as if both
// had posted, even though the real notes data says otherwise.
function computeStreak(notes, restoredDates) {
  const dayAuthors = new Map();
  for (const n of notes) {
    if (!n.createdAt?.toDate) continue;
    const key = toDateKey(n.createdAt.toDate());
    if (!dayAuthors.has(key)) dayAuthors.set(key, new Set());
    dayAuthors.get(key).add(n.author);
  }

  const realHasBoth = (key) => {
    const set = dayAuthors.get(key);
    return Boolean(set) && STREAK_USERS.every((u) => set.has(u));
  };
  const hasBoth = (key) => realHasBoth(key) || restoredDates.has(key);

  const todayKey = toDateKey(new Date());
  const yesterdayKey = toDateKey(addDays(new Date(), -1));

  const todaySet = dayAuthors.get(todayKey) || new Set();
  const securedToday = hasBoth(todayKey);
  const atRisk = !securedToday && hasBoth(yesterdayKey);

  // `runStart` tracks the earliest date walked in the current active
  // chain (real or restored), so gap-detection below knows where that
  // chain begins even when it's brand new (e.g. just today).
  //
  // Restored days only bridge the chain so it doesn't break — they
  // are NOT counted toward `current` themselves. Only real hasBoth
  // days add to the number, so restoring a missed day reconnects the
  // streak to its old total instead of tacking on a bonus day for
  // the gap itself.
  let current = 0;
  let runStart = null;
  if (securedToday || atRisk) {
    let cursor = securedToday ? new Date() : addDays(new Date(), -1);
    while (hasBoth(toDateKey(cursor))) {
      if (realHasBoth(toDateKey(cursor))) current += 1;
      runStart = new Date(cursor);
      cursor = addDays(cursor, -1);
    }
  }

  // Longest run: walk all qualifying days (real + restored) in date
  // order so restored days keep a chain from breaking, but — same as
  // `current` — only real days add to the count.
  const qualifyingKeys = new Set(
    Array.from(dayAuthors.keys()).filter(realHasBoth),
  );
  for (const key of restoredDates) qualifyingKeys.add(key);
  const sortedKeys = Array.from(qualifyingKeys).sort();

  let longest = 0;
  let run = 0;
  let prevDate = null;
  for (const key of sortedKeys) {
    const d = fromDateKey(key);
    const continuous = prevDate && diffDays(prevDate, d) === 1;
    if (!continuous) run = 0;
    if (realHasBoth(key)) {
      run += 1;
      longest = Math.max(longest, run);
    }
    prevDate = d;
  }

  // Look backward for an earlier qualifying run that a restore could
  // bridge into the active streak — even when a fresh run has already
  // started today/yesterday. The search starts right before that
  // active run (or from yesterday, if there's no active run at all),
  // so a same-day restart after a missed gap still surfaces the
  // banner instead of only offering it while the streak reads 0.
  let gapDates = [];
  {
    const searchAnchor = runStart
      ? addDays(runStart, -1)
      : addDays(new Date(), -1);
    let cursor = searchAnchor;
    let steps = 0;
    const seen = [];
    while (!hasBoth(toDateKey(cursor)) && steps < MAX_RESTORE_GAP_DAYS) {
      seen.push(toDateKey(cursor));
      cursor = addDays(cursor, -1);
      steps += 1;
    }
    if (hasBoth(toDateKey(cursor)) && seen.length > 0) {
      gapDates = seen.reverse(); // chronological order
    }
  }

  return {
    current,
    longest: Math.max(longest, current),
    securedToday,
    atRisk,
    todaySet,
    gapDates,
  };
}

/**
 * Live streak data derived from the shared "notes" collection, plus
 * a "Restore Streak" feature backed by a small meta/streak doc:
 *  - restoredDates: date keys patched in to bridge a missed gap
 *  - restoreUsage: { "YYYY-MM": count } — up to 5 restores/month,
 *    where one restore click uses exactly 1 credit regardless of how
 *    many days it bridges.
 */
export function useStreak() {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [restoredDates, setRestoredDates] = useState(new Set());
  const [restoreUsage, setRestoreUsage] = useState({});
  const [restoring, setRestoring] = useState(false);

  useEffect(() => {
    const q = query(collection(db, "notes"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      setNotes(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    const unsub = onSnapshot(STREAK_META_DOC, (snap) => {
      const data = snap.data() || {};
      setRestoredDates(new Set(data.restoredDates || []));
      setRestoreUsage(data.restoreUsage || {});
    });
    return () => unsub();
  }, []);

  const streak = useMemo(
    () => computeStreak(notes, restoredDates),
    [notes, restoredDates],
  );

  const monthKey = toMonthKey(new Date());
  const restoresUsedThisMonth = restoreUsage[monthKey] || 0;
  const restoresLeft = Math.max(
    0,
    MONTHLY_RESTORE_LIMIT - restoresUsedThisMonth,
  );
  const canRestore =
    streak.gapDates.length > 0 && restoresLeft > 0 && !restoring;

  const restoreStreak = async () => {
    if (!canRestore) return;
    setRestoring(true);
    try {
      await setDoc(
        STREAK_META_DOC,
        {
          restoredDates: arrayUnion(...streak.gapDates),
          restoreUsage: { [monthKey]: increment(1) },
          lastRestoredAt: serverTimestamp(),
        },
        { merge: true },
      );
    } finally {
      setRestoring(false);
    }
  };

  // Plant a tulip the moment today's streak gets secured — guarded by
  // localStorage so it only happens once per device per day, even
  // though this hook is called from both Home and Notes at once (and
  // fires again on every snapshot update).
  useEffect(() => {
    if (!streak.securedToday) return;
    const todayKey = toDateKey(new Date());
    let plantedOn = null;
    try {
      plantedOn = localStorage.getItem(STREAK_TULIP_KEY);
    } catch {
      // localStorage unavailable — just skip the dedupe guard below.
    }
    if (plantedOn === todayKey) return;

    try {
      localStorage.setItem(STREAK_TULIP_KEY, todayKey);
    } catch {
      // If we can't persist the guard, still plant once for this
      // render rather than silently doing nothing.
    }
    plantTulip("streak", "Macky & Trixie", { streakDay: streak.current });
  }, [streak.securedToday]);

  return {
    ...streak,
    notes,
    loading,
    restoresLeft,
    restoresUsedThisMonth,
    canRestore,
    restoring,
    restoreStreak,
  };
}
