import { useEffect, useState, useCallback } from "react";
import { db } from "../firebase"; // <- baguhin kung mali yung path
import {
  collection,
  onSnapshot,
  query,
  orderBy,
  doc,
  writeBatch,
  serverTimestamp,
} from "firebase/firestore";

/**
 * Real-time listener sa "gardenTulips" collection — parehong makikita
 * ni Macky at Trixie yung parehong garden, live, kahit magkaiba device.
 * Same pattern na ginamit sa useStreak.js para sa notes.
 */
export function useGarden() {
  const [tulips, setTulips] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(
      collection(db, "gardenTulips"),
      orderBy("createdAt", "asc"),
    );
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        setTulips(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
        setLoading(false);
      },
      (err) => {
        console.error("Garden listener error:", err);
        setLoading(false);
      },
    );
    return () => unsubscribe();
  }, []);

  // Waters every id given to it in ONE Firestore batch write instead of
  // one request per flower — "diligan lahat" is a single button tap in
  // the UI, so it should also be a single round-trip to the server.
  // Firestore batches cap out at 500 writes, so this chunks just in
  // case the garden ever gets that big.
  const waterAllTulips = useCallback(async (ids) => {
    if (!ids || ids.length === 0) return;
    try {
      const chunkSize = 450;
      for (let i = 0; i < ids.length; i += chunkSize) {
        const chunk = ids.slice(i, i + chunkSize);
        const batch = writeBatch(db);
        chunk.forEach((id) => {
          batch.update(doc(db, "gardenTulips", id), {
            wateredAt: serverTimestamp(),
          });
        });
        await batch.commit();
      }
    } catch (err) {
      console.error("Failed to water tulips:", ids, err);
    }
  }, []);

  return { tulips, loading, waterAllTulips };
}
