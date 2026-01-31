import { useQuery } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { Bell } from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

const Notifications = () => {
  const { user } = useAuth();
  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ["notifications", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!user?.id,
  });

  return (
    <AppLayout title="Notifications">
      <div className="px-4 py-6">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Bell className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p className="font-medium text-foreground">No notifications yet</p>
            <p className="text-sm mt-1">When you get messages or credit updates, they’ll show here.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {notifications.map((n) => (
              <div
                key={n.id}
                className={cn(
                  "p-4 rounded-2xl border border-border/50",
                  !n.read && "bg-primary/5 border-primary/20"
                )}
              >
                <h4 className="font-medium text-foreground">{n.title}</h4>
                {n.body && <p className="text-sm text-muted-foreground mt-1">{n.body}</p>}
                <p className="text-xs text-muted-foreground mt-2">
                  {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default Notifications;
