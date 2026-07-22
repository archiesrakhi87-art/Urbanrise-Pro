import { useGetHallOfFame } from "@workspace/api-client-react";
import { useLanguage } from "@/components/language-provider";
import { Shell } from "@/components/shell";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, Trophy, Star, TrendingUp } from "lucide-react";

export default function HallOfFame() {
  const { t } = useLanguage();
  const { data, isLoading } = useGetHallOfFame();

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
                {data?.topProviders.map((provider, i) => (
                  <Card key={provider.id} className="border-border shadow-sm overflow-hidden relative">
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
                      <div className="flex-1">
                        <h3 className="font-bold text-foreground">{provider.name}</h3>
                        <p className="text-sm text-muted-foreground capitalize">{provider.metric}</p>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-lg font-mono text-primary">{provider.score.toFixed(1)}</div>
                        <div className="text-[10px] uppercase text-muted-foreground font-bold tracking-wider">Score</div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
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
                      <div className="flex-1">
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
