import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import PenguinMascot from "./PenguinMascot.jsx";

/**
 * PasscodeGate
 * -------------------------------------------------------------
 * A phone-lockscreen-style entrance. Your photo (or photos) fill the
 * screen, a live clock ticks at the top like a real lockscreen, the
 * penguin hangs out nearby, and the "passcode" is the date the two of
 * you became official — entered like a combination lock: three
 * scrollable wheels for Month / Day / Year.
 *
 * v4 additions on top of the wheel picker:
 *  - Sound + haptics: a soft generated tick on every wheel snap, a
 *    low buzz on a wrong guess, a little ascending chime + vibration
 *    on success. All generated in-browser (no audio files needed) and
 *    mutable via a small speaker toggle on the card.
 *  - Living background: the photo breathes with a slow, continuous
 *    Ken-Burns zoom/pan (works identically on touch and desktop, no
 *    permissions needed), and you can now pass an array of photos
 *    that cross-fade on a timer instead of a single static one.
 *  - A heart/sparkle burst plays across the card the instant the
 *    correct date is found, just before the unlock transition.
 *  - Accessibility: every wheel is keyboard-operable (Up/Down/Home/
 *    End once focused), the whole thing respects the OS-level
 *    "reduce motion" setting, and a hidden live region announces the
 *    currently-dialed date for screen readers.
 *  - The penguin now reacts with a little speech bubble that changes
 *    message the more times you miss — and it's visible on mobile
 *    too now (previously desktop-only), since that's where most
 *    visitors will actually be.
 *
 * Phases:
 *   booting    -> brief animated-penguin splash while the app spins up
 *   locked     -> the lockscreen with the wheel picker
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
 *  1. Drop your photo(s) into the `public` folder, e.g. public/lockscreen.jpg
 *  2. Pass one: <PasscodeGate photoSrc="/lockscreen.jpg">
 *     ...or several, which will cross-fade on a timer:
 *     <PasscodeGate photos={["/lockscreen-1.jpg", "/lockscreen-2.jpg"]}>
 *
 * Props
 *  - answer         8-digit string MMDDYYYY. Defaults to 07302026.
 *  - photoSrc        single background photo (from the public folder).
 *  - photos          optional array of photos to cross-fade between.
 *                     If provided, this takes priority over photoSrc.
 *  - photoCycleMs     how long each photo stays before cross-fading
 *                     (default 7000ms). Ignored with a single photo.
 *  - storageKey       localStorage key to remember an unlock. Set to
 *                     null (current default) so it asks every visit.
 *  - names            small caption near the bottom, e.g. "Macky & Trixie".
 *  - yearRange        [startYear, endYear] shown on the year wheel.
 *  - enableSound      master on/off for the tick/chime sounds (default true).
 *  - enableHaptics    master on/off for vibration feedback (default true).
 *  - enableParallax   master on/off for the background's Ken-Burns
 *                     zoom/pan (default true; works on any device and
 *                     is skipped automatically under reduced motion).
 */

const LockContext = createContext(() => {});

export function useLock() {
  return useContext(LockContext);
}

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

const REACTION_MESSAGES = [
  "Try again? 🥹",
  "So close, keep spinning 🌀",
  "Take your time, we've got all day 💛",
  "You'll get it, I believe in you 🐧",
];

const ITEM_HEIGHT = 40; // px, must match the inline styles below
const VISIBLE_COUNT = 5; // odd number so there's a true center row
const WHEEL_HEIGHT = ITEM_HEIGHT * VISIBLE_COUNT;
const PADDING = (WHEEL_HEIGHT - ITEM_HEIGHT) / 2;

// Visually hidden but still readable by screen readers.
const srOnlyStyle = {
  position: "absolute",
  width: 1,
  height: 1,
  padding: 0,
  margin: -1,
  overflow: "hidden",
  clip: "rect(0,0,0,0)",
  whiteSpace: "nowrap",
  border: 0,
};

function useReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const handler = (e) => setReduced(e.matches);
    if (mq.addEventListener) mq.addEventListener("change", handler);
    else mq.addListener(handler);
    return () => {
      if (mq.removeEventListener) mq.removeEventListener("change", handler);
      else mq.removeListener(handler);
    };
  }, []);
  return reduced;
}

function FloatingHearts({ count = 6, reducedMotion }) {
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
            opacity: reducedMotion ? 0.4 : undefined,
            animation: reducedMotion
              ? undefined
              : `float-heart ${2.6 + (i % 3) * 0.5}s ease-in infinite`,
            animationDelay: reducedMotion ? undefined : `${i * 0.35}s`,
          }}
        >
          ♥
        </span>
      ))}
    </div>
  );
}

function PenguinLoadingScreen({ heading, sublabel, reducedMotion }) {
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

      <FloatingHearts reducedMotion={reducedMotion} />

      <div
        style={
          reducedMotion
            ? undefined
            : { animation: "bob 1.6s ease-in-out infinite" }
        }
      >
        <PenguinMascot
          size={110}
          wrapperClassName="relative"
          bubbleSide="right"
        />
      </div>

      <p
        className="mt-6 font-display text-xl text-white"
        style={
          reducedMotion
            ? undefined
            : { animation: "fade-in 0.6s ease both", animationDelay: "0.2s" }
        }
      >
        {heading}
      </p>
      {sublabel && (
        <p
          className="mt-1 font-body text-sm text-white/70"
          style={
            reducedMotion
              ? undefined
              : { animation: "fade-in 0.6s ease both", animationDelay: "0.35s" }
          }
        >
          {sublabel}
        </p>
      )}
    </div>
  );
}

/**
 * Cross-fading background photo(s) with a slow, continuous Ken-Burns
 * style breathing zoom/pan. Chosen over mouse-driven parallax because
 * it works identically on touch devices, needs zero permissions
 * (no gyroscope prompt), and never sits static-and-flat on mobile,
 * which is where most visitors will actually be.
 */
function BackgroundPhotos({ photos, currentIndex, reducedMotion }) {
  return (
    <div className="absolute inset-0 overflow-hidden" aria-hidden="true">
      <style>{`
        @keyframes kenburns-a {
          0%   { transform: scale(1)     translate(0%, 0%); }
          100% { transform: scale(1.12)  translate(-2%, -1.5%); }
        }
        @keyframes kenburns-b {
          0%   { transform: scale(1.06)  translate(-1%, 1%); }
          100% { transform: scale(1.16)  translate(1.5%, -2%); }
        }
      `}</style>
      {photos.map((src, i) => (
        <img
          key={src + i}
          src={src}
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
          style={{
            objectPosition: "center 15%",
            opacity: i === currentIndex ? 1 : 0,
            transition: "opacity 1.4s ease-in-out",
            animation: reducedMotion
              ? undefined
              : `${i % 2 === 0 ? "kenburns-a" : "kenburns-b"} 22s ease-in-out infinite alternate`,
            transform: reducedMotion ? "scale(1.03)" : undefined,
          }}
          onError={(e) => {
            e.currentTarget.style.display = "none";
          }}
        />
      ))}
    </div>
  );
}

/** Small speech-bubble that shows the penguin's reaction to wrong guesses. */
function ReactionBubble({ show, message }) {
  return (
    <div
      className={[
        "pointer-events-none absolute -top-2 left-1/2 z-10 -translate-x-1/2 -translate-y-full whitespace-nowrap rounded-2xl bg-white px-3 py-1.5 font-body text-[11px] font-medium text-plum-700 shadow-lg transition-all duration-300",
        show
          ? "translate-y-[-100%] scale-100 opacity-100"
          : "scale-90 opacity-0",
      ].join(" ")}
      aria-hidden="true"
    >
      {message}
      <span className="absolute left-1/2 top-full h-2 w-2 -translate-x-1/2 -translate-y-1/2 rotate-45 bg-white" />
    </div>
  );
}

