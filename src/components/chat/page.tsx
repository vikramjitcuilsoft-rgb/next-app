"use client";

import { useSocket } from "@/hooks/useSocket";
import { apiGet, apiPost } from "@/services/axios/axios-client";
import { useEffect, useState } from "react";
import ChatMessages from "../chat-messages/page";

export default function ChatPage() {
    const socketRef = useSocket("http://localhost:9090");
    const [users, setUsers] = useState<any[]>([]);
    const [selectedUser, setSelectedUser] = useState<any | null>(null);
    const [message, setMessage] = useState("");
    const [chatLog, setChatLog] = useState<{ _id?: string; from: string; message: string; createdAt?: string }[]>([]);
    const [chatId, setChatId] = useState<string | null>(null);
    const [userId, setUserId] = useState<string | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [hasMoreMessages, setHasMoreMessages] = useState(true);
    const [isLoadingMessages, setIsLoadingMessages] = useState(false);
    const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());
    const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});

    // ✅ Load user from localStorage
    useEffect(() => {
        try {
            const userData = localStorage.getItem("user");
            if (userData) {
                const parsed = JSON.parse(userData);
                setUserId(parsed?._id || parsed?.id || parsed?.userId);
            }
        } catch (err) {
            console.error("Error parsing user:", err);
        }
    }, []);

    // ✅ Fetch unread message counts for all users
    const fetchUnreadCounts = async () => {
        if (!userId || !chatId) return;

        try {
            const res: any = await apiGet(`/chat/messages/unread-counts/${chatId}/${userId}`);
            const counts = res.data || {};
            setUnreadCounts(counts);
        } catch (error) {
            console.error("Failed to fetch unread counts:", error);
        }
    };

    // ✅ Mark messages as read
    const markMessagesAsRead = async (chatId: string) => {
        if (!chatId || !userId) return;

        try {
            // First, get unread messages for this chat
            const unreadRes: any = await apiGet(`/chat/messages/unread-counts/${chatId}/${userId}`);
            const unreadMessages = unreadRes.data?.unread_messages || [];

            if (unreadMessages.length === 0) {
                console.log("No unread messages to mark as read");
                return;
            }

            // Extract message IDs
            const messageIds = unreadMessages.map((msg: any) => msg._id);

            // Mark messages as read using your DTO structure
            await apiPost('/chat/mark-read', {
                _ids: messageIds,
                chat_id: chatId
            });

            console.log("Messages marked as read for chat:", chatId, "Message IDs:", messageIds);

            // Update unread counts locally
            fetchUnreadCounts();
        } catch (error) {
            console.error("Failed to mark messages as read:", error);
        }
    };

    // ✅ Fetch all users except current
    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const res: any = await apiGet("/users/all");
                setUsers(res.data.filter((u: any) => u._id !== userId));

                // Fetch unread counts after getting users
                fetchUnreadCounts();
            } catch (error) {
                console.error("Failed to fetch users:", error);
            }
        };
        if (userId) fetchUsers();
    }, [userId]);

    // ✅ Register user in socket and request online users
    useEffect(() => {
        const socket = socketRef.current;
        if (socket && userId) {
            socket.emit("register_user", { userId });

            // Request current online users list
            socket.emit("get_online_users");
        }
    }, [socketRef, userId]);

    // ✅ Receive messages and online status updates
    useEffect(() => {
        const socket = socketRef.current;
        if (!socket) return;

        // Listen for messages
        socket.on("receive_message", (data: any) => {
            if (data.chatId === chatId) {
                setChatLog((prev) => {
                    // Check if message already exists to prevent duplicates
                    const messageExists = prev.some(msg =>
                        msg._id === data._id ||
                        (msg.from === data.from && msg.message === data.message && Math.abs(new Date(msg.createdAt || Date.now()).getTime() - new Date(data.createdAt || Date.now()).getTime()) < 1000)
                    );

                    if (messageExists) {
                        return prev;
                    }

                    return [...prev, {
                        _id: data._id,
                        from: data.from,
                        message: data.message,
                        createdAt: data.createdAt || new Date().toISOString()
                    }];
                });
                // Mark as read immediately if chat is open
                markMessagesAsRead(data.chatId);
            } else {
                // Update unread counts for other chats
                fetchUnreadCounts();
            }
        });

        // Listen for online users updates
        socket.on("online_users", (data: { onlineUsers: string[] }) => {
            console.log("Online users:", data.onlineUsers);
            setOnlineUsers(new Set(data.onlineUsers));
        });

        // Listen for user online status
        socket.on("user_online", (data: { userId: string }) => {
            console.log("User came online:", data.userId);
            setOnlineUsers(prev => new Set([...prev, data.userId]));
        });

        // Listen for user offline status
        socket.on("user_offline", (data: { userId: string }) => {
            console.log("User went offline:", data.userId);
            setOnlineUsers(prev => {
                const newSet = new Set(prev);
                newSet.delete(data.userId);
                return newSet;
            });
        });

        return () => {
            socket.off("receive_message");
            socket.off("online_users");
            socket.off("user_online");
            socket.off("user_offline");
        };
    }, [socketRef, chatId]);

    // ✅ Fetch more messages (for pagination)
    const fetchMoreMessages = async (page: number) => {
        if (!chatId || isLoadingMessages) return;

        setIsLoadingMessages(true);
        try {
            const messageRes: any = await apiGet(`/chat/messages/${chatId}?page=${page}&limit=20`);
            const newMessages = messageRes.data?.messages || [];

            if (newMessages.length === 0) {
                setHasMoreMessages(false);
            } else {
                // Filter out duplicate messages and prepend older messages
                setChatLog((prev) => {
                    const existingIds = new Set(prev.map(msg => msg._id || `${msg.from}-${msg.message}-${msg.createdAt}`));
                    const uniqueNewMessages = newMessages.filter((msg: any) =>
                        !existingIds.has(msg._id || `${msg.from}-${msg.message}-${msg.createdAt}`)
                    );
                    return [...uniqueNewMessages, ...prev];
                });
                setCurrentPage(page);
            }
        } catch (error) {
            console.error("Failed to fetch more messages:", error);
        } finally {
            setIsLoadingMessages(false);
        }
    };

    // ✅ Fetch chat and messages when user is clicked
    const handleSelectUser = async (user: any) => {
        console.log("user", user);
        setSelectedUser(user);

        // Reset pagination state
        setCurrentPage(1);
        setHasMoreMessages(true);
        setChatLog([]);

        try {
            // Step 1: Create or get existing chat
            const res: any = await apiGet(`/chat/create/${user._id}`);

            const chatId = res.data?.chatId;
            console.log("chatId", res.data.chatId);

            if (!chatId) {
                console.error("Chat ID not found in response");
                return;
            }

            setChatId(chatId);

            // Step 2: Fetch initial messages for this chat
            const messageRes: any = await apiGet(`/chat/messages/${chatId}?page=1&limit=20`);
            console.log("messageRes", messageRes.data);

            const messages = messageRes.data?.messages || [];
            setChatLog(messages);

            if (messages.length < 20) {
                setHasMoreMessages(false);
            }

            // Step 3: Mark messages as read when user opens the chat
            await markMessagesAsRead(chatId);

        } catch (error) {
            console.error("Failed to load chat:", error);
        }
    };


    // ✅ Check if user is online
    const isUserOnline = (userId: string) => {
        return onlineUsers.has(userId);
    };

    // ✅ Get unread count for a specific user
    const getUnreadCount = (userId: string) => {
        return unreadCounts[userId] || 0;
    };

    // ✅ Send new message
    const sendMessage = () => {
        const socket = socketRef.current;
        if (!socket || !selectedUser || !message.trim()) return;

        const tempId = `temp-${Date.now()}-${Math.random()}`;
        const messageData = {
            chatId,
            from: userId,
            to: selectedUser._id,
            type: "text",
            message,
            tempId
        };

        socket.emit("send_message", messageData);

        // Add message optimistically with temp ID
        setChatLog((prev) => [...prev, {
            _id: tempId,
            from: userId!,
            message,
            createdAt: new Date().toISOString()
        }]);
        setMessage("");
    };

    // 💬 JSX
    return (
        <div className="flex h-[80vh] border rounded-md shadow-md">
            {/* 🧍‍♂️ User List */}
            <div className="w-1/3 border-r bg-gray-50">
                <div className="p-3 border-b font-semibold bg-gray-100">
                    Users
                </div>
                <div className="overflow-y-auto">
                    {users.map((user) => {
                        const isOnline = isUserOnline(user._id);
                        const unreadCount = getUnreadCount(user._id);
                        return (
                            <div
                                key={user._id}
                                onClick={() => handleSelectUser(user)}
                                className={`p-3 border-b cursor-pointer hover:bg-gray-100 ${selectedUser?._id === user._id ? "bg-blue-100" : ""
                                    }`}
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className="relative">
                                            <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                                                <span className="text-sm font-medium">
                                                    {user.username?.charAt(0)?.toUpperCase()}
                                                </span>
                                            </div>
                                            {/* Online status indicator */}
                                            <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white ${isOnline ? 'bg-green-500' : 'bg-gray-400'
                                                }`}></div>
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-center justify-between">
                                                <div className="font-medium">{user.username}</div>
                                                {unreadCount > 0 && (
                                                    <div className="bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center ml-2">
                                                        {unreadCount > 99 ? '99+' : unreadCount}
                                                    </div>
                                                )}
                                            </div>
                                            <div className="text-sm text-gray-500">{user.email}</div>
                                        </div>
                                    </div>
                                    <div className={`text-xs px-2 py-1 rounded-full ${isOnline
                                        ? 'bg-green-100 text-green-800'
                                        : 'bg-gray-100 text-gray-600'
                                        }`}>
                                        {isOnline ? 'Online' : 'Offline'}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* 💬 Chat Box */}
            <div className="w-2/3 flex flex-col">
                {selectedUser ? (
                    <>
                        <div className="p-3 border-b font-semibold bg-gray-100 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="relative">
                                    <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                                        <span className="text-sm font-medium">
                                            {selectedUser.username?.charAt(0)?.toUpperCase()}
                                        </span>
                                    </div>
                                    <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white ${isUserOnline(selectedUser._id) ? 'bg-green-500' : 'bg-gray-400'
                                        }`}></div>
                                </div>
                                <div>
                                    <div className="font-semibold">{selectedUser.username}</div>
                                    <div className={`text-xs ${isUserOnline(selectedUser._id) ? 'text-green-600' : 'text-gray-500'
                                        }`}>
                                        {isUserOnline(selectedUser._id) ? 'Online' : 'Offline'}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Use ChatMessages component */}
                        <ChatMessages
                            chatLog={chatLog}
                            loggedInUserId={userId || ""}
                            onLoadMore={() => fetchMoreMessages(currentPage + 1)}
                            hasMoreMessages={hasMoreMessages}
                            isLoadingMessages={isLoadingMessages}
                        />

                        <div className="border-t p-3 flex gap-2">
                            <input
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                placeholder="Type a message..."
                                className="flex-1 border rounded p-2"
                                onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                            />
                            <button
                                onClick={sendMessage}
                                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                            >
                                Send
                            </button>
                        </div>
                    </>
                ) : (
                    <div className="flex items-center justify-center flex-1 text-gray-500">
                        Select a user to start chatting 💬
                    </div>
                )}
            </div>
        </div>
    );
}
