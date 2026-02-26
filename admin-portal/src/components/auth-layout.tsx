"use client";

import { usePathname } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { AdminSidebar } from "./admin-sidebar";

interface AuthLayoutProps {
  children: React.ReactNode;
}

export function AuthLayout({ children }: AuthLayoutProps) {
  const { isAuthenticated } = useAuth();
  const pathname = usePathname();

  // Don't show sidebar on login page
  const shouldShowSidebar = isAuthenticated && pathname !== "/login";

  return (
    <div className="flex h-screen bg-white">
      {shouldShowSidebar && <AdminSidebar />}
      <main className={`overflow-y-auto ${shouldShowSidebar ? "flex-1 bg-gray-50" : "w-full"}`}>
        {children}
      </main>
    </div>
  );
}
