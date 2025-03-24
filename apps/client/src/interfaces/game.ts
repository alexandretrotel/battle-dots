export interface Entity {
  x: number;
  y: number;
  name: string;
  radius: number;
  color: string;
}

export type Players = { [id: string]: Entity };

export interface Bullet {
  x: number;
  y: number;
  angle: number;
  radius: number;
  ownerId: string;
}

export type Bullets = Bullet[];

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
}

export type Particles = Particle[];

export interface Bot extends Entity {
  angle: number;
  moveTimer: number;
  moveInterval: number;
}

export type Bots = { [id: string]: Bot };
