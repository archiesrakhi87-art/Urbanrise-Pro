import { useState } from "react";
import { useRoute, useLocation } from "wouter";
import {
  useGetBooking,
  useCreateReview,
  useCreateDispute,
  useGetMe,
  getListBookingsQueryKey,
  getGetBookingQueryKey,
  getGetMeQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useLanguage } from "@/components/language-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Loader2,
  ArrowLeft,
  Star,
  MapPin,
  Calendar,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ShieldAlert,
  ChevronDown,
} from "lucide-react";
import { format, addHours } from "date-fns";
import { useToast } from "@/hooks/use-toast";

const ISSUE_TYPES = [
  { value: "quality", label: "Poor quality of work" },
  { value: "no_show", label: "Provider did not show up" },
  { value: "damage", label: "Property damage" },
  { value: "overcharge", label: "Overcharged / price dispute" },
  { value: "behaviour", label: "Unprofessional behaviour" },
  { value: "other", label: "Other issue" },
];

export default function BookingDetail() {
  const [match, params] = useRoute("/bookings/:id");
  const [, setLocation] = useLocation();
  const { t } = useLanguage();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const id = params?.id ? parseInt(params.id, 10) : 0;

  const { data: user } = useGetMe({ query: { queryKey: getGetMeQueryKey() } });
  const { data: booking, isLoading } = useGetBooking(id, {
    query: { queryKey: getGetBookingQueryKey(id), enabled: !!id },
  });

  const createReviewMut = useCreateReview();
  const createDisputeMut = useCreateDispute();

  // Review state
  const [isReviewing, setIsReviewing] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");

  // Dispute state
  const [isReporting, setIsReporting] = useState(false);
  const [disputeSubmitted, setDisputeSubmitted] = useState<{ id: number; slaDeadline: string } | null>(null);
  const [issueType, setIssueType] = useState("quality");
  const [issueDescription, setIssueDescription] = useState("");

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }
  if (!booking) return <div className="p-4">Not found</div>;

  const handleReviewSubmit = () => {
    createReviewMut.mutate(
      { data: { bookingId: id, rating, comment } },
      {
        onSuccess: () => {
          toast({ title: "Review submitted!" });
          setIsReviewing(false);
          queryClient.invalidateQueries({ queryKey: getGetBookingQueryKey(id) });
          queryClient.invalidateQueries({ queryKey: getListBookingsQueryKey() });
        },
        onError: () => {
          toast({ title: "Failed to submit review", variant: "destructive" });
        },
      }
    );
  };

  const handleDisputeSubmit = () => {
    if (!issueDescription.trim()) {
      toast({ title: "Please describe the issue", variant: "destructive" });
      return;
    }
    createDisputeMut.mutate(
      { data: { bookingId: id, issueType, description: issueDescription } },
      {
        onSuccess: (data) => {
          setDisputeSubmitted({ id: data.id, slaDeadline: data.slaDeadline });
          setIsReporting(false);
          queryClient.invalidateQueries({ queryKey: getGetBookingQueryKey(id) });
        },
        onError: () => {
          toast({ title: "Failed to report issue", variant: "destructive" });
        },
      }
    );
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case "requested":
        return { color: "text-yellow-600", bg: "bg-yellow-50", border: "border-yellow-200", icon: Clock, label: t("bookings.status.pending") };
      case "confirmed":
        return { color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-200", icon: Calendar, label: t("bookings.status.confirmed") };
      case "completed":
        return { color: "text-green-600", bg: "bg-green-50", border: "border-green-200", icon: CheckCircle2, label: t("bookings.status.completed") };
      case "cancelled":
        return { color: "text-gray-500", bg: "bg-gray-50", border: "border-gray-200", icon: Clock, label: t("bookings.status.cancelled") };
      case "disputed":
        return { color: "text-red-600", bg: "bg-red-50", border: "border-red-200", icon: AlertTriangle, label: t("bookings.status.disputed") };
      default:
        return { color: "text-gray-600", bg: "bg-gray-50", border: "border-gray-200", icon: Clock, label: status };
    }
  };

  const statusCfg = getStatusConfig(booking.status);
  const StatusIcon = statusCfg.icon;

  const isResident = user?.role === "resident";
  const showReviewButton = isResident && booking.status === "completed" && !booking.hasReview && !isReviewing;
  const canReport =
    isResident &&
    !disputeSubmitted &&
    !isReporting &&
    booking.status !== "cancelled" &&
    booking.status !== "disputed";

  return (
    <div className="flex flex-col h-[100dvh] bg-background">
      <header className="px-4 py-3 flex items-center border-b border-border bg-card">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setLocation(isResident ? "/bookings" : "/provider/bookings")}
          className="mr-2"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="font-serif font-bold text-lg flex-1">Booking #{booking.id}</h1>
      </header>

      <main className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Status Banner */}
        <div className={`p-4 rounded-xl border flex items-center gap-3 ${statusCfg.bg} ${statusCfg.border}`}>
          <div className={`p-2 rounded-full bg-white/70`}>
            <StatusIcon className={`w-5 h-5 ${statusCfg.color}`} />
          </div>
          <div>
            <div className={`font-bold ${statusCfg.color}`}>{statusCfg.label}</div>
            <div className="text-xs text-muted-foreground">
              {booking.status === "requested"
                ? "Waiting for provider to accept."
                : booking.status === "confirmed"
                ? "Provider is assigned and scheduled."
                : booking.status === "completed"
                ? "Service completed successfully."
                : booking.status === "disputed"
                ? "An issue has been reported for this booking."
                : ""}
            </div>
          </div>
        </div>

        {/* Details Card */}
        <Card>
          <CardContent className="p-4 space-y-3 text-sm">
            <div className="flex justify-between border-b border-border pb-3">
              <span className="text-muted-foreground">{isResident ? "Provider" : "Resident"}</span>
              <span className="font-bold text-foreground text-right">
                {isResident ? booking.providerName : booking.residentName}
              </span>
            </div>
            <div className="flex justify-between border-b border-border pb-3">
              <span className="text-muted-foreground">Service</span>
              <span className="font-medium text-right">{booking.serviceName}</span>
            </div>
            <div className="flex justify-between border-b border-border pb-3">
              <span className="text-muted-foreground">Schedule</span>
              <span className="font-medium text-right">
                {booking.scheduledTime
                  ? format(new Date(booking.scheduledTime), "PPP 'at' p")
                  : "TBD"}
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

        {/* ── REVIEW ─────────────────────────────────── */}
        {showReviewButton && (
          <Button className="w-full" size="lg" onClick={() => setIsReviewing(true)}>
            <Star className="w-4 h-4 mr-2" />
            {t("bookings.action.rate")}
          </Button>
        )}

        {isReviewing && (
          <Card className="border-primary shadow-sm">
            <CardContent className="p-4 space-y-4">
              <h3 className="font-serif font-bold text-lg">Leave a Review</h3>
              <div className="flex gap-2 justify-center">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button key={star} onClick={() => setRating(star)} className="p-2">
                    <Star
                      className={`w-8 h-8 ${star <= rating ? "fill-primary text-primary" : "text-muted-foreground"}`}
                    />
                  </button>
                ))}
              </div>
              <textarea
                className="w-full min-h-[100px] p-3 text-sm rounded-md border border-input bg-background resize-none"
                placeholder="How was the service?"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
              />
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setIsReviewing(false)}
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1"
                  onClick={handleReviewSubmit}
                  disabled={createReviewMut.isPending}
                >
                  {createReviewMut.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Submit"}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* ── DISPUTE FORM ───────────────────────────── */}
        {canReport && (
          <div className="flex justify-center pt-4">
            <Button
              variant="ghost"
              className="text-muted-foreground text-sm hover:text-destructive"
              onClick={() => setIsReporting(true)}
            >
              <AlertTriangle className="w-4 h-4 mr-2" />
              {t("bookings.action.report")}
            </Button>
          </div>
        )}

        {isReporting && (
          <Card className="border-destructive/40 bg-destructive/5">
            <CardContent className="p-4 space-y-4">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-destructive" />
                <h3 className="font-serif font-bold text-base text-destructive">Report an Issue</h3>
              </div>
              <p className="text-xs text-muted-foreground">
                Our team will review your report within <strong>48 hours</strong>. You'll be notified when the dispute is resolved.
              </p>

              <div>
                <Label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                  What went wrong?
                </Label>
                <div className="relative">
                  <select
                    value={issueType}
                    onChange={(e) => setIssueType(e.target.value)}
                    className="w-full h-10 text-sm rounded-md border border-input bg-background px-3 pr-8 appearance-none focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    {ISSUE_TYPES.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                </div>
              </div>

              <div>
                <Label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                  Describe the issue
                </Label>
                <textarea
                  className="w-full min-h-[100px] p-3 text-sm rounded-md border border-input bg-background resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="Please describe what happened in detail…"
                  value={issueDescription}
                  onChange={(e) => setIssueDescription(e.target.value)}
                />
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    setIsReporting(false);
                    setIssueDescription("");
                    setIssueType("quality");
                  }}
                  disabled={createDisputeMut.isPending}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  className="flex-1"
                  onClick={handleDisputeSubmit}
                  disabled={createDisputeMut.isPending || !issueDescription.trim()}
                >
                  {createDisputeMut.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    "Submit Report"
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* ── DISPUTE CONFIRMATION ───────────────────── */}
        {disputeSubmitted && (
          <Card className="border-orange-200 bg-orange-50">
            <CardContent className="p-4 space-y-2">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-orange-600" />
                <h3 className="font-semibold text-sm text-orange-800">Issue Reported (#{disputeSubmitted.id})</h3>
              </div>
              <p className="text-xs text-orange-700">
                Our team will respond by{" "}
                <strong>
                  {format(new Date(disputeSubmitted.slaDeadline), "PPP 'at' p")}
                </strong>
                . This is within the 48-hour SLA window.
              </p>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
