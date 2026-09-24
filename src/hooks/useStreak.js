// hooks/useStreak.js
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
// keeps it a "we forgot one day" fix, not a way to bridge a
// months-old dead streak back to life.
const MAX_RESTORE_GAP_DAYS = 3;
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

  let current = 0;
  if (securedToday || atRisk) {
    let cursor = securedToday ? new Date() : addDays(new Date(), -1);
    while (hasBoth(toDateKey(cursor))) {
      current += 1;
      cursor = addDays(cursor, -1);
    }
  }

  // Longest run counts restored days too — once patched, that gap is
  // treated as part of real streak history going forward.
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
    run = prevDate && diffDays(prevDate, d) === 1 ? run + 1 : 1;
    longest = Math.max(longest, run);
    prevDate = d;
  }

  // If the streak currently reads as broken (not secured today, not
  // at risk from yesterday), look backward for a short, recent gap
  // that a restore could bridge — i.e. missing days that sit right
  // between "now" and an otherwise-qualifying earlier day.
  let gapDates = [];
  if (!securedToday && !atRisk) {
    let cursor = addDays(new Date(), -1);
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
 *  - restoredDates: date keys patched in to bridge a missed day
 *  - restoreUsage: { "YYYY-MM": count } — up to 5 restores/month
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
