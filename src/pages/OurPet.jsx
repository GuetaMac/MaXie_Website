import { useState, useEffect, useRef } from "react";
import { usePet } from "../context/PetContext.jsx";
import PetAvatar from "../components/PetAvatar.jsx";

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
      <p className="mb-4 text-plum-600 dark:text-blush-100">Sino ka ngayon?</p>
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
  if (sameDay(d, today)) return "Ngayon";
  if (sameDay(d, yesterday)) return "Kahapon";
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
    hour < 12
      ? "Magandang umaga"
      : hour < 18
        ? "Magandang hapon"
        : "Magandang gabi";
  return whoAmI ? `${time}, ${whoAmI} 💗` : time;
}

function moodMessage(stats, petName) {
  const { happiness, hunger, energy, clean, bond } = stats;
  if (energy < 25)
    return `Antok na antok na si ${petName}, pahinga muna siya 😴`;
  if (hunger < 30) return `Gutom na si ${petName}, feeding time na 🥺`;
  if (clean < 30) return `Kailangan na ni ${petName} ng bath 🫧`;
  const avg = (happiness + energy + hunger + clean) / 4;
  if (avg > 75)
    return `Sobrang saya ni ${petName} ngayon! Salamat sa pag-aalaga 🥰`;
  if (avg > 50) return `Okay lang ang pakiramdam ni ${petName} ngayon.`;
  if (bond > 80) return `Sobrang bonded na kayo ni ${petName}! ✨`;
  return `Medyo kailangan ng konting pansin si ${petName}.`;
}

const GIFTS = [
  "a tiny bow",
  "a squeaky toy",
  "a soft blanket",
  "a slice of mango",
];

