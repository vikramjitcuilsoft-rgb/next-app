// ChatMessages.tsx
import React, { useEffect, useRef, useState } from "react";
import { Image, FileText, Download } from "lucide-react";

interface Message {
    _id?: string;
    chat_id?: string;
    user_id?: string;
    from?: string;
    message: string;
    type?: string;
    createdAt?: string;
    isUploading?: boolean; // Flag for optimistic file uploads
}

interface User {
    _id: string;
    username: string;
    email?: string;
}

interface ChatMessagesProps {
    chatLog: Message[];
    loggedInUserId: string;
    onLoadMore: () => void;
    hasMoreMessages: boolean;
    isLoadingMessages: boolean;
    users: User[];
    currentUser: User | null;
}

const ChatMessages: React.FC<ChatMessagesProps> = ({
    chatLog,
    loggedInUserId,
    onLoadMore,
    hasMoreMessages,
    isLoadingMessages,
    users,
    currentUser,
}) => {
    const bottomRef = useRef<HTMLDivElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [shouldAutoScroll, setShouldAutoScroll] = useState(true);

    // ✅ Auto-scroll to bottom when new message comes (only if user is at bottom)
    useEffect(() => {
        if (shouldAutoScroll) {
            bottomRef.current?.scrollIntoView({ behavior: "smooth" });
        }
    }, [chatLog, shouldAutoScroll]);

    // ✅ Handle scroll to detect when user scrolls up to load more messages
    const handleScroll = () => {
        const container = containerRef.current;
        if (!container) return;

        const { scrollTop, scrollHeight, clientHeight } = container;

        // Check if user is near the bottom (within 100px)
        const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
        setShouldAutoScroll(isNearBottom);

        // Check if user scrolled to the top to load more messages
        if (scrollTop === 0 && hasMoreMessages && !isLoadingMessages) {
            const previousScrollHeight = scrollHeight;
            onLoadMore();

            // Maintain scroll position after loading new messages
            setTimeout(() => {
                if (container) {
                    container.scrollTop = container.scrollHeight - previousScrollHeight;
                }
            }, 100);
        }
    };

    // Helper function to get username from user ID
    const getUserName = (userId: string): string => {
        if (userId === loggedInUserId && currentUser) {
            return currentUser.username;
        }
        const user = users.find(u => u._id === userId);
        return user?.username || 'Unknown User';
    };

    // Helper function to render file content
    const renderFileContent = (msg: Message, isMine: boolean) => {
        // Check if message exists and is a string
        if (!msg.message || typeof msg.message !== 'string') {
            return (
                <div className="text-red-500 text-sm">
                    Error: Invalid file content
                </div>
            );
        }



        const fileUrl = msg.message.startsWith('http')
            ? msg.message
            : `${process.env.NEXT_PUBLIC_API_URL}${msg.message}`; // Direct static file URL

        const fileName = msg.message.split('/').pop() || 'file';
        const fileExtension = fileName.split('.').pop()?.toLowerCase();

        if (msg.type === 'image' || ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(fileExtension || '')) {
            return (
                <div className="max-w-xs">
                    <img
                        src={fileUrl}
                        alt="Shared image"
                        className="rounded-lg max-w-full h-auto cursor-pointer hover:opacity-90"
                        onClick={() => window.open(fileUrl, '_blank')}
                        onError={(e) => {
                            // Replace with a placeholder or error message
                            const parent = e.currentTarget.parentElement;
                            if (parent) {
                                parent.innerHTML = `
                                    <div class="flex items-center gap-2 p-3 border rounded-lg bg-gray-100">
                                        <div class="text-2xl">🖼️</div>
                                        <div>
                                            <div class="text-sm font-medium text-gray-800">${fileName}</div>
                                            <div class="text-xs text-red-500">Image failed to load</div>
                                            <a href="${fileUrl}" target="_blank" class="text-xs text-blue-500 hover:underline">
                                                Try direct link
                                            </a>
                                        </div>
                                    </div>
                                `;
                            }
                        }}
                    />
                    <div className={`text-xs mt-1 ${isMine ? "text-blue-100" : "text-gray-500"}`}>
                        {fileName}
                    </div>
                </div>
            );
        } else {
            // For other file types, show a download link
            const getFileIcon = () => {
                if (['pdf'].includes(fileExtension || '')) return '📄';
                if (['doc', 'docx'].includes(fileExtension || '')) return '📝';
                if (['txt'].includes(fileExtension || '')) return '📄';
                if (['zip', 'rar'].includes(fileExtension || '')) return '🗜️';
                return '📎';
            };

            return (
                <div className={`flex items-center gap-2 p-2 border rounded-lg ${isMine ? 'bg-blue-400' : 'bg-gray-50'}`}>
                    <div className="text-2xl">{getFileIcon()}</div>
                    <div className="flex-1">
                        <div className={`text-sm font-medium ${isMine ? 'text-white' : 'text-gray-800'}`}>{fileName}</div>
                        <div className={`text-xs ${isMine ? 'text-blue-100' : 'text-gray-500'}`}>Click to download</div>
                    </div>
                    <a
                        href={fileUrl}
                        download={fileName}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`p-1 rounded ${isMine ? 'hover:bg-blue-300' : 'hover:bg-gray-200'}`}
                    >
                        <Download size={16} className={isMine ? 'text-white' : 'text-gray-600'} />
                    </a>
                </div>
            );
        }
    };

    return (
        <div
            ref={containerRef}
            onScroll={handleScroll}
            className="flex flex-col p-4 h-[calc(100vh-200px)] overflow-y-auto bg-gray-50"
            style={{ minHeight: '200px' }}
        >
            {/* Ensure consistent rendering */}
            {/* Loading indicator for older messages */}
            {isLoadingMessages && (
                <div className="flex justify-center py-2">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                </div>
            )}

            {/* Show "No more messages" when reached the end */}
            {!hasMoreMessages && chatLog.length > 0 && (
                <div className="text-center text-gray-400 text-sm py-2">
                    No more messages
                </div>
            )}
            {chatLog.length > 0 ? (
                chatLog.map((msg, index) => {
                    // Debug logging for problematic messages
                    if (!msg.message) {
                        console.warn('Message with undefined content:', msg);
                    }

                    const senderId = msg.user_id || msg.from;
                    const isMine = senderId === loggedInUserId;
                    const senderName = getUserName(senderId || '');

                    const formatTime = (dateString?: string) => {
                        if (!dateString) return new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
                        return new Date(dateString).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
                    };

                    return (
                        <div
                            key={msg._id || index}
                            className={`flex flex-col mb-4 ${isMine ? "items-end" : "items-start"}`}
                        >
                            {/* Sender name */}
                            <div className={`text-xs text-gray-600 mb-1 px-1 ${isMine ? "text-right" : "text-left"}`}>
                                {isMine ? "You" : senderName}
                            </div>

                            {/* Message bubble */}
                            <div
                                className={`max-w-xs lg:max-w-md rounded-2xl shadow-sm ${msg.type === 'image' || (msg.type && msg.type !== 'text')
                                    ? "p-2" // Less padding for files
                                    : "px-4 py-2" // Normal padding for text
                                    } ${isMine
                                        ? "bg-blue-500 text-white rounded-br-md"
                                        : "bg-white text-gray-800 border rounded-bl-md"
                                    }`}
                            >
                                {msg.isUploading ? (
                                    // Render uploading state (always show as text, never as image)
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                                            <span className="text-sm">Uploading {msg.message}...</span>
                                        </div>
                                        <div className={`text-xs mt-1 ${isMine ? "text-blue-100" : "text-gray-500"}`}>
                                            {formatTime(msg.createdAt)}
                                        </div>
                                    </div>
                                ) : msg.type === 'image' || (msg.type && msg.type !== 'text') ? (
                                    // Render file content (only after upload is complete)
                                    <div>
                                        {msg.message && typeof msg.message === 'string' ? (
                                            renderFileContent(msg, isMine)
                                        ) : (
                                            <div className="text-red-500 text-sm">
                                                Error: Invalid file message
                                            </div>
                                        )}
                                        <div className={`text-xs mt-1 ${isMine ? "text-blue-100" : "text-gray-500"}`}>
                                            {formatTime(msg.createdAt)}
                                        </div>
                                    </div>
                                ) : (
                                    // Render text message
                                    <div>
                                        <p className="text-sm">{msg.message || 'Empty message'}</p>
                                        <div className={`text-xs mt-1 ${isMine ? "text-blue-100" : "text-gray-500"}`}>
                                            {formatTime(msg.createdAt)}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })
            ) : (
                <div className="text-gray-400 text-center py-8">No messages yet</div>
            )}
            <div ref={bottomRef} />
        </div>
    );
};

export default ChatMessages;
