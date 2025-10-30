"use client";

import { useState } from "react";
import { X, Users, Check } from "lucide-react";

// Avatar component for the modal
const ChatAvatar = ({ user, size = "w-8 h-8" }: { user: any, size?: string }) => {
    const getAvatarUrl = () => {
        if (user?.user_avatar_url) {
            return user.user_avatar_url.startsWith('http')
                ? user.user_avatar_url
                : `${process.env.NEXT_PUBLIC_API_URL}${user.user_avatar_url}`;
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

// Group Creation Modal Component
interface GroupCreationModalProps {
    isOpen: boolean;
    onClose: () => void;
    users: any[];
    onCreateGroup: (groupName: string, selectedUsers: string[]) => void;
}

export default function GroupCreationModal({
    isOpen,
    onClose,
    users,
    onCreateGroup
}: GroupCreationModalProps) {
    const [groupName, setGroupName] = useState("");
    const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
    const [searchTerm, setSearchTerm] = useState("");

    const filteredUsers = users.filter(user =>
        user.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleUserToggle = (userId: string) => {
        setSelectedUsers(prev =>
            prev.includes(userId)
                ? prev.filter(id => id !== userId)
                : [...prev, userId]
        );
    };

    const handleCreateGroup = () => {
        if (groupName.trim() && selectedUsers.length > 0) {
            onCreateGroup(groupName.trim(), selectedUsers);
            // Reset form
            setGroupName("");
            setSelectedUsers([]);
            setSearchTerm("");
            onClose();
        }
    };

    const handleClose = () => {
        setGroupName("");
        setSelectedUsers([]);
        setSearchTerm("");
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div   style={{ backgroundColor: '#2320207a' }} className="fixed inset-0 bg-opacity-50 flex items-center justify-center z-[9999]" onClick={handleClose}>
            <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[80vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold flex items-center gap-2">
                        <Users size={20} />
                        Create Group
                    </h2>
                    <button
                        onClick={handleClose}
                        className="p-1 hover:bg-gray-100 rounded-full"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Group Name Input */}
                <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Group Name
                    </label>
                    <input
                        type="text"
                        value={groupName}
                        onChange={(e) => setGroupName(e.target.value)}
                        placeholder="Enter group name..."
                        className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-400 focus:outline-none"
                    />
                </div>

                {/* Search Users */}
                <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Add Members ({selectedUsers.length} selected)
                    </label>
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Search users..."
                        className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-400 focus:outline-none mb-2"
                    />
                </div>

                {/* User List */}
                <div className="flex-1 overflow-y-auto mb-4 border rounded-lg">
                    {filteredUsers.length === 0 ? (
                        <div className="p-4 text-center text-gray-500">
                            No users found
                        </div>
                    ) : (
                        filteredUsers.map((user) => (
                            <div
                                key={user._id}
                                onClick={() => handleUserToggle(user._id)}
                                className={`p-3 border-b cursor-pointer hover:bg-gray-50 flex items-center justify-between ${selectedUsers.includes(user._id) ? 'bg-blue-50 border-blue-200' : ''
                                    }`}
                            >
                                <div className="flex items-center gap-3">
                                    <ChatAvatar user={user} size="w-10 h-10" />
                                    <div>
                                        <div className="font-medium">{user.username}</div>
                                        <div className="text-sm text-gray-500">{user.email}</div>
                                    </div>
                                </div>
                                {selectedUsers.includes(user._id) && (
                                    <Check className="text-blue-500" size={20} />
                                )}
                            </div>
                        ))
                    )}
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2">
                    <button
                        onClick={handleClose}
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleCreateGroup}
                        disabled={!groupName.trim() || selectedUsers.length === 0}
                        className={`flex-1 px-4 py-2 rounded-lg text-white ${groupName.trim() && selectedUsers.length > 0
                            ? 'bg-blue-500 hover:bg-blue-600'
                            : 'bg-gray-300 cursor-not-allowed'
                            }`}
                    >
                        Create Group
                    </button>
                </div>
            </div>
        </div>
    );
}