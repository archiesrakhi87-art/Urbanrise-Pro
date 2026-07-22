import { useLanguage } from '@/components/language-provider';

export function LanguageToggle() {
  const { language, setLanguage } = useLanguage();

  return (
    <button
      onClick={() => setLanguage(language === 'en' ? 'ta' : 'en')}
      className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-border bg-card text-sm font-medium hover:bg-muted transition-colors"
      data-testid="button-language-toggle"
    >
      <span className={language === 'en' ? 'text-primary font-bold' : 'text-muted-foreground'}>EN</span>
      <span className="text-border">|</span>
      <span className={language === 'ta' ? 'text-primary font-bold' : 'text-muted-foreground'}>தமிழ்</span>
    </button>
  );
}
