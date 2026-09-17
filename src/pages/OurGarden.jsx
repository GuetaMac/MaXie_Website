import { useMemo, useState } from "react";
import { useGarden } from "../hooks/useGarden.js";

// Streak flowers change color AND grow bigger the longer the streak was
// when they were planted — a little milestone reward instead of just a
// plain repeating flower. Sorted highest threshold first so the lookup
// below can just take the first tier the streak day qualifies for.
const STREAK_TIERS = [
  {
    min: 60,
    label: "60+ day streak 👑",
    base: "#E85D8A",
    dark: "#B03D64",
    light: "#FFE6B8",
    scale: 1.35,
  },
  {
    min: 30,
    label: "30+ day streak ✨",
    base: "#5FA8C9",
    dark: "#3E7A95",
    light: "#E3F4F9",
    scale: 1.22,
  },
  {
    min: 14,
    label: "14+ day streak 💫",
    base: "#F2836B",
    dark: "#C25A46",
    light: "#FFEAE3",
    scale: 1.15,
  },
  {
    min: 7,
    label: "7+ day streak 🌟",
    base: "#E8B23B",
    dark: "#B27F1F",
    light: "#FFF3D0",
    scale: 1.08,
  },
  {
    min: 0,
    label: "streak",
    base: "#A868B0",
    dark: "#7A4682",
    light: "#F3DFF5",
    scale: 1,
  },
];

function getStreakTier(day) {
  const d = day || 0;
  return (
    STREAK_TIERS.find((tier) => d >= tier.min) ||
    STREAK_TIERS[STREAK_TIERS.length - 1]
  );
}

// Older tulips planted before milestone tiers existed won't have a
// streakDay field — they just fall back to the base tier above.
function paletteFor(tulip) {
  return getStreakTier(tulip.streakDay);
}

// --- Watering / wilting -----------------------------------------------
// A flower is "watered" whenever wateredAt gets touched (defaults to
// createdAt for flowers that predate this feature). How long ago that
// was decides which of three states it's in. This is purely visual —
// nothing ever gets deleted, so a neglected flower just looks sad until
// someone waters it again.
const WATER_STAGES = {
  fresh: { saturate: 1, brightness: 1, droop: 0, opacity: 1 },
  thirsty: { saturate: 0.72, brightness: 0.95, droop: 6, opacity: 0.92 },
  wilted: { saturate: 0.4, brightness: 0.82, droop: 16, opacity: 0.8 },
};

function daysSince(tsLike) {
  const ms = tsLike?.toDate ? tsLike.toDate().getTime() : null;
  if (ms == null) return 0;
  return (Date.now() - ms) / 86400000;
}

function getWaterState(tulip) {
  const days = daysSince(tulip.wateredAt || tulip.createdAt);
  if (days >= 6) return "wilted";
  if (days >= 3) return "thirsty";
  return "fresh";
}

// How many flowers sit in one "row" (ring) of the tree before a new,
// taller ring stacks above it.
const ROW_SIZE = 5;

// A single tree only grows up to MAX_ROWS_PER_TREE rings tall — after
// that it's "full," and any further flowers start a brand new tree
// next to it instead of stacking the same tree even higher. This is
// what keeps the garden from turning into one impossibly tall trunk as
// more flowers get planted over time — it grows sideways in plots
// instead, each one capped at the same comfortable height.
const MAX_ROWS_PER_TREE = 3;
const MAX_PER_TREE = ROW_SIZE * MAX_ROWS_PER_TREE;

// Vertical rise per ring is unbounded on purpose — the SVG's viewBox
// height grows to match, so the tree just gets taller, which is fine.
// Horizontal spread is capped (MAX_HORIZ) so a ring can NEVER push a
// flower past the edge of the canvas — that unbounded horizontal
// growth was what made flowers fly off past the visible area and made
// stems look like they were crossing everywhere.
const BASE_RISE = 85;
const ROW_RISE = 85;
const BASE_HORIZ = 85;
const HORIZ_STEP = 16;
const MAX_HORIZ = 130;
const CURVE_DROP = 14;

