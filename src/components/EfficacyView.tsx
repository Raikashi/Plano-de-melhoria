import { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { collection, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { 
  CheckCircle2, AlertTriangle, Calendar, User, ShieldAlert,
  ClipboardList, ThumbsUp, ThumbsDown, MessageSquare, Save
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ActionItem {
  id: string;
  description: string;
  responsible: string;
  date: string;
  status: 'pending' | 'completed';
}

interface EfficacyData {
  date: string;
  responsible: string;
  result: 'effective' | 'ineffective';
  note: string;
}

interface RecordData {
  id: string;
  docId: string;
  eventTitle: string;
  type: string;
  location: string;
  description: string;
  rootCause: string;
  status: string;
  actionPlan?: ActionItem[];
  efficacyVerification?: EfficacyData;
}

export default function EfficacyView() {
  const [records, setRecords] = useState<RecordData[]>([]);
  const [selectedRecord, setSelectedRecord] = useState<RecordData | null>(null);
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Efficacy assessment states
  const [evalDate, setEvalDate] = useState(new Date().toISOString().split('T')[0]);
  const [evaluator, setEvaluator] = useState('');
  const [evalResult, setEvalResult] = useState<'effective' | 'ineffective'>('effective');
  const [evalNote, setEvalNote] = useState('');

  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    // Listen to records
    const unsubRecords = onSnapshot(collection(db, 'records'), (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        docId: doc.id,
        ...doc.data()
      } as unknown as RecordData));

      // Show records that are awaiting efficacy verification, or have already been assessed
      const activeRecords = data.filter(r => 
        r.status === 'for_verification' || 
        r.status === 'effective' || 
        r.status === 'ineffective'
      );
      setRecords(activeRecords);
      setLoading(false);

      // Synced selection
      if (selectedRecord) {
        const updated = activeRecords.find(r => r.docId === selectedRecord.docId);
        if (updated) setSelectedRecord(updated);
      } else if (activeRecords.length > 0 && !selectedRecord) {
        setSelectedRecord(activeRecords[0]);
      }
    });

    // Listen to employees for evaluator field
    const unsubEmployees = onSnapshot(collection(db, 'employees'), (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setEmployees(data.sort((a: any, b: any) => a.name.localeCompare(b.name)));
    });

    return () => {
      unsubRecords();
      unsubEmployees();
    };
  }, [selectedRecord]);

  // Load selection details
  useEffect(() => {
    if (selectedRecord) {
      if (selectedRecord.efficacyVerification) {
        setEvalDate(selectedRecord.efficacyVerification.date || '');
        setEvaluator(selectedRecord.efficacyVerification.responsible || '');
        setEvalResult(selectedRecord.efficacyVerification.result || 'effective');
        setEvalNote(selectedRecord.efficacyVerification.note || '');
      } else {
        setEvalDate(new Date().toISOString().split('T')[0]);
        setEvaluator('');
        setEvalResult('effective');
        setEvalNote('');
      }
    }
  }, [selectedRecord]);

  const handleSubmitEvaluation = async () => {
    if (!selectedRecord || !evaluator || !evalNote) return;

    setIsSaving(true);
    try {
      const docRef = doc(db, 'records', selectedRecord.docId);
      
      const verification: EfficacyData = {
        date: evalDate,
        responsible: evaluator,
        result: evalResult,
        note: evalNote
      };

      await updateDoc(docRef, {
        efficacyVerification: verification,
        status: evalResult // 'effective' or 'ineffective'
      });

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    } catch (error) {
      console.error("Error saving efficacy assessment:", error);
      alert("Houve um erro ao registrar a eficácia.");
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-20" id="efficacy-view-spinner">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8" id="efficacy-view-container">
      {/* Header Panel */}
      <div>
        <h2 className="text-3xl font-black text-gray-900 tracking-tight flex items-center gap-3">
          <CheckCircle2 className="size-8 text-primary" />
          VERIFICAÇÃO DE EFICÁCIA
        </h2>
        <p className="text-sm text-gray-500 font-bold uppercase tracking-widest mt-1">
          Monitoramento e validação dos resultados pós plano de ação (ISO 9001)
        </p>
      </div>

      {records.length === 0 ? (
        <div className="p-16 text-center bg-white rounded-3xl border border-gray-100 shadow-sm">
          <CheckCircle2 className="size-16 text-primary mx-auto mb-4 opacity-25" />
          <p className="text-gray-500 font-bold text-lg">Nenhum registro para verificação de eficácia no momento.</p>
          <p className="text-gray-400 text-sm mt-1">O plano de ação deve ter todas as ações completas para habilitar esta etapa.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left panel: Record list */}
          <div className="lg:col-span-4 bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-4 h-fit max-h-[800px] overflow-y-auto">
            <h3 className="text-[11px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-50 pb-2">
              Registros para Avaliação
            </h3>
            <div className="space-y-2">
              {records.map((rec) => {
                const isSelected = selectedRecord?.docId === rec.docId;
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
                        rec.status === 'for_verification' ? 'bg-orange-50 text-orange-600' :
                        rec.status === 'effective' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'
                      }`}>
                        {rec.status === 'for_verification' ? 'Aguardando' :
                         rec.status === 'effective' ? '✓ Eficaz' : '✗ Ineficaz'}
                      </span>
                    </div>
                    <h4 className="font-bold text-gray-900 text-sm line-clamp-1">{rec.eventTitle}</h4>
                    <p className="text-[11px] text-gray-400 line-clamp-1">{rec.location}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right panel: Assessor Form & Summary */}
          <div className="lg:col-span-8 space-y-6">
            {selectedRecord && (
              <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm space-y-8">
                
                {/* Information Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gray-50 p-6 rounded-2xl border border-gray-100">
                  <div>
                    <span className="text-xs font-black text-primary uppercase tracking-wider">Pós-Plano de Ação</span>
                    <h3 className="font-extrabold text-gray-900 text-xl tracking-tight mt-1">
                      {selectedRecord.id} - {selectedRecord.eventTitle}
                    </h3>
                    <p className="text-gray-500 text-xs font-bold mt-1 uppercase tracking-wider">
                      Causa Raiz Estudada: <span className="text-primary italic">{selectedRecord.rootCause || 'Não declarada'}</span>
                    </p>
                  </div>
                </div>

                {/* Main Visual Stamps (Clean and High Contrast) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Summary of Description & Actions */}
                  <div className="bg-gray-50/50 p-6 rounded-2xl border border-gray-100 space-y-4">
                    <h4 className="text-xs font-black text-gray-900 uppercase tracking-widest border-b border-gray-100 pb-2">
                      Informações de Origem
                    </h4>
                    <div className="space-y-3">
                      <div>
                        <p className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">Descrição do Desvio</p>
                        <p className="text-xs text-gray-700 leading-tight block line-clamp-3">{selectedRecord.description}</p>
                      </div>
                      <div>
                        <p className="text-[9px] text-gray-400 font-bold uppercase tracking-wider mt-2">Ações Executadas ({selectedRecord.actionPlan?.length || 0})</p>
                        <ul className="text-xs text-gray-700 space-y-1 list-disc pl-4">
                          {selectedRecord.actionPlan?.map((item) => (
                            <li key={item.id} className="line-clamp-1">
                              {item.description} ({item.responsible})
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>

                  {/* Stamp Panel */}
                  <div className="flex flex-col justify-center items-center p-6 border-2 border-dashed border-gray-150 rounded-2xl bg-gray-50/30">
                    {selectedRecord.status === 'for_verification' ? (
                      <div className="text-center space-y-2">
                        <ShieldAlert className="size-12 text-orange-400 mx-auto" />
                        <h5 className="font-extrabold text-gray-800 text-sm uppercase tracking-tight">Pendente de Avaliação</h5>
                        <p className="text-xs text-gray-400 max-w-xs leading-tight">Implementado plano. Monitore nas próximas semanas antes de avaliar como eficaz.</p>
                      </div>
                    ) : selectedRecord.status === 'effective' ? (
                      <div className="text-center space-y-2">
                        <div className="inline-block px-6 py-3 border-4 border-green-500 rounded-lg text-green-500 text-lg font-black tracking-widest uppercase rotate-[-3deg] shadow-lg shadow-green-100 bg-white">
                          EFICAZ
                        </div>
                        <p className="text-xs text-gray-500 font-bold pt-2 uppercase tracking-tight">Avaliado como efetivo</p>
                        <p className="text-[10px] text-gray-400 italic">Retorno operacional normalizado</p>
                      </div>
                    ) : (
                      <div className="text-center space-y-2">
                        <div className="inline-block px-6 py-3 border-4 border-red-500 rounded-lg text-red-500 text-lg font-black tracking-widest uppercase rotate-[-3deg] shadow-lg shadow-red-100 bg-white">
                          INEFICAZ
                        </div>
                        <p className="text-xs text-gray-500 font-bold pt-2 uppercase tracking-tight">Ações sem eficácia</p>
                        <p className="text-[10px] text-red-500 font-medium">Requer re-análise cíclica!</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Verification Evaluation Editor Form */}
                <div className="p-6 bg-gray-50/50 rounded-2xl border border-gray-100 space-y-6">
                  <h4 className="text-xs font-black text-gray-900 uppercase tracking-widest flex items-center gap-2 border-b border-gray-100/60 pb-2">
                    <ClipboardList className="size-4 text-primary" />
                    {selectedRecord.status === 'for_verification' ? 'Lançar Formulário de Avaliação' : 'Alterar Histórico de Avaliação'}
                  </h4>

                  <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                    <div className="md:col-span-3 flex flex-col">
                      <label className="text-[9px] font-black text-gray-500 uppercase tracking-wider mb-1">Data de Avaliação</label>
                      <input
                        type="date"
                        className="bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-xs font-bold text-gray-700 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                        value={evalDate}
                        onChange={(e) => setEvalDate(e.target.value)}
                      />
                    </div>

                    <div className="md:col-span-4 flex flex-col">
                      <label className="text-[9px] font-black text-gray-500 uppercase tracking-wider mb-1">Avaliador (Representante)</label>
                      <select
                        className="bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-xs font-bold text-gray-700 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                        value={evaluator}
                        onChange={(e) => setEvaluator(e.target.value)}
                      >
                        <option value="">Selecione...</option>
                        {employees.map(emp => (
                          <option key={emp.id} value={`${emp.name} (${emp.sector})`}>
                            {emp.name} ({emp.sector})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="md:col-span-5 flex flex-col">
                      <label className="text-[9px] font-black text-gray-500 uppercase tracking-wider mb-1">Eficácia Constatada?</label>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => setEvalResult('effective')}
                          className={`flex items-center justify-center gap-1.5 px-4 py-2.5 text-xs font-black rounded-xl uppercase transition-all ${
                            evalResult === 'effective'
                              ? 'bg-green-600 text-white'
                              : 'bg-white border border-gray-200 text-gray-400 hover:text-green-600'
                          }`}
                        >
                          <ThumbsUp className="size-3.5" /> Eficaz
                        </button>
                        <button
                          type="button"
                          onClick={() => setEvalResult('ineffective')}
                          className={`flex items-center justify-center gap-1.5 px-4 py-2.5 text-xs font-black rounded-xl uppercase transition-all ${
                            evalResult === 'ineffective'
                              ? 'bg-red-600 text-white'
                              : 'bg-white border border-gray-200 text-gray-400 hover:text-red-600'
                          }`}
                        >
                          <ThumbsDown className="size-3.5" /> Ineficaz
                        </button>
                      </div>
                    </div>

                    <div className="md:col-span-12 flex flex-col">
                      <label className="text-[9px] font-black text-gray-500 uppercase tracking-wider mb-1">Justificativa / Evidências da Eficácia</label>
                      <textarea
                        rows={3}
                        placeholder="Ex: Após a recalibração mecânica periódica preventiva e acompanhamento diário nas últimas 4 semanas, não houveram novas ocorrências associadas à peça desregulada."
                        className="bg-white border border-gray-200 rounded-xl p-4 text-xs font-bold text-gray-700 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary placeholder:text-gray-300"
                        value={evalNote}
                        onChange={(e) => setEvalNote(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="flex justify-end pt-2 gap-3 items-center">
                    <AnimatePresence>
                      {saveSuccess && (
                        <motion.span
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -10 }}
                          className="text-xs bg-green-50 text-green-700 px-3 py-1.5 rounded-lg border border-green-200 font-bold"
                        >
                          ✓ Avaliação registrada!
                        </motion.span>
                      )}
                    </AnimatePresence>

                    <button
                      type="button"
                      onClick={handleSubmitEvaluation}
                      disabled={!evaluator || !evalNote || isSaving}
                      className="flex items-center gap-2 bg-primary text-white font-bold text-xs uppercase tracking-widest px-8 py-3.5 rounded-xl shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-40"
                    >
                      <Save className="size-4" />
                      {isSaving ? 'Registrando...' : 'Salvar Avaliação'}
                    </button>
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
