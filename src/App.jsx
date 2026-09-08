import { Routes, Route } from "react-router-dom";
import TopBar from "./components/TopBar.jsx";
import BottomNav from "./components/BottomNav.jsx";
import Home from "./pages/Home.jsx";
import OurStory from "./pages/OurStory.jsx";
import Memories from "./pages/Memories.jsx";
import OpenWhen from "./pages/OpenWhen.jsx";
import MiniGames from "./pages/MiniGames.jsx";
import Calendar from "./pages/Calendar.jsx";
import Songs from "./pages/Songs.jsx";
import Notes from "./pages/Notes.jsx";
import Wishlist from "./pages/Wishlist.jsx";
import OurGarden from "./pages/OurGarden.jsx";
import PasscodeGate from "./components/PasscodeGate.jsx";
import SpecialDaySurprise from "./components/SpecialDaySurprise.jsx";
import { PetProvider } from "./context/PetContext.jsx";
import OurPet from "./pages/OurPet.jsx";

function App() {
  return (
    <PasscodeGate answer="07302026" names="Macky & Trixie" storageKey={null}>
      <PetProvider partners={["Macky", "Trixie"]}>
        <div className="min-h-screen flex flex-col font-body">
          <SpecialDaySurprise />
          <TopBar />
          <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 pt-10 pb-24">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/our-story" element={<OurStory />} />
              <Route path="/memories" element={<Memories />} />
              <Route path="/open-when" element={<OpenWhen />} />
              <Route path="/mini-games" element={<MiniGames />} />
              <Route path="/calendar" element={<Calendar />} />
              <Route path="/songs" element={<Songs />} />
              <Route path="/notes" element={<Notes />} />
              <Route path="/wishlist" element={<Wishlist />} />
              <Route path="/our-garden" element={<OurGarden />} />
              <Route path="/our-pet" element={<OurPet />} />
            </Routes>

            <p className="text-center font-body text-xs text-plum-400 pt-10 dark:text-blush-200/60">
              made with 💗 for us
            </p>
          </main>
          <BottomNav />
        </div>
      </PetProvider>
    </PasscodeGate>
  );
}

export default App;
