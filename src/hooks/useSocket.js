import { useEffect, useState } from "react";
import { io } from "socket.io-client";

const SOCKET_URL = "https://chatapp-backend-1egq.onrender.com"; // same as backend

export function useSocket(token) {
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    if (!token) return;

    const newSocket = io(SOCKET_URL, {
      auth: { token },
      autoConnect: true,
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [token]);

  return socket;
}
