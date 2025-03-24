import { BOT_NAMES, MAX_BOTS, RADIUS } from "../data/settings";
import {
  Bot,
  Bots,
  Bullets,
  Entity,
  Particles,
  Players,
} from "../interfaces/game";

export const isColliding = (
  obj1: { x: number; y: number; radius: number },
  obj2: { x: number; y: number; radius: number },
): boolean => {
  const dx = obj1.x - obj2.x;
  const dy = obj1.y - obj2.y;
  return Math.hypot(dx, dy) < obj1.radius + obj2.radius;
};

export const randomInRange = (min: number, max: number): number =>
  Math.random() * (max - min) + min;

export const spawnBot = (
  player: Entity,
  botNames: string[],
  canvasWidth: number,
  canvasHeight: number,
): Bot => {
  let botX: number = 0;
  let botY: number = 0;
  let safe = false;
  const margin = 50;

  while (!safe) {
    botX = randomInRange(margin, canvasWidth - margin);
    botY = randomInRange(margin, canvasHeight - margin);

    const dx = botX - player.x;
    const dy = botY - player.y;

    // Ensure bot spawns at least 200px away from the player
    if (Math.hypot(dx, dy) > 200) safe = true;
  }

  return {
    x: botX,
    y: botY,
    name: botNames[Math.floor(Math.random() * botNames.length)],
    angle: Math.random() * Math.PI * 2,
    radius: RADIUS,
    color: "#00ff00",
    moveTimer: 0,
    moveInterval: randomInRange(1000, 3000),
  };
};

export const spawnBots = (
  bots: Bots,
  otherPlayers: Players,
  player: Entity,
  canvasWidth: number,
  canvasHeight: number,
) => {
  if (Object.keys(otherPlayers).length > 0) return;

  for (let i = 0; i < MAX_BOTS; i++) {
    bots[i] = spawnBot(player, BOT_NAMES, canvasWidth, canvasHeight);
  }
};

export const moveBots = (bots: { [id: string]: Bot }, dt: number) => {
  Object.values(bots).forEach((bot) => {
    bot.moveTimer += dt;
    if (bot.moveTimer >= bot.moveInterval) {
      bot.angle = Math.random() * Math.PI * 2;
      bot.moveTimer = 0;
      bot.moveInterval = randomInRange(1000, 3000);
    }
    bot.x += Math.cos(bot.angle) * 3 * (dt / 16.67);
    bot.y += Math.sin(bot.angle) * 3 * (dt / 16.67);
  });
};

export const updateBullets = (
  bullets: Bullets,
  particles: Particles,
  canvasWidth: number,
  canvasHeight: number,
) => {
  for (let i = bullets.length - 1; i >= 0; i--) {
    const bullet = bullets[i];
    bullet.x += Math.cos(bullet.angle) * 10;
    bullet.y += Math.sin(bullet.angle) * 10;

    // Create particles for bullet trail effect
    if (Math.random() < 0.5) {
      particles.push({
        x: bullet.x,
        y: bullet.y,
        vx: (Math.random() - 0.5) * 2,
        vy: (Math.random() - 0.5) * 2,
        life: 20,
      });
    }

    // Remove bullets that go off-screen
    if (
      bullet.x < 0 ||
      bullet.x > canvasWidth ||
      bullet.y < 0 ||
      bullet.y > canvasHeight
    ) {
      bullets.splice(i, 1);
    }
  }
};
