import { useLanguage } from "@/hooks/useLanguage";
import { Link } from "react-router-dom";
import { MapPin, Phone, Mail, Users, Images, Home, Briefcase } from "lucide-react";

export function Footer() {
  const { t } = useLanguage();
  
  const isRo = t("lang.ro") === "Română";
  
  return (
    <footer className="border-t bg-muted/30">
      <div className="container py-8">
        <div className="grid md:grid-cols-4 gap-8 mb-8">
          {/* Brand */}
          <div className="md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                <span className="text-sm font-bold text-primary-foreground">L</span>
              </div>
              <div>
                <span className="font-semibold text-foreground block">{t("hero.title")}</span>
                <span className="text-xs text-muted-foreground">{t("hero.subtitle")}</span>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              {t("footer.description")}
            </p>
          </div>
          
          {/* Quick Links */}
          <div>
            <h4 className="font-semibold text-foreground mb-4">{isRo ? "Linkuri Rapide" : "Quick Links"}</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/" className="text-muted-foreground hover:text-primary flex items-center gap-2">
                  <Home className="h-4 w-4" />
                  {isRo ? "Acasă" : "Home"}
                </Link>
              </li>
              <li>
                <Link to="/echipa" className="text-muted-foreground hover:text-primary flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  {t("nav.team")}
                </Link>
              </li>
              <li>
                <Link to="/lucrari" className="text-muted-foreground hover:text-primary flex items-center gap-2">
                  <Images className="h-4 w-4" />
                  {t("nav.gallery")}
                </Link>
              </li>
              <li>
                <Link to="/servicii" className="text-muted-foreground hover:text-primary flex items-center gap-2">
                  <Briefcase className="h-4 w-4" />
                  {t("nav.services")}
                </Link>
              </li>
            </ul>
          </div>
          
          {/* Contact */}
          <div>
            <h4 className="font-semibold text-foreground mb-4">{t("location.contact")}</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <span>{isRo ? "Str. Caracal, Nr. 29" : "29 Caracal Street"}<br />{t("location.city")}</span>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="h-4 w-4 flex-shrink-0" />
                <span>0722 123 456</span>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="h-4 w-4 flex-shrink-0" />
                <span>contact@clinicadrlung.ro</span>
              </li>
            </ul>
          </div>
          
          {/* Schedule */}
          <div>
            <h4 className="font-semibold text-foreground mb-4">{t("location.hours")}</h4>
            <ul className="space-y-1 text-sm text-muted-foreground">
              <li className="flex justify-between">
                <span>{isRo ? `${t("location.mon")} - ${t("location.fri")}:` : "Mon - Fri:"}</span>
                <span>08:00 - 20:00</span>
              </li>
              <li className="flex justify-between">
                <span>{isRo ? t("location.sat") : "Sat"}:</span>
                <span>09:00 - 14:00</span>
              </li>
              <li className="flex justify-between">
                <span>{isRo ? t("location.sun") : "Sun"}:</span>
                <span>{isRo ? `${t("location.closed")} ${t("location.emergency")}` : "Closed (emergencies)"}</span>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="border-t pt-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-center md:text-left">
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} {t("hero.title")}. {t("footer.rights")}
            </p>
            <p className="text-xs text-muted-foreground max-w-md">
              {t("footer.gdpr")}
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
