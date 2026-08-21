import { createContext, useContext, useEffect, useRef, useState } from "react";
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
 * Phases:
 *   booting    -> brief animated-penguin splash while the app spins up
 *   locked     -> the lockscreen with the code inputs
 *   unlocking  -> animated-penguin celebration after a correct code
 *   unlocked   -> renders children, wrapped in a context that exposes
 *                 lock() so any child (e.g. a "sign out" button in the
 *                 navbar) can send the visitor back to the lockscreen.
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
 * To add a sign-out button anywhere inside the app:
 *
 *   import { useLock } from "./components/PasscodeGate";
 *   const lock = useLock();
 *   <button onClick={lock}>Sign out</button>
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

const LockContext = createContext(() => {});

export function useLock() {
  return useContext(LockContext);
}

function FloatingHearts({ count = 6 }) {
  const hearts = Array.from({ length: count });
  return (
    <div
      className="pointer-events-none absolute inset-0 overflow-hidden"
      aria-hidden="true"
    >
      {hearts.map((_, i) => (
        <span
          key={i}
          className="absolute bottom-8 text-rose-200"
          style={{
            left: `${12 + ((i * 71) % 76)}%`,
            fontSize: `${12 + (i % 3) * 6}px`,
            animation: `float-heart ${2.6 + (i % 3) * 0.5}s ease-in infinite`,
            animationDelay: `${i * 0.35}s`,
          }}
        >
          ♥
        </span>
      ))}
    </div>
  );
}

function PenguinLoadingScreen({ heading, sublabel }) {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-plum-700 px-6 text-center">
      <style>{`
        @keyframes float-heart {
          0% { transform: translateY(0) scale(0.7); opacity: 0; }
          15% { opacity: 1; }
          100% { transform: translateY(-160px) scale(1.1); opacity: 0; }
        }
        @keyframes bob {
          0%, 100% { transform: translateY(0) rotate(-3deg); }
          50% { transform: translateY(-12px) rotate(3deg); }
        }
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <FloatingHearts />

      <div style={{ animation: "bob 1.6s ease-in-out infinite" }}>
        <PenguinMascot
          size={110}
          wrapperClassName="relative"
          bubbleSide="right"
        />
      </div>

      <p
        className="mt-6 font-display text-xl text-white"
        style={{ animation: "fade-in 0.6s ease both", animationDelay: "0.2s" }}
      >
        {heading}
      </p>
      {sublabel && (
        <p
          className="mt-1 font-body text-sm text-white/70"
          style={{
            animation: "fade-in 0.6s ease both",
            animationDelay: "0.35s",
          }}
        >
          {sublabel}
        </p>
      )}
    </div>
  );
}

function PasscodeGate({
  children,
  answer = "07302026",
  photoSrc = "/lockscreen.jpg",
  storageKey = null,
  names = "Macky & Trixie",
}) {
  const [phase, setPhase] = useState("booting"); // booting | locked | unlocking | unlocked
  const [digits, setDigits] = useState(Array(8).fill(""));
  const [status, setStatus] = useState("idle"); // idle | error | success
  const [now, setNow] = useState(new Date());
  const inputsRef = useRef([]);

  // Brief boot splash, then land on the lockscreen (or straight through
  // if a previous visit was remembered via storageKey).
  useEffect(() => {
    const alreadyUnlocked =
      storageKey &&
      typeof window !== "undefined" &&
      window.localStorage.getItem(storageKey) === "true";
    const id = window.setTimeout(() => {
      setPhase(alreadyUnlocked ? "unlocked" : "locked");
    }, 1200);
    return () => window.clearTimeout(id);
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
      // let the "that's the one" message show briefly, then hand off to
      // the penguin celebration screen before revealing the site
      window.setTimeout(() => {
        setPhase("unlocking");
        window.setTimeout(() => {
          setPhase("unlocked");
          if (storageKey && typeof window !== "undefined") {
            window.localStorage.setItem(storageKey, "true");
          }
        }, 1900);
      }, 650);
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

  const lock = () => {
    setPhase("locked");
    setStatus("idle");
    setDigits(Array(8).fill(""));
    if (storageKey && typeof window !== "undefined") {
      window.localStorage.removeItem(storageKey);
    }
  };

  if (phase === "booting") {
    return (
      <PenguinLoadingScreen
        heading="Loading our little world..."
        sublabel="One moment"
      />
    );
  }

  if (phase === "unlocking") {
    return (
      <PenguinLoadingScreen
        heading="That's the date. Unlocking..."
        sublabel={names}
      />
    );
  }

  if (phase === "unlocked") {
    return <LockContext.Provider value={lock}>{children}</LockContext.Provider>;
  }

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

      <div className="relative z-10 flex min-h-screen flex-col items-center justify-start px-6 py-10 pt-14 text-center sm:pt-20">
        {/* clock */}
        <div>
          <p
            className="font-display text-6xl font-semibold tabular-nums text-white sm:text-7xl"
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

        <div className="relative mx-auto mt-10 w-full max-w-xs">
          <div className="pointer-events-none absolute bottom-6 right-full mr-3 hidden sm:block">
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
            <p className="mb-3 font-body text-[11px] font-semibold uppercase tracking-[0.2em] text-white/80">
              Enter the date it all began
            </p>

            <div
              className="mb-2 flex items-center justify-center gap-1.5"
              onPaste={handlePaste}
            >
              {digits.map((d, i) => (
                <span key={i} className="flex items-center">
                  {(i === 2 || i === 4) && (
                    <span className="mx-0.5 select-none text-white/50">/</span>
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
                      "h-10 w-7 rounded-lg border bg-white/10 text-center font-display text-base text-white outline-none transition-colors",
                      status === "error"
                        ? "border-rose-300 bg-rose-500/20"
                        : "border-white/30 focus:border-white/70",
                    ].join(" ")}
                  />
                </span>
              ))}
            </div>

            <p className="mb-4 font-body text-[10px] text-white/60">
              MM / DD / YYYY
            </p>

            {status === "error" && (
              <p className="mb-3 font-body text-xs text-rose-200">
                Hmm, that's not the date. Try again?
              </p>
            )}
            {status === "success" && (
              <p className="mb-3 font-body text-xs text-rose-100">
                That's the one. Unlocking…
              </p>
            )}

            <button
              type="submit"
              className="w-full rounded-full bg-white py-3 font-body text-sm font-semibold text-plum-700 transition-transform hover:bg-white/90 active:scale-95"
            >
              Unlock
            </button>
          </form>
        </div>

        <p className="mb-2 mt-6 font-body text-[11px] text-white/50">
          Our Little World
        </p>
      </div>
    </div>
  );
}

export default PasscodeGate;
