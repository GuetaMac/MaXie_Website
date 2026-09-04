import { useEffect, useState } from "react";
import { doc, onSnapshot, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase";
import { useIdentity } from "../hooks/useIdentity.js";
import IdentityPicker from "./IdentityPicker.jsx";

const MOODS = [
  { key: "great", label: "Great", dot: "bg-gold-400" },
  { key: "okay", label: "Okay", dot: "bg-rose-300" },
  { key: "rough", label: "Rough day", dot: "bg-plum-400" },
  { key: "missing-you", label: "Missing you", dot: "bg-blush-400" },
];

function todayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate(),
  ).padStart(2, "0")}`;
}

/**
 * Home-page widget. Each person picks one mood word per day; both
 * see each other's pick update live, same real-time pattern as your
 * Notes feature. Docs live at moods/{name}_{YYYY-MM-DD} — change the
 * doc-id shape here if you'd rather nest it differently.
 */
function MoodCheckIn() {
  const { me, partner } = useIdentity();
  const [myMood, setMyMood] = useState(null);
  const [partnerMood, setPartnerMood] = useState(null);

  useEffect(() => {
    if (!me) return;
    const unsub = onSnapshot(
      doc(db, "moods", `${me}_${todayKey()}`),
      (snap) => {
        setMyMood(snap.exists() ? snap.data().mood : null);
      },
    );
    return () => unsub();
  }, [me]);

  useEffect(() => {
    if (!partner) return;
    const unsub = onSnapshot(
      doc(db, "moods", `${partner}_${todayKey()}`),
      (snap) => {
        setPartnerMood(snap.exists() ? snap.data().mood : null);
      },
    );
    return () => unsub();
  }, [partner]);

  async function pickMood(key) {
    if (!me) return;
    setMyMood(key);
    await setDoc(doc(db, "moods", `${me}_${todayKey()}`), {
      mood: key,
      name: me,
      date: todayKey(),
      updatedAt: serverTimestamp(),
    });
  }

  if (!me) return <IdentityPicker />;

  const partnerMoodLabel = MOODS.find((m) => m.key === partnerMood)?.label;

  return (
    <section className="rounded-3xl border border-rose-100 bg-white px-6 py-6 sm:px-8 dark:border-plum-500/40 dark:bg-plum-700">
      <span className="page-eyebrow">Mood Check-In</span>
      <p className="font-display text-lg text-plum-700 dark:text-blush-50 mb-4">
        Kumusta ka ngayon?
      </p>

      <div className="flex flex-wrap gap-2">
        {MOODS.map((m) => (
          <button
            key={m.key}
            type="button"
            onClick={() => pickMood(m.key)}
            className={`flex items-center gap-2 rounded-full border px-4 py-2 font-body text-sm transition-colors ${
              myMood === m.key
                ? "border-gold-400 bg-gold-300/30 text-plum-700 dark:border-gold-500/40 dark:bg-gold-500/10 dark:text-blush-50"
                : "border-rose-100 text-plum-500 hover:border-rose-300 dark:border-plum-500/40 dark:text-blush-200/80"
            }`}
          >
            <span
              className={`h-2 w-2 rounded-full ${m.dot}`}
              aria-hidden="true"
            />
            {m.label}
          </button>
        ))}
      </div>

      {partner && (
        <p className="mt-4 font-body text-sm text-plum-400 dark:text-blush-200/70">
          {partnerMoodLabel
            ? `${partner} is feeling: ${partnerMoodLabel.toLowerCase()}`
            : `${partner} hasn't checked in today yet.`}
        </p>
      )}
    </section>
  );
}

export default MoodCheckIn;
