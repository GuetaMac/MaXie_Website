import { Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar.jsx";
import Home from "./pages/Home.jsx";
import OurStory from "./pages/OurStory.jsx";
import Memories from "./pages/Memories.jsx";
import OpenWhen from "./pages/OpenWhen.jsx";
import MiniGames from "./pages/MiniGames.jsx";
import Calendar from "./pages/Calendar.jsx";
import Songs from "./pages/Songs.jsx";
import PasscodeGate from "./components/PasscodeGate.jsx";

function App() {
  return (
    <PasscodeGate answer="07302026" names="Macky & Trixie" storageKey={null}>
      <div className="min-h-screen flex flex-col font-body">
        <Navbar />
        <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-10">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/our-story" element={<OurStory />} />
            <Route path="/memories" element={<Memories />} />
            <Route path="/open-when" element={<OpenWhen />} />
            <Route path="/mini-games" element={<MiniGames />} />
            <Route path="/calendar" element={<Calendar />} />
            <Route path="/songs" element={<Songs />} />
          </Routes>
        </main>
        <footer className="text-center font-body text-xs text-plum-400 py-6">
          made with 💗 for us
        </footer>
      </div>
    </PasscodeGate>
  );
}

export default App;
