import { useState, useRef, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, Send, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import CreditBadge from "@/components/ui/CreditBadge";
import { sendAIMessage, type ChatMessage } from "@/lib/ai";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/hooks/useProfile";
import { supabase } from "@/integrations/supabase/client";

const AI_CREDITS_COST = 0.5;

const AISession = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const topic = searchParams.get("topic") ?? undefined;
  const { user } = useAuth();
  const { profile, refetch: refetchProfile } = useProfile();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const credits = profile?.credits ?? 0;
  const canAfford = credits >= AI_CREDITS_COST;
  const hasApiKey = !!import.meta.env.VITE_OPENAI_API_KEY;

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const deductCredits = async () => {
    if (!user?.id) return;
    const newCredits = Math.max(0, (profile?.credits ?? 0) - AI_CREDITS_COST);
    await supabase.from("profiles").update({ credits: newCredits }).eq("user_id", user.id);
    await supabase.from("credit_transactions").insert({
      user_id: user.id,
      amount: -AI_CREDITS_COST,
      type: "spent",
      description: "AI Learning Session",
      reference_type: "ai_session",
    });
    refetchProfile();
  };

  const handleSend = async () => {
    const text = input.trim();
    if (!text || loading || !canAfford) return;
    setInput("");
    const userMsg: ChatMessage = { role: "user", content: text };
    setMessages((m) => [...m, userMsg]);
    setLoading(true);
    setError(null);
    try {
      const newMessages: ChatMessage[] = [...messages, userMsg];
      const reply = await sendAIMessage(newMessages, topic);
      setMessages((m) => [...m, { role: "assistant", content: reply }]);
      await deductCredits();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="sticky top-0 z-40 glass border-b border-border/50">
        <div className="flex items-center justify-between px-4 py-3">
          <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <span className="font-semibold">AI Tutor</span>
            {topic && (
              <span className="text-xs text-muted-foreground bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                {topic}
              </span>
            )}
          </div>
          <CreditBadge credits={credits} size="sm" />
        </div>
      </header>

      <div className="flex-1 flex flex-col px-4 pb-24">
        {messages.length === 0 && (
          <div className="py-8 text-center text-muted-foreground">
            <p className="font-medium text-foreground">Ask me anything</p>
            <p className="text-sm mt-1">
              {topic ? `We can focus on "${topic}" or any other topic.` : "I'm here to help you learn."}
            </p>
            {!hasApiKey && (
              <p className="text-xs mt-2 text-primary">Demo mode — add VITE_OPENAI_API_KEY for full AI.</p>
            )}
          </div>
        )}

        <ScrollArea className="flex-1 py-4">
          <div className="space-y-4">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-2.5 ${
                    msg.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-card border border-border/50"
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="rounded-2xl px-4 py-2.5 bg-card border border-border/50">
                  <span className="text-sm text-muted-foreground">Thinking...</span>
                </div>
              </div>
            )}
            <div ref={scrollRef} />
          </div>
        </ScrollArea>

        {error && (
          <p className="text-sm text-destructive mb-2">{error}</p>
        )}
        {!canAfford && messages.length > 0 && (
          <p className="text-sm text-muted-foreground mb-2">
            Not enough credits. Top up to continue (0.5 credits per message).
          </p>
        )}

        <div className="fixed bottom-0 left-0 right-0 p-4 glass border-t border-border/50">
          <div className="flex gap-2">
            <Input
              placeholder="Ask a question..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
              className="rounded-xl flex-1"
              disabled={loading || !canAfford}
            />
            <Button
              size="icon"
              className="rounded-xl shrink-0"
              onClick={handleSend}
              disabled={loading || !input.trim() || !canAfford}
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-2 text-center">
            {AI_CREDITS_COST} credit per message
          </p>
        </div>
      </div>
    </div>
  );
};

export default AISession;
