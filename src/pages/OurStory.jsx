import { useEffect, useRef, useState } from "react";

// Optional photos for each milestone. Drop an image into src/assets/story/
// named to match a milestone's photoKey below (e.g. first-date.jpg for the
// "Our first date" milestone) and it will show up automatically — no code
// changes needed. Milestones without a matching photo just skip the image.
const storyPhotos = import.meta.glob("../assets/story/*.{png,jpg,jpeg,webp}", {
  eager: true,
  import: "default",
});

function getPhoto(photoKey) {
  const entry = Object.entries(storyPhotos).find(([path]) =>
    path.includes(`/${photoKey}.`),
  );
  return entry ? entry[1] : null;
}

const milestones = [
  {
    index: "01",
    label: "The day we met",
    date: null,
    photoKey: "the-day-we-met",
    story: `Kaklase kita noong first year college — sa klase ni Sir Learsi sa MMW. Tapos biglang ka dumating na late kasi nagpaturok ka pala noon, gawa nakalmot ka ng pusa. Doon ako unang na-in love sayo hihi, nabihag talaga ako non.

Sakto pa, nung umupo ka, nasa likod mo lang ako. Nag-aattendance nun kaya nakita ko pangalan mo tapos pag-uwi ko, hinanap ko agad sa GC natin. Nahiya akong mag-FR non, baka kasi suplada ka, o baka hindi ko maabot yung standards mo, hahaha.

Hanggang sa naging kagroup kita — yun na yung naging daan para magkaroon tayo ng communication. Hanggang sa umamin ako sa'yo, tapos umamin ka rin. Kinikilig pa rin ako habang isinusulat ko 'to HAHAHAHA. I love you.`,
  },
  {
    index: "02",
    label: "Our first date",
    date: "October 2023",
    photoKey: "first-date",
    story: `Hindi ko rin sure kung ito talaga ang unang date natin, pero ito yung unang SM date natin — October 2023. Dito rin nakuha yung unang picture natin, sa photobooth. Gala lang tayo sa SM non nung hindi pa nalalaman tambayan hahaha, pero unforgettable.`,
  },
  {
    index: "03",
    label: "When we became official",
    date: null,
    photoKey: "official",
    story: `Naging official tayo as mag-jowa hihi, ito ay pagkatapos ng graduation. Tulog pa ako non nang sagutin mo ako. At pinaka-nakakatawa, gumamit ka pa ng ChatGPT para tulungan kang mag-isip ng sasabihin, hahaha.`,
  },
];

function useReveal() {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.unobserve(node);
        }
      },
      { threshold: 0.15 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return [ref, visible];
}