function ActionButton({ emoji, label, onClick, disabled }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="flex flex-col items-center gap-1 rounded-2xl border border-blush-200 py-4 text-plum-600 shadow-sm transition-all duration-150 hover:bg-blush-50 hover:-translate-y-0.5 active:scale-95 active:translate-y-0 disabled:opacity-40 disabled:hover:translate-y-0 dark:border-plum-700 dark:text-blush-100 dark:hover:bg-plum-900/40"
    >
      <span className="text-2xl">{emoji}</span>
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
  const [celebration, setCelebration] = useState(null);
  const [visibleCount, setVisibleCount] = useState(6);
  const [filterActor, setFilterActor] = useState("all");
  const prevBond = useRef(stats.bond);
  const prevAccessory = useRef(accessory);

  useEffect(() => {
    const prevTier = Math.floor(prevBond.current / 10);
    const currentTier = Math.floor(stats.bond / 10);
    if (currentTier > prevTier) {
      setCelebration(
        `Tumaas ang Bond ninyo ni ${name}! Ngayon ay ${stats.bond}% na 🎉`,
      );
      const timeout = setTimeout(() => setCelebration(null), 3200);
      prevBond.current = stats.bond;
      return () => clearTimeout(timeout);
    }
    prevBond.current = stats.bond;
  }, [stats.bond, name]);

  useEffect(() => {
    if (accessory !== "none" && accessory !== prevAccessory.current) {
      setCelebration(
        `Nabuksan ang bagong accessory: ${ACCESSORY_LABEL[accessory]}! 🎁`,
      );
      const timeout = setTimeout(() => setCelebration(null), 3200);
      prevAccessory.current = accessory;
      return () => clearTimeout(timeout);
    }
    prevAccessory.current = accessory;
  }, [accessory]);

  const trigger =
    (key, fn) =>
    (...args) => {
      fn(...args);
      setActiveAction(key);
      setTimeout(() => setActiveAction(null), 1600);
    };

  const handleFeed = trigger("feed", feed);
  const handlePlay = trigger("play", play);
  const handlePet = trigger("pet", pet);
  const handleSleep = trigger("sleep", sleep);
  const handleBath = trigger("bath", bath);
  const handleGift = trigger("gift", giveGift);

  const replayEntry = (entry) => {
    const key = entry.actionKey || EMOJI_TO_KEY[entry.emoji];
    if (!key) return;
    setActiveAction(key);
    setTimeout(() => setActiveAction(null), 1600);
  };

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

  const todayEntries = log.filter((e) => dayLabel(e.timestamp) === "Ngayon");
  const todaySummary = Object.keys(ACTION_META)
    .map((key) => ({
      key,
      count: todayEntries.filter(
        (e) => (e.actionKey || EMOJI_TO_KEY[e.emoji]) === key,
      ).length,
    }))
    .filter((s) => s.count > 0);

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
              🔥 {streak} {streak === 1 ? "araw" : "araw"} streak
            </span>
          )}
          {whoAmI && (
            <button
              onClick={() => chooseWhoAmI(null)}
              className="text-xs text-plum-300 underline decoration-dotted hover:text-plum-500 dark:text-blush-200/50 dark:hover:text-blush-100"
            >
              hindi ikaw si {whoAmI}?
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

      <div className="rounded-3xl bg-gradient-to-b from-sky-50 to-pink-50 shadow-sm dark:from-plum-900/60 dark:to-plum-900/30">
        <PetAvatar
          stats={stats}
          action={activeAction}
          onTap={whoAmI ? handlePet : undefined}
          accessory={accessory}
        />
        <p className="px-6 pb-5 text-center text-sm text-plum-500 dark:text-blush-200/80">
          {moodMessage(stats, name)}
        </p>
      </div>

      {lowStat && whoAmI && (
        <div className="flex items-center justify-between rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 dark:border-amber-900/40 dark:bg-amber-950/30">
          <span className="text-sm text-amber-700 dark:text-amber-200">
            Kailangan ni {name} ng konting pansin sa{" "}
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
        />
        <ActionButton
          emoji="🧸"
          label="Play"
          onClick={handlePlay}
          disabled={!whoAmI}
        />
        <ActionButton
          emoji="🫳"
          label="Pet"
          onClick={handlePet}
          disabled={!whoAmI}
        />
        <ActionButton
          emoji="💤"
          label="Sleep"
          onClick={handleSleep}
          disabled={!whoAmI}
        />
        <ActionButton
          emoji="🛁"
          label="Bath"
          onClick={handleBath}
          disabled={!whoAmI}
        />
        <ActionButton
          emoji="🎁"
          label="Gift"
          onClick={() => setShowGifts(true)}
          disabled={!whoAmI}
        />
      </div>

      {showGifts && (
        <div className="rounded-2xl border border-blush-200 bg-white/60 p-4 shadow-sm backdrop-blur dark:border-plum-700 dark:bg-plum-900/40">
          <p className="mb-3 text-sm text-plum-600 dark:text-blush-100">
            Piliin ang gift:
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
              {Math.min(visibleCount, filteredLog.length)} sa{" "}
              {filteredLog.length}
            </span>
          )}
        </div>

        {todaySummary.length > 0 && (
          <div className="mb-3 flex flex-wrap gap-2 rounded-2xl bg-blush-50 px-3 py-2.5 dark:bg-plum-900/40">
            <span className="text-xs text-plum-400 dark:text-blush-200/60">
              Ngayon:
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
              {p === "all" ? "Lahat" : p}
            </button>
          ))}
        </div>

        {filteredLog.length === 0 && (
          <p className="text-sm text-plum-400 dark:text-blush-200/60">
            Wala pang activity dito — mag-feed o maglaro para magsimula.
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
            Ipakita pa ({filteredLog.length - visibleCount} pa)
          </button>
        )}

        {visibleCount > 6 &&
          filteredLog.length <= visibleCount &&
          filteredLog.length > 6 && (
            <button
              onClick={() => setVisibleCount(6)}
              className="mt-4 w-full rounded-2xl border border-dashed border-blush-200 py-2.5 text-sm text-plum-400 transition hover:bg-blush-50 active:scale-[0.98] dark:border-plum-700 dark:text-blush-200/60 dark:hover:bg-plum-900/40"
            >
              Ipakita nang kaunti lang
            </button>
          )}
      </div>
    </div>
  );
}
