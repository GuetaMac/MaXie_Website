import { useState, useEffect, useRef, lazy, Suspense } from "react";
import { usePet } from "../context/PetContext.jsx";
import petSounds from "../utils/petSounds.js";

// Lazy-load para hindi mabigat ang ibang pages (three.js ay malaki)
const PetAvatar = lazy(() => import("../components/PetAvatar.jsx"));

const STAT_META = {
  happiness: { label: "Happy", emoji: "❤️", color: "bg-rose-400" },
  hunger: { label: "Fed", emoji: "🐟", color: "bg-amber-400" },
  energy: { label: "Energy", emoji: "⚡", color: "bg-sky-400" },
  clean: { label: "Clean", emoji: "🛁", color: "bg-teal-400" },
  bond: { label: "Bond", emoji: "✨", color: "bg-pink-400" },
};

const ACTION_META = {
  feed: { label: "Feed", emoji: "🍖" },
  play: { label: "Play", emoji: "🧸" },
  pet: { label: "Pet", emoji: "🫳" },
  sleep: { label: "Sleep", emoji: "💤" },
  bath: { label: "Bath", emoji: "🛁" },
  gift: { label: "Gift", emoji: "🎁" },
};

const EMOJI_TO_KEY = {
  "🍖": "feed",
  "🧸": "play",
  "🫳": "pet",
  "💤": "sleep",
  "🛁": "bath",
  "🎁": "gift",
};

// Gaano katagal tumatakbo ang animation ng bawat action (ms)
const ACTION_MS = {
  feed: 3400,
  play: 3000,
  pet: 1800,
  sleep: 7000,
  bath: 3600,
  gift: 3200,
};

const ACTION_LINE = {
  feed: (n) => `Nom nom nom… ${n} is enjoying the meal 🍖`,
  play: (n) => `Wheee! ${n} loves playing 🧸`,
  pet: (n) => `Pip pip! ${n} loves your pets 🥰`,
  sleep: (n) => `Zzz… ${n} is sleeping. Tap to wake up 💤`,
  bath: (n) => `Bubbles! ${n} is taking a bath 🫧`,
  gift: (n) => `Ooh! A gift for ${n} 🎁`,
};

const ACCESSORY_LABEL = { bow: "Bow", scarf: "Scarf", crown: "Crown" };

function StatRibbon({ statKey, value }) {
  const meta = STAT_META[statKey];
  const low = value < 30 && statKey !== "bond";
  return (
    <div className="flex items-center gap-3">
      <span className="w-24 shrink-0 text-sm text-plum-600 dark:text-blush-100">
        {meta.emoji} {meta.label}
      </span>
      <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-blush-100 dark:bg-plum-800">
        <div
          className={`h-full rounded-full transition-all duration-500 ${low ? "bg-red-400" : meta.color}`}
          style={{ width: `${value}%` }}
        />
      </div>
      <span
        className={`w-9 text-right text-xs tabular-nums ${low ? "text-red-400 font-medium" : "text-plum-400 dark:text-blush-200/70"}`}
      >
        {value}%
      </span>
    </div>
  );
}

function WhoAmIPicker({ partners, onChoose }) {
  return (
    <div className="rounded-2xl border border-dashed border-plum-200 bg-blush-50 p-6 text-center dark:border-plum-700 dark:bg-plum-900/40">
      <p className="mb-4 text-plum-600 dark:text-blush-100">
        Who are you right now?
      </p>
      <div className="flex justify-center gap-3">
        {partners.map((partnerName) => (
          <button
            key={partnerName}
            onClick={() => onChoose(partnerName)}
            className="rounded-full bg-plum-500 px-5 py-2 text-sm font-medium text-blush-50 transition hover:bg-plum-600 active:scale-95"
          >
            {partnerName}
          </button>
        ))}
      </div>
    </div>
  );
}

