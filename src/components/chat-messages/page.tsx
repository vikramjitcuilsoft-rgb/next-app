// ChatMessages.tsx
import React, { useEffect, useRef, useState } from "react";

interface Message {
    _id?: string;
    chat_id?: string;
    user_id?: string;
    from?: string;
    message: string;
    type?: string;
    createdAt?: string;
}

interface ChatMessagesProps {
    chatLog: Message[];
    loggedInUserId: string;
    onLoadMore: () => void;
    hasMoreMessages: boolean;
    isLoadingMessages: boolean;
}

const ChatMessages: React.FC<ChatMessagesProps> = ({
    chatLog,
    loggedInUserId,
    onLoadMore,
    hasMoreMessages,
    isLoadingMessages,
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

    return (
        <div
            ref={containerRef}
            onScroll={handleScroll}
            className="flex flex-col p-4 h-[calc(100vh-200px)] overflow-y-auto bg-white"
        >
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
                    const isMine = (msg.user_id || msg.from) === loggedInUserId;

                    return (
                        <div
                            key={msg._id || index}
                            className={`flex my-2 ${isMine ? "justify-end" : "justify-start"}`}
                        >
                            <div
                                className={`max-w-xs p-3 rounded-2xl shadow-md ${isMine
                                    ? "bg-blue-600 text-white rounded-br-none"
                                    : "bg-gray-300 text-gray-900 rounded-bl-none"
                                    }`}
                            >
                                <p>{msg.message}</p>
                                <span className="block text-xs opacity-75 mt-1 text-right">
                                    {msg.createdAt ? new Date(msg.createdAt).toLocaleTimeString([], {
                                        hour: "2-digit",
                                        minute: "2-digit",
                                    }) : new Date().toLocaleTimeString([], {
                                        hour: "2-digit",
                                        minute: "2-digit",
                                    })}
                                </span>
                            </div>
                        </div>
                    );
                })
            ) : (
                <div className="text-gray-400 text-center">No messages yet</div>
            )}
            <div ref={bottomRef} />
        </div>
    );
};

export default ChatMessages;
