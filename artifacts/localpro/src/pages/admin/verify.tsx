import { useState } from "react";
import {
  useListPendingProviders,
  useListFlaggedProviders,
  useVerifyProvider,
  useAssignBadge,
  getListPendingProvidersQueryKey,
} from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Check, X, ShieldAlert, Award, ExternalLink } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

const BADGE_OPTIONS = [
  { value: "locally_endorsed", label: "Locally Endorsed" },
  { value: "top_rated", label: "Top Rated" },
  { value: "verified_expert", label: "Verified Expert" },
];

export default function AdminVerify() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<"pending" | "flagged">("pending");

  const { data: pending, isLoading: isPendingLoading } = useListPendingProviders();
  const { data: flagged, isLoading: isFlaggedLoading } = useListFlaggedProviders();
  const verifyMut = useVerifyProvider();
  const assignBadgeMut = useAssignBadge();

  const [notes, setNotes] = useState<Record<number, string>>({});
  const [badgeSelections, setBadgeSelections] = useState<Record<number, string>>({});

  const isLoading = isPendingLoading || isFlaggedLoading;
  const list = tab === "pending" ? pending : flagged;

  const handleVerify = (id: number, action: "approve" | "reject") => {
    verifyMut.mutate(
      { id, data: { action, notes: notes[id] ?? "" } },
      {
        onSuccess: () => {
          toast({ title: `Provider ${action === "approve" ? "approved" : "rejected"} successfully` });
          queryClient.invalidateQueries({ queryKey: getListPendingProvidersQueryKey() });
          setNotes((prev) => ({ ...prev, [id]: "" }));
        },
        onError: () => toast({ title: "Failed to update", variant: "destructive" }),
      }
    );
  };

  const handleAssignBadge = (id: number) => {
    const badge = badgeSelections[id];
    if (!badge) return;
    assignBadgeMut.mutate(
      { id, data: { badge } },
      {
        onSuccess: () => {
          toast({ title: `Badge "${badge}" assigned` });
          setBadgeSelections((prev) => ({ ...prev, [id]: "" }));
          queryClient.invalidateQueries();
        },
        onError: () => toast({ title: "Badge assignment failed", variant: "destructive" }),
      }
    );
  };

  return (
    <div className="space-y-6">
      {/* Tab switcher */}
      <div className="flex gap-4">
        <Button
          variant={tab === "pending" ? "default" : "outline"}
          onClick={() => setTab("pending")}
        >
          Pending KYC ({pending?.length ?? 0})
        </Button>
        <Button
          variant={tab === "flagged" ? "default" : "outline"}
          className={tab === "flagged" ? "bg-destructive text-destructive-foreground hover:bg-destructive/90" : ""}
          onClick={() => setTab("flagged")}
        >
          <ShieldAlert className="w-4 h-4 mr-2" />
          Flagged ({flagged?.length ?? 0})
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : list?.length === 0 ? (
        <Card>
          <CardContent className="py-20 text-center text-muted-foreground">
            No providers found in this queue.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {list?.map((provider) => (
            <Card key={provider.id} className="overflow-hidden">
              <CardContent className="p-0">
                {/* Header row */}
                <div className="flex items-center justify-between p-4 border-b border-border bg-muted/30">
                  <div>
                    <h3 className="text-xl font-serif font-bold">{provider.name ?? "—"}</h3>
                    <p className="text-sm text-muted-foreground">
                      ID: {provider.id} · KYC: <span className="font-mono">{provider.kycStatus}</span>
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {provider.badgeTags?.map((b) => (
                      <span
                        key={b}
                        className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-primary/10 text-primary"
                      >
                        {b.replace(/_/g, " ")}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Body */}
                <div className="p-4 flex gap-6 flex-wrap">
                  {/* Documents */}
                  <div className="flex gap-3 shrink-0">
                    {provider.photoUrl ? (
                      <div className="space-y-1 text-center">
                        <img
                          src={provider.photoUrl}
                          alt="Selfie"
                          className="w-24 h-24 object-cover rounded-lg border border-border bg-muted"
                        />
                        <p className="text-[10px] text-muted-foreground">Selfie</p>
                      </div>
                    ) : (
                      <div className="w-24 h-24 rounded-lg border border-dashed border-border bg-muted flex items-center justify-center text-xs text-muted-foreground">
                        No photo
                      </div>
                    )}
                    {provider.idDocUrl && (
                      <div className="space-y-1 text-center">
                        <a
                          href={provider.idDocUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="w-24 h-24 rounded-lg border border-border bg-muted flex flex-col items-center justify-center gap-1 text-primary hover:bg-primary/5 transition-colors"
                        >
                          <ExternalLink className="w-6 h-6" />
                          <span className="text-[10px] font-medium">View ID</span>
                        </a>
                        <p className="text-[10px] text-muted-foreground">ID Doc</p>
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-[180px]">
                    <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm mb-4">
                      <div><span className="text-muted-foreground">Phone:</span> {provider.phone}</div>
                      <div><span className="text-muted-foreground">City:</span> {provider.city ?? "—"}</div>
                      <div className="col-span-2">
                        <span className="text-muted-foreground">Services:</span>{" "}
                        {provider.serviceCategories?.join(", ") || "—"}
                      </div>
                      <div><span className="text-muted-foreground">Step:</span> {provider.onboardingStep}/7</div>
                    </div>

                    {provider.bio && (
                      <p className="text-xs text-muted-foreground italic border-l-2 border-primary/30 pl-2 mb-4">
                        "{provider.bio}"
                      </p>
                    )}

                    {/* Verification notes */}
                    <div className="space-y-1">
                      <label className="text-xs font-semibold uppercase text-muted-foreground">
                        Verification Notes (required to reject)
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. ID photo is blurry"
                        className="w-full px-3 py-2 text-sm border border-input rounded-md bg-background"
                        value={notes[provider.id] ?? ""}
                        onChange={(e) =>
                          setNotes((prev) => ({ ...prev, [provider.id]: e.target.value }))
                        }
                      />
                    </div>
                  </div>

                  {/* Action column */}
                  <div className="flex flex-col gap-2 justify-start min-w-[140px] border-l border-border pl-6">
                    <Button
                      className="w-full bg-green-600 hover:bg-green-700"
                      size="sm"
                      onClick={() => handleVerify(provider.id, "approve")}
                      disabled={verifyMut.isPending}
                    >
                      <Check className="w-4 h-4 mr-1" /> Approve
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full text-destructive border-destructive hover:bg-destructive/10"
                      onClick={() => handleVerify(provider.id, "reject")}
                      disabled={verifyMut.isPending || !notes[provider.id]}
                    >
                      <X className="w-4 h-4 mr-1" /> Reject
                    </Button>
                    {!notes[provider.id] && (
                      <p className="text-[10px] text-muted-foreground text-center">Note required to reject</p>
                    )}

                    <div className="border-t border-border pt-2 mt-1 space-y-1">
                      <p className="text-[10px] font-semibold uppercase text-muted-foreground flex items-center gap-1">
                        <Award className="w-3 h-3" /> Assign Badge
                      </p>
                      <select
                        className="w-full text-xs border border-input rounded px-2 py-1 bg-background"
                        value={badgeSelections[provider.id] ?? ""}
                        onChange={(e) =>
                          setBadgeSelections((prev) => ({ ...prev, [provider.id]: e.target.value }))
                        }
                      >
                        <option value="">Select…</option>
                        {BADGE_OPTIONS.map((b) => (
                          <option key={b.value} value={b.value}>
                            {b.label}
                          </option>
                        ))}
                      </select>
                      <Button
                        size="sm"
                        variant="outline"
                        className="w-full text-xs"
                        onClick={() => handleAssignBadge(provider.id)}
                        disabled={!badgeSelections[provider.id] || assignBadgeMut.isPending}
                      >
                        <Award className="w-3 h-3 mr-1" /> Assign
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
