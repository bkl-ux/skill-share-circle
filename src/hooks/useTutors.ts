import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type TutorProfile = {
  id: string;
  user_id?: string;
  name: string;
  email: string;
  bio: string | null;
  avatar_url: string | null;
  credits: number;
  availability_status: string | null;
  teachSkills: string[];
  learnSkills?: string[];
};

export function useTutors(searchQuery?: string) {
  const { data: tutors = [], isLoading } = useQuery({
    queryKey: ["tutors", searchQuery],
    queryFn: async (): Promise<TutorProfile[]> => {
      const { data: profiles, error: pErr } = await supabase
        .from("profiles")
        .select("id, user_id, name, email, bio, avatar_url, credits, availability_status")
        .order("name");
      if (pErr) throw pErr;
      if (!profiles?.length) return [];

      const { data: teachRows } = await supabase
        .from("user_teach_skills")
        .select("user_id, skill_id");
      const { data: skills } = await supabase.from("skills").select("id, name");
      const skillMap = new Map((skills ?? []).map((s) => [s.id, s.name]));
      const teachByUser = new Map<string, string[]>();
      for (const row of teachRows ?? []) {
        const name = skillMap.get(row.skill_id);
        if (!name) continue;
        const arr = teachByUser.get(row.user_id) ?? [];
        arr.push(name);
        teachByUser.set(row.user_id, arr);
      }

      const result: TutorProfile[] = (profiles ?? [])
        .filter((p) => (teachByUser.get(p.user_id)?.length ?? 0) > 0)
        .map((p) => ({
          id: p.id,
          user_id: p.user_id,
          name: p.name,
          email: p.email,
          bio: p.bio,
          avatar_url: p.avatar_url,
          credits: Number(p.credits),
          availability_status: p.availability_status,
          teachSkills: teachByUser.get(p.user_id) ?? [],
        }));

      if (searchQuery?.trim()) {
        const q = searchQuery.trim().toLowerCase();
        return result.filter(
          (t) =>
            t.name.toLowerCase().includes(q) ||
            t.teachSkills.some((s) => s.toLowerCase().includes(q))
        );
      }
      return result;
    },
  });

  return { tutors, isLoading };
}

export function useTutorProfile(profileId: string | undefined) {
  const { data: profile, isLoading } = useQuery({
    queryKey: ["tutorProfile", profileId],
    queryFn: async (): Promise<TutorProfile | null> => {
      if (!profileId) return null;
      const { data: p, error } = await supabase
        .from("profiles")
        .select("id, user_id, name, email, bio, avatar_url, credits, availability_status")
        .eq("id", profileId)
        .maybeSingle();
      if (error) throw error;
      if (!p) return null;
      const { data: teachRows } = await supabase
        .from("user_teach_skills")
        .select("skill_id")
        .eq("user_id", p.user_id);
      const { data: skills } = await supabase
        .from("skills")
        .select("id, name")
        .in("id", (teachRows ?? []).map((r) => r.skill_id));
      const teachSkills = (skills ?? []).map((s) => s.name);
      const { data: learnRows } = await supabase
        .from("user_learn_skills")
        .select("skill_id")
        .eq("user_id", p.user_id);
      const { data: learnSkills } = await supabase
        .from("skills")
        .select("name")
        .in("id", (learnRows ?? []).map((r) => r.skill_id));
      return {
        id: p.id,
        user_id: p.user_id,
        name: p.name,
        email: p.email,
        bio: p.bio,
        avatar_url: p.avatar_url,
        credits: Number(p.credits),
        availability_status: p.availability_status,
        teachSkills,
        learnSkills: (learnSkills ?? []).map((s) => s.name),
      };
    },
    enabled: !!profileId,
  });
  return { profile, isLoading };
}
