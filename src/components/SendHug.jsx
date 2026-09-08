import { useEffect, useState } from "react";
import {
  addDoc,
  collection,
  doc,
  onSnapshot,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import { db } from "../firebase";
import { useIdentity } from "../hooks/useIdentity.js";

const TYPES = {
  hug: { label: "Hug", symbol: "○" },
  kiss: { label: "Kiss", symbol: "♥" },
};

/**
 * Floating button — drop it once in a top-level layout (e.g. next to
 * <SpecialDayModal /> in Home, or in App.jsx if you want it on every
 * page) so it isn't duplicated per-page.
 *
 * Unlike a live-only toast, incoming hugs/kisses are marked with a
 * "seen" flag in Firestore, so they PERSIST until the recipient
 * actually opens the app and sees them — not just while both of you
 * happen to be online at the same time.
 *
 * Positioning note: both the FAB and the "sent" confirmation sit above
 * the app's fixed bottom tab bar (BottomNav.jsx) plus the device's
 * safe-area inset, so they never overlap the "More" tab or get clipped
 * behind the iPhone home indicator.
 */
function SendHug() {
  const { me, partner } = useIdentity();
  const [open, setOpen] = useState(false);
  const [toast, setToast] = useState(null); // { id, type, from }
  const [sentConfirm, setSentConfirm] = useState(null);

  // Watch for any hug/kiss sent to me that hasn't been seen yet —
  // this fires immediately on mount too, so it catches ones sent
  // while I was offline.
  useEffect(() => {
    if (!me) return;
    const q = query(
      collection(db, "hugs"),
      where("to", "==", me),
      where("seen", "==", false),
    );
    const unsub = onSnapshot(
      q,
      (snap) => {
        if (snap.empty) return;

        // Sort client-side so we show the most recent one first.
        const unseen = snap.docs
          .map((d) => ({ id: d.id, ...d.data() }))
          .sort(
            (a, b) =>
              (b.createdAt?.toMillis?.() ?? 0) -
              (a.createdAt?.toMillis?.() ?? 0),
          );
        const latest = unseen[0];
        setToast({ id: latest.id, type: latest.type, from: latest.from });

        // Mark every unseen one as seen so they don't pile up and
        // re-trigger next time you open the app.
        unseen.forEach((h) => {
          updateDoc(doc(db, "hugs", h.id), { seen: true }).catch((err) =>
            console.error("SendHug: failed to mark as seen", err),
          );
        });
      },
      (err) => {
        console.error("SendHug: failed to listen for incoming hugs", err);
      },
    );
    return () => unsub();
  }, [me]);

  async function send(type) {
    if (!me || !partner) return;
    setOpen(false);
    try {
      await addDoc(collection(db, "hugs"), {
        type,
        from: me,
        to: partner,
        seen: false,
        createdAt: serverTimestamp(),
      });
      setSentConfirm(type);
      window.setTimeout(() => setSentConfirm(null), 2500);
    } catch (err) {
      console.error("SendHug: failed to send", err);
    }
  }

  function dismissToast() {
    setToast(null);
  }

  if (!me || !partner) return null;

  return (
    <>
      <div className="fixed bottom-[calc(5.5rem+env(safe-area-inset-bottom))] right-5 z-40 flex flex-col items-end gap-2">
        {open && (
          <div className="flex flex-col gap-2 rounded-2xl border border-rose-100 bg-white p-2 shadow-lg dark:border-plum-500/40 dark:bg-plum-700">
            {Object.entries(TYPES).map(([key, t]) => (
              <button
                key={key}
                type="button"
                onClick={() => send(key)}
                className="flex items-center gap-2 rounded-xl px-4 py-2 font-body text-sm text-plum-600 hover:bg-rose-50 transition-colors dark:text-blush-100 dark:hover:bg-plum-800/50"
              >
                <span className="text-rose-400" aria-hidden="true">
                  {t.symbol}
                </span>
                Send {t.label}
              </button>
            ))}
          </div>
        )}
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="h-12 w-12 rounded-full bg-gold-500 text-white font-display text-lg hover:bg-gold-600 transition-colors"
          style={{
            boxShadow:
              "inset 0 -3px 6px rgba(0,0,0,0.15), inset 0 3px 4px rgba(255,255,255,0.3)",
          }}
          aria-label="Send a hug or kiss"
        >
          ♥
        </button>
      </div>

      {/* Confirmation for the SENDER — shows right after tapping send */}
      {sentConfirm && (
        <div className="fixed bottom-[calc(10.25rem+env(safe-area-inset-bottom))] right-5 z-50 rounded-2xl border border-rose-200 bg-white px-5 py-3 shadow-lg dark:border-plum-500/40 dark:bg-plum-700">
          <p className="font-body text-sm font-medium text-plum-700 dark:text-blush-50">
            Sent {sentConfirm === "kiss" ? "a kiss" : "a hug"} to {partner}{" "}
            {TYPES[sentConfirm].symbol}
          </p>
        </div>
      )}

      {/* Popup for the RECEIVER — persists until you open the app and
          see it, since it's driven by the "seen" flag, not timing */}
      {toast && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-plum-900/50 px-6 backdrop-blur-sm"
          onClick={dismissToast}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-sm rounded-3xl border border-gold-400 bg-white px-8 py-9 text-center shadow-2xl dark:border-gold-500/40 dark:bg-plum-700"
          >
            <span
              className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-gold-300/40 text-4xl text-rose-500 dark:bg-gold-500/10 dark:text-rose-300"
              aria-hidden="true"
            >
              {TYPES[toast.type].symbol}
            </span>

            <span className="page-eyebrow">Incoming</span>
            <p className="font-display text-2xl text-plum-700 dark:text-blush-50">
              {toast.from} sent you {toast.type === "kiss" ? "a kiss" : "a hug"}
            </p>

            <button
              type="button"
              onClick={dismissToast}
              className="mt-6 rounded-full bg-gold-500 px-8 py-2.5 font-body text-sm font-semibold text-white hover:bg-gold-600 transition-colors"
            >
              Aww
            </button>
          </div>
        </div>
      )}
    </>
  );
}

export default SendHug;
