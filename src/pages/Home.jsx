import { useEffect, useState } from "react";
import FeatureCard from "../components/FeatureCard.jsx";
import PenguinMascot from "../components/PenguinMascot.jsx";

const features = [
  {
    to: "/our-story",
    index: "01",
    title: "Our Story",
    description: "How we met, our first date, and everything in between.",
  },
  {
    to: "/memories",
    index: "02",
    title: "Memories",
    description: "A little gallery of our favorite moments together.",
  },
  {
    to: "/open-when",
    index: "03",
    title: "Open When...",
    description: "Letters for the days you need them most.",
  },
  {
    to: "/mini-games",
    index: "04",
    title: "Mini Games",
    description: "Cute little games to play together.",
  },
  {
    to: "/calendar",
    index: "05",
    title: "Our Calendar",
    description: "Anniversaries, dates, and days worth remembering.",
  },
  {
    to: "/love-notes",
    index: "06",
    title: "Love Notes",
    description: "Sweet little notes just for you.",
  },
];

// Placeholder values — wire these up to real data later.
const names = "Macky & Trixie";
const togetherSinceDate = "July 30, 2026"; // <-- edit this to your real date
const togetherSince = new Date(togetherSinceDate).toLocaleDateString("en-US", {
  year: "numeric",
  month: "long",
  day: "numeric",
});

// A short rotating set of daily reminders so the homepage doesn't say
// the same line every time you open it. Add your own anytime.
const reminders = [
  "Don't forget that you're loved.",
  "Drink some water, then text me you did.",
  "Somewhere, I'm smiling because of you.",
  "You're doing better than you think you are.",
  "I miss you already.",
];

function getDaysTogether(startDate) {
  const start = new Date(startDate);
  const today = new Date();
  start.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);
  const diffMs = today - start;
  return Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
}

function getTodaysReminder() {
  const dayIndex = Math.floor(Date.now() / (1000 * 60 * 60 * 24));
  return reminders[dayIndex % reminders.length];
}

function Home() {
  const daysTogether = getDaysTogether(togetherSinceDate);
  const [visible, setVisible] = useState(false);
  const [reminder, setReminder] = useState(getTodaysReminder);

  useEffect(() => {
    const t = window.setTimeout(() => setVisible(true), 60);
    return () => window.clearTimeout(t);
  }, []);

  const fadeUp = () =>
    [
      "transition-all duration-700 ease-out",
      visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3",
    ].join(" ");

  function handleShuffleReminder() {
    setReminder((current) => {
      const others = reminders.filter((line) => line !== current);
      return others[Math.floor(Math.random() * others.length)];
    });
  }

  return (
    <div>
      {/* local keyframes for the hero's ambient hearts — self-contained,
          no changes needed to index.css or tailwind.config */}
      <style>{`
        @keyframes olw-drift {
          0%   { transform: translateY(0) rotate(0deg); opacity: 0; }
          10%  { opacity: 0.5; }
          90%  { opacity: 0.5; }
          100% { transform: translateY(-140px) rotate(12deg); opacity: 0; }
        }
        .olw-heart {
          animation: olw-drift 9s ease-in-out infinite;
        }
        @media (prefers-reduced-motion: reduce) {
          .olw-heart { animation: none; opacity: 0.25; }
        }
      `}</style>

      {/* Hero */}
      <section
        style={{ transitionDelay: "0ms" }}
        className={`relative overflow-hidden rounded-3xl border border-rose-100 bg-white px-6 py-10 sm:px-12 sm:py-12 text-center mb-10 ${fadeUp()}`}
      >
        {/* corner frame accents */}
        <div className="pointer-events-none absolute -top-10 -right-10 h-40 w-40 rotate-45 rounded-3xl border border-rose-100" />
        <div className="pointer-events-none absolute -bottom-14 -left-14 h-40 w-40 rotate-12 rounded-3xl border border-rose-100" />

        {/* ambient drifting hearts */}
        <span
          className="olw-heart pointer-events-none absolute bottom-10 left-[18%] text-rose-200"
          style={{ animationDelay: "0s" }}
          aria-hidden="true"
        >
          ♥
        </span>
        <span
          className="olw-heart pointer-events-none absolute bottom-16 left-[68%] text-gold-400"
          style={{ animationDelay: "3s" }}
          aria-hidden="true"
        >
          ♥
        </span>
        <span
          className="olw-heart pointer-events-none absolute bottom-6 left-[45%] text-blush-400"
          style={{ animationDelay: "6s" }}
          aria-hidden="true"
        >
          ♥
        </span>

        <PenguinMascot />

        <div
          className="mx-auto mb-4 flex h-11 w-11 items-center justify-center rounded-full bg-gold-500 font-display text-sm text-white"
          style={{
            boxShadow:
              "inset 0 -3px 6px rgba(0,0,0,0.15), inset 0 3px 4px rgba(255,255,255,0.3)",
          }}
          aria-hidden="true"
        >
          M&T
        </div>

        <span className="page-eyebrow">Welcome</span>
        <h1 className="text-4xl sm:text-5xl">Our Little World</h1>

        <svg
          className="mx-auto mt-2 h-3 w-24 text-gold-400"
          viewBox="0 0 100 12"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M2 8 Q 20 -2 38 8 T 74 8 T 98 8"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>

        <p className="mt-3 font-body text-plum-400 max-w-md mx-auto">
          A little place that belongs to us.
        </p>

        <div className="mt-6 flex items-center justify-center gap-3 sm:gap-4">
          <span className="font-display text-xl sm:text-2xl text-plum-700">
            {names}
          </span>
        </div>

        <div className="mt-7 flex flex-col sm:flex-row items-stretch justify-center gap-3 sm:gap-4">
          <div className="min-w-[9.5rem] rounded-2xl border border-dashed border-rose-200 bg-rose-50 px-5 py-3 text-center">
            <p className="text-[11px] uppercase tracking-[0.2em] text-rose-400 font-semibold">
              Together Since
            </p>
            <p className="mt-1 font-body text-plum-600 font-medium">
              {togetherSince}
            </p>
          </div>

          <div className="min-w-[9.5rem] rounded-2xl border border-dashed border-gold-400 bg-gold-300/30 px-5 py-3 text-center">
            <p className="font-display text-3xl text-rose-500 tabular-nums leading-none">
              {daysTogether}
            </p>
            <p className="mt-1 text-[11px] uppercase tracking-[0.2em] text-plum-400 font-semibold">
              Days Together
            </p>
          </div>
        </div>
      </section>

      {/* Feature cards */}
      <section
        style={{ transitionDelay: "120ms" }}
        className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 ${fadeUp()}`}
      >
        {features.map((feature) => (
          <FeatureCard key={feature.to} {...feature} />
        ))}
      </section>

      {/* Today's reminder */}
      <section
        style={{ transitionDelay: "220ms" }}
        className={`mt-8 rounded-3xl border border-rose-100 bg-white px-6 py-7 sm:px-10 relative overflow-hidden ${fadeUp()}`}
      >
        <div className="absolute left-0 top-0 h-full w-1.5 bg-gold-400" />

        <div className="flex items-start justify-between gap-4">
          <div>
            <span className="page-eyebrow">Today's Little Reminder</span>
            <p className="font-display text-lg text-plum-700">{reminder}</p>
          </div>

          <button
            type="button"
            onClick={handleShuffleReminder}
            className="mt-1 shrink-0 font-body text-xs font-semibold text-rose-500 hover:text-rose-600 transition-colors whitespace-nowrap"
          >
            Another one →
          </button>
        </div>
      </section>
    </div>
  );
}

export default Home;
