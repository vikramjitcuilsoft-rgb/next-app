"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Camera, User, Mail, Calendar, Phone } from "lucide-react";
import { getUserInfo, getAuthToken, UserInfo } from "@/common/session/session";
import profileSchema from "@/common/react-hooks/profile-schema";
import { apiUpload } from "@/services/axios/axios-client";
import { toast } from "sonner";

// Simple Avatar component
const Avatar = ({ user, preview, size = "w-24 h-24" }: {
    user: UserInfo | null,
    preview: string | null,
    size?: string
}) => {
    const getAvatarUrl = () => {
        if (preview) return preview;
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
                alt="Profile"
                className={`${size} rounded-full object-cover border border-gray-300`}
                onError={(e) => {
                    // If image fails to load, hide it and show initials
                    const parent = e.currentTarget.parentElement;
                    if (parent) {
                        parent.innerHTML = `
                            <div class="${size} rounded-full bg-blue-500 flex items-center justify-center border border-gray-300">
                                <span class="text-white font-bold text-2xl">${getInitials()}</span>
                            </div>
                        `;
                    }
                }}
            />
        );
    }

    // Fallback to initials
    return (
        <div className={`${size} rounded-full bg-blue-500 flex items-center justify-center border border-gray-300`}>
            <span className="text-white font-bold text-2xl">
                {getInitials()}
            </span>
        </div>
    );
};

type ProfileFormValues = z.infer<typeof profileSchema>;

// API call to update profile
const updateProfile = async (formData: FormData) => {
    const token = getAuthToken();
    if (!token) {
        throw new Error("No authentication token found");
    }

    try {
        const response: any = await apiUpload('users/edit-profile', formData);
        return response;
    } catch (error: any) {
        const message =
            error.response?.data?.message || "Failed to update profile. Please try again.";
        throw new Error(message);
    }
};

