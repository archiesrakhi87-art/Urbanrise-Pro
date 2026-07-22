import { useState, useRef } from "react";
import { useLocation } from "wouter";
import { useGetMe, useGetMyProvider, useSaveOnboardingStep, useListServiceCategories } from "@workspace/api-client-react";
import { useLanguage } from "@/components/language-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Loader2, Camera, FileText, CheckCircle2, ShieldCheck, Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

const TOTAL_STEPS = 7;

export default function ProviderOnboarding() {
  const { t } = useLanguage();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: user } = useGetMe();
  const { data: provider, isLoading: isProviderLoading } = useGetMyProvider();
  const { data: categories = [] } = useListServiceCategories();

  const saveStepMut = useSaveOnboardingStep();

  const [step, setStep] = useState<number>(
    provider?.onboardingStep != null && provider.onboardingStep < TOTAL_STEPS
      ? provider.onboardingStep + 1
      : 1
  );

  // Form states
  const [name, setName] = useState(user?.name ?? "");
  const [city, setCity] = useState(user?.city ?? "");
  const [bio, setBio] = useState(provider?.bio ?? "");
  const [services, setServices] = useState<string[]>(provider?.serviceCategories ?? []);
  const [digitalSignature, setDigitalSignature] = useState("");
  const [policyAccepted, setPolicyAccepted] = useState(false);

  // File upload state
  const [idDocUploaded, setIdDocUploaded] = useState(!!provider?.idDocUrl);
  const [selfieUploaded, setSelfieUploaded] = useState(!!provider?.photoUrl);
  const [idDocUploading, setIdDocUploading] = useState(false);
  const [selfieUploading, setSelfieUploading] = useState(false);

  const idDocRef = useRef<HTMLInputElement>(null);
  const selfieRef = useRef<HTMLInputElement>(null);

  if (isProviderLoading) {
    return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  // If already verified, redirect to dashboard
  if (provider?.kycStatus === "verified") {
    setLocation("/provider/dashboard");
    return null;
  }

  const uploadFile = async (file: File, docType: string): Promise<boolean> => {
    const formData = new FormData();
    formData.append("docType", docType);
    formData.append("file", file);

    try {
      const res = await fetch("/api/providers/me/upload", {
        method: "POST",
        credentials: "include",
        body: formData,
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({})) as Record<string, unknown>;
        throw new Error((err["error"] as string) ?? "Upload failed");
      }
      return true;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Upload failed";
      toast({ title: "Upload failed", description: msg, variant: "destructive" });
      return false;
    }
  };

  const handleIdDocChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIdDocUploading(true);
    const ok = await uploadFile(file, "id_doc");
    setIdDocUploading(false);
    if (ok) {
      setIdDocUploaded(true);
      toast({ title: "ID document uploaded" });
    }
  };

  const handleSelfieChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelfieUploading(true);
    const ok = await uploadFile(file, "kyc_selfie");
    setSelfieUploading(false);
    if (ok) {
      setSelfieUploaded(true);
      toast({ title: "Selfie uploaded" });
    }
  };

  const handleNext = (data: Record<string, unknown> = {}) => {
    saveStepMut.mutate(
      { data: { step, ...data } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries();
          if (step === TOTAL_STEPS) {
            setLocation("/provider/dashboard");
          } else {
            setStep((s) => s + 1);
          }
        },
        onError: (err: unknown) => {
          const msg = err instanceof Error ? err.message : "Something went wrong";
          toast({ title: "Error", description: msg, variant: "destructive" });
        },
      }
    );
  };

  return (
    <div className="flex flex-col h-[100dvh] bg-background">
      <header className="px-4 py-4 bg-card border-b border-border">
        <h1 className="font-serif font-bold text-xl">{t("provider.onboarding.title")}</h1>
        {/* Progress bar */}
        <div className="flex gap-1 mt-3">
          {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
            <div
              key={i}
              className={`h-1.5 flex-1 rounded-full transition-colors ${
                i + 1 <= step ? "bg-primary" : "bg-muted"
              }`}
            />
          ))}
        </div>
        <p className="text-xs text-muted-foreground mt-1">Step {step} of {TOTAL_STEPS}</p>
      </header>

      <main className="flex-1 overflow-y-auto p-4 flex flex-col justify-center">
        {/* Step 1 — Basic info */}
        {step === 1 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
            <div>
              <h2 className="text-2xl font-serif font-bold">Welcome! Let's get to know you.</h2>
              <p className="text-sm text-muted-foreground mt-1">Enter your name and city so residents can find you.</p>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-semibold mb-1 block">Full Name</label>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="As per ID" />
              </div>
              <div>
                <label className="text-sm font-semibold mb-1 block">City</label>
                <Input value={city} onChange={(e) => setCity(e.target.value)} placeholder="e.g. Madurai" />
              </div>
            </div>
            <Button
              className="w-full mt-4"
              size="lg"
              onClick={() => handleNext({ name, city })}
              disabled={!name || !city || saveStepMut.isPending}
            >
              {saveStepMut.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              {t("common.continue")}
            </Button>
          </div>
        )}

        {/* Step 2 — Bio */}
        {step === 2 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
            <div>
              <h2 className="text-2xl font-serif font-bold">Write a short bio</h2>
              <p className="text-muted-foreground text-sm mt-1">Tell customers about your experience and why they should hire you.</p>
            </div>
            <textarea
              className="w-full min-h-[120px] p-3 text-sm rounded-md border border-input bg-background resize-none"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="I have 5 years of experience in..."
            />
            <Button
              className="w-full"
              size="lg"
              onClick={() => handleNext({ bio })}
              disabled={!bio || saveStepMut.isPending}
            >
              {t("common.continue")}
            </Button>
          </div>
        )}

        {/* Step 3 — Service categories */}
        {step === 3 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
            <div>
              <h2 className="text-2xl font-serif font-bold">What services do you offer?</h2>
              <p className="text-sm text-muted-foreground mt-1">Select all that apply.</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {(categories.length > 0
                ? categories.map((c) => c.name)
                : ["Electrician", "Plumber", "Carpenter", "Cleaning", "AC Repair", "Painting"]
              ).map((s) => (
                <button
                  key={s}
                  onClick={() =>
                    setServices((prev) =>
                      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]
                    )
                  }
                  className={`p-3 rounded-lg border text-sm font-medium transition-colors ${
                    services.includes(s)
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border bg-card text-foreground"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
            <Button
              className="w-full mt-4"
              size="lg"
              onClick={() => handleNext({ serviceCategories: services })}
              disabled={services.length === 0 || saveStepMut.isPending}
            >
              {t("common.continue")}
            </Button>
          </div>
        )}

        {/* Step 4 — ID upload */}
        {step === 4 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
            <div>
              <h2 className="text-2xl font-serif font-bold">Upload ID Proof</h2>
              <p className="text-muted-foreground text-sm mt-1">Aadhar or PAN Card to verify your identity. Max 10 MB (JPG, PNG, PDF).</p>
            </div>
            <Card
              className={`border-dashed border-2 cursor-pointer transition-colors ${
                idDocUploaded ? "border-green-500 bg-green-50" : "bg-muted/30"
              }`}
              onClick={() => idDocRef.current?.click()}
            >
              <CardContent className="p-8 flex flex-col items-center justify-center text-center gap-4">
                {idDocUploading ? (
                  <Loader2 className="w-10 h-10 text-primary animate-spin" />
                ) : idDocUploaded ? (
                  <CheckCircle2 className="w-10 h-10 text-green-600" />
                ) : (
                  <FileText className="w-10 h-10 text-muted-foreground" />
                )}
                <div className="text-sm font-medium">
                  {idDocUploading ? "Uploading…" : idDocUploaded ? "Document uploaded" : "Tap to upload ID Document"}
                </div>
                <input
                  ref={idDocRef}
                  type="file"
                  accept="image/*,.pdf"
                  className="hidden"
                  onChange={handleIdDocChange}
                />
              </CardContent>
            </Card>
            <Button
              className="w-full mt-4"
              size="lg"
              onClick={() => handleNext({})}
              disabled={!idDocUploaded || saveStepMut.isPending}
            >
              {t("common.continue")}
            </Button>
          </div>
        )}

        {/* Step 5 — KYC Selfie */}
        {step === 5 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
            <div>
              <h2 className="text-2xl font-serif font-bold">Take a Selfie</h2>
              <p className="text-muted-foreground text-sm mt-1">We need to match your face with your ID doc. Optional but speeds up verification.</p>
            </div>
            <Card
              className={`border-dashed border-2 cursor-pointer transition-colors ${
                selfieUploaded ? "border-green-500 bg-green-50" : "bg-muted/30"
              }`}
              onClick={() => selfieRef.current?.click()}
            >
              <CardContent className="p-8 flex flex-col items-center justify-center text-center gap-4">
                {selfieUploading ? (
                  <Loader2 className="w-10 h-10 text-primary animate-spin" />
                ) : selfieUploaded ? (
                  <CheckCircle2 className="w-10 h-10 text-green-600" />
                ) : (
                  <Camera className="w-10 h-10 text-muted-foreground" />
                )}
                <div className="text-sm font-medium">
                  {selfieUploading ? "Uploading…" : selfieUploaded ? "Selfie uploaded" : "Tap to take or upload a selfie"}
                </div>
                <input
                  ref={selfieRef}
                  type="file"
                  accept="image/*"
                  capture="user"
                  className="hidden"
                  onChange={handleSelfieChange}
                />
              </CardContent>
            </Card>
            <Button
              className="w-full mt-4"
              size="lg"
              onClick={() => handleNext({})}
              disabled={saveStepMut.isPending}
            >
              {selfieUploaded ? t("common.continue") : "Skip for now"}
            </Button>
          </div>
        )}

        {/* Step 6 — Policy acceptance + digital signature */}
        {step === 6 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
            <div>
              <h2 className="text-2xl font-serif font-bold">Platform Policy</h2>
              <p className="text-sm text-muted-foreground mt-1">Read and accept our terms before submitting.</p>
            </div>
            <div className="bg-card border border-border rounded-lg p-4 h-44 overflow-y-auto text-sm text-muted-foreground space-y-2">
              <p className="font-semibold text-foreground">UrbanrisePro Provider Agreement</p>
              <p>1. I will provide high-quality services to all residents and treat them with respect.</p>
              <p>2. I will not overcharge or change agreed prices without prior consent.</p>
              <p>3. I will behave professionally and maintain hygiene standards at every job site.</p>
              <p>4. I understand that repeated complaints may result in removal from the platform.</p>
              <p>5. I will not solicit bookings outside the platform to avoid platform fees.</p>
              <p>6. I consent to UrbanrisePro sharing my details with residents for the purpose of service delivery.</p>
            </div>

            <div className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg border border-border">
              <input
                type="checkbox"
                id="policy-accept"
                checked={policyAccepted}
                onChange={(e) => setPolicyAccepted(e.target.checked)}
                className="mt-0.5 h-4 w-4 accent-primary cursor-pointer"
              />
              <label htmlFor="policy-accept" className="text-sm leading-snug cursor-pointer">
                I have read and agree to the UrbanrisePro Provider Agreement.
              </label>
            </div>

            <div>
              <label className="text-sm font-semibold mb-1 block">Digital Signature</label>
              <p className="text-xs text-muted-foreground mb-2">Type your full name as your digital signature to confirm acceptance.</p>
              <Input
                value={digitalSignature}
                onChange={(e) => setDigitalSignature(e.target.value)}
                placeholder="Type your full name"
              />
            </div>

            <Button
              className="w-full mt-2"
              size="lg"
              onClick={() => handleNext({ policyAccepted: true, digitalSignature })}
              disabled={!policyAccepted || !digitalSignature.trim() || saveStepMut.isPending}
            >
              {saveStepMut.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              {t("common.accept")} & Submit Application
            </Button>
          </div>
        )}

        {/* Step 7 — Confirmation */}
        {step === 7 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 text-center py-10">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <ShieldCheck className="w-10 h-10 text-green-600" />
            </div>
            <h2 className="text-3xl font-serif font-bold mb-2">Application Submitted!</h2>
            <p className="text-muted-foreground text-sm max-w-[260px] mx-auto">
              Your profile is under review. You will be notified once you are verified — typically within 24 hours.
            </p>
            <div className="mt-6 p-4 bg-card border border-border rounded-xl text-left space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">What happens next?</p>
              <div className="flex gap-2 text-sm"><Upload className="w-4 h-4 text-primary shrink-0 mt-0.5" /><span>Admin reviews your documents</span></div>
              <div className="flex gap-2 text-sm"><CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" /><span>You get the "New to App" badge on approval</span></div>
            </div>
            <Button
              className="w-full mt-8"
              size="lg"
              onClick={() => handleNext({})}
              disabled={saveStepMut.isPending}
            >
              {saveStepMut.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Go to Dashboard
            </Button>
          </div>
        )}
      </main>
    </div>
  );
}
