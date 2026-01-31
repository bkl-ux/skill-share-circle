import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { Search, ArrowLeft, Send } from "lucide-react";
import { useNavigate } from "react-router-dom";
import AppLayout from "@/components/layout/AppLayout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

type ConversationWithOther = {
  id: string;
  otherProfile: { name: string; avatar_url: string | null };
  lastMessage: { content: string; created_at: string } | null;
  unread: number;
};

function useConversations() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["conversations", user?.id],
    queryFn: async (): Promise<ConversationWithOther[]> => {
      if (!user?.id) return [];
      const { data: myConvs } = await supabase
        .from("conversation_participants")
        .select("conversation_id")
        .eq("user_id", user.id);
      if (!myConvs?.length) return [];
      const convIds = myConvs.map((c) => c.conversation_id);
      const { data: allParts } = await supabase
        .from("conversation_participants")
        .select("conversation_id, user_id")
        .in("conversation_id", convIds);
      const otherByConv = new Map<string, string>();
      for (const p of allParts ?? []) {
        if (p.user_id !== user.id) otherByConv.set(p.conversation_id, p.user_id);
      }
      const { data: profiles } = await supabase.from("profiles").select("user_id, name, avatar_url");
      const profileByUserId = new Map((profiles ?? []).map((p) => [p.user_id, { name: p.name, avatar_url: p.avatar_url }]));
      const { data: messages } = await supabase
        .from("messages")
        .select("conversation_id, content, created_at, sender_id")
        .in("conversation_id", convIds)
        .order("created_at", { ascending: false });
      const lastByConv = new Map<string, { content: string; created_at: string }>();
      for (const m of messages ?? []) {
        if (!lastByConv.has(m.conversation_id)) lastByConv.set(m.conversation_id, { content: m.content, created_at: m.created_at });
      }
      return convIds.map((id) => {
        const otherUserId = otherByConv.get(id);
        const otherProfile = otherUserId ? profileByUserId.get(otherUserId) : null;
        const lastMessage = lastByConv.get(id) ?? null;
        return {
          id,
          otherProfile: otherProfile ?? { name: "Unknown", avatar_url: null },
          lastMessage,
          unread: 0,
        };
      });
    },
    enabled: !!user?.id,
  });
}

function useMessages(conversationId: string | null) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["messages", conversationId],
    queryFn: async () => {
      if (!conversationId) return [];
      const { data, error } = await supabase
        .from("messages")
        .select("id, sender_id, content, created_at")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!conversationId && !!user?.id,
  });
}

const scheduleMessage = {
  type: "schedule",
  name: "Pro Tip",
  message: "Agree on a specific topic before booking to make sessions more productive!",
};

