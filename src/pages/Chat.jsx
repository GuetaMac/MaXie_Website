import { useEffect, useRef, useState } from "react";
import { db } from "../firebase";
import { collection, getDocs, orderBy, query } from "firebase/firestore";
import { milestones } from "../data/storyMilestones.js";

// How many of the most recent notes to feed the chatbot as context. Notes
// are small, so a few hundred is still a tiny prompt — raise this if you
// want the bot to "remember" further back.
const MAX_NOTES = 300;

// Starter prompts for the empty state — tappable, so there's no blank-page
// hesitation the first time you open the tab.
const SUGGESTIONS = [
  "Paano tayo nagkakilala?",
  "Ano yung favorite memory mo satin?",
  "Gaano na tayo katagal?",
];

function buildStoryContext() {
  return milestones
    .map((m) => {
      const dateLabel = m.date ? ` (${m.date})` : "";
      return `### ${m.label}${dateLabel}\n${m.story}`;
    })
    .join("\n\n");
}

async function fetchNotesContext() {
  const q = query(collection(db, "notes"), orderBy("createdAt", "asc"));
  const snap = await getDocs(q);
  const notes = snap.docs.map((d) => d.data());
  const recent = notes.slice(-MAX_NOTES);

  return recent
    .map((n) => {
      let dateLabel = "";
      if (n.createdAt?.toDate) {
        try {
          dateLabel = ` [${new Intl.DateTimeFormat("en-PH", {
            year: "numeric",
            month: "short",
            day: "numeric",
          }).format(n.createdAt.toDate())}]`;
        } catch {
          // ignore formatting errors, just skip the date label
        }
      }
      return `${n.author}${dateLabel}: ${n.text}`;
    })
    .join("\n");
}

function HeartIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M12 21s-6.7-4.3-9.3-8.2C1 10 1.6 6.5 4.4 5c2.2-1.2 4.6-.5 6 1.4l1.6 2 1.6-2c1.4-1.9 3.8-2.6 6-1.4 2.8 1.5 3.4 5 1.7 7.8C18.7 16.7 12 21 12 21Z" />
    </svg>
  );
}

