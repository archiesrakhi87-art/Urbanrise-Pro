import { useListUpskillingModules, useGetMyUpskillingProgress } from "@workspace/api-client-react";
import { useLanguage } from "@/components/language-provider";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, Award, PlayCircle, CheckCircle2 } from "lucide-react";
import { useLocation } from "wouter";

export default function ProviderUpskilling() {
  const { t } = useLanguage();
  const [, navigate] = useLocation();

  const { data: modules, isLoading: isModsLoading } = useListUpskillingModules();
  const { data: progress, isLoading: isProgLoading } = useGetMyUpskillingProgress();

  if (isModsLoading || isProgLoading) {
    return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="p-4 space-y-6">
      {/* Progress Header */}
      <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
        <h2 className="font-serif font-bold text-lg mb-4 text-center">{t("upskilling.progress")}</h2>
        
        <div className="flex items-center justify-around mb-6">
          <div className="text-center">
            <div className="text-3xl font-bold font-mono text-primary">{progress?.completedModules || 0}</div>
            <div className="text-xs text-muted-foreground uppercase mt-1 tracking-wider">Completed</div>
          </div>
          <div className="h-10 w-px bg-border"></div>
          <div className="text-center">
            <div className="text-3xl font-bold font-mono text-accent flex items-center justify-center gap-1">
              {progress?.badgesUnlocked || 0}
            </div>
            <div className="text-xs text-muted-foreground uppercase mt-1 tracking-wider">Badges Won</div>
          </div>
        </div>

        <div className="h-2.5 bg-muted rounded-full overflow-hidden">
          <div 
            className="h-full bg-primary transition-all duration-1000 ease-out" 
            style={{ width: `${progress?.progressPercent || 0}%` }} 
          />
        </div>
        <p className="text-center text-xs text-muted-foreground mt-2 font-medium">
          {progress?.progressPercent}% to next milestone
        </p>
      </div>

      {/* Modules List */}
      <div>
        <h2 className="font-serif font-bold text-xl mb-4">Available Modules</h2>
        <div className="space-y-4">
          {modules?.map(mod => {
            const isCompleted = progress?.completedModules ? mod.id <= progress.completedModules : false; // Simplification, usually you'd check array
            // Since API returns ProviderProgress[], wait, GetMyUpskillingProgress returns ProgressSummary! 
            // So we don't have per-module completion array in this endpoint directly.
            // Oh, the `useListUpskillingModules` actually returns `completed: boolean` on the model based on session! 
            // Let's use `mod.completed`.
            
            return (
              <Card key={mod.id} className={`overflow-hidden transition-colors ${mod.completed ? 'border-primary/50 bg-primary/5' : 'border-border bg-card'}`}>
                <CardContent className="p-0">
                  <div className="p-4 flex gap-4">
                    <div className={`w-16 h-16 rounded-xl flex items-center justify-center shrink-0 ${mod.completed ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                      {mod.completed ? <Award className="w-8 h-8" /> : <PlayCircle className="w-8 h-8" />}
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <Badge variant="outline" className="text-[10px] mb-1 py-0">{mod.category}</Badge>
                        {mod.completed && <CheckCircle2 className="w-4 h-4 text-primary" />}
                      </div>
                      <h3 className="font-bold text-sm text-foreground mb-1 leading-tight">{mod.title}</h3>
                      <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{mod.completionCriteria}</p>
                      
                      {!mod.completed ? (
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="w-full text-xs h-8 border-primary text-primary hover:bg-primary hover:text-primary-foreground"
                          onClick={() => navigate(`/provider/upskilling/${mod.id}`)}
                        >
                          Start Module
                        </Button>
                      ) : (
                        <div className="flex items-center gap-2">
                          <div className="text-xs font-medium text-primary flex items-center flex-1">
                            <CheckCircle2 className="w-3 h-3 mr-1" /> Completed
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-xs h-7 text-muted-foreground hover:text-foreground px-2"
                            onClick={() => navigate(`/provider/upskilling/${mod.id}`)}
                          >
                            Re-read
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
