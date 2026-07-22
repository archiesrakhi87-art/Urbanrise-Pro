import { useState, useEffect } from "react";
import { useGetMyProvider, useUpdateProviderProfile, useLogout, getGetMyProviderQueryKey } from "@workspace/api-client-react";
import { useLanguage } from "@/components/language-provider";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, LogOut, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

export default function ProviderProfileEditor() {
  const { t } = useLanguage();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();

  const { data: provider, isLoading } = useGetMyProvider();
  const updateMut = useUpdateProviderProfile();
  const logoutMut = useLogout();

  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [city, setCity] = useState("");
  const [priceList, setPriceList] = useState("");
  const [langs, setLangs] = useState<string[]>([]);

  useEffect(() => {
    if (provider) {
      setName(provider.name || "");
      setBio(provider.bio || "");
      setCity(provider.city || "");
      setPriceList(provider.priceList || "");
      setLangs(provider.languagesSpoken || []);
    }
  }, [provider]);

  if (isLoading) {
    return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  const handleSave = () => {
    updateMut.mutate({
      data: {
        name,
        bio,
        city,
        priceList,
        languagesSpoken: langs
      }
    }, {
      onSuccess: () => {
        toast({ title: "Profile updated successfully!" });
        queryClient.invalidateQueries({ queryKey: getGetMyProviderQueryKey() });
      },
      onError: () => {
        toast({ title: "Failed to update profile", variant: "destructive" });
      }
    });
  };

  const handleLogout = () => {
    logoutMut.mutate(undefined, {
      onSuccess: () => {
        queryClient.clear();
        setLocation("/login");
      }
    });
  };

  return (
    <div className="p-4 space-y-6">
      <div className="flex justify-center mb-6">
        <div className="relative">
          {provider?.photoUrl ? (
            <img src={provider.photoUrl} alt="" className="w-24 h-24 rounded-full object-cover border-4 border-background shadow-lg" />
          ) : (
            <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center text-3xl border-4 border-background shadow-lg">👤</div>
          )}
          {provider?.kycStatus === "approved" && (
            <div className="absolute bottom-0 right-0 bg-background rounded-full p-0.5">
              <CheckCircle2 className="w-6 h-6 text-green-600 fill-green-100" />
            </div>
          )}
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <label className="text-sm font-semibold mb-1 block">Full Name</label>
          <Input value={name} onChange={e => setName(e.target.value)} />
        </div>
        
        <div>
          <label className="text-sm font-semibold mb-1 block">City</label>
          <Input value={city} onChange={e => setCity(e.target.value)} />
        </div>

        <div>
          <label className="text-sm font-semibold mb-1 block">Bio</label>
          <textarea 
            className="w-full min-h-[100px] p-3 text-sm rounded-md border border-input bg-background"
            value={bio}
            onChange={e => setBio(e.target.value)}
          />
        </div>

        <div>
          <label className="text-sm font-semibold mb-1 block">Price List</label>
          <textarea 
            className="w-full min-h-[100px] p-3 text-sm font-mono rounded-md border border-input bg-background placeholder:font-sans"
            placeholder="Fan repair: ₹200&#10;Wiring checking: ₹500"
            value={priceList}
            onChange={e => setPriceList(e.target.value)}
          />
          <p className="text-xs text-muted-foreground mt-1">Make prices clear and transparent for residents.</p>
        </div>

        <Button className="w-full" size="lg" onClick={handleSave} disabled={updateMut.isPending}>
          {updateMut.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
          {t("common.save")}
        </Button>
      </div>

      <div className="pt-8 border-t border-border mt-8">
        <Button variant="outline" className="w-full text-destructive hover:bg-destructive/10 hover:text-destructive" onClick={handleLogout}>
          <LogOut className="w-4 h-4 mr-2" />
          {t("common.logout")}
        </Button>
      </div>
    </div>
  );
}