function timeAgo(ts) {
  const mins = Math.floor((Date.now() - ts) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function dayLabel(ts) {
  const d = new Date(ts);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  const sameDay = (a, b) =>
    a.getDate() === b.getDate() &&
    a.getMonth() === b.getMonth() &&
    a.getFullYear() === b.getFullYear();
  if (sameDay(d, today)) return "Today";
  if (sameDay(d, yesterday)) return "Yesterday";
  return d.toLocaleDateString("en-PH", { month: "short", day: "numeric" });
}

function groupLogByDay(log) {
  const groups = [];
  let currentLabel = null;
  let currentEntries = [];
  log.forEach((entry) => {
    const label = dayLabel(entry.timestamp);
    if (label !== currentLabel) {
      if (currentEntries.length)
        groups.push({ label: currentLabel, entries: currentEntries });
      currentLabel = label;
      currentEntries = [entry];
    } else {
      currentEntries.push(entry);
    }
  });
  if (currentEntries.length)
    groups.push({ label: currentLabel, entries: currentEntries });
  return groups;
}

function greeting(whoAmI) {
  const hour = new Date().getHours();
  const time =
    hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  return whoAmI ? `${time}, ${whoAmI} 💗` : time;
}

function moodMessage(stats, petName) {
  const { happiness, hunger, energy, clean, bond } = stats;
  if (energy < 25) return `${petName} is super sleepy and needs a rest 😴`;
  if (hunger < 30) return `${petName} is hungry, time to feed 🥺`;
  if (clean < 30) return `${petName} needs a bath 🫧`;
  const avg = (happiness + energy + hunger + clean) / 4;
  if (avg > 75)
    return `${petName} is so happy right now! Thanks for taking care of them 🥰`;
  if (avg > 50) return `${petName} is feeling okay right now.`;
  if (bond > 80) return `You and ${petName} are super bonded! ✨`;
  return `${petName} could use a little attention.`;
}

const GIFTS = [
  "a tiny bow",
  "a squeaky toy",
  "a soft blanket",
  "a slice of mango",
];

function ActionButton({ emoji, label, onClick, disabled, active }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-pressed={!!active}
      className={`flex flex-col items-center gap-1 rounded-2xl border py-4 text-plum-600 shadow-sm transition-all duration-150 hover:bg-blush-50 hover:-translate-y-0.5 active:scale-95 active:translate-y-0 disabled:opacity-40 disabled:hover:translate-y-0 dark:text-blush-100 dark:hover:bg-plum-900/40 ${
        active
          ? "border-plum-300 bg-blush-50 ring-2 ring-plum-300/60 dark:border-plum-500 dark:bg-plum-900/60"
          : "border-blush-200 dark:border-plum-700"
      }`}
    >
      <span className={`text-2xl ${active ? "animate-bounce" : ""}`}>
        {emoji}
      </span>
      <span className="text-xs">{label}</span>
    </button>
  );
}

export default function OurPet() {
  const {
    name,
    stats,
    log,
    partners,
    whoAmI,
    chooseWhoAmI,
    feed,
    play,
    pet,
    sleep,
    bath,
    giveGift,
    accessory,
    streak,
    toggleReaction,
  } = usePet();

  const [showGifts, setShowGifts] = useState(false);
  const [activeAction, setActiveAction] = useState(null);
  const [actionId, setActionId] = useState(0);
  const [celebration, setCelebration] = useState(null);
  const [visibleCount, setVisibleCount] = useState(6);
  const [filterActor, setFilterActor] = useState("all");
  const [muted, setMuted] = useState(petSounds.isMuted());
  const prevBond = useRef(stats.bond);
  const prevAccessory = useRef(accessory);
  const actionTimer = useRef(null);

  useEffect(() => () => clearTimeout(actionTimer.current), []);

  useEffect(() => {
    const prevTier = Math.floor(prevBond.current / 10);
    const currentTier = Math.floor(stats.bond / 10);
    if (currentTier > prevTier) {
      setCelebration(`Your bond with ${name} grew! It's now ${stats.bond}% 🎉`);
      petSounds.sparkle();
      const timeout = setTimeout(() => setCelebration(null), 3200);
      prevBond.current = stats.bond;
      return () => clearTimeout(timeout);
    }
    prevBond.current = stats.bond;
  }, [stats.bond, name]);

  useEffect(() => {
    if (accessory !== "none" && accessory !== prevAccessory.current) {
      setCelebration(
        `New accessory unlocked: ${ACCESSORY_LABEL[accessory]}! 🎁`,
      );
      petSounds.sparkle();
      const timeout = setTimeout(() => setCelebration(null), 3200);
      prevAccessory.current = accessory;
      return () => clearTimeout(timeout);
    }
    prevAccessory.current = accessory;
  }, [accessory]);

  // Simulan ang animation + sound ng isang action.
  // Isang timer lang para hindi mapatay ng lumang timeout ang bagong action.
  const startAction = (key) => {
    clearTimeout(actionTimer.current);
    setActiveAction(key);
    setActionId((n) => n + 1);
    if (navigator.vibrate) navigator.vibrate(12);
    actionTimer.current = setTimeout(
      () => setActiveAction(null),
      ACTION_MS[key] ?? 2000,
    );
  };

  const trigger =
    (key, fn) =>
    (...args) => {
      fn(...args);
      startAction(key);
    };

  const handleFeed = trigger("feed", feed);
  const handlePlay = trigger("play", play);
  const handlePet = trigger("pet", pet);
  const handleSleep = trigger("sleep", sleep);
  const handleBath = trigger("bath", bath);
  const handleGift = trigger("gift", giveGift);

  const wake = () => {
    clearTimeout(actionTimer.current);
    setActiveAction(null);
    setActionId((n) => n + 1);
  };

  const replayEntry = (entry) => {
    const key = entry.actionKey || EMOJI_TO_KEY[entry.emoji];
    if (!key) return;
    startAction(key);
  };

  const toggleMute = () => {
    const next = !muted;
    petSounds.setMuted(next);
    setMuted(next);
    if (!next) petSounds.poke();
  };

  const isSleeping = activeAction === "sleep";

  const lowStat = Object.entries(stats).find(
    ([key, val]) => key !== "bond" && val < 30,
  );
  const lowStatActions = {
    hunger: ["Feed", handleFeed],
    happiness: ["Play", handlePlay],
    energy: ["Sleep", handleSleep],
    clean: ["Bath", handleBath],
  };

  const filteredLog =
    filterActor === "all" ? log : log.filter((e) => e.actor === filterActor);
  const groupedLog = groupLogByDay(filteredLog.slice(0, visibleCount));

  const todayEntries = log.filter((e) => dayLabel(e.timestamp) === "Today");
  const todaySummary = Object.keys(ACTION_META)
    .map((key) => ({
      key,
      count: todayEntries.filter(
        (e) => (e.actionKey || EMOJI_TO_KEY[e.emoji]) === key,
      ).length,
    }))
    .filter((s) => s.count > 0);

  const statusLine = activeAction
    ? ACTION_LINE[activeAction](name)
    : moodMessage(stats, name);

  return (
    <div className="mx-auto max-w-md space-y-6">
      <div className="text-center">
        <p className="text-sm text-plum-400 dark:text-blush-200/70">
          {greeting(whoAmI)}
        </p>
        <h1 className="font-display text-2xl text-plum-700 dark:text-blush-50">
          {name}
        </h1>
        <p className="text-sm text-plum-400 dark:text-blush-200/70">
          our little baby
        </p>
        <div className="mt-1 flex items-center justify-center gap-3">
          {streak > 0 && (
            <span className="inline-flex items-center gap-1 rounded-full bg-orange-100 px-2.5 py-0.5 text-xs font-medium text-orange-600 dark:bg-orange-950/40 dark:text-orange-300">
              🔥 {streak} day streak
            </span>
          )}
          {whoAmI && (
            <button
              onClick={() => chooseWhoAmI(null)}
              className="text-xs text-plum-300 underline decoration-dotted hover:text-plum-500 dark:text-blush-200/50 dark:hover:text-blush-100"
            >
              not {whoAmI}?
            </button>
          )}
        </div>
      </div>

      {!whoAmI && <WhoAmIPicker partners={partners} onChoose={chooseWhoAmI} />}

      {celebration && (
        <div className="animate-pulse rounded-2xl bg-gradient-to-r from-pink-100 to-sky-100 px-4 py-3 text-center text-sm font-medium text-plum-700 shadow-sm dark:from-plum-800 dark:to-plum-700 dark:text-blush-50">
          {celebration}
        </div>
      )}

      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-sky-50 to-pink-50 shadow-sm dark:from-plum-900/60 dark:to-plum-900/30">
        {/* night overlay kapag natutulog */}
        <div
          className={`pointer-events-none absolute inset-0 z-10 bg-indigo-900/30 transition-opacity duration-1000 ${
            isSleeping ? "opacity-100" : "opacity-0"
          }`}
        />

        <button
          onClick={toggleMute}
          aria-label={muted ? "Turn sounds on" : "Turn sounds off"}
          className="absolute right-3 top-3 z-20 flex h-9 w-9 items-center justify-center rounded-full bg-white/70 text-base shadow-sm backdrop-blur transition hover:bg-white active:scale-90 dark:bg-plum-800/70 dark:hover:bg-plum-800"
        >
          {muted ? "🔇" : "🔊"}
        </button>

        <Suspense
          fallback={
            <div className="flex h-80 items-center justify-center text-sm text-plum-400 dark:text-blush-200/70">
              Waking up {name}…
            </div>
          }
        >
          <PetAvatar
            stats={stats}
            action={activeAction}
            actionId={actionId}
            onTap={whoAmI ? (isSleeping ? wake : handlePet) : undefined}
            accessory={accessory}
          />
        </Suspense>

        <p
          className={`relative z-20 px-6 pb-5 text-center text-sm transition-colors duration-700 ${
            isSleeping
              ? "text-indigo-700 dark:text-indigo-200"
              : "text-plum-500 dark:text-blush-200/80"
          }`}
          aria-live="polite"
        >
          {statusLine}
        </p>
      </div>

      {lowStat && whoAmI && (
        <div className="flex items-center justify-between rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 dark:border-amber-900/40 dark:bg-amber-950/30">
          <span className="text-sm text-amber-700 dark:text-amber-200">
            {name} needs a little attention on{" "}
            {STAT_META[lowStat[0]].label.toLowerCase()} 🥺
          </span>
          <button
            onClick={lowStatActions[lowStat[0]][1]}
            className="shrink-0 rounded-full bg-amber-400 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-amber-500 active:scale-95"
          >
            {lowStatActions[lowStat[0]][0]}
          </button>
        </div>
      )}

      <div className="space-y-3 rounded-3xl border border-blush-200 bg-white/60 p-4 shadow-sm backdrop-blur dark:border-plum-700 dark:bg-plum-900/40">
        {Object.keys(STAT_META).map((key) => (
          <StatRibbon key={key} statKey={key} value={stats[key]} />
        ))}
      </div>

      <div className="grid grid-cols-3 gap-3">
        <ActionButton
          emoji="🍖"
          label="Feed"
          onClick={handleFeed}
          disabled={!whoAmI}
          active={activeAction === "feed"}
        />
        <ActionButton
          emoji="🧸"
          label="Play"
          onClick={handlePlay}
          disabled={!whoAmI}
          active={activeAction === "play"}
        />
        <ActionButton
          emoji="🫳"
          label="Pet"
          onClick={handlePet}
          disabled={!whoAmI}
          active={activeAction === "pet"}
        />
        <ActionButton
          emoji="💤"
          label="Sleep"
          onClick={handleSleep}
          disabled={!whoAmI}
          active={activeAction === "sleep"}
        />
        <ActionButton
          emoji="🛁"
          label="Bath"
          onClick={handleBath}
          disabled={!whoAmI}
          active={activeAction === "bath"}
        />
        <ActionButton
          emoji="🎁"
          label="Gift"
          onClick={() => setShowGifts(true)}
          disabled={!whoAmI}
          active={activeAction === "gift"}
        />
      </div>

      {showGifts && (
        <div className="rounded-2xl border border-blush-200 bg-white/60 p-4 shadow-sm backdrop-blur dark:border-plum-700 dark:bg-plum-900/40">
          <p className="mb-3 text-sm text-plum-600 dark:text-blush-100">
            Pick a gift:
          </p>
          <div className="flex flex-wrap gap-2">
            {GIFTS.map((item) => (
              <button
                key={item}
                onClick={() => {
                  handleGift(item);
                  setShowGifts(false);
                }}
                className="rounded-full bg-blush-100 px-3 py-1.5 text-sm text-plum-600 transition hover:bg-blush-200 active:scale-95 dark:bg-plum-800 dark:text-blush-100"
              >
                {item}
              </button>
            ))}
          </div>
        </div>
      )}

      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm text-plum-500 dark:text-blush-200/80">
            Activity
          </h2>
          {log.length > 0 && (
            <span className="text-xs text-plum-300 dark:text-blush-200/40">
              {Math.min(visibleCount, filteredLog.length)} of{" "}
              {filteredLog.length}
            </span>
          )}
        </div>

        {todaySummary.length > 0 && (
          <div className="mb-3 flex flex-wrap gap-2 rounded-2xl bg-blush-50 px-3 py-2.5 dark:bg-plum-900/40">
            <span className="text-xs text-plum-400 dark:text-blush-200/60">
              Today:
            </span>
            {todaySummary.map((s) => (
              <span
                key={s.key}
                className="text-xs text-plum-600 dark:text-blush-100"
              >
                {ACTION_META[s.key].emoji} {s.count}×
              </span>
            ))}
          </div>
        )}

        <div className="mb-3 flex gap-1.5">
          {["all", ...partners].map((p) => (
            <button
              key={p}
              onClick={() => {
                setFilterActor(p);
                setVisibleCount(6);
              }}
              className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                filterActor === p
                  ? "bg-plum-500 text-blush-50"
                  : "bg-blush-100 text-plum-500 hover:bg-blush-200 dark:bg-plum-800 dark:text-blush-200"
              }`}
            >
              {p === "all" ? "All" : p}
            </button>
          ))}
        </div>

        {filteredLog.length === 0 && (
          <p className="text-sm text-plum-400 dark:text-blush-200/60">
            No activity yet — feed or play to get started.
          </p>
        )}

        <div className="space-y-4">
          {groupedLog.map((group) => (
            <div key={group.label}>
              <p className="mb-2 text-xs font-medium uppercase tracking-wide text-plum-300 dark:text-blush-200/40">
                {group.label}
              </p>
              <ul className="space-y-1.5">
                {group.entries.map((entry) => {
                  const reactions = entry.reactions || [];
                  const iReacted = whoAmI && reactions.includes(whoAmI);
                  return (
                    <li
                      key={entry.id}
                      onClick={() => replayEntry(entry)}
                      className="flex cursor-pointer items-center gap-3 rounded-xl bg-white/50 px-3 py-2.5 shadow-sm transition hover:bg-white/80 dark:bg-plum-900/40 dark:hover:bg-plum-900/60"
                    >
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blush-100 text-base dark:bg-plum-800">
                        {entry.emoji}
                      </span>
                      <span className="flex-1 text-sm text-plum-600 dark:text-blush-100">
                        <span className="font-medium">{entry.actor}</span>{" "}
                        {entry.action}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleReaction(entry.id);
                        }}
                        disabled={!whoAmI}
                        className="shrink-0 text-base transition active:scale-90 disabled:opacity-40"
                        aria-label="React"
                      >
                        {iReacted ? "❤️" : "🤍"}
                        {reactions.length > 0 && (
                          <span className="ml-0.5 text-xs text-plum-400 dark:text-blush-200/60">
                            {reactions.length}
                          </span>
                        )}
                      </button>
                      <span className="shrink-0 text-xs text-plum-300 dark:text-blush-200/50">
                        {timeAgo(entry.timestamp)}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>

        {filteredLog.length > visibleCount && (
          <button
            onClick={() => setVisibleCount((v) => v + 6)}
            className="mt-4 w-full rounded-2xl border border-dashed border-blush-200 py-2.5 text-sm text-plum-500 transition hover:bg-blush-50 active:scale-[0.98] dark:border-plum-700 dark:text-blush-200/80 dark:hover:bg-plum-900/40"
          >
            Show more ({filteredLog.length - visibleCount} left)
          </button>
        )}

        {visibleCount > 6 &&
          filteredLog.length <= visibleCount &&
          filteredLog.length > 6 && (
            <button
              onClick={() => setVisibleCount(6)}
              className="mt-4 w-full rounded-2xl border border-dashed border-blush-200 py-2.5 text-sm text-plum-400 transition hover:bg-blush-50 active:scale-[0.98] dark:border-plum-700 dark:text-blush-200/60 dark:hover:bg-plum-900/40"
            >
              Show less
            </button>
          )}
      </div>
    </div>
  );
}
