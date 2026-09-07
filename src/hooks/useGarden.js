import { useEffect, useState } from "react";
import { db } from "../firebase"; // <- baguhin kung mali yung path
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";

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

  return { tulips, loading };
}
