import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";

// Only the pages someone would jump to constantly live as primary tabs.
// Everything else (Our Story, Memories, Open When, Mini Games, Our
// Playlist, Wishlist) sits behind "More" as a slide-up sheet — same
// pattern most native apps use once they have more destinations than
// fit comfortably in a tab bar.
const primaryLinks = [
  { to: "/", label: "Home", icon: HomeIcon, end: true },
  { to: "/notes", label: "Notes", icon: NotesIcon },
  { to: "/calendar", label: "Calendar", icon: CalendarIcon },
  { to: "/our-garden", label: "Garden", icon: GardenIcon },
];

const moreLinks = [
  { to: "/our-story", label: "Our Story" },
  { to: "/memories", label: "Memories" },
  { to: "/open-when", label: "Open When..." },
  { to: "/mini-games", label: "Mini Games" },
  { to: "/songs", label: "Our Playlist" },
  { to: "/wishlist", label: "Wishlist" },
];

function HomeIcon(props) {
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
      <path d="M3 11.5 12 4l9 7.5" />
      <path d="M5.5 10v9a1 1 0 0 0 1 1H9a1 1 0 0 0 1-1v-4h4v4a1 1 0 0 0 1 1h2.5a1 1 0 0 0 1-1v-9" />
    </svg>
  );
}

function NotesIcon(props) {
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
      <path d="M6 3.5h9l3 3V19a1.5 1.5 0 0 1-1.5 1.5h-10.5A1.5 1.5 0 0 1 4.5 19V5A1.5 1.5 0 0 1 6 3.5Z" />
      <path d="M8.5 9h7M8.5 12.5h7M8.5 16h4.5" />
    </svg>
  );
}

function CalendarIcon(props) {
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
      <rect x="4" y="5.5" width="16" height="15" rx="2" />
      <path d="M8 3.5v4M16 3.5v4M4 10h16" />
    </svg>
  );
}

function GardenIcon(props) {
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
      <path d="M12 21v-8" />
      <path d="M12 13c0-4 -3-6-7-6 0 4 3 6 7 6Z" />
      <path d="M12 13c0-5 3-8 8-8 0 5 -3 8 -8 8Z" />
    </svg>
  );
}

function MoreIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" stroke="none" {...props}>
      <circle cx="5" cy="12" r="1.8" />
      <circle cx="12" cy="12" r="1.8" />
      <circle cx="19" cy="12" r="1.8" />
    </svg>
  );
}

function BottomNav() {
  const [moreOpen, setMoreOpen] = useState(false);
  const location = useLocation();

  const isMoreActive = moreLinks.some((link) => link.to === location.pathname);

  const tabClass = (active) =>
    `flex flex-1 flex-col items-center justify-center gap-0.5 py-2 text-[11px] font-semibold transition-colors ${
      active
        ? "text-rose-500 dark:text-rose-300"
        : "text-plum-400 hover:text-plum-500 dark:text-blush-200/70 dark:hover:text-blush-100"
    }`;

  return (
    <>
      <style>{`
        @keyframes olwSheetUp {
          from { transform: translateY(16px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        .olw-sheet {
          animation: olwSheetUp 0.22s ease-out;
        }
        @media (prefers-reduced-motion: reduce) {
          .olw-sheet { animation: none; }
        }
      `}</style>

      {moreOpen && (
        <button
          type="button"
          aria-label="Close menu"
          onClick={() => setMoreOpen(false)}
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
        />
      )}

      {moreOpen && (
        <div className="olw-sheet fixed inset-x-0 bottom-0 z-50 rounded-t-3xl border-t border-rose-100 bg-white px-4 pt-4 pb-[calc(1rem+env(safe-area-inset-bottom)+4.5rem)] shadow-[0_-8px_30px_rgba(0,0,0,0.08)] dark:border-plum-500/40 dark:bg-plum-700">
          <button
            type="button"
            onClick={() => setMoreOpen(false)}
            aria-label="Close menu"
            className="mx-auto mb-4 flex h-6 w-16 items-center justify-center"
          >
            <span className="h-1 w-10 rounded-full bg-rose-200 dark:bg-plum-500/50" />
          </button>
          <div className="grid grid-cols-2 gap-2">
            {moreLinks.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                onClick={() => setMoreOpen(false)}
                className={({ isActive }) =>
                  `rounded-2xl border px-4 py-3 text-center text-sm font-semibold transition-colors ${
                    isActive
                      ? "border-rose-300 bg-rose-100 text-rose-600 dark:border-rose-400/40 dark:bg-plum-600 dark:text-rose-200"
                      : "border-rose-100 text-plum-500 hover:bg-rose-50 dark:border-plum-500/40 dark:text-blush-200 dark:hover:bg-plum-600/60"
                  }`
                }
              >
                {link.label}
              </NavLink>
            ))}
          </div>
        </div>
      )}

      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-rose-100 bg-blush-50/95 backdrop-blur pb-[env(safe-area-inset-bottom)] dark:border-plum-600 dark:bg-plum-900/95">
        <div className="mx-auto flex max-w-md items-stretch">
          {primaryLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              className={({ isActive }) => tabClass(isActive)}
            >
              <link.icon className="h-5 w-5" />
              {link.label}
            </NavLink>
          ))}

          <button
            type="button"
            onClick={() => setMoreOpen((v) => !v)}
            className={tabClass(isMoreActive || moreOpen)}
          >
            <MoreIcon className="h-5 w-5" />
            More
          </button>
        </div>
      </nav>
    </>
  );
}

export default BottomNav;
