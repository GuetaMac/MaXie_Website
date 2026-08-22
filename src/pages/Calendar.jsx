import { useEffect, useMemo, useState } from "react";

// Small inline icon set (no external dependency needed)
const Icon = {
  Heart: (props) => (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M12 21s-6.716-4.35-9.428-8.09C.86 10.36 1.2 6.9 3.9 5.2c2.2-1.4 4.9-.8 6.4 1.2l1.7 2.2 1.7-2.2c1.5-2 4.2-2.6 6.4-1.2 2.7 1.7 3.04 5.16 1.33 7.71C18.72 16.65 12 21 12 21z" />
    </svg>
  ),
  ChevronLeft: (props) => (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M15 18l-6-6 6-6" />
    </svg>
  ),
  ChevronRight: (props) => (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M9 18l6-6-6-6" />
    </svg>
  ),
  Sparkles: (props) => (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M12 2l1.8 5.2L19 9l-5.2 1.8L12 16l-1.8-5.2L5 9l5.2-1.8L12 2zM19 14l.9 2.6L22.5 17.5 19.9 18.4 19 21l-.9-2.6L15.5 17.5l2.6-.9L19 14zM5 14l.7 2 2 .7-2 .7L5 19.4l-.7-2-2-.7 2-.7L5 14z" />
    </svg>
  ),
  Cake: (props) => (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M20 21v-8a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8" />
      <path d="M4 21h16" />
      <path d="M12 11V7" />
      <path d="M9 7c0-1 .8-1.5.8-2.5S9 3 9 3" />
      <path d="M12 7c0-1 .8-1.5.8-2.5S12 3 12 3" />
      <path d="M15 7c0-1 .8-1.5.8-2.5S15 3 15 3" />
      <path d="M4 16.5c1 .8 2 .8 3 0s2-.8 3 0 2 .8 3 0 2-.8 3 0 2 .8 3 0" />
    </svg>
  ),
  Gift: (props) => (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <rect x="3" y="8" width="18" height="4" rx="1" />
      <path d="M12 8v13" />
      <path d="M19 12v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7" />
      <path d="M7.5 8a2.5 2.5 0 0 1 0-5C10 3 12 8 12 8" />
      <path d="M16.5 8a2.5 2.5 0 0 0 0-5C14 3 12 8 12 8" />
    </svg>
  ),
  Clock: (props) => (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 3" />
    </svg>
  ),
};
const { Heart, ChevronLeft, ChevronRight, Sparkles, Cake, Gift, Clock } = Icon;

// ---- Your key dates -------------------------------------------------
// Change START_DATE if your actual "day one" is different — everything
// else (monthsary count, first anniversary countdown) is computed from it.
const START_DATE = new Date(2026, 6, 30); // July 30, 2026
const ANNIVERSARY = { month: 6, day: 30, label: "Anniversary" }; // July 30
const TRIXIE_BDAY = { month: 2, day: 11, label: "Trixie\u2019s Birthday" };
const MACKY_BDAY = { month: 7, day: 6, label: "Macky\u2019s Birthday" };

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];
const WEEKDAYS = ["S", "M", "T", "W", "T", "F", "S"];

function sameMD(date, month, day) {
  return date.getMonth() === month && date.getDate() === day;
}

function nextAnniversary(from) {
  let year = from.getFullYear();
  let candidate = new Date(year, ANNIVERSARY.month, ANNIVERSARY.day);
  if (candidate <= from)
    candidate = new Date(year + 1, ANNIVERSARY.month, ANNIVERSARY.day);
  return candidate;
}

function nextMonthsary(from) {
  let year = from.getFullYear();
  let month = from.getMonth();
  let candidate = new Date(year, month, 30);
  if (candidate <= from) candidate = new Date(year, month + 1, 30);
  return candidate;
}

function monthsBetween(a, b) {
  return (
    (b.getFullYear() - a.getFullYear()) * 12 + (b.getMonth() - a.getMonth())
  );
}

function useNow() {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  return now;
}

