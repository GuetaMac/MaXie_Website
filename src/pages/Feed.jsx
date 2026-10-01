import { useState, useEffect, useRef } from "react";
import { db } from "../firebase";
import {
  collection,
  addDoc,
  serverTimestamp,
  doc,
  updateDoc,
  arrayUnion,
  arrayRemove,
  increment,
  query,
  orderBy,
  limit,
  onSnapshot,
  getDocs,
  writeBatch,
} from "firebase/firestore";

// Same key NotesBoard uses, so whoever picked a name there is already
// "logged in" here too.
const NAME_KEY = "olw_username";

const MAX_IMAGES = 10;
const MAX_FILE_MB = 10; // Cloudinary free plan limit per image
const PAGE_SIZE = 10;

const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

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

// Cloudinary: serve a smaller, auto-format/auto-quality version in the feed.
function optimize(url, width) {
  if (!url || !url.includes("/upload/")) return url;
  return url.replace("/upload/", `/upload/f_auto,q_auto,w_${width}/`);
}

async function uploadImage(file) {
  const fd = new FormData();
  fd.append("file", file);
  fd.append("upload_preset", UPLOAD_PRESET);
  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
    { method: "POST", body: fd },
  );
  if (!res.ok) throw new Error("Upload failed");
  const data = await res.json();
  return data.secure_url;
}

function formatTime(item) {
  if (!item.createdAt?.toDate) return "";
  try {
    const d = item.createdAt.toDate();
    const today = new Date();
    const isToday = d.toDateString() === today.toDateString();
    const time = new Intl.DateTimeFormat("en-PH", {
      hour: "numeric",
      minute: "2-digit",
    }).format(d);
    if (isToday) return time;
    const date = new Intl.DateTimeFormat("en-PH", {
      month: "short",
      day: "numeric",
    }).format(d);
    return `${date}, ${time}`;
  } catch {
    return "";
  }
}

/* ---------- icons (inline SVG, no icon library) ---------- */

function HeartIcon({ filled, className = "" }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="22"
      height="22"
      className={className}
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
    </svg>
  );
}

function CommentIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="21"
      height="21"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinejoin="round"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <path d="M21 11.5a8.4 8.4 0 0 1-9 8.4 8.6 8.6 0 0 1-3.6-.8L3 21l1.9-5.1A8.4 8.4 0 1 1 21 11.5z" />
    </svg>
  );
}

function PhotoIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="20"
      height="20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinejoin="round"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <rect x="3" y="4" width="18" height="16" rx="3" />
      <circle cx="9" cy="10" r="1.6" />
      <path d="M21 16l-5-5-8 9" />
    </svg>
  );
}

/* ---------- image carousel ---------- */

function ImageCarousel({ images }) {
  const [idx, setIdx] = useState(0);

  const onScroll = (e) => {
    const el = e.currentTarget;
    if (!el.clientWidth) return;
    setIdx(Math.round(el.scrollLeft / el.clientWidth));
  };

  if (images.length === 1) {
    return (
      <a href={images[0]} target="_blank" rel="noreferrer">
        <img
          src={optimize(images[0], 900)}
          alt="Post"
          className="olw-media"
          loading="lazy"
        />
      </a>
    );
  }

  return (
    <div className="relative">
      <div className="olw-carousel" onScroll={onScroll}>
        {images.map((url, i) => (
          <a
            key={url}
            href={url}
            target="_blank"
            rel="noreferrer"
            className="olw-slide"
          >
            <img
              src={optimize(url, 900)}
              alt={`Photo ${i + 1} of ${images.length}`}
              className="olw-media"
              loading="lazy"
            />
          </a>
        ))}
      </div>
      <span
        className="absolute top-3 right-3 text-[11px] font-medium px-2.5 py-1 rounded-full text-white"
        style={{ backgroundColor: "rgba(64,35,49,0.6)" }}
      >
        {idx + 1}/{images.length}
      </span>
      <div className="flex justify-center gap-1.5 py-2.5">
        {images.map((_, i) => (
          <span
            key={i}
            className="rounded-full"
            style={{
              width: 6,
              height: 6,
              backgroundColor:
                i === idx ? "var(--olw-rose)" : "var(--olw-rose-soft)",
            }}
          />
        ))}
      </div>
    </div>
  );
}

/* ---------- comments ---------- */

