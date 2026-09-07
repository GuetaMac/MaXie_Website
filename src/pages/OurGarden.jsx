import { useState } from "react";
import { useGarden } from "../hooks/useGarden.js";

// Kulay ng bulaklak kada klase ng interaction
const TULIP_COLORS = {
  note: "#C6667A", // rose
  hug: "#F2A6BE", // blush
  mood: "#C99A3B", // gold
  streak: "#8C5A82", // plum
  morning: "#6FA9B6", // ice
};
const STEM_GREEN = "#8FA883";
const LEAF_GREEN = "#4F7A52";
const STAMEN_GOLD = "#F4B860";
const THROAT_CREAM = "#FCEFE0";

const TULIP_LABELS = {
  note: "note",
  hug: "hug",
  mood: "mood check-in",
  streak: "streak",
  morning: "morning message",
};

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

const VB_W = 400;
const VB_H = 240;
const BASE_X = 200;
const BASE_Y = 214;

// Mumunting tuldok/particles sa background — fixed positions (hindi random
// kada render), may banayad na twinkle. Tinularan yung mga dots sa reference.
const BG_SPECKS = [
  { top: "8%", left: "56%", size: 4, color: "#8a8a4a" },
  { top: "18%", left: "54%", size: 3, color: "#9a9a5a", delay: "0.4s" },
  { top: "22%", left: "68%", size: 3, color: "#4a4a52", delay: "1.1s" },
  { top: "58%", left: "80%", size: 3, color: "#5a6a7a", delay: "0.7s" },
  { top: "12%", left: "11%", size: 3, color: "#7a7a45", delay: "1.6s" },
  { top: "32%", left: "16%", size: 2, color: "#3a3a42", delay: "0.2s" },
  { top: "56%", left: "5%", size: 3, color: "#4a3a4a", delay: "1.3s" },
  { top: "38%", left: "40%", size: 2, color: "#c9a0c9", delay: "0.9s" },
  { top: "62%", left: "88%", size: 4, color: "#7a4a5a", delay: "1.8s" },
  { top: "78%", left: "24%", size: 2, color: "#5a5a62", delay: "0.5s" },
];

function BackgroundSpecks() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {BG_SPECKS.map((s, i) => (
        <span
          key={i}
          className="olw-speck absolute rounded-full"
          style={{
            top: s.top,
            left: s.left,
            width: s.size,
            height: s.size,
            backgroundColor: s.color,
            animationDelay: s.delay || "0s",
          }}
        />
      ))}
    </div>
  );
}

// Layered flower head: base body + scalloped petal crown + shading + throat + stamen dots.
function FlowerBloom({ color }) {
  return (
    <svg
      width="100%"
      height="100%"
      viewBox="0 0 44 34"
      aria-hidden="true"
      style={{ display: "block", overflow: "visible" }}
    >
      <ellipse cx="22" cy="19" rx="17" ry="11" fill={color} />
      <circle cx="8" cy="13" r="7" fill={color} />
      <circle cx="16" cy="8" r="8" fill={color} />
      <circle cx="22" cy="6.5" r="8.2" fill={color} />
      <circle cx="28" cy="8" r="8" fill={color} />
      <circle cx="36" cy="13" r="7" fill={color} />
      <ellipse cx="22" cy="24.5" rx="14" ry="6.5" fill="black" opacity="0.13" />
      <ellipse
        cx="22"
        cy="21"
        rx="9"
        ry="4.3"
        fill={THROAT_CREAM}
        opacity="0.92"
      />
      <circle cx="18" cy="20.5" r="1.3" fill={STAMEN_GOLD} />
      <circle cx="22" cy="21.3" r="1.3" fill={STAMEN_GOLD} />
      <circle cx="26" cy="20.5" r="1.3" fill={STAMEN_GOLD} />
    </svg>
  );
}