function MilestoneCard({ milestone, reversed, sectionRef, onPhotoClick }) {
  const [ref, visible] = useReveal();
  const photo = getPhoto(milestone.photoKey);

  return (
    <div ref={sectionRef} className="relative scroll-mt-24 pl-14 sm:pl-0">
      <span className="absolute left-0 top-2 z-10 flex h-9 w-9 items-center justify-center rounded-full border-2 border-rose-200 bg-white text-rose-400 sm:left-1/2 sm:-translate-x-1/2 dark:border-plum-500/40 dark:bg-plum-800 dark:text-rose-300">
        <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
          <path d="M12 21s-6.716-4.35-9.428-8.09C.86 10.36 1.2 6.9 3.9 5.2c2.2-1.4 4.9-.8 6.4 1.2l1.7 2.2 1.7-2.2c1.5-2 4.2-2.6 6.4-1.2 2.7 1.7 3.04 5.16 1.33 7.71C18.72 16.65 12 21 12 21z" />
        </svg>
      </span>

      <div className="sm:grid sm:grid-cols-2 sm:gap-10">
        <div className={reversed ? "sm:col-start-2" : ""}>
          <div
            ref={ref}
            style={{
              transitionProperty: "opacity, transform",
              transitionDuration: "700ms",
              transitionTimingFunction: "cubic-bezier(0.16, 1, 0.3, 1)",
              opacity: visible ? 1 : 0,
              transform: visible ? "translateY(0)" : "translateY(24px)",
            }}
            className="rounded-3xl border border-rose-100 bg-white p-7 shadow-sm sm:p-10 dark:border-plum-500/40 dark:bg-plum-800"
          >
            <div className="flex items-center gap-3">
              <span className="text-sm font-semibold tracking-[0.3em] text-rose-300 dark:text-blush-200/60">
                {milestone.index}
              </span>
              {milestone.date && (
                <span className="rounded-full bg-rose-50 px-3 py-1 text-xs font-medium text-rose-400 dark:bg-rose-500/20 dark:text-rose-300">
                  {milestone.date}
                </span>
              )}
            </div>

            <div className="mt-5 h-px w-10 bg-rose-200 dark:bg-plum-600" />

            <h3 className="mt-5 font-display text-2xl text-plum-700 sm:text-3xl dark:text-blush-50">
              {milestone.label}
            </h3>

            {photo && (
              <button
                type="button"
                onClick={() => onPhotoClick(photo, milestone.label)}
                className="mt-6 flex w-full cursor-zoom-in justify-center overflow-hidden rounded-2xl bg-rose-50 dark:bg-plum-700"
                aria-label={`View larger photo for ${milestone.label}`}
              >
                <img
                  src={photo}
                  alt={milestone.label}
                  className="h-auto max-h-80 w-auto max-w-full object-contain transition-transform duration-500 hover:scale-[1.03]"
                />
              </button>
            )}

            <p className="mt-6 whitespace-pre-line text-justify text-base leading-loose text-plum-500 sm:text-lg dark:text-blush-100">
              {milestone.story}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function ToBeContinuedCard() {
  const [ref, visible] = useReveal();
  return (
    <div className="relative pl-14 sm:pl-0">
      <span className="absolute left-0 top-2 flex h-9 w-9 items-center justify-center rounded-full border-2 border-dashed border-rose-200 bg-white text-rose-300 sm:left-1/2 sm:-translate-x-1/2 dark:border-plum-500/40 dark:bg-plum-800 dark:text-blush-200/60">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          className="h-4 w-4"
        >
          <circle cx="5" cy="12" r="1" />
          <circle cx="12" cy="12" r="1" />
          <circle cx="19" cy="12" r="1" />
        </svg>
      </span>
      <div
        ref={ref}
        style={{
          transitionProperty: "opacity, transform",
          transitionDuration: "700ms",
          transitionTimingFunction: "cubic-bezier(0.16, 1, 0.3, 1)",
          opacity: visible ? 1 : 0,
          transform: visible ? "translateY(0)" : "translateY(24px)",
        }}
        className="mx-auto max-w-md rounded-3xl border border-dashed border-rose-200 bg-rose-50/60 p-8 text-center sm:p-9 dark:border-plum-500/40 dark:bg-plum-800/60"
      >
        <h3 className="font-display text-xl text-plum-700 dark:text-blush-50">
          To be continued...
        </h3>
        <p className="mt-2 text-base text-plum-400 dark:text-blush-200/80">
          Our story is still being written. More milestones, more memories —
          this space will keep growing with us.
        </p>
      </div>
    </div>
  );
}

function Lightbox({ photo, label, onClose }) {
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  if (!photo) return null;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex cursor-zoom-out items-center justify-center bg-plum-900/80 p-6"
    >
      <img
        src={photo}
        alt={label}
        onClick={(e) => e.stopPropagation()}
        className="max-h-[85vh] max-w-full cursor-default rounded-2xl object-contain shadow-lg"
      />
      <button
        type="button"
        onClick={onClose}
        aria-label="Close photo"
        className="absolute right-5 top-5 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-plum-700 hover:bg-white dark:bg-plum-800/90 dark:text-blush-50 dark:hover:bg-plum-800"
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          className="h-5 w-5"
        >
          <path d="M18 6L6 18" />
          <path d="M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}

function OurStory() {
  const trackRef = useRef(null);
  const sectionRefs = useRef([]);
  const [progress, setProgress] = useState(0);
  const [lightbox, setLightbox] = useState(null);

  useEffect(() => {
    function onScroll() {
      const track = trackRef.current;
      if (!track) return;
      const rect = track.getBoundingClientRect();
      const viewportMid = window.innerHeight * 0.5;
      const total = rect.height;
      const covered = Math.min(Math.max(viewportMid - rect.top, 0), total);
      setProgress(total > 0 ? (covered / total) * 100 : 0);
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  function scrollToMilestone(i) {
    sectionRefs.current[i]?.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });
  }

  return (
    <div>
      <div className="mb-8 text-center sm:text-left">
        <span className="page-eyebrow text-sm tracking-[0.3em]">Our Story</span>
        <h1 className="mt-2 text-4xl sm:text-5xl">Our Story</h1>
        <p className="mx-auto mt-3 max-w-md text-base text-plum-400 sm:mx-0 sm:text-lg dark:text-blush-200/80">
          How we met, our first date, and every little milestone after that.
        </p>
      </div>

      <div className="mb-10 flex flex-wrap justify-center gap-2 sm:justify-start">
        {milestones.map((m, i) => (
          <button
            key={m.index}
            type="button"
            onClick={() => scrollToMilestone(i)}
            className="rounded-full border border-rose-200 px-4 py-1.5 text-sm font-medium text-rose-500 transition hover:bg-rose-50 dark:border-plum-500/40 dark:text-blush-100 dark:hover:bg-plum-700"
          >
            {m.label}
          </button>
        ))}
      </div>

      <div ref={trackRef} className="relative flex flex-col gap-10">
        <div className="absolute bottom-4 left-[17px] top-4 w-px bg-rose-100 sm:left-1/2 sm:-translate-x-1/2 dark:bg-plum-600" />
        <div
          className="absolute left-[17px] top-4 w-px bg-rose-400 transition-all duration-150 sm:left-1/2 sm:-translate-x-1/2 dark:bg-rose-300"
          style={{ height: `${progress}%` }}
        />

        {milestones.map((milestone, i) => (
          <MilestoneCard
            key={milestone.index}
            milestone={milestone}
            reversed={i % 2 === 1}
            sectionRef={(el) => (sectionRefs.current[i] = el)}
            onPhotoClick={(photo, label) => setLightbox({ photo, label })}
          />
        ))}

        <ToBeContinuedCard />
      </div>

      <Lightbox
        photo={lightbox?.photo}
        label={lightbox?.label}
        onClose={() => setLightbox(null)}
      />
    </div>
  );
}

export default OurStory;
