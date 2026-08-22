import { useEffect, useMemo, useState } from "react";
import { db } from "../firebase";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";

// The two people whose notes count toward the streak.
export const STREAK_USERS = ["Macky", "Trixie"];

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

// A calendar day only counts toward the streak once BOTH people have
// left a note that day — same spirit as a two-person TikTok streak.
function computeStreak(notes) {
  const dayAuthors = new Map();
  for (const n of notes) {
    if (!n.createdAt?.toDate) continue;
    const key = toDateKey(n.createdAt.toDate());
    if (!dayAuthors.has(key)) dayAuthors.set(key, new Set());
    dayAuthors.get(key).add(n.author);
  }

  const hasBoth = (key) => {
    const set = dayAuthors.get(key);
    return Boolean(set) && STREAK_USERS.every((u) => set.has(u));
  };

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

  const qualifyingKeys = Array.from(dayAuthors.keys()).filter(hasBoth).sort();
  let longest = 0;
  let run = 0;
  let prevDate = null;
  for (const key of qualifyingKeys) {
    const d = fromDateKey(key);
    run = prevDate && diffDays(prevDate, d) === 1 ? run + 1 : 1;
    longest = Math.max(longest, run);
    prevDate = d;
  }

  return {
    current,
    longest: Math.max(longest, current),
    securedToday,
    atRisk,
    todaySet,
  };
}

/**
 * Live streak data derived from the shared "notes" collection.
 * Returns { notes, loading, current, longest, securedToday, atRisk, todaySet }.
 * Both the Home page and the Notes page can call this — it's a single
 * shared listener/computation instead of duplicated logic in each page.
 */
export function useStreak() {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, "notes"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      setNotes(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const streak = useMemo(() => computeStreak(notes), [notes]);

  return { ...streak, notes, loading };
}
