import { useRef, useState } from "react";
import { voiceMessages } from "../data/voiceMessages.js";

/**
 * Tap-to-play a random sweet voice clip. Returns:
 * - play(): call this from a button's onClick
 * - caption: the current line's text (null when nothing is showing)
 * - isPlaying: true while audio is playing (use to disable the button)
 */
export function usePenguinVoice() {
  const [caption, setCaption] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef(null);
  const lastIndex = useRef(-1);

  function play() {
    if (voiceMessages.length === 0 || isPlaying) return;

    let index = Math.floor(Math.random() * voiceMessages.length);
    if (voiceMessages.length > 1 && index === lastIndex.current) {
      index = (index + 1) % voiceMessages.length;
    }
    lastIndex.current = index;

    const message = voiceMessages[index];
    setCaption(message.text);
    setIsPlaying(true);

    const audio = new Audio(message.file);
    audioRef.current = audio;

    audio.onended = () => {
      setIsPlaying(false);
      window.setTimeout(() => setCaption(null), 1200);
    };
    audio.onerror = () => {
      // Most common cause: the file isn't actually at that path in
      // public/sounds/ yet, or the filename doesn't match exactly.
      console.error("Penguin voice: couldn't play", message.file);
      setIsPlaying(false);
      window.setTimeout(() => setCaption(null), 1200);
    };

    audio.play().catch((err) => {
      console.error("Penguin voice: play() was rejected", err);
      setIsPlaying(false);
    });
  }

  return { play, caption, isPlaying };
}