/** Heart/sparkle particles that burst outward from the card on success. */
function SuccessBurst({ particles }) {
  if (!particles.length) return null;
  return (
    <div
      className="pointer-events-none absolute inset-0 z-20 overflow-hidden rounded-3xl"
      aria-hidden="true"
    >
      <style>{`
        @keyframes burst-out {
          0% { transform: translate(-50%, -50%) scale(0.4); opacity: 0; }
          15% { opacity: 1; }
          100% { transform: translate(calc(-50% + var(--dx)), calc(-50% + var(--dy))) scale(1); opacity: 0; }
        }
      `}</style>
      {particles.map((p) => (
        <span
          key={p.id}
          className="absolute left-1/2 top-1/2 text-lg"
          style={{
            "--dx": `${p.dx}px`,
            "--dy": `${p.dy}px`,
            animation: `burst-out 0.9s ease-out ${p.delay}s both`,
          }}
        >
          {p.emoji}
        </span>
      ))}
    </div>
  );
}

/**
 * One scrollable, snap-to-item wheel. Fully self-contained: manages
 * its own scroll position, settles on the nearest item after the
 * user stops scrolling, and reports the settled value via onChange.
 * Also keyboard-operable (Up/Down/Home/End) once focused.
 */
function WheelColumn({
  items,
  index,
  onChange,
  ariaLabel,
  widthClass,
  reducedMotion,
}) {
  const containerRef = useRef(null);
  const settleTimer = useRef(null);
  const isProgrammatic = useRef(false);

  // Position on mount only; the wheel then manages its own scroll.
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    isProgrammatic.current = true;
    el.scrollTo({ top: index * ITEM_HEIGHT, behavior: "auto" });
    const id = window.setTimeout(() => {
      isProgrammatic.current = false;
    }, 50);
    return () => window.clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleScroll = () => {
    if (isProgrammatic.current) return;
    if (settleTimer.current) window.clearTimeout(settleTimer.current);
    settleTimer.current = window.setTimeout(() => {
      const el = containerRef.current;
      if (!el) return;
      const raw = el.scrollTop / ITEM_HEIGHT;
      const nearest = Math.min(items.length - 1, Math.max(0, Math.round(raw)));
      el.scrollTo({
        top: nearest * ITEM_HEIGHT,
        behavior: reducedMotion ? "auto" : "smooth",
      });
      if (nearest !== index) onChange(nearest);
    }, 90);
  };

  const jumpTo = (i) => {
    const el = containerRef.current;
    if (!el) return;
    const clamped = Math.min(items.length - 1, Math.max(0, i));
    isProgrammatic.current = true;
    el.scrollTo({
      top: clamped * ITEM_HEIGHT,
      behavior: reducedMotion ? "auto" : "smooth",
    });
    onChange(clamped);
    window.setTimeout(() => {
      isProgrammatic.current = false;
    }, 350);
  };

  const handleKeyDown = (e) => {
    if (e.key === "ArrowUp") {
      e.preventDefault();
      jumpTo(index - 1);
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      jumpTo(index + 1);
    } else if (e.key === "Home") {
      e.preventDefault();
      jumpTo(0);
    } else if (e.key === "End") {
      e.preventDefault();
      jumpTo(items.length - 1);
    }
  };

  return (
    <div
      className={["relative", widthClass].join(" ")}
      style={{ height: WHEEL_HEIGHT }}
    >
      <div
        ref={containerRef}
        role="listbox"
        aria-label={ariaLabel}
        tabIndex={0}
        onScroll={handleScroll}
        onKeyDown={handleKeyDown}
        className="wheel-scroll h-full overflow-y-auto rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
        style={{
          scrollSnapType: "y mandatory",
          scrollbarWidth: "none",
          msOverflowStyle: "none",
        }}
      >
        <div style={{ height: PADDING }} aria-hidden="true" />
        {items.map((label, i) => (
          <div
            key={label}
            role="option"
            aria-selected={i === index}
            onClick={() => jumpTo(i)}
            className={[
              "flex cursor-pointer select-none items-center justify-center font-display transition-all duration-150",
              i === index
                ? "text-lg text-white opacity-100"
                : "text-base text-white/40 opacity-70",
            ].join(" ")}
            style={{ height: ITEM_HEIGHT, scrollSnapAlign: "center" }}
          >
            {label}
          </div>
        ))}
        <div style={{ height: PADDING }} aria-hidden="true" />
      </div>

      <div
        className="pointer-events-none absolute inset-x-0 top-0 bg-gradient-to-b from-plum-700/70 to-transparent"
        style={{ height: PADDING }}
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-plum-700/70 to-transparent"
        style={{ height: PADDING }}
        aria-hidden="true"
      />
    </div>
  );
}

