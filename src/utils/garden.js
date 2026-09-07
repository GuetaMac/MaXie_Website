import { db } from "../firebase"; // <- baguhin kung mali yung path, ganun din sa ibang files niyo
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

// Bawat "type" dito ay isang klase ng tulip na tutubo sa Our Garden.
// Dagdag ka na lang dito kung may bagong klase ng interaction sa hinaharap.
export const TULIP_TYPES = {
  note: { label: "note" },
  hug: { label: "hug" },
  mood: { label: "mood check-in" },
  streak: { label: "streak" },
  morning: { label: "morning message" },
};

/**
 * Nagtatanim ng bagong tulip sa shared na "Our Garden".
 * I-call ito kada may interaction — hindi kailangan i-await kung
 * ayaw mong i-block yung ibang logic (fire-and-forget is fine dito).
 *
 * @param {"note"|"hug"|"mood"|"streak"|"morning"} type
 * @param {string} author - "Macky" o "Trixie"
 */
export async function plantTulip(type, author) {
  const safeType = TULIP_TYPES[type] ? type : "note";
  try {
    await addDoc(collection(db, "gardenTulips"), {
      type: safeType,
      author: author || "unknown",
      createdAt: serverTimestamp(),
    });
  } catch (err) {
    // Hindi natin gustong sirain yung buong interaction (e.g. hindi
    // dapat mag-fail yung pag-send ng note) kapag nag-fail lang yung
    // pagtanim ng tulip, kaya console.error lang tayo dito.
    console.error("Failed to plant tulip:", err);
  }
}
