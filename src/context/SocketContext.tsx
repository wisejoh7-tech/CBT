// src/context/SocketContext.tsx
import React, { createContext, useContext, useEffect, useMemo } from "react";
import { io, Socket } from "socket.io-client";
import { SOCKET_URL } from "@/src/lib/api-config";

const SocketContext = createContext<{ socket: Socket | null }>({ socket: null });

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const socket = useMemo(() => io(SOCKET_URL, {
    path: "/socket.io",
    transports: ["polling", "websocket"], // Allow fallback to polling
    reconnectionAttempts: 5,
    reconnectionDelay: 5000,
  }), []);

  useEffect(() => {
    socket.on("connect", () => {
      console.log("✅ Connected to socket:", socket.id);
    });

    socket.on("connect_error", (err) => {
      console.warn("❌ Socket connection error:", err.message);
    });

    return () => {
      socket.off("connect");
      socket.off("connect_error");
    };
  }, [socket]);

  return (
    <SocketContext.Provider value={{ socket }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
