import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import NotFound from '@/pages/not-found';
import { Route, Switch, Router as WouterRouter } from 'wouter';
import { AuthProvider, RequireAuth } from '@/components/auth-provider';
import { LanguageProvider } from '@/components/language-provider';
import { Shell, AdminShell } from '@/components/shell';

// Pages
import Login from '@/pages/login';
import ResidentHome from '@/pages/resident/home';
import ProviderProfile from '@/pages/resident/provider-profile';
import BookingWizard from '@/pages/resident/booking-wizard';
import BookingsList from '@/pages/resident/bookings-list';
import BookingDetail from '@/pages/resident/booking-detail';

import ProviderDashboard from '@/pages/provider/dashboard';
import ProviderBookings from '@/pages/provider/bookings';
import ProviderUpskilling from '@/pages/provider/upskilling';
import ProviderProfileEditor from '@/pages/provider/profile';
import ProviderOnboarding from '@/pages/provider/onboarding';

import AdminMetrics from '@/pages/admin/metrics';
import AdminVerify from '@/pages/admin/verify';
import AdminDisputes from '@/pages/admin/disputes';
import AdminPartners from '@/pages/admin/partners';

import HallOfFame from '@/pages/public/hall-of-fame';
import LocalPartners from '@/pages/public/local-partners';

const queryClient = new QueryClient();

function Router() {
  return (
    <Switch>
      <Route path="/login" component={Login} />
      <Route path="/hall-of-fame" component={HallOfFame} />
      <Route path="/local-partners">
        <Shell title="Local Partners">
          <LocalPartners />
        </Shell>
      </Route>

      {/* Resident Routes */}
      <Route path="/">
        <RequireAuth role="resident">
          <Shell title="LocalPro">
            <ResidentHome />
          </Shell>
        </RequireAuth>
      </Route>
      <Route path="/providers/:id">
        <RequireAuth role="resident">
          <Shell title="Provider Profile" showBottomNav={false}>
            <ProviderProfile />
          </Shell>
        </RequireAuth>
      </Route>
      <Route path="/book/:id">
        <RequireAuth role="resident">
          <Shell title="Book Service" showBottomNav={false} hideHeader>
            <BookingWizard />
          </Shell>
        </RequireAuth>
      </Route>
      <Route path="/bookings">
        <RequireAuth role="resident">
          <Shell title="My Bookings">
            <BookingsList />
          </Shell>
        </RequireAuth>
      </Route>
      <Route path="/bookings/:id">
        <RequireAuth role="resident">
          <Shell title="Booking Detail" showBottomNav={false}>
            <BookingDetail />
          </Shell>
        </RequireAuth>
      </Route>

      {/* Provider Routes */}
      <Route path="/onboarding">
        <RequireAuth role="provider">
          <Shell title="Onboarding" showBottomNav={false}>
            <ProviderOnboarding />
          </Shell>
        </RequireAuth>
      </Route>
      <Route path="/provider/dashboard">
        <RequireAuth role="provider">
          <Shell title="Dashboard">
            <ProviderDashboard />
          </Shell>
        </RequireAuth>
      </Route>
      <Route path="/provider/bookings">
        <RequireAuth role="provider">
          <Shell title="Jobs">
            <ProviderBookings />
          </Shell>
        </RequireAuth>
      </Route>
      <Route path="/provider/upskilling">
        <RequireAuth role="provider">
          <Shell title="Upskilling">
            <ProviderUpskilling />
          </Shell>
        </RequireAuth>
      </Route>
      <Route path="/provider/profile">
        <RequireAuth role="provider">
          <Shell title="My Profile">
            <ProviderProfileEditor />
          </Shell>
        </RequireAuth>
      </Route>

      {/* Admin Routes */}
      <Route path="/admin/metrics">
        <RequireAuth role="admin">
          <AdminShell title="Metrics">
            <AdminMetrics />
          </AdminShell>
        </RequireAuth>
      </Route>
      <Route path="/admin/verify">
        <RequireAuth role="admin">
          <AdminShell title="Verify Providers">
            <AdminVerify />
          </AdminShell>
        </RequireAuth>
      </Route>
      <Route path="/admin/disputes">
        <RequireAuth role="admin">
          <AdminShell title="Disputes">
            <AdminDisputes />
          </AdminShell>
        </RequireAuth>
      </Route>
      <Route path="/admin/partners">
        <RequireAuth role="admin">
          <AdminShell title="Local Partners">
            <AdminPartners />
          </AdminShell>
        </RequireAuth>
      </Route>

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <LanguageProvider>
        <AuthProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
            <Router />
          </WouterRouter>
          <Toaster />
        </AuthProvider>
      </LanguageProvider>
    </QueryClientProvider>
  );
}

export default App;
