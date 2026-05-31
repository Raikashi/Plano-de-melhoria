import { Search, Bell, Settings } from 'lucide-react';

export default function Header() {
  return (
    <header className="flex justify-between items-center px-8 h-16 w-full bg-bg/80 backdrop-blur-md sticky top-0 z-30 border-b border-border/60">
      <div className="flex items-center gap-4">
        <span className="text-xl font-bold text-text font-headline tracking-tighter">Architectural Auditor</span>
        
        <div className="hidden lg:flex items-center bg-slate-100/50 px-4 py-1.5 rounded-full ml-4 group focus-within:ring-2 ring-primary/20 transition-all border border-border/50">
          <Search className="text-text-muted size-4 group-focus-within:text-primary transition-colors" />
          <input 
            type="text" 
            className="bg-transparent border-none focus:ring-0 text-sm w-48 text-text ml-2 outline-none placeholder:text-text-muted/60" 
            placeholder="Pesquisar auditorias..."
          />
        </div>
      </div>

      <div className="flex items-center gap-6">
        <div className="flex items-center gap-4">
          <button className="text-text-muted hover:text-primary transition-colors relative">
            <Bell className="size-5" />
            <span className="absolute top-0 right-0 size-2 bg-primary rounded-full border-2 border-bg"></span>
          </button>
          <button className="text-text-muted hover:text-primary transition-colors">
            <Settings className="size-5" />
          </button>
        </div>

        <div className="flex items-center gap-3 pl-4 border-l border-border/60">
          <div className="text-right hidden sm:block">
            <p className="text-xs font-bold text-text">Silvio Santos</p>
            <p className="text-[10px] text-text-muted">Auditor Líder</p>
          </div>
          <div className="relative">
            <img 
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuBLwfmmuimbeEbStXQdCrirlNWElzUDr4xuVR99Y_IsfGJlywJ-nxKQdJDH0o-kiE3Kzkv6Rhy8I0hMsxg2v4T4byVvl8kJW8VrWJa-sS-YOXtcPsGZLkkawwX-3ORlEztTMhYiPehPmXe4vVtSMOnAKnkL-o8faNBG0WyXA_bUeL-FBLZn-85dNjcSuxxGFA2ROgromBlaDXsJVMfeH2GkrB64sLveOu2CbNE9pIf-W3hHTIH3qaHBRsi6BlzctfEoUtVvEqhMKhIx" 
              alt="Profile" 
              className="w-8 h-8 rounded-full border border-border shadow-sm object-cover"
              referrerPolicy="no-referrer"
            />
            <span className="absolute bottom-0 right-0 size-2.5 bg-green-500 rounded-full border-2 border-bg"></span>
          </div>
        </div>
      </div>
    </header>
  );
}
