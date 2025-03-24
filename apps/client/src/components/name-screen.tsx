import React, { useEffect, useState } from "react";

interface NameScreenProps {
  onStart: (name: string) => void;
}

const NameScreen: React.FC<NameScreenProps> = ({ onStart }) => {
  const [name, setName] = useState("");
  const [glowIntensity, setGlowIntensity] = useState(0);

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
    <div className="animate-fadeIn fixed inset-0 z-10 flex items-center justify-center bg-gradient-to-b from-[#1e1e2f] to-[#0f0a24]">
      <div className="bg-[radial-gradient(circle,rgba(255,0,255,0.2) 0%,rgba(0,0,0,0) 70%)] absolute inset-0 animate-pulse opacity-50 blur-xl"></div>

      <form
        onSubmit={handleSubmit}
        className="relative rounded-lg border-fuchsia-500/50 p-8 text-center"
      >
        <h2
          className="mb-6 font-mono text-3xl text-white drop-shadow-lg transition-all duration-500"
          style={{
            textShadow: `0 0 ${10 + glowIntensity * 15}px #ff00ff, 0 0 ${
              20 + glowIntensity * 30
            }px #ff00ff`,
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
            className={`w-64 rounded-lg border-2 border-fuchsia-500 bg-[#2a1e5a] p-3 font-mono text-lg text-white transition-all duration-300 outline-none focus:ring-4 focus:ring-fuchsia-500/50 ${
              name ? "shadow-md shadow-fuchsia-500" : ""
            }`}
          />

          <button
            type="submit"
            disabled={!name.trim()}
            className={`rounded-lg p-3 px-6 font-mono text-lg text-white transition-all duration-300 ease-in-out ${
              name.trim()
                ? "animate-pulse cursor-pointer bg-fuchsia-500 shadow-md shadow-fuchsia-500 hover:scale-105 hover:bg-fuchsia-400 active:scale-95"
                : "cursor-not-allowed bg-gray-600 opacity-50"
            }`}
          >
            Enter Battle
          </button>
        </div>
      </form>
    </div>
  );
};

export default NameScreen;
