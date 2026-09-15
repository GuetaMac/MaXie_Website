import { useEffect, useRef, useState } from "react";
import { db } from "../firebase";
import { collection, getDocs, orderBy, query } from "firebase/firestore";
import { milestones } from "../data/storyMilestones.js";

// How many of the most recent notes to feed the chatbot as context. Notes
// are small, so a few hundred is still a tiny prompt — raise this if you
// want the bot to "remember" further back.
const MAX_NOTES = 300;

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

export default function Chat() {
  const [context, setContext] = useState(null);
  const [contextError, setContextError] = useState(null);
  const [messages, setMessages] = useState([]); // { role: "user"|"model", text }
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);

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

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, sending]);

  async function handleSend(e) {
    e.preventDefault();
    const text = input.trim();
    if (!text || sending || !context) return;

    const nextMessages = [...messages, { role: "user", text }];
    setMessages(nextMessages);
    setInput("");
    setSending(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
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
        },
      ]);
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="flex h-[calc(100vh-11rem)] flex-col sm:h-[calc(100vh-13rem)]">
      <div className="mb-6 text-center sm:text-left">
        <span className="page-eyebrow text-sm tracking-[0.3em]">Ask Us</span>
        <h1 className="mt-2 text-4xl sm:text-5xl">Ask About Us</h1>
        <p className="mx-auto mt-3 max-w-md text-base text-plum-400 sm:mx-0 sm:text-lg dark:text-blush-200/80">
          Magtanong tungkol sa relasyon namin — batay sa Our Story at sa mga
          notes namin sa isa't isa.
        </p>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto rounded-3xl border border-rose-100 bg-white p-5 shadow-sm dark:border-plum-500/40 dark:bg-plum-800">
        {contextError && (
          <p className="text-center text-sm text-rose-400">{contextError}</p>
        )}

        {!context && !contextError && (
          <p className="text-center text-sm text-plum-400 dark:text-blush-200/80">
            Kinukuha pa yung mga alaala namin...
          </p>
        )}

        {context && messages.length === 0 && (
          <p className="text-center text-sm text-plum-400 dark:text-blush-200/80">
            Handa na akong sagutin ang mga tanong mo tungkol sa amin. Subukan
            mo!
          </p>
        )}

        {messages.map((m, i) => (
          <div
            key={i}
            className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                m.role === "user"
                  ? "bg-rose-400 text-white"
                  : "border border-rose-100 bg-rose-50 text-plum-600 dark:border-plum-500/40 dark:bg-plum-700 dark:text-blush-50"
              }`}
            >
              {m.text}
            </div>
          </div>
        ))}

        {sending && (
          <div className="flex justify-start">
            <div className="max-w-[80%] rounded-2xl border border-rose-100 bg-rose-50 px-4 py-2.5 text-sm text-plum-400 dark:border-plum-500/40 dark:bg-plum-700 dark:text-blush-200/80">
              Nag-iisip...
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      <form onSubmit={handleSend} className="mt-4 flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={
            context ? "Magtanong tungkol sa amin..." : "Naglo-load pa..."
          }
          disabled={!context || sending}
          className="flex-1 rounded-2xl border-b-2 border-rose-200 bg-rose-50/60 px-4 py-3 text-sm text-plum-700 outline-none placeholder:text-plum-300 dark:border-plum-500/40 dark:bg-plum-700 dark:text-blush-50"
        />
        <button
          type="submit"
          disabled={!context || sending || !input.trim()}
          className="rounded-2xl bg-rose-400 px-5 py-3 text-sm font-medium text-white shadow-md disabled:opacity-50"
        >
          Send
        </button>
      </form>
    </div>
  );
}
