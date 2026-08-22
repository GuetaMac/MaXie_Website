import { Link } from "react-router-dom";

const TINTS = ["bg-blush-100", "bg-rose-100", "bg-gold-300"];
const DARK_TINTS = [
  "dark:bg-plum-500",
  "dark:bg-plum-600",
  "dark:bg-gold-500/30",
];
const SEAL_TINTS = ["bg-blush-400", "bg-rose-400", "bg-gold-500"];

/**
 * A single clickable card on the homepage dashboard, styled like a
 * small closed envelope. On hover the flap lifts and a little wax
 * dot appears, then settles back down — same "sealed letter" idea
 * as the entrance and the "Open When..." feature.
 *
 * Props:
 *  - to: route path
 *  - index: display index, e.g. "01"
 *  - title: card title
 *  - description: short description text
 */
function FeatureCard({ to, index, title, description }) {
  const pos = (parseInt(index, 10) || 1) - 1;
  const tint = `${TINTS[pos % TINTS.length]} ${DARK_TINTS[pos % DARK_TINTS.length]}`;
  const seal = SEAL_TINTS[pos % SEAL_TINTS.length];

  return (
    <Link
      to={to}
      className="group relative block overflow-hidden rounded-3xl border border-rose-100 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:border-rose-200 dark:border-plum-500/40 dark:bg-plum-700 dark:hover:border-rose-400/40"
    >
      {/* envelope flap */}
      <div
        className={`absolute inset-x-0 top-0 h-14 origin-top transition-transform duration-300 ease-out group-hover:-translate-y-1.5 ${tint}`}
        style={{ clipPath: "polygon(0 0, 100% 0, 50% 68%)" }}
        aria-hidden="true"
      >
        <span
          className={`absolute left-1/2 top-3 h-2 w-2 -translate-x-1/2 rounded-full opacity-0 transition-opacity duration-300 group-hover:opacity-100 ${seal}`}
        />
      </div>

      <div className="relative px-7 pb-7 pt-8">
        <span className="text-xs font-semibold tracking-[0.25em] text-rose-300 dark:text-rose-200">
          {index}
        </span>

        <div className="mt-4 h-px w-8 bg-rose-200 transition-all duration-200 group-hover:w-14 group-hover:bg-rose-400 dark:bg-plum-500 dark:group-hover:bg-rose-400" />

        <h3 className="mt-4 font-display text-lg font-semibold text-plum-700 dark:text-blush-50">
          {title}
        </h3>
        <p className="mt-1.5 font-body text-sm leading-relaxed text-plum-400 dark:text-blush-200/80">
          {description}
        </p>

        <span className="mt-5 inline-block font-body text-sm font-semibold text-rose-500 transition-transform duration-200 group-hover:translate-x-1 dark:text-rose-300">
          Open →
        </span>
      </div>
    </Link>
  );
}

export default FeatureCard;
