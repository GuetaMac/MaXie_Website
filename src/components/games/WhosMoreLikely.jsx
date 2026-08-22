import { useState } from "react";

/**
 * "Who's More Likely?" game.
 * Shows one question at a time with two choices (the two partners).
 * After picking, shows a placeholder result, then moves to the next question.
 *
 * Props:
 *  - questions: array of { question, resultText }
 *  - onBack: called when the user wants to leave the game
 */
function WhosMoreLikely({ questions, onBack }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedPerson, setSelectedPerson] = useState(null);
  const [isFinished, setIsFinished] = useState(false);

  const currentQuestion = questions[currentIndex];
  const isLastQuestion = currentIndex === questions.length - 1;
  const people = ["Macky", "Trixie"];

  function handleChoice(person) {
    setSelectedPerson(person);
  }

  function handleNext() {
    if (isLastQuestion) {
      setIsFinished(true);
    } else {
      setCurrentIndex((i) => i + 1);
      setSelectedPerson(null);
    }
  }

  function handlePlayAgain() {
    setCurrentIndex(0);
    setSelectedPerson(null);
    setIsFinished(false);
  }

  return (
    <div className="rounded-3xl border border-rose-100 bg-white p-8 sm:p-10 dark:border-plum-500/40 dark:bg-plum-800">
      <div className="flex items-center justify-between mb-8">
        <span className="page-eyebrow">Who's More Likely?</span>
        <button
          type="button"
          onClick={onBack}
          className="text-sm font-semibold text-plum-400 hover:text-rose-500 transition-colors dark:text-blush-200/80 dark:hover:text-rose-300"
        >
          ← Back
        </button>
      </div>

      {!isFinished ? (
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-rose-400 font-semibold mb-3 dark:text-rose-300">
            Question {currentIndex + 1} of {questions.length}
          </p>
          <h3 className="text-xl font-display text-plum-700 mb-6 dark:text-blush-50">
            {currentQuestion.question}
          </h3>

          <div className="grid grid-cols-2 gap-3 max-w-sm">
            {people.map((person) => (
              <button
                key={person}
                type="button"
                onClick={() => handleChoice(person)}
                className={`rounded-2xl border px-5 py-4 text-sm font-semibold transition-all duration-200 ${
                  selectedPerson === person
                    ? "border-rose-400 bg-rose-50 text-plum-700 dark:border-rose-300/60 dark:bg-plum-700 dark:text-blush-50"
                    : "border-rose-100 text-plum-500 hover:border-rose-200 hover:bg-rose-50/50 dark:border-plum-500/40 dark:text-blush-100 dark:hover:border-rose-300/30 dark:hover:bg-plum-700/50"
                }`}
              >
                {person}
              </button>
            ))}
          </div>

          {selectedPerson && (
            <div className="mt-6 rounded-2xl border border-rose-100 bg-rose-50/60 px-5 py-4 dark:border-plum-500/40 dark:bg-plum-700/60">
              <p className="text-sm text-plum-500 dark:text-blush-100">
                {currentQuestion.resultText}
              </p>
            </div>
          )}

          <button
            type="button"
            onClick={handleNext}
            disabled={selectedPerson === null}
            className="mt-8 rounded-full bg-rose-400 px-6 py-2.5 text-sm font-semibold text-white transition-colors duration-200 hover:bg-rose-500 disabled:bg-rose-100 disabled:text-plum-300 disabled:cursor-not-allowed dark:disabled:bg-plum-700 dark:disabled:text-blush-200/40"
          >
            {isLastQuestion ? "Finish" : "Next"}
          </button>
        </div>
      ) : (
        <div className="text-center py-6">
          <p className="text-xs uppercase tracking-[0.2em] text-rose-400 font-semibold mb-3 dark:text-rose-300">
            All done
          </p>
          <p className="text-plum-400 mb-8 dark:text-blush-200/80">
            That's every question for now.
          </p>

          <div className="flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={handlePlayAgain}
              className="rounded-full bg-rose-400 px-6 py-2.5 text-sm font-semibold text-white hover:bg-rose-500 transition-colors duration-200"
            >
              Play Again
            </button>
            <button
              type="button"
              onClick={onBack}
              className="rounded-full border border-rose-200 px-6 py-2.5 text-sm font-semibold text-plum-500 hover:bg-rose-50 transition-colors duration-200 dark:border-plum-500/40 dark:text-blush-100 dark:hover:bg-plum-700"
            >
              Back to Mini Games
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default WhosMoreLikely;
