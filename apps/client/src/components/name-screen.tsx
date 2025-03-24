import React, { useEffect, useState } from "react";
import { useScoreStore } from "../stores/score.store";

interface NameScreenProps {
  onStart: (name: string) => void;
}

const NameScreen: React.FC<NameScreenProps> = ({ onStart }) => {
  const [name, setName] = useState("");
  const [glowIntensity, setGlowIntensity] = useState(0);

  const { bestScore } = useScoreStore();

  useEffect(() => {
    let direction = 1;
    const interval = setInterval(() => {
      setGlowIntensity((prev) => {
        if (prev >= 1) direction = -1;
        if (prev <= 0) direction = 1;
        return prev + 0.05 * direction;
      });
    }, 50);
    return () => clearInterval(interval);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) onStart(name.trim());
  };

  return (
    <div className="animate-fadeIn fixed inset-0 z-10 flex items-center justify-center bg-gradient-to-br from-[#0f0a24] to-[#1e1e2f]">
      <div className="bg-[radial-gradient(circle,rgba(0,255,255,0.2) 0%,rgba(0,0,0,0) 70%)] absolute inset-0 animate-pulse opacity-50 blur-xl"></div>

      <form
        onSubmit={handleSubmit}
        className="relative rounded-lg border-2 border-cyan-400/50 bg-[#1e1e2f]/80 p-8 text-center shadow-lg shadow-cyan-400/30"
      >
        <h2
          className="animate-flicker mb-6 font-mono text-4xl font-bold text-cyan-400 drop-shadow-lg"
          style={{
            textShadow: `0 0 ${10 + glowIntensity * 15}px #00ffff, 0 0 ${
              20 + glowIntensity * 30
            }px #00ffff`,
          }}
        >
          Enter Your Alias
        </h2>

        <div className="flex justify-center gap-5">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={12}
            placeholder="Type here..."
            className={`w-64 rounded-lg border-2 border-cyan-400 bg-[#2a1e5a]/80 p-3 font-mono text-lg text-cyan-200 transition-all duration-300 outline-none hover:bg-[#2a1e5a] focus:ring-4 focus:ring-cyan-400/50 ${
              name ? "animate-neonPulse" : ""
            }`}
          />

          <button
            type="submit"
            disabled={!name.trim()}
            className={`rounded-lg p-3 px-6 font-mono text-lg text-white transition-all duration-300 ease-in-out ${
              name.trim()
                ? "animate-neonPulse bg-cyan-500 hover:scale-105 hover:bg-cyan-400 active:scale-95"
                : "cursor-not-allowed bg-gray-600 opacity-50"
            }`}
          >
            Enter Battle
          </button>
        </div>

        <p className="mt-6 font-mono text-sm text-cyan-300 drop-shadow">
          Best Score: <span className="text-cyan-400">{bestScore}</span>
        </p>
      </form>
    </div>
  );
};

export default NameScreen;
