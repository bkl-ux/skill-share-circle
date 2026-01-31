import { Camera, Edit2, ChevronRight, LogOut, Settings, HelpCircle, Shield } from "lucide-react";
import { useNavigate } from "react-router-dom";
import AppLayout from "@/components/layout/AppLayout";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import SkillTag from "@/components/ui/SkillTag";
import { cn } from "@/lib/utils";
import { useProfile } from "@/hooks/useProfile";
import { useAuth } from "@/contexts/AuthContext";

const Profile = () => {
  const navigate = useNavigate();
  const { profile, isLoading } = useProfile();
  const { signOut } = useAuth();
  const menuItems = [
    { icon: Edit2, label: "Edit Profile", href: "/profile/edit" },
    { icon: Settings, label: "Settings", href: "/settings" },
    { icon: Shield, label: "Privacy & Security", href: "/settings#privacy" },
    { icon: HelpCircle, label: "Help & Support", href: "/help" },
  ];

  const name = profile?.name ?? "User";
  const initials = name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase() || "U";

  if (isLoading) {
    return (
      <AppLayout title="Profile">
        <div className="px-4 py-6 flex items-center justify-center min-h-[200px]">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Profile">
      <div className="px-4 py-6 space-y-6">
        {/* Profile header */}
        <div className="text-center animate-fade-in">
          <div className="relative inline-block">
            <Avatar className="h-24 w-24 ring-4 ring-primary/20">
              <AvatarImage src={profile?.avatar_url ?? undefined} alt={name} />
              <AvatarFallback className="bg-primary/10 text-primary text-2xl font-bold">
                {initials}
              </AvatarFallback>
            </Avatar>
            <button className="absolute bottom-0 right-0 h-8 w-8 rounded-full bg-primary flex items-center justify-center border-2 border-background">
              <Camera className="h-4 w-4 text-primary-foreground" />
            </button>
          </div>
          <h1 className="text-2xl font-bold text-foreground mt-4">{name}</h1>
          <p className="text-sm text-muted-foreground">{profile?.email ?? ""}</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 animate-fade-in" style={{ animationDelay: "0.1s" }}>
          {[
            { label: "Sessions", value: 0 },
            { label: "Rating", value: "—" },
            { label: "Credits", value: profile?.credits ?? 3 },
          ].map((stat) => (
            <div
              key={stat.label}
              className="p-4 rounded-2xl bg-card border border-border/50 text-center"
            >
              <p className="text-2xl font-bold text-foreground">{stat.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Bio */}
        {profile?.bio && (
          <div className="animate-fade-in" style={{ animationDelay: "0.15s" }}>
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2">
              About
            </h3>
            <p className="text-sm text-secondary-foreground leading-relaxed">{profile.bio}</p>
          </div>
        )}

        {/* Menu items */}
        <div className="space-y-2 animate-fade-in" style={{ animationDelay: "0.3s" }}>
          {menuItems.map((item) => (
            <button
              key={item.label}
              onClick={() => item.href && navigate(item.href)}
              className={cn(
                "w-full flex items-center gap-3 p-4 rounded-2xl",
                "bg-card border border-border/50",
                "transition-all duration-200 hover:bg-secondary"
              )}
            >
              <div className="h-10 w-10 rounded-xl bg-secondary flex items-center justify-center">
                <item.icon className="h-5 w-5 text-muted-foreground" />
              </div>
              <span className="flex-1 text-left font-medium text-foreground">
                {item.label}
              </span>
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </button>
          ))}
        </div>

        {/* Logout */}
        <Button
          variant="outline"
          className="w-full h-12 rounded-2xl border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive animate-fade-in"
          style={{ animationDelay: "0.35s" }}
          onClick={() => signOut()}
        >
          <LogOut className="h-5 w-5 mr-2" />
          Sign Out
        </Button>
      </div>
    </AppLayout>
  );
};

export default Profile;
