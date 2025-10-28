"use client";

import { useEffect, useRef } from "react";
import { io, Socket } from "socket.io-client";

export const useSocket = (url: string) => {
    const socketRef = useRef<Socket | null>(null);

    useEffect(() => {
        // ✅ Read user object from localStorage
        let userId: string | null = null;
        try {
            const userData = localStorage.getItem("user");
            console.log('userData', userData);

            if (userData) {
                const parsedUser = JSON.parse(userData);
                // Adjust key according to your user structure
                userId = parsedUser?.id || parsedUser?._id || parsedUser?.userId || null;
            }
        } catch (error) {
            console.error("❌ Failed to parse user from localStorage:", error);
        }

        // ✅ Connect to Socket.io backend
        const socket = io(url, {
            withCredentials: true,
            transports: ["websocket"],
        });

        socketRef.current = socket;

        socket.on("connect", () => {
            console.log("✅ Connected to socket:", socket.id);

            // 🔹 Register the userId with backend after connect
            if (userId) {
                socket.emit("register_user", { userId });
                socket.emit("user_online", { userId });
                console.log("📡 Sent register_user and user_online events:", userId);
            } else {
                console.warn("⚠️ No userId found in localStorage");
            }
        });

        // Handle reconnection
        socket.on("reconnect", () => {
            console.log("🔄 Reconnected to socket server");
            if (userId) {
                socket.emit("register_user", { userId });
                socket.emit("user_online", { userId });
                console.log("📡 Re-registered user on reconnect:", userId);
            }
        });

        // Handle connection errors
        socket.on("connect_error", (error) => {
            console.error("❌ Socket connection error:", error);
        });

        // Set up heartbeat to maintain connection
        let heartbeatInterval: NodeJS.Timeout | null = null;

        const startHeartbeat = () => {
            if (heartbeatInterval) clearInterval(heartbeatInterval);

            heartbeatInterval = setInterval(() => {
                if (socket.connected && userId) {
                    socket.emit("heartbeat", { userId, timestamp: Date.now() });
                }
            }, 30000); // Send heartbeat every 30 seconds
        };

        const stopHeartbeat = () => {
            if (heartbeatInterval) {
                clearInterval(heartbeatInterval);
                heartbeatInterval = null;
            }
        };

        // Start heartbeat when connected
        if (socket.connected) {
            startHeartbeat();
        }

        socket.on("connect", () => {
            startHeartbeat();
        });

        socket.on("disconnect", () => {
            stopHeartbeat();
        });

        socket.on("disconnect", (reason) => {
            console.log("❌ Disconnected from socket server. Reason:", reason);

            // Emit user_offline event when disconnecting
            if (userId) {
                socket.emit("user_offline", { userId });
                console.log("📡 Sent user_offline event:", userId);
            }
        });

        // Handle page unload/refresh to set user offline
        const handleBeforeUnload = () => {
            if (userId && socket.connected) {
                socket.emit("user_offline", { userId });
                console.log("📡 Sent user_offline event on page unload:", userId);
            }
        };

        // Handle visibility change (tab switch, minimize)
        const handleVisibilityChange = () => {
            if (document.hidden && userId && socket.connected) {
                socket.emit("user_offline", { userId });
                console.log("📡 Sent user_offline event on visibility change:", userId);
            } else if (!document.hidden && userId && socket.connected) {
                socket.emit("user_online", { userId });
                console.log("📡 Sent user_online event on visibility change:", userId);
            }
        };

        // Add event listeners
        window.addEventListener("beforeunload", handleBeforeUnload);
        document.addEventListener("visibilitychange", handleVisibilityChange);

        return () => {
            // Stop heartbeat
            stopHeartbeat();

            // Remove event listeners
            window.removeEventListener("beforeunload", handleBeforeUnload);
            document.removeEventListener("visibilitychange", handleVisibilityChange);

            // Emit offline status before disconnecting
            if (userId && socket.connected) {
                socket.emit("user_offline", { userId });
                console.log("📡 Sent user_offline event on cleanup:", userId);
            }

            socket.disconnect();
        };
    }, [url]);

    return socketRef;
};
