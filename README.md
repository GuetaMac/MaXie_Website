# Our Little World 💗

A simple, cute starter website for a couple, built with React + Vite + Tailwind CSS + React Router.

## Getting started

```bash
npm install
npm run dev
```

Then open the local URL Vite prints (usually http://localhost:5173).

## Structure

```
src/
├── components/
│   ├── Navbar.jsx        # Responsive top navigation
│   ├── FeatureCard.jsx   # Card used on the Home dashboard
│   └── PageHeader.jsx    # Shared title/description block for each page
├── pages/
│   ├── Home.jsx
│   ├── OurStory.jsx
│   ├── Memories.jsx
│   ├── OpenWhen.jsx
│   ├── MiniGames.jsx
│   ├── Calendar.jsx
│   └── LoveNotes.jsx
├── App.jsx
├── main.jsx
└── index.css
```

## Notes

- No backend, database, or authentication — this is placeholder UI only, ready for you to wire up real content and logic later.
- Icons are plain emoji, no external image assets required.
- Colors, fonts, and the "keepsake card" style are defined in `tailwind.config.js` and `src/index.css` — tweak them to taste.
