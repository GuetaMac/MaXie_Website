import { useState } from "react";
import { NavLink } from "react-router-dom";

const links = [
  { to: "/", label: "Home" },
  { to: "/our-story", label: "Our Story" },
  { to: "/memories", label: "Memories" },
  { to: "/open-when", label: "Open When..." },
  { to: "/mini-games", label: "Mini Games" },
  { to: "/calendar", label: "Our Calendar" },
  { to: "/songs", label: "Our Playlist" },
];

function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

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
          </div>
        )}
      </nav>
    </header>
  );
}

export default Navbar;