function BushBase() {
  return (
    <g>
      <ellipse
        cx={BASE_X}
        cy={BASE_Y + 18}
        rx="70"
        ry="10"
        fill="black"
        opacity="0.35"
      />
      <path
        d={`M${BASE_X} ${BASE_Y - 60} Q${BASE_X - 16} ${BASE_Y - 20} ${BASE_X} ${BASE_Y + 6} Q${BASE_X + 16} ${BASE_Y - 20} ${BASE_X} ${BASE_Y - 60} Z`}
        fill={LEAF_GREEN}
      />
      <path
        d={`M${BASE_X} ${BASE_Y} Q${BASE_X - 60} ${BASE_Y - 8} ${BASE_X - 100} ${BASE_Y + 10} Q${BASE_X - 55} ${BASE_Y + 22} ${BASE_X} ${BASE_Y} Z`}
        fill={LEAF_GREEN}
      />
      <path
        d={`M${BASE_X} ${BASE_Y + 4} Q${BASE_X - 45} ${BASE_Y - 2} ${BASE_X - 78} ${BASE_Y + 24} Q${BASE_X - 40} ${BASE_Y + 30} ${BASE_X} ${BASE_Y + 4} Z`}
        fill={LEAF_GREEN}
        opacity="0.9"
      />
      <path
        d={`M${BASE_X} ${BASE_Y} Q${BASE_X + 60} ${BASE_Y - 8} ${BASE_X + 100} ${BASE_Y + 10} Q${BASE_X + 55} ${BASE_Y + 22} ${BASE_X} ${BASE_Y} Z`}
        fill={LEAF_GREEN}
      />
      <path
        d={`M${BASE_X} ${BASE_Y + 4} Q${BASE_X + 45} ${BASE_Y - 2} ${BASE_X + 78} ${BASE_Y + 24} Q${BASE_X + 40} ${BASE_Y + 30} ${BASE_X} ${BASE_Y + 4} Z`}
        fill={LEAF_GREEN}
        opacity="0.9"
      />
    </g>
  );
}

