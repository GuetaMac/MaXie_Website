import { useEffect, useState } from "react";
import { getSpecialDay, getDismissKey } from "../utils/specialDay.js";

const HEART_COUNT = 18;

function FallingHearts() {
  const hearts = Array.from({ length: HEART_COUNT }, (_, i) => i);
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {hearts.map((i) => {
        const left = Math.random() * 100;
        const delay = Math.random() * 4;
        const duration = 5 + Math.random() * 4;
        const size = 14 + Math.random() * 14;
        return (
          <span
            key={i}
            className="absolute top-[-40px] text-rose-300/80 dark:text-rose-300/50"
            style={{
              left: `${left}%`,
              fontSize: `${size}px`,
              animation: `sds-fall ${duration}s linear ${delay}s infinite`,
            }}
          >
            ❤
          </span>
        );
      })}
    </div>
  );
}

function SpecialDaySurprise() {
  const [special, setSpecial] = useState(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const found = getSpecialDay();
    if (!found) return;

    const key = getDismissKey();
    const alreadySeen = localStorage.getItem(key);
    if (alreadySeen) return;

    setSpecial(found);
    // Small delay so it feels like a reveal, not an instant flash.
    const t = setTimeout(() => setVisible(true), 300);
    return () => clearTimeout(t);
  }, []);

  function handleClose() {
    setVisible(false);
    setTimeout(() => {
      localStorage.setItem(getDismissKey(), "1");
      setSpecial(null);
    }, 250);
  }

  if (!special) return null;

  return (
    <div
      className={`fixed inset-0 z-[100] flex items-center justify-center bg-plum-900/60 backdrop-blur-sm px-4 transition-opacity duration-300 dark:bg-plum-950/70 ${
        visible ? "opacity-100" : "opacity-0"
      }`}
      onClick={handleClose}
    >
      <style>{`
        @keyframes sds-fall {
          0% { transform: translateY(-40px) rotate(0deg); opacity: 0; }
          10% { opacity: 1; }
          100% { transform: translateY(110vh) rotate(25deg); opacity: 0.9; }
        }
        @keyframes sds-pop {
          0% { transform: scale(0.85); opacity: 0; }
          60% { transform: scale(1.03); opacity: 1; }
          100% { transform: scale(1); opacity: 1; }
        }
        @media (prefers-reduced-motion: reduce) {
          .sds-card, [style*="sds-fall"] { animation: none !important; }
        }
      `}</style>

      <FallingHearts />

      <div
        onClick={(e) => e.stopPropagation()}
        style={{ animation: visible ? "sds-pop 0.5s ease both" : "none" }}
        className="sds-card relative w-full max-w-sm rounded-3xl border border-rose-100 bg-white p-8 text-center shadow-lg dark:border-plum-500/40 dark:bg-plum-800"
      >
        <span className="text-5xl">{special.icon}</span>
        <h2 className="mt-4 font-display text-2xl text-plum-700 sm:text-3xl dark:text-blush-50">
          {special.title}
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-plum-500 dark:text-blush-100">
          {special.message}
        </p>

        <button
          type="button"
          onClick={handleClose}
          className="mt-7 rounded-full bg-rose-400 px-6 py-2.5 text-sm font-semibold text-white transition-colors duration-200 hover:bg-rose-500"
        >
          🤍
        </button>
      </div>
    </div>
  );
}

export default SpecialDaySurprise;