function Comments({ postId, username }) {
  const [items, setItems] = useState([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    const q = query(
      collection(db, "posts", postId, "comments"),
      orderBy("createdAt", "asc"),
    );
    const unsub = onSnapshot(
      q,
      (snap) =>
        setItems(
          snap.docs.map((d) => ({
            id: d.id,
            ...d.data({ serverTimestamps: "estimate" }),
          })),
        ),
      (err) => console.error(err),
    );
    return unsub;
  }, [postId]);

  const send = async (e) => {
    e.preventDefault();
    const t = text.trim();
    if (!t || sending) return;
    setSending(true);
    try {
      const batch = writeBatch(db);
      const ref = doc(collection(db, "posts", postId, "comments"));
      batch.set(ref, {
        text: t,
        author: username,
        createdAt: serverTimestamp(),
      });
      batch.update(doc(db, "posts", postId), { commentCount: increment(1) });
      await batch.commit();
      setText("");
    } catch (err) {
      console.error(err);
    } finally {
      setSending(false);
    }
  };

  const remove = async (commentId) => {
    try {
      const batch = writeBatch(db);
      batch.delete(doc(db, "posts", postId, "comments", commentId));
      batch.update(doc(db, "posts", postId), { commentCount: increment(-1) });
      await batch.commit();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div
      className="px-4 pb-4 pt-3"
      style={{ borderTop: "1px solid var(--olw-rose-soft)" }}
    >
      {items.length === 0 ? (
        <p className="text-xs opacity-60 mb-3">
          No comments yet. Say something sweet.
        </p>
      ) : (
        <ul className="space-y-2.5 mb-3">
          {items.map((c) => (
            <li key={c.id} className="text-sm leading-snug">
              <div className="flex items-baseline justify-between gap-2">
                <span
                  className="olw-script text-lg leading-none"
                  style={{ color: "var(--olw-rose)" }}
                >
                  {c.author}
                </span>
                <span className="text-[11px] opacity-50 shrink-0">
                  {formatTime(c)}
                  {c.author === username && (
                    <button
                      type="button"
                      onClick={() => remove(c.id)}
                      className="olw-link-btn ml-2"
                    >
                      Delete
                    </button>
                  )}
                </span>
              </div>
              <p className="mt-0.5 break-words">{c.text}</p>
            </li>
          ))}
        </ul>
      )}

      <form onSubmit={send} className="flex gap-2">
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Add a comment..."
          className="olw-input flex-1 min-w-0 rounded-2xl px-4 py-2.5 text-sm border-b-2"
          style={{
            borderColor: "var(--olw-rose-soft)",
            backgroundColor: "var(--olw-chip-bg)",
          }}
        />
        <button
          type="submit"
          disabled={!text.trim() || sending}
          className="olw-send-btn px-4 py-2.5 rounded-2xl text-white text-sm font-medium"
          style={{
            backgroundColor: "var(--olw-rose)",
            opacity: !text.trim() || sending ? 0.5 : 1,
          }}
        >
          Send
        </button>
      </form>
    </div>
  );
}

/* ---------- single post ---------- */

function PostCard({ post, username }) {
  const [showComments, setShowComments] = useState(false);
  const [popping, setPopping] = useState(false);

  const images = post.images || [];
  const hearts = post.hearts || [];
  const liked = hearts.includes(username);
  const commentCount = Math.max(0, post.commentCount || 0);
  const isMine = post.author === username;
  const timeLabel = formatTime(post);

  const toggleHeart = async () => {
    try {
      await updateDoc(doc(db, "posts", post.id), {
        hearts: liked ? arrayRemove(username) : arrayUnion(username),
      });
      if (!liked) {
        setPopping(true);
        setTimeout(() => setPopping(false), 450);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Delete this post?")) return;
    try {
      const cs = await getDocs(collection(db, "posts", post.id, "comments"));
      const batch = writeBatch(db);
      cs.forEach((c) => batch.delete(c.ref));
      batch.delete(doc(db, "posts", post.id));
      await batch.commit();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <li className="olw-card olw-post-enter shadow-sm">
      <div className="flex items-baseline justify-between px-4 pt-4 pb-3">
        <p
          className="olw-script text-xl leading-none"
          style={{ color: "var(--olw-rose)" }}
        >
          {post.author}
        </p>
        <span className="text-[11px] opacity-50">
          {timeLabel}
          {isMine && (
            <button
              type="button"
              onClick={handleDelete}
              className="olw-link-btn ml-2"
            >
              Delete
            </button>
          )}
        </span>
      </div>

      {images.length > 0 ? (
        <ImageCarousel images={images} />
      ) : (
        post.text && (
          <p className="olw-display text-lg leading-relaxed px-4 pb-2 break-words whitespace-pre-wrap">
            {post.text}
          </p>
        )
      )}

      <div className="flex items-center gap-4 px-4 pt-2 pb-2">
        <button
          type="button"
          onClick={toggleHeart}
          aria-pressed={liked}
          aria-label={liked ? "Remove heart" : "Heart this post"}
          className="olw-action"
          style={{ color: liked ? "var(--olw-rose)" : "inherit" }}
        >
          <HeartIcon
            filled={liked}
            className={popping ? "olw-heart-pop" : ""}
          />
          {hearts.length > 0 && <span>{hearts.length}</span>}
        </button>
        <button
          type="button"
          onClick={() => setShowComments((s) => !s)}
          aria-expanded={showComments}
          aria-label="Comments"
          className="olw-action"
        >
          <CommentIcon />
          {commentCount > 0 && <span>{commentCount}</span>}
        </button>
      </div>

      {images.length > 0 && post.text && (
        <p className="text-sm leading-relaxed px-4 pb-3 break-words whitespace-pre-wrap">
          <span
            className="olw-script text-lg mr-1.5"
            style={{ color: "var(--olw-rose)" }}
          >
            {post.author}
          </span>
          {post.text}
        </p>
      )}

      {images.length === 0 && <div className="pb-1" />}

      {showComments && <Comments postId={post.id} username={username} />}
    </li>
  );
}

/* ---------- composer ---------- */

function Composer({ username }) {
  const [text, setText] = useState("");
  const [files, setFiles] = useState([]); // [{ file, url }]
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef(null);
  const filesRef = useRef([]);
  filesRef.current = files;

  // Free preview URLs if the page is left mid-draft.
  useEffect(() => {
    return () => filesRef.current.forEach((f) => URL.revokeObjectURL(f.url));
  }, []);

  const handlePick = (e) => {
    const picked = Array.from(e.target.files || []);
    e.target.value = "";
    if (picked.length === 0) return;

    setError("");
    const room = MAX_IMAGES - files.length;
    const valid = [];
    let skipped = 0;

    for (const file of picked) {
      const okType = file.type.startsWith("image/");
      const okSize = file.size <= MAX_FILE_MB * 1024 * 1024;
      if (okType && okSize) valid.push(file);
      else skipped++;
    }

    const accepted = valid.slice(0, room);
    if (valid.length > room) skipped += valid.length - room;

    setFiles((prev) => [
      ...prev,
      ...accepted.map((file) => ({ file, url: URL.createObjectURL(file) })),
    ]);

    if (skipped > 0) {
      setError(
        `${skipped} photo${skipped === 1 ? "" : "s"} skipped. Max ${MAX_IMAGES} photos per post, ${MAX_FILE_MB}MB each.`,
      );
    }
  };

  const removeFile = (i) => {
    setFiles((prev) => {
      URL.revokeObjectURL(prev[i].url);
      return prev.filter((_, idx) => idx !== i);
    });
  };

  const canPost = (text.trim() || files.length > 0) && !posting;

  const submit = async (e) => {
    e.preventDefault();
    if (!canPost) return;

    if (files.length > 0 && (!CLOUD_NAME || !UPLOAD_PRESET)) {
      setError(
        "Photo upload isn't set up yet. Add VITE_CLOUDINARY_CLOUD_NAME and VITE_CLOUDINARY_UPLOAD_PRESET to your .env, then restart the dev server.",
      );
      return;
    }

    setPosting(true);
    setError("");
    try {
      const urls = await Promise.all(files.map((f) => uploadImage(f.file)));
      await addDoc(collection(db, "posts"), {
        text: text.trim(),
        images: urls,
        author: username,
        createdAt: serverTimestamp(),
        hearts: [],
        commentCount: 0,
      });
      files.forEach((f) => URL.revokeObjectURL(f.url));
      setFiles([]);
      setText("");
    } catch (err) {
      console.error(err);
      setError("Couldn't post. Check your connection and try again.");
    } finally {
      setPosting(false);
    }
  };

  return (
    <form onSubmit={submit} className="olw-card shadow-sm p-4 mb-6">
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={files.length > 0 ? 2 : 3}
        placeholder={
          files.length > 0 ? "Write a caption..." : "What's on your mind?"
        }
        className="olw-input w-full rounded-2xl px-4 py-3 text-sm border-b-2 resize-none"
        style={{
          borderColor: "var(--olw-rose-soft)",
          backgroundColor: "var(--olw-chip-bg)",
        }}
      />

      {files.length > 0 && (
        <div className="grid grid-cols-4 gap-2 mt-3">
          {files.map((f, i) => (
            <div key={f.url} className="relative">
              <img
                src={f.url}
                alt={`Selected photo ${i + 1}`}
                className="w-full rounded-xl object-cover"
                style={{ aspectRatio: "1 / 1" }}
              />
              <button
                type="button"
                onClick={() => removeFile(i)}
                aria-label={`Remove photo ${i + 1}`}
                disabled={posting}
                className="absolute -top-1.5 -right-1.5 w-6 h-6 rounded-full text-white text-sm leading-none flex items-center justify-center"
                style={{ backgroundColor: "var(--olw-ink)" }}
              >
                &times;
              </button>
            </div>
          ))}
        </div>
      )}

      {error && (
        <p
          className="text-xs mt-3 leading-snug"
          style={{ color: "var(--olw-alert)" }}
          role="alert"
        >
          {error}
        </p>
      )}

      <div className="flex items-center justify-between mt-3">
        <div className="flex items-center gap-3">
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handlePick}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={posting || files.length >= MAX_IMAGES}
            className="olw-action text-sm"
            style={{
              opacity: posting || files.length >= MAX_IMAGES ? 0.5 : 1,
            }}
          >
            <PhotoIcon />
            <span>Add photos</span>
          </button>
          {files.length > 0 && (
            <span className="text-xs opacity-60">
              {files.length}/{MAX_IMAGES}
            </span>
          )}
        </div>
        <button
          type="submit"
          disabled={!canPost}
          className="olw-send-btn px-5 py-2.5 rounded-2xl text-white text-sm font-medium shadow-md"
          style={{
            backgroundColor: "var(--olw-rose)",
            opacity: canPost ? 1 : 0.5,
            cursor: canPost ? "pointer" : "not-allowed",
          }}
        >
          {posting ? "Posting..." : "Post"}
        </button>
      </div>
    </form>
  );
}

/* ---------- page ---------- */

export default function Feed() {
  useGoogleFonts();

  const [username, setUsername] = useState(
    () => localStorage.getItem(NAME_KEY) || "",
  );
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [limitCount, setLimitCount] = useState(PAGE_SIZE);

  useEffect(() => {
    const q = query(
      collection(db, "posts"),
      orderBy("createdAt", "desc"),
      limit(limitCount),
    );
    const unsub = onSnapshot(
      q,
      (snap) => {
        setPosts(
          snap.docs.map((d) => ({
            id: d.id,
            ...d.data({ serverTimestamps: "estimate" }),
          })),
        );
        setLoading(false);
        setLoadError(false);
      },
      (err) => {
        console.error(err);
        setLoadError(true);
        setLoading(false);
      },
    );
    return unsub;
  }, [limitCount]);

  const chooseName = (name) => {
    localStorage.setItem(NAME_KEY, name);
    setUsername(name);
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
        --olw-alert: #DE8A4C;
        --olw-surface: #FFFDFB;
        --olw-chip-bg: rgba(255,255,255,0.7);
        font-family: 'Inter', sans-serif;
        color: var(--olw-ink);
        background-color: var(--olw-paper);
        background-image: radial-gradient(var(--olw-rose-soft) 1px, transparent 1px);
        background-size: 18px 18px;
        min-height: 100%;
      }

      .dark .olw-root {
        --olw-paper: #2b1a26;
        --olw-ink: #f7e9ee;
        --olw-rose: #f0a8bb;
        --olw-rose-soft: rgba(240,168,187,0.16);
        --olw-gold: #e0b563;
        --olw-gold-soft: rgba(224,181,99,0.16);
        --olw-alert: #eda874;
        --olw-surface: #3d2438;
        --olw-chip-bg: rgba(61,36,56,0.7);
      }

      .olw-display { font-family: 'Fraunces', serif; }
      .olw-script { font-family: 'Caveat', cursive; }

      .olw-card {
        background-color: var(--olw-surface);
        border: 1px solid var(--olw-rose-soft);
        border-radius: 1.5rem;
        overflow: hidden;
      }

      .olw-media {
        display: block;
        width: 100%;
        aspect-ratio: 4 / 5;
        object-fit: cover;
        background-color: var(--olw-rose-soft);
      }

      .olw-carousel {
        display: flex;
        overflow-x: auto;
        scroll-snap-type: x mandatory;
        scrollbar-width: none;
        -webkit-overflow-scrolling: touch;
      }
      .olw-carousel::-webkit-scrollbar { display: none; }
      .olw-slide { flex: 0 0 100%; scroll-snap-align: center; }

      .olw-action {
        display: inline-flex;
        align-items: center;
        gap: 0.4rem;
        font-size: 0.875rem;
        font-weight: 500;
        transition: transform 0.15s ease, opacity 0.15s ease;
      }
      .olw-action:not([disabled]):hover { transform: translateY(-1px); }

      .olw-link-btn {
        font-size: 11px;
        color: var(--olw-rose);
        text-decoration: underline;
        text-underline-offset: 2px;
      }

      .olw-btn-name, .olw-send-btn {
        transition: transform 0.15s ease, box-shadow 0.15s ease, opacity 0.15s ease;
      }
      .olw-btn-name:hover, .olw-send-btn:not([disabled]):hover { transform: translateY(-2px); }

      .olw-btn-name:focus-visible,
      .olw-send-btn:focus-visible,
      .olw-action:focus-visible,
      .olw-link-btn:focus-visible,
      .olw-input:focus-visible {
        outline: 2px solid var(--olw-rose);
        outline-offset: 2px;
      }

      @keyframes olw-pop-in {
        0% { opacity: 0; transform: translateY(8px) scale(0.98); }
        100% { opacity: 1; transform: translateY(0) scale(1); }
      }
      .olw-post-enter { animation: olw-pop-in 0.35s ease-out; }

      @keyframes olw-heart-pop {
        0% { transform: scale(1); }
        40% { transform: scale(1.35); }
        70% { transform: scale(0.92); }
        100% { transform: scale(1); }
      }
      .olw-heart-pop { animation: olw-heart-pop 0.45s ease; }

      @media (prefers-reduced-motion: reduce) {
        .olw-post-enter, .olw-heart-pop { animation: none; }
        .olw-carousel { scroll-behavior: auto; }
      }
    `}</style>
  );

  if (!username) {
    return (
      <div className="olw-root flex items-center justify-center p-6">
        {styleBlock}
        <div
          className="max-w-sm w-full text-center backdrop-blur rounded-3xl p-8 shadow-sm"
          style={{
            border: "1px solid var(--olw-rose-soft)",
            backgroundColor: "var(--olw-chip-bg)",
          }}
        >
          <p
            className="olw-script text-2xl"
            style={{ color: "var(--olw-rose)" }}
          >
            before we begin
          </p>
          <h2 className="olw-display text-2xl font-semibold mt-1 mb-6">
            Who's posting?
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

  const hasMore = posts.length >= limitCount;

  return (
    <div className="olw-root px-4 py-8">
      {styleBlock}
      <div className="max-w-md mx-auto">
        <div className="text-center mb-6">
          <p
            className="olw-script text-2xl"
            style={{ color: "var(--olw-rose)" }}
          >
            just the two of us
          </p>
          <h2 className="olw-display text-3xl font-semibold mt-1">Our Feed</h2>
        </div>

        <Composer username={username} />

        {loading ? (
          <p className="text-center text-sm opacity-60">Loading...</p>
        ) : loadError ? (
          <p
            className="text-center text-sm"
            style={{ color: "var(--olw-alert)" }}
          >
            Couldn't load the feed. Check your connection, or your Firestore
            rules for the "posts" collection.
          </p>
        ) : posts.length === 0 ? (
          <p className="text-center text-sm opacity-60">
            No posts yet. Share the first one.
          </p>
        ) : (
          <>
            <ul className="space-y-5">
              {posts.map((post) => (
                <PostCard key={post.id} post={post} username={username} />
              ))}
            </ul>

            {hasMore && (
              <div className="text-center mt-6">
                <button
                  type="button"
                  onClick={() => setLimitCount((c) => c + PAGE_SIZE)}
                  className="olw-btn-name px-5 py-2 rounded-full text-sm font-medium"
                  style={{
                    color: "var(--olw-rose)",
                    border: "1px solid var(--olw-rose-soft)",
                    backgroundColor: "var(--olw-chip-bg)",
                  }}
                >
                  Load older posts
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
