import { useState } from "react";

// A little pool of cute things the penguin can say when tapped.
const penguinMessages = [
  "I love you!",
  "Waddle you doing later?",
  "Thinking of you.",
  "You're my favorite person.",
  "Hi bebe!",
  "Miss you already.",
];

/**
 * A small hand-drawn penguin mascot.
 * Bobs gently on its own, wiggles and shows a cute message on click.
 * Pure SVG + Tailwind — no emoji, no icon library.
 *
 * Props:
 *  - size       pixel size of the penguin (default 52, same as before)
 *  - wrapperClassName  positioning classes for the outer wrapper.
 *               Defaults to the original hero corner placement so
 *               existing usages (e.g. on the Home page) don't change.
 *               Pass "relative" (or similar) to drop it in-flow
 *               instead, e.g. for the lockscreen.
 *  - bubbleSide "left" | "right" — which side the speech bubble
 *               points from. Default "right" (original behavior).
 *  - mood       "neutral" | "happy" | "risk". Reflects the streak
 *               status. "happy" adds a small flame badge (SVG, no
 *               emoji). "risk" makes the idle animation a gentle
 *               continuous shiver instead of the usual bob. Default
 *               "neutral" — identical to the original behavior.
 *  - extraMessage  optional streak-aware line that gets folded into
 *               the random message pool when the penguin is tapped.
 */
function PenguinMascot({
  size = 52,
  wrapperClassName = "absolute bottom-3 right-4 sm:bottom-6 sm:right-10",
  bubbleSide = "right",
  mood = "neutral",
  extraMessage,
}) {
  const [message, setMessage] = useState(penguinMessages[0]);
  const [showMessage, setShowMessage] = useState(false);
  const [isWiggling, setIsWiggling] = useState(false);

  function handleClick() {
    const pool = extraMessage
      ? [extraMessage, ...penguinMessages]
      : penguinMessages;
    const next = pool[Math.floor(Math.random() * pool.length)];
    setMessage(next);
    setShowMessage(true);
    setIsWiggling(true);

    window.setTimeout(() => setIsWiggling(false), 500);
    window.setTimeout(() => setShowMessage(false), 2600);
  }

  const bubbleAlign = bubbleSide === "left" ? "left-0" : "right-0";
  const bubbleTailAlign = bubbleSide === "left" ? "left-5" : "right-5";
  const idleAnimClass =
    mood === "risk" ? "olw-penguin-shiver" : "animate-gentle-bob";

  return (
    <div className={`${wrapperClassName} select-none`}>
      {/* local keyframes for mood states — self-contained, same pattern
          as the hero's ambient hearts, no tailwind.config changes needed */}
      <style>{`
        @keyframes olw-penguin-shiver {
          0%, 100% { transform: rotate(-3deg); }
          50% { transform: rotate(3deg); }
        }
        .olw-penguin-shiver { animation: olw-penguin-shiver 0.35s ease-in-out infinite; }

        @keyframes olw-flame-pop {
          0% { opacity: 0; transform: scale(0.4) translateY(4px); }
          60% { opacity: 1; transform: scale(1.15) translateY(0); }
          100% { opacity: 1; transform: scale(1) translateY(0); }
        }
        .olw-flame-pop { animation: olw-flame-pop 0.4s ease-out; }

        @media (prefers-reduced-motion: reduce) {
          .olw-penguin-shiver, .olw-flame-pop { animation: none; }
        }
      `}</style>

      {showMessage && (
        <div
          className={`animate-fade-in-up absolute bottom-full ${bubbleAlign} mb-3 w-max max-w-[9.5rem] rounded-2xl border border-rose-100 bg-white px-3 py-2 text-xs font-semibold text-plum-600 shadow-md`}
        >
          {message}
          <span
            className={`absolute -bottom-1 ${bubbleTailAlign} h-2 w-2 rotate-45 border-b border-r border-rose-100 bg-white`}
          />
        </div>
      )}

      <div className="relative inline-block">
        <button
          type="button"
          onClick={handleClick}
          aria-label="Say hi to the penguin"
          className={`block transition-transform duration-200 hover:scale-110 active:scale-95 ${
            isWiggling ? "animate-wiggle" : idleAnimClass
          }`}
          style={
            mood === "risk"
              ? { filter: "drop-shadow(0 0 5px rgba(111,169,182,0.55))" }
              : undefined
          }
        >
          <svg
            width={size}
            height={size}
            viewBox="0 0 64 64"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            {/* feet */}
            <ellipse cx="24" cy="58" rx="5.5" ry="3" fill="#E8748F" />
            <ellipse cx="40" cy="58" rx="5.5" ry="3" fill="#E8748F" />
            {/* body */}
            <ellipse cx="32" cy="36" rx="18" ry="22" fill="#4A3546" />
            {/* wings */}
            <ellipse
              cx="15"
              cy="34"
              rx="5"
              ry="12"
              fill="#4A3546"
              transform="rotate(-15 15 34)"
            />
            <ellipse
              cx="49"
              cy="34"
              rx="5"
              ry="12"
              fill="#4A3546"
              transform="rotate(15 49 34)"
            />
            {/* belly */}
            <ellipse cx="32" cy="40" rx="11" ry="15" fill="#FFF7F5" />
            {/* blush */}
            <circle cx="20" cy="27" r="2.4" fill="#F79BB0" opacity="0.7" />
            <circle cx="44" cy="27" r="2.4" fill="#F79BB0" opacity="0.7" />
            {/* eyes */}
            <circle cx="26" cy="23" r="2.3" fill="#3A2938" />
            <circle cx="38" cy="23" r="2.3" fill="#3A2938" />
            {/* beak */}
            <path d="M28 28 Q32 33 36 28 Q32 30.5 28 28 Z" fill="#E8748F" />
          </svg>
        </button>

        {mood === "happy" && (
          <svg
            className="olw-flame-pop absolute -top-1 -right-1 pointer-events-none"
            width={Math.round(size * 0.34)}
            height={Math.round(size * 0.34)}
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
          >
            <path
              d="M12 2c1 3-2 4-2 7a4 4 0 108 0c0-1-1-2-1-2 1 2-.5 3-1.5 3 1-2-1-3-1-4 0 2-2 2-2 4a2 2 0 11-4 0c0-2 1.5-3 1.5-6C10 3 11 2 12 2Z"
              fill="#DE8A4C"
            />
          </svg>
        )}
      </div>
    </div>
  );
}

export default PenguinMascot;
