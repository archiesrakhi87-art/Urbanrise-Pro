import { useState } from "react";
import { Link } from "wouter";
import { useListBookings, useGetMe } from "@workspace/api-client-react";
import { useLanguage } from "@/components/language-provider";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Calendar, MapPin, CheckCircle2, Clock, AlertTriangle, XCircle } from "lucide-react";
import { format } from "date-fns";

export default function BookingsList() {
  const { t } = useLanguage();
  const [tab, setTab] = useState<"active" | "past">("active");

  const { data: user } = useGetMe();
  const { data: bookings, isLoading } = useListBookings({ role: "resident" });

  // "requested" is the initial status set by the API on booking creation.
  const activeBookings = bookings?.filter(b => ["requested", "pending", "confirmed", "disputed"].includes(b.status)) || [];
  const pastBookings = bookings?.filter(b => ["completed", "cancelled"].includes(b.status)) || [];

  const displayBookings = tab === "active" ? activeBookings : pastBookings;

  const getStatusConfig = (status: string) => {
    switch (status) {
      case "requested": return { color: "bg-orange-100 text-orange-800 border-orange-200", icon: Clock, label: "Requested" };
      case "pending": return { color: "bg-yellow-100 text-yellow-800 border-yellow-200", icon: Clock, label: t("bookings.status.pending") };
      case "confirmed": return { color: "bg-blue-100 text-blue-800 border-blue-200", icon: Calendar, label: t("bookings.status.confirmed") };
      case "completed": return { color: "bg-green-100 text-green-800 border-green-200", icon: CheckCircle2, label: t("bookings.status.completed") };
      case "cancelled": return { color: "bg-gray-100 text-gray-800 border-gray-200", icon: XCircle, label: t("bookings.status.cancelled") };
      case "disputed": return { color: "bg-red-100 text-red-800 border-red-200", icon: AlertTriangle, label: t("bookings.status.disputed") };
      default: return { color: "bg-gray-100 text-gray-800", icon: Clock, label: status };
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-2 border-b border-border bg-card sticky top-0 z-10">
        <div className="flex bg-muted p-1 rounded-lg">
          <button
            onClick={() => setTab("active")}
            className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${tab === "active" ? "bg-background shadow text-foreground" : "text-muted-foreground hover:text-foreground"}`}
          >
            {t("bookings.active")}
          </button>
          <button
            onClick={() => setTab("past")}
            className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${tab === "past" ? "bg-background shadow text-foreground" : "text-muted-foreground hover:text-foreground"}`}
          >
            {t("bookings.past")}
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
            {displayBookings.map(booking => {
              const status = getStatusConfig(booking.status);
              const StatusIcon = status.icon;
              return (
                <Link key={booking.id} href={`/bookings/${booking.id}`}>
                  <Card className="border-border hover:border-primary/50 transition-colors cursor-pointer">
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h3 className="font-bold text-foreground">{booking.serviceName || "Service"}</h3>
                          <p className="text-sm text-muted-foreground">{booking.providerName}</p>
                        </div>
                        <Badge variant="outline" className={`${status.color} border py-0.5 flex items-center gap-1`}>
                          <StatusIcon className="w-3 h-3" />
                          {status.label}
                        </Badge>
                      </div>
                      
                      <div className="space-y-2 text-sm text-muted-foreground">
                        {booking.scheduledTime && (
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 shrink-0 text-primary/60" />
                            {format(new Date(booking.scheduledTime), "PPP 'at' p")}
                          </div>
                        )}
                        <div className="flex items-start gap-2">
                          <MapPin className="w-4 h-4 shrink-0 text-primary/60 mt-0.5" />
                          <span className="line-clamp-1">{booking.address}</span>
                        </div>
                      </div>

                      <div className="mt-4 pt-3 border-t border-border flex justify-between items-center">
                        <span className="text-xs text-muted-foreground">
                          Booked on {format(new Date(booking.createdAt), "MMM d")}
                        </span>
                        <span className="font-mono font-bold text-foreground">₹{booking.price}</span>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
