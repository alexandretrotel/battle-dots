interface RespawnScreenProps {
  name: string;
  onRespawn: () => void;
}

const RespawnScreen: React.FC<RespawnScreenProps> = ({ name, onRespawn }) => {
  return (
    <div className="fixed inset-0 z-10 flex items-center justify-center bg-black/90">
      <div className="absolute inset-0 animate-pulse bg-gradient-to-b from-black to-red-900 opacity-30"></div>

      <div className="relative rounded-lg border border-red-500/50 bg-[#1e1e2f]/90 p-8 text-center shadow-lg shadow-red-500">
        <h2 className="animate-flicker mb-6 font-mono text-3xl font-bold text-red-400 drop-shadow-lg">
          You Died, {name}!
        </h2>

        <button
          onClick={onRespawn}
          className="animate-pulse rounded-lg bg-red-600 px-6 py-3 font-mono text-lg text-white shadow-md shadow-red-500 transition-all duration-300 ease-in-out hover:scale-105 hover:bg-red-400 active:scale-95"
        >
          Respawn
        </button>
      </div>
    </div>
  );
};

export default RespawnScreen;
