import { useGetAdminMetrics, useGetOnboardingFunnel } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

export default function AdminMetrics() {
  const { data: metrics, isLoading: isMetricsLoading } = useGetAdminMetrics();
  const { data: funnel, isLoading: isFunnelLoading } = useGetOnboardingFunnel();

  if (isMetricsLoading || isFunnelLoading) {
    return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase">Total Bookings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold font-mono">{metrics?.totalBookings || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase">Active Providers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold font-mono">{metrics?.activeProviders || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase">Active Residents</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold font-mono">{metrics?.activeResidents || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase">Repeat Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold font-mono">{(metrics?.repeatBookingRate || 0).toFixed(1)}%</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Onboarding Funnel</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={funnel} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e5e5" />
                  <XAxis dataKey="label" axisLine={false} tickLine={false} fontSize={12} />
                  <YAxis axisLine={false} tickLine={false} fontSize={12} />
                  <Tooltip cursor={{ fill: 'transparent' }} />
                  <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Bookings By Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {metrics?.bookingsByStatus && Object.entries(metrics.bookingsByStatus).map(([status, count]) => (
                <div key={status} className="flex items-center justify-between border-b border-border pb-2 last:border-0">
                  <div className="capitalize font-medium text-muted-foreground">{status}</div>
                  <div className="font-bold font-mono">{count as number}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
