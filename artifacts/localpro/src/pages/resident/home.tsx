import { useState } from "react";
import { Link } from "wouter";
import { useListServiceCategories, useListProviders } from "@workspace/api-client-react";
import { useLanguage } from "@/components/language-provider";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Loader2, Star, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

export default function ResidentHome() {
  const { t } = useLanguage();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const { data: categories, isLoading: isLoadingCategories } = useListServiceCategories();
  
  const { data: providers, isLoading: isLoadingProviders } = useListProviders({
    serviceCategory: selectedCategory
  });

  return (
    <div className="flex flex-col gap-6 p-4">
      {/* Categories Horizontal Scroll */}
      <div className="-mx-4 px-4 pb-2">
        <h2 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wider">
          {t("resident.home.categories")}
        </h2>
        {isLoadingCategories ? (
          <div className="flex gap-3 overflow-hidden">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-10 w-24 bg-muted animate-pulse rounded-full shrink-0" />
            ))}
          </div>
        ) : (
          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
            <button
              onClick={() => setSelectedCategory(null)}
              className={cn(
                "px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors",
                selectedCategory === null
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
              )}
            >
              All
            </button>
            {categories?.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.name)}
                className={cn(
                  "px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors",
                  selectedCategory === cat.name
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                )}
              >
                {cat.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Providers Grid */}
      <div>
        <h2 className="text-sm font-semibold text-muted-foreground mb-4 uppercase tracking-wider">
          {t("resident.home.topRated")}
        </h2>
        
        {isLoadingProviders ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : providers?.length === 0 ? (
          <div className="text-center py-12 bg-card rounded-xl border border-border">
            <p className="text-muted-foreground">{t("resident.home.noProviders")}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {providers?.map((provider) => (
              <Link key={provider.id} href={`/providers/${provider.id}`}>
                <Card className="border-border hover:border-primary/50 transition-colors cursor-pointer overflow-hidden">
                  <CardContent className="p-0">
                    <div className="p-4 flex gap-4">
                      <Avatar
                        src={provider.photoUrl}
                        fallback={provider.name.charAt(0)}
                        className="h-16 w-16 shadow-sm border border-border"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="font-serif font-bold text-lg text-foreground truncate">
                            {provider.name}
                          </h3>
                          <div className="flex items-center gap-1 bg-secondary px-2 py-0.5 rounded text-sm font-medium">
                            <Star className="w-3 h-3 fill-primary text-primary" />
                            {provider.ratingAvg.toFixed(1)}
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground truncate mb-2">
                          {provider.serviceCategories.join(", ")}
                        </p>
                        
                        <div className="flex flex-wrap gap-2 items-center">
                          <span className="text-xs font-medium text-foreground bg-muted px-2 py-1 rounded-md">
                            {provider.totalJobs} jobs
                          </span>
                          {provider.badgeTags.map((badge) => (
                            <Badge key={badge} variant="outline" className="bg-primary/5 border-primary/20 text-primary text-[10px] py-0">
                              <ShieldCheck className="w-3 h-3 mr-1" />
                              {badge.replace(/_/g, " ")}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
