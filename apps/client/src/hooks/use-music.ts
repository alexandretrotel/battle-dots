import { useEffect, useState } from "react";
import bgMusicPath from "../assets/background-music.mp3";

export const useMusic = (isDead: boolean, playerName: string | null) => {
  const [bgMusic] = useState(() => new Audio(bgMusicPath)); // Initialize the audio object

  useEffect(() => {
    if (isDead) {
      bgMusic.pause(); // Stop the music when the player dies
      bgMusic.currentTime = 0; // Reset the music to the beginning
      return;
    }
    if (!playerName) return;

    bgMusic.loop = true; // Loop the background music

    const handleUserInteraction = () => {
      bgMusic.play().catch((error) => {
        console.error("Failed to play background music:", error);
      });
      document.removeEventListener("click", handleUserInteraction);
      document.removeEventListener("keydown", handleUserInteraction);
    };

    // Wait for user interaction
    document.addEventListener("click", handleUserInteraction);
    document.addEventListener("keydown", handleUserInteraction);

    return () => {
      bgMusic.pause(); // Stop the music when the component unmounts
      document.removeEventListener("click", handleUserInteraction);
      document.removeEventListener("keydown", handleUserInteraction);
    };
  }, [bgMusic, isDead, playerName]);
};
