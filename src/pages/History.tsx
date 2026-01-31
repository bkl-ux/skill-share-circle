import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { ArrowUpRight, ArrowDownLeft, Coins, Sparkles } from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/hooks/useProfile";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

type Filter = "all" | "earned" | "spent";

const History = () => {
  const { user } = useAuth();
  const { profile } = useProfile();
  const [filter, setFilter] = useState<Filter>("all");

  const { data: transactions = [], isLoading } = useQuery({
    queryKey: ["credit_transactions", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from("credit_transactions")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!user?.id,
  });

  const filtered =
    filter === "earned"
      ? transactions.filter((t) => t.type === "earned")
      : filter === "spent"
        ? transactions.filter((t) => t.type === "spent")
        : transactions;

  const currentBalance = profile?.credits ?? 0;

  return (
    <AppLayout title="Credit History">
      <div className="px-4 py-6 space-y-6">
        <div className="relative overflow-hidden rounded-2xl p-6 bg-gradient-to-br from-card via-card to-secondary border border-border/50 animate-scale-in">
          <div className="absolute top-0 right-0 w-40 h-40 bg-primary/5 rounded-full blur-3xl" />
          <div className="relative text-center">
            <p className="text-sm text-muted-foreground uppercase tracking-wide">Current Balance</p>
            <div className="flex items-center justify-center gap-2 mt-2">
              <Coins className="h-8 w-8 text-primary" />
              <span className="text-5xl font-bold gradient-text">{currentBalance}</span>
            </div>
            <p className="text-sm text-muted-foreground mt-2">Skill Credits</p>
          </div>
        </div>

        <div className="flex gap-2 animate-fade-in" style={{ animationDelay: "0.1s" }}>
          <button
            onClick={() => setFilter("all")}
            className={cn(
              "px-4 py-2 rounded-full text-sm font-medium transition-colors",
              filter === "all"
                ? "bg-primary/10 text-primary border border-primary/20"
                : "bg-secondary text-secondary-foreground hover:bg-secondary/80 border border-transparent"
            )}
          >
            All
          </button>
          <button
            onClick={() => setFilter("earned")}
            className={cn(
              "px-4 py-2 rounded-full text-sm font-medium transition-colors",
              filter === "earned"
                ? "bg-primary/10 text-primary border border-primary/20"
                : "bg-secondary text-secondary-foreground hover:bg-secondary/80 border border-transparent"
            )}
          >
            Earned
          </button>
          <button
            onClick={() => setFilter("spent")}
            className={cn(
              "px-4 py-2 rounded-full text-sm font-medium transition-colors",
              filter === "spent"
                ? "bg-primary/10 text-primary border border-primary/20"
                : "bg-secondary text-secondary-foreground hover:bg-secondary/80 border border-transparent"
            )}
          >
            Spent
          </button>
        </div>

        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Transactions
          </h3>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-8 rounded-2xl border border-border/50 bg-card text-muted-foreground">
              <p className="font-medium text-foreground">No transactions yet</p>
              <p className="text-sm mt-1">
                {filter === "all"
                  ? "Earn credits by teaching; spend them when you learn or use AI."
                  : filter === "earned"
                    ? "No earned transactions yet."
                    : "No spent transactions yet."}
              </p>
            </div>
          ) : (
            filtered.map((item, i) => {
              const isEarned = item.type === "earned";
              const isAI = item.description?.toLowerCase().includes("ai");
              const amount = Number(item.amount);
              return (
                <div
                  key={item.id}
                  className="flex items-center gap-4 p-4 rounded-2xl bg-card border border-border/50 animate-fade-in"
                  style={{ animationDelay: `${0.15 + i * 0.05}s` }}
                >
                  <div
                    className={cn(
                      "h-10 w-10 rounded-xl flex items-center justify-center shrink-0",
                      isEarned ? "bg-success/10" : "bg-destructive/10"
                    )}
                  >
                    {isAI ? (
                      <Sparkles className="h-5 w-5 text-primary" />
                    ) : isEarned ? (
                      <ArrowDownLeft className="h-5 w-5 text-success" />
                    ) : (
                      <ArrowUpRight className="h-5 w-5 text-destructive" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-foreground">{item.description ?? (isEarned ? "Earned" : "Spent")}</h4>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {format(new Date(item.created_at), "MMM d, h:mm a")}
                    </p>
                  </div>
                  <div
                    className={cn(
                      "text-lg font-bold",
                      isEarned ? "text-success" : "text-foreground"
                    )}
                  >
                    {amount > 0 ? "+" : ""}
                    {amount}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </AppLayout>
  );
};

export default History;
