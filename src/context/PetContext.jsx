import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import {
  doc,
  onSnapshot,
  setDoc,
  runTransaction,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../firebase";

const PET_DOC_PATH = ["pets", "mochi"];
const WHOAMI_KEY = "ourPet:whoami";

const DEFAULT_STATE = {
  name: "Pendy",
  stats: { happiness: 85, hunger: 70, energy: 90, bond: 42, clean: 80 },
  lastTick: Date.now(),
  streak: 0,
  lastActiveDate: null,
  log: [],
};

const PetContext = createContext(null);
const clamp = (n) => Math.max(0, Math.min(100, Math.round(n)));

function localDateString(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function daysBetween(dateStrA, dateStrB) {
  const a = new Date(`${dateStrA}T00:00:00`);
  const b = new Date(`${dateStrB}T00:00:00`);
  return Math.round((b - a) / 86400000);
}

// Bond thresholds unlock one visual accessory each, highest tier wins.
function getAccessoryTier(bond) {
  if (bond >= 80) return "crown";
  if (bond >= 50) return "scarf";
  if (bond >= 25) return "bow";
  return "none";
}

function decayStats(stats, lastTick) {
  const hoursPassed = (Date.now() - lastTick) / 3600000;
  if (hoursPassed < 0.1) return stats;
  return {
    happiness: clamp(stats.happiness - 2 * hoursPassed),
    hunger: clamp(stats.hunger - 3 * hoursPassed),
    energy: clamp(stats.energy - 1.5 * hoursPassed),
    clean: clamp(stats.clean - 1 * hoursPassed),
    bond: stats.bond,
  };
}

export function PetProvider({ partners = ["Macky", "Trixie"], children }) {
  const [state, setState] = useState(DEFAULT_STATE);
  const [loading, setLoading] = useState(true);
  const [whoAmI, setWhoAmI] = useState(() => {
    try {
      return localStorage.getItem(WHOAMI_KEY) || null;
    } catch {
      return null;
    }
  });

  const petRef = doc(db, ...PET_DOC_PATH);

  useEffect(() => {
    const unsub = onSnapshot(petRef, async (snap) => {
      if (!snap.exists()) {
        await setDoc(petRef, DEFAULT_STATE);
        return;
      }
      setState({ ...DEFAULT_STATE, ...snap.data() });
      setLoading(false);
    });
    return unsub;
  }, []);

  const chooseWhoAmI = useCallback((selectedName) => {
    if (selectedName === null) {
      localStorage.removeItem(WHOAMI_KEY);
      setWhoAmI(null);
      return;
    }
    localStorage.setItem(WHOAMI_KEY, selectedName);
    setWhoAmI(selectedName);
  }, []);

  const applyAction = useCallback(
    async (changes, action, emoji, key) => {
      await runTransaction(db, async (tx) => {
        const snap = await tx.get(petRef);
        const current = snap.exists()
          ? { ...DEFAULT_STATE, ...snap.data() }
          : DEFAULT_STATE;
        const decayed = decayStats(current.stats, current.lastTick);

        const stats = { ...decayed };
        Object.keys(changes).forEach((k) => {
          stats[k] = clamp(stats[k] + changes[k]);
        });

        const todayStr = localDateString();
        let streak = current.streak || 0;
        if (current.lastActiveDate !== todayStr) {
          if (current.lastActiveDate) {
            const diff = daysBetween(current.lastActiveDate, todayStr);
            streak = diff === 1 ? streak + 1 : 1;
          } else {
            streak = 1;
          }
        }

        const entry = {
          id: crypto.randomUUID(),
          actor: whoAmI || "Someone",
          action,
          emoji,
          actionKey: key,
          reactions: [],
          timestamp: Date.now(),
        };
        const log = [entry, ...(current.log || [])].slice(0, 50);

        tx.set(petRef, {
          ...current,
          stats,
          lastTick: Date.now(),
          streak,
          lastActiveDate: todayStr,
          log,
          updatedAt: serverTimestamp(),
        });
      });
    },
    [whoAmI],
  );

  const toggleReaction = useCallback(
    async (entryId) => {
      if (!whoAmI) return;
      await runTransaction(db, async (tx) => {
        const snap = await tx.get(petRef);
        const current = snap.exists()
          ? { ...DEFAULT_STATE, ...snap.data() }
          : DEFAULT_STATE;
        const log = (current.log || []).map((entry) => {
          if (entry.id !== entryId) return entry;
          const reactions = entry.reactions || [];
          const already = reactions.includes(whoAmI);
          return {
            ...entry,
            reactions: already
              ? reactions.filter((n) => n !== whoAmI)
              : [...reactions, whoAmI],
          };
        });
        tx.set(petRef, { ...current, log });
      });
    },
    [whoAmI],
  );

  const feed = () =>
    applyAction(
      { hunger: 22, happiness: 4 },
      `fed ${state.name}`,
      "🍖",
      "feed",
    );
  const play = () =>
    applyAction(
      { happiness: 18, energy: -8, hunger: -4 },
      `played with ${state.name}`,
      "🧸",
      "play",
    );
  const pet = () =>
    applyAction(
      { bond: 3, happiness: 6 },
      `cuddled ${state.name}`,
      "🫳",
      "pet",
    );
  const sleep = () =>
    applyAction(
      { energy: 30, hunger: -5 },
      `tucked ${state.name} in for a nap`,
      "💤",
      "sleep",
    );
  const bath = () =>
    applyAction(
      { clean: 35, happiness: -3 },
      `gave ${state.name} a bath`,
      "🛁",
      "bath",
    );
  const giveGift = (item = "a little treat") =>
    applyAction(
      { bond: 6, happiness: 10 },
      `gave ${state.name} ${item}`,
      "🎁",
      "gift",
    );

  const displayStats = decayStats(state.stats, state.lastTick);

  const value = {
    ...state,
    stats: displayStats,
    accessory: getAccessoryTier(displayStats.bond),
    streak: state.streak || 0,
    partners,
    whoAmI,
    chooseWhoAmI,
    loading,
    feed,
    play,
    pet,
    sleep,
    bath,
    giveGift,
    toggleReaction,
  };

  return <PetContext.Provider value={value}>{children}</PetContext.Provider>;
}

export function usePet() {
  const ctx = useContext(PetContext);
  if (!ctx) throw new Error("usePet must be used within a PetProvider");
  return ctx;
}
