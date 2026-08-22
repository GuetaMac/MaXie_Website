import { useState } from "react";

/**
 * Reusable multiple-choice quiz component.
 * Handles: showing one question at a time, selecting an answer,
 * scoring, showing the final result, and "Play Again".
 *
 * Props:
 *  - title: shown as the small eyebrow label
 *  - questions: array of { question, options: string[], correctIndex }
 *  - onBack: called when the user wants to leave the game
 */
function QuizGame({ title, questions, onBack }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selected, setSelected] = useState(null);
  const [score, setScore] = useState(0);
  const [isFinished, setIsFinished] = useState(false);

  const currentQuestion = questions[currentIndex];
  const isLastQuestion = currentIndex === questions.length - 1;

  function handleSelect(optionIndex) {
    setSelected(optionIndex);
  }

  function handleNext() {
    if (selected === null) return;

    const isCorrect = selected === currentQuestion.correctIndex;
    const newScore = isCorrect ? score + 1 : score;
    setScore(newScore);

    if (isLastQuestion) {
      setIsFinished(true);
    } else {
      setCurrentIndex((i) => i + 1);
      setSelected(null);
    }
  }

  function handlePlayAgain() {
    setCurrentIndex(0);
    setSelected(null);
    setScore(0);
    setIsFinished(false);
  }

  return (
    <div className="rounded-3xl border border-rose-100 bg-white p-8 sm:p-10 dark:border-plum-500/40 dark:bg-plum-800">
      <div className="flex items-center justify-between mb-8">
        <span className="page-eyebrow">{title}</span>
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {currentQuestion.options.map((option, i) => (
              <button
                key={i}
                type="button"
                onClick={() => handleSelect(i)}
                className={`text-left rounded-2xl border px-5 py-4 text-sm font-medium transition-all duration-200 ${
                  selected === i
                    ? "border-rose-400 bg-rose-50 text-plum-700 dark:border-rose-300/60 dark:bg-plum-700 dark:text-blush-50"
                    : "border-rose-100 text-plum-500 hover:border-rose-200 hover:bg-rose-50/50 dark:border-plum-500/40 dark:text-blush-100 dark:hover:border-rose-300/30 dark:hover:bg-plum-700/50"
                }`}
              >
                {option}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={handleNext}
            disabled={selected === null}
            className="mt-8 rounded-full bg-rose-400 px-6 py-2.5 text-sm font-semibold text-white transition-colors duration-200 hover:bg-rose-500 disabled:bg-rose-100 disabled:text-plum-300 disabled:cursor-not-allowed dark:disabled:bg-plum-700 dark:disabled:text-blush-200/40"
          >
            {isLastQuestion ? "See Results" : "Next"}
          </button>
        </div>
      ) : (
        <div className="text-center py-6">
          <p className="text-xs uppercase tracking-[0.2em] text-rose-400 font-semibold mb-3 dark:text-rose-300">
            Result
          </p>
          <p className="text-4xl font-display text-rose-500 mb-2 dark:text-rose-300">
            {score} / {questions.length}
          </p>
          <p className="text-plum-400 mb-8 dark:text-blush-200/80">
            You got {score} out of {questions.length} right.
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

export default QuizGame;
