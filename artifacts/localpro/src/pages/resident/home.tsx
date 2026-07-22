import { useState } from "react";
import { Link } from "wouter";
import { useListServiceCategories, useListProviders } from "@workspace/api-client-react";
import { useLanguage } from "@/components/language-provider";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Star, ShieldCheck, SlidersHorizontal, X } from "lucide-react";
import { cn } from "@/lib/utils";

type Filters = {
  city: string;
  language: string;
  badge: string;
  minPrice: string;
  maxPrice: string;
};

const BADGE_OPTIONS = [
  { value: "", label: "Any badge" },
  { value: "new_to_app", label: "New to App" },
  { value: "locally_endorsed", label: "Locally Endorsed" },
  { value: "top_rated", label: "Top Rated" },
];

const LANGUAGE_OPTIONS = [
  { value: "", label: "Any language" },
  { value: "Tamil", label: "Tamil" },
  { value: "English", label: "English" },
  { value: "Telugu", label: "Telugu" },
  { value: "Kannada", label: "Kannada" },
];

export default function ResidentHome() {
  const { t } = useLanguage();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<Filters>({
    city: "",
    language: "",
    badge: "",
    minPrice: "",
    maxPrice: "",
  });

  const { data: categories, isLoading: isLoadingCategories } = useListServiceCategories();

  const activeFilterCount = [
    filters.city,
    filters.language,
    filters.badge,
    filters.minPrice,
    filters.maxPrice,
  ].filter(Boolean).length;

  const queryParams = {
    serviceCategory: selectedCategory ?? undefined,
    city: filters.city || undefined,
    language: filters.language || undefined,
    badge: filters.badge || undefined,
    minPrice: filters.minPrice ? parseInt(filters.minPrice) : undefined,
    maxPrice: filters.maxPrice ? parseInt(filters.maxPrice) : undefined,
  };

  const { data: providers, isLoading: isLoadingProviders } = useListProviders(queryParams);

  function clearFilters() {
    setFilters({ city: "", language: "", badge: "", minPrice: "", maxPrice: "" });
  }

  return (
    <div className="flex flex-col gap-4 p-4">
      {/* Categories Horizontal Scroll */}
      <div className="-mx-4 px-4">
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

      {/* Filter Bar */}
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowFilters((v) => !v)}
          className={cn(
            "flex items-center gap-2 h-9 text-sm",
            activeFilterCount > 0 && "border-primary text-primary"
          )}
        >
          <SlidersHorizontal className="w-4 h-4" />
          Filters
          {activeFilterCount > 0 && (
            <span className="bg-primary text-primary-foreground rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold">
              {activeFilterCount}
            </span>
          )}
        </Button>
        {activeFilterCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="h-9 text-sm text-muted-foreground"
          >
            <X className="w-3 h-3 mr-1" />
            Clear all
          </Button>
        )}
      </div>

      {/* Expanded Filter Panel */}
      {showFilters && (
        <Card className="border-border bg-card">
          <CardContent className="p-4 grid grid-cols-2 gap-4">
            {/* City */}
            <div className="col-span-2">
              <Label className="text-xs font-medium text-muted-foreground mb-1 block">City</Label>
              <Input
                placeholder="e.g. Coimbatore"
                value={filters.city}
                onChange={(e) => setFilters((f) => ({ ...f, city: e.target.value }))}
                className="h-9 text-sm"
              />
            </div>

            {/* Language */}
            <div>
              <Label className="text-xs font-medium text-muted-foreground mb-1 block">Language</Label>
              <select
                value={filters.language}
                onChange={(e) => setFilters((f) => ({ ...f, language: e.target.value }))}
                className="w-full h-9 text-sm rounded-md border border-input bg-background px-3 focus:outline-none focus:ring-2 focus:ring-ring"
              >
                {LANGUAGE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            {/* Badge */}
            <div>
              <Label className="text-xs font-medium text-muted-foreground mb-1 block">Badge</Label>
              <select
                value={filters.badge}
                onChange={(e) => setFilters((f) => ({ ...f, badge: e.target.value }))}
                className="w-full h-9 text-sm rounded-md border border-input bg-background px-3 focus:outline-none focus:ring-2 focus:ring-ring"
              >
                {BADGE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            {/* Price range */}
            <div>
              <Label className="text-xs font-medium text-muted-foreground mb-1 block">Min price (₹)</Label>
              <Input
                type="number"
                placeholder="0"
                value={filters.minPrice}
                onChange={(e) => setFilters((f) => ({ ...f, minPrice: e.target.value }))}
                className="h-9 text-sm"
                min={0}
              />
            </div>
            <div>
              <Label className="text-xs font-medium text-muted-foreground mb-1 block">Max price (₹)</Label>
              <Input
                type="number"
                placeholder="5000"
                value={filters.maxPrice}
                onChange={(e) => setFilters((f) => ({ ...f, maxPrice: e.target.value }))}
                className="h-9 text-sm"
                min={0}
              />
            </div>

            <div className="col-span-2 flex justify-end">
              <Button size="sm" onClick={() => setShowFilters(false)} className="h-9">
                Apply filters
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

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
            {activeFilterCount > 0 && (
              <Button variant="ghost" size="sm" onClick={clearFilters} className="mt-2">
                Clear filters
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {providers?.map((provider) => (
              <Link key={provider.id} href={`/providers/${provider.id}`}>
                <Card className="border-border hover:border-primary/50 transition-colors cursor-pointer overflow-hidden">
                  <CardContent className="p-0">
                    <div className="p-4 flex gap-4">
                      <Avatar
                        src={provider.photoUrl ?? undefined}
                        fallback={provider.name.charAt(0)}
                        className="h-16 w-16 shadow-sm border border-border shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="font-serif font-bold text-lg text-foreground truncate">
                            {provider.name}
                          </h3>
                          <div className="flex items-center gap-1 bg-secondary px-2 py-0.5 rounded text-sm font-medium shrink-0">
                            <Star className="w-3 h-3 fill-primary text-primary" />
                            {provider.ratingAvg.toFixed(1)}
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground truncate mb-1">
                          {provider.serviceCategories.join(", ")}
                        </p>
                        {provider.city && (
                          <p className="text-xs text-muted-foreground mb-2">{provider.city}</p>
                        )}
                        <div className="flex flex-wrap gap-2 items-center">
                          <span className="text-xs font-medium text-foreground bg-muted px-2 py-1 rounded-md">
                            {provider.totalJobs} jobs
                          </span>
                          {provider.badgeTags.map((badge) => (
                            <Badge
                              key={badge}
                              variant="outline"
                              className="bg-primary/5 border-primary/20 text-primary text-[10px] py-0"
                            >
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
