import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { useSendOtp, useVerifyOtp, getGetMeQueryKey, useGetMe } from "@workspace/api-client-react";

import { useLanguage } from "@/components/language-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LanguageToggle } from "@/components/language-toggle";
import { Loader2, ShieldCheck } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type LoginMode = "resident" | "admin";

// Module-level flag: survives React Strict Mode unmount/remount cycles and
// prevents the already-logged-in redirect from firing more than once even if
// Wouter recreates the setLocation reference on every navigation event.
// Reset to false whenever the server confirms the user is NOT authenticated so
// a fresh login always triggers a redirect.
let _loginRedirectFired = false;

export default function Login() {
  const { t } = useLanguage();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [mode, setMode] = useState<LoginMode>("resident");
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [role, setRole] = useState<"resident" | "provider">("resident");

  // Admin login state
  const [adminPhone, setAdminPhone] = useState("");
  const [adminSecret, setAdminSecret] = useState("");
  const [adminLoading, setAdminLoading] = useState(false);

  // staleTime: 0 forces a live server round-trip every time Login mounts.
  // This prevents stale React Query cache from triggering a redirect when the
  // session cookie is gone (e.g. server restart, new browser context), which
  // would otherwise cause an infinite bounce loop with RequireAuth.
  const { data: user, isLoading: isUserLoading } = useGetMe({
    query: { queryKey: getGetMeQueryKey(), retry: false, staleTime: 0 },
  });

  const sendOtpMut = useSendOtp();
  const verifyOtpMut = useVerifyOtp();

  // Reset the module-level guard whenever the server confirms no active session,
  // so a fresh login always triggers the redirect after re-authentication.
  useEffect(() => {
    if (!user && !isUserLoading) {
      _loginRedirectFired = false;
    }
  }, [user, isUserLoading]);

  // Redirect already-authenticated users away from /login.
  // - Module-level flag prevents re-entry across Strict Mode remounts and across
  //   the Wouter navigation events that recreate the setLocation reference.
  // - setLocation intentionally excluded from deps: including it causes the
  //   effect to re-fire on every Wouter navigation, creating an infinite loop.
  useEffect(() => {
    if (_loginRedirectFired) return;
    if (user && !isUserLoading) {
      _loginRedirectFired = true;
      if (user.role === "resident") setLocation("/");
      else if (user.role === "provider") setLocation("/provider/dashboard");
      else if (user.role === "admin") setLocation("/admin/metrics");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, isUserLoading]);

  const handleSendOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone || phone.length < 10) {
      toast({ title: "Invalid Phone", description: "Please enter a valid phone number", variant: "destructive" });
      return;
    }
    sendOtpMut.mutate(
      { data: { phone } },
      {
        onSuccess: () => {
          setStep("otp");
          toast({ title: "OTP Sent", description: "Use any 6-digit code for this demo." });
        },
        onError: (err: unknown) => {
          const msg = err instanceof Error ? err.message : "Failed to send OTP";
          toast({ title: "Error", description: msg, variant: "destructive" });
        },
      }
    );
  };

  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp || otp.length < 4) {
      toast({ title: "Invalid OTP", description: "Please enter a valid OTP", variant: "destructive" });
      return;
    }
    verifyOtpMut.mutate(
      { data: { phone, otp, role } },
      {
        onSuccess: (session) => {
          queryClient.setQueryData(getGetMeQueryKey(), session);
          // Claim the module-level guard BEFORE navigating so the useEffect
          // redirect (triggered by setQueryData) sees it already set and bails.
          _loginRedirectFired = true;
          toast({ title: "Welcome to UrbanrisePro!" });
          if (session.role === "resident") setLocation("/");
          else if (session.role === "provider") setLocation("/provider/dashboard");
          else if (session.role === "admin") setLocation("/admin/metrics");
        },
        onError: (err: unknown) => {
          const msg = err instanceof Error ? err.message : "Invalid OTP";
          toast({ title: "Error", description: msg, variant: "destructive" });
        },
      }
    );
  };

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminPhone || !adminSecret) {
      toast({ title: "Missing fields", description: "Phone and secret are required", variant: "destructive" });
      return;
    }
    setAdminLoading(true);
    try {
      const res = await fetch("/api/auth/admin-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ phone: adminPhone, secret: adminSecret }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({})) as Record<string, unknown>;
        throw new Error((err["error"] as string) ?? "Login failed");
      }
      const session = await res.json() as { role: string };
      queryClient.setQueryData(getGetMeQueryKey(), session);
      // Claim the guard before navigating so the useEffect doesn't fire a second redirect.
      _loginRedirectFired = true;
      toast({ title: "Admin access granted" });
      setLocation("/admin/metrics");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Admin login failed";
      toast({ title: "Login failed", description: msg, variant: "destructive" });
    } finally {
      setAdminLoading(false);
    }
  };

  if (isUserLoading) return null;

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="absolute top-4 right-4">
        <LanguageToggle />
      </div>

      <div className="w-full max-w-md space-y-8">
        <div className="text-center space-y-2">
          <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
            <span className="text-3xl">🏠</span>
          </div>
          <h1 className="text-3xl font-serif font-bold tracking-tight text-primary">
            {t("auth.login.title")}
          </h1>
          <p className="text-muted-foreground">{t("auth.login.subtitle")}</p>
        </div>

        {/* Mode toggle */}
        <div className="flex gap-2 p-1 bg-muted rounded-lg">
          <button
            className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
              mode === "resident" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground"
            }`}
            onClick={() => { setMode("resident"); setStep("phone"); }}
          >
            Resident / Provider
          </button>
          <button
            className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
              mode === "admin" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground"
            }`}
            onClick={() => setMode("admin")}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            Admin
          </button>
        </div>

        {mode === "resident" ? (
          <Card className="border-border shadow-xl">
            <CardHeader>
              <CardTitle>{step === "phone" ? "Sign In" : "Verify OTP"}</CardTitle>
              <CardDescription>
                {step === "phone"
                  ? "Enter your mobile number to continue."
                  : `OTP sent to ${phone}`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {step === "phone" ? (
                <form onSubmit={handleSendOtp} className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">{t("auth.login.phoneLabel")}</label>
                    <div className="flex">
                      <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-input bg-muted text-muted-foreground text-sm">
                        +91
                      </span>
                      <Input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder={t("auth.login.phonePlaceholder")}
                        className="rounded-l-none"
                        autoFocus
                      />
                    </div>
                  </div>
                  <Button type="submit" className="w-full" disabled={sendOtpMut.isPending}>
                    {sendOtpMut.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    {t("auth.login.sendOtp")}
                  </Button>
                </form>
              ) : (
                <form onSubmit={handleVerifyOtp} className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">{t("auth.login.otpLabel")}</label>
                    <Input
                      type="text"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      placeholder={t("auth.login.otpPlaceholder")}
                      autoFocus
                      maxLength={6}
                      className="text-center tracking-widest font-mono text-lg"
                    />
                  </div>

                  <div className="space-y-3 pt-2 border-t border-border">
                    <label className="text-sm font-medium block text-center">New Account? Choose Role:</label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setRole("resident")}
                        className={`p-3 rounded-lg border text-sm font-medium transition-all ${
                          role === "resident"
                            ? "border-primary bg-primary/5 text-primary shadow-sm"
                            : "border-border text-muted-foreground hover:bg-muted"
                        }`}
                      >
                        {t("auth.login.roleResident")}
                      </button>
                      <button
                        type="button"
                        onClick={() => setRole("provider")}
                        className={`p-3 rounded-lg border text-sm font-medium transition-all ${
                          role === "provider"
                            ? "border-primary bg-primary/5 text-primary shadow-sm"
                            : "border-border text-muted-foreground hover:bg-muted"
                        }`}
                      >
                        {t("auth.login.roleProvider")}
                      </button>
                    </div>
                  </div>

                  <Button type="submit" className="w-full" disabled={verifyOtpMut.isPending}>
                    {verifyOtpMut.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    {t("auth.login.verifyOtp")}
                  </Button>

                  <div className="text-center">
                    <button
                      type="button"
                      onClick={() => setStep("phone")}
                      className="text-sm text-primary hover:underline"
                    >
                      Back to phone number
                    </button>
                  </div>
                </form>
              )}
            </CardContent>
          </Card>
        ) : (
          <Card className="border-border shadow-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-primary" /> Admin Login
              </CardTitle>
              <CardDescription>Restricted access. Requires admin credentials.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAdminLogin} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Admin Phone Number</label>
                  <div className="flex">
                    <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-input bg-muted text-muted-foreground text-sm">
                      +91
                    </span>
                    <Input
                      type="tel"
                      value={adminPhone}
                      onChange={(e) => setAdminPhone(e.target.value)}
                      placeholder="Admin phone"
                      className="rounded-l-none"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Admin Secret</label>
                  <Input
                    type="password"
                    value={adminSecret}
                    onChange={(e) => setAdminSecret(e.target.value)}
                    placeholder="Server-configured secret"
                  />
                </div>
                <Button type="submit" className="w-full" disabled={adminLoading}>
                  {adminLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ShieldCheck className="mr-2 h-4 w-4" />}
                  Login as Admin
                </Button>
              </form>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
