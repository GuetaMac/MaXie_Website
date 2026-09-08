import { useLock } from "./PasscodeGate.jsx";
import { useTheme } from "../hooks/useTheme.js";

function LockIcon(props) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M9 12H3l3-3m-3 3l3 3" />
      <path d="M21 12H9" />
      <path d="M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3" />
    </svg>
  );
}

function SunIcon(props) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  );
}

function MoonIcon(props) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
    </svg>
  );
}

// Replaces the old Navbar. No nav links live here anymore — navigation
// moved to the bottom tab bar (BottomNav.jsx) to feel like a native app
// shell instead of a website with a header menu. This bar only carries
// branding + the two utility actions (theme, sign out) that don't
// belong in the tab bar.
function TopBar() {
  const lock = useLock();
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  return (
    <header className="sticky top-0 z-30 bg-blush-50/90 dark:bg-plum-900/90 backdrop-blur border-b border-rose-100 dark:border-plum-600">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
        <span className="flex items-center gap-2 font-display text-lg text-rose-500 dark:text-rose-300">
          <span>💗</span>
          <span>Our Little World</span>
        </span>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={toggleTheme}
            aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
            className="flex items-center justify-center h-9 w-9 rounded-full border border-rose-200 text-rose-400 transition-colors hover:bg-rose-50 dark:border-plum-600 dark:text-blush-200 dark:hover:bg-plum-700"
          >
            {isDark ? (
              <SunIcon className="h-4 w-4" />
            ) : (
              <MoonIcon className="h-4 w-4" />
            )}
          </button>

          <button
            type="button"
            onClick={lock}
            aria-label="Sign out"
            className="flex items-center justify-center h-9 w-9 rounded-full border border-rose-200 text-rose-400 transition-colors hover:bg-rose-50 dark:border-plum-600 dark:text-blush-200 dark:hover:bg-plum-700"
          >
            <LockIcon className="h-4 w-4" />
          </button>
        </div>
      </div>
    </header>
  );
}

export default TopBar;
