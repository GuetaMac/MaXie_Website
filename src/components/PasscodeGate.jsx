import { useEffect, useRef, useState } from "react";
import PenguinMascot from "./PenguinMascot.jsx";

/**
 * PasscodeGate
 * -------------------------------------------------------------
 * A phone-lockscreen-style entrance. Your photo fills the screen,
 * a live clock ticks at the top like a real lockscreen, the penguin
 * hangs out near the bottom, and the "passcode" is the date the two
 * of you became official (MM · DD · YYYY). Get it right and the
 * screen unlocks into the real site.
 *
 * Usage (wrap your whole app, e.g. in App.jsx):
 *
 *   import PasscodeGate from "./components/PasscodeGate";
 *
 *   function App() {
 *     return (
 *       <PasscodeGate answer="07302026" names="Macky & Trixie">
 *         <YourExistingRoutesOrLayout />
 *       </PasscodeGate>
 *     );
 *   }
 *
 * Photo setup:
 *  1. Drop your photo into the `public` folder, e.g. public/lockscreen.jpg
 *  2. Pass it in: <PasscodeGate photoSrc="/lockscreen.jpg">
 *     (default below points at "/lockscreen.jpg" already)
 *
 * Props
 *  - answer      8-digit string MMDDYYYY. Defaults to 07302026.
 *  - photoSrc    path to your background photo (from the public folder).
 *  - storageKey  localStorage key to remember an unlock. Set to null
 *                (current default) so it asks every visit.
 *  - names       small caption near the bottom, e.g. "Macky & Trixie".
 */
