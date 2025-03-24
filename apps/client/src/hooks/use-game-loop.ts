import { useEffect, useRef, useState } from "react";
import { BOT_NAMES, RADIUS } from "../data/settings";
import useSocket from "./use-socket";
import { Bots, Bullets, Entity, Particles, Players } from "../interfaces/game";
import { spawnBot, spawnBots } from "../utils/game-helpers";
import { useMusic } from "./use-music";
import { playDeadSound, playShootSound } from "../utils/sounds";
import { useScoreStore } from "../stores/score.store";

const useGameLoop = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [playerName, setPlayerName] = useState<string | null>(null);
  const { score, setScore } = useScoreStore();
  const socket = useSocket(playerName); // Socket persists across respawns

  // Game state variables (moved outside useEffect to persist)
  const playerRef = useRef<Entity | null>(null);
  const botsRef = useRef<Bots>({});
  const bulletsRef = useRef<Bullets>([]);
  const particlesRef = useRef<Particles>([]);
  const otherPlayersRef = useRef<Players>({});
  const keysRef = useRef<{ [key: string]: boolean }>({});
  const scoreRef = useRef(score);
  const invulnerabilityRef = useRef<boolean>(false);
  const isDeadRef = useRef<boolean>(false);

  useMusic(isDeadRef.current, playerName);

  useEffect(() => {
    if (!socket || !playerName) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    // Neon border animation
    let neonBorderAnimationId: number;
    let fade: number = 1;
    const drawNeonBorder = () => {
      const width = canvas.width;
      const height = canvas.height;
      ctx.clearRect(0, 0, width, height);
      ctx.lineWidth = 10;
      ctx.strokeStyle = `rgba(0, 255, 255, ${fade})`;
      ctx.shadowColor = `rgba(0, 255, 255, ${fade})`;
      ctx.shadowBlur = 15;
      ctx.beginPath();
      ctx.rect(5, 5, width - 10, height - 10);
      ctx.stroke();
      fade -= 0.01;
      if (fade < 0) fade = 1;
      neonBorderAnimationId = requestAnimationFrame(drawNeonBorder);
    };
    drawNeonBorder();

    // Initialize or reset player
    const initPlayer = () => {
      playerRef.current = {
        x: canvas.width / 2,
        y: canvas.height / 2,
        color: "#ff00ff",
        name: playerName,
        radius: RADIUS,
      };

      // Reset game state
      if (isDeadRef.current) {
        setScore(scoreRef.current); // Update score
      } else {
        setScore(0); // Reset score
      }

      // Set invulnerability for 2s
      invulnerabilityRef.current = true; // Set invulnerability
      setTimeout(() => {
        invulnerabilityRef.current = false; // Remove invulnerability after 2s
      }, 2000);

      bulletsRef.current = []; // Clear bullets on respawn
      botsRef.current = {}; // Clear bots on respawn
      spawnBots(
        botsRef.current,
        otherPlayersRef.current,
        playerRef.current,
        canvas.width,
        canvas.height,
      );
    };

    initPlayer();

    // Spawn initial bots if no other players
    if (!playerRef.current) return;

    if (Object.keys(otherPlayersRef.current).length === 0) {
      spawnBots(
        botsRef.current,
        otherPlayersRef.current,
        playerRef.current,
        canvas.width,
        canvas.height,
      );
    }

    // Keyboard handlers
    const handleKeyDown = (e: KeyboardEvent) => {
      keysRef.current[e.key.toLowerCase()] = true;
      if (e.key === " " && !isDeadRef.current) {
        let angle: number;
        const targets = [
          ...Object.values(otherPlayersRef.current),
          ...Object.values(botsRef.current),
        ];
        if (targets.length === 0) {
          angle = Math.random() * Math.PI * 2;
        } else {
          const closestTarget = targets.reduce(
            (closest, p) => {
              const distToCurrent = Math.hypot(
                p.x - playerRef.current!.x,
                p.y - playerRef.current!.y,
              );
              const distToClosest = closest
                ? Math.hypot(
                    closest.x - playerRef.current!.x,
                    closest.y - playerRef.current!.y,
                  )
                : Infinity;
              return distToCurrent < distToClosest ? p : closest;
            },
            null as Entity | null,
          );
          angle = Math.atan2(
            closestTarget!.y - playerRef.current!.y,
            closestTarget!.x - playerRef.current!.x,
          );
        }
        socket.emit("shoot", {
          x: playerRef.current!.x,
          y: playerRef.current!.y,
          angle,
        });
        bulletsRef.current.push({
          x: playerRef.current!.x,
          y: playerRef.current!.y,
          angle,
          radius: 5,
          ownerId: socket.id as string,
        });
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      keysRef.current[e.key.toLowerCase()] = false;
    };
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    // Socket listeners
    socket.on(
      "move",
      (data: { id: string; name: string; x: number; y: number }) => {
        otherPlayersRef.current[data.id] = {
          x: data.x,
          y: data.y,
          name: data.name || "Player",
          radius: RADIUS,
          color: "#00ffff",
        };
      },
    );
    socket.on(
      "shoot",
      (data: { id: string; x: number; y: number; angle: number }) => {
        bulletsRef.current.push({
          x: data.x,
          y: data.y,
          angle: data.angle,
          radius: 5,
          ownerId: data.id,
        });
      },
    );
    socket.on("playerLeft", (id: string) => {
      delete otherPlayersRef.current[id];
      if (Object.keys(otherPlayersRef.current).length === 0) {
        spawnBots(
          botsRef.current,
          otherPlayersRef.current,
          playerRef.current!,
          canvas.width,
          canvas.height,
        );
      }
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

      const player = playerRef.current!;
      // Player movement
      if (keysRef.current["z"] || keysRef.current["arrowup"])
        player.y -= 5 * delta;
      if (keysRef.current["s"] || keysRef.current["arrowdown"])
        player.y += 5 * delta;
      if (keysRef.current["q"] || keysRef.current["arrowleft"])
        player.x -= 5 * delta;
      if (keysRef.current["d"] || keysRef.current["arrowright"])
        player.x += 5 * delta;
      player.x = Math.max(
        player.radius,
        Math.min(canvas.width - player.radius, player.x),
      );
      player.y = Math.max(
        player.radius,
        Math.min(canvas.height - player.radius, player.y),
      );
      socket.emit("move", { x: player.x, y: player.y, name: player.name });

      // Update bots
      Object.values(botsRef.current).forEach((bot) => {
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
          Math.min(canvas.width - bot.radius, bot.x),
        );
        bot.y = Math.max(
          bot.radius,
          Math.min(canvas.height - bot.radius, bot.y),
        );
      });

      // Bot shooting
      if (time - lastBotShoot >= 2000) {
        Object.values(botsRef.current).forEach((bot) => {
          const shootAngle = Math.atan2(player.y - bot.y, player.x - bot.x);
          bulletsRef.current.push({
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
      for (let i = bulletsRef.current.length - 1; i >= 0; i--) {
        const bullet = bulletsRef.current[i];
        bullet.x += Math.cos(bullet.angle) * 10 * delta;
        bullet.y += Math.sin(bullet.angle) * 10 * delta;

        if (Math.random() < 0.5) {
          particlesRef.current.push({
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
        if (!invulnerabilityRef.current && bullet.ownerId !== socket.id) {
          const dx = player.x - bullet.x;
          const dy = player.y - bullet.y;
          if (Math.hypot(dx, dy) < bullet.radius + player.radius) {
            isDeadRef.current = true;
            playShootSound();
            playDeadSound();
            bulletsRef.current = [];
            break;
          }
        }

        // Bot collision (only player's bullets)
        if (bullet.ownerId === socket.id) {
          for (const [botId, bot] of Object.entries(botsRef.current)) {
            const dx = bot.x - bullet.x;
            const dy = bot.y - bullet.y;
            if (Math.hypot(dx, dy) < bullet.radius + bot.radius) {
              playShootSound();
              delete botsRef.current[botId];
              setScore(scoreRef.current + 50);
              bulletsRef.current.splice(i, 1);
              spawnBot(player, BOT_NAMES, canvas.width, canvas.height);
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
          bulletsRef.current.splice(i, 1);
        }
      }

      // Update and draw particles
      for (let i = particlesRef.current.length - 1; i >= 0; i--) {
        const p = particlesRef.current[i];
        p.x += p.vx;
        p.y += p.vy;
        p.life -= delta;
        if (p.life <= 0) {
          particlesRef.current.splice(i, 1);
          continue;
        }
        ctx.beginPath();
        ctx.arc(p.x, p.y, 2, 0, Math.PI * 2);
        ctx.fillStyle = `hsl(${Math.random() * 360}, 100%, 50%)`;
        ctx.fill();
        ctx.closePath();
      }

      // Draw player
      if (!isDeadRef.current) {
        ctx.beginPath();
        ctx.arc(player.x, player.y, player.radius, 0, Math.PI * 2);
        ctx.fillStyle = player.color;
        ctx.shadowBlur = invulnerabilityRef.current ? 30 : 20;
        ctx.shadowColor = "#ff00ff";
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.closePath();
        ctx.font = "18px 'Courier New'";
        ctx.fillStyle = "#fff";
        ctx.textAlign = "center";
        ctx.fillText(player.name, player.x, player.y - 25);
      }

      // Draw other players
      Object.values(otherPlayersRef.current).forEach((p) => {
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
      Object.values(botsRef.current).forEach((bot) => {
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
      ctx.fillText(`Score: ${scoreRef.current}`, 20, 40);
      ctx.shadowBlur = 0;

      animationFrameId = requestAnimationFrame(animate);
    };
    animationFrameId = requestAnimationFrame(animate);

    // Cleanup (only on unmount, not on death)
    return () => {
      window.removeEventListener("resize", resizeCanvas);
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      cancelAnimationFrame(animationFrameId);
      cancelAnimationFrame(neonBorderAnimationId);
      socket.disconnect(); // Disconnect only when component unmounts
    };
  }, [playerName, setScore, socket]);

  const handleStart = (name: string) => {
    setPlayerName(name);
    isDeadRef.current = false;
  };

  const handleRespawn = () => {
    isDeadRef.current = false;
    if (canvasRef.current && playerRef.current) {
      playerRef.current.x = canvasRef.current.width / 2;
      playerRef.current.y = canvasRef.current.height / 2;
    }
  };

  return {
    playerName,
    setPlayerName,
    isDead: isDeadRef.current,
    canvasRef,
    handleStart,
    handleRespawn,
  };
};

export default useGameLoop;
