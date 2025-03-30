import { ReactNode } from "react";
import { useLocation, Link } from "wouter";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { LayoutDashboard, Search, User, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

type UserLayoutProps = {
  children: ReactNode;
  title: string;
  points?: number;
};

export default function UserLayout({ children, title, points }: UserLayoutProps) {
  const [location] = useLocation();
  const { user, logoutMutation } = useAuth();
  
  const handleLogout = () => {
    logoutMutation.mutate();
  };
  
  const getInitials = (name?: string) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 max-w-md mx-auto">
      {/* Header */}
      <header className="sticky top-0 bg-white z-10 shadow-sm">
        <div className="px-4 py-3 flex justify-between items-center">
          <h1 className="text-xl font-bold">{title}</h1>
          <div className="flex items-center space-x-2">
            {points !== undefined && (
              <span className="inline-flex items-center bg-blue-100 text-blue-800 px-2.5 py-0.5 rounded-full text-sm font-medium">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="w-4 h-4 mr-1"
                >
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                </svg>
                <span>{points}</span> pts
              </span>
            )}
            
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-primary text-white">
                {user ? getInitials(user.name) : "U"}
              </AvatarFallback>
            </Avatar>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 pb-20 overflow-y-auto">
        {children}
      </main>

      {/* Bottom navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-20 h-16">
        <div className="max-w-md mx-auto px-6">
          <div className="flex justify-around h-full">
            <div className="w-1/3">
              <Link href="/">
                <div className={cn(
                  "flex flex-col items-center justify-center h-full cursor-pointer",
                  location === "/" ? "text-primary" : "text-gray-500"
                )}>
                  <LayoutDashboard size={20} />
                  <span className="text-xs mt-1">Dashboard</span>
                </div>
              </Link>
            </div>
            <div className="w-1/3">
              <Link href="/search">
                <div className={cn(
                  "flex flex-col items-center justify-center h-full cursor-pointer",
                  location === "/search" ? "text-primary" : "text-gray-500"
                )}>
                  <Search size={20} />
                  <span className="text-xs mt-1">Discover</span>
                </div>
              </Link>
            </div>
            <div className="w-1/3">
              <Link href="/profile">
                <div className={cn(
                  "flex flex-col items-center justify-center h-full cursor-pointer",
                  location === "/profile" ? "text-primary" : "text-gray-500"
                )}>
                  <User size={20} />
                  <span className="text-xs mt-1">Profile</span>
                </div>
              </Link>
            </div>
          </div>
        </div>
      </nav>
    </div>
  );
}