function DateWheelPicker({
  month,
  day,
  year,
  monthOptions,
  dayOptions,
  yearOptions,
  onChangeMonth,
  onChangeDay,
  onChangeYear,
  shake,
  reducedMotion,
}) {
  return (
    <div
      className={[
        "relative flex items-stretch justify-center gap-1",
        shake && !reducedMotion ? "animate-[shake_0.45s_ease]" : "",
      ].join(" ")}
    >
      <style>{`
        @keyframes shake {
          10%, 90% { transform: translateX(-1px); }
          20%, 80% { transform: translateX(2px); }
          30%, 50%, 70% { transform: translateX(-5px); }
          40%, 60% { transform: translateX(5px); }
        }
        .wheel-scroll::-webkit-scrollbar { display: none; }
      `}</style>

      <div
        className="pointer-events-none absolute inset-x-0 rounded-xl border border-white/70 bg-white/10 shadow-[0_0_0_3px_rgba(255,255,255,0.12)]"
        style={{ top: PADDING, height: ITEM_HEIGHT }}
        aria-hidden="true"
      />

      <WheelColumn
        items={monthOptions}
        index={month}
        onChange={onChangeMonth}
        ariaLabel="Month"
        widthClass="w-16"
        reducedMotion={reducedMotion}
      />
      <div className="flex flex-col items-center justify-center px-0.5 text-white/40">
        /
      </div>
      <WheelColumn
        items={dayOptions}
        index={day}
        onChange={onChangeDay}
        ariaLabel="Day"
        widthClass="w-12"
        reducedMotion={reducedMotion}
      />
      <div className="flex flex-col items-center justify-center px-0.5 text-white/40">
        /
      </div>
      <WheelColumn
        items={yearOptions}
        index={year}
        onChange={onChangeYear}
        ariaLabel="Year"
        widthClass="w-16"
        reducedMotion={reducedMotion}
      />
    </div>
  );
}

