import { ArrowLeft, Star, BookOpen, Award, MessageSquare } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import SkillTag from "@/components/ui/SkillTag";
import CreditBadge from "@/components/ui/CreditBadge";
import { useTutorProfile } from "@/hooks/useTutors";
import { useAuth } from "@/contexts/AuthContext";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const TutorProfile = () => {
  const navigate = useNavigate();
  const { name: profileId } = useParams<{ name: string }>();
  const { profile: tutor, isLoading } = useTutorProfile(profileId);
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const createConversation = useMutation({
    mutationFn: async () => {
      if (!user?.id || !tutor?.user_id || tutor.user_id === user.id) {
        throw new Error("Invalid request");
      }
      const { data: existing } = await supabase
        .from("conversation_participants")
        .select("conversation_id")
        .eq("user_id", user.id);
      const convIds = (existing ?? []).map((r) => r.conversation_id);
      if (convIds.length > 0) {
        const { data: match } = await supabase
          .from("conversation_participants")
          .select("conversation_id")
          .eq("user_id", tutor.user_id)
          .in("conversation_id", convIds)
          .maybeSingle();
        if (match) return match.conversation_id;
      }
      const { data: newConv, error: convErr } = await supabase
        .from("conversations")
        .insert({})
        .select("id")
        .single();
      if (convErr || !newConv) throw convErr ?? new Error("Failed to create conversation");
      await supabase.from("conversation_participants").insert([
        { conversation_id: newConv.id, user_id: user.id },
        { conversation_id: newConv.id, user_id: tutor.user_id },
      ]);
      await supabase.from("messages").insert({
        conversation_id: newConv.id,
        sender_id: user.id,
        content: `Hi! I'd like to learn from you on Skill Share Circle.`,
      });
      return newConv.id;
    },
    onSuccess: (conversationId) => {
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
      toast.success("Request sent! Opening messages.");
      navigate(`/messages?conversation=${conversationId}`);
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed to send request"),
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!tutor) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4">
        <p className="text-muted-foreground">Tutor not found.</p>
        <Button variant="outline" className="mt-4 rounded-xl" onClick={() => navigate("/search")}>
          Back to Search
        </Button>
      </div>
    );
  }

  const isOwnProfile = user?.id === tutor.user_id;

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-40 glass border-b border-border/50">
        <div className="flex items-center gap-3 px-4 py-3">
          <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <span className="font-medium">Profile</span>
        </div>
      </div>

      <div className="px-4 py-6 pb-32 space-y-6">
        <div className="text-center animate-fade-in">
          <Avatar className="h-24 w-24 mx-auto ring-4 ring-primary/20">
            <AvatarImage src={tutor.avatar_url ?? undefined} alt={tutor.name} />
            <AvatarFallback className="bg-primary/10 text-primary text-2xl font-bold">
              {tutor.name.split(" ").map((n) => n[0]).join("")}
            </AvatarFallback>
          </Avatar>
          <h1 className="text-2xl font-bold text-foreground mt-4">{tutor.name}</h1>
          <p className="text-sm text-secondary-foreground mt-2">{tutor.bio ?? "Skill share tutor"}</p>
          <div className="flex items-center justify-center gap-6 mt-4">
            <div className="text-center">
              <div className="flex items-center justify-center gap-1">
                <Star className="h-5 w-5 text-warning fill-warning" />
                <span className="text-lg font-bold">—</span>
              </div>
              <p className="text-xs text-muted-foreground">Rating</p>
            </div>
            <div className="h-8 w-px bg-border" />
            <div className="text-center">
              <span className="text-lg font-bold">0+</span>
              <p className="text-xs text-muted-foreground">Sessions</p>
            </div>
            <div className="h-8 w-px bg-border" />
            <div className="text-center">
              <CreditBadge credits={tutor.credits} size="sm" />
              <p className="text-xs text-muted-foreground mt-1">Credits</p>
            </div>
          </div>
        </div>

        {tutor.teachSkills?.length > 0 && (
          <section className="animate-fade-in" style={{ animationDelay: "0.2s" }}>
            <div className="flex items-center gap-2 mb-3">
              <BookOpen className="h-4 w-4 text-primary" />
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">I Teach</h2>
            </div>
            <div className="flex flex-wrap gap-2">
              {tutor.teachSkills.map((skill) => (
                <SkillTag key={skill} label={skill} variant="primary" />
              ))}
            </div>
          </section>
        )}

        {tutor.learnSkills?.length ? (
          <section className="animate-fade-in" style={{ animationDelay: "0.3s" }}>
            <div className="flex items-center gap-2 mb-3">
              <Award className="h-4 w-4 text-muted-foreground" />
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">I Want to Learn</h2>
            </div>
            <div className="flex flex-wrap gap-2">
              {tutor.learnSkills.map((skill) => (
                <SkillTag key={skill} label={skill} variant="outline" />
              ))}
            </div>
          </section>
        ) : null}
      </div>

      {!isOwnProfile && (
        <div className="fixed bottom-0 left-0 right-0 p-4 glass border-t border-border/50">
          <div className="flex gap-3">
            <Button
              variant="outline"
              size="icon"
              className="h-12 w-12 rounded-2xl shrink-0"
              onClick={() => {
                createConversation.mutate();
              }}
              disabled={createConversation.isPending}
            >
              <MessageSquare className="h-5 w-5" />
            </Button>
            <Button
              className="flex-1 h-12 rounded-2xl bg-primary hover:bg-primary/90 font-semibold"
              onClick={() => createConversation.mutate()}
              disabled={createConversation.isPending}
            >
              Send Request
              <CreditBadge credits={1} size="sm" className="ml-2 bg-primary-foreground/10 border-primary-foreground/20 text-primary-foreground" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
