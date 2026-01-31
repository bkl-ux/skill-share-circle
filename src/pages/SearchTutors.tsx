import { useState, useEffect } from "react";
import { Search, Filter, Sparkles, ArrowRight } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import AppLayout from "@/components/layout/AppLayout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import TutorCard from "@/components/ui/TutorCard";
import SkillTag from "@/components/ui/SkillTag";
import CreditBadge from "@/components/ui/CreditBadge";
import { useTutors } from "@/hooks/useTutors";

const filters = ["Top Rated", "Available Now", "New"];

const SearchTutors = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(() => searchParams.get("q") ?? "");
  const [activeFilter, setActiveFilter] = useState("Top Rated");
  const { tutors, isLoading } = useTutors(searchQuery);

  useEffect(() => {
    setSearchQuery(searchParams.get("q") ?? "");
  }, [searchParams]);

  const filteredTutors = tutors;

  return (
    <AppLayout title="Search Tutors">
      <div className="px-4 py-6 space-y-5">
        <div className="relative animate-fade-in">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            placeholder="Search skills or tutors..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-12 pr-12 h-12 rounded-2xl bg-secondary border-border/50 focus:border-primary"
          />
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-xl"
          >
            <Filter className="h-4 w-4 text-muted-foreground" />
          </Button>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 animate-fade-in" style={{ animationDelay: "0.1s" }}>
          {filters.map((filter) => (
            <SkillTag
              key={filter}
              label={filter}
              variant={activeFilter === filter ? "primary" : "outline"}
              size="md"
              onClick={() => setActiveFilter(filter)}
            />
          ))}
        </div>

        <p className="text-sm text-muted-foreground animate-fade-in" style={{ animationDelay: "0.15s" }}>
          Showing <span className="text-foreground font-medium">{filteredTutors.length}</span> tutors
          {searchQuery && ` for "${searchQuery}"`}
        </p>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        ) : (
          <>
            <div className="space-y-4">
              {filteredTutors.map((tutor, i) => (
                <TutorCard
                  key={tutor.id}
                  name={tutor.name}
                  avatar={tutor.avatar_url ?? undefined}
                  title={tutor.bio ?? "Skill share tutor"}
                  skills={tutor.teachSkills}
                  rating={4.5}
                  sessions={0}
                  credits={tutor.credits}
                  isAvailable={tutor.availability_status !== "busy"}
                  onClick={() => navigate(`/tutor/${tutor.id}`)}
                  className="animate-fade-in"
                  style={{ animationDelay: `${0.2 + i * 0.1}s` } as React.CSSProperties}
                />
              ))}
            </div>

            {filteredTutors.length === 0 && searchQuery && (
              <div className="text-center py-8 animate-fade-in space-y-4">
                <p className="text-muted-foreground">No tutors found for &quot;{searchQuery}&quot;</p>
                <p className="text-sm text-muted-foreground">Learn with AI instead — same tutor experience.</p>
                <Button
                  className="rounded-full"
                  onClick={() => navigate(`/ai?topic=${encodeURIComponent(searchQuery)}`)}
                >
                  <Sparkles className="h-4 w-4 mr-2" />
                  Start AI Session for &quot;{searchQuery}&quot;
                </Button>
              </div>
            )}

            <div className="mt-6 p-4 rounded-2xl bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20 animate-fade-in" style={{ animationDelay: "0.6s" }}>
              <div className="flex items-center gap-3">
                <div className="flex-shrink-0 h-10 w-10 rounded-xl bg-primary/20 flex items-center justify-center">
                  <Sparkles className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">Can&apos;t wait? Learn with AI</p>
                  <p className="text-xs text-muted-foreground">Get instant feedback on your questions</p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <CreditBadge credits={0.5} size="sm" />
                  <Button
                    size="sm"
                    className="rounded-full text-xs h-7 px-3"
                    onClick={() => navigate(searchQuery ? `/ai?topic=${encodeURIComponent(searchQuery)}` : "/ai")}
                  >
                    Start <ArrowRight className="h-3 w-3 ml-1" />
                  </Button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </AppLayout>
  );
};

export default SearchTutors;
