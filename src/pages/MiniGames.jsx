import { useState } from "react";
import QuizGame from "../components/games/QuizGame.jsx";
import WhosMoreLikely from "../components/games/WhosMoreLikely.jsx";

// Placeholder questions — edit these arrays any time, no other code to touch.
const loveQuizQuestions = [
  {
    question: "Where did we first meet?",
    options: ["School", "Online", "Through friends", "Work"],
    correctIndex: 0,
  },
  {
    question: "What was our first date?",
    options: ["Movie night", "Coffee date", "Dinner date", "Mall date"],
    correctIndex: 1,
  },
  {
    question: "Who said 'I love you' first?",
    options: ["Macky", "Trixie", "We said it together", "Not yet"],
    correctIndex: 0,
  },
  {
    question: "What's our song?",
    options: [
      "Placeholder Song A",
      "Placeholder Song B",
      "Placeholder Song C",
      "We don't have one yet",
    ],
    correctIndex: 3,
  },
  {
    question: "What's our favorite thing to do together?",
    options: ["Watch movies", "Eat out", "Travel", "Just talk"],
    correctIndex: 3,
  },
];

const whosMoreLikelyQuestions = [
  {
    question: "Who is more likely to fall asleep first?",
    resultText: "Placeholder answer — edit this once you know for sure.",
  },
  {
    question: "Who is more likely to forget an anniversary?",
    resultText: "Placeholder answer — edit this once you know for sure.",
  },
  {
    question: "Who is more likely to cry during a movie?",
    resultText: "Placeholder answer — edit this once you know for sure.",
  },
  {
    question: "Who is more likely to plan a surprise?",
    resultText: "Placeholder answer — edit this once you know for sure.",
  },
  {
    question: "Who is more likely to finish the food first?",
    resultText: "Placeholder answer — edit this once you know for sure.",
  },
];

const games = [
  {
    id: "more-likely",
    index: "01",
    title: "Who's More Likely?",
    description: "Pick who's more likely for each little scenario.",
  },
  {
    id: "love-quiz",
    index: "02",
    title: "Love Quiz",
    description: "A quiz about milestones in our relationship.",
  },
];

function MiniGames() {
  // null = show the game menu, otherwise holds the active game's id.
  const [activeGame, setActiveGame] = useState(null);

  function handleBack() {
    setActiveGame(null);
  }

  return (
    <div>
      {/* Header — matches the minimal style used on Home and Open When */}
      <div className="mb-10 text-center sm:text-left">
        <span className="page-eyebrow">Mini Games</span>
        <h1 className="text-3xl sm:text-4xl">Mini Games</h1>
        <p className="mt-2 text-plum-400 max-w-md mx-auto sm:mx-0 dark:text-blush-200/80">
          A few little games just for us.
        </p>
      </div>

      {activeGame === null && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {games.map((game) => (
            <button
              key={game.id}
              type="button"
              onClick={() => setActiveGame(game.id)}
              className="group text-left rounded-3xl border border-rose-100 bg-white p-7 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-lg hover:border-rose-200 dark:border-plum-500/40 dark:bg-plum-800 dark:hover:border-rose-300/40"
            >
              <span className="text-xs font-semibold tracking-[0.25em] text-rose-300 dark:text-blush-200/60">
                {game.index}
              </span>

              <div className="mt-4 h-px w-8 bg-rose-200 transition-all duration-200 group-hover:w-14 group-hover:bg-rose-400 dark:bg-plum-600 dark:group-hover:bg-rose-300" />

              <h3 className="mt-4 text-base font-semibold text-plum-700 dark:text-blush-50">
                {game.title}
              </h3>
              <p className="mt-1.5 text-sm leading-relaxed text-plum-400 dark:text-blush-200/80">
                {game.description}
              </p>

              <span className="mt-5 inline-block text-sm font-semibold text-rose-500 transition-transform duration-200 group-hover:translate-x-1 dark:text-rose-300">
                Play →
              </span>
            </button>
          ))}
        </div>
      )}

      {activeGame === "more-likely" && (
        <WhosMoreLikely
          questions={whosMoreLikelyQuestions}
          onBack={handleBack}
        />
      )}

      {activeGame === "love-quiz" && (
        <QuizGame
          title="Love Quiz"
          questions={loveQuizQuestions}
          onBack={handleBack}
        />
      )}
    </div>
  );
}

export default MiniGames;
