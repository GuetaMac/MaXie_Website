import { useState, useEffect } from "react";
import { db } from "./firebase";
import {
  collection,
  addDoc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  doc,
  updateDoc,
  increment,
} from "firebase/firestore";

const REACTIONS = [
  { key: "heart", emoji: "❤️", label: "Mahal kita" },
  { key: "smile", emoji: "😊", label: "Nakangiti ako" },
  { key: "teary", emoji: "🥺", label: "Naiyak ako" },
];

const NAME_KEY = "olw_username";
const REACTED_KEY = "olw_reacted";

const FONT_HREF =
  "https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600;9..144,700&family=Caveat:wght@500;700&family=Inter:wght@400;500;600&display=swap";

function useGoogleFonts() {
  useEffect(() => {
    if (document.querySelector(`link[href="${FONT_HREF}"]`)) return;
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = FONT_HREF;
    document.head.appendChild(link);
  }, []);
}

function loadReacted() {
  try {
    return JSON.parse(localStorage.getItem(REACTED_KEY) || "{}");
  } catch {
    return {};
  }
}

function formatTime(note) {
  if (!note.createdAt?.toDate) return "";
  try {
    return new Intl.DateTimeFormat("en-PH", {
      hour: "numeric",
      minute: "2-digit",
    }).format(note.createdAt.toDate());
  } catch {
    return "";
  }
}

