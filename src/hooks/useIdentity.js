import { useEffect, useState } from "react";

const STORAGE_KEY = "olw-identity";
const PARTNERS = ["Macky", "Trixie"];

/**
 * Simple "who's using the app right now" identity — no login system,
 * just remembers a choice in this browser's localStorage. If you
 * already have some other way of knowing who's who (e.g. from your
 * Notes reactions feature), swap the internals here; the shape this
 * returns ({ me, partner, setMe, options }) is what MoodCheckIn,
 * Wishlist, and SendHug all expect.
 */
export function useIdentity() {
  const [me, setMeState] = useState(
    () => localStorage.getItem(STORAGE_KEY) || null,
  );

  useEffect(() => {
    if (me) localStorage.setItem(STORAGE_KEY, me);
  }, [me]);

  const setMe = (name) => {
    if (PARTNERS.includes(name)) setMeState(name);
  };

  const partner = me ? PARTNERS.find((p) => p !== me) : null;

  return { me, partner, setMe, options: PARTNERS };
}
