import { useEffect, useRef } from "react";
import * as PIXI from "pixi.js";
import { io, Socket } from "socket.io-client";

const Game = () => {
  const canvasRef = useRef<HTMLDivElement>(null);
  let socket: Socket;

  useEffect(() => {
    const app = new PIXI.Application({
      width: 800,
      height: 600,
      backgroundColor: 0x1099bb,
    });

    if (canvasRef.current) {
      canvasRef.current.appendChild(app.view as any);
    }

    // Connect to server
    socket = io("http://localhost:3000");

    // Player dot
    const player = new PIXI.Graphics();
    player.beginFill(0xff0000);
    player.drawCircle(0, 0, 10);
    player.endFill();
    player.x = 400;
    player.y = 300;
    app.stage.addChild(player);

    // Other players
    const otherPlayers: { [id: string]: PIXI.Graphics } = {};

    // Handle movement
    app.ticker.add(() => {
      if (keys.w) player.y -= 5;
      if (keys.s) player.y += 5;
      if (keys.a) player.x -= 5;
      if (keys.d) player.x += 5;
      socket.emit("move", { x: player.x, y: player.y });
    });

    // Keyboard controls
    const keys: { [key: string]: boolean } = {};
    window.addEventListener("keydown", (e) => (keys[e.key] = true));
    window.addEventListener("keyup", (e) => (keys[e.key] = false));

    // Shooting
    window.addEventListener("click", (e) => {
      const angle = Math.atan2(e.clientY - player.y, e.clientX - player.x);
      socket.emit("shoot", { x: player.x, y: player.y, angle });
    });

    // Socket events
    socket.on("move", (data: { id: string; x: number; y: number }) => {
      if (!otherPlayers[data.id]) {
        otherPlayers[data.id] = new PIXI.Graphics();
        otherPlayers[data.id].beginFill(0x00ff00);
        otherPlayers[data.id].drawCircle(0, 0, 10);
        otherPlayers[data.id].endFill();
        app.stage.addChild(otherPlayers[data.id]);
      }
      otherPlayers[data.id].x = data.x;
      otherPlayers[data.id].y = data.y;
    });

    socket.on(
      "shoot",
      (data: { id: string; x: number; y: number; angle: number }) => {
        const bullet = new PIXI.Graphics();
        bullet.beginFill(0xffff00);
        bullet.drawCircle(0, 0, 5);
        bullet.endFill();
        bullet.x = data.x;
        bullet.y = data.y;
        app.stage.addChild(bullet);

        app.ticker.add((delta) => {
          bullet.x += Math.cos(data.angle) * 10 * delta;
          bullet.y += Math.sin(data.angle) * 10 * delta;
          if (
            bullet.x < 0 ||
            bullet.x > 800 ||
            bullet.y < 0 ||
            bullet.y > 600
          ) {
            app.stage.removeChild(bullet);
          }
        });
      }
    );

    socket.on("playerLeft", (id: string) => {
      if (otherPlayers[id]) {
        app.stage.removeChild(otherPlayers[id]);
        delete otherPlayers[id];
      }
    });

    return () => {
      app.destroy();
      socket.disconnect();
    };
  }, []);

  return <div ref={canvasRef} />;
};

export default function App() {
  return (
    <div>
      <h1>Battle Dots ⚔️</h1>
      <Game />
    </div>
  );
}