export default function NotesBoard() {
  useGoogleFonts();

  const [username, setUsername] = useState(
    () => localStorage.getItem(NAME_KEY) || "",
  );
  const [text, setText] = useState("");
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reacted, setReacted] = useState(() => loadReacted());
  const [justSealed, setJustSealed] = useState(null);

  useEffect(() => {
    const q = query(collection(db, "notes"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      setNotes(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const chooseName = (name) => {
    localStorage.setItem(NAME_KEY, name);
    setUsername(name);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    await addDoc(collection(db, "notes"), {
      text: text.trim(),
      author: username,
      createdAt: serverTimestamp(),
      reactions: { heart: 0, smile: 0, teary: 0 },
    });
    setText("");
  };

  const handleReact = async (noteId, key) => {
    if (reacted[noteId]) return; // already sealed for this note — no take-backs
    const ref = doc(db, "notes", noteId);
    await updateDoc(ref, { [`reactions.${key}`]: increment(1) });
    const next = { ...reacted, [noteId]: key };
    setReacted(next);
    localStorage.setItem(REACTED_KEY, JSON.stringify(next));
    setJustSealed(noteId);
    setTimeout(() => setJustSealed((id) => (id === noteId ? null : id)), 500);
  };

  const styleBlock = (
    <style>{`
      .olw-root {
        --olw-paper: #FBEFEC;
        --olw-ink: #402331;
        --olw-rose: #C6667A;
        --olw-rose-soft: #F1D9DD;
        --olw-gold: #C99A3B;
        --olw-gold-soft: #FFF6E4;
        font-family: 'Inter', sans-serif;
        color: var(--olw-ink);
        background-color: var(--olw-paper);
        background-image: radial-gradient(var(--olw-rose-soft) 1px, transparent 1px);
        background-size: 18px 18px;
        min-height: 100%;
      }
      .olw-display { font-family: 'Fraunces', serif; }
      .olw-script { font-family: 'Caveat', cursive; }

      @keyframes olw-pop-in {
        0% { opacity: 0; transform: translateY(8px) scale(0.98); }
        100% { opacity: 1; transform: translateY(0) scale(1); }
      }
      .olw-note-enter { animation: olw-pop-in 0.35s ease-out; }

      @keyframes olw-seal-pop {
        0% { transform: scale(1) rotate(0deg); }
        40% { transform: scale(1.3) rotate(-8deg); }
        70% { transform: scale(0.92) rotate(4deg); }
        100% { transform: scale(1) rotate(0deg); }
      }
      .olw-seal-pop { animation: olw-seal-pop 0.5s ease; }

      .olw-btn-name, .olw-send-btn, .olw-react-btn {
        transition: transform 0.15s ease, box-shadow 0.15s ease, opacity 0.15s ease;
      }
      .olw-btn-name:hover, .olw-send-btn:hover { transform: translateY(-2px); }
      .olw-react-btn:not([disabled]):hover { transform: translateY(-2px); }

      .olw-btn-name:focus-visible,
      .olw-react-btn:focus-visible,
      .olw-send-btn:focus-visible,
      .olw-input:focus-visible {
        outline: 2px solid var(--olw-rose);
        outline-offset: 2px;
      }

      .olw-react-btn[disabled] { cursor: not-allowed; }

      @media (prefers-reduced-motion: reduce) {
        .olw-note-enter, .olw-seal-pop { animation: none; }
      }
    `}</style>
  );

  if (!username) {
    return (
      <div className="olw-root flex items-center justify-center p-6">
        {styleBlock}
        <div
          className="max-w-sm w-full text-center bg-white/70 backdrop-blur rounded-3xl p-8 shadow-sm"
          style={{ border: "1px solid var(--olw-rose-soft)" }}
        >
          <p
            className="olw-script text-2xl"
            style={{ color: "var(--olw-rose)" }}
          >
            bago tayo magsimula
          </p>
          <h2 className="olw-display text-2xl font-semibold mt-1 mb-6">
            Kaninong tala ito?
          </h2>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => chooseName("Macky")}
              className="olw-btn-name px-6 py-3 rounded-full text-white font-medium shadow-md"
              style={{ backgroundColor: "var(--olw-rose)" }}
            >
              Macky
            </button>
            <button
              onClick={() => chooseName("Trixie")}
              className="olw-btn-name px-6 py-3 rounded-full text-white font-medium shadow-md"
              style={{ backgroundColor: "var(--olw-ink)" }}
            >
              Trixie
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="olw-root px-4 py-8">
      {styleBlock}
      <div className="max-w-md mx-auto">
        <div className="text-center mb-7">
          <p
            className="olw-script text-2xl"
            style={{ color: "var(--olw-rose)" }}
          >
            isang tala, araw-araw
          </p>
          <h2 className="olw-display text-3xl font-semibold mt-1">
            Mga Tala Namin
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="flex gap-2 mb-8">
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Mag-iwan ng tala..."
            className="olw-input flex-1 rounded-2xl px-4 py-3 bg-white/80 text-sm border-b-2"
            style={{ borderColor: "var(--olw-rose-soft)" }}
          />
          <button
            type="submit"
            className="olw-send-btn px-5 py-3 rounded-2xl text-white text-sm font-medium shadow-md"
            style={{ backgroundColor: "var(--olw-rose)" }}
          >
            Ipadala
          </button>
        </form>

        {loading ? (
          <p className="text-center text-sm opacity-60">Naglo-load...</p>
        ) : notes.length === 0 ? (
          <p className="text-center text-sm opacity-60">
            Wala pang tala. Ikaw muna.
          </p>
        ) : (
          <ul className="space-y-4">
            {notes.map((note, i) => {
              const isMine = note.author === username;
              const sealedKey = reacted[note.id];
              const rotate = i % 2 === 0 ? "-0.5deg" : "0.5deg";
              const timeLabel = formatTime(note);

              return (
                <li
                  key={note.id}
                  className={`olw-note-enter rounded-2xl p-4 shadow-sm ${
                    isMine ? "ml-10" : "mr-10"
                  }`}
                  style={{
                    backgroundColor: isMine
                      ? "var(--olw-rose-soft)"
                      : "#FFFDFB",
                    border: isMine ? "none" : "1px solid var(--olw-rose-soft)",
                    transform: `rotate(${rotate})`,
                  }}
                >
                  <div className="flex items-baseline justify-between mb-1">
                    <p
                      className="olw-script text-xl leading-none"
                      style={{ color: "var(--olw-rose)" }}
                    >
                      {note.author}
                    </p>
                    {timeLabel && (
                      <span className="text-[11px] opacity-50">
                        {timeLabel}
                      </span>
                    )}
                  </div>

                  <p className="text-sm leading-relaxed">{note.text}</p>

                  <div className="flex gap-2 mt-3">
                    {REACTIONS.map((r) => {
                      const isSealed = sealedKey === r.key;
                      const disabled = Boolean(sealedKey);
                      const animate = justSealed === note.id && isSealed;

                      let cls =
                        "olw-react-btn text-sm px-2.5 py-1 rounded-full ";
                      if (animate) cls += "olw-seal-pop ";
                      else if (disabled && !isSealed) cls += "opacity-40 ";

                      return (
                        <button
                          key={r.key}
                          type="button"
                          disabled={disabled}
                          onClick={() => handleReact(note.id, r.key)}
                          title={isSealed ? "Naka-seal na" : r.label}
                          className={cls}
                          style={{
                            backgroundColor: isSealed
                              ? "var(--olw-gold-soft)"
                              : "rgba(255,255,255,0.7)",
                            border: `1px solid ${
                              isSealed
                                ? "var(--olw-gold)"
                                : "var(--olw-rose-soft)"
                            }`,
                            boxShadow: isSealed
                              ? "0 0 0 2px rgba(201,154,59,0.2)"
                              : "none",
                          }}
                        >
                          {r.emoji}{" "}
                          {note.reactions?.[r.key] > 0
                            ? note.reactions[r.key]
                            : ""}
                        </button>
                      );
                    })}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
