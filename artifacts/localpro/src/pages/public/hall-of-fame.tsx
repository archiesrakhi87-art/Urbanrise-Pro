import { useEffect, useRef, useState } from "react";
import { useSearch } from "wouter";
import { useGetHallOfFame } from "@workspace/api-client-react";
import { useLanguage } from "@/components/language-provider";
import { useToast } from "@/hooks/use-toast";
import { Shell } from "@/components/shell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Trophy, Star, TrendingUp, Share2 } from "lucide-react";

function useHighlightedProvider() {
  const search = useSearch();
  const params = new URLSearchParams(search);
  return params.get("provider");
}

function ShareButton({ provider }: { provider: { id: number; name: string } }) {
  const { toast } = useToast();
  const [sharing, setSharing] = useState(false);

  const buildUrl = () => {
    // Use Vite's injected BASE_URL so the path is always correct regardless of
    // which page or sub-path this component is rendered on.
    const appBase = import.meta.env.BASE_URL.replace(/\/$/, "");
    return `${window.location.origin}${appBase}/hall-of-fame?provider=${provider.id}`;
  };

  const handleShare = async () => {
    if (sharing) return;
    setSharing(true);
    const url = buildUrl();
    const text = `Check out ${provider.name} on the LocalPro Hall of Fame!`;

    if (navigator.share) {
      try {
        await navigator.share({ title: `${provider.name} — Hall of Fame`, text, url });
      } catch (err) {
        // user cancelled — no toast needed
      }
    } else {
      try {
        await navigator.clipboard.writeText(url);
        toast({ title: "Link copied!", description: "Share it with your network." });
      } catch {
        toast({ title: "Could not copy link", variant: "destructive" });
      }
    }
    setSharing(false);
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      className="h-8 w-8 text-muted-foreground hover:text-primary shrink-0"
      onClick={handleShare}
      aria-label={`Share ${provider.name}'s profile`}
    >
      <Share2 className="w-4 h-4" />
    </Button>
  );
}

export default function HallOfFame() {
  const { t } = useLanguage();
  const { data, isLoading } = useGetHallOfFame();
  const highlightedId = useHighlightedProvider();
  const cardRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const [justHighlighted, setJustHighlighted] = useState<string | null>(null);

  // Scroll to and briefly highlight the deep-linked provider once data loads
  useEffect(() => {
    if (!highlightedId || isLoading) return;
    const el = cardRefs.current[highlightedId];
    if (!el) return;
    // Small delay so the page has painted
    const t = setTimeout(() => {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      setJustHighlighted(highlightedId);
      // Remove highlight ring after 3 s
      const clear = setTimeout(() => setJustHighlighted(null), 3000);
      return () => clearTimeout(clear);
    }, 200);
    return () => clearTimeout(t);
  }, [highlightedId, isLoading]);

  return (
    <Shell title={t("public.fame.title")} showBottomNav={false}>
      <div className="p-4 space-y-8">
        <div className="text-center py-6">
          <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-white shadow-lg">
            <Trophy className="w-8 h-8 text-yellow-600" />
          </div>
          <h1 className="font-serif text-3xl font-bold text-foreground mb-2">Hall of Fame</h1>
          <p className="text-muted-foreground">{t("public.fame.subtitle")}</p>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-10"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
        ) : (
          <div className="space-y-8">
            <section>
              <h2 className="font-serif text-xl font-bold mb-4 flex items-center gap-2">
                <Star className="w-5 h-5 text-primary" /> Top Providers
              </h2>
              <div className="space-y-3">
                {data?.topProviders.map((provider, i) => {
                  const idStr = String(provider.id);
                  const isHighlighted = justHighlighted === idStr;
                  return (
                    <div
                      key={provider.id}
                      ref={(el) => { cardRefs.current[idStr] = el; }}
                    >
                      <Card
                        className={[
                          "border-border shadow-sm overflow-hidden relative transition-all duration-300",
                          isHighlighted ? "ring-2 ring-primary ring-offset-2 shadow-md" : "",
                        ].join(" ")}
                      >
                        <div className="absolute top-0 left-0 w-1 h-full bg-primary" />
                        <CardContent className="p-4 pl-5 flex items-center gap-4">
                          <div className="text-2xl font-serif font-bold text-muted-foreground w-6 text-center">
                            #{i + 1}
                          </div>
                          {provider.photoUrl ? (
                            <img src={provider.photoUrl} alt="" className="w-12 h-12 rounded-full object-cover border border-border" />
                          ) : (
                            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center font-bold text-primary">
                              {provider.name.charAt(0)}
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <h3 className="font-bold text-foreground">{provider.name}</h3>
                            <p className="text-sm text-muted-foreground capitalize">{provider.metric}</p>
                          </div>
                          <div className="text-right">
                            <div className="font-bold text-lg font-mono text-primary">{provider.score.toFixed(1)}</div>
                            <div className="text-[10px] uppercase text-muted-foreground font-bold tracking-wider">Score</div>
                          </div>
                          <ShareButton provider={provider} />
                        </CardContent>
                      </Card>
                    </div>
                  );
                })}
              </div>
            </section>

            <section>
              <h2 className="font-serif text-xl font-bold mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-accent" /> Active Residents
              </h2>
              <div className="space-y-3">
                {data?.topResidents.map((resident, i) => (
                  <Card key={resident.id} className="border-border shadow-sm overflow-hidden relative">
                    <div className="absolute top-0 left-0 w-1 h-full bg-accent" />
                    <CardContent className="p-4 pl-5 flex items-center gap-4">
                      <div className="text-2xl font-serif font-bold text-muted-foreground w-6 text-center">
                        #{i + 1}
                      </div>
                      <div className="w-12 h-12 bg-accent/10 rounded-full flex items-center justify-center font-bold text-accent">
                        {resident.name.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-foreground">{resident.name}</h3>
                        <p className="text-sm text-muted-foreground capitalize">{resident.metric}</p>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-lg font-mono text-accent">{resident.score}</div>
                        <div className="text-[10px] uppercase text-muted-foreground font-bold tracking-wider">Bookings</div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>
          </div>
        )}
      </div>
    </Shell>
  );
}