function diffParts(target, now) {
  let ms = target - now;
  if (ms < 0) ms = 0;
  const days = Math.floor(ms / (1000 * 60 * 60 * 24));
  const hours = Math.floor((ms / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((ms / (1000 * 60)) % 60);
  const seconds = Math.floor((ms / 1000) % 60);
  return { days, hours, minutes, seconds };
}

function CountdownTicket({ icon, eyebrow, title, target, now, accent }) {
  const { days, hours, minutes, seconds } = diffParts(target, now);
  const dateLabel = target.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div className="relative overflow-hidden rounded-2xl border border-rose-200 bg-white shadow-sm dark:border-plum-500/40 dark:bg-plum-800">
      <div className={`h-1.5 w-full ${accent.bar}`} />
      <div className="p-6">
        <div className="flex items-center gap-2">
          <span
            className={`flex h-9 w-9 items-center justify-center rounded-full ${accent.chip}`}
          >
            {icon}
          </span>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-rose-400 dark:text-blush-200/80">
              {eyebrow}
            </p>
            <p className="font-serif text-lg font-semibold text-rose-900 dark:text-blush-50">
              {title}
            </p>
          </div>
        </div>

        <p className="mt-1 text-sm text-rose-500 dark:text-blush-100">
          {dateLabel}
        </p>

        <div className="mt-5 grid grid-cols-4 gap-2 text-center">
          {[
            { v: days, l: "days" },
            { v: hours, l: "hrs" },
            { v: minutes, l: "min" },
            { v: seconds, l: "sec" },
          ].map((item) => (
            <div
              key={item.l}
              className="rounded-xl bg-rose-50 py-2.5 transition-transform duration-200 hover:scale-105 dark:bg-plum-700"
            >
              <p className="font-serif text-xl font-bold tabular-nums text-rose-800 dark:text-blush-50">
                {String(item.v).padStart(2, "0")}
              </p>
              <p className="text-[10px] uppercase tracking-wide text-rose-400 dark:text-blush-200/80">
                {item.l}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* perforated ticket edge */}
      <div className="pointer-events-none absolute inset-y-0 left-[-8px] flex flex-col justify-evenly">
        {Array.from({ length: 6 }).map((_, i) => (
          <span
            key={i}
            className="h-2.5 w-2.5 rounded-full bg-rose-50 dark:bg-plum-900"
          />
        ))}
      </div>
    </div>
  );
}

function Calendar() {
  const now = useNow();
  const [viewDate, setViewDate] = useState(
    new Date(now.getFullYear(), now.getMonth(), 1),
  );
  const [hovered, setHovered] = useState(null);

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();

  const goPrev = () => setViewDate(new Date(year, month - 1, 1));
  const goNext = () => setViewDate(new Date(year, month + 1, 1));
  const goToday = () =>
    setViewDate(new Date(now.getFullYear(), now.getMonth(), 1));

  const anniversary = useMemo(() => nextAnniversary(now), [now]);
  const monthsary = useMemo(() => nextMonthsary(now), [now]);
  const anniversaryNumber =
    anniversary.getFullYear() - START_DATE.getFullYear();
  const monthsaryNumber = monthsBetween(START_DATE, monthsary);

  const anniversaryOrdinal =
    anniversaryNumber === 1 ? "First" : `${anniversaryNumber}th`;
  const monthsaryOrdinal =
    monthsaryNumber === 1 ? "First" : `${monthsaryNumber}th`;

  const weeks = useMemo(() => {
    const firstOfMonth = new Date(year, month, 1);
    const startOffset = firstOfMonth.getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const cells = [];
    for (let i = 0; i < startOffset; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(d);
    while (cells.length % 7 !== 0) cells.push(null);

    const rows = [];
    for (let i = 0; i < cells.length; i += 7) rows.push(cells.slice(i, i + 7));
    return rows;
  }, [year, month]);

  function getTag(day) {
    if (!day) return null;
    if (
      sameMD(new Date(year, month, day), ANNIVERSARY.month, ANNIVERSARY.day)
    ) {
      return { type: "anniversary", label: "Anniversary" };
    }
    if (
      sameMD(new Date(year, month, day), TRIXIE_BDAY.month, TRIXIE_BDAY.day)
    ) {
      return { type: "birthday", label: TRIXIE_BDAY.label };
    }
    if (sameMD(new Date(year, month, day), MACKY_BDAY.month, MACKY_BDAY.day)) {
      return { type: "birthday", label: MACKY_BDAY.label };
    }
    if (day === 30) {
      return { type: "monthsary", label: "Monthsary" };
    }
    return null;
  }

  const isToday = (day) =>
    day &&
    year === now.getFullYear() &&
    month === now.getMonth() &&
    day === now.getDate();

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-serif text-3xl font-bold text-rose-900 dark:text-blush-50">
          Our Calendar
        </h1>
        <p className="mt-1 text-rose-500 dark:text-blush-100">
          Every date that matters to us, all in one place.
        </p>
      </div>

      {/* Countdown tickets */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <CountdownTicket
          icon={<Heart className="h-4 w-4 text-rose-600 dark:text-rose-300" />}
          eyebrow={`Countdown to ${anniversaryOrdinal} Anniversary`}
          title={`${anniversaryOrdinal} Anniversary`}
          target={anniversary}
          now={now}
          accent={{
            bar: "bg-rose-400",
            chip: "bg-rose-100 dark:bg-rose-500/20",
          }}
        />
        <CountdownTicket
          icon={
            <Sparkles className="h-4 w-4 text-amber-600 dark:text-amber-300" />
          }
          eyebrow={`Countdown to ${monthsaryOrdinal} Monthsary`}
          title={`${monthsaryOrdinal} Monthsary`}
          target={monthsary}
          now={now}
          accent={{
            bar: "bg-amber-400",
            chip: "bg-amber-100 dark:bg-amber-500/20",
          }}
        />
      </div>

      {/* Month calendar */}
      <div className="rounded-2xl border border-rose-200 bg-white p-5 shadow-sm sm:p-6 dark:border-plum-500/40 dark:bg-plum-800">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="font-serif text-xl font-semibold text-rose-900 dark:text-blush-50">
              {MONTH_NAMES[month]} {year}
            </p>
            <button
              onClick={goToday}
              className="text-xs font-medium text-rose-400 hover:text-rose-600 dark:text-blush-200/80 dark:hover:text-rose-300"
            >
              Back to today
            </button>
          </div>
          <div className="flex gap-1">
            <button
              onClick={goPrev}
              aria-label="Previous month"
              className="flex h-8 w-8 items-center justify-center rounded-full border border-rose-200 text-rose-500 transition hover:bg-rose-50 dark:border-plum-500/40 dark:text-blush-100 dark:hover:bg-plum-700"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={goNext}
              aria-label="Next month"
              className="flex h-8 w-8 items-center justify-center rounded-full border border-rose-200 text-rose-500 transition hover:bg-rose-50 dark:border-plum-500/40 dark:text-blush-100 dark:hover:bg-plum-700"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold uppercase tracking-wide text-rose-300 dark:text-blush-200/60">
          {WEEKDAYS.map((w, i) => (
            <div key={i} className="py-1">
              {w}
            </div>
          ))}
        </div>

        <div className="mt-1 grid grid-cols-7 gap-1">
          {weeks.flat().map((day, i) => {
            const tag = getTag(day);
            const today = isToday(day);
            return (
              <div
                key={i}
                onMouseEnter={() => tag && setHovered(`${i}`)}
                onMouseLeave={() => setHovered(null)}
                className="relative flex aspect-square items-center justify-center"
              >
                {day && (
                  <div
                    className={[
                      "flex h-full w-full flex-col items-center justify-center rounded-xl text-sm transition-transform duration-150",
                      tag
                        ? "cursor-default font-semibold hover:scale-105"
                        : "text-rose-700 dark:text-blush-100",
                      tag?.type === "anniversary"
                        ? "bg-rose-500 text-white shadow-sm dark:bg-rose-600"
                        : "",
                      tag?.type === "birthday"
                        ? "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300"
                        : "",
                      tag?.type === "monthsary"
                        ? "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300"
                        : "",
                      today && !tag
                        ? "ring-2 ring-rose-400 ring-offset-1 dark:ring-rose-300"
                        : "",
                      today && tag
                        ? "ring-2 ring-rose-900 ring-offset-1 dark:ring-blush-50"
                        : "",
                    ].join(" ")}
                  >
                    <span>{day}</span>
                    {tag?.type === "anniversary" && (
                      <Heart className="mt-0.5 h-3 w-3" />
                    )}
                    {tag?.type === "birthday" && (
                      <Cake className="mt-0.5 h-3 w-3" />
                    )}
                    {tag?.type === "monthsary" && (
                      <Gift className="mt-0.5 h-3 w-3" />
                    )}
                  </div>
                )}
                {tag && hovered === `${i}` && (
                  <div className="absolute bottom-full z-10 mb-1 whitespace-nowrap rounded-lg bg-rose-900 px-2 py-1 text-xs text-white shadow-lg">
                    {tag.label}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="mt-5 flex flex-wrap gap-4 border-t border-rose-100 pt-4 text-xs text-rose-500 dark:border-plum-600 dark:text-blush-100">
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-rose-500" />{" "}
            Anniversary
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-purple-300" />{" "}
            Birthdays
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-amber-300" /> Monthsary
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full ring-2 ring-rose-400" />{" "}
            Today
          </span>
        </div>
      </div>

      {/* Upcoming list, kept from your original layout */}
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        {[
          {
            label: "Anniversary",
            value: "Every July 30",
            icon: <Heart className="h-4 w-4" />,
          },
          {
            label: "Trixie\u2019s Birthday",
            value: "March 11",
            icon: <Cake className="h-4 w-4" />,
          },
          {
            label: "Macky\u2019s Birthday",
            value: "August 6",
            icon: <Cake className="h-4 w-4" />,
          },
          {
            label: "Next Date",
            value: "Whenever we finally get the chance \u2014 soon, promise.",
            icon: <Clock className="h-4 w-4" />,
          },
        ].map((item) => (
          <div
            key={item.label}
            className="flex items-start gap-4 rounded-2xl border border-rose-200 bg-white p-5 shadow-sm transition hover:shadow-md dark:border-plum-500/40 dark:bg-plum-800"
          >
            <span className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-rose-100 text-rose-500 dark:bg-rose-500/20 dark:text-rose-300">
              {item.icon}
            </span>
            <div>
              <p className="font-serif font-semibold text-rose-900 dark:text-blush-50">
                {item.label}
              </p>
              <p className="mt-0.5 text-sm text-rose-400 dark:text-blush-200/80">
                {item.value}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Calendar;
