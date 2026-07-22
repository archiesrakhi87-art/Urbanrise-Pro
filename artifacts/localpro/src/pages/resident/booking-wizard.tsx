import { useState } from "react";
import { useRoute, useLocation } from "wouter";
import { useGetProvider, useCreateBooking, useListServiceCategories, getGetProviderQueryKey } from "@workspace/api-client-react";
import { useLanguage } from "@/components/language-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Loader2, ArrowLeft, CheckCircle2, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format, addDays } from "date-fns";

export default function BookingWizard() {
  const [match, params] = useRoute("/book/:id");
  const [, setLocation] = useLocation();
  const { t } = useLanguage();
  const { toast } = useToast();

  const id = params?.id ? parseInt(params.id, 10) : 0;
  const [step, setStep] = useState(1);

  // Form State
  const [serviceCategoryId, setServiceCategoryId] = useState<number | null>(null);
  const [date, setDate] = useState<Date>(new Date());
  const [time, setTime] = useState<string>("");
  const [address, setAddress] = useState("");

  const { data: provider, isLoading: isProviderLoading } = useGetProvider(id, { query: { queryKey: getGetProviderQueryKey(id), enabled: !!id } });
  const { data: categories, isLoading: isCatsLoading } = useListServiceCategories();
  const createBookingMut = useCreateBooking();

  if (isProviderLoading || isCatsLoading) {
    return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }
  if (!provider) return <div>Not found</div>;

  // Filter categories to only those the provider offers
  const providerCategories = categories?.filter(c => provider.serviceCategories.includes(c.name)) || [];

  const timeSlots = ["09:00 AM", "11:00 AM", "02:00 PM", "04:00 PM", "06:00 PM"];
  const dates = Array.from({ length: 5 }).map((_, i) => addDays(new Date(), i));

  const handleNext = () => {
    if (step === 1 && !serviceCategoryId) {
      toast({ title: "Select a service", variant: "destructive" });
      return;
    }
    if (step === 2 && !time) {
      toast({ title: "Select a time", variant: "destructive" });
      return;
    }
    if (step === 3 && address.length < 5) {
      toast({ title: "Enter valid address", variant: "destructive" });
      return;
    }
    setStep(s => s + 1);
  };

  const handleConfirm = () => {
    if (!serviceCategoryId || !time) return;

    // Build ISO string for schedule
    // This is simple formatting for demo
    const formattedDate = format(date, "yyyy-MM-dd");
    // Parse time (e.g., "09:00 AM" to "09:00:00")
    const isPM = time.includes("PM");
    const [hr, min] = time.replace(/[ AM| PM]/g, "").split(":");
    let h24 = parseInt(hr, 10);
    if (isPM && h24 < 12) h24 += 12;
    if (!isPM && h24 === 12) h24 = 0;
    const timeStr = `${h24.toString().padStart(2, '0')}:${min}:00`;
    const scheduledTime = `${formattedDate}T${timeStr}Z`;

    // Estimate price based on category
    const cat = categories?.find(c => c.id === serviceCategoryId);
    const price = cat?.basePriceMin || 500;

    createBookingMut.mutate({
      data: {
        providerId: id,
        serviceCategoryId,
        scheduledTime,
        address,
        price
      }
    }, {
      onSuccess: () => {
        toast({ title: t("booking.wizard.success") });
        setLocation("/bookings");
      },
      onError: (err: any) => {
        toast({ title: "Error", description: err?.message || "Failed to book", variant: "destructive" });
      }
    });
  };

  return (
    <div className="flex flex-col h-[100dvh] bg-background">
      <header className="px-4 py-3 flex items-center border-b border-border bg-card">
        <Button variant="ghost" size="icon" onClick={() => step > 1 ? setStep(s => s - 1) : setLocation(`/providers/${id}`)} className="mr-2">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex-1">
          <h1 className="font-serif font-bold text-lg">Book {provider.name}</h1>
          <div className="flex gap-1 mt-1">
            {[1, 2, 3, 4].map(s => (
              <div key={s} className={`h-1.5 flex-1 rounded-full ${s <= step ? 'bg-primary' : 'bg-muted'}`} />
            ))}
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-4">
        {step === 1 && (
          <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
            <h2 className="text-xl font-bold font-serif mb-4">{t("booking.wizard.step1")}</h2>
            {providerCategories.map(cat => (
              <Card 
                key={cat.id} 
                className={`cursor-pointer transition-all ${serviceCategoryId === cat.id ? 'border-primary bg-primary/5' : 'hover:border-primary/30'}`}
                onClick={() => setServiceCategoryId(cat.id)}
              >
                <CardContent className="p-4 flex items-center justify-between">
                  <div>
                    <div className="font-bold text-foreground">{cat.name}</div>
                    <div className="text-sm text-muted-foreground">{cat.description}</div>
                  </div>
                  <div className="text-sm font-mono font-medium text-primary">
                    ₹{cat.basePriceMin} - ₹{cat.basePriceMax}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
            <h2 className="text-xl font-bold font-serif mb-4">{t("booking.wizard.step2")}</h2>
            
            <div>
              <label className="text-sm font-semibold text-muted-foreground mb-2 block uppercase">Select Date</label>
              <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                {dates.map((d, i) => (
                  <button
                    key={i}
                    onClick={() => setDate(d)}
                    className={`flex flex-col items-center justify-center w-16 h-20 rounded-xl border shrink-0 transition-colors ${
                      date.getDate() === d.getDate() ? 'bg-primary border-primary text-primary-foreground' : 'bg-card border-border hover:border-primary/50'
                    }`}
                  >
                    <span className="text-xs uppercase">{format(d, 'EEE')}</span>
                    <span className="text-xl font-bold">{format(d, 'd')}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-sm font-semibold text-muted-foreground mb-2 block uppercase">Select Time</label>
              <div className="grid grid-cols-2 gap-3">
                {timeSlots.map(tSlot => (
                  <button
                    key={tSlot}
                    onClick={() => setTime(tSlot)}
                    className={`py-3 rounded-lg border text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
                      time === tSlot ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-card text-foreground hover:border-primary/50'
                    }`}
                  >
                    <Clock className="w-4 h-4" />
                    {tSlot}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
            <h2 className="text-xl font-bold font-serif mb-4">{t("booking.wizard.step3")}</h2>
            <div className="space-y-2">
              <label className="text-sm font-medium">Full Address</label>
              <textarea
                className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="House no, Street, Landmark, City..."
                value={address}
                onChange={e => setAddress(e.target.value)}
              />
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
            <h2 className="text-xl font-bold font-serif mb-4">{t("booking.wizard.step4")}</h2>
            
            <Card className="bg-card">
              <CardContent className="p-4 space-y-4">
                <div className="flex justify-between border-b border-border pb-4">
                  <div className="text-muted-foreground">Provider</div>
                  <div className="font-medium">{provider.name}</div>
                </div>
                <div className="flex justify-between border-b border-border pb-4">
                  <div className="text-muted-foreground">Service</div>
                  <div className="font-medium">{categories?.find(c => c.id === serviceCategoryId)?.name}</div>
                </div>
                <div className="flex justify-between border-b border-border pb-4">
                  <div className="text-muted-foreground">When</div>
                  <div className="font-medium text-right">
                    {format(date, 'MMM d, yyyy')} <br/> {time}
                  </div>
                </div>
                <div className="flex justify-between pb-2 text-lg font-bold">
                  <div>Estimated</div>
                  <div className="text-primary font-mono">₹{categories?.find(c => c.id === serviceCategoryId)?.basePriceMin || 500}</div>
                </div>
              </CardContent>
            </Card>

            <div className="bg-secondary p-4 rounded-lg flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-accent mt-0.5 shrink-0" />
              <p className="text-sm text-secondary-foreground">
                {t("booking.wizard.cashNotice")}
              </p>
            </div>
          </div>
        )}
      </main>

      <footer className="p-4 border-t border-border bg-card">
        {step < 4 ? (
          <Button className="w-full" size="lg" onClick={handleNext}>
            {t("common.next")}
          </Button>
        ) : (
          <Button className="w-full" size="lg" onClick={handleConfirm} disabled={createBookingMut.isPending}>
            {createBookingMut.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {t("booking.wizard.confirmBtn")}
          </Button>
        )}
      </footer>
    </div>
  );
}
