import { useState } from "react";
import { NavLink } from "react-router-dom";
import { useLock } from "./PasscodeGate.jsx";

const links = [
  { to: "/", label: "Home" },
  { to: "/our-story", label: "Our Story" },
  { to: "/memories", label: "Memories" },
  { to: "/open-when", label: "Open When..." },
  { to: "/mini-games", label: "Mini Games" },
  { to: "/calendar", label: "Our Calendar" },
  { to: "/songs", label: "Our Playlist" },
];

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

function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const lock = useLock();

  const linkClasses = ({ isActive }) =>
    `px-3 py-2 rounded-full text-sm font-semibold transition-colors ${
      isActive ? "bg-rose-400 text-white" : "text-plum-500 hover:bg-rose-100"
    }`;

  return (
    <header className="sticky top-0 z-30 bg-blush-50/90 backdrop-blur border-b border-rose-100">
      <nav className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          <NavLink
            to="/"
            className="flex items-center gap-2 font-display text-xl text-rose-500"
          >
            <span>💗</span>
            <span>Our Little World</span>
          </NavLink>

          {/* Desktop links */}
          <div className="hidden md:flex items-center gap-1">
            {links.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                className={linkClasses}
                end={link.to === "/"}
              >
                {link.label}
              </NavLink>
            ))}
            <button
              type="button"
              onClick={lock}
              className="ml-2 flex items-center gap-1.5 rounded-full border border-rose-200 px-3 py-2 text-sm font-semibold text-rose-400 transition-colors hover:bg-rose-50"
            >
              <LockIcon className="h-4 w-4" />
              Sign out
            </button>
          </div>

          {/* Mobile menu button */}
          <button
            className="md:hidden text-2xl text-rose-500"
            onClick={() => setIsOpen((prev) => !prev)}
            aria-label="Toggle menu"
          >
            {isOpen ? "✕" : "☰"}
          </button>
        </div>

        {/* Mobile menu */}
        {isOpen && (
          <div className="md:hidden flex flex-col gap-1 pb-4">
            {links.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                className={linkClasses}
                end={link.to === "/"}
                onClick={() => setIsOpen(false)}
              >
                {link.label}
              </NavLink>
            ))}
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                lock();
              }}
              className="mt-1 flex items-center gap-1.5 rounded-full border border-rose-200 px-3 py-2 text-left text-sm font-semibold text-rose-400 transition-colors hover:bg-rose-50"
            >
              <LockIcon className="h-4 w-4" />
              Sign out
            </button>
          </div>
        )}
      </nav>
    </header>
  );
}

export default Navbar;
