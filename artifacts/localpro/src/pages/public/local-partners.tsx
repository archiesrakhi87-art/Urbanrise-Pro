import { useState } from "react";
import { useListLocalPartners } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Loader2, Building2, MapPin, Store, Users, Landmark } from "lucide-react";

const TYPE_ICONS: Record<string, React.ElementType> = {
  shop: Store,
  ngo: Users,
  municipal: Landmark,
};

const TYPE_LABELS: Record<string, string> = {
  shop: "Shop",
  ngo: "NGO",
  municipal: "Municipal",
};

const TYPE_COLORS: Record<string, string> = {
  shop: "bg-blue-50 text-blue-700 border-blue-200",
  ngo: "bg-green-50 text-green-700 border-green-200",
  municipal: "bg-orange-50 text-orange-700 border-orange-200",
};

export default function LocalPartnersPage() {
  const [regionFilter, setRegionFilter] = useState("");

  const { data: partners, isLoading } = useListLocalPartners(
    regionFilter ? { region: regionFilter } : undefined
  );

  // Group by region
  const grouped = (partners ?? []).reduce<Record<string, typeof partners>>((acc, p) => {
    const region = p!.region ?? "Other";
    if (!acc[region]) acc[region] = [];
    acc[region]!.push(p);
    return acc;
  }, {});

  const regions = Object.keys(grouped).sort();

  return (
    <div className="flex flex-col gap-6 p-4">
      {/* Header */}
      <div>
        <h1 className="font-serif font-bold text-2xl text-foreground mb-1">Local Partners</h1>
        <p className="text-sm text-muted-foreground">
          Trusted shops, NGOs, and municipal offices near you
        </p>
      </div>

      {/* Region search */}
      <div className="relative">
        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search by region or area…"
          value={regionFilter}
          onChange={(e) => setRegionFilter(e.target.value)}
          className="pl-9 h-10"
        />
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : regions.length === 0 ? (
        <div className="text-center py-16 bg-card rounded-xl border border-border">
          <Building2 className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">
            {regionFilter ? `No partners found in "${regionFilter}"` : "No local partners listed yet"}
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-8">
          {regions.map((region) => (
            <div key={region}>
              {/* Region header */}
              <div className="flex items-center gap-2 mb-3">
                <MapPin className="w-4 h-4 text-primary shrink-0" />
                <h2 className="font-semibold text-base text-foreground">{region}</h2>
                <div className="h-px flex-1 bg-border" />
                <span className="text-xs text-muted-foreground">
                  {grouped[region]?.length}{" "}
                  {grouped[region]?.length === 1 ? "partner" : "partners"}
                </span>
              </div>

              <div className="grid grid-cols-1 gap-3">
                {grouped[region]?.map((partner) => {
                  if (!partner) return null;
                  const Icon = TYPE_ICONS[partner.type] ?? Building2;
                  const typeColor =
                    TYPE_COLORS[partner.type] ??
                    "bg-muted text-muted-foreground border-muted";

                  return (
                    <Card key={partner.id} className="border-border">
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <div className="bg-primary/10 rounded-lg p-2.5 shrink-0">
                            <Icon className="w-5 h-5 text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2 mb-1">
                              <h3 className="font-semibold text-sm text-foreground leading-snug">
                                {partner.name}
                              </h3>
                              <Badge
                                variant="outline"
                                className={`text-[10px] shrink-0 ${typeColor}`}
                              >
                                {TYPE_LABELS[partner.type] ?? partner.type}
                              </Badge>
                            </div>

                            {partner.contactInfo && (
                              <p className="text-xs text-muted-foreground mt-1">
                                {partner.contactInfo}
                              </p>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
