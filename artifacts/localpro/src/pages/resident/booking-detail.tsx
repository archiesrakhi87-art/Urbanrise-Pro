import { useState } from "react";
import { useRoute, useLocation } from "wouter";
import { useGetBooking, useCreateReview, useGetMe, getListBookingsQueryKey, getGetBookingQueryKey, getGetMeQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useLanguage } from "@/components/language-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, ArrowLeft, Star, MapPin, Calendar, CheckCircle2, Clock, AlertTriangle } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";

export default function BookingDetail() {
  const [match, params] = useRoute("/bookings/:id");
  const [, setLocation] = useLocation();
  const { t } = useLanguage();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const id = params?.id ? parseInt(params.id, 10) : 0;

  const { data: user } = useGetMe({ query: { queryKey: getGetMeQueryKey() } });
  const { data: booking, isLoading } = useGetBooking(id, { query: { queryKey: getGetBookingQueryKey(id), enabled: !!id } });

  const createReviewMut = useCreateReview();

  const [isReviewing, setIsReviewing] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");

  if (isLoading) {
    return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }
  if (!booking) return <div className="p-4">Not found</div>;

  const handleReviewSubmit = () => {
    createReviewMut.mutate({
      data: {
        bookingId: id,
        rating,
        comment
      }
    }, {
      onSuccess: () => {
        toast({ title: "Review submitted!" });
        setIsReviewing(false);
        queryClient.invalidateQueries({ queryKey: getGetBookingQueryKey(id) });
        queryClient.invalidateQueries({ queryKey: getListBookingsQueryKey() });
      },
      onError: () => {
        toast({ title: "Failed to submit review", variant: "destructive" });
      }
    });
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case "pending": return { color: "text-yellow-600", icon: Clock, label: t("bookings.status.pending") };
      case "confirmed": return { color: "text-blue-600", icon: Calendar, label: t("bookings.status.confirmed") };
      case "completed": return { color: "text-green-600", icon: CheckCircle2, label: t("bookings.status.completed") };
      case "disputed": return { color: "text-red-600", icon: AlertTriangle, label: t("bookings.status.disputed") };
      default: return { color: "text-gray-600", icon: Clock, label: status };
    }
  };

  const status = getStatusConfig(booking.status);
  const StatusIcon = status.icon;

  const isResident = user?.role === "resident";
  const showReviewButton = isResident && booking.status === "completed" && !booking.hasReview;

  return (
    <div className="flex flex-col h-[100dvh] bg-background">
      <header className="px-4 py-3 flex items-center border-b border-border bg-card">
        <Button variant="ghost" size="icon" onClick={() => setLocation(isResident ? "/bookings" : "/provider/bookings")} className="mr-2">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="font-serif font-bold text-lg flex-1">Booking #{booking.id}</h1>
      </header>

      <main className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Status Banner */}
        <div className={`p-4 rounded-xl border flex items-center gap-3 bg-card ${status.color.replace('text-', 'border-')}`}>
          <div className={`p-2 rounded-full ${status.color.replace('text-', 'bg-').replace('600', '100')}`}>
            <StatusIcon className={`w-6 h-6 ${status.color}`} />
          </div>
          <div>
            <div className={`font-bold ${status.color}`}>{status.label}</div>
            <div className="text-sm text-muted-foreground">
              {booking.status === "pending" ? "Waiting for provider to accept." :
               booking.status === "confirmed" ? "Provider is assigned and scheduled." :
               booking.status === "completed" ? "Service completed successfully." : ""}
            </div>
          </div>
        </div>

        {/* Details Card */}
        <Card>
          <CardContent className="p-4 space-y-4 text-sm">
            <div className="flex justify-between border-b border-border pb-3">
              <span className="text-muted-foreground">{isResident ? "Provider" : "Resident"}</span>
              <span className="font-bold text-foreground text-right">{isResident ? booking.providerName : booking.residentName}</span>
            </div>
            <div className="flex justify-between border-b border-border pb-3">
              <span className="text-muted-foreground">Service</span>
              <span className="font-medium text-right">{booking.serviceName}</span>
            </div>
            <div className="flex justify-between border-b border-border pb-3">
              <span className="text-muted-foreground">Schedule</span>
              <span className="font-medium text-right">
                {booking.scheduledTime ? format(new Date(booking.scheduledTime), "PPP 'at' p") : "TBD"}
              </span>
            </div>
            <div className="flex justify-between border-b border-border pb-3">
              <span className="text-muted-foreground">Address</span>
              <span className="font-medium text-right max-w-[200px]">{booking.address}</span>
            </div>
            <div className="flex justify-between pt-1">
              <span className="text-muted-foreground font-medium">Total Amount</span>
              <span className="font-bold font-mono text-lg text-primary">₹{booking.price}</span>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        {showReviewButton && !isReviewing && (
          <div className="space-y-3">
            <Button className="w-full" size="lg" onClick={() => setIsReviewing(true)}>
              <Star className="w-4 h-4 mr-2" />
              {t("bookings.action.rate")}
            </Button>
          </div>
        )}

        {isReviewing && (
          <Card className="border-primary shadow-sm">
            <CardContent className="p-4 space-y-4">
              <h3 className="font-serif font-bold text-lg">Leave a Review</h3>
              <div className="flex gap-2 justify-center">
                {[1, 2, 3, 4, 5].map(star => (
                  <button key={star} onClick={() => setRating(star)} className="p-2">
                    <Star className={`w-8 h-8 ${star <= rating ? "fill-primary text-primary" : "text-muted"}`} />
                  </button>
                ))}
              </div>
              <textarea
                className="w-full min-h-[100px] p-3 text-sm rounded-md border border-input bg-background"
                placeholder="How was the service?"
                value={comment}
                onChange={e => setComment(e.target.value)}
              />
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={() => setIsReviewing(false)}>Cancel</Button>
                <Button className="flex-1" onClick={handleReviewSubmit} disabled={createReviewMut.isPending}>
                  {createReviewMut.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Submit"}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {isResident && booking.status !== "completed" && booking.status !== "cancelled" && (
          <div className="pt-8 flex justify-center">
            <Button variant="ghost" className="text-muted-foreground text-sm hover:text-destructive">
              <AlertTriangle className="w-4 h-4 mr-2" />
              {t("bookings.action.report")}
            </Button>
          </div>
        )}
      </main>
    </div>
  );
}
