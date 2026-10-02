import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
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
    if (isToday) return `Today, ${time}`;
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

function HeartIcon({ filled, className = "", size = 22 }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
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

function PlusIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="26"
      height="26"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

function CloseIcon({ size = 18 }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  );
}

function ChevronIcon({ dir = "right" }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="20"
      height="20"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={dir === "right" ? "M9 5l7 7-7 7" : "M15 5l-7 7 7 7"} />
    </svg>
  );
}

/* ---------- avatar ---------- */

function Avatar({ name, size = 38 }) {
  const isTrixie = name === "Trixie";
  return (
    <span
      className="olw-avatar olw-display"
      style={{
        width: size,
        height: size,
        fontSize: size * 0.45,
        background: isTrixie
          ? "linear-gradient(135deg, #E58CA0, #C6667A)"
          : "linear-gradient(135deg, #D9B15A, #C99A3B)",
      }}
      aria-hidden="true"
    >
      {(name || "?").charAt(0).toUpperCase()}
    </span>
  );
}

/* ---------- lightbox ---------- */

function Lightbox({ images, start, onClose }) {
  const [i, setI] = useState(start);
  const many = images.length > 1;

  const go = (d) => setI((c) => (c + d + images.length) % images.length);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight" && many) go(1);
      if (e.key === "ArrowLeft" && many) go(-1);
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return createPortal(
    <div
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Photo viewer"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 100,
        backgroundColor: "rgba(20,10,16,0.92)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "1rem",
      }}
    >
      <img
        src={optimize(images[i], 1600)}
        alt={`Photo ${i + 1} of ${images.length}`}
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: "100%",
          maxHeight: "100%",
          objectFit: "contain",
          borderRadius: "1rem",
        }}
      />
      <button
        type="button"
        onClick={onClose}
        aria-label="Close"
        className="olw-lb-btn"
        style={{ top: 16, right: 16 }}
      >
        <CloseIcon />
      </button>
      {many && (
        <>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              go(-1);
            }}
            aria-label="Previous photo"
            className="olw-lb-btn"
            style={{ left: 16, top: "50%", marginTop: -20 }}
          >
            <ChevronIcon dir="left" />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              go(1);
            }}
            aria-label="Next photo"
            className="olw-lb-btn"
            style={{ right: 16, top: "50%", marginTop: -20 }}
          >
            <ChevronIcon dir="right" />
          </button>
          <span
            style={{
              position: "fixed",
              bottom: 20,
              left: "50%",
              transform: "translateX(-50%)",
              color: "#fff",
              fontSize: 13,
              fontWeight: 500,
              padding: "6px 14px",
              borderRadius: 999,
              backgroundColor: "rgba(255,255,255,0.14)",
            }}
          >
            {i + 1} / {images.length}
          </span>
        </>
      )}
    </div>,
    document.body,
  );
}

/* ---------- image carousel ---------- */

function ImageCarousel({ images }) {
  const [idx, setIdx] = useState(0);
  const [viewer, setViewer] = useState(null); // index or null
  const scrollRef = useRef(null);

  const onScroll = (e) => {
    const el = e.currentTarget;
    if (!el.clientWidth) return;
    setIdx(Math.round(el.scrollLeft / el.clientWidth));
  };

  const goTo = (i) => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTo({ left: i * el.clientWidth, behavior: "smooth" });
  };

  if (images.length === 1) {
    return (
      <>
        <button
          type="button"
          onClick={() => setViewer(0)}
          className="olw-slide-btn"
          aria-label="Open photo"
        >
          <img
            src={optimize(images[0], 900)}
            alt="Post"
            className="olw-media"
            loading="lazy"
          />
        </button>
        {viewer !== null && (
          <Lightbox
            images={images}
            start={viewer}
            onClose={() => setViewer(null)}
          />
        )}
      </>
    );
  }

  return (
    <div className="relative olw-carousel-wrap">
      <div className="olw-carousel" onScroll={onScroll} ref={scrollRef}>
        {images.map((url, i) => (
          <button
            key={url}
            type="button"
            onClick={() => setViewer(i)}
            className="olw-slide olw-slide-btn"
            aria-label={`Open photo ${i + 1}`}
          >
            <img
              src={optimize(url, 900)}
              alt={`Photo ${i + 1} of ${images.length}`}
              className="olw-media"
              loading="lazy"
            />
          </button>
        ))}
      </div>

      {idx > 0 && (
        <button
          type="button"
          onClick={() => goTo(idx - 1)}
          aria-label="Previous photo"
          className="olw-arrow"
          style={{ left: 10 }}
        >
          <ChevronIcon dir="left" />
        </button>
      )}
      {idx < images.length - 1 && (
        <button
          type="button"
          onClick={() => goTo(idx + 1)}
          aria-label="Next photo"
          className="olw-arrow"
          style={{ right: 10 }}
        >
          <ChevronIcon dir="right" />
        </button>
      )}

      <span
        className="absolute top-3 right-3 text-[11px] font-medium px-2.5 py-1 rounded-full text-white"
        style={{
          backgroundColor: "rgba(64,35,49,0.6)",
          backdropFilter: "blur(4px)",
        }}
      >
        {idx + 1}/{images.length}
      </span>
      <div className="flex justify-center gap-1.5 py-2.5">
        {images.map((_, i) => (
          <span
            key={i}
            className="rounded-full"
            style={{
              width: i === idx ? 16 : 6,
              height: 6,
              transition: "width 0.2s ease, background-color 0.2s ease",
              backgroundColor:
                i === idx ? "var(--olw-rose)" : "var(--olw-rose-soft)",
            }}
          />
        ))}
      </div>

      {viewer !== null && (
        <Lightbox
          images={images}
          start={viewer}
          onClose={() => setViewer(null)}
        />
      )}
    </div>
  );
}

