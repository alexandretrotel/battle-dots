import { useEffect, useMemo, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";

interface Entity {
  x: number;
  y: number;
  name: string;
  radius: number;
  color: string;
}

interface Bullet {
  x: number;
  y: number;
  angle: number;
  radius: number;
  ownerId: string;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
}

interface Bot extends Entity {
  angle: number;
  moveTimer: number;
  moveInterval: number;
}

const NameScreen: React.FC<{ onStart: (name: string) => void }> = ({
  onStart,
}) => {
  const [name, setName] = useState("");
  const [glowIntensity, setGlowIntensity] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setGlowIntensity((prev) => (prev + 0.1) % 1);
    }, 50);
    return () => clearInterval(interval);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) onStart(name.trim());
  };

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        background: "radial-gradient(circle, #1e1e2f, #0f0a24)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 10,
      }}
    >
      <form
        onSubmit={handleSubmit}
        style={{
          textAlign: "center",
          padding: "20px",
          background: "rgba(30, 30, 47, 0.8)",
          borderRadius: "10px",
          boxShadow: "0 0 20px rgba(255, 0, 255, 0.5)",
        }}
      >
        <h2
          style={{
            color: "#fff",
            fontFamily: "'Courier New', monospace",
            fontSize: "36px",
            textShadow: `0 0 ${10 + glowIntensity * 10}px #ff00ff, 0 0 ${
              20 + glowIntensity * 20
            }px #ff00ff`,
            marginBottom: "20px",
            animation: "pulse 2s infinite",
          }}
        >
          Enter Your Alias
        </h2>

        <div style={{ display: "flex", justifyContent: "center", gap: "20px" }}>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={12}
            placeholder="Type here..."
            style={{
              padding: "12px",
              fontSize: "20px",
              fontFamily: "'Courier New', monospace",
              borderRadius: "8px",
              border: "2px solid #ff00ff",
              background: "#2a1e5a",
              color: "#fff",
              width: "250px",
              outline: "none",
              boxShadow: name ? "0 0 10px #ff00ff" : "none",
              transition: "box-shadow 0.3s",
            }}
          />
          <button
            type="submit"
            disabled={!name.trim()}
            style={{
              padding: "12px 24px",
              fontSize: "20px",
              fontFamily: "'Courier New', monospace",
              background: name.trim() ? "#ff00ff" : "#555",
              color: "#fff",
              border: "none",
              borderRadius: "8px",
              cursor: name.trim() ? "pointer" : "not-allowed",
              boxShadow: name.trim() ? "0 0 15px #ff00ff" : "none",
              transition: "background 0.3s, box-shadow 0.3s",
            }}
          >
            Enter Battle
          </button>
        </div>
      </form>
      <style>
        {`
          @keyframes pulse {
            0% { transform: scale(1); }
            50% { transform: scale(1.05); }
            100% { transform: scale(1); }
          }
        `}
      </style>
    </div>
  );
};

const RespawnScreen: React.FC<{ name: string; onRespawn: () => void }> = ({
  name,
  onRespawn,
}) => (
  <div
    style={{
      position: "fixed",
      top: 0,
      left: 0,
      width: "100vw",
      height: "100vh",
      background: "rgba(0, 0, 0, 0.9)",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      zIndex: 10,
    }}
  >
    <div
      style={{
        textAlign: "center",
        padding: "20px",
        background: "rgba(30, 30, 47, 0.8)",
        borderRadius: "10px",
        boxShadow: "0 0 20px rgba(255, 0, 0, 0.5)",
      }}
    >
      <h2
        style={{
          color: "#ff4444",
          fontFamily: "'Courier New', monospace",
          fontSize: "32px",
          textShadow: "0 0 10px #ff4444",
          marginBottom: "20px",
        }}
      >
        You Died, {name}!
      </h2>
      <button
        onClick={onRespawn}
        style={{
          padding: "12px 24px",
          fontSize: "20px",
          fontFamily: "'Courier New', monospace",
          background: "#ff4444",
          color: "#fff",
          border: "none",
          borderRadius: "8px",
          cursor: "pointer",
          boxShadow: "0 0 15px #ff4444",
        }}
      >
        Respawn
      </button>
    </div>
  </div>
);