function OurGarden() {
  const { tulips, loading } = useGarden();
  const [activeId, setActiveId] = useState(null);
  const [hoverId, setHoverId] = useState(null);

  const counts = tulips.reduce((acc, t) => {
    acc[t.type] = (acc[t.type] || 0) + 1;
    return acc;
  }, {});

  // .slice(-9): assumed oldest->newest order galing sa hook. Palitan ng
  // .slice(0, 9) kung newest-first pala.
  const shown = tulips.slice(-9);
  const n = shown.length;

  const stems = shown.map((tulip, i) => {
    const h = hashString(tulip.id);
    const spread = Math.min(72, 16 * Math.max(n - 1, 1));
    const step = n > 1 ? spread / (n - 1) : 0;
    const jitter = (h % 9) - 4;
    const angleDeg = (n > 1 ? -spread / 2 + step * i : 0) + jitter;
    const angleRad = (angleDeg * Math.PI) / 180;
    const length = 76 + (h % 55);

    const headX = BASE_X + length * Math.sin(angleRad);
    const headY = BASE_Y - 14 - length * Math.cos(angleRad);

    const bow = ((h % 20) - 10) * 0.6;
    const ctrlX = BASE_X + (headX - BASE_X) * 0.5 + bow;
    const ctrlY = BASE_Y - 14 - (BASE_Y - 14 - headY) * 0.55;

    const dist = Math.hypot(headX - BASE_X, headY - (BASE_Y - 14)) * 1.05;

    const swayAmp = 2 + (h % 3);
    const swayDur = 3.2 + (h % 16) / 10;
    const swayDelay = -((h % 40) / 10);

    return {
      tulip,
      headX,
      headY,
      ctrlX,
      ctrlY,
      dist,
      i,
      h,
      swayAmp,
      swayDur,
      swayDelay,
    };
  });

  return (
    <div>
      <section className="rounded-3xl border border-rose-100 bg-white px-6 py-8 sm:px-10 sm:py-10 mb-6 dark:border-plum-500/40 dark:bg-plum-700">
        <span className="page-eyebrow">A little plot of ours</span>
        <h1 className="text-3xl sm:text-4xl text-plum-700 dark:text-blush-50">
          Our Garden
        </h1>
        <p className="mt-3 font-body text-plum-400 max-w-md dark:text-blush-200/80">
          Bawat note, hug, mood check-in, at streak ay nagpapatubo ng bagong
          tulip dito. Tumataas habang tumatagal tayo.
        </p>

        {tulips.length > 0 && (
          <div className="mt-5 flex flex-wrap gap-2">
            {Object.entries(counts).map(([type, count]) => (
              <span
                key={type}
                className="inline-flex items-center gap-1.5 rounded-full border border-rose-100 bg-rose-50 px-3 py-1 text-xs font-semibold text-plum-500 dark:border-plum-500/40 dark:bg-plum-600 dark:text-blush-100"
              >
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: TULIP_COLORS[type] }}
                />
                {TULIP_LABELS[type] || type} · {count}
              </span>
            ))}
          </div>
        )}
      </section>

      <section className="relative overflow-hidden rounded-3xl border border-rose-100 bg-[#0d0d14] px-4 py-8 sm:px-10 dark:border-plum-500/40">
        <style>{`
          @keyframes olw-bush-grow {
            0% { transform: scaleY(0.05); opacity: 0; }
            60% { opacity: 1; }
            100% { transform: scaleY(1); opacity: 1; }
          }
          .olw-bush-grow {
            transform-origin: bottom center;
            animation: olw-bush-grow 0.9s cubic-bezier(0.22, 1, 0.36, 1) backwards;
          }
          @keyframes olw-stem-grow { to { stroke-dashoffset: 0; } }
          .olw-stem { animation: olw-stem-grow 0.7s ease-out forwards; }

          @keyframes olw-bloom-pop {
            0% { transform: scale(0.2); opacity: 0; }
            65% { transform: scale(1.12); opacity: 1; }
            100% { transform: scale(1); opacity: 1; }
          }
          .olw-bloom-pop { transform-origin: bottom center; animation: olw-bloom-pop 0.5s ease-out backwards; }

          @keyframes olw-sway {
            0%, 100% { transform: rotate(calc(-1 * var(--sway-amt, 3deg))); }
            50% { transform: rotate(var(--sway-amt, 3deg)); }
          }
          .olw-stem-sway { animation-name: olw-sway; animation-timing-function: ease-in-out; animation-iteration-count: infinite; }
          .olw-flower-sway {
            transform-origin: 50% 94%;
            animation-name: olw-sway;
            animation-timing-function: ease-in-out;
            animation-iteration-count: infinite;
          }

          @keyframes olw-twinkle {
            0%, 100% { opacity: 0.35; }
            50% { opacity: 0.9; }
          }
          .olw-speck { animation: olw-twinkle 3.4s ease-in-out infinite; }

          @media (prefers-reduced-motion: reduce) {
            .olw-bush-grow, .olw-stem, .olw-bloom-pop, .olw-stem-sway, .olw-flower-sway, .olw-speck { animation: none !important; }
          }
        `}</style>

        <BackgroundSpecks />

        {loading ? (
          <p className="relative text-center text-sm text-blush-200/70 py-10">
            Loading...
          </p>
        ) : tulips.length === 0 ? (
          <div className="relative text-center py-10">
            <p className="font-body text-sm text-blush-200/70">
              Wala pang namumulaklak dito. Mag-iwan ng note, magpadala ng hug, o
              mag-check-in ng mood para magsimula. 🌱
            </p>
          </div>
        ) : (
          <div
            className="olw-bush-grow relative mx-auto"
            style={{ maxWidth: "480px" }}
          >
            <div
              style={{
                position: "relative",
                paddingTop: `${(VB_H / VB_W) * 100}%`,
              }}
            >
              <svg
                viewBox={`0 0 ${VB_W} ${VB_H}`}
                style={{
                  position: "absolute",
                  inset: 0,
                  width: "100%",
                  height: "100%",
                  overflow: "visible",
                }}
              >
                <BushBase />
                {stems.map(
                  ({
                    tulip,
                    headX,
                    headY,
                    ctrlX,
                    ctrlY,
                    dist,
                    i,
                    swayAmp,
                    swayDur,
                    swayDelay,
                  }) => (
                    <g
                      key={tulip.id}
                      className="olw-stem-sway"
                      style={{
                        transformOrigin: `${BASE_X}px ${BASE_Y - 14}px`,
                        "--sway-amt": `${swayAmp}deg`,
                        animationDuration: `${swayDur}s`,
                        animationDelay: `${swayDelay}s`,
                      }}
                    >
                      <path
                        className="olw-stem"
                        d={`M${BASE_X} ${BASE_Y - 14} Q${ctrlX} ${ctrlY} ${headX} ${headY}`}
                        stroke={STEM_GREEN}
                        strokeWidth="2.2"
                        strokeLinecap="round"
                        fill="none"
                        style={{
                          strokeDasharray: dist,
                          strokeDashoffset: dist,
                          animationDelay: `${300 + i * 90}ms`,
                        }}
                      />
                    </g>
                  ),
                )}
              </svg>

              {stems.map(
                ({
                  tulip,
                  headX,
                  headY,
                  i,
                  h,
                  swayAmp,
                  swayDur,
                  swayDelay,
                }) => {
                  const size = 34 + (h % 3) * 5;
                  const isOpen = activeId === tulip.id || hoverId === tulip.id;
                  const leftPct = (headX / VB_W) * 100;
                  const topPct = (headY / VB_H) * 100;

                  return (
                    <div
                      key={tulip.id}
                      className="absolute cursor-pointer"
                      style={{
                        left: `${leftPct}%`,
                        top: `${topPct}%`,
                        transform: "translate(-50%, -8%)",
                      }}
                      onMouseEnter={() => setHoverId(tulip.id)}
                      onMouseLeave={() =>
                        setHoverId((cur) => (cur === tulip.id ? null : cur))
                      }
                      onClick={() =>
                        setActiveId((cur) =>
                          cur === tulip.id ? null : tulip.id,
                        )
                      }
                    >
                      {isOpen && (
                        <div className="absolute left-1/2 bottom-full -translate-x-1/2 mb-2 w-max max-w-[10rem] rounded-2xl border border-rose-100 bg-white px-3 py-2 text-xs font-semibold text-plum-600 shadow-md z-10">
                          {tulip.author} ·{" "}
                          {TULIP_LABELS[tulip.type] || tulip.type}
                          {formatDate(tulip) ? ` · ${formatDate(tulip)}` : ""}
                        </div>
                      )}

                      <div
                        className="absolute rounded-full"
                        style={{
                          width: size * (isOpen ? 2.1 : 1.7),
                          height: size * (isOpen ? 2.1 : 1.7),
                          left: "50%",
                          top: "58%",
                          transform: "translate(-50%, -50%)",
                          background: `radial-gradient(circle, ${TULIP_COLORS[tulip.type] || TULIP_COLORS.note}${isOpen ? "55" : "33"} 0%, transparent 70%)`,
                          transition:
                            "width 0.2s ease, height 0.2s ease, background 0.2s ease",
                          zIndex: -1,
                        }}
                      />

                      <div
                        className="olw-flower-sway"
                        style={{
                          "--sway-amt": `${swayAmp}deg`,
                          animationDuration: `${swayDur}s`,
                          animationDelay: `${swayDelay}s`,
                        }}
                      >
                        <div
                          className="olw-bloom-pop"
                          style={{
                            width: size,
                            height: size * 0.86,
                            animationDelay: `${300 + i * 90 + 250}ms`,
                          }}
                        >
                          <FlowerBloom
                            color={
                              TULIP_COLORS[tulip.type] || TULIP_COLORS.note
                            }
                          />
                        </div>
                      </div>
                    </div>
                  );
                },
              )}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

export default OurGarden;
