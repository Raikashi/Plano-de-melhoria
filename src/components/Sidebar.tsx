import { 
  LayoutDashboard, 
  AlertTriangle, 
  BrainCircuit, 
  FileText, 
  ShieldCheck, 
  Plus, 
  History, 
  HelpCircle 
} from 'lucide-react';
import { motion } from 'motion/react';

interface SidebarProps {
  activeView: string;
  onViewChange: (view: any) => void;
  onNewAction?: () => void;
}

export default function Sidebar({ activeView, onViewChange, onNewAction }: SidebarProps) {
  const menuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', id: 'dashboard' },
    { icon: AlertTriangle, label: 'Não Conformidades', id: 'forms' },
    { icon: BrainCircuit, label: 'Análise de Causa Raiz', id: 'rca' },
    { icon: FileText, label: 'Plano de Ação', id: 'plan' },
    { icon: ShieldCheck, label: 'Eficácia', id: 'efficacy' },
  ];

  return (
    <aside className="hidden md:flex flex-col h-screen w-64 fixed left-0 top-0 bg-white py-6 border-r border-border/60">
      <div className="px-8 mb-8">
        <h1 className="text-lg font-black text-text leading-tight underline decoration-primary decoration-4 underline-offset-4">CRM ISO 9001</h1>
        <p className="text-[10px] uppercase tracking-[0.1em] text-text-muted mt-2">Gestão da Qualidade</p>
      </div>

      <nav className="flex-1 space-y-1">
        {menuItems.map((item) => {
          const isActive = activeView === item.id;
          return (
            <button
              key={item.id}
              onClick={(e) => {
                e.preventDefault();
                onViewChange(item.id);
              }}
              className={`w-full flex items-center pl-8 py-3 group transition-all relative ${
                isActive 
                  ? 'text-primary font-bold' 
                  : 'text-text-muted hover:text-primary'
              }`}
            >
              <item.icon className={`mr-3 size-5 ${isActive ? 'text-primary' : 'group-hover:text-primary transition-colors'}`} />
              <span className="text-sm font-medium">{item.label}</span>
              {isActive && (
                <motion.div 
                  layoutId="active-pill"
                  className="absolute inset-y-1 left-4 right-0 bg-slate-50 border-l border-y border-border -z-10 shadow-sm"
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                />
              )}
            </button>
          );
        })}
      </nav>

      <div className="mt-auto px-4">
        <button 
          onClick={onNewAction}
          className="w-full bg-primary text-white py-3 rounded-xl font-bold text-sm shadow-xl shadow-primary/20 hover:opacity-90 transition-all flex items-center justify-center gap-2"
        >
          <Plus className="size-4" />
          Nova Ação Corretiva
        </button>
      </div>

      <div className="mt-8 border-t border-border/40 pt-6">
        <a className="flex items-center text-text-muted hover:text-primary pl-8 py-2 transition-colors" href="#">
          <History className="mr-3 size-4" />
          <span className="text-xs">Logs de Auditoria</span>
        </a>
        <a className="flex items-center text-text-muted hover:text-primary pl-8 py-2 transition-colors" href="#">
          <HelpCircle className="mr-3 size-4" />
          <span className="text-xs">Central de Ajuda</span>
        </a>
      </div>
    </aside>
  );
}
