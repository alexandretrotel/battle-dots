interface RespawnScreenProps {
  name: string;
  onRespawn: () => void;
}

const RespawnScreen: React.FC<RespawnScreenProps> = ({ name, onRespawn }) => {
  return (
    <div className="animate-fadeIn fixed inset-0 z-10 flex items-center justify-center bg-black/90">
      <div className="to-magenta-900/50 absolute inset-0 animate-pulse bg-gradient-to-br from-black opacity-40"></div>

      <div className="border-magenta-400/50 shadow-magenta-400/30 relative rounded-lg border-2 bg-[#1e1e2f]/90 p-8 text-center shadow-lg">
        <h2 className="text-magenta-400 animate-flicker mb-6 font-mono text-4xl font-bold drop-shadow-lg">
          You Died, {name}!
        </h2>

        <button
          onClick={onRespawn}
          className="animate-neonPulse bg-magenta-500 hover:bg-magenta-400 rounded-lg px-6 py-3 font-mono text-lg text-white transition-all duration-300 ease-in-out hover:scale-105 active:scale-95"
        >
          Respawn
        </button>
      </div>
    </div>
  );
};

export default RespawnScreen;
