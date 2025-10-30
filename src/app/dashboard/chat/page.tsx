"use client";

import dynamic from 'next/dynamic'

const ChatPage = dynamic(() => import("@/components/chat/page"), {
    ssr: false,
    loading: () => (
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
    )
})

const Chat = () => {
    return <ChatPage/>
}

export default Chat