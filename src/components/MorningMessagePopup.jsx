import { useEffect, useState } from "react";
import morningMessages from "../data/morningMessages.js";

// Shown once per calendar day, right when the app opens. Uses
// day-of-year so both of you see the same line on the same day,
// no matter whose device opens the app first — 365 messages doesn't
// divide evenly into a leap year, so it just wraps back to the top.
const STORAGE_KEY = "olw-morning-popup-lastShown";

function getDayOfYear(date = new Date()) {
  const start = new Date(date.getFullYear(), 0, 0);
  const diffMs = date - start;
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}

function getTodayKey(date = new Date()) {
  // Local calendar date, not UTC — avoids flipping over at the wrong
  // hour for our timezone.
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function getTodaysMessage(date = new Date()) {
  const dayOfYear = getDayOfYear(date);
  const index =
    (dayOfYear - 1 + morningMessages.length) % morningMessages.length;
  return morningMessages[index];
}

function MorningMessagePopup() {
  const [message, setMessage] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    const today = new Date();
    const todayKey = getTodayKey(today);

    let lastShown = null;
    try {
      lastShown = window.localStorage.getItem(STORAGE_KEY);
    } catch {
      // localStorage unavailable (private mode, etc.) — just show
      // it every open in that case rather than crash.
    }

    if (lastShown === todayKey) return;

    setMessage(getTodaysMessage(today));

    // Small delay so it appears as a little "pop" after the page
    // has settled in, instead of slamming in before anything else
    // has rendered.
    const t = window.setTimeout(() => setIsOpen(true), 400);
    return () => window.clearTimeout(t);
  }, []);

  function handleClose() {
    setIsClosing(true);
    window.setTimeout(() => {
      setIsOpen(false);
      setIsClosing(false);
      try {
        window.localStorage.setItem(STORAGE_KEY, getTodayKey());
      } catch {
        // ignore — worst case it shows again next open
      }
    }, 200);
  }

  if (!isOpen) return null;

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center px-5 transition-opacity duration-200 ${
        isClosing ? "opacity-0" : "opacity-100"
      }`}
      role="dialog"
      aria-modal="true"
      aria-label="Today's morning message"
    >
      {/* backdrop */}
      <button
        type="button"
        aria-label="Close"
        onClick={handleClose}
        className="absolute inset-0 bg-plum-700/50 backdrop-blur-sm"
      />

      {/* card */}
      <div
        className={`relative w-full max-w-sm rounded-3xl border border-rose-100 bg-white px-7 py-9 text-center shadow-2xl transition-all duration-200 dark:border-plum-500/40 dark:bg-plum-700 ${
          isClosing ? "scale-95 opacity-0" : "scale-100 opacity-100"
        }`}
      >
        <div
          className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-gold-500 font-display text-sm text-white"
          style={{
            boxShadow:
              "inset 0 -3px 6px rgba(0,0,0,0.15), inset 0 3px 4px rgba(255,255,255,0.3)",
          }}
          aria-hidden="true"
        >
          ♥
        </div>

        <span className="page-eyebrow">Good Morning</span>

        <p className="mt-3 font-display text-2xl leading-snug text-plum-700 dark:text-blush-50">
          {message}
        </p>

        <svg
          className="mx-auto mt-5 h-3 w-24 text-gold-400"
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

        <button
          type="button"
          onClick={handleClose}
          className="mt-6 rounded-full bg-rose-500 px-6 py-2 font-body text-sm font-semibold text-white transition-colors hover:bg-rose-600"
        >
          I love you 🤍
        </button>
      </div>
    </div>
  );
}

export default MorningMessagePopup;