function PasscodeGate({
  children,
  answer = "07302026",
  photoSrc = "/lockscreen.jpg",
  storageKey = null,
  names = "Macky & Trixie",
}) {
  const [unlocked, setUnlocked] = useState(false);
  const [checkedStorage, setCheckedStorage] = useState(false);
  const [digits, setDigits] = useState(Array(8).fill(""));
  const [status, setStatus] = useState("idle"); // idle | error | success
  const [now, setNow] = useState(new Date());
  const inputsRef = useRef([]);

  useEffect(() => {
    if (storageKey && typeof window !== "undefined") {
      const saved = window.localStorage.getItem(storageKey);
      if (saved === "true") setUnlocked(true);
    }
    setCheckedStorage(true);
  }, [storageKey]);

  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const focusInput = (i) => {
    const el = inputsRef.current[i];
    if (el) el.focus();
  };

  const handleChange = (i, value) => {
    const v = value.replace(/[^0-9]/g, "").slice(-1);
    setStatus("idle");
    setDigits((prev) => {
      const next = [...prev];
      next[i] = v;
      return next;
    });
    if (v && i < 7) focusInput(i + 1);
  };

  const handleKeyDown = (i, e) => {
    if (e.key === "Backspace" && !digits[i] && i > 0) {
      focusInput(i - 1);
    }
  };

  const handlePaste = (e) => {
    const text = e.clipboardData.getData("text").replace(/[^0-9]/g, "");
    if (!text) return;
    e.preventDefault();
    const next = Array(8).fill("");
    text
      .slice(0, 8)
      .split("")
      .forEach((ch, idx) => (next[idx] = ch));
    setDigits(next);
    focusInput(Math.min(text.length, 7));
  };

  const attempt = () => {
    const code = digits.join("");
    if (code.length < 8) {
      setStatus("error");
      return;
    }
    if (code === answer) {
      setStatus("success");
      window.setTimeout(() => {
        setUnlocked(true);
        if (storageKey && typeof window !== "undefined") {
          window.localStorage.setItem(storageKey, "true");
        }
      }, 900);
    } else {
      setStatus("error");
      setDigits(Array(8).fill(""));
      focusInput(0);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    attempt();
  };

  // Avoid a flash of the locked screen while we check localStorage.
  if (!checkedStorage) return null;

  if (unlocked) return children;

  const time = now.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
  const date = now.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="relative min-h-screen overflow-hidden bg-plum-700 font-body">
      {/* background photo */}
      <img
        src={photoSrc}
        alt=""
        aria-hidden="true"
        className="absolute inset-0 h-full w-full object-cover"
        style={{ objectPosition: "center 15%" }}
        onError={(e) => {
          e.currentTarget.style.display = "none";
        }}
      />
      {/* readability overlay — kept light so the photo stays visible,
          just enough for the text and card to read clearly */}
      <div className="absolute inset-0 bg-plum-700/10" />
      <div className="absolute inset-0 bg-gradient-to-b from-black/15 via-transparent to-black/45" />

      <div
        className={[
          "relative z-10 flex min-h-screen flex-col items-center justify-start pt-14 sm:pt-20 px-6 py-10 text-center transition-all duration-700",
          status === "success"
            ? "opacity-0 scale-105"
            : "opacity-100 scale-100",
        ].join(" ")}
      >
        {/* clock */}
        <div>
          <p
            className="font-display text-6xl sm:text-7xl font-semibold tabular-nums text-white"
            style={{ textShadow: "0 2px 12px rgba(0,0,0,0.45)" }}
          >
            {time}
          </p>
          <p
            className="mt-2 font-body text-sm uppercase tracking-[0.25em] text-white"
            style={{ textShadow: "0 1px 8px rgba(0,0,0,0.45)" }}
          >
            {date}
          </p>
        </div>

        <div
          className="mt-6 flex items-center gap-2 text-white"
          style={{ textShadow: "0 1px 8px rgba(0,0,0,0.45)" }}
        >
          <span className="text-rose-200">♥</span>
          <span className="font-display text-lg">{names}</span>
          <span className="text-rose-200">♥</span>
        </div>

        <div className="relative mt-10 w-full max-w-xs mx-auto">
          <div className="pointer-events-none absolute right-full bottom-6 mr-3 hidden sm:block">
            <PenguinMascot
              size={92}
              wrapperClassName="relative pointer-events-auto"
              bubbleSide="right"
            />
          </div>

          <form
            onSubmit={handleSubmit}
            className="w-full rounded-3xl border border-white/25 bg-white/15 px-6 py-6 backdrop-blur-sm"
          >
            <p className="font-body text-[11px] uppercase tracking-[0.2em] text-white/80 font-semibold mb-3">
              Enter the date it all began
            </p>

            <div
              className="flex items-center justify-center gap-1.5 mb-2"
              onPaste={handlePaste}
            >
              {digits.map((d, i) => (
                <span key={i} className="flex items-center">
                  {(i === 2 || i === 4) && (
                    <span className="mx-0.5 text-white/50 select-none">/</span>
                  )}
                  <input
                    ref={(el) => (inputsRef.current[i] = el)}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={d}
                    onChange={(e) => handleChange(i, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(i, e)}
                    aria-label={`digit ${i + 1}`}
                    className={[
                      "h-10 w-7 rounded-lg border text-center font-display text-base text-white outline-none transition-colors bg-white/10",
                      status === "error"
                        ? "border-rose-300 bg-rose-500/20"
                        : "border-white/30 focus:border-white/70",
                    ].join(" ")}
                  />
                </span>
              ))}
            </div>

            <p className="font-body text-[10px] text-white/60 mb-4">
              MM / DD / YYYY
            </p>

            {status === "error" && (
              <p className="font-body text-xs text-rose-200 mb-3">
                Hmm, that's not the date. Try again?
              </p>
            )}
            {status === "success" && (
              <p className="font-body text-xs text-rose-100 mb-3">
                That's the one. Unlocking…
              </p>
            )}

            <button
              type="submit"
              className="w-full rounded-full bg-white text-plum-700 text-sm font-body font-semibold py-3 transition-transform active:scale-95 hover:bg-white/90"
            >
              Unlock
            </button>
          </form>
        </div>

        <p className="mt-6 mb-2 font-body text-[11px] text-white/50">
          Our Little World
        </p>
      </div>
    </div>
  );
}

export default PasscodeGate;
