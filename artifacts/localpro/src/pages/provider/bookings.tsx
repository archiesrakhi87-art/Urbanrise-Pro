import { useState } from "react";
import { Link } from "wouter";
import { useListBookings, useUpdateBookingStatus, getListBookingsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useLanguage } from "@/components/language-provider";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, Calendar, MapPin, CheckCircle2, Clock, XCircle } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";

export default function ProviderBookings() {
  const { t } = useLanguage();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<"pending" | "active" | "past">("pending");

  const { data: bookings, isLoading } = useListBookings({ role: "provider" });
  const updateStatusMut = useUpdateBookingStatus();

  const pendingBookings = bookings?.filter(b => b.status === "pending") || [];
  const activeBookings = bookings?.filter(b => b.status === "confirmed") || [];
  const pastBookings = bookings?.filter(b => ["completed", "cancelled", "disputed"].includes(b.status)) || [];

  let displayBookings = pendingBookings;
  if (tab === "active") displayBookings = activeBookings;
  if (tab === "past") displayBookings = pastBookings;

  const handleUpdateStatus = (id: number, status: string, e: React.MouseEvent) => {
    e.preventDefault(); // Prevent navigating to detail page
    e.stopPropagation();
    
    updateStatusMut.mutate({
      id,
      data: { status }
    }, {
      onSuccess: () => {
        toast({ title: `Booking ${status}!` });
        queryClient.invalidateQueries({ queryKey: getListBookingsQueryKey() });
      },
      onError: () => {
        toast({ title: "Failed to update status", variant: "destructive" });
      }
    });
  };

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-2 border-b border-border bg-card sticky top-0 z-10">
        <div className="flex gap-2 bg-muted p-1 rounded-lg overflow-x-auto no-scrollbar">
          <button
            onClick={() => setTab("pending")}
            className={`flex-1 min-w-[80px] py-1.5 text-xs font-medium rounded-md transition-all ${tab === "pending" ? "bg-background shadow text-foreground" : "text-muted-foreground hover:text-foreground"}`}
          >
            Requests {pendingBookings.length > 0 && `(${pendingBookings.length})`}
          </button>
          <button
            onClick={() => setTab("active")}
            className={`flex-1 min-w-[80px] py-1.5 text-xs font-medium rounded-md transition-all ${tab === "active" ? "bg-background shadow text-foreground" : "text-muted-foreground hover:text-foreground"}`}
          >
            Active {activeBookings.length > 0 && `(${activeBookings.length})`}
          </button>
          <button
            onClick={() => setTab("past")}
            className={`flex-1 min-w-[80px] py-1.5 text-xs font-medium rounded-md transition-all ${tab === "past" ? "bg-background shadow text-foreground" : "text-muted-foreground hover:text-foreground"}`}
          >
            Past
          </button>
        </div>
      </div>

      <div className="p-4 flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
        ) : displayBookings.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <Calendar className="w-8 h-8 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground font-medium">No {tab} bookings found.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {displayBookings.map(booking => (
              <Link key={booking.id} href={`/bookings/${booking.id}`}>
                <Card className="border-border hover:border-primary/50 transition-colors cursor-pointer relative overflow-hidden">
                  {booking.status === "pending" && <div className="absolute top-0 left-0 w-1 h-full bg-yellow-400" />}
                  {booking.status === "confirmed" && <div className="absolute top-0 left-0 w-1 h-full bg-blue-400" />}
                  
                  <CardContent className="p-4 pl-5">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-bold text-foreground">{booking.residentName || "Client"}</h3>
                        <p className="text-sm text-primary font-medium">{booking.serviceName}</p>
                      </div>
                      <div className="text-right">
                        <div className="font-mono font-bold text-lg">₹{booking.price}</div>
                        <Badge variant="outline" className="uppercase text-[10px] py-0">{booking.status}</Badge>
                      </div>
                    </div>
                    
                    <div className="space-y-2 text-sm text-muted-foreground bg-muted/30 p-2 rounded border border-border">
                      {booking.scheduledTime && (
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 shrink-0 text-primary" />
                          <span className="font-medium text-foreground">{format(new Date(booking.scheduledTime), "MMM d, h:mm a")}</span>
                        </div>
                      )}
                      <div className="flex items-start gap-2">
                        <MapPin className="w-4 h-4 shrink-0 text-primary mt-0.5" />
                        <span className="line-clamp-2">{booking.address}</span>
                      </div>
                    </div>

                    {booking.status === "pending" && (
                      <div className="mt-4 flex gap-2">
                        <Button 
                          variant="outline" 
                          className="flex-1 border-destructive text-destructive hover:bg-destructive/10"
                          onClick={(e) => handleUpdateStatus(booking.id, "cancelled", e)}
                          disabled={updateStatusMut.isPending}
                        >
                          Decline
                        </Button>
                        <Button 
                          className="flex-1 bg-green-600 hover:bg-green-700"
                          onClick={(e) => handleUpdateStatus(booking.id, "confirmed", e)}
                          disabled={updateStatusMut.isPending}
                        >
                          Accept
                        </Button>
                      </div>
                    )}

                    {booking.status === "confirmed" && (
                      <div className="mt-4">
                        <Button 
                          className="w-full"
                          onClick={(e) => handleUpdateStatus(booking.id, "completed", e)}
                          disabled={updateStatusMut.isPending}
                        >
                          <CheckCircle2 className="w-4 h-4 mr-2" />
                          Mark as Completed
                        </Button>
                      </div>
                    )}
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
