import { Volume2 } from "lucide-react";
import { useRef, useState } from "react";
import { Button } from "../../../components/ui/button.jsx";

export default function PronunciationButton({ audioUrl, text, size = "icon" }) {
  const audioRef = useRef(null);
  const [playing, setPlaying] = useState(false);

  async function handlePlay() {
    const value = String(text || "").trim();
    if (!value || playing) return;

    setPlaying(true);
    try {
      if (audioUrl) {
        audioRef.current?.pause();
        const audio = new Audio(audioUrl);
        audioRef.current = audio;
        audio.onended = () => setPlaying(false);
        audio.onerror = () => {
          setPlaying(false);
          playWithBrowserVoice(value);
        };
        await audio.play();
        return;
      }
      playWithBrowserVoice(value);
    } catch {
      setPlaying(false);
      playWithBrowserVoice(value);
    }
  }

  function playWithBrowserVoice(value) {
    if (!("speechSynthesis" in window)) {
      setPlaying(false);
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(value);
    const voices = window.speechSynthesis.getVoices();
    utterance.voice = voices.find((voice) => voice.lang === "en-GB") || voices.find((voice) => voice.lang.startsWith("en")) || null;
    utterance.lang = utterance.voice?.lang || "en-US";
    utterance.rate = 0.82;
    utterance.onend = () => setPlaying(false);
    utterance.onerror = () => setPlaying(false);
    window.speechSynthesis.speak(utterance);
  }

  return <Button aria-label={`Phát âm ${text}`} className={playing ? "text-coral" : ""} disabled={!String(text || "").trim()} onClick={handlePlay} size={size} type="button" variant="ghost"><Volume2 className={playing ? "animate-pulse" : ""} size={17} />{size !== "icon" ? "Nghe phát âm" : null}</Button>;
}
