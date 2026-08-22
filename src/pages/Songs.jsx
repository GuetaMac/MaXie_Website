import { useEffect, useRef, useState } from "react";

// Optional audio files for each song. Drop an mp3/wav/m4a into
// src/assets/songs/ named to match a song's audioKey below (e.g.
// buwan.mp3 for the "Buwan" entry) and it will show up automatically —
// no code changes needed. Songs without a matching file just show as
// "not added yet" instead of a player.
const songFiles = import.meta.glob("../assets/songs/*.{mp3,wav,ogg,m4a}", {
  eager: true,
  import: "default",
});

function getAudio(audioKey) {
  const entry = Object.entries(songFiles).find(([path]) =>
    path.includes(`/${audioKey}.`),
  );
  return entry ? entry[1] : null;
}

// Edit freely — add, remove, or reorder songs. "for" is optional context
// (which chapter of your story it belongs to); leave it out if it's just
// a song you both love.
const songs = [
  {
    audioKey: "tahanan",
    title: "Tahanan",
    artist: "El Manu",
    for: "The day we met",
    note: "Pinili ko \u2019tong kanta kasi sa\u2019yo ko naramdaman yung feeling na kahit saan tayo mapunta, basta magkasama tayo, parang nasa bahay na rin ako.",
  },
  {
    audioKey: "palagi",
    title: "Palagi",
    artist: "Tj Monterde",
    for: null,
    note: "Pinili ko \u2019tong song kasi gusto kong malaman mo na kahit anong mangyari, ikaw at ikaw pa rin. Palagi.",
  },
  {
    audioKey: "libu",
    title: "Libu-libong Buwan",
    artist: "Kyle Raphael",
    for: null,
    note: "Pinili ko \u2019tong song kasi gusto kong ikaw yung taong makakasama ko sa libu-libong buwan na darating. Ikaw yung gusto kong uuwian, palagi.",
  },
];

function formatTime(seconds) {
  if (!Number.isFinite(seconds)) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

function PlayIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M8 5v14l11-7z" />
    </svg>
  );
}

function PauseIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <rect x="6" y="5" width="4" height="14" rx="1" />
      <rect x="14" y="5" width="4" height="14" rx="1" />
    </svg>
  );
}

function NoteIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M9 18V5l12-2v13" />
      <circle cx="6" cy="18" r="3" fill="currentColor" stroke="none" />
      <circle cx="18" cy="16" r="3" fill="currentColor" stroke="none" />
    </svg>
  );
}

function VinylDisc({ playing }) {
  return (
    <div
      className="relative flex h-16 w-16 shrink-0 items-center justify-center rounded-full shadow-sm"
      style={{
        background:
          "radial-gradient(circle at center, #4a2e42 0 8px, #7a4f68 9px, #7a4f68 22px, #4a2e42 23px, #4a2e42 30px)",
        animation: playing ? "spin-disc 3.2s linear infinite" : "none",
      }}
    >
      <span className="h-2.5 w-2.5 rounded-full bg-rose-100 dark:bg-blush-100" />
    </div>
  );
}

function EqualizerBars() {
  return (
    <span className="flex items-end gap-0.5" aria-hidden="true">
      <span
        className="w-0.5 rounded-full bg-rose-400 dark:bg-rose-300"
        style={{
          animation: "eq-bounce 0.9s ease-in-out infinite",
          animationDelay: "0s",
        }}
      />
      <span
        className="w-0.5 rounded-full bg-rose-400 dark:bg-rose-300"
        style={{
          animation: "eq-bounce 0.9s ease-in-out infinite",
          animationDelay: "0.2s",
        }}
      />
      <span
        className="w-0.5 rounded-full bg-rose-400 dark:bg-rose-300"
        style={{
          animation: "eq-bounce 0.9s ease-in-out infinite",
          animationDelay: "0.4s",
        }}
      />
    </span>
  );
}

