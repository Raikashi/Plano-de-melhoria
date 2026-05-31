import { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { collection, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { 
  BrainCircuit, CheckCircle2, ChevronRight, AlertTriangle, HelpCircle, 
  User, Layout, Layers, RefreshCw, Save
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface IshikawaItem {
  text: string;
  status: 'green' | 'yellow' | 'red';
}

interface RecordData {
  id: string;
  docId: string;
  eventTitle: string;
  type: string;
  location: string;
  description: string;
  rootCause: string;
  use5Whys: boolean;
  use5W2H: boolean;
  useIshikawa: boolean;
  whySteps: string[];
  w2h_what: string;
  w2h_why: string;
  w2h_where: string;
  w2h_when: string;
  w2h_who: string;
  w2h_how: string;
  w2h_howMuch: string;
  ishikawaData?: {
    manpower: IshikawaItem[];
    method: IshikawaItem[];
    machine: IshikawaItem[];
    material: IshikawaItem[];
    measurement: IshikawaItem[];
    environment: IshikawaItem[];
  };
  status: string;
}

export default function RcaView() {
  const [records, setRecords] = useState<RecordData[]>([]);
  const [selectedRecord, setSelectedRecord] = useState<RecordData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Form edit states
  const [whySteps, setWhySteps] = useState<string[]>(['', '', '', '', '']);
  const [rootCause, setRootCause] = useState('');
  const [use5Whys, setUse5Whys] = useState(true);
  const [use5W2H, setUse5W2H] = useState(false);
  const [useIshikawa, setUseIshikawa] = useState(false);
  const [w2h, setW2h] = useState({
    what: '', why: '', where: '', when: '', who: '', how: '', howMuch: ''
  });
  const [ishikawa, setIshikawa] = useState<{
    manpower: IshikawaItem[];
    method: IshikawaItem[];
    machine: IshikawaItem[];
    material: IshikawaItem[];
    measurement: IshikawaItem[];
    environment: IshikawaItem[];
  }>({
    manpower: [], method: [], machine: [], material: [], measurement: [], environment: []
  });

  useEffect(() => {
    // Listen to query
    const unsub = onSnapshot(collection(db, 'records'), (snapshot) => {
      const data = snapshot.docs.map(doc => ({ 
        docId: doc.id, 
        ...doc.data() 
      } as unknown as RecordData));
      
      const submitted = data.filter(r => r.status !== 'draft');
      setRecords(submitted);
      setLoading(false);

      // Keep selection up-to-date
      if (selectedRecord) {
        const updated = submitted.find(r => r.docId === selectedRecord.docId);
        if (updated) {
          setSelectedRecord(updated);
        }
      } else if (submitted.length > 0 && !selectedRecord) {
        setSelectedRecord(submitted[0]);
      }
    });

    return () => unsub();
  }, [selectedRecord]);

  // Load record fields into states when selected record changes
  useEffect(() => {
    if (selectedRecord) {
      setWhySteps(selectedRecord.whySteps || ['', '', '', '', '']);
      setRootCause(selectedRecord.rootCause || '');
      setUse5Whys(selectedRecord.use5Whys ?? true);
      setUse5W2H(selectedRecord.use5W2H ?? false);
      setUseIshikawa(selectedRecord.useIshikawa ?? false);
      setW2h({
        what: selectedRecord.w2h_what || '',
        why: selectedRecord.w2h_why || '',
        where: selectedRecord.w2h_where || '',
        when: selectedRecord.w2h_when || '',
        who: selectedRecord.w2h_who || '',
        how: selectedRecord.w2h_how || '',
        howMuch: selectedRecord.w2h_howMuch || ''
      });
      setIshikawa({
        manpower: selectedRecord.ishikawaData?.manpower || [],
        method: selectedRecord.ishikawaData?.method || [],
        machine: selectedRecord.ishikawaData?.machine || [],
        material: selectedRecord.ishikawaData?.material || [],
        measurement: selectedRecord.ishikawaData?.measurement || [],
        environment: selectedRecord.ishikawaData?.environment || []
      });
    }
  }, [selectedRecord]);

  const handleWhyChange = (idx: number, value: string) => {
    const updated = [...whySteps];
    updated[idx] = value;
    setWhySteps(updated);
  };

  const addIshikawaItem = (cat: keyof typeof ishikawa) => {
    const updated = { ...ishikawa };
    updated[cat] = [...updated[cat], { text: '', status: 'green' }];
    setIshikawa(updated);
  };

  const toggleIshikawaItemStatus = (cat: keyof typeof ishikawa, idx: number) => {
    const updated = { ...ishikawa };
    const current = updated[cat][idx].status;
    const nextMap: Record<'green' | 'yellow' | 'red', 'green' | 'yellow' | 'red'> = {
      green: 'yellow',
      yellow: 'red',
      red: 'green'
    };
    updated[cat][idx].status = nextMap[current];
    setIshikawa(updated);
  };

  const handleIshikawaTextChange = (cat: keyof typeof ishikawa, idx: number, text: string) => {
    const updated = { ...ishikawa };
    updated[cat][idx].text = text;
    setIshikawa(updated);
  };

  const removeIshikawaItem = (cat: keyof typeof ishikawa, idx: number) => {
    const updated = { ...ishikawa };
    updated[cat] = updated[cat].filter((_, i) => i !== idx);
    setIshikawa(updated);
  };

  const handleSaveRca = async () => {
    if (!selectedRecord) return;
    setIsSaving(true);
    try {
      const recordDocRef = doc(db, 'records', selectedRecord.docId);
      await updateDoc(recordDocRef, {
        whySteps,
        rootCause,
        use5Whys,
        use5W2H,
        useIshikawa,
        w2h_what: w2h.what,
        w2h_why: w2h.why,
        w2h_where: w2h.where,
        w2h_when: w2h.when,
        w2h_who: w2h.who,
        w2h_how: w2h.how,
        w2h_howMuch: w2h.howMuch,
        ishikawaData: ishikawa
      });

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      console.error("Error saving RCA:", error);
      alert("Erro ao salvar Análise de Causa Raiz.");
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-20">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8" id="rca-view-container">
      {/* Header Panel */}
      <div>
        <h2 className="text-3xl font-black text-gray-900 tracking-tight flex items-center gap-3">
          <BrainCircuit className="size-8 text-primary" />
          ANÁLISE DE CAUSA RAIZ (RCA)
        </h2>
        <p className="text-sm text-gray-500 font-bold uppercase tracking-widest mt-1">
          Identificação sistemática de falhas fundamentais (ISO 9001)
        </p>
      </div>

      {records.length === 0 ? (
        <div className="p-16 text-center bg-white rounded-3xl border border-gray-100 shadow-sm">
          <BrainCircuit className="size-16 text-primary mx-auto mb-4 opacity-25" />
          <p className="text-gray-500 font-bold text-lg">Nenhum registro disponível para análise.</p>
          <p className="text-gray-400 text-sm mt-1">Crie e envie um relatório de Não Conformidade primeiro.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left panel: Record Selector */}
          <div className="lg:col-span-4 bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-4 h-fit max-h-[800px] overflow-y-auto">
            <h3 className="text-[11px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-50 pb-2">
              Selecione o Registro para Análise
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
                        rec.status === 'submitted' ? 'bg-orange-50 text-orange-600' :
                        rec.status === 'in_progress' ? 'bg-blue-50 text-blue-600' : 'bg-green-50 text-green-600'
                      }`}>
                        {rec.status === 'submitted' ? 'Novo' :
                         rec.status === 'in_progress' ? 'Plano Ativo' : rec.status}
                      </span>
                    </div>
                    <h4 className="font-bold text-gray-900 text-sm line-clamp-1">{rec.eventTitle}</h4>
                    <p className="text-[11px] text-gray-400 line-clamp-1">{rec.location}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right panel: Active RCA Tool */}
          <div className="lg:col-span-8 space-y-6">
            {selectedRecord && (
              <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm space-y-8">
                
                {/* Selected Record Info Card */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gray-50 p-6 rounded-2xl border border-gray-100">
                  <div>
                    <span className="text-xs font-black text-primary uppercase tracking-wider">Registro Selecionado</span>
                    <h3 className="font-extrabold text-gray-900 text-xl tracking-tight mt-1">
                      {selectedRecord.id} - {selectedRecord.eventTitle}
                    </h3>
                    <p className="text-gray-500 text-xs font-medium mt-1 uppercase tracking-wider">
                      {selectedRecord.location}
                    </p>
                  </div>
                  <div className="bg-white px-4 py-2 rounded-xl border border-gray-200/60 shadow-sm">
                    <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">Detector inicial</p>
                    <p className="text-xs font-bold text-gray-700">{selectedRecord.responsible || 'Sem responsável'}</p>
                  </div>
                </div>

                {/* Tool Selection Checkboxes with unified size */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <label className={`p-4 rounded-xl border-2 transition-all cursor-pointer flex items-center gap-4 ${use5Whys ? 'bg-primary/5 border-primary' : 'bg-white border-gray-100 hover:border-primary/20'}`}>
                    <input 
                      type="checkbox" 
                      className="rounded border-gray-300 text-primary focus:ring-primary size-5 cursor-pointer"
                      checked={use5Whys}
                      onChange={(e) => setUse5Whys(e.target.checked)}
                    />
                    <div>
                      <p className="font-bold text-gray-900 text-xs uppercase tracking-tight">5 Porquês</p>
                      <p className="text-[9px] text-gray-400 uppercase tracking-widest leading-none">Causalidade Linear</p>
                    </div>
                  </label>

                  <label className={`p-4 rounded-xl border-2 transition-all cursor-pointer flex items-center gap-4 ${use5W2H ? 'bg-primary/5 border-primary' : 'bg-white border-gray-100 hover:border-primary/20'}`}>
                    <input 
                      type="checkbox" 
                      className="rounded border-gray-300 text-primary focus:ring-primary size-5 cursor-pointer"
                      checked={use5W2H}
                      onChange={(e) => setUse5W2H(e.target.checked)}
                    />
                    <div>
                      <p className="font-bold text-gray-900 text-xs uppercase tracking-tight">5W2H</p>
                      <p className="text-[9px] text-gray-400 uppercase tracking-widest leading-none">Circunstância</p>
                    </div>
                  </label>

                  <label className={`p-4 rounded-xl border-2 transition-all cursor-pointer flex items-center gap-4 ${useIshikawa ? 'bg-primary/5 border-primary' : 'bg-white border-gray-100 hover:border-primary/20'}`}>
                    <input 
                      type="checkbox" 
                      className="rounded border-gray-300 text-primary focus:ring-primary size-5 cursor-pointer"
                      checked={useIshikawa}
                      onChange={(e) => setUseIshikawa(e.target.checked)}
                    />
                    <div>
                      <p className="font-bold text-gray-900 text-xs uppercase tracking-tight">Ishikawa</p>
                      <p className="text-[9px] text-gray-400 uppercase tracking-widest leading-none">Causa-Efeito 6M</p>
                    </div>
                  </label>
                </div>

                {/* 1. 5 Whys Tool Rendering */}
                {use5Whys && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-4"
                  >
                    <div className="flex items-center gap-2 border-b border-gray-100 pb-2">
                      <Layers className="size-4 text-primary" />
                      <h4 className="font-black text-xs text-gray-900 uppercase tracking-widest">Painel dos 5 Porquês</h4>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                      {whySteps.map((step, idx) => (
                        <div key={idx} className="bg-gray-50/55 p-4 rounded-xl border border-gray-100 flex flex-col justify-between space-y-3">
                          <div className="size-6 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
                            {idx + 1}
                          </div>
                          <div className="flex-1">
                            <label className="text-[8px] font-black text-gray-400 uppercase tracking-widest block mb-1">
                              {idx === 0 ? 'Problema' : `Por quê ${idx}?`}
                            </label>
                            <textarea
                              rows={3}
                              className="w-full bg-transparent border-none text-xs font-medium text-gray-700 resize-none p-0 focus:ring-0 leading-tight placeholder:text-gray-300"
                              placeholder="Digite a causa aqui..."
                              value={step}
                              onChange={(e) => handleWhyChange(idx, e.target.value)}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}

                {/* 2. 5W2H Tool Rendering */}
                {use5W2H && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-4"
                  >
                    <div className="flex items-center gap-2 border-b border-gray-100 pb-2">
                      <Layout className="size-4 text-primary" />
                      <h4 className="font-black text-xs text-gray-900 uppercase tracking-widest">Painel 5W2H</h4>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {[
                        { label: 'O Quê? (What)', key: 'what', p: 'Qual o problema principal?', span: true },
                        { label: 'Por Quê? (Why)', key: 'why', p: 'Motivo ou causa detalhada.', span: true },
                        { label: 'Onde? (Where)', key: 'where', p: 'Instalação / Setor onde ocorreu.' },
                        { label: 'Quando? (When)', key: 'when', p: 'Frequência, prazo ou limite.' },
                        { label: 'Quem? (Who)', key: 'who', p: 'Responsável atribuído.' },
                        { label: 'Como? (How)', key: 'how', p: 'Procedimento / Modo de falha.' },
                        { label: 'Quanto custa? (How Much)', key: 'howMuch', p: 'Perda ou custo associado.' },
                      ].map((item) => (
                        <div key={item.key} className={`bg-gray-50/50 p-4 rounded-xl border border-gray-100 flex flex-col ${item.span ? 'md:col-span-2' : ''}`}>
                          <label className="text-[10px] font-extrabold text-primary uppercase tracking-widest mb-1">
                            {item.label}
                          </label>
                          <input 
                            type="text"
                            placeholder={item.p}
                            className="bg-transparent border-none p-0 text-xs font-semibold text-gray-700 focus:ring-0 placeholder:text-gray-300"
                            value={(w2h as any)[item.key]}
                            onChange={(e) => setW2h({ ...w2h, [item.key]: e.target.value })}
                          />
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}

                {/* 3. Ishikawa Tool Rendering */}
                {useIshikawa && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-6"
                  >
                    <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-gray-100 pb-2 gap-2">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="size-4 text-orange-500" />
                        <h4 className="font-black text-xs text-gray-900 uppercase tracking-widest">Diagrama de Ishikawa (Visual 6M)</h4>
                      </div>
                      <div className="flex gap-2">
                        <span className="flex items-center gap-1 text-[9px] font-bold text-green-700 bg-green-50 px-2 py-0.5 rounded-full border border-green-100">
                          <span className="size-1.5 bg-green-500 rounded-full" /> Verde: Controlado
                        </span>
                        <span className="flex items-center gap-1 text-[9px] font-bold text-yellow-700 bg-yellow-50 px-2 py-0.5 rounded-full border border-yellow-100">
                          <span className="size-1.5 bg-yellow-500 rounded-full" /> Amarelo: Risco
                        </span>
                        <span className="flex items-center gap-1 text-[9px] font-bold text-red-700 bg-red-50 px-2 py-0.5 rounded-full border border-red-100">
                          <span className="size-1.5 bg-red-500 rounded-full" /> Vermelho: Crítico
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {([
                        { key: 'manpower', label: 'Mão de Obra', icon: '👤' },
                        { key: 'method', label: 'Método', icon: '📋' },
                        { key: 'machine', label: 'Máquina', icon: '⚙️' },
                        { key: 'material', label: 'Material', icon: '📦' },
                        { key: 'measurement', label: 'Medida', icon: '📏' },
                        { key: 'environment', label: 'Meio Ambiente', icon: '🌱' }
                      ] as const).map((cat) => (
                        <div key={cat.key} className="bg-gray-50/50 p-4 rounded-xl border border-gray-100 flex flex-col space-y-3">
                          <div className="flex items-center justify-between border-b border-gray-100/60 pb-1.5">
                            <span className="text-xs font-black text-gray-900 flex items-center gap-1 uppercase tracking-tight">
                              <span>{cat.icon}</span> {cat.label}
                            </span>
                            <button
                              type="button"
                              onClick={() => addIshikawaItem(cat.key)}
                              className="text-[9px] font-black text-primary hover:underline uppercase tracking-wider"
                            >
                              + Adicionar
                            </button>
                          </div>
                          <div className="space-y-2 min-h-[80px]">
                            {ishikawa[cat.key].map((item, id) => (
                              <div key={id} className="flex items-center gap-1.5 bg-white p-2 rounded-lg shadow-sm border border-gray-50">
                                <button
                                  type="button"
                                  onClick={() => toggleIshikawaItemStatus(cat.key, id)}
                                  className={`size-3 rounded-full shrink-0 transition-colors ${
                                    item.status === 'green' ? 'bg-green-500 shadow shadow-green-200' :
                                    item.status === 'yellow' ? 'bg-yellow-500 shadow shadow-yellow-200' :
                                    'bg-red-500 shadow shadow-red-200'
                                  }`}
                                />
                                <input 
                                  type="text"
                                  placeholder="..."
                                  className="flex-1 w-full p-0 bg-transparent border-none text-[11px] font-bold text-gray-700 placeholder:text-gray-300 focus:ring-0"
                                  value={item.text}
                                  onChange={(e) => handleIshikawaTextChange(cat.key, id, e.target.value)}
                                />
                                <button 
                                  type="button" 
                                  onClick={() => removeIshikawaItem(cat.key, id)}
                                  className="text-gray-200 hover:text-red-500 transition-colors text-xs px-1 font-bold"
                                >
                                  ×
                                </button>
                              </div>
                            ))}
                            {ishikawa[cat.key].length === 0 && (
                              <p className="text-[10px] text-gray-300 italic text-center py-4">Vazio</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}

                {/* Final Root Cause Declaration */}
                <div className="bg-primary/5 p-6 rounded-2xl border border-primary/20 space-y-3">
                  <h4 className="text-sm font-extrabold text-primary flex items-center gap-2 uppercase tracking-widest">
                    Declaração da Causa Raiz
                  </h4>
                  <p className="text-gray-500 text-xs">
                    Com base na análise das ferramentas acima, relate textualmente qual é o fator fundamental que causou o desvio:
                  </p>
                  <textarea
                    rows={2}
                    placeholder="Ex: Falha na calibração mecânica do cilindro B associada à ausência de checklist operacional específico..."
                    className="w-full bg-white border border-gray-200 rounded-xl p-4 text-sm font-bold text-gray-800 focus:ring-primary focus:border-primary placeholder:text-gray-300"
                    value={rootCause}
                    onChange={(e) => setRootCause(e.target.value)}
                  />
                </div>

                {/* Action button */}
                <div className="flex justify-end gap-3 items-center pt-2">
                  <AnimatePresence>
                    {saveSuccess && (
                      <motion.div
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -10 }}
                        className="text-xs bg-green-50 text-green-700 px-3 py-1.5 rounded-lg border border-green-200 font-bold"
                      >
                        ✓ Análise de Causa Raiz Salva!
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <button
                    type="button"
                    onClick={handleSaveRca}
                    disabled={isSaving}
                    className="flex items-center gap-2 bg-primary text-white font-bold text-xs uppercase tracking-widest px-8 py-3.5 rounded-xl shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
                  >
                    <Save className="size-4" />
                    {isSaving ? 'Salvando...' : 'Salvar Análise (RCA)'}
                  </button>
                </div>

              </div>
            )}
          </div>

        </div>
      )}
    </div>
  );
}
