import { useState } from "react";
import { useListLocalPartners, useCreateLocalPartner, useDeleteLocalPartner, getListLocalPartnersQueryKey } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Trash2, Plus, Store, Building2, HelpingHand } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

export default function AdminPartners() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: partners, isLoading } = useListLocalPartners();
  const createMut = useCreateLocalPartner();
  const deleteMut = useDeleteLocalPartner();

  const [isAdding, setIsAdding] = useState(false);
  const [name, setName] = useState("");
  const [type, setType] = useState("shop");
  const [region, setRegion] = useState("");
  const [contactInfo, setContactInfo] = useState("");

  const handleCreate = () => {
    createMut.mutate({
      data: { name, type, region, contactInfo }
    }, {
      onSuccess: () => {
        toast({ title: "Partner added" });
        queryClient.invalidateQueries({ queryKey: getListLocalPartnersQueryKey() });
        setIsAdding(false);
        setName(""); setRegion(""); setContactInfo("");
      },
      onError: () => toast({ title: "Error", variant: "destructive" })
    });
  };

  const handleDelete = (id: number) => {
    if (!confirm("Delete partner?")) return;
    deleteMut.mutate({ id }, {
      onSuccess: () => {
        toast({ title: "Partner deleted" });
        queryClient.invalidateQueries({ queryKey: getListLocalPartnersQueryKey() });
      }
    });
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "shop": return <Store className="w-5 h-5 text-blue-500" />;
      case "NGO": return <HelpingHand className="w-5 h-5 text-green-500" />;
      case "municipal": return <Building2 className="w-5 h-5 text-purple-500" />;
      default: return <Store className="w-5 h-5 text-gray-500" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-serif font-bold">Local Partner Directory</h2>
        <Button onClick={() => setIsAdding(!isAdding)}>
          <Plus className="w-4 h-4 mr-2" /> Add Partner
        </Button>
      </div>

      {isAdding && (
        <Card className="border-primary shadow-md">
          <CardContent className="p-6">
            <h3 className="font-bold mb-4">New Partner</h3>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="text-sm font-semibold mb-1 block">Name</label>
                <Input value={name} onChange={e => setName(e.target.value)} />
              </div>
              <div>
                <label className="text-sm font-semibold mb-1 block">Region/City</label>
                <Input value={region} onChange={e => setRegion(e.target.value)} />
              </div>
              <div>
                <label className="text-sm font-semibold mb-1 block">Type</label>
                <select 
                  className="w-full h-10 px-3 py-2 border border-input rounded-md bg-background text-sm"
                  value={type}
                  onChange={e => setType(e.target.value)}
                >
                  <option value="shop">Local Shop</option>
                  <option value="NGO">NGO</option>
                  <option value="municipal">Municipal Body</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-semibold mb-1 block">Contact Info</label>
                <Input value={contactInfo} onChange={e => setContactInfo(e.target.value)} />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsAdding(false)}>Cancel</Button>
              <Button onClick={handleCreate} disabled={createMut.isPending}>
                {createMut.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Save
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {isLoading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {partners?.map(partner => (
            <Card key={partner.id}>
              <CardContent className="p-5 flex items-start gap-4">
                <div className="p-3 bg-muted rounded-xl">
                  {getIcon(partner.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-foreground truncate">{partner.name}</h3>
                  <div className="text-sm text-muted-foreground capitalize mb-2">{partner.type} • {partner.region}</div>
                  <div className="text-xs text-muted-foreground font-mono truncate">{partner.contactInfo}</div>
                </div>
                <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10" onClick={() => handleDelete(partner.id)}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
