import { ReactNode } from "react";
import { useLocation, Link } from "wouter";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { CalendarPlus, Building2, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

type OrganizerLayoutProps = {
  children: ReactNode;
  title: string;
};

export default function OrganizerLayout({ children, title }: OrganizerLayoutProps) {
  const [location] = useLocation();
  const { user, logoutMutation } = useAuth();
  
  const handleLogout = () => {
    logoutMutation.mutate();
  };
  
  const getInitials = (name?: string) => {
    if (!name) return "O";
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
          <div className="flex items-center space-x-3">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleLogout}
              className="text-gray-500 hover:text-gray-800 p-1"
            >
              <LogOut size={18} />
            </Button>
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-primary text-white">
                {user ? getInitials(user.name) : "O"}
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
            <div className="w-1/2">
              <Link href="/organizer">
                <div className={cn(
                  "flex flex-col items-center justify-center h-full cursor-pointer",
                  location === "/organizer" ? "text-primary" : "text-gray-500"
                )}>
                  <CalendarPlus size={20} />
                  <span className="text-xs mt-1">Events</span>
                </div>
              </Link>
            </div>
            <div className="w-1/2">
              <Link href="/organizer/profile">
                <div className={cn(
                  "flex flex-col items-center justify-center h-full cursor-pointer",
                  location === "/organizer/profile" ? "text-primary" : "text-gray-500"
                )}>
                  <Building2 size={20} />
                  <span className="text-xs mt-1">Organization</span>
                </div>
              </Link>
            </div>
          </div>
        </div>
      </nav>
    </div>
  );
}
