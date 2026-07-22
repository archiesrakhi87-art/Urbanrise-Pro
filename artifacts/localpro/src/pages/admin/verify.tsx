import { useState } from "react";
import { useListPendingProviders, useListFlaggedProviders, useVerifyProvider, getListPendingProvidersQueryKey } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Check, X, ShieldAlert } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

export default function AdminVerify() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<"pending" | "flagged">("pending");

  const { data: pending, isLoading: isPendingLoading } = useListPendingProviders();
  const { data: flagged, isLoading: isFlaggedLoading } = useListFlaggedProviders();
  const verifyMut = useVerifyProvider();

  const [notes, setNotes] = useState<{ [id: number]: string }>({});

  const isLoading = isPendingLoading || isFlaggedLoading;
  const list = tab === "pending" ? pending : flagged;

  const handleVerify = (id: number, action: "approve" | "reject") => {
    verifyMut.mutate({
      id,
      data: { action, notes: notes[id] || "" }
    }, {
      onSuccess: () => {
        toast({ title: `Provider ${action}d successfully` });
        queryClient.invalidateQueries({ queryKey: getListPendingProvidersQueryKey() });
        // Set notes back to empty
        setNotes(prev => ({ ...prev, [id]: "" }));
      },
      onError: () => toast({ title: "Failed to update", variant: "destructive" })
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex gap-4">
        <Button 
          variant={tab === "pending" ? "default" : "outline"} 
          onClick={() => setTab("pending")}
        >
          Pending KYC ({pending?.length || 0})
        </Button>
        <Button 
          variant={tab === "flagged" ? "default" : "outline"} 
          onClick={() => setTab("flagged")}
          className={tab === "flagged" ? "bg-destructive text-destructive-foreground hover:bg-destructive/90" : ""}
        >
          <ShieldAlert className="w-4 h-4 mr-2" />
          Flagged ({flagged?.length || 0})
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
      ) : list?.length === 0 ? (
        <Card>
          <CardContent className="py-20 text-center text-muted-foreground">
            No providers found in this queue.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {list?.map(provider => (
            <Card key={provider.id}>
              <CardContent className="p-6">
                <div className="flex gap-6">
                  {/* Avatar / Doc */}
                  <div className="w-32 shrink-0 space-y-2">
                    <img src={provider.photoUrl || ""} alt="Face" className="w-full aspect-square object-cover rounded-lg bg-muted" />
                    {provider.idDocUrl && (
                      <a href={provider.idDocUrl} target="_blank" rel="noreferrer" className="text-xs text-primary underline block text-center">
                        View ID Doc
                      </a>
                    )}
                  </div>
                  
                  {/* Info */}
                  <div className="flex-1">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="text-xl font-serif font-bold">{provider.name}</h3>
                      <div className="text-sm text-muted-foreground">ID: {provider.id}</div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                      <div><span className="text-muted-foreground">Phone:</span> {provider.phone}</div>
                      <div><span className="text-muted-foreground">City:</span> {provider.city}</div>
                      <div><span className="text-muted-foreground">Services:</span> {provider.serviceCategories?.join(", ")}</div>
                      <div><span className="text-muted-foreground">Step:</span> {provider.onboardingStep}/7</div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-semibold uppercase text-muted-foreground">Verification Notes (for rejection)</label>
                      <input 
                        type="text" 
                        placeholder="e.g. ID photo is blurry" 
                        className="w-full px-3 py-2 text-sm border border-input rounded-md bg-background"
                        value={notes[provider.id] || ""}
                        onChange={e => setNotes(prev => ({ ...prev, [provider.id]: e.target.value }))}
                      />
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-2 justify-center border-l border-border pl-6 w-40">
                    <Button 
                      className="w-full bg-green-600 hover:bg-green-700" 
                      onClick={() => handleVerify(provider.id, "approve")}
                      disabled={verifyMut.isPending}
                    >
                      <Check className="w-4 h-4 mr-2" /> Approve
                    </Button>
                    <Button 
                      variant="outline" 
                      className="w-full text-destructive border-destructive hover:bg-destructive/10"
                      onClick={() => handleVerify(provider.id, "reject")}
                      disabled={verifyMut.isPending || !notes[provider.id]}
                    >
                      <X className="w-4 h-4 mr-2" /> Reject
                    </Button>
                    {!notes[provider.id] && (
                      <p className="text-[10px] text-muted-foreground text-center">Note required to reject</p>
                    )}
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
