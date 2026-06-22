import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
} from "react";

import { io } from "socket.io-client";

const SocketContext = createContext();

// ==========================================================
// SAFE HOOK
// ==========================================================

export const useSocket = () => {
  const context = useContext(SocketContext);

  if (!context) {
    console.warn(
      "⚠️ useSocket called outside SocketProvider",
    );

    return {
      connectSocket: () => null,
      disconnectSocket: () => null,
      getSocket: () => null,
      isSocketConnected: () => false,
      onCMSUpdate: () => null,
      removeCMSListener: () => null,
      onActiveHeroData: () => null,
      removeActiveHeroListener: () => null,
      broadcastCMSUpdate: () => null,
    };
  }

  return context;
};

// ==========================================================
// PROVIDER
// ==========================================================

export const SocketProvider = ({ children }) => {

  const socket = useRef(null);

  const isConnected = useRef(false);

  // ==========================================================
  // CONNECT SOCKET
  // ==========================================================

  const connectSocket = () => {

    try {

      // Already connected
      if (
        socket.current &&
        socket.current.connected
      ) {

        console.log("✅ Socket already connected");

        return socket.current;
      }

      // ======================================================
      // IMPORTANT:
      // USE SAME DOMAIN
      // NGINX WILL PROXY /socket.io
      // ======================================================

      const socketUrl = window.location.origin;

      console.log(
        "🔌 Attempting to connect socket to:",
        socketUrl
      );

      socket.current = io(socketUrl, {

        path: "/socket.io",

        transports: ["websocket", "polling"],

        upgrade: true,

        reconnection: true,

        reconnectionAttempts: Infinity,

        reconnectionDelay: 1000,

        reconnectionDelayMax: 5000,

        timeout: 20000,

        forceNew: false,

        autoConnect: true,

        withCredentials: true,
      });

      // ======================================================
      // CONNECT
      // ======================================================

      socket.current.on("connect", () => {

        isConnected.current = true;

        console.log(
          "✅ Socket connected successfully!",
          socket.current.id
        );

        // JOIN WEBSITE ROOM
        socket.current.emit("join-website-room");

        console.log(
          "🌐 Emitted join-website-room"
        );
      });

      // ======================================================
      // DISCONNECT
      // ======================================================

      socket.current.on("disconnect", (reason) => {

        isConnected.current = false;

        console.log(
          "❌ Socket disconnected:",
          reason
        );
      });

      // ======================================================
      // ERROR
      // ======================================================

      socket.current.on("connect_error", (error) => {

        isConnected.current = false;

        console.error(
          "❌ Socket connection error:",
          error.message
        );
      });

      return socket.current;

    } catch (error) {

      console.error(
        "❌ Failed to initialize socket:",
        error
      );

      return null;
    }
  };

  // ==========================================================
  // DISCONNECT
  // ==========================================================

  const disconnectSocket = () => {

    try {

      if (socket.current) {

        console.log("🔌 Disconnecting socket");

        socket.current.disconnect();

        socket.current = null;

        isConnected.current = false;
      }

    } catch (error) {

      console.error(
        "❌ Socket disconnect error:",
        error
      );
    }
  };

  // ==========================================================
  // HELPERS
  // ==========================================================

  const getSocket = () => socket.current;

  const isSocketConnected = () =>
    isConnected.current;

  // ==========================================================
  // CMS UPDATE LISTENER
  // ==========================================================

  const onCMSUpdate = (callback) => {

    if (!socket.current) return;

    socket.current.off("cms-updated");

    socket.current.on(
      "cms-updated",
      callback
    );
  };

  // ==========================================================
  // ACTIVE HERO LISTENER
  // ==========================================================

  const onActiveHeroData = (callback) => {

    if (!socket.current) return;

    socket.current.off("active-hero-data");

    socket.current.on(
      "active-hero-data",
      callback
    );
  };

  // ==========================================================
  // REMOVE LISTENERS
  // ==========================================================

  const removeCMSListener = () => {

    if (!socket.current) return;

    socket.current.off("cms-updated");
  };

  const removeActiveHeroListener = () => {

    if (!socket.current) return;

    socket.current.off("active-hero-data");
  };

  // ==========================================================
  // BROADCAST CMS UPDATE
  // ==========================================================

  const broadcastCMSUpdate = (data) => {

    if (
      !socket.current ||
      !isConnected.current
    ) {

      console.log(
        "⚠️ Socket not connected"
      );

      return;
    }

    socket.current.emit(
      "cms-update",
      data
    );

    console.log(
      "📤 Broadcasted CMS update:",
      data
    );
  };

  // ==========================================================
  // CLEANUP
  // ==========================================================

  useEffect(() => {

    return () => {
      disconnectSocket();
    };

  }, []);

  // ==========================================================
  // CONTEXT VALUE
  // ==========================================================

  const value = {

    connectSocket,

    disconnectSocket,

    getSocket,

    isSocketConnected,

    onCMSUpdate,

    removeCMSListener,

    onActiveHeroData,

    removeActiveHeroListener,

    broadcastCMSUpdate,
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};