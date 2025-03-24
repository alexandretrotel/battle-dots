import { create } from "zustand";
import { persist } from "zustand/middleware";

interface ScoreStore {
  score: number;
  setScore: (score: number) => void;
  bestScore: number;
  setBestScore: (bestScore: number) => void;
}

export const useScoreStore = create(
  persist<ScoreStore>(
    (set) => ({
      score: 0,
      setScore: (score) => set({ score }),
      bestScore: 0,
      setBestScore: (bestScore) => set({ bestScore }),
    }),
    {
      name: "socket-store",
    },
  ),
);

useScoreStore.subscribe((state) => {
  if (state.score > state.bestScore) {
    useScoreStore.getState().setBestScore(state.score);
  }
});
