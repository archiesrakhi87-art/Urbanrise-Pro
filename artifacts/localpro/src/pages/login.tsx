import { useState } from "react";
import { useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { useSendOtp, useVerifyOtp, getGetMeQueryKey, useGetMe } from "@workspace/api-client-react";

import { useLanguage } from "@/components/language-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LanguageToggle } from "@/components/language-toggle";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Login() {
  const { t } = useLanguage();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [role, setRole] = useState<"resident" | "provider">("resident");

  const { data: user, isLoading: isUserLoading } = useGetMe({
    query: { queryKey: getGetMeQueryKey(), retry: false }
  });

  const sendOtpMut = useSendOtp();
  const verifyOtpMut = useVerifyOtp();

  // If already logged in, redirect
  if (user && !isUserLoading) {
    if (user.role === "resident") setLocation("/");
    else if (user.role === "provider") setLocation("/provider/dashboard");
    else if (user.role === "admin") setLocation("/admin/metrics");
    return null;
  }

  const handleSendOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone || phone.length < 10) {
      toast({ title: "Invalid Phone", description: "Please enter a valid phone number", variant: "destructive" });
      return;
    }
    
    sendOtpMut.mutate({ data: { phone } }, {
      onSuccess: () => {
        setStep("otp");
        toast({ title: "OTP Sent", description: "Please check your messages." });
      },
      onError: (err: any) => {
        toast({ title: "Error", description: err?.message || "Failed to send OTP", variant: "destructive" });
      }
    });
  };

  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp || otp.length < 4) {
      toast({ title: "Invalid OTP", description: "Please enter a valid OTP", variant: "destructive" });
      return;
    }

    verifyOtpMut.mutate({ data: { phone, otp, role } }, {
      onSuccess: (session) => {
        queryClient.setQueryData(getGetMeQueryKey(), session);
        toast({ title: "Welcome to LocalPro!" });
        if (session.role === "resident") setLocation("/");
        else if (session.role === "provider") setLocation("/provider/dashboard");
        else if (session.role === "admin") setLocation("/admin/metrics");
      },
      onError: (err: any) => {
        toast({ title: "Error", description: err?.message || "Invalid OTP", variant: "destructive" });
      }
    });
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
          <p className="text-muted-foreground">
            {t("auth.login.subtitle")}
          </p>
        </div>

        <Card className="border-border shadow-xl">
          <CardHeader>
            <CardTitle>{step === "phone" ? "Sign In" : "Verify OTP"}</CardTitle>
            <CardDescription>
              {step === "phone" ? "Enter your mobile number to continue." : `OTP sent to ${phone}`}
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
      </div>
    </div>
  );
}