export default function Chat() {
  const [context, setContext] = useState(null);
  const [contextError, setContextError] = useState(null);
  const [messages, setMessages] = useState([]); // { role: "user"|"model", text }
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);
  const scrollRef = useRef(null);
  const inputRef = useRef(null);
  const stickToBottomRef = useRef(true);

  useEffect(() => {
    let cancelled = false;

    async function loadContext() {
      try {
        const [storyText, notesText] = await Promise.all([
          Promise.resolve(buildStoryContext()),
          fetchNotesContext(),
        ]);
        if (cancelled) return;
        const combined = `## Our Story (milestones)\n\n${storyText}\n\n## Our Notes (chronological messages to each other)\n\n${notesText}`;
        setContext(combined);
      } catch (err) {
        console.error("Failed to build chat context:", err);
        if (!cancelled)
          setContextError(
            "Hindi na-load yung mga alaala. Subukan mo ulit mamaya.",
          );
      }
    }

    loadContext();
    return () => {
      cancelled = true;
    };
  }, []);

  // Focus the input the moment context finishes loading.
  useEffect(() => {
    if (context) inputRef.current?.focus();
  }, [context]);

  // Only auto-scroll if the person is already near the bottom — if they've
  // scrolled up to reread older messages, a new reply shouldn't yank them
  // back down.
  useEffect(() => {
    if (stickToBottomRef.current) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
    }
  }, [messages, sending]);

  function handleScroll() {
    const el = scrollRef.current;
    if (!el) return;
    stickToBottomRef.current =
      el.scrollHeight - el.scrollTop - el.clientHeight < 80;
  }

  // Auto-grow the textarea up to a max height.
  useEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 140) + "px";
  }, [input]);

  async function sendMessage(text) {
    const trimmed = text.trim();
    if (!trimmed || sending || !context) return;

    const nextMessages = [...messages, { role: "user", text: trimmed }];
    setMessages(nextMessages);
    setInput("");
    setSending(true);
    stickToBottomRef.current = true;

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: trimmed,
          history: messages, // prior turns only — current message sent separately
          context,
        }),
      });

      if (!res.ok) throw new Error(`Request failed: ${res.status}`);

      const data = await res.json();
      setMessages((prev) => [...prev, { role: "model", text: data.reply }]);
    } catch (err) {
      console.error("Chat send error:", err);
      setMessages((prev) => [
        ...prev,
        {
          role: "model",
          text: "Sorry, may error — subukan mo ulit magtanong.",
          isError: true,
        },
      ]);
    } finally {
      setSending(false);
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }

  function handleSend(e) {
    e.preventDefault();
    sendMessage(input);
  }

  function handleKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  }

  return (
    <div className="flex h-[calc(100vh-8rem)] flex-col sm:h-[calc(100vh-9rem)]">
      <style>{`
        @keyframes chat-msg-in {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .chat-msg { animation: chat-msg-in 0.25s ease-out; }
      `}</style>

      <div className="mb-4 text-center sm:mb-6 sm:text-left">
        <span className="page-eyebrow text-sm tracking-[0.3em]">Ask Us</span>
        <h1 className="mt-2 text-3xl sm:text-5xl">Ask About Us</h1>
        <p className="mx-auto mt-2 max-w-md text-sm text-plum-400 sm:mx-0 sm:mt-3 sm:text-lg dark:text-blush-200/80">
          Magtanong tungkol sa relasyon natin — batay sa Our Story at sa mga
          notes natin sa isa't isa.
        </p>
      </div>

      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex-1 space-y-4 overflow-y-auto rounded-3xl border border-rose-100 bg-white p-5 shadow-sm dark:border-plum-500/40 dark:bg-plum-800"
      >
        {contextError && (
          <p className="text-center text-sm text-rose-400">{contextError}</p>
        )}

        {!context && !contextError && (
          <div className="flex h-full flex-col items-center justify-center gap-3">
            <HeartIcon className="h-6 w-6 animate-pulse text-rose-300" />
            <p className="text-sm text-plum-400 dark:text-blush-200/80">
              Kinukuha pa yung mga alaala natin...
            </p>
          </div>
        )}

        {context && messages.length === 0 && (
          <div className="flex h-full flex-col items-center justify-center gap-5 px-4 text-center">
            <HeartIcon className="h-7 w-7 text-rose-300" />
            <p className="text-sm text-plum-400 dark:text-blush-200/80">
              Handa na akong sagutin ang mga tanong mo tungkol sa atin. Tanong
              na ikaw bb!
            </p>
            <div className="flex w-full max-w-sm flex-col gap-2">
              {SUGGESTIONS.map((q) => (
                <button
                  key={q}
                  type="button"
                  onClick={() => sendMessage(q)}
                  className="rounded-2xl border border-rose-100 bg-rose-50/60 px-4 py-2.5 text-left text-sm text-plum-600 transition hover:border-rose-300 hover:bg-rose-50 dark:border-plum-500/40 dark:bg-plum-700 dark:text-blush-50 dark:hover:border-blush-200/40"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m, i) => (
          <div
            key={i}
            className={`chat-msg flex items-end gap-2 ${m.role === "user" ? "justify-end" : "justify-start"}`}
          >
            {m.role === "model" && (
              <span className="mb-1 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-rose-100 text-rose-400 dark:bg-plum-600 dark:text-blush-200">
                <HeartIcon className="h-3.5 w-3.5" />
              </span>
            )}
            <div
              className={`max-w-[80%] whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                m.isError
                  ? "border border-rose-300 bg-rose-50 text-rose-500 dark:border-rose-300/40 dark:bg-plum-700 dark:text-rose-300"
                  : m.role === "user"
                    ? "bg-rose-400 text-white"
                    : "border border-rose-100 bg-rose-50 text-plum-600 dark:border-plum-500/40 dark:bg-plum-700 dark:text-blush-50"
              }`}
            >
              {m.text}
            </div>
          </div>
        ))}

        {sending && (
          <div className="chat-msg flex items-end justify-start gap-2">
            <span className="mb-1 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-rose-100 text-rose-400 dark:bg-plum-600 dark:text-blush-200">
              <HeartIcon className="h-3.5 w-3.5" />
            </span>
            <div className="flex items-center gap-1 rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 dark:border-plum-500/40 dark:bg-plum-700">
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className="h-1.5 w-1.5 animate-bounce rounded-full bg-plum-300 dark:bg-blush-200/60"
                  style={{ animationDelay: `${i * 0.15}s` }}
                />
              ))}
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      <form onSubmit={handleSend} className="mt-4 flex items-end gap-2">
        <textarea
          ref={inputRef}
          rows={1}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={
            context ? "Magtanong tungkol sa amin..." : "Naglo-load pa..."
          }
          disabled={!context || sending}
          className="flex-1 resize-none rounded-2xl border-b-2 border-rose-200 bg-rose-50/60 px-4 py-3 text-sm leading-relaxed text-plum-700 outline-none transition placeholder:text-plum-300 focus:border-rose-400 disabled:opacity-60 dark:border-plum-500/40 dark:bg-plum-700 dark:text-blush-50 dark:focus:border-blush-200"
        />
        <button
          type="submit"
          disabled={!context || sending || !input.trim()}
          className="rounded-2xl bg-rose-400 px-5 py-3 text-sm font-medium text-white shadow-md transition hover:bg-rose-500 disabled:opacity-50 disabled:hover:bg-rose-400"
        >
          Send
        </button>
      </form>
    </div>
  );
}
