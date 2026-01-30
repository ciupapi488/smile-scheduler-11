import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { LogOut, Calendar, User, Shield } from "lucide-react";
import { toast } from "sonner";

export function Header() {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    toast.success("Signed out successfully");
    navigate("/");
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
      <div className="container flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
            <span className="text-lg font-bold text-primary-foreground">D</span>
          </div>
          <span className="text-xl font-semibold text-foreground">DentaCare</span>
        </Link>

        <nav className="flex items-center gap-2">
          {user ? (
            <>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/dashboard" className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <span className="hidden sm:inline">My Appointments</span>
                </Link>
              </Button>
              {isAdmin && (
                <Button variant="ghost" size="sm" asChild>
                  <Link to="/admin" className="flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    <span className="hidden sm:inline">Admin</span>
                  </Link>
                </Button>
              )}
              <Button variant="ghost" size="sm" onClick={handleSignOut} className="flex items-center gap-2">
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">Sign Out</span>
              </Button>
            </>
          ) : (
            <Button variant="default" size="sm" asChild>
              <Link to="/auth" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Sign In
              </Link>
            </Button>
          )}
        </nav>
      </div>
    </header>
  );
}
