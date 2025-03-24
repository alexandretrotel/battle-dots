import React from "react";
import NameScreen from "./name-screen";
import RespawnScreen from "./respawn-screen";
import useGameLoop from "../hooks/use-game-loop";

const Game: React.FC = () => {
  const { playerName, handleStart, isDead, handleRespawn, canvasRef } =
    useGameLoop();

  if (!playerName) {
    return <NameScreen onStart={handleStart} />;
  }

  if (isDead) {
    return <RespawnScreen name={playerName} onRespawn={handleRespawn} />;
  }

  return (
    <div className="h-screen w-screen">
      <canvas ref={canvasRef} className="block h-full w-full" />
    </div>
  );
};

export default Game;
