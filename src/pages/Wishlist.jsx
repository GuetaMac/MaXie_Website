import { useEffect, useState } from "react";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import { db } from "../firebase";
import { useIdentity } from "../hooks/useIdentity.js";
import IdentityPicker from "../components/IdentityPicker.jsx";

/**
 * Two-sided wishlist. You only ever see "claimed" status on your
 * PARTNER's items — never on your own — so surprises stay surprises.
 * Firestore collection: "wishlist"
 * { title, note, link, addedBy, claimedBy, createdAt }
 */
function Wishlist() {
  const { me, partner } = useIdentity();
  const [items, setItems] = useState([]);
  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");
  const [link, setLink] = useState("");

  useEffect(() => {
    const q = query(collection(db, "wishlist"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      setItems(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, []);

  if (!me) return <IdentityPicker />;

  const myItems = items.filter((item) => item.addedBy === me);
  const partnerItems = items.filter((item) => item.addedBy === partner);

  async function handleAdd(e) {
    e.preventDefault();
    if (!title.trim()) return;
    await addDoc(collection(db, "wishlist"), {
      title: title.trim(),
      note: note.trim(),
      link: link.trim(),
      addedBy: me,
      claimedBy: null,
      createdAt: serverTimestamp(),
    });
    setTitle("");
    setNote("");
    setLink("");
  }

  async function handleDelete(id) {
    await deleteDoc(doc(db, "wishlist", id));
  }

  async function toggleClaim(item) {
    await updateDoc(doc(db, "wishlist", item.id), {
      claimedBy: item.claimedBy ? null : me,
    });
  }

  return (
    <div>
      <section className="mb-8 text-center">
        <span className="page-eyebrow">For Us</span>
        <h1 className="text-4xl sm:text-5xl">Wishlist</h1>
        <p className="mt-3 font-body text-plum-400 max-w-md mx-auto dark:text-blush-200/80">
          Mga gustong-gusto naming bilhin, gawin, o matanggap balang araw.
        </p>
      </section>

      {/* Add form — always adds to MY list */}
      <form
        onSubmit={handleAdd}
        className="mb-10 rounded-3xl border border-rose-100 bg-white px-6 py-6 sm:px-8 dark:border-plum-500/40 dark:bg-plum-700"
      >
        <span className="page-eyebrow">Add to my wishlist</span>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ano ito?"
            className="rounded-xl border border-rose-100 bg-rose-50/50 px-4 py-2 font-body text-sm text-plum-700 focus:outline-none focus:border-rose-300 dark:border-plum-500/40 dark:bg-plum-800/40 dark:text-blush-50"
            required
          />
          <input
            value={link}
            onChange={(e) => setLink(e.target.value)}
            placeholder="Link (optional)"
            className="rounded-xl border border-rose-100 bg-rose-50/50 px-4 py-2 font-body text-sm text-plum-700 focus:outline-none focus:border-rose-300 dark:border-plum-500/40 dark:bg-plum-800/40 dark:text-blush-50"
          />
        </div>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Bakit gusto mo 'to? (optional)"
          rows={2}
          className="mt-3 w-full rounded-xl border border-rose-100 bg-rose-50/50 px-4 py-2 font-body text-sm text-plum-700 focus:outline-none focus:border-rose-300 dark:border-plum-500/40 dark:bg-plum-800/40 dark:text-blush-50"
        />
        <button
          type="submit"
          className="mt-3 rounded-full bg-gold-500 px-5 py-2 font-body text-sm text-white hover:bg-gold-600 transition-colors"
        >
          Add
        </button>
      </form>

      <div className="grid gap-6 sm:grid-cols-2">
        {/* My list — no claimed status shown, stays a surprise */}
        <div>
          <h2 className="font-display text-lg text-plum-700 dark:text-blush-50 mb-3">
            My Wishlist
          </h2>
          <div className="space-y-3">
            {myItems.length === 0 && (
              <p className="font-body text-sm text-plum-400 dark:text-blush-200/70">
                Wala pa rito — magdagdag sa taas.
              </p>
            )}
            {myItems.map((item) => (
              <div
                key={item.id}
                className="rounded-2xl border border-rose-100 bg-white px-5 py-4 dark:border-plum-500/40 dark:bg-plum-700"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-body font-medium text-plum-700 dark:text-blush-50">
                      {item.link ? (
                        <a
                          href={item.link}
                          target="_blank"
                          rel="noreferrer"
                          className="hover:text-rose-500 underline decoration-rose-200"
                        >
                          {item.title}
                        </a>
                      ) : (
                        item.title
                      )}
                    </p>
                    {item.note && (
                      <p className="mt-1 font-body text-sm text-plum-400 dark:text-blush-200/70">
                        {item.note}
                      </p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDelete(item.id)}
                    className="shrink-0 font-body text-xs text-rose-400 hover:text-rose-600"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Partner's list — claim toggle visible, this is where surprises happen */}
        <div>
          <h2 className="font-display text-lg text-plum-700 dark:text-blush-50 mb-3">
            {partner ? `${partner}'s Wishlist` : "Partner's Wishlist"}
          </h2>
          <div className="space-y-3">
            {partnerItems.length === 0 && (
              <p className="font-body text-sm text-plum-400 dark:text-blush-200/70">
                Wala pa silang nailalagay.
              </p>
            )}
            {partnerItems.map((item) => (
              <div
                key={item.id}
                className={`rounded-2xl border px-5 py-4 ${
                  item.claimedBy
                    ? "border-gold-400 bg-gold-300/20 dark:border-gold-500/40 dark:bg-gold-500/10"
                    : "border-rose-100 bg-white dark:border-plum-500/40 dark:bg-plum-700"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-body font-medium text-plum-700 dark:text-blush-50">
                      {item.link ? (
                        <a
                          href={item.link}
                          target="_blank"
                          rel="noreferrer"
                          className="hover:text-rose-500 underline decoration-rose-200"
                        >
                          {item.title}
                        </a>
                      ) : (
                        item.title
                      )}
                    </p>
                    {item.note && (
                      <p className="mt-1 font-body text-sm text-plum-400 dark:text-blush-200/70">
                        {item.note}
                      </p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => toggleClaim(item)}
                    className="shrink-0 font-body text-xs font-semibold text-rose-500 hover:text-rose-600 whitespace-nowrap dark:text-rose-300"
                  >
                    {item.claimedBy ? "Unclaim" : "I'll handle this"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Wishlist;
