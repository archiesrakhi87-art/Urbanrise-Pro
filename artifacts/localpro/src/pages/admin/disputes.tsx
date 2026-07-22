import { useState } from "react";
import { useListAdminDisputes, useUpdateDispute, getListAdminDisputesQueryKey } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, AlertCircle, Clock, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { format, differenceInHours } from "date-fns";

export default function AdminDisputes() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<string>("open");

  const { data: disputes, isLoading } = useListAdminDisputes({ status: filter === "all" ? undefined : filter });
  const updateMut = useUpdateDispute();

  const [notes, setNotes] = useState<{ [id: number]: string }>({});

  const handleUpdate = (id: number, status: string) => {
    updateMut.mutate({
      id,
      data: { status, resolutionNotes: notes[id] }
    }, {
      onSuccess: () => {
        toast({ title: `Dispute marked as ${status}` });
        queryClient.invalidateQueries({ queryKey: getListAdminDisputesQueryKey() });
      },
      onError: () => toast({ title: "Failed to update", variant: "destructive" })
    });
  };

  const getSlaBadge = (deadline: string) => {
    const hoursLeft = differenceInHours(new Date(deadline), new Date());
    if (hoursLeft < 0) return <Badge variant="destructive">SLA Breached</Badge>;
    if (hoursLeft < 12) return <Badge className="bg-orange-500 hover:bg-orange-600">SLA &lt;12h</Badge>;
    return <Badge className="bg-green-500 hover:bg-green-600">SLA OK</Badge>;
  };

  return (
    <div className="space-y-6">
      <div className="flex gap-2">
        {["open", "investigating", "resolved", "all"].map(s => (
          <Button 
            key={s}
            variant={filter === s ? "default" : "outline"} 
            onClick={() => setFilter(s)}
            className="capitalize"
          >
            {s}
          </Button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
      ) : disputes?.length === 0 ? (
        <Card>
          <CardContent className="py-20 text-center text-muted-foreground">
            No disputes found.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {disputes?.map(dispute => (
            <Card key={dispute.id} className={dispute.status === "resolved" ? "opacity-70" : ""}>
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="text-lg font-bold">Booking #{dispute.bookingId}</h3>
                      {dispute.status !== "resolved" && getSlaBadge(dispute.slaDeadline)}
                      <Badge variant="outline" className="uppercase text-[10px]">{dispute.status}</Badge>
                    </div>
                    <div className="text-sm text-muted-foreground">Raised by: {dispute.raisedByName} (ID: {dispute.raisedBy})</div>
                  </div>
                  <div className="text-right text-sm">
                    <div className="text-muted-foreground">Deadline:</div>
                    <div className="font-mono">{format(new Date(dispute.slaDeadline), "MMM d, h:mm a")}</div>
                  </div>
                </div>

                <div className="bg-destructive/5 border border-destructive/20 rounded-md p-4 mb-4">
                  <div className="font-bold text-destructive flex items-center gap-2 mb-2">
                    <AlertCircle className="w-4 h-4" /> {dispute.issueType?.replace(/_/g, " ")}
                  </div>
                  <p className="text-sm">{dispute.description}</p>
                </div>

                {dispute.status !== "resolved" && (
                  <div className="flex gap-4 items-end">
                    <div className="flex-1 space-y-2">
                      <label className="text-xs font-semibold uppercase text-muted-foreground">Resolution Notes</label>
                      <input 
                        type="text" 
                        placeholder="Action taken..." 
                        className="w-full px-3 py-2 text-sm border border-input rounded-md bg-background"
                        value={notes[dispute.id] || dispute.resolutionNotes || ""}
                        onChange={e => setNotes(prev => ({ ...prev, [dispute.id]: e.target.value }))}
                      />
                    </div>
                    <div className="flex gap-2">
                      {dispute.status === "open" && (
                        <Button variant="outline" onClick={() => handleUpdate(dispute.id, "investigating")}>
                          <Clock className="w-4 h-4 mr-2" /> Investigate
                        </Button>
                      )}
                      <Button onClick={() => handleUpdate(dispute.id, "resolved")}>
                        <CheckCircle2 className="w-4 h-4 mr-2" /> Resolve
                      </Button>
                    </div>
                  </div>
                )}
                
                {dispute.status === "resolved" && dispute.resolutionNotes && (
                  <div className="text-sm bg-muted p-3 rounded-md border border-border">
                    <span className="font-semibold">Resolution: </span>
                    {dispute.resolutionNotes}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