const VB_W = 300;
const BASE_X = 150;
const BASE_Y = 205;

function hashString(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

// Splits the full flower list into fixed-size plots (oldest flowers
// first, same as before) — each plot renders as its own capped-height
// tree, so the garden expands sideways in plots instead of upward
// forever.
function chunkIntoPlots(tulips) {
  const plots = [];
  for (let i = 0; i < tulips.length; i += MAX_PER_TREE) {
    plots.push(tulips.slice(i, i + MAX_PER_TREE));
  }
  return plots;
}

function formatDate(tsLike) {
  if (!tsLike?.toDate) return "";
  try {
    return new Intl.DateTimeFormat("en-PH", {
      month: "short",
      day: "numeric",
    }).format(tsLike.toDate());
  } catch {
    return "";
  }
}

// Fans every flower in the tree out from one shared base point, in
// rings: the first ROW_SIZE flowers form the innermost ring, the next
// ROW_SIZE form a taller ring above it, and so on. Horizontal position
// and vertical rise are calculated SEPARATELY on purpose:
//   - horizSpread is clamped to MAX_HORIZ, so no ring, no matter how
//     high up the tree grows, can ever push a flower past the edge of
//     the 300-wide canvas.
//   - rise grows every ring with no cap, but that's safe because the
//     SVG's viewBox height (below) grows by the same amount, so the
//     tree simply gets taller — it never has to squeeze sideways.
// This is what keeps rings from ever overflowing off-canvas or their
// stems crossing wildly, no matter how many flowers get planted.
function layoutFlowers(tulips) {
  const rows = [];
  for (let i = 0; i < tulips.length; i += ROW_SIZE) {
    rows.push(tulips.slice(i, i + ROW_SIZE));
  }

  const positions = [];
  rows.forEach((row, rowIndex) => {
    const n = row.length;
    const rise = BASE_RISE + rowIndex * ROW_RISE;
    const horizSpread = Math.min(MAX_HORIZ, BASE_HORIZ + rowIndex * HORIZ_STEP);
    row.forEach((tulip, i) => {
      const t = n > 1 ? i / (n - 1) : 0.5;
      const t2 = (t - 0.5) * 2; // -1 .. 1, position within the ring
      const jitterX = (hashString(`${tulip.id}x`) % 11) - 5;
      const jitterY = (hashString(`${tulip.id}y`) % 9) - 4;
      const topX = BASE_X + t2 * horizSpread + jitterX;
      // Ends of each ring droop down slightly (CURVE_DROP) so the
      // ring reads as a gentle fan/arc rather than a flat line.
      const topY = BASE_Y - rise + Math.abs(t2) * CURVE_DROP + jitterY;
      const controlX = BASE_X + (topX - BASE_X) * 0.55;
      const controlY =
        BASE_Y - (BASE_Y - topY) * 0.6 + (t2 > 0 ? 8 : t2 < 0 ? -8 : 0);
      positions.push({
        tulip,
        topX,
        topY,
        controlX,
        controlY,
        delay: positions.length * 140,
      });
    });
  });

  const numRows = rows.length;
  const maxRise = numRows > 0 ? BASE_RISE + (numRows - 1) * ROW_RISE : 0;
  const minY = -(maxRise + CURVE_DROP + 40);
  const vbHeight = BASE_Y + 25 - minY;

  return {
    positions,
    minY,
    vbHeight,
    viewBox: `0 ${minY} ${VB_W} ${vbHeight}`,
  };
}

function Flower({ pos, palette, waterState, active, onToggle, swayDuration }) {
  const { topX: cx, topY: cy } = pos;
  const angles = [-58, -29, 0, 29, 58];
  const scale = palette.scale || 1;
  const stage = WATER_STAGES[waterState];

  return (
    <g
      onClick={onToggle}
      role="button"
      tabIndex={0}
      aria-label={`Tulip (${waterState})`}
      style={{ cursor: "pointer" }}
    >
      <g
        className="og-grow"
        style={{
          transformOrigin: `${BASE_X}px ${BASE_Y}px`,
          animationDelay: `${pos.delay}ms`,
        }}
      >
        <g
          className="og-sway"
          style={{
            transformOrigin: `${BASE_X}px ${BASE_Y}px`,
            animationDelay: `${pos.delay + 800}ms`,
            animationDuration: `${swayDuration}s`,
          }}
        >
          <path
            d={`M${BASE_X} ${BASE_Y} Q${pos.controlX} ${pos.controlY} ${cx} ${cy}`}
            stroke="#7C5A3A"
            strokeWidth="2.2"
            fill="none"
            strokeLinecap="round"
          />

          {/* Droop is a small rotation of the whole bloom around the
              point where the stem meets it — the sadder the flower,
              the more it tips forward, on top of getting duller. */}
          <g
            transform={`scale(${scale}) rotate(${stage.droop} ${cx / scale} ${cy / scale})`}
            style={{
              transformOrigin: `${cx}px ${cy}px`,
              filter: `saturate(${stage.saturate}) brightness(${stage.brightness})`,
              opacity: stage.opacity,
              transition: "filter 0.6s ease, opacity 0.6s ease",
            }}
          >
            <g
              className={`og-bloom${active ? " og-pulse" : ""}`}
              style={{
                transformOrigin: `${cx}px ${cy}px`,
                animationDelay: `${pos.delay + 550}ms`,
              }}
            >
              <circle
                cx={cx}
                cy={cy}
                r="24"
                fill={palette.base}
                opacity="0.08"
              />
              <circle
                cx={cx}
                cy={cy}
                r="18"
                fill={palette.base}
                opacity="0.1"
              />

              {angles.map((a) => (
                <ellipse
                  key={`d${a}`}
                  cx={cx}
                  cy={cy - 15}
                  rx="8.5"
                  ry="15"
                  fill={palette.dark}
                  transform={`rotate(${a} ${cx} ${cy})`}
                />
              ))}
              {angles.map((a) => (
                <ellipse
                  key={`b${a}`}
                  cx={cx}
                  cy={cy - 14}
                  rx="6.8"
                  ry="13"
                  fill={palette.base}
                  transform={`rotate(${a} ${cx} ${cy})`}
                />
              ))}

              <path
                d={`M${cx - 7.5} ${cy + 3} Q${cx} ${cy + 8} ${cx + 7.5} ${cy + 3} Q${cx} ${cy + 6.5} ${cx - 7.5} ${cy + 3} Z`}
                fill={palette.light}
              />
              {[-3.5, 0, 3.5].map((off) => (
                <circle
                  key={off}
                  cx={cx + off}
                  cy={cy - 2 - Math.abs(off) * 0.3}
                  r="1.3"
                  fill="#F2A93B"
                />
              ))}

              {waterState !== "fresh" && (
                <text
                  x={cx}
                  y={cy - 26}
                  textAnchor="middle"
                  fontSize="11"
                  style={{ pointerEvents: "none" }}
                >
                  {waterState === "wilted" ? "🥀" : "💧"}
                </text>
              )}
            </g>
          </g>
        </g>
      </g>
    </g>
  );
}

function GrassBlades({ seed }) {
  const blades = useMemo(() => {
    const colors = ["#2F7A46", "#276331", "#39864C", "#1F5C33", "#245F36"];
    return Array.from({ length: 11 }, (_, i) => {
      const h = hashString(`${seed}-blade-${i}`);
      const x = BASE_X + (i - 5) * 16 + ((h % 11) - 5);
      const height = 26 + (h % 20);
      const curve = ((h % 17) - 8) * 1.6;
      return {
        x,
        height,
        curve,
        color: colors[i % colors.length],
        swayDuration: 2.6 + (h % 10) * 0.1,
        delay: (h % 12) * 90,
      };
    });
  }, [seed]);

  return (
    <>
      {blades.map((b, i) => (
        <g
          key={i}
          className="og-grass-sway"
          style={{
            transformOrigin: `${b.x}px ${BASE_Y + 16}px`,
            animationDuration: `${b.swayDuration}s`,
            animationDelay: `${b.delay}ms`,
          }}
        >
          <path
            d={`M${b.x} ${BASE_Y + 16} Q${b.x + b.curve} ${BASE_Y + 16 - b.height * 0.6} ${b.x + b.curve * 0.4} ${BASE_Y + 16 - b.height}`}
            stroke={b.color}
            strokeWidth="2"
            fill="none"
            strokeLinecap="round"
            opacity="0.9"
          />
        </g>
      ))}
    </>
  );
}

// The whole garden is one tree — every planted (streak) flower grows
// from one shared base, stacking into taller, wider rows as the count
// goes up, instead of splitting off into separate side-by-side bushes.
function GardenTree({ tulips, activeId, onToggle }) {
  const { positions, viewBox, minY, vbHeight } = useMemo(
    () => layoutFlowers(tulips),
    [tulips],
  );

  const fireflies = useMemo(
    () =>
      Array.from({ length: 6 }, () => ({
        left: 8 + Math.random() * 84,
        top: 8 + Math.random() * 60,
        size: 2.5 + Math.random() * 2,
        delay: Math.random() * 2.6,
        duration: 2 + Math.random() * 1.6,
        color: ["#F7E27A", "#F0A8CE", "#B9E8F0"][Math.floor(Math.random() * 3)],
      })),
    [],
  );

  return (
    <div className="relative w-full max-w-md mx-auto">
      {fireflies.map((f, i) => (
        <span
          key={i}
          className="og-firefly pointer-events-none absolute rounded-full"
          style={{
            left: `${f.left}%`,
            top: `${f.top}%`,
            width: f.size,
            height: f.size,
            backgroundColor: f.color,
            animationDelay: `${f.delay}s`,
            animationDuration: `${f.duration}s`,
          }}
        />
      ))}

      <svg width="100%" viewBox={viewBox} aria-hidden="true">
        <ellipse cx={BASE_X} cy={BASE_Y + 20} rx="88" ry="7" fill="#00000045" />
        <path
          d={`M${BASE_X} ${BASE_Y + 12} Q${BASE_X - 55} ${BASE_Y - 3} ${BASE_X - 80} ${BASE_Y + 15} Q${BASE_X - 40} ${BASE_Y + 22} ${BASE_X} ${BASE_Y + 10} Z`}
          fill="#2B6B3F"
          opacity="0.9"
        />
        <path
          d={`M${BASE_X} ${BASE_Y + 12} Q${BASE_X + 55} ${BASE_Y - 3} ${BASE_X + 80} ${BASE_Y + 15} Q${BASE_X + 40} ${BASE_Y + 22} ${BASE_X} ${BASE_Y + 10} Z`}
          fill="#255C36"
          opacity="0.9"
        />
        <path
          d={`M${BASE_X} ${BASE_Y + 12} Q${BASE_X - 32} ${BASE_Y - 26} ${BASE_X - 62} ${BASE_Y - 20} Q${BASE_X - 40} ${BASE_Y + 5} ${BASE_X} ${BASE_Y + 8} Z`}
          fill="#2F7A46"
          opacity="0.85"
        />
        <path
          d={`M${BASE_X} ${BASE_Y + 12} Q${BASE_X + 32} ${BASE_Y - 26} ${BASE_X + 62} ${BASE_Y - 20} Q${BASE_X + 40} ${BASE_Y + 5} ${BASE_X} ${BASE_Y + 8} Z`}
          fill="#276331"
          opacity="0.85"
        />

        <GrassBlades seed={tulips[0]?.id || "tree"} />

        {positions.map((pos) => (
          <Flower
            key={pos.tulip.id}
            pos={pos}
            palette={paletteFor(pos.tulip)}
            waterState={getWaterState(pos.tulip)}
            active={activeId === pos.tulip.id}
            onToggle={() => onToggle(pos.tulip.id)}
            swayDuration={3.6 + (hashString(pos.tulip.id) % 12) * 0.08}
          />
        ))}
      </svg>

      {positions.map((pos) => {
        if (activeId !== pos.tulip.id) return null;
        const waterState = getWaterState(pos.tulip);
        const wateredLabel = formatDate(
          pos.tulip.wateredAt || pos.tulip.createdAt,
        );
        return (
          <div
            key={pos.tulip.id}
            className="pointer-events-none absolute z-10 w-max max-w-[11rem] -translate-x-1/2 -translate-y-full rounded-2xl border border-gold-400/40 bg-plum-800 px-3 py-2 text-xs font-semibold text-blush-50 shadow-lg"
            style={{
              left: `${(pos.topX / VB_W) * 100}%`,
              top: `${((pos.topY - minY) / vbHeight) * 100}%`,
              marginTop: "-8px",
            }}
          >
            <div>
              {pos.tulip.author} · {getStreakTier(pos.tulip.streakDay).label}
              {formatDate(pos.tulip.createdAt)
                ? ` · ${formatDate(pos.tulip.createdAt)}`
                : ""}
            </div>
            <div className="mt-1 text-blush-200/80">
              {waterState === "fresh" && "Sariwa 🌸"}
              {waterState === "thirsty" &&
                `Nauhaw na${wateredLabel ? ` · last watered ${wateredLabel}` : ""}`}
              {waterState === "wilted" &&
                `Nalanta na 🥀${wateredLabel ? ` · last watered ${wateredLabel}` : ""}`}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function OurGarden() {
  const { tulips: allTulips, loading, waterAllTulips } = useGarden();
  const [activeId, setActiveId] = useState(null);
  const [watering, setWatering] = useState(false);

  // Only streak flowers grow on the tree now — older one-off plantings
  // (hug / note / mood) from before the garden went streak-only are
  // filtered out of both the display and the tally below.
  const tulips = useMemo(
    () => allTulips.filter((t) => t.type === "streak"),
    [allTulips],
  );

  const plots = useMemo(() => chunkIntoPlots(tulips), [tulips]);

  const counts = tulips.reduce((acc, t) => {
    const tier = getStreakTier(t.streakDay);
    const key = `streak-${tier.min}`;
    if (!acc[key]) {
      acc[key] = { count: 0, label: tier.label, color: tier.base };
    }
    acc[key].count += 1;
    return acc;
  }, {});

  const wiltedCount = tulips.filter(
    (t) => getWaterState(t) === "wilted",
  ).length;
  const needsWaterIds = tulips
    .filter((t) => getWaterState(t) !== "fresh")
    .map((t) => t.id);

  function toggle(id) {
    setActiveId((cur) => (cur === id ? null : id));
  }

  async function handleWaterAll() {
    if (needsWaterIds.length === 0 || watering) return;
    if (typeof waterAllTulips !== "function") {
      console.warn(
        "waterAllTulips(ids) is not implemented in useGarden.js yet — see the note below the component.",
      );
      return;
    }
    setWatering(true);
    try {
      await waterAllTulips(needsWaterIds);
    } finally {
      setWatering(false);
    }
  }

  return (
    <div>
      {/* Every flower plays its grow-then-bloom animation on mount, so
          the whole garden replays each time this page is opened — the
          tree keeps the same React keys across live Firestore updates,
          so a single new tulip arriving while you're already on the
          page only grows that one new flower in, instead of restarting
          everyone else. */}
      <style>{`
        @keyframes ogGrow {
          0% { transform: scale(0.05); opacity: 0; }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes ogBloom {
          0% { transform: scale(0.4); opacity: 0; }
          60% { opacity: 0.6; }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes ogPulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.12); }
        }
        @keyframes ogSway {
          0%, 100% { transform: rotate(-2.2deg); }
          50% { transform: rotate(2.2deg); }
        }
        @keyframes ogGrassSway {
          0%, 100% { transform: rotate(-5deg); }
          50% { transform: rotate(5deg); }
        }
        @keyframes ogFlicker {
          0%, 100% { opacity: 0.15; }
          50% { opacity: 0.9; }
        }
        .og-grow {
          animation: ogGrow 0.8s cubic-bezier(0.25,0.9,0.4,1) backwards;
        }
        .og-sway {
          animation-name: ogSway;
          animation-timing-function: ease-in-out;
          animation-iteration-count: infinite;
        }
        .og-grass-sway {
          animation-name: ogGrassSway;
          animation-timing-function: ease-in-out;
          animation-iteration-count: infinite;
        }
        .og-bloom {
          animation: ogBloom 0.8s cubic-bezier(0.3,0.9,0.4,1.1) backwards;
        }
        .og-pulse {
          animation: ogPulse 0.4s ease;
        }
        .og-firefly {
          animation: ogFlicker 2.6s ease-in-out infinite;
        }
        @media (prefers-reduced-motion: reduce) {
          .og-grow, .og-bloom, .og-pulse, .og-firefly, .og-sway, .og-grass-sway { animation: none; }
        }
      `}</style>

      <section className="rounded-3xl border border-rose-100 bg-white px-6 py-8 sm:px-10 sm:py-10 mb-6 dark:border-plum-500/40 dark:bg-plum-700">
        <span className="page-eyebrow">A little plot of ours</span>
        <h1 className="text-3xl sm:text-4xl text-plum-700 dark:text-blush-50">
          Our Garden
        </h1>
        <p className="mt-3 font-body text-plum-400 max-w-md dark:text-blush-200/80">
          Isang bagong bulaklak kada araw na na-secure niyo yung streak — mas
          gumaganda at lumalaki pa yung kulay habang tumatagal. Pero kailangan
          din palagiang diligan, kasi kapag na-neglect, nalalanta 🥀.
        </p>

        {tulips.length > 0 && (
          <div className="mt-5 flex flex-wrap items-center gap-2">
            {Object.entries(counts).map(([key, info]) => (
              <span
                key={key}
                className="inline-flex items-center gap-1.5 rounded-full border border-rose-100 bg-rose-50 px-3 py-1 text-xs font-semibold text-plum-500 dark:border-plum-500/40 dark:bg-plum-600 dark:text-blush-100"
              >
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: info.color }}
                />
                {info.label} · {info.count}
              </span>
            ))}

            {needsWaterIds.length > 0 && (
              <button
                type="button"
                onClick={handleWaterAll}
                disabled={watering}
                className="inline-flex items-center gap-1.5 rounded-full bg-blush-500 px-3.5 py-1.5 text-xs font-bold text-plum-800 shadow-sm transition hover:bg-blush-400 disabled:opacity-60"
              >
                💧{" "}
                {watering
                  ? "Nagdidilig..."
                  : `Diligan Lahat (${needsWaterIds.length})`}
              </button>
            )}
          </div>
        )}
      </section>

      <section className="relative overflow-hidden rounded-3xl border border-rose-100 bg-[#0B0B12] px-4 py-8 sm:px-8 dark:border-plum-500/40">
        {loading ? (
          <p className="text-center text-sm text-blush-100/70 py-10">
            Loading...
          </p>
        ) : tulips.length === 0 ? (
          <p className="text-center text-sm text-blush-100/70 py-10">
            Wala pang namumulaklak dito. I-secure niyo yung streak niyo
            (parehong mag-note ngayong araw) para tumubo yung unang bulaklak. 🌱
          </p>
        ) : (
          <div className="flex flex-col items-center gap-10 sm:flex-row sm:items-start sm:gap-6 sm:overflow-x-auto sm:snap-x sm:snap-mandatory sm:pb-2 sm:-mx-8 sm:px-8">
            {plots.map((plot, idx) => (
              <div
                key={idx}
                className="w-full max-w-[22rem] sm:w-[24rem] sm:shrink-0 sm:snap-center"
              >
                <GardenTree
                  tulips={plot}
                  activeId={activeId}
                  onToggle={toggle}
                />
                {plots.length > 1 && (
                  <p className="mt-2 text-center text-xs text-blush-200/60">
                    Plot {idx + 1} ng {plots.length}
                    {idx === plots.length - 1 && plot.length < MAX_PER_TREE
                      ? ` · ${MAX_PER_TREE - plot.length} pang bulaklak bago mapuno`
                      : ""}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

export default OurGarden;

/*
  NOTE for useGarden.js — this file expects a `waterAllTulips(ids)`
  mutation that waters every id in one batch write (see the paired
  useGarden.js update — it uses Firestore's writeBatch so all flowers
  update together in a single request instead of one write per tap).
*/