/* ---------- comments ---------- */

function Comments({ postId, username, items }) {
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);

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
        <ul className="space-y-3 mb-3">
          {items.map((c) => (
            <li key={c.id} className="flex gap-2.5 text-sm leading-snug">
              <Avatar name={c.author} size={28} />
              <div
                className="flex-1 min-w-0 rounded-2xl px-3.5 py-2"
                style={{ backgroundColor: "var(--olw-chip-bg)" }}
              >
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
              </div>
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
  const [comments, setComments] = useState(null); // null = not loaded yet

  // Listen to the real comments so the count always matches what's inside.
  useEffect(() => {
    const q = query(
      collection(db, "posts", post.id, "comments"),
      orderBy("createdAt", "asc"),
    );
    const unsub = onSnapshot(
      q,
      (snap) =>
        setComments(
          snap.docs.map((d) => ({
            id: d.id,
            ...d.data({ serverTimestamps: "estimate" }),
          })),
        ),
      (err) => console.error(err),
    );
    return unsub;
  }, [post.id]);

  const images = post.images || [];
  const hearts = post.hearts || [];
  const liked = hearts.includes(username);
  // Use the stored counter only until the real comments arrive.
  const commentCount = comments
    ? comments.length
    : Math.max(0, post.commentCount || 0);
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
      <div className="flex items-center gap-3 px-4 pt-4 pb-3">
        <Avatar name={post.author} />
        <div className="flex-1 min-w-0">
          <p
            className="olw-script text-xl leading-none"
            style={{ color: "var(--olw-rose)" }}
          >
            {post.author}
          </p>
          <p className="text-[11px] opacity-50 mt-1">{timeLabel}</p>
        </div>
        {isMine && (
          <button type="button" onClick={handleDelete} className="olw-link-btn">
            Delete
          </button>
        )}
      </div>

      {images.length > 0 ? (
        <ImageCarousel images={images} />
      ) : (
        post.text && (
          <div className="olw-quote mx-4 mb-2">
            <span className="olw-quote-mark olw-display" aria-hidden="true">
              &ldquo;
            </span>
            <p className="olw-display text-lg leading-relaxed break-words whitespace-pre-wrap">
              {post.text}
            </p>
          </div>
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
          style={{ color: showComments ? "var(--olw-rose)" : "inherit" }}
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

      {showComments && (
        <Comments postId={post.id} username={username} items={comments || []} />
      )}
    </li>
  );
}

/* ---------- composer (lives inside the bottom sheet) ---------- */

function Composer({ username, open, onClose, onPosted }) {
  const [text, setText] = useState("");
  const [files, setFiles] = useState([]); // [{ file, url }]
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef(null);
  const textRef = useRef(null);
  const filesRef = useRef([]);
  filesRef.current = files;

  // Free preview URLs if the page is left mid-draft.
  useEffect(() => {
    return () => filesRef.current.forEach((f) => URL.revokeObjectURL(f.url));
  }, []);

  // Focus the textarea when the sheet opens.
  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => textRef.current?.focus(), 250);
    return () => clearTimeout(t);
  }, [open]);

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
      onPosted();
    } catch (err) {
      console.error(err);
      setError("Couldn't post. Check your connection and try again.");
    } finally {
      setPosting(false);
    }
  };

  return (
    <form onSubmit={submit}>
      <div className="flex items-center gap-3 mb-4">
        <Avatar name={username} size={36} />
        <div className="flex-1 min-w-0">
          <p
            className="olw-script text-base leading-none opacity-70"
            style={{ color: "var(--olw-ink)" }}
          >
            new moment
          </p>
          <p className="olw-display text-lg font-semibold leading-tight">
            Posting as {username}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="olw-icon-btn"
        >
          <CloseIcon />
        </button>
      </div>

      <textarea
        ref={textRef}
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={files.length > 0 ? 2 : 4}
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

      <div className="flex items-center justify-between mt-4">
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
            className="olw-action olw-chip text-sm"
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
          className="olw-send-btn px-6 py-2.5 rounded-2xl text-white text-sm font-medium shadow-md"
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

/* ---------- loading skeleton ---------- */

function SkeletonCard() {
  return (
    <li className="olw-card shadow-sm" aria-hidden="true">
      <div className="flex items-center gap-3 px-4 pt-4 pb-3">
        <span
          className="olw-skel"
          style={{ width: 38, height: 38, borderRadius: 999 }}
        />
        <div className="flex-1">
          <span className="olw-skel block" style={{ width: 90, height: 14 }} />
          <span
            className="olw-skel block mt-2"
            style={{ width: 60, height: 10 }}
          />
        </div>
      </div>
      <div
        className="olw-skel"
        style={{ width: "100%", aspectRatio: "4 / 3", borderRadius: 0 }}
      />
      <div className="px-4 py-4">
        <span className="olw-skel block" style={{ width: "70%", height: 12 }} />
      </div>
    </li>
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
  const [composerOpen, setComposerOpen] = useState(false);

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

  // Esc closes the composer, and the page behind it stops scrolling.
  useEffect(() => {
    if (!composerOpen) return;
    const onKey = (e) => {
      if (e.key === "Escape") setComposerOpen(false);
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [composerOpen]);

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

      /* ----- cards ----- */
      .olw-card {
        background-color: var(--olw-surface);
        border: 1px solid var(--olw-rose-soft);
        border-radius: 1.5rem;
        overflow: hidden;
        transition: box-shadow 0.25s ease, transform 0.25s ease;
      }
      li.olw-card:hover {
        box-shadow: 0 10px 30px -12px rgba(198,102,122,0.35);
      }

      .olw-avatar {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
        border-radius: 999px;
        color: #fff;
        font-weight: 600;
        box-shadow: 0 0 0 2px var(--olw-surface), 0 0 0 3.5px var(--olw-rose-soft);
      }

      /* ----- media ----- */
      .olw-media {
        display: block;
        width: 100%;
        aspect-ratio: 4 / 5;
        object-fit: cover;
        background-color: var(--olw-rose-soft);
      }
      .olw-slide-btn {
        display: block;
        width: 100%;
        padding: 0;
        border: 0;
        background: none;
        cursor: zoom-in;
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

      .olw-arrow {
        position: absolute;
        top: 42%;
        width: 36px;
        height: 36px;
        border-radius: 999px;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #402331;
        background-color: rgba(255,253,251,0.9);
        box-shadow: 0 2px 10px rgba(0,0,0,0.2);
        opacity: 0;
        transition: opacity 0.2s ease, transform 0.15s ease;
      }
      .olw-carousel-wrap:hover .olw-arrow { opacity: 1; }
      .olw-arrow:hover { transform: scale(1.08); }
      @media (hover: none) { .olw-arrow { display: none; } }

      .olw-lb-btn {
        position: fixed;
        width: 40px;
        height: 40px;
        border-radius: 999px;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #fff;
        background-color: rgba(255,255,255,0.16);
        transition: background-color 0.15s ease;
      }
      .olw-lb-btn:hover { background-color: rgba(255,255,255,0.28); }

      /* ----- text-only posts ----- */
      .olw-quote {
        position: relative;
        padding: 1.5rem 1.25rem 1.25rem 1.5rem;
        border-radius: 1.25rem;
        background: linear-gradient(135deg, var(--olw-gold-soft), var(--olw-rose-soft));
      }
      .olw-quote-mark {
        position: absolute;
        top: -0.35rem;
        left: 0.7rem;
        font-size: 3.5rem;
        line-height: 1;
        color: var(--olw-rose);
        opacity: 0.45;
      }

      /* ----- actions ----- */
      .olw-action {
        display: inline-flex;
        align-items: center;
        gap: 0.4rem;
        font-size: 0.875rem;
        font-weight: 500;
        transition: transform 0.15s ease, opacity 0.15s ease;
      }
      .olw-action:not([disabled]):hover { transform: translateY(-1px); }

      .olw-chip {
        padding: 0.5rem 0.9rem;
        border-radius: 999px;
        border: 1px solid var(--olw-rose-soft);
        background-color: var(--olw-chip-bg);
      }

      .olw-icon-btn {
        width: 36px;
        height: 36px;
        border-radius: 999px;
        display: flex;
        align-items: center;
        justify-content: center;
        border: 1px solid var(--olw-rose-soft);
        background-color: var(--olw-chip-bg);
        transition: transform 0.15s ease;
      }
      .olw-icon-btn:hover { transform: rotate(90deg); }

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
      .olw-icon-btn:focus-visible,
      .olw-fab:focus-visible,
      .olw-arrow:focus-visible,
      .olw-slide-btn:focus-visible,
      .olw-input:focus-visible {
        outline: 2px solid var(--olw-rose);
        outline-offset: 2px;
      }

      /* ----- floating button ----- */
      .olw-fab {
        position: fixed;
        z-index: 30;
        bottom: 5.75rem;
        right: max(1.25rem, calc(50vw - 14rem));
        width: 58px;
        height: 58px;
        border-radius: 999px;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #fff;
        background: linear-gradient(135deg, #E58CA0, #C6667A);
        box-shadow: 0 10px 24px -6px rgba(198,102,122,0.65);
        transition: transform 0.2s ease, opacity 0.2s ease, box-shadow 0.2s ease;
      }
      .olw-fab:hover { transform: translateY(-3px) scale(1.05); }
      .olw-fab:active { transform: scale(0.95); }
      .olw-fab::after {
        content: "";
        position: absolute;
        inset: 0;
        border-radius: 999px;
        border: 2px solid var(--olw-rose);
        animation: olw-ring 2.4s ease-out infinite;
        pointer-events: none;
      }
      .olw-fab.is-hidden { opacity: 0; transform: scale(0.6); pointer-events: none; }

      @keyframes olw-ring {
        0% { transform: scale(1); opacity: 0.7; }
        100% { transform: scale(1.5); opacity: 0; }
      }

      /* ----- composer bottom sheet ----- */
      .olw-sheet-wrap {
        position: fixed;
        inset: 0;
        z-index: 60;
        display: flex;
        align-items: flex-end;
        justify-content: center;
        visibility: hidden;
        transition: visibility 0s linear 0.3s;
      }
      .olw-sheet-wrap.is-open {
        visibility: visible;
        transition-delay: 0s;
      }
      .olw-backdrop {
        position: absolute;
        inset: 0;
        background-color: rgba(30,12,22,0.5);
        backdrop-filter: blur(3px);
        opacity: 0;
        transition: opacity 0.3s ease;
      }
      .olw-sheet-wrap.is-open .olw-backdrop { opacity: 1; }

      .olw-sheet {
        position: relative;
        width: 100%;
        max-width: 32rem;
        max-height: 92vh;
        overflow-y: auto;
        padding: 0.75rem 1.25rem 1.5rem;
        background-color: var(--olw-surface);
        border: 1px solid var(--olw-rose-soft);
        border-bottom: 0;
        border-radius: 1.75rem 1.75rem 0 0;
        box-shadow: 0 -20px 50px -20px rgba(0,0,0,0.4);
        transform: translateY(100%);
        transition: transform 0.35s cubic-bezier(0.22, 1, 0.36, 1);
      }
      .olw-sheet-wrap.is-open .olw-sheet { transform: translateY(0); }

      .olw-grab {
        width: 42px;
        height: 4px;
        border-radius: 999px;
        margin: 0 auto 1rem;
        background-color: var(--olw-rose-soft);
      }

      @media (min-width: 640px) {
        .olw-sheet-wrap { align-items: center; }
        .olw-sheet {
          border-bottom: 1px solid var(--olw-rose-soft);
          border-radius: 1.75rem;
          padding-bottom: 1.5rem;
          transform: translateY(24px) scale(0.97);
          opacity: 0;
          transition: transform 0.3s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.25s ease;
        }
        .olw-sheet-wrap.is-open .olw-sheet { transform: none; opacity: 1; }
        .olw-grab { display: none; }
      }

      /* ----- header flourish ----- */
      .olw-divider {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        margin: 1rem auto 0;
        max-width: 14rem;
        color: var(--olw-rose);
      }
      .olw-divider::before, .olw-divider::after {
        content: "";
        flex: 1;
        height: 1px;
        background: linear-gradient(90deg, transparent, var(--olw-rose-soft), transparent);
      }

      /* ----- skeleton ----- */
      .olw-skel {
        display: inline-block;
        border-radius: 8px;
        background: linear-gradient(90deg, var(--olw-rose-soft) 25%, var(--olw-gold-soft) 50%, var(--olw-rose-soft) 75%);
        background-size: 200% 100%;
        animation: olw-shimmer 1.4s ease-in-out infinite;
      }
      @keyframes olw-shimmer {
        0% { background-position: 200% 0; }
        100% { background-position: -200% 0; }
      }

      /* ----- animations ----- */
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

      @keyframes olw-float {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-5px); }
      }
      .olw-float { animation: olw-float 3s ease-in-out infinite; }

      @media (prefers-reduced-motion: reduce) {
        .olw-post-enter, .olw-heart-pop, .olw-float, .olw-skel, .olw-fab::after { animation: none; }
        .olw-carousel { scroll-behavior: auto; }
        .olw-sheet, .olw-backdrop { transition: none; }
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
      <div className="max-w-md mx-auto pb-28">
        <div className="text-center mb-8">
          <p
            className="olw-script text-2xl"
            style={{ color: "var(--olw-rose)" }}
          >
            just the two of us
          </p>
          <h2 className="olw-display text-3xl font-semibold mt-1">Our Feed</h2>
          <div className="olw-divider" aria-hidden="true">
            <HeartIcon filled size={14} />
          </div>
        </div>

        {loading ? (
          <ul className="space-y-5">
            <SkeletonCard />
            <SkeletonCard />
          </ul>
        ) : loadError ? (
          <p
            className="text-center text-sm"
            style={{ color: "var(--olw-alert)" }}
          >
            Couldn't load the feed. Check your connection, or your Firestore
            rules for the "posts" collection.
          </p>
        ) : posts.length === 0 ? (
          <div className="olw-card shadow-sm text-center px-6 py-12">
            <div
              className="olw-float inline-block"
              style={{ color: "var(--olw-rose)" }}
            >
              <HeartIcon filled size={44} />
            </div>
            <h3 className="olw-display text-xl font-semibold mt-4">
              No moments yet
            </h3>
            <p className="text-sm opacity-70 mt-1">
              Tap the + button to share the first one.
            </p>
          </div>
        ) : (
          <>
            <ul className="space-y-6">
              {posts.map((post) => (
                <PostCard key={post.id} post={post} username={username} />
              ))}
            </ul>

            {hasMore ? (
              <div className="text-center mt-8">
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
            ) : (
              <p
                className="olw-script text-center text-xl mt-8 opacity-70"
                style={{ color: "var(--olw-rose)" }}
              >
                that's everything, for now
              </p>
            )}
          </>
        )}
      </div>

      {/* Floating "new post" button */}
      <button
        type="button"
        onClick={() => setComposerOpen(true)}
        aria-label="Create a new post"
        className={`olw-fab ${composerOpen ? "is-hidden" : ""}`}
      >
        <PlusIcon />
      </button>

      {/* Composer sheet. Always mounted so a half-written draft survives closing. */}
      <div
        className={`olw-sheet-wrap ${composerOpen ? "is-open" : ""}`}
        aria-hidden={!composerOpen}
      >
        <div className="olw-backdrop" onClick={() => setComposerOpen(false)} />
        <div
          className="olw-sheet"
          role="dialog"
          aria-modal="true"
          aria-label="New post"
        >
          <div className="olw-grab" />
          <Composer
            username={username}
            open={composerOpen}
            onClose={() => setComposerOpen(false)}
            onPosted={() => setComposerOpen(false)}
          />
        </div>
      </div>
    </div>
  );
}