export default function EditProfile() {
    const [preview, setPreview] = useState<string | null>(null);
    const [showUserInfo, setShowUserInfo] = useState(true);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const userinfo = getUserInfo();
    const token = getAuthToken();

    // Check if user is authenticated
    if (!token) {
        return (
            <div className="max-w-lg mx-auto mt-10 bg-white p-6 rounded-2xl shadow-md text-center">
                <h2 className="text-2xl font-semibold mb-4 text-red-600">Authentication Required</h2>
                <p className="text-gray-600">Please log in to edit your profile.</p>
            </div>
        );
    }

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<ProfileFormValues>({
        resolver: zodResolver(profileSchema),
        defaultValues: {
            email: userinfo?.email || "",
            username: userinfo?.username || "",
        },
    });

    const mutation = useMutation({
        mutationFn: updateProfile,
        onSuccess: (responseData: any) => {
            // Save updated user data to localStorage
            const user = JSON.stringify(responseData.data);
            localStorage.setItem('user', user);

            // Reset file selection
            setSelectedFile(null);
            setPreview(null);
           toast.success("✅ Profile updated successfully!")
        },
        onError: (error: any) => {
            const errorMessage = error.response?.data?.message ||
                error.message ||
                "Something went wrong while updating profile.";
            toast.error(`❌ Error: ${errorMessage}`)
        },
    });

    const onSubmit = (data: ProfileFormValues) => {
        const formData = new FormData();

        if (data.username) formData.append("username", data.username);
        if (data.email) formData.append("email", data.email);

        // Use the selectedFile state instead of form data
        if (selectedFile) {
            formData.append("file", selectedFile);
        } 

        mutation.mutate(formData);
    };

    const avatarUrl = userinfo?.user_avatar_url
        ? `${process.env.NEXT_PUBLIC_API_URL}${userinfo.user_avatar_url}`
        : null;

    return (
        <div className="max-w-4xl mx-auto mt-10 space-y-6">
            {/* User Info Display Section */}
            {showUserInfo && userinfo && (
                <div className="bg-white p-6 rounded-2xl shadow-md">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-2xl font-semibold">Current User Information</h2>
                        <button
                            onClick={() => setShowUserInfo(false)}
                            className="text-gray-500 hover:text-gray-700 text-sm"
                        >
                            Hide
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Profile Picture Display */}
                        <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg col-span-full">
                            <div className="relative w-16 h-16 rounded-full overflow-hidden bg-gray-200">
                                {avatarUrl ? (
                                    <img
                                        src={avatarUrl}
                                        alt="User Avatar"
                                        className="w-full h-full object-cover"
                                        onError={(e) => {
                                            // Replace with initials on error
                                            const parent = e.currentTarget.parentElement;
                                            if (parent) {
                                                parent.innerHTML = `
                                                    <span class="flex items-center justify-center h-full w-full text-lg font-semibold text-gray-600">
                                                        ${userinfo?.username?.charAt(0).toUpperCase() || "U"}
                                                    </span>
                                                `;
                                            }
                                        }}
                                    />
                                ) : (
                                    <span className="flex items-center justify-center h-full w-full text-lg font-semibold text-gray-600">
                                        {userinfo?.username?.charAt(0).toUpperCase() || "U"}
                                    </span>
                                )}
                            </div>

                            <div>
                                <p className="text-sm text-gray-600">Profile Picture</p>
                                <p className="font-medium text-xs">
                                    {userinfo?.user_avatar_url
                                        ? `Avatar: ${userinfo.user_avatar_url}`
                                        : `Initials: ${userinfo?.username?.charAt(0).toUpperCase() || "U"}`}
                                </p>
                            </div>
                        </div>

                        {/* Username */}
                        <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                            <User className="text-blue-500" size={20} />
                            <div>
                                <p className="text-sm text-gray-600">Username</p>
                                <p className="font-medium">{userinfo?.username || "Not set"}</p>
                            </div>
                        </div>

                        {/* Email */}
                        <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                            <Mail className="text-green-500" size={20} />
                            <div>
                                <p className="text-sm text-gray-600">Email</p>
                                <p className="font-medium">{userinfo?.email || "Not set"}</p>
                            </div>
                        </div>

                        {/* Optional Fields */}
                        {userinfo?.firstName && (
                            <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                                <User className="text-purple-500" size={20} />
                                <div>
                                    <p className="text-sm text-gray-600">First Name</p>
                                    <p className="font-medium">{userinfo.firstName}</p>
                                </div>
                            </div>
                        )}

                        {userinfo?.lastName && (
                            <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                                <User className="text-purple-500" size={20} />
                                <div>
                                    <p className="text-sm text-gray-600">Last Name</p>
                                    <p className="font-medium">{userinfo.lastName}</p>
                                </div>
                            </div>
                        )}

                        {userinfo?.phone && (
                            <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                                <Phone className="text-orange-500" size={20} />
                                <div>
                                    <p className="text-sm text-gray-600">Phone</p>
                                    <p className="font-medium">{userinfo.phone}</p>
                                </div>
                            </div>
                        )}

                        {userinfo?.createdAt && (
                            <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                                <Calendar className="text-indigo-500" size={20} />
                                <div>
                                    <p className="text-sm text-gray-600">Member Since</p>
                                    <p className="font-medium">
                                        {new Date(userinfo.createdAt).toLocaleDateString()}
                                    </p>
                                </div>
                            </div>
                        )}

                        {userinfo?.bio && (
                            <div className="col-span-full mt-4 p-3 bg-gray-50 rounded-lg">
                                <p className="text-sm text-gray-600 mb-1">Bio</p>
                                <p className="font-medium">{userinfo.bio}</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {!showUserInfo && (
                <div className="text-center">
                    <button
                        onClick={() => setShowUserInfo(true)}
                        className="text-blue-500 hover:text-blue-700 text-sm underline"
                    >
                        Show User Information
                    </button>
                </div>
            )}

            {/* Edit Profile Form */}
            <div className="bg-white p-6 rounded-2xl shadow-md">
                <h2 className="text-2xl font-semibold mb-6 text-center">Edit Profile</h2>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                    {/* Profile Picture Upload */}
                    <div className="flex flex-col items-center">
                        <div className="relative">
                            <Avatar user={userinfo} preview={preview} />
                            <label
                                htmlFor="profilePicture"
                                className="absolute bottom-0 right-0 bg-blue-500 p-2 rounded-full text-white cursor-pointer hover:bg-blue-600"
                            >
                                <Camera size={18} />
                                <input
                                    id="profilePicture"
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (file) {
                                            setSelectedFile(file);
                                            setPreview(URL.createObjectURL(file));
                                        }
                                    }}
                                />
                            </label>
                        </div>
                        {selectedFile && (
                            <p className="text-sm text-green-600 mt-2">
                                ✓ File selected: {selectedFile.name}
                            </p>
                        )}
                    </div>

                    {/* Username */}
                    <div>
                        <label className="block text-gray-700 mb-1 font-medium">
                            Username
                        </label>
                        <input
                            type="text"
                            {...register("username")}
                            placeholder="Enter username"
                            className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-400 focus:outline-none"
                        />
                        {errors.username && (
                            <p className="text-red-500 text-sm">{errors.username.message}</p>
                        )}
                    </div>

                    {/* Email */}
                    <div>
                        <label className="block text-gray-700 mb-1 font-medium">Email</label>
                        <input
                            type="email"
                            {...register("email")}
                            placeholder="Enter email"
                            className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-400 focus:outline-none"
                        />
                        {errors.email && (
                            <p className="text-red-500 text-sm">{errors.email.message}</p>
                        )}
                    </div>

                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={mutation.isPending}
                        className={`w-full py-2 rounded-lg text-white transition ${mutation.isPending
                            ? "bg-blue-300 cursor-not-allowed"
                            : "bg-blue-500 hover:bg-blue-600"
                            }`}
                    >
                        {mutation.isPending
                            ? (selectedFile ? "Uploading..." : "Saving...")
                            : "Save Changes"
                        }
                    </button>

                    {/* Debug Info */}
                    {selectedFile && (
                        <div className="text-xs text-gray-500 text-center">
                            Ready to upload: {selectedFile.name} ({Math.round(selectedFile.size / 1024)}KB)
                        </div>
                    )}
                </form>
            </div>
        </div>
    );
}