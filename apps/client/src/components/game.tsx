import React, { useEffect, useState } from "react";
import NameScreen from "./name-screen";
import RespawnScreen from "./respawn-screen";
import useGameLoop from "../hooks/use-game-loop";

const Game: React.FC = () => {
  const [showRespawnScreen, setShowRespawnScreen] = useState(false);

  const { playerName, handleStart, isDead, handleRespawn, canvasRef } =
    useGameLoop();

  useEffect(() => {
    if (isDead) {
      setShowRespawnScreen(true);
    } else {
      setShowRespawnScreen(false);
    }
  }, [isDead]);

  if (!playerName) {
    return <NameScreen onStart={handleStart} />;
  }

  if (showRespawnScreen) {
    return <RespawnScreen name={playerName} onRespawn={handleRespawn} />;
  }

  return (
    <div className="relative h-screen w-screen">
      <canvas ref={canvasRef} className="h-full w-full" />
    </div>
  );
};

export default Game;
