import { useRoute, useLocation } from "wouter";
import { useGetUpskillingModule, useCompleteUpskillingModule, getGetMyUpskillingProgressQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, CheckCircle2, ArrowLeft, BookOpen } from "lucide-react";

function extractYouTubeId(url: string): string | null {
  if (!url) return null;
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

export default function UpskillingDetail() {
  const [, params] = useRoute("/provider/upskilling/:id");
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const moduleId = params?.id ? parseInt(params.id, 10) : 0;
  const { data: mod, isLoading } = useGetUpskillingModule(moduleId);
  const completeMut = useCompleteUpskillingModule();

  const handleComplete = () => {
    completeMut.mutate({ id: moduleId }, {
      onSuccess: () => {
        toast({ title: "Module Completed!", description: "Keep up the great work." });
        queryClient.invalidateQueries({ queryKey: getGetMyUpskillingProgressQueryKey() });
        queryClient.invalidateQueries();
        navigate("/provider/upskilling");
      },
      onError: () => toast({ title: "Error", description: "Could not mark module complete.", variant: "destructive" }),
    });
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!mod) {
    return (
      <div className="p-4 text-center text-muted-foreground py-20">
        Module not found.
      </div>
    );
  }

  const youtubeId = mod.contentUrl ? extractYouTubeId(mod.contentUrl) : null;

  return (
    <div className="p-4 space-y-6 pb-24">
      {/* Back button */}
      <button
        onClick={() => navigate("/provider/upskilling")}
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Modules
      </button>

      {/* Header */}
      <div>
        <Badge variant="outline" className="mb-2">{mod.category}</Badge>
        <h1 className="font-serif font-bold text-2xl text-foreground leading-tight">{mod.title}</h1>
      </div>

      {/* Completion criteria / description */}
      {mod.completionCriteria && (
        <div className="bg-muted/50 border border-border rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2 text-sm font-semibold text-foreground">
            <BookOpen className="w-4 h-4 text-primary" />
            What you'll learn
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">{mod.completionCriteria}</p>
        </div>
      )}

      {/* YouTube embed */}
      {youtubeId && (
        <div className="rounded-xl overflow-hidden border border-border aspect-video w-full">
          <iframe
            className="w-full h-full"
            src={`https://www.youtube.com/embed/${youtubeId}`}
            title={mod.title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      )}

      {/* Non-YouTube content URL */}
      {mod.contentUrl && !youtubeId && (
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-sm text-muted-foreground mb-2">External Resource</p>
          <a
            href={mod.contentUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary text-sm font-medium underline underline-offset-4 break-all"
          >
            {mod.contentUrl}
          </a>
        </div>
      )}

      {/* No content placeholder */}
      {!mod.contentUrl && !mod.completionCriteria && (
        <div className="bg-muted/50 border border-border rounded-xl p-6 text-center">
          <p className="text-sm text-muted-foreground">No content available yet for this module.</p>
        </div>
      )}

      {/* Action */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-background border-t border-border">
        {mod.completed ? (
          <div className="flex items-center justify-center gap-2 text-primary font-medium py-2">
            <CheckCircle2 className="w-5 h-5" />
            Module Completed
          </div>
        ) : (
          <Button
            className="w-full"
            size="lg"
            onClick={handleComplete}
            disabled={completeMut.isPending}
          >
            {completeMut.isPending ? (
              <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Marking complete…</>
            ) : (
              "Mark as Complete"
            )}
          </Button>
        )}
      </div>
    </div>
  );
}
