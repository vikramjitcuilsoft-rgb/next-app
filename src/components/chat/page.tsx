"use client";

import { useSocket } from "@/hooks/useSocket";
import { apiGet, apiPost, apiUpload } from "@/services/axios/axios-client";
import { useEffect, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import ChatMessages from "../chat-messages/page";
import GroupCreationModal from "../group-creation-modal/page";
import { MoreVertical, Users, Paperclip, Image, FileText } from "lucide-react";
import { toast } from "sonner";


// Group Avatar component
const GroupAvatar = ({ group, size = "w-8 h-8" }: { group: any, size?: string }) => {
    const getGroupInitials = () => {
        // Show first 2 characters of group name or member count
        if (group.group_name) {
            return group.group_name.substring(0, 2).toUpperCase();
        }
        if (group.name) {
            return group.name.substring(0, 2).toUpperCase();
        }
        return group.memberDetails?.length?.toString() || 'G';
    };

    return (
        <div className={`${size} bg-green-500 rounded-full flex items-center justify-center`}>
            <span className="text-sm font-medium text-white">
                {getGroupInitials()}
            </span>
        </div>
    );
};

// Avatar component for chat users
const ChatAvatar = ({ user, size = "w-8 h-8" }: { user: any, size?: string }) => {
    const getAvatarUrl = () => {
        if (user?.user_avatar_url) {
            return user.user_avatar_url.startsWith('http')
                ? user.user_avatar_url
                : `http://localhost:9090${user.user_avatar_url}`;
        }
        return null;
    };

    const getInitials = () => {
        if (user?.username) {
            return user.username.charAt(0).toUpperCase();
        }
        if (user?.email) {
            return user.email.charAt(0).toUpperCase();
        }
        return 'U';
    };

    const avatarUrl = getAvatarUrl();

    if (avatarUrl) {
        return (
            <img
                src={avatarUrl}
                alt={`${user?.username || 'User'} avatar`}
                className={`${size} rounded-full object-cover`}
                onError={(e) => {
                    // If image fails to load, replace with initials
                    const parent = e.currentTarget.parentElement;
                    if (parent) {
                        parent.innerHTML = `
                            <div class="${size} bg-gray-300 rounded-full flex items-center justify-center">
                                <span class="text-sm font-medium">${getInitials()}</span>
                            </div>
                        `;
                    }
                }}
            />
        );
    }

    // Fallback to initials
    return (
        <div className={`${size} bg-gray-300 rounded-full flex items-center justify-center`}>
            <span className="text-sm font-medium">
                {getInitials()}
            </span>
        </div>
    );
};



export default function ChatPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const socketRef = useSocket("http://localhost:9090");
    const [users, setUsers] = useState<any[]>([]);
    const [groups, setGroups] = useState<any[]>([]);
    const [selectedUser, setSelectedUser] = useState<any | null>(null);
    const [selectedChat, setSelectedChat] = useState<any>(null);
    const [message, setMessage] = useState("");
    const [chatLog, setChatLog] = useState<{ _id?: string; from: string; message: string; type?: string; createdAt?: string; isUploading?: boolean }[]>([]);
    const [chatId, setChatId] = useState<string | null>(null);
    const [userId, setUserId] = useState<string | null>(null);
    const [currentUser, setCurrentUser] = useState<any | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [hasMoreMessages, setHasMoreMessages] = useState(true);
    const [isLoadingMessages, setIsLoadingMessages] = useState(false);
    const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());
    const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});
    const [showMenu, setShowMenu] = useState(false);
    const [showGroupModal, setShowGroupModal] = useState(false);
    const [isMounted, setIsMounted] = useState(false);
    const [uploadingFileName, setUploadingFileName] = useState<string | null>(null);

    // ✅ Handle client-side mounting and load user data
    useEffect(() => {
        setIsMounted(true);

        // Load user data immediately when component mounts on client
        try {
            const userData = localStorage.getItem("user");
            if (userData) {
                const parsed = JSON.parse(userData);
                const extractedUserId = parsed?._id || parsed?.id || parsed?.userId;
                setUserId(extractedUserId);
                setCurrentUser(parsed);
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

            // Update unread counts locally
            fetchUnreadCounts();
        } catch (error) {
            console.error("Failed to mark messages as read:", error);
        }
    };

    // ✅ Fetch all users and groups function
    const fetchUsersAndGroups = async () => {
        try {
            console.log("🔄 Fetching users and groups...");
            const res: any = await apiGet("/users/all");
            // Parse the response structure based on your API
            const responseData = res.data || [];

            // Separate users and groups
            const usersList: any[] = [];
            const groupsList: any[] = [];

            responseData.forEach((item: any) => {
                if (item.groups) {
                    // This item contains groups
                    item.groups.forEach((group: any) => {
                        // Filter out current user from memberDetails
                        if (group.memberDetails) {
                            const originalCount = group.memberDetails.length;
                            group.memberDetails = group.memberDetails.filter((member: any) => member._id !== userId);
                        }
                        groupsList.push(group);
                    });
                } else if (item._id && item.username) {
                    // This is a regular user
                    if (item._id !== userId) {
                        usersList.push(item);
                    }
                }
            });

            // Add current user to the users list for username lookup
            if (currentUser && !usersList.find(u => u._id === userId)) {
                usersList.push(currentUser);
            }

            setUsers(usersList);
            setGroups(groupsList);

            console.log(`✅ Updated users: ${usersList.length}, groups: ${groupsList.length}`);

            // Fetch unread counts after getting users
            fetchUnreadCounts();
        } catch (error) {
            console.error("Failed to fetch users and groups:", error);
        }
    };

    // ✅ Fetch users and groups on component mount
    useEffect(() => {
        if (userId) {
            fetchUsersAndGroups();
        }
    }, [userId]);

    // ✅ Handle chatId from URL parameters
    useEffect(() => {
        const urlChatId = searchParams.get('chatId');
        if (urlChatId && users.length > 0 && userId && !chatId) {

            // Try to find the chat in groups first
            const group = groups.find(g => g.chatId === urlChatId);
            if (group) {
                handleSelectChat(group);
                return;
            }

            // If not found in groups, load chat directly by ID
            loadChatById(urlChatId).catch(() => {
                console.error('Invalid chatId in URL, redirecting to chat home');
                router.push('/dashboard/chat', { scroll: false });
            });
        }
    }, [searchParams, users, groups, userId, chatId]);

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

                    const newMessage = {
                        _id: data._id,
                        from: data.from,
                        message: data.message,
                        type: data.type || 'text',
                        createdAt: data.createdAt || new Date().toISOString()
                    };

                    return [...prev, newMessage];
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
            setOnlineUsers(new Set(data.onlineUsers));
        });

        // Listen for user online status
        socket.on("user_online", (data: { userId: string }) => {
            setOnlineUsers(prev => new Set([...prev, data.userId]));
        });

        // Listen for user offline status
        socket.on("user_offline", (data: { userId: string }) => {
            setOnlineUsers(prev => {
                const newSet = new Set(prev);
                newSet.delete(data.userId);
                return newSet;
            });
        });

        // Listen for message_saved event from your backend (confirmation to sender)
        socket.on("message_saved", (data: any) => {
            // Replace the optimistic message with the real one
            setChatLog((prev) => {
                return prev.map(msg => {
                    if (msg._id === data.tempId) {
                        const realMessage = {
                            _id: data.messageId,
                            from: userId!, // Current user
                            message: data.fileUrl, // File path from server
                            type: msg.type, // Keep the original type
                            createdAt: new Date().toISOString(),
                            isUploading: false // Explicitly set to false
                        };
                        return realMessage;
                    }
                    return msg;
                });
            });
        });

        // Debug: Listen for ANY socket events to see what your backend is actually sending
        socket.onAny((eventName: string, ...args: any[]) => {
            console.log(`🔍 SOCKET EVENT RECEIVED: "${eventName}"`, args);
        });

        // Handle file upload errors (if your backend sends them)
        socket.on("file_upload_error", (data: any) => {
            // Remove the optimistic message and show error
            setChatLog((prev) => prev.filter(msg => msg._id !== data.tempId));
            toast.error(`File upload failed: ${data.error || 'Unknown error'}`)
        });

        return () => {
            socket.off("receive_message");
            socket.off("online_users");
            socket.off("user_online");
            socket.off("user_offline");
            socket.off("message_saved");
            socket.off("file_upload_error");
            socket.offAny(); // Remove the debug listener
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

    // ✅ Helper function to update URL with chatId
    const updateUrlWithChatId = (chatId: string) => {
        const params = new URLSearchParams(searchParams.toString());
        params.set('chatId', chatId);
        router.push(`/dashboard/chat?${params.toString()}`, { scroll: false });
    };

    // ✅ Helper function to clear chatId from URL
    const clearChatIdFromUrl = () => {
        const params = new URLSearchParams(searchParams.toString());
        params.delete('chatId');
        const newUrl = params.toString() ? `/dashboard/chat?${params.toString()}` : '/dashboard/chat';
        router.push(newUrl, { scroll: false });
    };

    // ✅ Helper function to load chat by chatId (for URL-based loading)
    const loadChatById = async (chatId: string) => {
        try {
            setChatId(chatId);
            setCurrentPage(1);
            setHasMoreMessages(true);

            // Load messages for this chat
            const messageRes: any = await apiGet(`/chat/messages/${chatId}?page=1&limit=20`);
            const messages = messageRes.data?.messages || [];
            setChatLog(messages);

            if (messages.length < 20) {
                setHasMoreMessages(false);
            }

            // Try to find matching user or group for better UI
            const matchingGroup = groups.find(g => g.chatId === chatId);
            if (matchingGroup) {
                setSelectedChat(matchingGroup);
                return;
            }

            // For user chats, we'll set a generic selected chat
            // The actual user details would need to come from the API if needed
            setSelectedChat({ chatId, type: 'direct' });

        } catch (error) {
            console.error('Failed to load chat by ID:', error);
            throw error;
        }
    };

    // ✅ Handle selecting either user or group chat
    const handleSelectChat = async (group: any) => {
        const chatId = group.chatId;
        setChatId(chatId);

        // Update URL with chatId
        updateUrlWithChatId(chatId);

        // Reset pagination state
        setCurrentPage(1);
        setHasMoreMessages(true);

        try {
            // Fetch initial messages for this chat
            const messageRes: any = await apiGet(`/chat/messages/${chatId}?page=1&limit=20`);
            const messages = messageRes.data?.messages || [];
            setChatLog(messages);

            if (messages.length < 20) {
                setHasMoreMessages(false);
            }

            setSelectedChat(group);
        } catch (error) {
            console.error("Failed to load group chat:", error);
        }
    };


    // ✅ Fetch chat and messages when user is clicked
    const handleSelectUser = async (user: any) => {
        setSelectedUser(user);

        // Reset pagination state
        setCurrentPage(1);
        setHasMoreMessages(true);
        setChatLog([]);

        try {
            // Step 1: Create or get existing chat
            const res: any = await apiGet(`/chat/create/${user?._id}`);

            const chatId = res.data?.chatId;
            if (!chatId) {
                console.error("Chat ID not found in response");
                return;
            }

            setChatId(chatId);

            // Update URL with chatId
            updateUrlWithChatId(chatId);

            // Step 2: Fetch initial messages for this chat
            const messageRes: any = await apiGet(`/chat/messages/${chatId}?page=1&limit=20`);
            const messages = messageRes.data?.messages || [];
            setChatLog(messages);

            if (messages.length < 20) {
                setHasMoreMessages(false);
            }

            // Set selected chat for UI
            setSelectedChat({ ...user, type: 'user' });

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

    // ✅ Create group
    const handleCreateGroup = async (groupName: string, selectedUserIds: string[]) => {
        try {
            const groupData = {
                group_name: groupName,
                _ids: selectedUserIds,
            };

            console.log("📝 Creating group:", groupData);

            // Call your API to create group
            const response = await apiPost('/chat/create-group', groupData);
            
            console.log("✅ Group created successfully:", response);

            // Refresh users and groups list to include the new group
            await fetchUsersAndGroups();

            toast.success('Group created successfully!');

        } catch (error) {
            console.error("Failed to create group:", error);
            toast.error('Failed to create group. Please try again.');
        }
    };

    // ✅ State for file upload
    const [isUploadingFile, setIsUploadingFile] = useState(false);

    // ✅ Send file directly through socket (raw file, no base64)
    const sendFileViaSocket = async (file: File) => {
        const socket = socketRef.current;
        if (!socket || !selectedChat || !chatId) {
            toast.error("Cannot send file: No active chat connection")
            return;
        }

        try {
            setIsUploadingFile(true);

            // Determine message type
            const messageType = getFileMessageType(file);
            const tempId = `temp-${Date.now()}-${Math.random()}`;

            // Create file metadata for socket
            const fileMetadata = {
                chatId,
                from: userId,
                to: selectedChat.type === 'user' ? selectedChat._id : null,
                groupId: selectedChat.type === 'group' ? selectedChat._id : null,
                type: messageType,
                fileName: file.name,
                fileSize: file.size,
                mimeType: file.type,
                tempId
            };

            // Method 1: Send as ArrayBuffer
            const arrayBuffer = await file.arrayBuffer();
            socket.emit("send_file", fileMetadata, arrayBuffer);


            // Add optimistic message to chat (will be replaced when socket confirms)
            const optimisticMessage = {
                _id: tempId,
                from: userId!,
                message: file.name, // Just the filename
                type: messageType,
                isUploading: true, // Special flag for uploading state
                createdAt: new Date().toISOString()
            };

            setChatLog((prev) => [...prev, optimisticMessage]);

            // Add fallback mechanism - check for new messages after 3 seconds
            setTimeout(async () => {
                const stillUploading = chatLog.find(msg => msg._id === tempId && msg.isUploading);
                if (stillUploading) {
                    try {
                        // Fetch latest messages to see if the file was saved
                        const messageRes: any = await apiGet(`/chat/messages/${chatId}?page=1&limit=5`);
                        const latestMessages = messageRes.data?.messages || [];

                        // Look for a file message that matches our upload
                        const savedFileMessage = latestMessages.find((msg: any) =>
                            msg.user_id === userId &&
                            msg.type === messageType &&
                            msg.message.includes(file.name.split('.')[0]) // Check if filename is in the path
                        );

                        if (savedFileMessage) {
                            setChatLog((prev) => {
                                return prev.map(msg =>
                                    msg._id === tempId
                                        ? {
                                            _id: savedFileMessage._id,
                                            from: savedFileMessage.user_id,
                                            message: savedFileMessage.message,
                                            type: savedFileMessage.type,
                                            createdAt: savedFileMessage.createdAt,
                                            isUploading: false
                                        }
                                        : msg
                                );
                            });
                        }
                    } catch (error) {
                        console.error("Failed to fetch latest messages:", error);
                    }
                }
            }, 3000); // 3 second fallback check

            // Add timeout to handle cases where backend doesn't respond
            setTimeout(() => {
                setChatLog((prev) => {
                    const stillUploading = prev.find(msg => msg._id === tempId && msg.isUploading);
                    if (stillUploading) {
                        // You can either remove the message or show an error state
                        return prev.map(msg =>
                            msg._id === tempId
                                ? { ...msg, message: `Upload timeout: ${file.name}`, isUploading: false }
                                : msg
                        );
                    }
                    return prev;
                });
            }, 30000); // 30 second timeout

        } catch (error) {
            toast.error(`Failed to send file via socket: ${error}`)
        } finally {
            setIsUploadingFile(false);
            setUploadingFileName(null);
        }
    };



    // ✅ Handle file selection
    const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            // Check file size (limit to 10MB)
            if (file.size > 5 * 1024 * 1024) {
                toast.error('File size must be less than 5MB')
                return;
            }

            // Determine file type for UI feedback
            const fileType = getFileMessageType(file);
            const fileTypeLabel = fileType === 'image' ? 'Image' : 'File';

            // Set uploading file name for UI feedback
            setUploadingFileName(`${fileTypeLabel}: ${file.name}`);

            // Send file directly via socket
            sendFileViaSocket(file);
        }
        // Reset input
        event.target.value = '';
    };

    // ✅ Helper function to determine file message type
    const getFileMessageType = (file: File, apiType?: string): 'image' | 'file' => {
        // First check if API provided a type
        if (apiType === 'image') return 'image';
        if (apiType === 'file') return 'file';

        // Fallback to file type detection
        const fileExtension = file.name.split('.').pop()?.toLowerCase();
        const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp'];

        if (file.type.startsWith('image/') || (fileExtension && imageExtensions.includes(fileExtension))) {
            return 'image';
        }

        return 'file';
    };

    // ✅ Unified function to send messages via socket
    const sendMessageViaSocket = (messageContent: string, messageType: 'text' | 'image' | 'file', messageId?: string) => {
        const socket = socketRef.current;
        if (!socket || !selectedChat || !chatId) return;

        // Validate message content
        if (!messageContent || typeof messageContent !== 'string') {
            console.error("❌ Invalid message content:", messageContent);
            toast.error('Error: Cannot send empty or invalid message')
            return;
        }

        const tempId = messageId || `temp-${Date.now()}-${Math.random()}`;

        // Create message data structure for socket
        const messageData = {
            chatId,
            from: userId,
            to: selectedChat.type === 'user' ? selectedChat._id : null, // For user chats
            groupId: selectedChat.type === 'group' ? selectedChat._id : null, // For group chats
            type: messageType,
            message: messageContent,
            tempId
        };

        // Send message via socket
        socket.emit("send_message", messageData);

        // Add message optimistically to chat log
        const optimisticMessage = {
            _id: messageId || tempId,
            from: userId!,
            message: messageContent,
            type: messageType,
            createdAt: new Date().toISOString()
        };

        setChatLog((prev) => {
            // Check if message already exists (for file uploads that already added the message)
            const messageExists = prev.some(msg => msg._id === optimisticMessage._id);
            if (messageExists) {
                return prev;
            }
            return [...prev, optimisticMessage];
        });

    };

    // ✅ Send text message
    const sendMessage = () => {
        if (!message.trim()) return;

        sendMessageViaSocket(message, 'text');
        setMessage(""); // Clear input after sending
    };

    // Close menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as HTMLElement;

            // Check if the click is outside the menu container
            if (showMenu && target) {
                const menuContainer = target.closest('.menu-container');
                if (!menuContainer) {
                    setShowMenu(false);
                }
            }
        };

        if (showMenu) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showMenu]);

    // Show loading state during hydration
    if (!isMounted) {
        return (
            <div className="flex h-[80vh] border rounded-md shadow-md">
                <div className="w-1/3 border-r bg-gray-50">
                    <div className="p-3 border-b font-semibold bg-gray-100">
                        <span>Users</span>
                    </div>
                    <div className="p-4 text-center text-gray-500">
                        Loading...
                    </div>
                </div>
                <div className="w-2/3 flex flex-col">
                    <div className="flex items-center justify-center flex-1 text-gray-500">
                        Loading chat...
                    </div>
                </div>
            </div>
        );
    }

    // 💬 JSX
    return (
        <div className="flex h-[80vh] border rounded-md shadow-md" suppressHydrationWarning>
            {/* 🧍‍♂️ User List */}
            <div className="w-1/3 border-r bg-gray-50 flex flex-col">
                {/* Header - Fixed */}
                <div className="p-3 border-b font-semibold bg-gray-100 flex items-center justify-between flex-shrink-0">
                    <span>Users</span>
                    <div className="relative menu-container">
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                setShowMenu(!showMenu);
                            }}
                            className="p-1 hover:bg-gray-200 rounded-full"
                        >
                            <MoreVertical size={18} />
                        </button>

                        {/* Dropdown Menu */}
                        {showMenu && (
                            <div className="absolute right-0 top-8 bg-white border rounded-lg shadow-lg z-10 min-w-[180px]">
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setShowGroupModal(true);
                                        setShowMenu(false);
                                    }}
                                    className="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center gap-2"
                                >
                                    <Users size={16} />
                                    Create Group
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Scrollable User List */}
                <div className="flex-1 overflow-y-auto min-h-0">
                    {/* Groups Section */}
                    {groups.length > 0 && (
                        <>
                            <div className="p-2 text-xs font-semibold text-gray-500 bg-gray-100">
                                GROUPS ({groups.length})
                            </div>
                            {groups.map((group, index) => (
                                <div
                                    key={group._id || `group-${index}`}
                                    onClick={() => {
                                        handleSelectChat(group);
                                    }}
                                    className={`p-3 border-b cursor-pointer hover:bg-gray-100 ${selectedChat?.type === 'group' && selectedChat?.data === group ? "bg-blue-100" : ""
                                        }`}
                                >
                                    <div className="flex items-center gap-2">
                                        <GroupAvatar group={group} />
                                        <div className="flex-1">
                                            <div className="font-medium">
                                                {group.group_name || group.name || `Group (${group.memberDetails?.length || 0} members)`}
                                            </div>
                                            <div className="text-sm text-gray-500">
                                                {group.memberDetails?.slice(0, 3).map((member: any) => member.username).join(', ')}
                                                {group.memberDetails?.length > 3 && ` +${group.memberDetails.length - 3} more`}
                                            </div>
                                        </div>
                                        <div className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-800">
                                            Group
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </>
                    )}

                    {/* Users Section */}
                    {users.length > 0 && (
                        <>
                            <div className="p-2 text-xs font-semibold text-gray-500 bg-gray-100">
                                USERS ({users.length})
                            </div>
                            {users.map((user) => {
                                const isOnline = isUserOnline(user._id);
                                const unreadCount = getUnreadCount(user._id);
                                return (
                                    <div
                                        key={user._id}
                                        onClick={() => {
                                            handleSelectUser(user);
                                        }}
                                        className={`p-3 border-b cursor-pointer hover:bg-gray-100 ${selectedChat?.type === 'user' && selectedChat?._id === user._id ? "bg-blue-100" : ""
                                            }`}
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <div className="relative">
                                                    <ChatAvatar user={user} />
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
                                            <div className={`text-xs px-2 py-1 rounded-full ${isOnline ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
                                                }`}>
                                                {isOnline ? 'Online' : 'Offline'}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </>
                    )}

                    {/* Empty State */}
                    {users.length === 0 && groups.length === 0 && (
                        <div className="p-4 text-center text-gray-500">
                            No users or groups found
                        </div>
                    )}
                </div>
            </div>

            {/* 💬 Chat Box */}
            <div className="w-2/3 flex flex-col">
                {selectedChat ? (
                    <>
                        <div className="p-3 border-b font-semibold bg-gray-100 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="relative">
                                    {selectedChat.type === 'user' ? (
                                        <>
                                            <ChatAvatar user={selectedChat} />
                                            <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white ${isUserOnline(selectedChat._id) ? 'bg-green-500' : 'bg-gray-400'
                                                }`}></div>
                                        </>
                                    ) : (
                                        <GroupAvatar group={selectedChat} />
                                    )}
                                </div>
                                <div>
                                    <div className="font-semibold">
                                        {selectedChat.type === 'user'
                                            ? selectedChat.username
                                            : selectedChat.type === 'direct'
                                                ? `Chat (${selectedChat.chatId?.substring(0, 8)}...)`
                                                : (selectedChat.group_name || selectedChat.name || `Group (${selectedChat.memberDetails?.length || 0} members)`)
                                        }
                                    </div>
                                    <div className={`text-xs ${selectedChat.type === 'user'
                                        ? (isUserOnline(selectedChat._id) ? 'text-green-600' : 'text-gray-500')
                                        : 'text-gray-500'
                                        }`}>
                                        {selectedChat.type === 'user'
                                            ? (isUserOnline(selectedChat._id) ? 'Online' : 'Offline')
                                            : selectedChat.type === 'direct'
                                                ? 'Direct Chat'
                                                : `${selectedChat.memberDetails?.length || 0} members`
                                        }
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Chat Messages */}
                        <ChatMessages
                            chatLog={chatLog}
                            loggedInUserId={userId || ""}
                            onLoadMore={() => fetchMoreMessages(currentPage + 1)}
                            hasMoreMessages={hasMoreMessages}
                            isLoadingMessages={isLoadingMessages}
                            users={users}
                            currentUser={currentUser}
                        />

                        <div className="border-t p-3 flex gap-2">
                            <div className="flex items-center gap-2">
                                {/* File upload button */}
                                <label className={`cursor-pointer p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors ${isUploadingFile ? 'opacity-50 cursor-not-allowed' : ''}`}>
                                    {isUploadingFile ? (
                                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-500"></div>
                                    ) : (
                                        <Paperclip size={20} />
                                    )}
                                    <input
                                        type="file"
                                        className="hidden"
                                        onChange={handleFileSelect}
                                        accept="image/*,application/pdf,.doc,.docx,.txt,.zip,.rar"
                                        disabled={isUploadingFile}
                                    />
                                </label>
                            </div>

                            <input
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                placeholder="Type a message..."
                                className="flex-1 border rounded p-2"
                                onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                                disabled={isUploadingFile}
                            />

                            <button
                                onClick={sendMessage}
                                disabled={isUploadingFile || !message.trim()}
                                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
                            >
                                {isUploadingFile ? (
                                    uploadingFileName ? `Sending ${uploadingFileName.substring(0, 15)}...` : "Sending..."
                                ) : "Send"}
                            </button>
                        </div>
                    </>
                ) : (
                    <div className="flex items-center justify-center flex-1 text-gray-500">
                        Select a user or group to start chatting 💬
                    </div>
                )}
            </div>



            {/* Group Creation Modal */}
            <GroupCreationModal
                isOpen={showGroupModal}
                onClose={() => setShowGroupModal(false)}
                users={users}
                onCreateGroup={handleCreateGroup}
            />
        </div>
    );
}