const Messages = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const conversationId = searchParams.get("conversation");
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [messageInput, setMessageInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  const { data: conversations = [], isLoading: convLoading } = useConversations();
  const { data: messages = [], isLoading: msgLoading } = useMessages(conversationId);

  const activeConv = conversations.find((c) => c.id === conversationId);
  const otherName = activeConv?.otherProfile?.name ?? "User";

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMutation = useMutation({
    mutationFn: async (content: string) => {
      if (!conversationId || !user?.id) throw new Error("Invalid");
      const { error } = await supabase.from("messages").insert({
        conversation_id: conversationId,
        sender_id: user.id,
        content: content.trim(),
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["messages", conversationId] });
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    },
  });

  const handleSend = () => {
    const text = messageInput.trim();
    if (!text || sendMutation.isPending) return;
    sendMutation.mutate(text);
    setMessageInput("");
  };

  if (conversationId) {
    return (
      <AppLayout title={otherName}>
        <div className="flex flex-col h-[calc(100vh-120px)]">
          <div className="flex items-center gap-2 px-4 py-2 border-b border-border/50 bg-background">
            <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl shrink-0" onClick={() => setSearchParams({})}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <span className="font-medium truncate">{otherName}</span>
          </div>
          <ScrollArea className="flex-1 px-4 py-4">
            {msgLoading ? (
              <div className="flex justify-center py-8">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              </div>
            ) : (
              <div className="space-y-3 pb-4">
                {messages.map((m) => {
                  const isMe = m.sender_id === user?.id;
                  return (
                    <div key={m.id} className={cn("flex", isMe ? "justify-end" : "justify-start")}>
                      <div
                        className={cn(
                          "max-w-[85%] rounded-2xl px-4 py-2",
                          isMe ? "bg-primary text-primary-foreground" : "bg-card border border-border/50"
                        )}
                      >
                        <p className="text-sm whitespace-pre-wrap">{m.content}</p>
                        <p className={cn("text-xs mt-1", isMe ? "text-primary-foreground/80" : "text-muted-foreground")}>
                          {format(new Date(m.created_at), "h:mm a")}
                        </p>
                      </div>
                    </div>
                  );
                })}
                <div ref={scrollRef} />
              </div>
            )}
          </ScrollArea>
          <div className="p-4 border-t border-border/50 bg-background">
            <div className="flex gap-2">
              <Input
                placeholder="Type a message..."
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
                className="rounded-xl flex-1"
                disabled={sendMutation.isPending}
              />
              <Button size="icon" className="rounded-xl shrink-0" onClick={handleSend} disabled={!messageInput.trim() || sendMutation.isPending}>
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Messages">
      <div className="px-4 py-6 space-y-4">
        <div className="relative animate-fade-in">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            placeholder="Search messages..."
            className="pl-12 h-11 rounded-2xl bg-secondary border-border/50 focus:border-primary"
          />
        </div>

        <div className="p-4 rounded-2xl bg-primary/5 border border-primary/10 animate-fade-in" style={{ animationDelay: "0.1s" }}>
          <div className="flex items-start gap-3">
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <span className="text-primary text-lg">💡</span>
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">{scheduleMessage.name}</p>
              <p className="text-sm text-muted-foreground mt-0.5">{scheduleMessage.message}</p>
            </div>
          </div>
        </div>

        <div className="space-y-1">
          {convLoading ? (
            <div className="flex justify-center py-8">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
          ) : conversations.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground rounded-2xl border border-border/50 bg-card">
              <p className="font-medium text-foreground">No conversations yet</p>
              <p className="text-sm mt-1">Send a request from a tutor profile to start chatting.</p>
            </div>
          ) : (
            conversations.map((convo) => (
              <button
                key={convo.id}
                type="button"
                onClick={() => setSearchParams({ conversation: convo.id })}
                className={cn(
                  "w-full flex items-center gap-3 p-3 rounded-2xl text-left",
                  "transition-all duration-200 hover:bg-secondary",
                  "animate-fade-in"
                )}
              >
                <Avatar className="h-12 w-12 shrink-0">
                  <AvatarImage src={convo.otherProfile?.avatar_url ?? undefined} alt={convo.otherProfile?.name} />
                  <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                    {convo.otherProfile?.name?.split(" ").map((n) => n[0]).join("").slice(0, 2) ?? "?"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold text-foreground truncate">{convo.otherProfile?.name}</h4>
                    {convo.lastMessage && (
                      <span className="text-xs text-muted-foreground shrink-0">
                        {format(new Date(convo.lastMessage.created_at), "MMM d")}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground truncate mt-0.5">
                    {convo.lastMessage?.content ?? "No messages yet"}
                  </p>
                </div>
                {convo.unread > 0 && (
                  <div className="h-5 min-w-[20px] rounded-full bg-primary flex items-center justify-center px-1.5 shrink-0">
                    <span className="text-xs font-semibold text-primary-foreground">{convo.unread}</span>
                  </div>
                )}
              </button>
            ))
          )}
        </div>
      </div>
    </AppLayout>
  );
};

export default Messages;
