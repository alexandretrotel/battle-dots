import { useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";

const useSocket = (playerName: string | null) => {
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    if (!playerName) return;

    const newSocket = io("http://localhost:3000");
    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [playerName, setSocket]);

  return socket;
};

export default useSocket;
