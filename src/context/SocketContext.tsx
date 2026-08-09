// src/context/SocketContext.tsx
import React, { createContext, useContext, useEffect } from "react";
import { io, Socket } from "socket.io-client";
import { SOCKET_URL } from "@/src/lib/api-config";

const SocketContext = createContext<Socket | null>(null);

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const socket = io(SOCKET_URL, { path: "/socket.io" });

  useEffect(() => {
    socket.on("connect", () => {
      console.log("✅ Connected to socket:", socket.id);
    });

    return () => {
      socket.disconnect();
    };
  }, [socket]);

  return (
    <SocketContext.Provider value={socket}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
