"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  LayoutDashboard,
  UserCheck,
  Users,
  Receipt,
  MessageSquare,
  LogOut,
  User,
  Shield,
  Megaphone,
  Wallet,
  AlertTriangle,
  Bell
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";

const navigation = [
  { name: "Dashboard", href: "/", icon: Home },
  { name: "KYC Verification", href: "/kyc/verification", icon: UserCheck },
  { name: "User Management", href: "/users", icon: Users },
  { name: "Announcement Moderation", href: "/announcements/moderation", icon: Megaphone },
  { name: "Wallet Management", href: "/wallet/management", icon: Wallet },
  { name: "Dispute Resolution", href: "/disputes/resolution", icon: Shield },
  { name: "Transactions", href: "/transactions", icon: Receipt },
  { name: "Broadcast Messages", href: "/broadcast", icon: Bell },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const { session, logout } = useAuth();

  return (
    <div className="sidebar w-64 bg-white border-r border-gray-200 flex flex-col h-full">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <img
            src="/linkcab-logo.png"
            alt="LinkCab Logo"
            className="w-10 h-10 object-contain"
          />
          <div className="flex-1">
            <h1 className="text-xl font-bold text-black">LinkCab Admin</h1>
            <p className="text-sm text-gray-600">CRM & Management Portal</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-3">
        <div className="space-y-1">
          {navigation.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                  isActive
                    ? "bg-yellow-100 text-black border-l-4 border-yellow-400"
                    : "text-gray-700 hover:bg-gray-100 hover:text-black"
                )}
              >
                <item.icon
                  className={cn(
                    "mr-3 h-4 w-4",
                    isActive ? "text-black" : "text-gray-500"
                  )}
                />
                {item.name}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* User Info & Logout */}
      <div className="border-t border-gray-200 p-4">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center">
            <User className="h-4 w-4 text-black" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-black truncate">
              {session?.email || "Admin User"}
            </p>
            <p className="text-xs text-gray-500">Administrator</p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={logout}
          className="w-full border-yellow-400 text-yellow-600 hover:bg-yellow-400 hover:text-black transition-colors"
        >
          <LogOut className="h-4 w-4 mr-2" />
          Logout
        </Button>
      </div>
    </div>
  );
}
