import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Bell, Moon, Shield, User, ChevronRight } from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

const Settings = () => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(true);

  const sections = [
    {
      title: "Account",
      items: [
        { icon: User, label: "Edit Profile", href: "/profile/edit" },
      ],
    },
    {
      title: "Preferences",
      items: [
        {
          icon: Bell,
          label: "Push Notifications",
          right: (
            <Switch checked={notifications} onCheckedChange={setNotifications} />
          ),
        },
        {
          icon: Moon,
          label: "Dark Mode",
          right: <Switch checked={darkMode} onCheckedChange={setDarkMode} />,
        },
      ],
    },
    {
      title: "Privacy & Security",
      items: [
        { icon: Shield, label: "Privacy & Security", href: "/settings#privacy" },
      ],
    },
  ];

  return (
    <AppLayout title="Settings" showNav={true}>
      <div className="px-4 py-6 space-y-6">
        {sections.map((section) => (
          <div key={section.title}>
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2 px-1">
              {section.title}
            </h2>
            <div className="rounded-2xl border border-border/50 bg-card overflow-hidden">
              {section.items.map((item, i) => (
                <div
                  key={item.label}
                  className={cn(
                    "flex items-center gap-3 p-4",
                    i < section.items.length - 1 && "border-b border-border/50"
                  )}
                >
                  <item.icon className="h-5 w-5 text-muted-foreground shrink-0" />
                  <span className="flex-1 font-medium text-foreground">{item.label}</span>
                  {item.href ? (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 rounded-lg"
                      onClick={() => navigate(item.href!)}
                    >
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  ) : (
                    item.right
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
        <div id="privacy" className="scroll-mt-20">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2 px-1">
            Privacy
          </h2>
          <div className="rounded-2xl border border-border/50 bg-card p-4 text-sm text-muted-foreground">
            <p>
              Your profile (name, skills, bio) is visible to other users for matching. We do not share your email. Messages are private between you and the other user. Credit transactions are stored for your history only.
            </p>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default Settings;