function PasscodeGate({
  children,
  answer = "07302026",
  photoSrc = "/lockscreen.jpg",
  photos,
  photoCycleMs = 7000,
  storageKey = null,
  names = "Macky & Trixie",
  yearRange,
  enableSound = true,
  enableHaptics = true,
  enableParallax = true,
}) {
  const [phase, setPhase] = useState("booting"); // booting | locked | unlocking | unlocked
  const [status, setStatus] = useState("idle"); // idle | error | success
  const [shake, setShake] = useState(false);
  const [now, setNow] = useState(new Date());
  const [wrongAttempts, setWrongAttempts] = useState(0);
  const [feedbackOn, setFeedbackOn] = useState(true);
  const [photoIndex, setPhotoIndex] = useState(0);
  const [burstParticles, setBurstParticles] = useState([]);
  const [liveText, setLiveText] = useState("");

  const reducedMotion = useReducedMotion();
  const audioCtxRef = useRef(null);

  const photoList = useMemo(
    () => (photos && photos.length ? photos : [photoSrc]),
    [photos, photoSrc],
  );

  const currentYear = now.getFullYear();
  const [startYear, endYear] = yearRange || [currentYear - 12, currentYear + 4];

  const yearOptions = useMemo(() => {
    const arr = [];
    for (let y = startYear; y <= endYear; y++) arr.push(String(y));
    return arr;
  }, [startYear, endYear]);

  const dayOptions = useMemo(
    () => Array.from({ length: 31 }, (_, i) => String(i + 1).padStart(2, "0")),
    [],
  );

  // Wheel indices start on today's date (a neutral position — not the
  // answer), so the correct combination isn't given away for free.
  const [monthIdx, setMonthIdx] = useState(now.getMonth());
  const [dayIdx, setDayIdx] = useState(now.getDate() - 1);
  const [yearIdx, setYearIdx] = useState(
    Math.min(yearOptions.length - 1, Math.max(0, currentYear - startYear)),
  );

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

  // Cross-fade through multiple background photos, if provided.
  useEffect(() => {
    if (photoList.length < 2) return;
    const id = window.setInterval(() => {
      setPhotoIndex((i) => (i + 1) % photoList.length);
    }, photoCycleMs);
    return () => window.clearInterval(id);
  }, [photoList, photoCycleMs]);

  // Screen-reader announcement of the currently-dialed date.
  useEffect(() => {
    if (phase !== "locked") return;
    setLiveText(
      `${MONTHS[monthIdx]} ${dayOptions[dayIdx]}, ${yearOptions[yearIdx]}`,
    );
  }, [monthIdx, dayIdx, yearIdx, phase, dayOptions, yearOptions]);

  const ensureAudioCtx = () => {
    if (typeof window === "undefined") return null;
    if (!audioCtxRef.current) {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return null;
      audioCtxRef.current = new Ctx();
    }
    if (audioCtxRef.current.state === "suspended") {
      audioCtxRef.current.resume();
    }
    return audioCtxRef.current;
  };

  const playTone = (freq, duration = 0.06, volume = 0.05) => {
    if (!enableSound || !feedbackOn) return;
    const ctx = ensureAudioCtx();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(volume, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);
    osc.connect(gain).connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + duration);
  };

  const vibrate = (pattern) => {
    if (!enableHaptics || !feedbackOn) return;
    if (typeof navigator !== "undefined" && navigator.vibrate) {
      navigator.vibrate(pattern);
    }
  };

  const triggerShake = () => {
    setShake(true);
    window.setTimeout(() => setShake(false), 450);
  };

  const spawnBurst = () => {
    const count = 16;
    const particles = Array.from({ length: count }, (_, i) => {
      const angle = (Math.PI * 2 * i) / count + Math.random() * 0.3;
      const distance = 70 + Math.random() * 50;
      return {
        id: `${i}-${Date.now()}`,
        dx: Math.cos(angle) * distance,
        dy: Math.sin(angle) * distance,
        emoji: Math.random() > 0.45 ? "♥" : "✦",
        delay: Math.random() * 0.15,
      };
    });
    setBurstParticles(particles);
    window.setTimeout(() => setBurstParticles([]), 1200);
  };

  const attempt = () => {
    const mm = String(monthIdx + 1).padStart(2, "0");
    const dd = dayOptions[dayIdx];
    const yyyy = yearOptions[yearIdx];
    const code = `${mm}${dd}${yyyy}`;

    if (code === answer) {
      setStatus("success");
      setWrongAttempts(0);
      playTone(880, 0.08);
      window.setTimeout(() => playTone(1175, 0.12), 100);
      vibrate([15, 40, 15, 40, 30]);
      if (!reducedMotion) spawnBurst();
      window.setTimeout(() => {
        setPhase("unlocking");
        window.setTimeout(() => {
          setPhase("unlocked");
          if (storageKey && typeof window !== "undefined") {
            window.localStorage.setItem(storageKey, "true");
          }
        }, 1900);
      }, 500);
    } else {
      setStatus("error");
      setWrongAttempts((n) => n + 1);
      playTone(200, 0.18, 0.06);
      vibrate([50, 40, 50]);
      triggerShake();
    }
  };

  const handleWheelChange = (setter, freq) => (i) => {
    setStatus("idle");
    setter(i);
    playTone(freq, 0.05, 0.035);
    vibrate(6);
  };

  const lock = () => {
    setPhase("locked");
    setStatus("idle");
    setWrongAttempts(0);
    if (storageKey && typeof window !== "undefined") {
      window.localStorage.removeItem(storageKey);
    }
  };

  if (phase === "booting") {
    return (
      <PenguinLoadingScreen
        heading="Loading our little world..."
        sublabel="One moment"
        reducedMotion={reducedMotion}
      />
    );
  }

  if (phase === "unlocking") {
    return (
      <PenguinLoadingScreen
        heading="That's the date. Unlocking..."
        sublabel={names}
        reducedMotion={reducedMotion}
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
  const reactionMessage =
    REACTION_MESSAGES[
      Math.min(Math.max(wrongAttempts - 1, 0), REACTION_MESSAGES.length - 1)
    ];

  return (
    <div className="relative min-h-screen overflow-hidden bg-plum-700 font-body">
      <p style={srOnlyStyle} aria-live="polite">
        {liveText}
      </p>

      <BackgroundPhotos
        photos={photoList}
        currentIndex={photoIndex}
        reducedMotion={enableParallax ? reducedMotion : true}
      />
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

        {/* penguin — small, above the card, visible on mobile too */}
        <div className="relative mt-4 inline-block sm:hidden">
          <PenguinMascot
            size={60}
            wrapperClassName="relative"
            bubbleSide="right"
          />
          <ReactionBubble show={status === "error"} message={reactionMessage} />
        </div>

        <div className="relative mx-auto mt-6 w-full max-w-xs sm:mt-10">
          {/* penguin — larger, beside the card on bigger screens */}
          <div className="pointer-events-none absolute bottom-6 right-full mr-3 hidden sm:block">
            <div className="relative pointer-events-auto">
              <PenguinMascot
                size={92}
                wrapperClassName="relative"
                bubbleSide="right"
              />
              <ReactionBubble
                show={status === "error"}
                message={reactionMessage}
              />
            </div>
          </div>

          <div className="relative w-full rounded-3xl border border-white/25 bg-white/15 px-6 py-6 backdrop-blur-sm">
            <SuccessBurst particles={burstParticles} />

            <button
              type="button"
              onClick={() => setFeedbackOn((v) => !v)}
              aria-label={
                feedbackOn
                  ? "Mute sound and haptics"
                  : "Enable sound and haptics"
              }
              className="absolute right-3 top-3 z-10 rounded-full bg-white/15 px-2 py-1 text-xs text-white/80 backdrop-blur-sm transition hover:bg-white/25"
            >
              {feedbackOn ? "🔊" : "🔇"}
            </button>

            <p className="mb-4 font-body text-[11px] font-semibold uppercase tracking-[0.2em] text-white/80">
              Dial in the date it all began
            </p>

            <DateWheelPicker
              month={monthIdx}
              day={dayIdx}
              year={yearIdx}
              monthOptions={MONTHS}
              dayOptions={dayOptions}
              yearOptions={yearOptions}
              onChangeMonth={handleWheelChange(setMonthIdx, 880)}
              onChangeDay={handleWheelChange(setDayIdx, 740)}
              onChangeYear={handleWheelChange(setYearIdx, 660)}
              shake={shake}
              reducedMotion={reducedMotion}
            />

            <p
              aria-live="polite"
              className="mb-3 mt-3 min-h-[1rem] font-body text-xs"
            >
              {status === "error" && (
                <span className="text-rose-200">
                  Hmm, that's not the date. Spin again?
                </span>
              )}
              {status === "success" && (
                <span className="text-rose-100">
                  That's the one. Unlocking…
                </span>
              )}
            </p>

            <button
              type="button"
              onClick={attempt}
              disabled={status === "success"}
              className="w-full rounded-full bg-white py-3 font-body text-sm font-semibold text-plum-700 transition-transform hover:bg-white/90 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Unlock
            </button>
          </div>
        </div>

        <p className="mb-2 mt-6 font-body text-[11px] text-white/50">
          Our Little World
        </p>
      </div>
    </div>
  );
}

export default PasscodeGate;
