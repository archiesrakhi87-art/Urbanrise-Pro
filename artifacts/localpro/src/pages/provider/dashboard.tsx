import { Link, useLocation } from "wouter";
import { useGetProviderDashboard, useGetMyProvider } from "@workspace/api-client-react";
import { useLanguage } from "@/components/language-provider";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, IndianRupee, Briefcase, Star, Clock, AlertCircle, ChevronRight } from "lucide-react";
import { format } from "date-fns";

export default function ProviderDashboard() {
  const { t } = useLanguage();
  const [, setLocation] = useLocation();

  const { data: provider, isLoading: isProviderLoading } = useGetMyProvider();
  const { data: dashboard, isLoading: isDashLoading } = useGetProviderDashboard();

  if (isProviderLoading || isDashLoading) {
    return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  if (provider?.onboardingStep !== undefined && provider.onboardingStep < 7) {
    setLocation("/onboarding");
    return null;
  }

  const isPendingKyc = provider?.kycStatus === "pending";
  const isRejectedKyc = provider?.kycStatus === "rejected";

  return (
    <div className="flex flex-col gap-6 p-4">
      {/* Greeting */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="font-serif text-2xl font-bold text-foreground">
            {t("provider.dashboard.greeting")}, {provider?.name?.split(" ")[0]}!
          </h1>
          <p className="text-sm text-muted-foreground">Here is your summary today.</p>
        </div>
        {provider?.photoUrl ? (
          <img src={provider.photoUrl} alt="" className="w-12 h-12 rounded-full object-cover border border-border" />
        ) : (
          <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-xl">👤</div>
        )}
      </div>

      {/* KYC Banners */}
      {isPendingKyc && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 flex gap-3">
          <AlertCircle className="w-5 h-5 text-yellow-600 shrink-0 mt-0.5" />
          <div>
            <h3 className="font-bold text-yellow-800 text-sm">Verification Pending</h3>
            <p className="text-xs text-yellow-700 mt-1">{t("provider.kyc.pending")}</p>
          </div>
        </div>
      )}
      {isRejectedKyc && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          <div>
            <h3 className="font-bold text-red-800 text-sm">Action Required</h3>
            <p className="text-xs text-red-700 mt-1">{t("provider.kyc.rejected")}</p>
            {provider.kycNotes && (
              <div className="mt-2 text-xs bg-red-100 p-2 rounded text-red-800 font-mono">
                {provider.kycNotes}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="bg-primary text-primary-foreground border-transparent shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2 text-primary-foreground/80">
              <IndianRupee className="w-4 h-4" />
              <span className="text-xs font-medium uppercase tracking-wider">{t("provider.dashboard.earnings")}</span>
            </div>
            <div className="text-2xl font-bold font-mono">₹{dashboard?.totalEarnings || 0}</div>
          </CardContent>
        </Card>
        
        <Card className="bg-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2 text-muted-foreground">
              <Briefcase className="w-4 h-4" />
              <span className="text-xs font-medium uppercase tracking-wider">{t("provider.dashboard.jobs")}</span>
            </div>
            <div className="text-2xl font-bold font-mono text-foreground">{dashboard?.totalJobs || 0}</div>
          </CardContent>
        </Card>
      </div>

      {/* Secondary Stats */}
      <div className="flex gap-4 border-y border-border py-4">
        <div className="flex-1 text-center border-r border-border">
          <div className="text-xl font-bold font-mono text-foreground flex items-center justify-center gap-1">
            {dashboard?.ratingAvg.toFixed(1) || "0.0"} <Star className="w-4 h-4 fill-primary text-primary" />
          </div>
          <div className="text-xs text-muted-foreground mt-1">Rating</div>
        </div>
        <div className="flex-1 text-center">
          <div className="text-xl font-bold font-mono text-foreground flex items-center justify-center gap-1">
            {dashboard?.pendingBookings || 0} <Clock className="w-4 h-4 text-yellow-500" />
          </div>
          <div className="text-xs text-muted-foreground mt-1">Pending Requests</div>
        </div>
      </div>

      {/* Upskilling Progress */}
      {dashboard?.upskillingProgress !== undefined && (
        <Card className="bg-secondary/30 border-secondary/50">
          <CardContent className="p-4">
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-bold text-sm text-foreground">Upskilling Progress</h3>
              <span className="text-xs font-medium bg-secondary text-secondary-foreground px-2 py-0.5 rounded">
                {dashboard.upskillingProgress}%
              </span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div className="h-full bg-primary transition-all" style={{ width: `${dashboard.upskillingProgress}%` }} />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Bookings */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            {t("provider.dashboard.recent")}
          </h2>
          <Link href="/provider/bookings" className="text-xs font-medium text-primary flex items-center hover:underline">
            View All <ChevronRight className="w-3 h-3" />
          </Link>
        </div>
        
        {dashboard?.recentBookings?.length === 0 ? (
          <div className="text-center py-8 bg-card rounded-xl border border-border">
            <p className="text-sm text-muted-foreground">No recent bookings.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {dashboard?.recentBookings?.map(booking => (
              <Link key={booking.id} href={`/bookings/${booking.id}`}>
                <Card className="border-border hover:border-primary/50 transition-colors cursor-pointer">
                  <CardContent className="p-3 flex justify-between items-center">
                    <div>
                      <div className="font-bold text-sm text-foreground">{booking.residentName || "Client"}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">
                        {booking.scheduledTime ? format(new Date(booking.scheduledTime), "MMM d, h:mm a") : "TBD"}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-mono text-sm font-bold text-primary">₹{booking.price}</div>
                      <div className="text-[10px] uppercase font-bold text-muted-foreground mt-0.5">{booking.status}</div>
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
