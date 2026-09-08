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

// How many flowers sit in one "row" of the tree before a new, taller row
// stacks above it. Instead of splitting into separate bushes side by
// side, the whole garden is now one tree that grows upward in layers as
// more flowers are planted.
const ROW_SIZE = 7;
const ROW_HEIGHT = 92;

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

function formatDate(tulip) {
  if (!tulip.createdAt?.toDate) return "";
  try {
    return new Intl.DateTimeFormat("en-PH", {
      month: "short",
      day: "numeric",
    }).format(tulip.createdAt.toDate());
  } catch {
    return "";
  }
}

// Fans every flower in the tree out from one shared base point, in rows:
// the first ROW_SIZE flowers form the innermost arc, the next ROW_SIZE
// form a taller arc above/around that one, and so on — so the tree
// keeps growing upward instead of the row getting infinitely wide.
function layoutFlowers(tulips) {
  const rows = [];
  for (let i = 0; i < tulips.length; i += ROW_SIZE) {
    rows.push(tulips.slice(i, i + ROW_SIZE));
  }

  const positions = [];
  rows.forEach((row, rowIndex) => {
    const n = row.length;
    const rowBaseLength = 96 + rowIndex * ROW_HEIGHT * 0.62;
    row.forEach((tulip, i) => {
      const t = n > 1 ? i / (n - 1) : 0.5;
      const angleDeg = -56 + t * 112;
      const angleRad = (angleDeg * Math.PI) / 180;
      const jitter = (hashString(tulip.id) % 21) - 10;
      const length = rowBaseLength - Math.abs(angleDeg) * 0.45 + jitter;
      const topX = BASE_X + Math.sin(angleRad) * length;
      const topY = BASE_Y - Math.cos(angleRad) * length;
      const controlX =
        BASE_X + Math.sin(angleRad) * length * 0.5 + Math.cos(angleRad) * 10;
      const controlY = BASE_Y - Math.cos(angleRad) * length * 0.5;
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
  const minY = numRows > 1 ? -(ROW_HEIGHT * (numRows - 1)) : 0;
  const vbHeight = BASE_Y + 25 - minY;

  return {
    positions,
    minY,
    vbHeight,
    viewBox: `0 ${minY} ${VB_W} ${vbHeight}`,
  };
}

function Flower({ pos, palette, active, onToggle, swayDuration }) {
  const { topX: cx, topY: cy } = pos;
  const angles = [-58, -29, 0, 29, 58];
  const scale = palette.scale || 1;

  return (
    <g
      onClick={onToggle}
      role="button"
      tabIndex={0}
      aria-label="Tulip"
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

          <g
            transform={`scale(${scale})`}
            style={{ transformOrigin: `${cx}px ${cy}px` }}
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

// The whole garden is now a single tree — every planted (streak) flower
// grows from one shared base, stacking into taller rows as the count
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
            active={activeId === pos.tulip.id}
            onToggle={() => onToggle(pos.tulip.id)}
            swayDuration={3.6 + (hashString(pos.tulip.id) % 12) * 0.08}
          />
        ))}
      </svg>

      {positions.map((pos) =>
        activeId === pos.tulip.id ? (
          <div
            key={pos.tulip.id}
            className="pointer-events-none absolute z-10 w-max max-w-[10rem] -translate-x-1/2 -translate-y-full rounded-2xl border border-gold-400/40 bg-plum-800 px-3 py-2 text-xs font-semibold text-blush-50 shadow-lg"
            style={{
              left: `${(pos.topX / VB_W) * 100}%`,
              top: `${((pos.topY - minY) / vbHeight) * 100}%`,
              marginTop: "-8px",
            }}
          >
            {pos.tulip.author} · {getStreakTier(pos.tulip.streakDay).label}
            {formatDate(pos.tulip) ? ` · ${formatDate(pos.tulip)}` : ""}
          </div>
        ) : null,
      )}
    </div>
  );
}

function OurGarden() {
  const { tulips: allTulips, loading } = useGarden();
  const [activeId, setActiveId] = useState(null);

  // Only streak flowers grow on the tree now — older one-off plantings
  // (hug / note / mood) from before the garden went streak-only are
  // filtered out of both the display and the tally below.
  const tulips = useMemo(
    () => allTulips.filter((t) => t.type === "streak"),
    [allTulips],
  );

  const counts = tulips.reduce((acc, t) => {
    const tier = getStreakTier(t.streakDay);
    const key = `streak-${tier.min}`;
    if (!acc[key]) {
      acc[key] = { count: 0, label: tier.label, color: tier.base };
    }
    acc[key].count += 1;
    return acc;
  }, {});

  function toggle(id) {
    setActiveId((cur) => (cur === id ? null : id));
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
          gumaganda at lumalaki pa yung kulay habang tumatagal.
        </p>

        {tulips.length > 0 && (
          <div className="mt-5 flex flex-wrap gap-2">
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
          <GardenTree tulips={tulips} activeId={activeId} onToggle={toggle} />
        )}
      </section>
    </div>
  );
}

export default OurGarden;
