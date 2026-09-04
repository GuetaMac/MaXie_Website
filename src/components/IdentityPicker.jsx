import { useIdentity } from "../hooks/useIdentity.js";

/**
 * Drop this at the top of any feature that needs to know "who's
 * using the app" (Mood Check-in, Wishlist, Send a Hug). Renders
 * nothing once an identity is already picked for this device.
 */
function IdentityPicker() {
  const { me, setMe, options } = useIdentity();
  if (me) return null;

  return (
    <div className="rounded-2xl border border-dashed border-rose-200 bg-rose-50 px-5 py-4 text-center dark:border-plum-500/40 dark:bg-plum-700/60">
      <p className="text-[11px] uppercase tracking-[0.2em] text-rose-400 font-semibold dark:text-rose-300 mb-2">
        Quick thing
      </p>
      <p className="font-body text-plum-600 dark:text-blush-100 mb-3">
        Sino ka dito?
      </p>
      <div className="flex items-center justify-center gap-3">
        {options.map((name) => (
          <button
            key={name}
            type="button"
            onClick={() => setMe(name)}
            className="rounded-full bg-gold-500 px-5 py-2 font-body text-sm text-white hover:bg-gold-600 transition-colors"
          >
            {name}
          </button>
        ))}
      </div>
    </div>
  );
}

export default IdentityPicker;
