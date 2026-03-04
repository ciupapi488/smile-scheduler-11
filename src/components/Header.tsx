import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/hooks/useLanguage";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { LogOut, Calendar, User, Shield, Users, Images, Briefcase, Home, Gamepad2 } from "lucide-react";
import { toast } from "sonner";

export function Header() {
  const { user, isAdmin } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    toast.success("Deconectare reușită");
    navigate("/");
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
      <div className="container flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
            <span className="text-lg font-bold text-primary-foreground">L</span>
          </div>
          <div className="flex flex-col">
            <span className="text-lg font-semibold text-foreground leading-tight">Clinica Dr. Lung</span>
            <span className="text-xs text-muted-foreground">
              {t("hero.subtitle")}
            </span>
          </div>
        </Link>

        <nav className="flex items-center gap-2">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/" className="flex items-center gap-2">
              <Home className="h-4 w-4" />
              <span className="hidden sm:inline">{t("nav.home")}</span>
            </Link>
          </Button>
          <Button variant="default" size="sm" asChild>
            <Link to="/rezervare" className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700">
              <Calendar className="h-4 w-4" />
              <span className="hidden sm:inline">{t("nav.book")}</span>
            </Link>
          </Button>
          <Button variant="ghost" size="sm" asChild>
            <Link to="/echipa" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">{t("nav.team")}</span>
            </Link>
          </Button>
          <Button variant="ghost" size="sm" asChild>
            <Link to="/lucrari" className="flex items-center gap-2">
              <Images className="h-4 w-4" />
              <span className="hidden sm:inline">{t("nav.gallery")}</span>
            </Link>
          </Button>
          <Button variant="ghost" size="sm" asChild>
            <Link to="/servicii" className="flex items-center gap-2">
              <Briefcase className="h-4 w-4" />
              <span className="hidden sm:inline">{t("nav.services")}</span>
            </Link>
          </Button>
          <Button variant="ghost" size="sm" asChild>
            <Link to="/jocuri" className="flex items-center gap-2 text-purple-600 hover:text-purple-700 hover:bg-purple-50">
              <Gamepad2 className="h-4 w-4" />
              <span className="hidden sm:inline">{t("nav.kidsZone") || "Zona Copiilor"}</span>
            </Link>
          </Button>
          <LanguageSwitcher />
          {user ? (
            <>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/pacient/dashboard" className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <span className="hidden sm:inline">{t("nav.appointments")}</span>
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
                <span className="hidden sm:inline">{t("nav.signOut")}</span>
              </Button>
            </>
          ) : (
            <Button variant="default" size="sm" asChild>
              <Link to="/pacient/login" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                {t("nav.myAccount")}
              </Link>
            </Button>
          )}
        </nav>
      </div>
    </header>
  );
}
