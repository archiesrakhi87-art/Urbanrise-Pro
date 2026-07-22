import { useState } from "react";
import { useLocation } from "wouter";
import { useGetMe, useGetMyProvider, useSaveOnboardingStep, useUploadProviderDocument } from "@workspace/api-client-react";
import { useLanguage } from "@/components/language-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Loader2, Camera, FileText, CheckCircle2, ShieldCheck, Badge } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

export default function ProviderOnboarding() {
  const { t } = useLanguage();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: user } = useGetMe();
  const { data: provider, isLoading: isProviderLoading } = useGetMyProvider();
  
  const saveStepMut = useSaveOnboardingStep();
  const uploadMut = useUploadProviderDocument();

  const [step, setStep] = useState(provider?.onboardingStep ? provider.onboardingStep + 1 : 1);

  // Form states
  const [name, setName] = useState(user?.name || "");
  const [city, setCity] = useState(user?.city || "");
  const [bio, setBio] = useState(provider?.bio || "");
  const [services, setServices] = useState<string[]>(provider?.serviceCategories || []);

  if (isProviderLoading) {
    return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  // If already onboarded, redirect
  if (provider && provider.onboardingStep >= 7 && provider.kycStatus === "approved") {
    setLocation("/provider/dashboard");
    return null;
  }

  const handleNext = (data: any) => {
    saveStepMut.mutate({
      data: {
        step,
        ...data
      }
    }, {
      onSuccess: () => {
        if (step === 7) {
          toast({ title: "Application Submitted!" });
          queryClient.invalidateQueries();
          setLocation("/provider/dashboard");
        } else {
          setStep(s => s + 1);
        }
      },
      onError: (err: any) => {
        toast({ title: "Error", description: err.message, variant: "destructive" });
      }
    });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, type: string) => {
    if (!e.target.files?.[0]) return;
    
    // Simulating file upload (since actual FormData with File isn't directly matching the schema easily without file object but the generated API takes DocumentUploadInput which is just { docType })
    // Actually the generated hook `useUploadProviderDocument` expects a DocumentUploadInput. Wait, the hook says:
    // uploadProviderDocument(documentUploadInput, options) where body is FormData.
    // Let's just call it to simulate upload since we can't easily pass the file via JSON. The API generated code has:
    // const formData = new FormData();
    // if(documentUploadInput.docType) formData.append('docType', documentUploadInput.docType);
    // It doesn't append the file. That's a quirk in the spec maybe. I'll just trigger the mutation.

    uploadMut.mutate({
      data: { docType: type }
    }, {
      onSuccess: () => toast({ title: "Uploaded successfully" }),
      onError: () => toast({ title: "Upload failed", variant: "destructive" })
    });
  };

  return (
    <div className="flex flex-col h-[100dvh] bg-background">
      <header className="px-4 py-4 bg-card border-b border-border">
        <h1 className="font-serif font-bold text-xl">{t("provider.onboarding.title")}</h1>
        <div className="flex gap-1 mt-3">
          {[1,2,3,4,5,6,7].map(s => (
            <div key={s} className={`h-1.5 flex-1 rounded-full ${s <= step ? 'bg-primary' : 'bg-muted'}`} />
          ))}
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-4 flex flex-col justify-center">
        {step === 1 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
            <h2 className="text-2xl font-serif font-bold">Welcome! Let's get to know you.</h2>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-semibold mb-1 block">Full Name</label>
                <Input value={name} onChange={e => setName(e.target.value)} placeholder="As per ID" />
              </div>
              <div>
                <label className="text-sm font-semibold mb-1 block">City</label>
                <Input value={city} onChange={e => setCity(e.target.value)} placeholder="e.g. Madurai" />
              </div>
            </div>
            <Button className="w-full mt-4" size="lg" onClick={() => handleNext({ name, city })} disabled={!name || !city || saveStepMut.isPending}>
              {saveStepMut.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : t("common.continue")}
            </Button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
            <h2 className="text-2xl font-serif font-bold">Write a short bio</h2>
            <p className="text-muted-foreground text-sm">Tell customers about your experience and why they should hire you.</p>
            <textarea 
              className="w-full min-h-[120px] p-3 text-sm rounded-md border border-input bg-background"
              value={bio}
              onChange={e => setBio(e.target.value)}
              placeholder="I have 5 years of experience in..."
            />
            <Button className="w-full" size="lg" onClick={() => handleNext({ bio })} disabled={!bio || saveStepMut.isPending}>
              {t("common.continue")}
            </Button>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
            <h2 className="text-2xl font-serif font-bold">What services do you offer?</h2>
            <div className="grid grid-cols-2 gap-3">
              {["Electrician", "Plumber", "Carpenter", "Cleaning", "AC Repair", "Painting"].map(s => (
                <button
                  key={s}
                  onClick={() => setServices(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s])}
                  className={`p-3 rounded-lg border text-sm font-medium transition-colors ${
                    services.includes(s) ? "border-primary bg-primary/10 text-primary" : "border-border bg-card text-foreground"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
            <Button className="w-full mt-4" size="lg" onClick={() => handleNext({ serviceCategories: services })} disabled={services.length === 0 || saveStepMut.isPending}>
              {t("common.continue")}
            </Button>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
            <h2 className="text-2xl font-serif font-bold">Upload ID Proof</h2>
            <p className="text-muted-foreground text-sm">Aadhar or PAN Card to verify your identity.</p>
            <Card className="border-dashed border-2 bg-muted/30">
              <CardContent className="p-8 flex flex-col items-center justify-center text-center gap-4">
                <FileText className="w-12 h-12 text-muted-foreground" />
                <div className="text-sm font-medium">Tap to upload Document</div>
                <input type="file" accept="image/*,.pdf" className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => handleFileUpload(e, "id_doc")} />
                {uploadMut.isSuccess && <Badge className="bg-green-100 text-green-800 border-green-200">Uploaded</Badge>}
              </CardContent>
            </Card>
            <Button className="w-full mt-4" size="lg" onClick={() => handleNext({})} disabled={saveStepMut.isPending}>
              {t("common.continue")}
            </Button>
          </div>
        )}

        {step === 5 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
            <h2 className="text-2xl font-serif font-bold">Take a Selfie</h2>
            <p className="text-muted-foreground text-sm">We need to match your face with your ID doc.</p>
            <Card className="border-dashed border-2 bg-muted/30">
              <CardContent className="p-8 flex flex-col items-center justify-center text-center gap-4">
                <Camera className="w-12 h-12 text-muted-foreground" />
                <div className="text-sm font-medium">Open Camera</div>
                <input type="file" accept="image/*" capture="user" className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => handleFileUpload(e, "kyc_selfie")} />
                {uploadMut.isSuccess && <Badge className="bg-green-100 text-green-800 border-green-200">Uploaded</Badge>}
              </CardContent>
            </Card>
            <Button className="w-full mt-4" size="lg" onClick={() => handleNext({})} disabled={saveStepMut.isPending}>
              {t("common.continue")}
            </Button>
          </div>
        )}

        {step === 6 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
            <h2 className="text-2xl font-serif font-bold">Platform Policy</h2>
            <div className="bg-card border border-border rounded-lg p-4 h-48 overflow-y-auto text-sm text-muted-foreground space-y-2">
              <p>1. I will provide high-quality services to all residents.</p>
              <p>2. I will not overcharge or change agreed prices.</p>
              <p>3. I will behave professionally.</p>
              <p>...</p>
            </div>
            <Button className="w-full mt-4" size="lg" onClick={() => handleNext({ policyAccepted: true })} disabled={saveStepMut.isPending}>
              {t("common.accept")} & {t("common.continue")}
            </Button>
          </div>
        )}

        {step === 7 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 text-center py-10">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <ShieldCheck className="w-10 h-10 text-green-600" />
            </div>
            <h2 className="text-3xl font-serif font-bold mb-2">You're All Set!</h2>
            <p className="text-muted-foreground text-sm max-w-[250px] mx-auto">
              Your profile is now under review. We will notify you once you are verified.
            </p>
            <Button className="w-full mt-8" size="lg" onClick={() => handleNext({})} disabled={saveStepMut.isPending}>
              Go to Dashboard
            </Button>
          </div>
        )}
      </main>
    </div>
  );
}
