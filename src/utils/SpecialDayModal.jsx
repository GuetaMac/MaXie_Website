import { useEffect, useMemo, useState } from "react";
import { getSpecialDay, getDismissKey } from "./specialDay";

// Flower emojis used in the burst — mixed for variety.
const PETALS = ["🌸", "🌷", "💮", "🌼", "✨", "🌺"];
const PETAL_COUNT = 10;

function buildPetals() {
  return Array.from({ length: PETAL_COUNT }, (_, i) => {
    const angle = (i / PETAL_COUNT) * 360 + (Math.random() * 20 - 10);
    const distance = 90 + Math.random() * 60;
    const rad = (angle * Math.PI) / 180;
    return {
      key: i,
      emoji: PETALS[i % PETALS.length],
      tx: Math.cos(rad) * distance,
      ty: Math.sin(rad) * distance,
      delay: i * 0.04,
      rotate: Math.random() * 360,
    };
  });
}

export default function SpecialDayModal() {
  const dayInfo = useMemo(() => getSpecialDay(), []);
  const dismissKey = useMemo(() => getDismissKey(), []);

  // "closed" -> "shaking" -> "bursting" -> "revealed" -> null (dismissed)
  const [stage, setStage] = useState(null);
  const [petals, setPetals] = useState([]);

  useEffect(() => {
    if (!dayInfo) return;
    try {
      const alreadySeen = localStorage.getItem(dismissKey);
      if (!alreadySeen) setStage("closed");
    } catch {
      setStage("closed");
    }
  }, [dayInfo, dismissKey]);

  if (!dayInfo || !stage) return null;

  const handleOpen = () => {
    if (stage !== "closed") return;
    setStage("shaking");
    setTimeout(() => {
      setPetals(buildPetals());
      setStage("bursting");
    }, 500);
    setTimeout(() => setStage("revealed"), 1300);
  };

  const handleDismiss = () => {
    try {
      localStorage.setItem(dismissKey, "1");
    } catch {
      // ignore storage errors, just close for this session
    }
    setStage(null);
  };

  return (
    <div
      className="olw-sd-root fixed inset-0 z-50 flex items-center justify-center p-6"
      role="dialog"
      aria-modal="true"
    >
      <style>{`
        .olw-sd-root {
          --olw-paper: #FBEFEC;
          --olw-ink: #402331;
          --olw-rose: #C6667A;
          --olw-rose-soft: #F1D9DD;
          --olw-gold: #C99A3B;
          --olw-gold-soft: #FFF6E4;
          --olw-surface: #FFFDFB;
          font-family: 'Inter', sans-serif;
          background: rgba(64, 35, 49, 0.45);
          backdrop-filter: blur(3px);
        }
        .dark .olw-sd-root {
          --olw-paper: #2b1a26;
          --olw-ink: #f7e9ee;
          --olw-rose: #f0a8bb;
          --olw-rose-soft: rgba(240,168,187,0.16);
          --olw-gold: #e0b563;
          --olw-gold-soft: rgba(224,181,99,0.16);
          --olw-surface: #3d2438;
          background: rgba(0,0,0,0.55);
        }
        .olw-sd-display { font-family: 'Fraunces', serif; }

        .olw-sd-card {
          position: relative;
          background: var(--olw-surface);
          border: 1px solid var(--olw-rose-soft);
        }

        @keyframes olw-sd-pulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(198,102,122,0.35); }
          50% { box-shadow: 0 0 0 14px rgba(198,102,122,0); }
        }
        .olw-sd-gift {
          animation: olw-sd-pulse 1.8s ease-in-out infinite;
        }

        @keyframes olw-sd-shake {
          0%, 100% { transform: rotate(0deg); }
          20% { transform: rotate(-8deg); }
          40% { transform: rotate(7deg); }
          60% { transform: rotate(-5deg); }
          80% { transform: rotate(4deg); }
        }
        .olw-sd-shaking { animation: olw-sd-shake 0.5s ease-in-out; }

        @keyframes olw-sd-lid-off {
          0% { transform: translateY(0) rotate(0deg); opacity: 1; }
          100% { transform: translateY(-46px) rotate(-18deg); opacity: 0; }
        }
        .olw-sd-lid-off { animation: olw-sd-lid-off 0.6s ease forwards; }

        @keyframes olw-sd-box-fade {
          0% { transform: scale(1); opacity: 1; }
          100% { transform: scale(0.85); opacity: 0; }
        }
        .olw-sd-box-fade { animation: olw-sd-box-fade 0.5s ease forwards 0.2s; }

        @keyframes olw-sd-petal {
          0% { transform: translate(0, 0) scale(0.3) rotate(0deg); opacity: 0; }
          25% { opacity: 1; }
          100% {
            transform: translate(var(--tx), var(--ty)) scale(1) rotate(var(--rot));
            opacity: 0;
          }
        }
        .olw-sd-petal {
          position: absolute;
          left: 50%;
          top: 50%;
          font-size: 1.5rem;
          animation: olw-sd-petal 1.1s ease-out forwards;
          animation-delay: var(--delay);
          pointer-events: none;
        }

        @keyframes olw-sd-reveal-in {
          0% { opacity: 0; transform: translateY(10px) scale(0.96); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }
        .olw-sd-reveal { animation: olw-sd-reveal-in 0.45s ease-out; }

        .olw-sd-close {
          transition: opacity 0.15s ease, transform 0.15s ease;
        }
        .olw-sd-close:hover { opacity: 1; transform: scale(1.08); }

        @media (prefers-reduced-motion: reduce) {
          .olw-sd-gift, .olw-sd-shaking, .olw-sd-lid-off,
          .olw-sd-box-fade, .olw-sd-petal, .olw-sd-reveal {
            animation: none;
          }
        }
      `}</style>

      <div
        className="olw-sd-card max-w-xs w-full rounded-3xl p-8 text-center shadow-lg"
        style={{ color: "var(--olw-ink)" }}
      >
        <button
          type="button"
          onClick={handleDismiss}
          className="olw-sd-close absolute top-3 right-4 text-lg opacity-50"
          aria-label="Isara"
        >
          ×
        </button>

        {stage !== "revealed" ? (
          <div className="relative flex flex-col items-center justify-center py-6">
            {/* petal burst layer */}
            {stage === "bursting" &&
              petals.map((p) => (
                <span
                  key={p.key}
                  className="olw-sd-petal"
                  style={{
                    "--tx": `${p.tx}px`,
                    "--ty": `${p.ty}px`,
                    "--rot": `${p.rotate}deg`,
                    "--delay": `${p.delay}s`,
                  }}
                >
                  {p.emoji}
                </span>
              ))}

            <button
              type="button"
              onClick={handleOpen}
              disabled={stage !== "closed"}
              className={`olw-sd-gift text-7xl rounded-full p-6 ${
                stage === "shaking" ? "olw-sd-shaking" : ""
              } ${stage === "bursting" ? "olw-sd-box-fade" : ""}`}
              style={{ backgroundColor: "var(--olw-gold-soft)" }}
              aria-label="Buksan ang regalo"
            >
              🎁
            </button>

            <p
              className="olw-sd-display text-lg font-semibold mt-5"
              style={{
                opacity: stage === "closed" ? 1 : 0,
                transition: "opacity 0.2s",
              }}
            >
              May regalo ako para sa'yo
            </p>
            <p className="text-sm opacity-70 mt-1">
              {stage === "closed" ? "I-tap para buksan" : ""}
            </p>
          </div>
        ) : (
          <div className="olw-sd-reveal flex flex-col items-center">
            <span className="text-6xl mb-4">{dayInfo.icon}</span>
            <h2 className="olw-sd-display text-2xl font-semibold mb-3">
              {dayInfo.title}
            </h2>
            <p className="text-sm leading-relaxed opacity-90">
              {dayInfo.message}
            </p>
            <button
              type="button"
              onClick={handleDismiss}
              className="mt-6 px-6 py-2.5 rounded-full text-white text-sm font-medium shadow-md"
              style={{ backgroundColor: "var(--olw-rose)" }}
            >
              🤍
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
