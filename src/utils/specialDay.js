// Keep this START_DATE in sync with the one in Calendar.jsx —
// it's used to compute anniversary years and monthsary counts.
const START_DATE = new Date(2026, 6, 30); // July 30, 2026

const ANNIVERSARY = { month: 6, day: 30 }; // July 30
const TRIXIE_BDAY = { month: 2, day: 11 }; // March 11
const MACKY_BDAY = { month: 7, day: 6 }; // August 6
const CHRISTMAS = { month: 11, day: 25 }; // December 25

function monthsBetween(a, b) {
  return (
    (b.getFullYear() - a.getFullYear()) * 12 + (b.getMonth() - a.getMonth())
  );
}

// Proper English ordinal suffix: 1st, 2nd, 3rd, 4th... 11th, 12th, 13th
// (11/12/13 are always "th" even though they end in 1/2/3), 21st, 22nd, 23rd...
function ordinal(n) {
  if (n === 1) return "First";

  const remainder100 = n % 100;
  if (remainder100 >= 11 && remainder100 <= 13) {
    return `${n}th`;
  }

  switch (n % 10) {
    case 1:
      return `${n}st`;
    case 2:
      return `${n}nd`;
    case 3:
      return `${n}rd`;
    default:
      return `${n}th`;
  }
}

/**
 * Checks today's date (or a given date) against all special occasions.
 * Returns { type, title, message } if today matches one, otherwise null.
 * Priority: anniversary > monthsary > birthdays > christmas.
 */
export function getSpecialDay(date = new Date()) {
  const month = date.getMonth();
  const day = date.getDate();

  // 1. Anniversary — July 30
  if (month === ANNIVERSARY.month && day === ANNIVERSARY.day) {
    const years = date.getFullYear() - START_DATE.getFullYear();
    if (years >= 1) {
      return {
        type: "anniversary",
        icon: "💍",
        title: `Happy ${ordinal(years)} Anniversary!`,
        message:
          "Isang taon, isa pang dahilan para mahalin kita nang lubusan. Mahal na mahal kita, bebe.",
      };
    }
  }

  // 2. Monthsary — 30th of every month (except the anniversary month itself,
  // already handled above)
  if (day === 30) {
    const count = monthsBetween(START_DATE, date);
    if (count >= 1) {
      return {
        type: "monthsary",
        icon: "🤍",
        title: `Happy ${ordinal(count)} Monthsary!`,
        message:
          "Happy monthsaryyyy to us bb. Thank you for being there alwaysss bb. I hope this simple message and surprise conveys how much I love you!",
      };
    }
  }

  // 3. Birthdays
  if (month === TRIXIE_BDAY.month && day === TRIXIE_BDAY.day) {
    return {
      type: "birthday",
      icon: "🎂",
      title: "Happy Birthday, Trixie!",
      message:
        "Sana puno ng saya at pagmamahal ang araw mo ngayon, bebe. Mahal kita!",
    };
  }
  if (month === MACKY_BDAY.month && day === MACKY_BDAY.day) {
    return {
      type: "birthday",
      icon: "🎂",
      title: "Happy Birthday, Macky!",
      message: "Ikaw Trixie ang paboritong regalo nya taon-taon!.",
    };
  }

  // 4. Christmas
  if (month === CHRISTMAS.month && day === CHRISTMAS.day) {
    return {
      type: "christmas",
      icon: "🎄",
      title: "Merry Christmas!",
      message:
        "Salamat sa isa pang taon ng pagmamahalan. Ikaw ang best gift ko bb.",
    };
  }

  return null;
}

// Storage key changes every day, so the "already seen" flag naturally
// resets tomorrow (and next year) without any manual cleanup.
export function getDismissKey(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `special_day_seen_${y}-${m}-${d}`;
}
