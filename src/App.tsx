/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import NonConformityForm from './components/forms/NonConformityForm';
import Dashboard from './components/Dashboard';
import RcaView from './components/RcaView';
import PlanView from './components/PlanView';
import EfficacyView from './components/EfficacyView';
import { LayoutDashboard, AlertCircle, BrainCircuit, Settings, Plus, FileText, CheckCircle } from 'lucide-react';

type View = 'dashboard' | 'forms' | 'rca' | 'plan' | 'efficacy';

export default function App() {
  const [activeView, setActiveView] = useState<View>('dashboard');
  const [formKey, setFormKey] = useState(0);

  const handleNewAction = () => {
    setActiveView('forms');
    setFormKey(prev => prev + 1);
  };

  return (
    <div className="flex min-h-screen bg-surface">
      <Sidebar 
        activeView={activeView} 
        onViewChange={setActiveView} 
        onNewAction={handleNewAction} 
      />
      
      <main className="flex-1 md:ml-64 flex flex-col relative pb-20 md:pb-0">
        <Header />
        
        <div className="flex-1">
          {activeView === 'dashboard' && <Dashboard />}
          {activeView === 'forms' && <NonConformityForm key={formKey} />}
          {activeView === 'rca' && <RcaView />}
          {activeView === 'plan' && <PlanView />}
          {activeView === 'efficacy' && <EfficacyView />}
        </div>

        {/* Mobile Bottom Navigation */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-bg border-t border-border/50 z-50 px-6 py-3 flex justify-between items-center shadow-[0_-4px_20px_rgba(0,0,0,0.5)]">
          <button 
            onClick={() => setActiveView('dashboard')}
            className={`flex flex-col items-center gap-1 ${activeView === 'dashboard' ? 'text-primary' : 'text-text-muted'}`}
          >
            <LayoutDashboard className="size-5" />
            <span className="text-[10px] font-bold">Início</span>
          </button>
          <button 
            onClick={() => setActiveView('forms')}
            className={`flex flex-col items-center gap-1 ${activeView === 'forms' ? 'text-primary' : 'text-text-muted'}`}
          >
            <AlertCircle className="size-5" />
            <span className="text-[10px] font-bold">Formulário</span>
          </button>
          
          <button 
            onClick={handleNewAction}
            className="bg-primary text-white p-3 rounded-full -mt-10 shadow-2xl border-4 border-bg active:scale-95 transition-transform"
          >
            <Plus className="size-6" />
          </button>

          <button 
            onClick={() => setActiveView('rca')}
            className={`flex flex-col items-center gap-1 ${activeView === 'rca' ? 'text-primary' : 'text-text-muted'}`}
          >
            <BrainCircuit className="size-5" />
            <span className="text-[10px] font-bold">RCA</span>
          </button>
          <button className="text-text-muted flex flex-col items-center gap-1">
            <Settings className="size-5" />
            <span className="text-[10px] font-bold">Config</span>
          </button>
        </nav>
      </main>
    </div>
  );
}

