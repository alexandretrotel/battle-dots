import deadFX from "../assets/dead.wav";
import shootFX from "../assets/shoot.wav";

export const playDeadSound = () => {
  const audio = new Audio(deadFX);
  audio.play();
};

export const playShootSound = () => {
  const audio = new Audio(shootFX);
  audio.play();
};
