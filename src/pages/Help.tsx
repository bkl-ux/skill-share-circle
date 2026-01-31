import { MessageCircle, Mail, Book } from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";

const Help = () => {
  return (
    <AppLayout title="Help & Support">
      <div className="px-4 py-6 space-y-6">
        <div className="rounded-2xl border border-border/50 bg-card p-6 space-y-4">
          <h2 className="font-semibold text-foreground">How Skill Share Circle works</h2>
          <ul className="text-sm text-muted-foreground space-y-2 list-disc list-inside">
            <li>Add skills you can teach and skills you want to learn in your profile.</li>
            <li>Search for tutors or topics. If no tutor is found, use the AI tutor.</li>
            <li>Send a request to a tutor to start a conversation.</li>
            <li>Earn credits by teaching; spend credits when learning (or using AI).</li>
            <li>Top up credits via UPI when you need more.</li>
          </ul>
        </div>
        <div className="rounded-2xl border border-border/50 bg-card p-6 space-y-4">
          <h2 className="font-semibold text-foreground">Credits</h2>
          <p className="text-sm text-muted-foreground">
            New users get 3 free credits. Teaching a session earns you credits; learning or using the AI tutor costs credits. You can top up anytime from the dashboard or profile.
          </p>
        </div>
        <div className="rounded-2xl border border-border/50 bg-card p-6 space-y-4">
          <h2 className="font-semibold text-foreground">Contact</h2>
          <p className="text-sm text-muted-foreground">
            For hackathon support or feedback, reach out to the team.
          </p>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" className="rounded-xl" asChild>
              <a href="mailto:support@skillsharecircle.app">
                <Mail className="h-4 w-4 mr-2" />
                Email support
              </a>
            </Button>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default Help;
