import { useRoute, useLocation, Link } from "wouter";
import { useGetProvider, useListReviewsForProvider, getGetProviderQueryKey, getListReviewsForProviderQueryKey } from "@workspace/api-client-react";
import { useLanguage } from "@/components/language-provider";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, Star, MapPin, CalendarCheck, ArrowLeft, MessageSquareQuote } from "lucide-react";
import { format } from "date-fns";

export default function ProviderProfile() {
  const [match, params] = useRoute("/providers/:id");
  const [, setLocation] = useLocation();
  const { t } = useLanguage();

  const id = params?.id ? parseInt(params.id, 10) : 0;

  const { data: provider, isLoading } = useGetProvider(id, {
    query: { queryKey: getGetProviderQueryKey(id), enabled: !!id }
  });

  const { data: reviews } = useListReviewsForProvider(id, {
    query: { queryKey: getListReviewsForProviderQueryKey(id), enabled: !!id }
  });

  if (isLoading) {
    return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  if (!provider) {
    return <div className="p-4 text-center">Provider not found</div>;
  }

  return (
    <div className="relative pb-24">
      {/* Header Image Area */}
      <div className="h-48 bg-secondary relative">
        {provider.photoUrl ? (
          <img src={provider.photoUrl} alt={provider.name} className="w-full h-full object-cover opacity-80" />
        ) : (
          <div className="w-full h-full bg-primary/10 flex items-center justify-center">
            <span className="text-4xl text-primary/30">👤</span>
          </div>
        )}
        <div className="absolute top-4 left-4">
          <Button variant="secondary" size="icon" className="rounded-full shadow-md" onClick={() => setLocation("/")}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Info Card overlaps header */}
      <div className="px-4 -mt-12 relative z-10">
        <div className="bg-card rounded-xl shadow-lg border border-border p-5">
          <div className="flex justify-between items-start mb-2">
            <h1 className="font-serif text-2xl font-bold text-foreground">{provider.name}</h1>
            <div className="flex items-center gap-1 bg-primary/10 px-2 py-1 rounded-md text-primary font-bold">
              <Star className="w-4 h-4 fill-primary text-primary" />
              {provider.ratingAvg.toFixed(1)}
            </div>
          </div>
          
          <div className="flex items-center gap-2 text-muted-foreground text-sm mb-4">
            <MapPin className="w-4 h-4" />
            {provider.city || "Local"}
          </div>

          <div className="flex flex-wrap gap-2 mb-4">
            {provider.serviceCategories.map(cat => (
              <Badge key={cat} variant="secondary">{cat}</Badge>
            ))}
          </div>

          <div className="flex gap-4 border-t border-border pt-4 text-center">
            <div className="flex-1 border-r border-border">
              <div className="text-xl font-bold text-foreground">{provider.totalJobs}</div>
              <div className="text-xs text-muted-foreground">{t("provider.profile.jobs")}</div>
            </div>
            <div className="flex-1">
              <div className="text-xl font-bold text-foreground">{reviews?.length || 0}</div>
              <div className="text-xs text-muted-foreground">{t("provider.profile.reviews")}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Details */}
      <div className="p-4 space-y-6">
        {provider.bio && (
          <section>
            <h2 className="font-serif text-lg font-bold mb-2">{t("provider.profile.bio")}</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {provider.bio}
            </p>
          </section>
        )}

        {provider.languagesSpoken && provider.languagesSpoken.length > 0 && (
          <section>
            <h2 className="font-serif text-lg font-bold mb-2">{t("provider.profile.languages")}</h2>
            <div className="flex flex-wrap gap-2">
              {provider.languagesSpoken.map(lang => (
                <span key={lang} className="text-xs font-medium px-2 py-1 bg-muted rounded">
                  {lang}
                </span>
              ))}
            </div>
          </section>
        )}

        {provider.priceList && (
          <section>
            <h2 className="font-serif text-lg font-bold mb-2">{t("provider.profile.priceList")}</h2>
            <div className="bg-muted/50 rounded-lg p-3 text-sm text-foreground whitespace-pre-line font-mono">
              {provider.priceList}
            </div>
          </section>
        )}

        <section>
          <h2 className="font-serif text-lg font-bold mb-4">{t("provider.profile.reviews")}</h2>
          {reviews?.length === 0 ? (
            <p className="text-sm text-muted-foreground">No reviews yet.</p>
          ) : (
            <div className="space-y-4">
              {reviews?.map(review => (
                <div key={review.id} className="bg-card border border-border rounded-lg p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="font-medium text-sm">{review.residentName || "Anonymous"}</div>
                    <div className="flex items-center gap-0.5">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} className={`w-3 h-3 ${i < review.rating ? "fill-primary text-primary" : "text-muted"}`} />
                      ))}
                    </div>
                  </div>
                  {review.comment && (
                    <p className="text-sm text-muted-foreground mb-2 flex items-start gap-2">
                      <MessageSquareQuote className="w-4 h-4 shrink-0 text-primary/40" />
                      {review.comment}
                    </p>
                  )}
                  <div className="text-xs text-muted-foreground/60 text-right">
                    {format(new Date(review.createdAt), "MMM d, yyyy")}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Floating Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border p-4 z-50">
        <div className="max-w-md mx-auto">
          <Button 
            className="w-full h-12 text-lg font-bold" 
            onClick={() => setLocation(`/book/${provider.id}`)}
          >
            <CalendarCheck className="w-5 h-5 mr-2" />
            {t("provider.profile.bookNow")}
          </Button>
        </div>
      </div>
    </div>
  );
}