function SongCard({ song, index, activeIndex, onPlay, registerRef }) {
  const audioSrc = getAudio(song.audioKey);
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    registerRef(index, audioRef.current);
  }, [index, registerRef]);

  useEffect(() => {
    if (activeIndex !== index && audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  }, [activeIndex, index]);

  function togglePlay() {
    const el = audioRef.current;
    if (!el) return;
    if (el.paused) {
      onPlay(index);
      el.play();
      setIsPlaying(true);
    } else {
      el.pause();
      setIsPlaying(false);
    }
  }

  function handleSeek(e) {
    const el = audioRef.current;
    if (!el) return;
    el.currentTime = Number(e.target.value);
    setCurrent(el.currentTime);
  }

  const percent = duration ? (current / duration) * 100 : 0;

  return (
    <div
      style={{
        animation: `fade-in-up 0.6s ease both`,
        animationDelay: `${index * 90}ms`,
      }}
      className={`rounded-2xl border bg-white p-5 shadow-sm transition-all duration-300 sm:p-6 dark:bg-plum-800 ${
        isPlaying
          ? "border-rose-300 shadow-md dark:border-rose-300/50"
          : "border-rose-100 hover:border-rose-200 hover:shadow-md dark:border-plum-500/40 dark:hover:border-rose-300/40"
      }`}
    >
      <div className="flex items-start gap-4">
        <VinylDisc playing={isPlaying} />

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold tracking-[0.2em] text-rose-300 dark:text-blush-200/60">
                  {String(index + 1).padStart(2, "0")}
                </span>
                {isPlaying && (
                  <span className="flex items-center gap-1.5 text-[11px] font-medium text-rose-400 dark:text-rose-300">
                    <EqualizerBars /> Now playing
                  </span>
                )}
              </div>
              <h3 className="mt-1 truncate font-display text-lg text-plum-700 sm:text-xl dark:text-blush-50">
                {song.title}
              </h3>
              {song.artist && (
                <p className="text-sm text-plum-400 dark:text-blush-200/80">
                  {song.artist}
                </p>
              )}
            </div>
            {song.for && (
              <span className="shrink-0 rounded-full bg-rose-50 px-3 py-1 text-xs font-medium text-rose-400 dark:bg-rose-500/20 dark:text-rose-300">
                {song.for}
              </span>
            )}
          </div>

          {song.note && (
            <div className="mt-3 flex gap-2 rounded-xl bg-rose-50/60 px-3 py-2.5 dark:bg-plum-700/60">
              <NoteIcon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-rose-300 dark:text-rose-300" />
              <p className="text-sm italic leading-relaxed text-plum-500 dark:text-blush-100">
                {song.note}
              </p>
            </div>
          )}

          {audioSrc ? (
            <div className="mt-4 flex items-center gap-3">
              <button
                type="button"
                onClick={togglePlay}
                aria-label={isPlaying ? "Pause" : "Play"}
                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-white transition ${
                  isPlaying ? "bg-rose-500" : "bg-rose-400 hover:bg-rose-500"
                }`}
              >
                {isPlaying ? (
                  <PauseIcon className="h-5 w-5" />
                ) : (
                  <PlayIcon className="h-5 w-5 pl-0.5" />
                )}
              </button>

              <div className="flex-1">
                <input
                  type="range"
                  min={0}
                  max={duration || 0}
                  value={current}
                  onChange={handleSeek}
                  style={{
                    background: `linear-gradient(to right, #fb7185 ${percent}%, var(--track-bg, #ffe4e6) ${percent}%)`,
                  }}
                  className="w-full accent-rose-400 [--track-bg:#ffe4e6] dark:[--track-bg:#3d2438]"
                />
                <div className="mt-1 flex justify-between text-xs text-plum-400 dark:text-blush-200/80">
                  <span>{formatTime(current)}</span>
                  <span>{formatTime(duration)}</span>
                </div>
              </div>

              <audio
                ref={audioRef}
                src={audioSrc}
                onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
                onTimeUpdate={(e) => setCurrent(e.currentTarget.currentTime)}
                onEnded={() => setIsPlaying(false)}
              />
            </div>
          ) : (
            <p className="mt-4 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-400 dark:bg-plum-700 dark:text-blush-200/80">
              Not added yet — drop{" "}
              <code className="rounded bg-white px-1.5 py-0.5 text-rose-500 dark:bg-plum-800 dark:text-rose-300">
                {song.audioKey}.mp3
              </code>{" "}
              into{" "}
              <code className="rounded bg-white px-1.5 py-0.5 text-rose-500 dark:bg-plum-800 dark:text-rose-300">
                src/assets/songs/
              </code>
              .
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function Songs() {
  const [activeIndex, setActiveIndex] = useState(null);
  const audioRefs = useRef({});

  function registerRef(index, el) {
    audioRefs.current[index] = el;
  }

  function handlePlay(index) {
    Object.entries(audioRefs.current).forEach(([i, el]) => {
      if (Number(i) !== index && el) el.pause();
    });
    setActiveIndex(index);
  }

  return (
    <div>
      <style>{`
        @keyframes spin-disc { to { transform: rotate(360deg); } }
        @keyframes eq-bounce { 0%, 100% { height: 4px; } 50% { height: 12px; } }
        @keyframes fade-in-up {
          from { opacity: 0; transform: translateY(14px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <div className="mb-8 flex items-center justify-center gap-3 text-center sm:justify-start sm:text-left">
        <div>
          <span className="page-eyebrow text-sm tracking-[0.3em]">
            Our Playlist
          </span>
          <h1 className="mt-2 text-4xl sm:text-5xl">Our Playlist</h1>
          <p className="mx-auto mt-3 max-w-md text-base text-plum-400 sm:mx-0 sm:text-lg dark:text-blush-200/80">
            The songs that sound like us.
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        {songs.map((song, i) => (
          <SongCard
            key={song.audioKey}
            song={song}
            index={i}
            activeIndex={activeIndex}
            onPlay={handlePlay}
            registerRef={registerRef}
          />
        ))}
      </div>
    </div>
  );
}

export default Songs;
