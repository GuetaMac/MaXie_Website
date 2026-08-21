import { useState } from "react";

// Simple array of letters — no backend, just placeholder data for now.
const letters = [
  {
    id: 1,
    title: "Open when you miss me",
    message:
      "Dear Lovee,\n\nKung binabasa mo ‘to, ibig sabihin namimiss mo ako. Huwag ka na malungkot diyan aysuss bb. Gusto ko lang malaman mo na kahit hindi tayo magkasama ngayon, iniisip din kita. Sana pag binasa mo ‘to, kahit konti lang, gumaan yung feeling mo. Tandaan mo, nandito lang ako palagi. Hindi man kita katabi ngayon, mahal na mahal pa rin kita. Miss na rin kita, bebe.\n\nLove,\nMacky",
  },
  {
    id: 2,
    title: "Open when you're feeling sad",
    message:
      "Dear Lovee,\n\nHi bebe, kung malungkot ka ngayon, gusto ko lang sabihin na okay lang malungkot. Hindi mo naman kailangan maging okay palagi. Sana kahit wala ako diyan para yakapin ka, maramdaman mo pa rin na nandito lang ako para sa’yo. Huwag mong sarilinin lahat, okay? Pwede mo akong kausapin kahit ano pa ’yan. Kaya mo ’yan, bebe. Lilipas din ’yan. Andito lang ako, mahal kita. 🤍\n\nLove,\nMacky",
  },
  {
    id: 3,
    title: "Open when you can't sleep",
    message:
      "Dear Lovee,\n\nHi bebe, hindi ka pa rin ba makatulog? Hahaha. Sana nakahiga ka na nang maayos at nagpapahinga. Huwag ka na muna mag-isip ng kung ano-ano diyan, ipikit mo na lang mata mo at isipin mo na parang katabi mo lang ako hihihi. Kung nandiyan ako, baka kinukulit pa kita hanggang makatulog ka hahaha. Sana mahimbing tulog mo mamaya. Good night, bebe. Mahal kita. 🤍\n\nLove,\nMacky",
  },
  {
    id: 4,
    title: "Open when you're having a bad day",
    message:
      "Dear Lovee,\n\nHi bebe, mukhang hindi naging okay yung araw mo ngayon. Gusto ko lang sabihin na okay lang kung pagod ka or wala ka sa mood. Huwag mong masyadong sisihin sarili mo sa mga bagay na hindi naman natin kontrolado. Pahinga ka muna, kain ka nang maayos, at hayaan mong matapos yung araw. Bawi tayo bukas. Sana kahit papaano napangiti kita kahit konti sa message na ’to. Andito lang ako palagi para sa’yo, bebe. Mahal na mahal kita. 🤍\n\nLove,\nMacky",
  },
  {
    id: 5,
    title: "Open when you're angry at me",
    message:
      "Dear Lovee,\n\nHi bebe, kung galit ka sa akin ngayon, sige lang, ilabas mo muna. Alam kong may dahilan ka kung bakit ka galit, kaya hindi kita pipilitin na maging okay agad. Kung may nagawa man ako na nakasakit sa’yo, sorry po talaga. Hindi ko naman sinasadyang saktan ka. Kapag ready ka na, pag-usapan natin nang maayos, ayoko kasing matulog tayong may sama ng loob sa isa’t isa. Mahal kita kahit galit ka sa akin, bebe. 🤍\n\nLove,\nMacky",
  },
  {
    id: 6,
    title: "Open when you need reassurance",
    message:
      "Dear Lovee,\n\nHi bebe, kung kailangan mo lang ng assurance ngayon, eto na oh: mahal na mahal kita at ikaw lang. Hindi nagbago yung feelings ko sa’yo at hindi rin basta-basta magbabago. Kahit may mga araw na tahimik tayo or busy sa isa’t isa, hindi ibig sabihin nun na nababawasan yung pagmamahal ko. Ikaw pa rin yung gusto kong makasama at makasama sa mga susunod pang araw. Kaya huwag ka nang mag-overthink diyan, bebe. Nandito lang ako, palagi. 🤍\n\nLove,\nMacky",
  },
  {
    id: 7,
    title: "Open when you're happy",
    message:
      "Dear Lovee,\n\nHi bebe, kung masaya ka ngayon, masaya rin ako para sa’yo. Sana i-enjoy mo lang yung moment na ’to at huwag mong kalimutang ngumiti. Gusto ko makita kang masaya, kahit sa simpleng bagay lang. Sana marami pang araw na ganito para sa’yo, at sana makasama rin ako sa mga dahilan kung bakit ka masaya. Enjoy mo lang, bebe. Deserve mong maging masaya. Mahal kita palagi. 🤍\n\nLove,\nMacky",
  },
  {
    id: 8,
    title: "Open when you want to feel loved",
    message:
      "Dear Lovee,\n\nHi bebe, sana ramdam mo yung pagmamahal ko sa’yo kahit hindi tayo magkasama. Lagi kitang iniisip at pinapangarap na makasama. Huwag kang mag-alala, andito lang ako para sa’yo, sa lahat ng pagkakataon. Mahal na mahal kita, at sana maramdaman mo yun sa bawat sulat na ito. 🤍\n\nLove,\nMacky",
  },
];

function OpenWhen() {
  // Holds the currently open letter (or null when the modal is closed).
  const [activeLetter, setActiveLetter] = useState(null);

  return (
    <div>
      {/* Header — matches the minimal style used on Home, no icons/emoji */}
      <div className="mb-10 text-center sm:text-left">
        <span className="page-eyebrow">Open When...</span>
        <h1 className="text-3xl sm:text-4xl">Open When...</h1>
        <p className="mt-2 text-plum-400 max-w-md mx-auto sm:mx-0">
          Little letters for different moments.
        </p>
      </div>

      {/* Letter grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {letters.map((letter, i) => (
          <button
            key={letter.id}
            type="button"
            onClick={() => setActiveLetter(letter)}
            className="group text-left rounded-3xl border border-rose-100 bg-white p-7 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-lg hover:border-rose-200"
          >
            <span className="text-xs font-semibold tracking-[0.25em] text-rose-300">
              {String(i + 1).padStart(2, "0")}
            </span>

            <div className="mt-4 h-px w-8 bg-rose-200 transition-all duration-200 group-hover:w-14 group-hover:bg-rose-400" />

            <h3 className="mt-4 text-base font-semibold text-plum-700">
              {letter.title}
            </h3>

            <span className="mt-5 inline-block text-sm font-semibold text-rose-500 transition-transform duration-200 group-hover:translate-x-1">
              Read →
            </span>
          </button>
        ))}
      </div>

      {/* Modal */}
      {activeLetter && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-plum-700/40 px-4"
          onClick={() => setActiveLetter(null)}
        >
          <div
            className="w-full max-w-md rounded-3xl bg-white border border-rose-100 shadow-lg p-8 relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setActiveLetter(null)}
              aria-label="Close letter"
              className="absolute top-5 right-5 text-plum-400 hover:text-rose-500 text-sm font-semibold"
            >
              Close
            </button>

            <span className="page-eyebrow">Letter</span>
            <h2 className="text-xl font-display text-plum-700 pr-16">
              {activeLetter.title}
            </h2>

            <p className="mt-5 text-plum-500 leading-relaxed whitespace-pre-line text-justify">
              {activeLetter.message}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default OpenWhen;
