import { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { collection, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { 
  ClipboardList, CheckCircle2, ChevronRight, Calendar, User, 
  Plus, Trash2, Clock, CheckSquare, Square, Save, AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ActionItem {
  id: string;
  description: string;
  responsible: string;
  date: string;
  status: 'pending' | 'completed';
}

interface RecordData {
  id: string;
  docId: string;
  eventTitle: string;
  type: string;
  location: string;
  rootCause: string;
  status: string;
  actionPlan?: ActionItem[];
}

export default function PlanView() {
  const [records, setRecords] = useState<RecordData[]>([]);
  const [selectedRecord, setSelectedRecord] = useState<RecordData | null>(null);
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // New action item state
  const [newDesc, setNewDesc] = useState('');
  const [newResp, setNewResp] = useState('');
  const [newDate, setNewDate] = useState('');
  
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    // Listen to records
    const unsubRecords = onSnapshot(collection(db, 'records'), (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        docId: doc.id,
        ...doc.data()
      } as unknown as RecordData));

      // Show submitted, in_progress, for_verification, effective, or ineffective
      const activeRecords = data.filter(r => r.status !== 'draft');
      setRecords(activeRecords);
      setLoading(false);

      // Keep selection in sync
      if (selectedRecord) {
        const updated = activeRecords.find(r => r.docId === selectedRecord.docId);
        if (updated) setSelectedRecord(updated);
      } else if (activeRecords.length > 0 && !selectedRecord) {
        setSelectedRecord(activeRecords[0]);
      }
    });

    // Listen to employees
    const unsubEmployees = onSnapshot(collection(db, 'employees'), (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setEmployees(data.sort((a: any, b: any) => a.name.localeCompare(b.name)));
    });

    return () => {
      unsubRecords();
      unsubEmployees();
    };
  }, [selectedRecord]);

  const handleAddActionItem = async () => {
    if (!selectedRecord || !newDesc || !newResp || !newDate) return;
    
    setIsSaving(true);
    try {
      const existingPlan = selectedRecord.actionPlan || [];
      const newItem: ActionItem = {
        id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 9),
        description: newDesc,
        responsible: newResp,
        date: newDate,
        status: 'pending'
      };

      const updatedPlan = [...existingPlan, newItem];
      
      // If moving from submitted -> in_progress since action is added
      let nextStatus = selectedRecord.status;
      if (nextStatus === 'submitted') {
        nextStatus = 'in_progress';
      }

      const docRef = doc(db, 'records', selectedRecord.docId);
      await updateDoc(docRef, {
        actionPlan: updatedPlan,
        status: nextStatus
      });

      // Reset input fields
      setNewDesc('');
      setNewResp('');
      setNewDate('');
      
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    } catch (error) {
      console.error("Error adding action item:", error);
      alert("Houve um erro ao adicionar a ação.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleItemStatus = async (itemId: string, currentItemStatus: 'pending' | 'completed') => {
    if (!selectedRecord) return;
    
    const existingPlan = selectedRecord.actionPlan || [];
    const updatedPlan = existingPlan.map(item => {
      if (item.id === itemId) {
        return { ...item, status: currentItemStatus === 'pending' ? 'completed' : 'pending' } as ActionItem;
      }
      return item;
    });

    // Auto status determination:
    // If all items are completed, change status to 'for_verification'
    // If at least one item is pending, keep as 'in_progress'
    const allCompleted = updatedPlan.length > 0 && updatedPlan.every(item => item.status === 'completed');
    let nextStatus = selectedRecord.status;
    if (allCompleted) {
      nextStatus = 'for_verification';
    } else if (updatedPlan.some(item => item.status === 'pending') && (nextStatus === 'for_verification' || nextStatus === 'submitted')) {
      nextStatus = 'in_progress';
    }

    try {
      const docRef = doc(db, 'records', selectedRecord.docId);
      await updateDoc(docRef, {
        actionPlan: updatedPlan,
        status: nextStatus
      });
    } catch (error) {
      console.error("Error updating item status:", error);
    }
  };

  const handleRemoveActionItem = async (itemId: string) => {
    if (!selectedRecord) return;
    
    const existingPlan = selectedRecord.actionPlan || [];
    const updatedPlan = existingPlan.filter(item => item.id !== itemId);

    // If no action plan items remain, potentially rollback status to 'submitted'
    let nextStatus = selectedRecord.status;
    if (updatedPlan.length === 0 && nextStatus === 'in_progress') {
      nextStatus = 'submitted';
    }

    try {
      const docRef = doc(db, 'records', selectedRecord.docId);
      await updateDoc(docRef, {
        actionPlan: updatedPlan,
        status: nextStatus
      });
    } catch (error) {
      console.error("Error removing item:", error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-20" id="plan-view-spinner">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8" id="plan-view-container">
      {/* Header Panel */}
      <div>
        <h2 className="text-3xl font-black text-gray-900 tracking-tight flex items-center gap-3">
          <ClipboardList className="size-8 text-primary" />
          PLANO DE ACÃO (5W2H / ISO 9001)
        </h2>
        <p className="text-sm text-gray-500 font-bold uppercase tracking-widest mt-1">
          Gerenciamento e execução das ações preventivas e corretivas
        </p>
      </div>

      {records.length === 0 ? (
        <div className="p-16 text-center bg-white rounded-3xl border border-gray-100 shadow-sm">
          <ClipboardList className="size-16 text-primary mx-auto mb-4 opacity-25" />
          <p className="text-gray-500 font-bold text-lg">Nenhum registro para criação de plano.</p>
          <p className="text-gray-400 text-sm mt-1">Crie e envie um relatório de Não Conformidade primeiro.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left panel: Record list */}
          <div className="lg:col-span-4 bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-4 h-fit max-h-[800px] overflow-y-auto">
            <h3 className="text-[11px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-50 pb-2">
              Não Conformidades Ativas
            </h3>
            <div className="space-y-2">
              {records.map((rec) => {
                const isSelected = selectedRecord?.docId === rec.docId;
                const totalActions = rec.actionPlan?.length || 0;
                const completedActions = rec.actionPlan?.filter(a => a.status === 'completed').length || 0;
                
                return (
                  <button
                    key={rec.docId}
                    type="button"
                    onClick={() => setSelectedRecord(rec)}
                    className={`w-full text-left p-4 rounded-2xl transition-all border flex flex-col gap-2 ${
                      isSelected 
                        ? 'bg-primary/5 border-primary shadow-sm' 
                        : 'border-gray-50 bg-gray-50/50 hover:bg-gray-50 hover:border-gray-200'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black text-primary uppercase tracking-wider">
                        #{rec.id}
                      </span>
                      <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded ${
                        rec.status === 'submitted' ? 'bg-orange-50 text-orange-600' :
                        rec.status === 'in_progress' ? 'bg-blue-50 text-blue-600' : 'bg-green-50 text-green-600'
                      }`}>
                        {rec.status === 'submitted' ? 'Aguardando' :
                         rec.status === 'in_progress' ? 'Em Progresso' :
                         rec.status === 'for_verification' ? 'Aguardando Eficácia' : rec.status}
                      </span>
                    </div>
                    <h4 className="font-bold text-gray-900 text-sm line-clamp-1">{rec.eventTitle}</h4>
                    
                    {/* Action Plan Progress Bar */}
                    <div className="space-y-1 mt-1">
                      <div className="flex justify-between items-center text-[10px] text-gray-500 font-bold uppercase tracking-tight">
                        <span>Ações Ativas</span>
                        <span>{completedActions}/{totalActions}</span>
                      </div>
                      <div className="w-full h-1.5 bg-gray-200/50 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-primary transition-all duration-300"
                          style={{ width: `${totalActions > 0 ? (completedActions / totalActions) * 100 : 0}%` }}
                        />
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right panel: Active Action Plan detail & manager */}
          <div className="lg:col-span-8 space-y-6">
            {selectedRecord && (
              <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm space-y-8">
                
                {/* Information Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gray-50 p-6 rounded-2xl border border-gray-100">
                  <div>
                    <span className="text-xs font-black text-primary uppercase tracking-wider">Plano de Ação para</span>
                    <h3 className="font-extrabold text-gray-900 text-xl tracking-tight mt-1">
                      {selectedRecord.id} - {selectedRecord.eventTitle}
                    </h3>
                    <p className="text-gray-500 text-xs font-bold mt-1 uppercase tracking-wider">
                      Causa Raiz Identificada: <span className="text-primary italic">{selectedRecord.rootCause || 'Não declarada ainda'}</span>
                    </p>
                  </div>
                </div>

                {/* Status Indicator */}
                {selectedRecord.status === 'for_verification' && (
                  <div className="bg-green-50 text-green-700 p-4 rounded-xl border border-green-100 text-xs font-bold flex items-center gap-2">
                    <CheckCircle2 className="size-5 shrink-0" />
                    <span>Todas as ações do plano foram concluídas! O registro agora está pronto para verificação de eficácia.</span>
                  </div>
                )}

                {/* Form to Add Action Item */}
                <div className="p-6 bg-gray-50/50 rounded-2xl border border-gray-100 space-y-4">
                  <h4 className="text-xs font-black text-gray-900 uppercase tracking-widest flex items-center gap-2">
                    <Plus className="size-4 text-primary" />
                    Adicionar Nova Ação ao Plano
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                    <div className="md:col-span-6 flex flex-col">
                      <label className="text-[9px] font-black text-gray-500 uppercase tracking-wider mb-1">O que fazer? (Descrição da Ação)</label>
                      <input
                        type="text"
                        placeholder="Ex: Refazer calibração mecânica mensal..."
                        className="bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-xs font-bold text-gray-700 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary placeholder:text-gray-300"
                        value={newDesc}
                        onChange={(e) => setNewDesc(e.target.value)}
                      />
                    </div>
                    <div className="md:col-span-3 flex flex-col">
                      <label className="text-[9px] font-black text-gray-500 uppercase tracking-wider mb-1">Quem fará? (Responsável)</label>
                      <select
                        className="bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-xs font-bold text-gray-700 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                        value={newResp}
                        onChange={(e) => setNewResp(e.target.value)}
                      >
                        <option value="">Selecione...</option>
                        {employees.map(emp => (
                          <option key={emp.id} value={`${emp.name} (${emp.sector})`}>
                            {emp.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="md:col-span-3 flex flex-col">
                      <label className="text-[9px] font-black text-gray-500 uppercase tracking-wider mb-1">Quando fará? (Prazo)</label>
                      <input
                        type="date"
                        className="bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-xs font-bold text-gray-700 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                        value={newDate}
                        onChange={(e) => setNewDate(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="flex justify-end pt-2">
                    <button
                      type="button"
                      onClick={handleAddActionItem}
                      disabled={!newDesc || !newResp || !newDate || isSaving}
                      className="bg-primary text-white font-bold text-xs uppercase tracking-widest px-6 py-2.5 rounded-xl hover:bg-primary-dark transition-all disabled:opacity-40"
                    >
                      Adicionar Ação
                    </button>
                  </div>
                </div>

                {/* List of actions */}
                <div className="space-y-4">
                  <h4 className="text-xs font-black text-gray-900 uppercase tracking-widest border-b border-gray-100 pb-2 flex items-center justify-between">
                    <span>Ações Planejadas</span>
                    <span className="text-[10px] text-gray-400 normal-case">{selectedRecord.actionPlan?.length || 0} ações registradas</span>
                  </h4>

                  <div className="space-y-2">
                    {selectedRecord.actionPlan && selectedRecord.actionPlan.length > 0 ? (
                      selectedRecord.actionPlan.map((item) => {
                        const isCompleted = item.status === 'completed';
                        return (
                          <div 
                            key={item.id}
                            className={`p-4 rounded-xl border flex items-center justify-between transition-all gap-4 ${
                              isCompleted 
                                ? 'bg-green-50/20 border-green-100' 
                                : 'bg-white border-gray-100 shadow-sm'
                            }`}
                          >
                            <button
                              type="button"
                              onClick={() => handleToggleItemStatus(item.id, item.status)}
                              className="size-5 shrink-0 text-primary cursor-pointer hover:opacity-80 transition-opacity flex items-center justify-center border border-gray-300 rounded"
                            >
                              {isCompleted ? (
                                <CheckSquare className="size-4 text-green-600 fill-green-50" />
                              ) : (
                                <Square className="size-4 text-gray-400" />
                              )}
                            </button>

                            <div className="flex-1 min-w-0">
                              <p className={`text-xs font-bold text-gray-800 leading-tight ${isCompleted ? 'line-through text-gray-400 font-medium' : ''}`}>
                                {item.description}
                              </p>
                              
                              <div className="flex flex-wrap gap-x-4 gap-y-1 items-center mt-1">
                                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider flex items-center gap-1">
                                  <User className="size-3 text-primary" /> {item.responsible}
                                </span>
                                <span className={`text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 ${
                                  isCompleted ? 'text-gray-400' : 'text-primary'
                                }`}>
                                  <Calendar className="size-3" /> {new Date(item.date).toLocaleDateString('pt-BR')}
                                </span>
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() => handleRemoveActionItem(item.id)}
                              className="text-gray-300 hover:text-red-500 transition-colors"
                              title="Remover Ação"
                            >
                              <Trash2 className="size-4" />
                            </button>
                          </div>
                        );
                      })
                    ) : (
                      <div className="p-8 text-center border-2 border-dashed border-gray-150 rounded-xl space-y-2">
                        <Clock className="size-8 text-gray-300 mx-auto" />
                        <p className="text-[11px] text-gray-400 font-bold uppercase tracking-widest leading-none">Nenhuma ação planejada ainda</p>
                        <p className="text-xs text-gray-400">Adicione ações operacionais no campo acima para iniciar a execução do plano.</p>
                      </div>
                    )}
                  </div>
                </div>

              </div>
            )}
          </div>

        </div>
      )}
    </div>
  );
}
