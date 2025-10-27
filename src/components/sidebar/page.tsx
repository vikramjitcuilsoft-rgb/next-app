"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Calendar,
  MessageSquare,
  Users,
  User,
  BarChart3,
  Settings,
  LogOut,
  HelpCircle,
  ChevronDown,
} from "lucide-react";
import { useState } from "react";

const Sidebar = () => {
  const pathname = usePathname();
  const [openMenu, setOpenMenu] = useState<string | null>(null);

  const toggleSubMenu = (menu: string) => {
    setOpenMenu(openMenu === menu ? null : menu);
  };

  const menu = [
    { name: "Dashboard", icon: <Home size={18} />, href: "/dashboard" },
    { name: "Schedule", icon: <Calendar size={18} />, href: "/dashboard/test" },
    { name: "Message", icon: <MessageSquare size={18} />, href: "#" },
    { name: "Clients", icon: <Users size={18} />, href: "#" },
    {
      name: "Profile",
      icon: <User size={18} />,
      subMenu: [
        { name: "Service", href: "/profile/service" },
        { name: "Wallet", href: "/profile/wallet" },
        { name: "Session Break", href: "/profile/session-break" },
      ],
    },
    { name: "Statistics & Performance", icon: <BarChart3 size={18} />, href: "#" },
    { name: "Preferences", icon: <Settings size={18} />, href: "#" },
  ];

  return (
    <aside className="bg-white border-r w-64 min-h-screen flex flex-col justify-between">
      <div>
        {/* Logo */}
        <div className="p-6 flex items-center gap-2 font-bold text-xl text-blue-700">
          <img src="/my-logo.jpg" alt="Logo" className="w-6 h-6" />
          mystc
        </div>

        {/* Menu */}
        <nav className="px-4 space-y-1">
          {menu.map((item) => (
            <div key={item.name}>
              {/* Parent Menu */}
              {!item.subMenu ? (
                <Link
                  href={item.href || "#"}
                  className={`flex items-center justify-between px-3 py-2 rounded-lg transition ${pathname === item.href
                      ? "bg-blue-600 text-white"
                      : "text-gray-700 hover:bg-blue-100"
                    }`}
                >
                  <div className="flex items-center gap-3">{item.icon}<span>{item.name}</span></div>
                </Link>
              ) : (
                <button
                  onClick={() => toggleSubMenu(item.name)}
                  className={`flex items-center justify-between w-full px-3 py-2 rounded-lg transition ${openMenu === item.name
                      ? "bg-blue-100 text-blue-700"
                      : "text-gray-700 hover:bg-blue-100"
                    }`}
                >
                  <div className="flex items-center gap-3">{item.icon}<span>{item.name}</span></div>
                  <ChevronDown
                    size={16}
                    className={`transform transition-transform ${openMenu === item.name ? "rotate-180" : ""
                      }`}
                  />
                </button>
              )}

              {/* Submenu */}
              {item.subMenu && openMenu === item.name && (
                <div className="ml-8 mt-1 space-y-1">
                  {item.subMenu.map((sub) => (
                    <Link
                      key={sub.name}
                      href={sub.href}
                      className={`block px-3 py-1.5 rounded-md text-sm transition ${pathname === sub.href
                          ? "bg-blue-600 text-white"
                          : "text-gray-600 hover:bg-blue-50 hover:text-blue-700"
                        }`}
                    >
                      {sub.name}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ))}
        </nav>
      </div>

      {/* Bottom Section */}
      <div className="p-4 border-t space-y-2">
        <button className="flex items-center gap-2 text-gray-700 hover:text-blue-700 w-full">
          <HelpCircle size={18} /> Help Center
        </button>
        <button className="flex items-center gap-2 text-red-600 hover:text-red-700 w-full">
          <LogOut size={18} /> Sign Out
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
