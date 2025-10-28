"use client";

import { useState, useRef, useEffect } from "react";
import { Bell, PlusCircle, LogOut, Settings } from "lucide-react";
import { useRouter } from "next/navigation";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [openLogoutDialog, setOpenLogoutDialog] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    router.push("/auth/login");
  };

  return (
    <header className="bg-white border-b p-4 flex items-center justify-between relative">
      {/* Search bar */}
      <div className="flex items-center w-1/2">
        <input
          type="text"
          placeholder="Search practitioners, health modalities, articles"
          className="w-full bg-gray-50 px-3 py-2 rounded-md text-sm focus:outline-none border border-gray-200"
        />
      </div>

      {/* Right section */}
      <div className="flex items-center gap-4">
        <Bell className="text-gray-600 cursor-pointer" size={20} />

        <button className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-2 rounded-md flex items-center gap-2 text-sm font-medium">
          <PlusCircle size={16} /> Add a new service
        </button>

        {/* Profile section */}
        <div className="relative" ref={menuRef}>
          <div
            className="flex items-center gap-2 cursor-pointer"
            onClick={() => setIsMenuOpen((prev) => !prev)}
          >
            <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-sm font-bold text-gray-700">
              Z
            </div>
            <span className="font-medium">Zaheet</span>
          </div>

          {/* Dropdown menu */}
          {isMenuOpen && (
            <div className="absolute right-0 mt-3 w-40 bg-white shadow-lg rounded-lg border border-gray-100 py-2 z-50 animate-fadeIn">
              <button className="flex items-center gap-2 w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                <Settings size={16} /> Settings
              </button>
              <button
                onClick={() => setOpenLogoutDialog(true)}
                className="flex items-center gap-2 w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-red-50"
              >
                <LogOut size={16} /> Sign Out
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Sign Out Confirmation Dialog */}
      <AlertDialog open={openLogoutDialog} onOpenChange={setOpenLogoutDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to sign out?</AlertDialogTitle>
            <AlertDialogDescription>
              You will need to log in again to access your dashboard.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setOpenLogoutDialog(false)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleLogout}
              className="bg-red-500 hover:bg-red-600 text-white"
            >
              Yes, Sign Out
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </header>
  );
};

export default Header;
