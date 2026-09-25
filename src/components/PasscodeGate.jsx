import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import PenguinMascot from "./PenguinMascot.jsx";

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

const ITEM_HEIGHT = 44;
const VISIBLE_COUNT = 5;
const WHEEL_HEIGHT = ITEM_HEIGHT * VISIBLE_COUNT;
const PADDING = (WHEEL_HEIGHT - ITEM_HEIGHT) / 2;

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

function FloatingHearts({ count = 8, reducedMotion }) {
  const hearts = Array.from({ length: count });
  return (
    <div
      className="pointer-events-none absolute inset-0 overflow-hidden z-0"
      aria-hidden="true"
    >
      {hearts.map((_, i) => (
        <span
          key={i}
          className="absolute bottom-4 text-rose-200/80 drop-shadow-sm select-none"
          style={{
            left: `${8 + ((i * 37) % 84)}%`,
            fontSize: `${14 + (i % 4) * 5}px`,
            opacity: reducedMotion ? 0.3 : undefined,
            animation: reducedMotion
              ? undefined
              : `float-heart ${3 + (i % 3) * 0.7}s cubic-bezier(0.4, 0, 0.2, 1) infinite`,
            animationDelay: reducedMotion ? undefined : `${i * 0.4}s`,
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
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-plum-700 px-6 text-center select-none">
      <style>{`
        @keyframes float-heart {
          0% { transform: translateY(0) scale(0.6) rotate(0deg); opacity: 0; }
          20% { opacity: 0.8; }
          100% { transform: translateY(-180px) scale(1.1) rotate(12deg); opacity: 0; }
        }
        @keyframes bob {
          0%, 100% { transform: translateY(0) rotate(-2deg); }
          50% { transform: translateY(-14px) rotate(2deg); }
        }
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <FloatingHearts reducedMotion={reducedMotion} />

      <div
        className="relative z-10"
        style={
          reducedMotion
            ? undefined
            : { animation: "bob 1.8s ease-in-out infinite" }
        }
      >
        <PenguinMascot
          size={110}
          wrapperClassName="relative filter drop-shadow-2xl"
          bubbleSide="right"
        />
      </div>

      <p
        className="mt-6 font-display text-2xl font-medium tracking-wide text-white drop-shadow-md z-10"
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
          className="mt-2 font-body text-sm tracking-wider text-rose-200/80 z-10"
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

function BackgroundPhotos({ photos, currentIndex, reducedMotion }) {
  return (
    <div
      className="absolute inset-0 overflow-hidden pointer-events-none"
      aria-hidden="true"
    >
      <style>{`
        @keyframes kenburns-a {
          0%   { transform: scale(1) translate(0%, 0%); }
          100% { transform: scale(1.12) translate(-1.5%, -1%); }
        }
        @keyframes kenburns-b {
          0%   { transform: scale(1.05) translate(-1%, 1%); }
          100% { transform: scale(1.15) translate(1%, -1.5%); }
        }
      `}</style>
      {photos.map((src, i) => (
        <img
          key={src + i}
          src={src}
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
          style={{
            objectPosition: "center 20%",
            opacity: i === currentIndex ? 1 : 0,
            transition: "opacity 1.6s cubic-bezier(0.4, 0, 0.2, 1)",
            animation: reducedMotion
              ? undefined
              : `${i % 2 === 0 ? "kenburns-a" : "kenburns-b"} 24s ease-in-out infinite alternate`,
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

function ReactionBubble({ show, message }) {
  return (
    <div
      className={[
        "pointer-events-none absolute -top-3 left-1/2 z-30 -translate-x-1/2 -translate-y-full whitespace-nowrap rounded-2xl bg-white/95 backdrop-blur-md px-3.5 py-2 font-body text-xs font-semibold text-plum-700 shadow-xl border border-white/60 transition-all duration-300",
        show
          ? "scale-100 opacity-100 translate-y-[-100%]"
          : "scale-80 opacity-0 translate-y-[-90%]",
      ].join(" ")}
      aria-hidden="true"
    >
      {message}
      <span className="absolute left-1/2 top-full h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rotate-45 bg-white/95 border-r border-b border-white/60" />
    </div>
  );
}

function SuccessBurst({ particles }) {
  if (!particles.length) return null;
  return (
    <div
      className="pointer-events-none absolute inset-0 z-40 overflow-hidden rounded-3xl"
      aria-hidden="true"
    >
      <style>{`
        @keyframes burst-out {
          0% { transform: translate(-50%, -50%) scale(0.3); opacity: 0; }
          20% { opacity: 1; }
          100% { transform: translate(calc(-50% + var(--dx)), calc(-50% + var(--dy))) scale(1.1); opacity: 0; }
        }
      `}</style>
      {particles.map((p) => (
        <span
          key={p.id}
          className="absolute left-1/2 top-1/2 text-xl drop-shadow-md"
          style={{
            "--dx": `${p.dx}px`,
            "--dy": `${p.dy}px`,
            animation: `burst-out 0.85s cubic-bezier(0.1, 0.8, 0.3, 1) ${p.delay}s both`,
          }}
        >
          {p.emoji}
        </span>
      ))}
    </div>
  );
}

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
    }, 80);
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
    }, 300);
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
        className="wheel-scroll h-full overflow-y-auto rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-white/80"
        style={{
          scrollSnapType: "y mandatory",
          scrollbarWidth: "none",
          msOverflowStyle: "none",
        }}
      >
        <div style={{ height: PADDING }} aria-hidden="true" />
        {items.map((label, i) => {
          const isSelected = i === index;
          return (
            <div
              key={label}
              role="option"
              aria-selected={isSelected}
              onClick={() => jumpTo(i)}
              className={[
                "flex cursor-pointer select-none items-center justify-center font-display transition-all duration-200",
                isSelected
                  ? "text-lg text-white font-bold drop-shadow-[0_2px_8px_rgba(255,255,255,0.6)] scale-105"
                  : "text-sm text-white/35 hover:text-white/60",
              ].join(" ")}
              style={{ height: ITEM_HEIGHT, scrollSnapAlign: "center" }}
            >
              {label}
            </div>
          );
        })}
        <div style={{ height: PADDING }} aria-hidden="true" />
      </div>

      <div
        className="pointer-events-none absolute inset-x-0 top-0 bg-gradient-to-b from-plum-700/80 via-plum-700/40 to-transparent z-10"
        style={{ height: PADDING }}
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-plum-700/80 via-plum-700/40 to-transparent z-10"
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
        "relative flex items-center justify-center gap-1 rounded-2xl bg-black/25 p-2 backdrop-blur-md border border-white/10 shadow-inner",
        shake && !reducedMotion ? "animate-[shake_0.45s_ease-in-out]" : "",
      ].join(" ")}
    >
      <style>{`
        @keyframes shake {
          10%, 90% { transform: translateX(-2px); }
          20%, 80% { transform: translateX(3px); }
          30%, 50%, 70% { transform: translateX(-6px); }
          40%, 60% { transform: translateX(6px); }
        }
        .wheel-scroll::-webkit-scrollbar { display: none; }
      `}</style>

      <div
        className="pointer-events-none absolute inset-x-3 rounded-xl border border-white/40 bg-white/15 shadow-[0_0_15px_rgba(255,255,255,0.15)] z-0"
        style={{ top: PADDING + 8, height: ITEM_HEIGHT }}
        aria-hidden="true"
      />

      <WheelColumn
        items={monthOptions}
        index={month}
        onChange={onChangeMonth}
        ariaLabel="Month"
        widthClass="w-20"
        reducedMotion={reducedMotion}
      />
      <div className="z-20 flex items-center justify-center font-light text-white/30 text-lg">
        /
      </div>
      <WheelColumn
        items={dayOptions}
        index={day}
        onChange={onChangeDay}
        ariaLabel="Day"
        widthClass="w-16"
        reducedMotion={reducedMotion}
      />
      <div className="z-20 flex items-center justify-center font-light text-white/30 text-lg">
        /
      </div>
      <WheelColumn
        items={yearOptions}
        index={year}
        onChange={onChangeYear}
        ariaLabel="Year"
        widthClass="w-20"
        reducedMotion={reducedMotion}
      />
    </div>
  );
}

export default function PasscodeGate({
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
  const [phase, setPhase] = useState("booting");
  const [status, setStatus] = useState("idle");
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

  const [monthIdx, setMonthIdx] = useState(now.getMonth());
  const [dayIdx, setDayIdx] = useState(now.getDate() - 1);
  const [yearIdx, setYearIdx] = useState(
    Math.min(yearOptions.length - 1, Math.max(0, currentYear - startYear)),
  );

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

  useEffect(() => {
    if (photoList.length < 2) return;
    const id = window.setInterval(() => {
      setPhotoIndex((i) => (i + 1) % photoList.length);
    }, photoCycleMs);
    return () => window.clearInterval(id);
  }, [photoList, photoCycleMs]);

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
    const count = 18;
    const particles = Array.from({ length: count }, (_, i) => {
      const angle = (Math.PI * 2 * i) / count + Math.random() * 0.3;
      const distance = 80 + Math.random() * 60;
      return {
        id: `${i}-${Date.now()}`,
        dx: Math.cos(angle) * distance,
        dy: Math.sin(angle) * distance,
        emoji: Math.random() > 0.4 ? "♥" : "✦",
        delay: Math.random() * 0.12,
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
        }, 1800);
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
    playTone(freq, 0.04, 0.03);
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
    <div className="relative min-h-screen overflow-hidden bg-plum-700 font-body select-none antialiased">
      <p style={srOnlyStyle} aria-live="polite">
        {liveText}
      </p>

      <BackgroundPhotos
        photos={photoList}
        currentIndex={photoIndex}
        reducedMotion={enableParallax ? reducedMotion : true}
      />

      <div className="absolute inset-0 bg-plum-700/20 backdrop-brightness-95" />
      <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/50" />

      <div className="relative z-10 flex min-h-screen flex-col items-center justify-between px-6 py-12 text-center">
        <div className="flex flex-col items-center pt-6 sm:pt-10">
          <p className="font-display text-6xl font-light tabular-nums tracking-tight text-white sm:text-7xl drop-shadow-[0_4px_16px_rgba(0,0,0,0.6)]">
            {time}
          </p>
          <p className="mt-2 font-body text-xs font-semibold uppercase tracking-[0.3em] text-rose-100/90 drop-shadow-[0_2px_8px_rgba(0,0,0,0.6)]">
            {date}
          </p>

          <div className="mt-4 flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 backdrop-blur-md border border-white/20 shadow-lg text-white">
            <span className="text-rose-200 text-xs">♥</span>
            <span className="font-display text-sm font-medium tracking-wide">
              {names}
            </span>
            <span className="text-rose-200 text-xs">♥</span>
          </div>
        </div>

        <div className="relative my-auto w-full max-w-xs">
          {/* GINAGAMIT NA ULIT ANG PenguinMascot FILE MO */}
          <div className="pointer-events-none absolute bottom-4 right-full mr-4 hidden sm:block">
            <div className="relative pointer-events-auto filter drop-shadow-xl">
              <PenguinMascot
                size={96}
                wrapperClassName="relative"
                bubbleSide="right"
              />
              <ReactionBubble
                show={status === "error"}
                message={reactionMessage}
              />
            </div>
          </div>

          <div className="relative mb-3 inline-block sm:hidden filter drop-shadow-lg">
            <PenguinMascot
              size={64}
              wrapperClassName="relative"
              bubbleSide="right"
            />
            <ReactionBubble
              show={status === "error"}
              message={reactionMessage}
            />
          </div>

          <div className="relative w-full rounded-3xl border border-white/25 bg-white/15 p-6 backdrop-blur-xl shadow-[0_16px_40px_rgba(0,0,0,0.4)]">
            <SuccessBurst particles={burstParticles} />

            <button
              type="button"
              onClick={() => setFeedbackOn((v) => !v)}
              aria-label={
                feedbackOn
                  ? "Mute sound and haptics"
                  : "Enable sound and haptics"
              }
              className="absolute right-4 top-4 z-20 flex h-7 w-7 items-center justify-center rounded-full bg-white/10 text-xs text-white/80 backdrop-blur-md border border-white/15 transition hover:bg-white/25 active:scale-90"
            >
              {feedbackOn ? "🔊" : "🔇"}
            </button>

            <p className="mb-4 text-center font-body text-[10px] font-bold uppercase tracking-[0.25em] text-white/80">
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
              className="mb-3 mt-3.5 min-h-[1.25rem] text-center font-body text-xs font-medium"
            >
              {status === "error" && (
                <span className="text-rose-200 drop-shadow">
                  Hmm, that's not the date. Spin again?
                </span>
              )}
              {status === "success" && (
                <span className="text-rose-100 drop-shadow">
                  That's the one. Unlocking…
                </span>
              )}
            </p>

            <button
              type="button"
              onClick={attempt}
              disabled={status === "success"}
              className="w-full rounded-2xl bg-white py-3.5 font-body text-sm font-bold text-plum-700 shadow-lg shadow-black/20 transition-all hover:bg-white/90 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
            >
              Unlock
            </button>
          </div>
        </div>

        <p className="font-body text-[11px] font-medium tracking-widest uppercase text-white/50 drop-shadow">
          Our Little World
        </p>
      </div>
    </div>
  );
}