const Game: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [playerName, setPlayerName] = useState<string | null>(null);
  const [isDead, setIsDead] = useState(false);

  const botNames = useMemo(
    () => [
      "BotZoid",
      "DotMaster",
      "PixelBoi",
      "ZapTron",
      "GlowBot",
      "NeonNinja",
      "CyberDot",
      "BitBlaster",
    ],
    []
  );

  useEffect(() => {
    if (!playerName || isDead) return; // Only run game loop when player is alive

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set up canvas dimensions and listener
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    // Connect to server
    const socket: Socket = io("http://localhost:3000");

    // Initialize player and set invulnerability for 2 seconds after spawn
    const player: Entity & { score: number } = {
      x: canvas.width / 2,
      y: canvas.height / 2,
      color: "#ff00ff",
      name: playerName,
      radius: 12,
      score: 0,
    };
    let invulnerable = true;
    setTimeout(() => {
      invulnerable = false;
    }, 2000);

    const otherPlayers: { [id: string]: Entity } = {};
    const bots: { [id: string]: Bot } = {};
    const bullets: Bullet[] = [];
    const particles: Particle[] = [];
    const keys: { [key: string]: boolean } = {};

    // Function to spawn a single bot at a safe distance
    const spawnBot = () => {
      let botX,
        botY,
        safe = false;
      while (!safe) {
        botX = Math.random() * canvas.width;
        botY = Math.random() * canvas.height;
        const dx = botX - player.x;
        const dy = botY - player.y;
        if (Math.sqrt(dx * dx + dy * dy) > 200) safe = true;
      }
      const botId = `bot_${Math.random().toString(36).substring(2)}`;
      const botName = botNames[Math.floor(Math.random() * botNames.length)];
      bots[botId] = {
        x: botX || 0,
        y: botY || 0,
        name: botName,
        angle: Math.random() * Math.PI * 2,
        radius: 12,
        color: "#00ff00",
        moveTimer: 0,
        moveInterval: 1000 + Math.random() * 2000,
      };
    };

    // Spawn initial bots if no other players are present
    const spawnBots = () => {
      if (Object.keys(otherPlayers).length > 0) return;
      for (let i = 0; i < 3; i++) {
        spawnBot();
      }
    };
    spawnBots();

    // Handle keyboard input
    const handleKeyDown = (e: KeyboardEvent) => {
      keys[e.key.toLowerCase()] = true;
      if (e.key === " ") {
        let angle: number;
        const targets = [
          ...Object.values(otherPlayers),
          ...Object.values(bots),
        ];
        if (targets.length === 0) {
          angle = Math.random() * Math.PI * 2;
        } else {
          const closestTarget = targets.reduce((closest, p) => {
            const distToCurrent = Math.hypot(p.x - player.x, p.y - player.y);
            const distToClosest = closest
              ? Math.hypot(closest.x - player.x, closest.y - player.y)
              : Infinity;
            return distToCurrent < distToClosest ? p : closest;
          }, null as Entity | null);
          angle = Math.atan2(
            closestTarget!.y - player.y,
            closestTarget!.x - player.x
          );
        }
        const ownerId = socket.id ?? "Player";
        socket.emit("shoot", { x: player.x, y: player.y, angle });
        bullets.push({ x: player.x, y: player.y, angle, radius: 5, ownerId });
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      keys[e.key.toLowerCase()] = false;
    };
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    socket.on(
      "move",
      (data: { id: string; name: string; x: number; y: number }) => {
        otherPlayers[data.id] = {
          x: data.x,
          y: data.y,
          name: data.name || "Player",
          radius: 12,
          color: "#00ffff",
        };
      }
    );
    socket.on(
      "shoot",
      (data: { id: string; x: number; y: number; angle: number }) => {
        bullets.push({
          x: data.x,
          y: data.y,
          angle: data.angle,
          radius: 5,
          ownerId: data.id,
        });
      }
    );
    socket.on("playerLeft", (id: string) => {
      delete otherPlayers[id];
      if (Object.keys(otherPlayers).length === 0) spawnBots();
    });

    let lastTime = performance.now();
    let lastBotShoot = performance.now();
    let animationFrameId: number;

    const animate = (time: number) => {
      const dt = time - lastTime;
      const delta = dt / 16.67;
      lastTime = time;

      ctx.fillStyle = "#1e1e2f";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Player movement
      if (keys["z"] || keys["arrowup"]) player.y -= 5 * delta;
      if (keys["s"] || keys["arrowdown"]) player.y += 5 * delta;
      if (keys["q"] || keys["arrowleft"]) player.x -= 5 * delta;
      if (keys["d"] || keys["arrowright"]) player.x += 5 * delta;
      player.x = Math.max(
        player.radius,
        Math.min(canvas.width - player.radius, player.x)
      );
      player.y = Math.max(
        player.radius,
        Math.min(canvas.height - player.radius, player.y)
      );
      socket.emit("move", { x: player.x, y: player.y, name: player.name });

      // Update bots
      Object.values(bots).forEach((bot) => {
        bot.moveTimer += dt;
        if (bot.moveTimer >= bot.moveInterval) {
          bot.angle = Math.random() * Math.PI * 2;
          bot.moveTimer = 0;
          bot.moveInterval = 1000 + Math.random() * 2000;
        }
        bot.x += Math.cos(bot.angle) * 3 * delta;
        bot.y += Math.sin(bot.angle) * 3 * delta;
        bot.x = Math.max(
          bot.radius,
          Math.min(canvas.width - bot.radius, bot.x)
        );
        bot.y = Math.max(
          bot.radius,
          Math.min(canvas.height - bot.radius, bot.y)
        );
      });

      // Bot shooting
      if (time - lastBotShoot >= 2000) {
        Object.values(bots).forEach((bot) => {
          const shootAngle = Math.atan2(player.y - bot.y, player.x - bot.x);
          bullets.push({
            x: bot.x,
            y: bot.y,
            angle: shootAngle,
            radius: 5,
            ownerId: bot.name,
          });
        });
        lastBotShoot = time;
      }

      // Update and draw bullets
      for (let i = bullets.length - 1; i >= 0; i--) {
        const bullet = bullets[i];
        bullet.x += Math.cos(bullet.angle) * 10 * delta;
        bullet.y += Math.sin(bullet.angle) * 10 * delta;

        if (Math.random() < 0.5) {
          particles.push({
            x: bullet.x,
            y: bullet.y,
            vx: (Math.random() - 0.5) * 2,
            vy: (Math.random() - 0.5) * 2,
            life: 20,
          });
        }

        ctx.beginPath();
        ctx.arc(bullet.x, bullet.y, bullet.radius, 0, Math.PI * 2);
        ctx.fillStyle = "#ff4444";
        ctx.shadowBlur = 10;
        ctx.shadowColor = "#ff4444";
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.closePath();

        // Player collision
        if (!invulnerable && bullet.ownerId !== (socket.id ?? "Player")) {
          const dx = player.x - bullet.x;
          const dy = player.y - bullet.y;
          if (Math.hypot(dx, dy) < bullet.radius + player.radius) {
            setIsDead(true);
          }
        }

        // Bot collision (only player's bullets)
        if (bullet.ownerId === socket.id) {
          for (const [botId, bot] of Object.entries(bots)) {
            const dx = bot.x - bullet.x;
            const dy = bot.y - bullet.y;
            if (Math.hypot(dx, dy) < bullet.radius + bot.radius) {
              delete bots[botId];
              player.score += 50;
              bullets.splice(i, 1);
              spawnBot(); // Respawn a new bot immediately
              break;
            }
          }
        }

        if (
          bullet.x < 0 ||
          bullet.x > canvas.width ||
          bullet.y < 0 ||
          bullet.y > canvas.height
        ) {
          bullets.splice(i, 1);
        }
      }

      // Update and draw particles
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.life -= delta;
        if (p.life <= 0) {
          particles.splice(i, 1);
          continue;
        }
        ctx.beginPath();
        ctx.arc(p.x, p.y, 2, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 100, 100, ${p.life / 20})`;
        ctx.fill();
        ctx.closePath();
      }

      // Draw player
      ctx.beginPath();
      ctx.arc(player.x, player.y, player.radius, 0, Math.PI * 2);
      ctx.fillStyle = player.color;
      ctx.shadowBlur = invulnerable ? 30 : 20;
      ctx.shadowColor = "#ff00ff";
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.closePath();
      ctx.font = "18px 'Courier New'";
      ctx.fillStyle = "#fff";
      ctx.textAlign = "center";
      ctx.fillText(player.name, player.x, player.y - 25);

      // Draw other players
      Object.values(otherPlayers).forEach((p) => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.shadowBlur = 20;
        ctx.shadowColor = "#00ffff";
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.closePath();
        ctx.fillText(p.name, p.x, p.y - 25);
      });

      // Draw bots
      Object.values(bots).forEach((bot) => {
        ctx.beginPath();
        ctx.arc(bot.x, bot.y, bot.radius, 0, Math.PI * 2);
        ctx.fillStyle = bot.color;
        ctx.shadowBlur = 20;
        ctx.shadowColor = "#00ff00";
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.closePath();
        ctx.fillText(bot.name, bot.x, bot.y - 25);
      });

      // Draw score
      ctx.font = "28px 'Courier New'";
      ctx.fillStyle = "#fff";
      ctx.textAlign = "left";
      ctx.shadowBlur = 5;
      ctx.shadowColor = "#000";
      ctx.fillText(`Score: ${player.score}`, 20, 40);
      ctx.shadowBlur = 0;

      animationFrameId = requestAnimationFrame(animate);
    };
    animationFrameId = requestAnimationFrame(animate);

    // Cleanup
    return () => {
      window.removeEventListener("resize", resizeCanvas);
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      socket.disconnect();
      cancelAnimationFrame(animationFrameId);
    };
  }, [playerName, botNames, isDead]);

  const handleStart = (name: string) => {
    setPlayerName(name);
    setIsDead(false);
  };

  const handleRespawn = () => {
    setIsDead(false);
  };

  return (
    <>
      <canvas
        ref={canvasRef}
        style={{ display: "block", width: "100vw", height: "100vh" }}
      />
      {!playerName && <NameScreen onStart={handleStart} />}
      {isDead && playerName && (
        <RespawnScreen name={playerName} onRespawn={handleRespawn} />
      )}
    </>
  );
};

export default function App() {
  return (
    <div style={{ margin: 0, padding: 0, overflow: "hidden" }}>
      <Game />
    </div>
  );
}
