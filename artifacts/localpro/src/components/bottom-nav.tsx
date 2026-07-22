import { Link, useLocation } from "wouter";
import { Home, ClipboardList, User, LayoutDashboard, Award, Building2, Trophy } from "lucide-react";
import { useLanguage } from "@/components/language-provider";
import { useAuth } from "@/components/auth-provider";
import { cn } from "@/lib/utils";

export function BottomNav() {
  const [location] = useLocation();
  const { t } = useLanguage();
  const { user } = useAuth();

  if (!user) return null;

  const isProvider = user.role === "provider";

  const residentNav = [
    { href: "/", label: t("nav.home"), icon: Home },
    { href: "/bookings", label: t("nav.bookings"), icon: ClipboardList },
    { href: "/local-partners", label: "Partners", icon: Building2 },
    { href: "/hall-of-fame", label: "Hall of Fame", icon: Trophy },
    { href: "/profile", label: t("nav.profile"), icon: User },
  ];

  const providerNav = [
    { href: "/provider/dashboard", label: t("nav.dashboard"), icon: LayoutDashboard },
    { href: "/provider/bookings", label: t("nav.bookings"), icon: ClipboardList },
    { href: "/provider/upskilling", label: t("nav.upskilling"), icon: Award },
    { href: "/provider/profile", label: t("nav.profile"), icon: User },
  ];

  const items = isProvider ? providerNav : residentNav;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border pb-safe">
      <nav className="flex items-center justify-around px-2 h-16 max-w-md mx-auto">
        {items.map((item) => {
          const isActive = location === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center w-full h-full space-y-1 text-xs font-medium transition-colors",
                isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className={cn("h-5 w-5", isActive && "fill-primary/20")} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
