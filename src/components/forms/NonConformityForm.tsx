import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ArrowLeft, 
  Info, 
  Camera, 
  X, 
  AlertCircle, 
  AlertTriangle,
  Trash2,
  CheckCircle2,
  MessageCircle,
  ExternalLink,
  Phone,
  Settings,
  MapPin
} from 'lucide-react';
import SectionHeader from '../SectionHeader';
import { db, auth } from '../../lib/firebase';
import { collection, onSnapshot, query, orderBy, addDoc, doc, setDoc } from 'firebase/firestore';
import { ClipboardList } from 'lucide-react';
import EmployeeModal from '../EmployeeModal';
import LocationModal from '../LocationModal';

export default function NonConformityForm() {
  const [viewMode, setViewMode] = useState<'list' | 'edit'>('list');
  const [selectedRecordDocId, setSelectedRecordDocId] = useState<string | null>(null);
  const [allRecords, setAllRecords] = useState<any[]>([]);
  const [recordsLoading, setRecordsLoading] = useState(true);

  const [isEmployeeModalOpen, setIsEmployeeModalOpen] = useState(false);
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [employees, setEmployees] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    id: '',
    type: 'ocorrencia',
    eventTitle: '',
    location: 'Linha de Produção - Setor A',
    dateDetected: '',
    description: '',
    immediateAction: '',
    actionDate: '',
    responsible: '',
    responsiblePhone: '',
    whySteps: ['', '', '', '', ''],
    rootCause: '',
    // 5W2H fields
    w2h_what: '',
    w2h_why: '',
    w2h_where: '',
    w2h_when: '',
    w2h_who: '',
    w2h_how: '',
    w2h_howMuch: '',
    // Tool visibility
    use5Whys: true,
    use5W2H: false,
    useIshikawa: false,
    ishikawaData: {
      manpower: [] as { text: string; status: 'green' | 'yellow' | 'red' }[],
      method: [] as { text: string; status: 'green' | 'yellow' | 'red' }[],
      machine: [] as { text: string; status: 'green' | 'yellow' | 'red' }[],
      material: [] as { text: string; status: 'green' | 'yellow' | 'red' }[],
      measurement: [] as { text: string; status: 'green' | 'yellow' | 'red' }[],
      environment: [] as { text: string; status: 'green' | 'yellow' | 'red' }[]
    }
  });

  // Load records and drop listeners at load-time
  useEffect(() => {
    const qRec = query(collection(db, 'records'));
    const unsubRec = onSnapshot(qRec, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ docId: doc.id, ...doc.data() }));
      const sorted = [...data].sort((a: any, b: any) => {
        return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
      });
      setAllRecords(sorted);
      setRecordsLoading(false);
    });

    return () => unsubRec();
  }, []);

  // Basic counters for fallback
  const [counters, setCounters] = useState({
    ocorrencia: 1,
    'acao-corretiva': 1
  });

  useEffect(() => {
    const qEmp = query(collection(db, 'employees'));
    const unsubEmp = onSnapshot(qEmp, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const sortedData = [...data].sort((a: any, b: any) => a.name.localeCompare(b.name));
      setEmployees(sortedData);
    });

    const qLoc = query(collection(db, 'locations'));
    const unsubLoc = onSnapshot(qLoc, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const sortedData = [...data].sort((a: any, b: any) => a.name.localeCompare(b.name));
      setLocations(sortedData);
    });

    return () => {
      unsubEmp();
      unsubLoc();
    };
  }, []);

  useEffect(() => {
    if (selectedRecordDocId) return; // Prevent counter changes if editing an existing draft

    const year = new Date().getFullYear();
    const prefix = formData.type === 'ocorrencia' ? 'OC' : 'AC';
    
    // Sort existing indexes belonging to type & year
    const matched = allRecords.filter(r => r.id && r.id.startsWith(prefix) && r.id.endsWith(year.toString()));
    let nextNum = 1;
    if (matched.length > 0) {
      const nums = matched.map(r => {
        const parts = r.id.split('-');
        if (parts.length > 1) {
          const num = parseInt(parts[1].split('/')[0], 10);
          return isNaN(num) ? 0 : num;
        }
        return 0;
      });
      nextNum = Math.max(...nums) + 1;
    }
    
    const formattedId = `${prefix}-${nextNum.toString().padStart(3, '0')}/${year}`;
    setFormData(prev => ({ ...prev, id: formattedId }));
  }, [formData.type, allRecords, selectedRecordDocId]);

  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isVerified, setIsVerified] = useState(false);
  const [attachments, setAttachments] = useState<string[]>([
    'https://lh3.googleusercontent.com/aida-public/AB6AXuDaxL4xNtRnt7-M96UtCbRBZ4iU-KSfmDDUVY_JBFejigxRrZHXzwUxyQyR6ll_PRXeo5mp99frUIxGR_12szlURz2agkmmG71PVL_XgtqTnl2G-K0qb8iRpNUKVEND3zshkpwzRSbnYnokgIMjr5bWBS7y1FklBlKmfy6wX0L1WzmbsYFUy5Oelun0vwVp9AbIL_XhpUQhHKVTRELQ0IQyKHCSBxxZ7OuNNAvjaQUW-Y-lrSHLsw-lbP4gUCSnuRVtpAvcFr957eHt'
  ]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Simulate upload and create a preview URL
      const url = URL.createObjectURL(file);
      setAttachments(prev => [...prev, url]);
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };
  const loadRecordForEdit = (rec: any) => {
    setSelectedRecordDocId(rec.docId);
    setFormData({
      id: rec.id || '',
      type: rec.type || 'ocorrencia',
      eventTitle: rec.eventTitle || '',
      location: rec.location || '',
      dateDetected: rec.dateDetected || '',
      description: rec.description || '',
      immediateAction: rec.immediateAction || '',
      actionDate: rec.actionDate || '',
      responsible: rec.responsible || '',
      responsiblePhone: rec.responsiblePhone || '',
      whySteps: rec.whySteps || ['', '', '', '', ''],
      rootCause: rec.rootCause || '',
      w2h_what: rec.w2h_what || '',
      w2h_why: rec.w2h_why || '',
      w2h_where: rec.w2h_where || '',
      w2h_when: rec.w2h_when || '',
      w2h_who: rec.w2h_who || '',
      w2h_how: rec.w2h_how || '',
      w2h_howMuch: rec.w2h_howMuch || '',
      use5Whys: rec.use5Whys ?? true,
      use5W2H: rec.use5W2H ?? false,
      useIshikawa: rec.useIshikawa ?? false,
      ishikawaData: rec.ishikawaData || {
        manpower: [], method: [], machine: [], material: [], measurement: [], environment: []
      }
    });
    setIsVerified(rec.isVerified || false);
    setAttachments(rec.attachments || []);
    setViewMode('edit');
  };

  const startNewRecord = () => {
    setSelectedRecordDocId(null);
    resetForm();
    setViewMode('edit');
  };

  const resetForm = () => {
    setFormData({
      id: '',
      type: 'ocorrencia',
      eventTitle: '',
      location: '',
      dateDetected: '',
      description: '',
      immediateAction: '',
      actionDate: '',
      responsible: '',
      responsiblePhone: '',
      whySteps: ['', '', '', '', ''],
      rootCause: '',
      w2h_what: '',
      w2h_why: '',
      w2h_where: '',
      w2h_when: '',
      w2h_who: '',
      w2h_how: '',
      w2h_howMuch: '',
      use5Whys: true,
      use5W2H: false,
      useIshikawa: false,
      ishikawaData: {
        manpower: [],
        method: [],
        machine: [],
        material: [],
        measurement: [],
        environment: []
      }
    });
    setIsVerified(false);
    setAttachments([]);
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSaveError(null);
    try {
      const payload = {
        ...formData,
        isVerified,
        status: 'draft',
        updatedAt: new Date().toISOString(),
        authorEmail: auth.currentUser?.email || 'anon@example.com'
      };

      if (selectedRecordDocId) {
        await setDoc(doc(db, 'records', selectedRecordDocId), payload, { merge: true });
      } else {
        const docRef = await addDoc(collection(db, 'records'), {
          ...payload,
          createdAt: new Date().toISOString()
        });
        setSelectedRecordDocId(docRef.id);
      }
      
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (err: any) {
      console.error(err);
      setSaveError(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveError(null);
    try {
      const payload = {
        ...formData,
        isVerified,
        status: 'submitted',
        updatedAt: new Date().toISOString(),
        authorEmail: auth.currentUser?.email || 'anon@example.com'
      };

      if (selectedRecordDocId) {
        await setDoc(doc(db, 'records', selectedRecordDocId), payload, { merge: true });
      } else {
        await addDoc(collection(db, 'records'), {
          ...payload,
          createdAt: new Date().toISOString()
        });
      }
      
      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
        resetForm();
        setViewMode('list');
      }, 2000);
    } catch (err: any) {
      console.error(err);
      setSaveError(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const sendWhatsApp = () => {
    if (!formData.responsiblePhone) return;
    const message = encodeURIComponent(`Olá, você foi designado como responsável pelo registro ${formData.id}. Por favor, verifique as ações imediatas: ${formData.immediateAction}`);
    window.open(`https://wa.me/${formData.responsiblePhone.replace(/\D/g, '')}?text=${message}`, '_blank');
  };

  const handleResponsibleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedEmployee = employees.find(emp => `${emp.name} (${emp.sector})` === e.target.value);
    setFormData({ 
      ...formData, 
      responsible: e.target.value,
      responsiblePhone: selectedEmployee?.phone || ''
    });
  };

  const generateFeedbackLink = () => {
    // Generate a symbolic link (in a real app, this would be a real URL with a token)
    const baseUrl = window.location.origin;
    const link = `${baseUrl}/feedback/${formData.id}`;
    const message = encodeURIComponent(`Por favor, responda ao feedback da ocorrência ${formData.id} através deste link: ${link}`);
    window.open(`https://wa.me/${formData.responsiblePhone.replace(/\D/g, '')}?text=${message}`, '_blank');
  };

  const handleWhyChange = (index: number, value: string) => {
    const newWhy = [...formData.whySteps];
    newWhy[index] = value;
    setFormData({ ...formData, whySteps: newWhy });
  };

  if (viewMode === 'list') {
    return (
      <div className="p-8 max-w-7xl mx-auto space-y-8" id="non-conformity-list-view">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-8 rounded-3xl border border-gray-150 shadow-sm">
          <div>
            <h2 className="text-4xl font-black text-gray-900 tracking-tight">REGISTROS (ISO 9001)</h2>
            <p className="text-sm text-gray-500 font-bold uppercase tracking-widest mt-1">Gerencie desvios, contenções e investigações</p>
          </div>
          <button 
            onClick={startNewRecord}
            className="px-6 py-3.5 bg-primary text-white rounded-xl font-bold text-xs uppercase tracking-widest shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all"
          >
            + Registrar Não Conformidade
          </button>
        </div>

        {recordsLoading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          </div>
        ) : allRecords.length === 0 ? (
          <div className="p-16 text-center bg-white rounded-3xl border border-gray-100 shadow-sm flex flex-col items-center">
            <ClipboardList className="size-16 text-primary mb-4 opacity-25" />
            <p className="text-gray-500 font-bold text-lg">Nenhum registro de não conformidade no momento.</p>
            <p className="text-gray-400 text-sm mt-1 mb-6">Comece abrindo um novo registro de desvio para acompanhamento operacional.</p>
            <button 
              onClick={startNewRecord}
              className="px-6 py-3 bg-primary text-white rounded-xl font-bold text-xs uppercase tracking-widest shadow-sm"
            >
              Iniciar Registro
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden scale-3d">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/50">
                    <th className="p-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Código / Tipo</th>
                    <th className="p-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Título / Descrição</th>
                    <th className="p-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Local / Data</th>
                    <th className="p-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Status</th>
                    <th className="p-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {allRecords.map((rec) => (
                    <tr key={rec.docId} className="hover:bg-gray-50/30 transition-colors">
                      <td className="p-5">
                        <span className="font-extrabold text-primary text-sm flex flex-col">
                          #{rec.id}
                          <span className="text-[9px] text-gray-400 uppercase tracking-tight font-black">{rec.type === 'ocorrencia' ? 'Ocorrência' : 'Ação Corretiva'}</span>
                        </span>
                      </td>
                      <td className="p-5 py-4 max-w-sm">
                        <p className="font-extrabold text-gray-900 text-sm">{rec.eventTitle}</p>
                        <p className="text-xs text-gray-400 truncate mt-0.5">{rec.description}</p>
                      </td>
                      <td className="p-5 text-sm">
                        <p className="font-bold text-gray-700">{rec.location}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{rec.dateDetected ? new Date(rec.dateDetected).toLocaleString('pt-BR') : 'Não informada'}</p>
                      </td>
                      <td className="p-5">
                        <span className={`px-2.5 py-1 text-[10px] font-black uppercase tracking-wider rounded-lg ${
                          rec.status === 'draft' ? 'bg-gray-100 text-gray-500 border border-gray-200' :
                          rec.status === 'submitted' ? 'bg-orange-50 text-orange-600 border border-orange-100' :
                          rec.status === 'in_progress' ? 'bg-blue-50 text-blue-600 border border-blue-100' :
                          rec.status === 'for_verification' ? 'bg-yellow-50 text-yellow-600 border border-yellow-104' :
                          rec.status === 'effective' ? 'bg-green-50 text-green-600 border border-green-100' :
                          'bg-red-50 text-red-600 border border-red-100'
                        }`}>
                          {rec.status === 'draft' ? 'Rascunho' :
                           rec.status === 'submitted' ? 'Submetida' :
                           rec.status === 'in_progress' ? 'Plano Ativo' :
                           rec.status === 'for_verification' ? 'Avaliando Eficácia' :
                           rec.status === 'effective' ? '✓ Eficaz' : '✗ Ineficaz'}
                        </span>
                      </td>
                      <td className="p-5 text-right">
                        <button
                          onClick={() => loadRecordForEdit(rec)}
                          className="px-4 py-2 border border-gray-200 rounded-xl text-xs font-black uppercase tracking-wider text-primary hover:bg-primary hover:text-white transition-all shadow-sm"
                        >
                          {rec.status === 'draft' ? 'Editar' : 'Visualizar'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-12">
      {/* Bento Grid Header */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="md:col-span-3 bg-card p-8 rounded-xl border border-border shadow-sm flex flex-col justify-center">
          <button 
            type="button"
            onClick={() => setViewMode('list')}
            className="flex items-center gap-2 text-primary font-bold mb-4 hover:opacity-70 transition-all w-fit"
          >
            <ArrowLeft className="size-4" />
            <span className="text-xs uppercase tracking-widest font-black">Voltar ao Painel</span>
          </button>
          <h2 className="text-4xl font-headline font-extrabold text-text tracking-tighter mb-4 flex items-baseline flex-wrap gap-x-3">
            Registro de Não Conformidade 
            <span className="text-primary font-black">#{formData.id}</span>
          </h2>
          <p className="text-text-muted max-w-2xl text-sm leading-relaxed">
            Complete a análise detalhada para o registro {formData.id}. Certifique-se de que todas as evidências foram documentadas e a causa raiz identificada sistematicamente.
          </p>
        </div>
        
        <div className="bg-primary/10 p-8 rounded-xl border border-primary/20 flex flex-col items-center justify-center text-center space-y-3">
          <AlertCircle className="size-10 text-primary" />
          <div className="text-2xl font-black text-text">94%</div>
          <div className="text-xs font-bold uppercase tracking-widest text-primary">Compliance Score</div>
        </div>
      </div>

      <form className="grid grid-cols-1 md:grid-cols-4 gap-6 pb-24" onSubmit={handleSubmit}>
        {/* Section 01: Descrição (Span 4) */}
        <div className="md:col-span-4">
          <SectionHeader number="01" title="Descrição da Não Conformidade" />
        </div>
        
        <div className="md:col-span-4 bg-card p-8 rounded-xl border border-border shadow-sm space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="flex flex-col">
              <label className="text-[10px] font-bold uppercase tracking-wider text-text-muted mb-1">Tipo de Registro</label>
              <select 
                className="minimal-input font-medium cursor-pointer"
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              >
                <option value="ocorrencia">Ocorrência</option>
                <option value="acao-corretiva">Ação Corretiva</option>
              </select>
            </div>

            <div className="flex flex-col">
              <label className="text-[10px] font-bold uppercase tracking-wider text-text-muted mb-1 flex items-center gap-2">
                ID do Registro
                <Info className="size-3 text-primary cursor-help" />
              </label>
              <div className="flex items-center gap-3 py-1.5">
                <span className="font-bold text-text tracking-tight">{formData.id}</span>
                <span className="px-2 py-0.5 rounded bg-primary/10 text-primary text-[10px] font-black uppercase tracking-tighter border border-primary/20">
                  Auto-Gerado
                </span>
              </div>
            </div>

            <div className="flex flex-col">
              <label className="text-[10px] font-bold uppercase tracking-wider text-text-muted mb-1 flex items-center justify-between">
                ONDE OCORREU?
                <button 
                  type="button"
                  onClick={() => setIsLocationModalOpen(true)}
                  className="text-orange-500 hover:underline flex items-center gap-1 normal-case font-bold"
                >
                  <MapPin className="size-3" />
                  Gerenciar
                </button>
              </label>
              <select 
                className="minimal-input font-medium cursor-pointer"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              >
                <option value="">Selecione o Local</option>
                {locations.map(loc => (
                  <option key={loc.id} value={loc.name}>
                    {loc.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2 flex flex-col">
              <label className="text-[10px] font-bold uppercase tracking-wider text-text-muted mb-1">O QUE ACONTECEU? (TÍTULO)</label>
              <input 
                type="text" 
                className="minimal-input text-lg font-medium" 
                placeholder="Breve resumo do problema"
                value={formData.eventTitle}
                onChange={(e) => setFormData({ ...formData, eventTitle: e.target.value })}
              />
            </div>

            <div className="flex flex-col">
              <label className="text-[10px] font-bold uppercase tracking-wider text-text-muted mb-1">QUANDO FOI DETECTADO?</label>
              <input 
                type="datetime-local" 
                className="minimal-input"
                value={formData.dateDetected}
                onChange={(e) => setFormData({ ...formData, dateDetected: e.target.value })}
              />
            </div>
          </div>

          <div className="flex flex-col">
            <label className="text-[10px] font-bold uppercase tracking-wider text-text-muted mb-1">DESCRIÇÃO E EVIDÊNCIAS DETALHADAS</label>
            <textarea 
              className="minimal-input resize-none py-4" 
              rows={4}
              placeholder="Descreva a não conformidade em detalhes, referenciando requisitos específicos ou normas violadas."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          <div className="pt-4">
            <label className="text-[10px] font-bold uppercase tracking-wider text-text-muted mb-3 block">EVIDÊNCIAS ANEXADAS</label>
            <div className="flex flex-wrap gap-4">
              <label className="size-24 rounded bg-bg border-2 border-dashed border-border flex flex-col items-center justify-center gap-1 cursor-pointer hover:bg-card transition-colors group">
                <Camera className="size-6 text-text-muted group-hover:text-primary transition-colors" />
                <span className="text-[10px] font-bold text-text-muted uppercase">Anexar</span>
                <input 
                  type="file" 
                  className="hidden" 
                  accept="image/*" 
                  onChange={handleFileUpload}
                />
              </label>
              
              {attachments.map((url, idx) => (
                <div key={idx} className="relative group">
                  <img 
                    src={url} 
                    alt={`Evidência ${idx + 1}`} 
                    className="size-24 object-cover rounded shadow-sm border border-border"
                    referrerPolicy="no-referrer"
                  />
                  <button 
                    type="button"
                    onClick={() => removeAttachment(idx)}
                    className="absolute inset-0 bg-primary/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity rounded"
                  >
                    <X className="size-5 text-white" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Section 02: Contenção (Span 4) */}
        <div className="md:col-span-4 mt-8">
          <SectionHeader number="02" title="Ação Imediata (Contenção)" />
        </div>
        
        <div className="md:col-span-3 bg-card p-8 rounded-xl border border-border shadow-sm space-y-6">
          <div className="flex flex-col">
            <label className="text-[10px] font-bold uppercase tracking-wider text-text-muted mb-1">AÇÕES REALIZADAS PARA CONTER O PROBLEMA</label>
            <textarea 
              className="minimal-input resize-none" 
              rows={3}
              placeholder="Correções imediatas tomadas para evitar impactos futuros..."
              value={formData.immediateAction}
              onChange={(e) => setFormData({ ...formData, immediateAction: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex flex-col">
              <label className="text-[10px] font-bold uppercase tracking-wider text-text-muted mb-1">DATA DA AÇÃO</label>
              <input 
                type="date" 
                className="minimal-input"
                value={formData.actionDate}
                onChange={(e) => setFormData({ ...formData, actionDate: e.target.value })}
              />
            </div>
            <div className="flex flex-col">
              <label className="text-[10px] font-bold uppercase tracking-wider text-text-muted mb-1 flex items-center justify-between">
                RESPONSÁVEL
                <button 
                  type="button"
                  onClick={() => setIsEmployeeModalOpen(true)}
                  className="text-blue-500 hover:underline flex items-center gap-1 normal-case font-bold"
                >
                  <Settings className="size-3" />
                  Gerenciar
                </button>
              </label>
              <select 
                className="minimal-input font-medium cursor-pointer"
                value={formData.responsible}
                onChange={handleResponsibleChange}
              >
                <option value="">Selecione o Responsável</option>
                {employees.map(emp => (
                  <option key={emp.id} value={`${emp.name} (${emp.sector})`}>
                    {emp.name} ({emp.sector})
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col">
              <label className="text-[10px] font-bold uppercase tracking-wider text-text-muted mb-1">CONTATO (WHATSAPP)</label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-text-muted" />
                  <input 
                    type="text" 
                    className="minimal-input pl-10" 
                    placeholder="Telefone"
                    value={formData.responsiblePhone}
                    onChange={(e) => setFormData({ ...formData, responsiblePhone: e.target.value })}
                  />
                </div>
                <button 
                  type="button"
                  onClick={sendWhatsApp}
                  disabled={!formData.responsiblePhone}
                  className="bg-green-500 text-white p-3 rounded-xl shadow-lg shadow-green-500/20 hover:bg-green-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed group relative"
                  title="Enviar mensagem via WhatsApp"
                >
                  <MessageCircle className="size-5" />
                  <span className="absolute -top-10 left-1/2 -translate-x-1/2 px-2 py-1 bg-gray-800 text-white text-[10px] rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                    Enviar WhatsApp
                  </span>
                </button>
              </div>
            </div>
          </div>
          
          <div className="flex justify-end pt-2">
            <button
              type="button"
              onClick={generateFeedbackLink}
              disabled={!formData.responsiblePhone}
              className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg text-xs font-bold hover:bg-slate-200 transition-all border border-slate-200"
            >
              <ExternalLink className="size-3" />
              SOLICITAR FEEDBACK DO FUNCIONÁRIO
            </button>
          </div>
        </div>

        <div className="bg-tertiary-fixed p-8 rounded-xl flex flex-col justify-between border border-primary/10 shadow-sm">
          <div>
            <AlertCircle className="size-8 text-on-tertiary-fixed mb-4" />
            <p className="text-sm font-bold text-on-tertiary-fixed mb-2">Checklist de Contenção</p>
            <p className="text-xs text-on-tertiary-fixed/80 leading-relaxed font-medium">
              Certifique-se de que todos os produtos afetados foram identificados e movidos para a área de retenção.
            </p>
          </div>
          <label className="flex items-center gap-3 mt-8 cursor-pointer group">
            <div className={`size-5 rounded border-2 transition-all flex items-center justify-center
              ${isVerified ? 'bg-on-tertiary-fixed border-on-tertiary-fixed' : 'border-on-tertiary-fixed group-hover:bg-on-tertiary-fixed/10'}`}>
              {isVerified && <CheckCircle2 className="size-3 text-white" />}
            </div>
            <input 
              type="checkbox" 
              className="hidden" 
              checked={isVerified}
              onChange={(e) => setIsVerified(e.target.checked)}
            />
            <span className="text-xs font-black uppercase tracking-tighter text-on-tertiary-fixed">
              {isVerified ? 'Verificado' : 'Validar Agora'}
            </span>
          </label>
        </div>

        {/* Section 03: Ferramentas de Causa Raiz (Span 4) */}
        <div className="md:col-span-4 mt-8">
          <SectionHeader number="03" title="Ferramentas de Análise de Causa Raiz" />
        </div>

        <div className="md:col-span-4 grid grid-cols-1 md:grid-cols-3 gap-4">
          <label className={`p-6 h-28 rounded-xl border-2 transition-all cursor-pointer flex items-center gap-4 ${formData.use5Whys ? 'bg-primary/5 border-primary shadow-md' : 'bg-card border-border hover:border-primary/30'}`}>
            <div className={`size-6 rounded-full border-2 flex items-center justify-center transition-all shrink-0 ${formData.use5Whys ? 'bg-primary border-primary' : 'border-border'}`}>
              {formData.use5Whys && <CheckCircle2 className="size-4 text-white" />}
            </div>
            <input 
              type="checkbox" 
              className="hidden" 
              checked={formData.use5Whys}
              onChange={(e) => setFormData({ ...formData, use5Whys: e.target.checked })}
            />
            <div>
              <p className="font-black text-text uppercase tracking-tight text-xs md:text-sm">Utilizar 5 Porquês</p>
              <p className="text-[10px] text-text-muted font-bold uppercase tracking-widest mt-0.5 leading-tight">Análise Linear de Causalidade</p>
            </div>
          </label>

          <label className={`p-6 h-28 rounded-xl border-2 transition-all cursor-pointer flex items-center gap-4 ${formData.use5W2H ? 'bg-primary/5 border-primary shadow-md' : 'bg-card border-border hover:border-primary/30'}`}>
            <div className={`size-6 rounded-full border-2 flex items-center justify-center transition-all shrink-0 ${formData.use5W2H ? 'bg-primary border-primary' : 'border-border'}`}>
              {formData.use5W2H && <CheckCircle2 className="size-4 text-white" />}
            </div>
            <input 
              type="checkbox" 
              className="hidden" 
              checked={formData.use5W2H}
              onChange={(e) => setFormData({ ...formData, use5W2H: e.target.checked })}
            />
            <div>
              <p className="font-black text-text uppercase tracking-tight text-xs md:text-sm">Utilizar 5W2H</p>
              <p className="text-[10px] text-text-muted font-bold uppercase tracking-widest mt-0.5 leading-tight">Análise de Ação e Circunstância</p>
            </div>
          </label>

          <label className={`p-6 h-28 rounded-xl border-2 transition-all cursor-pointer flex items-center gap-4 ${formData.useIshikawa ? 'bg-primary/5 border-primary shadow-md' : 'bg-card border-border hover:border-primary/30'}`}>
            <div className={`size-6 rounded-full border-2 flex items-center justify-center transition-all shrink-0 ${formData.useIshikawa ? 'bg-primary border-primary' : 'border-border'}`}>
              {formData.useIshikawa && <CheckCircle2 className="size-4 text-white" />}
            </div>
            <input 
              type="checkbox" 
              className="hidden" 
              checked={formData.useIshikawa}
              onChange={(e) => setFormData({ ...formData, useIshikawa: e.target.checked })}
            />
            <div>
              <p className="font-black text-text uppercase tracking-tight text-xs md:text-sm">Diagrama de Ishikawa</p>
              <p className="text-[10px] text-text-muted font-bold uppercase tracking-widest mt-0.5 leading-tight">Análise Causa-Efeito (6M)</p>
            </div>
          </label>
        </div>
        
        <AnimatePresence>
          {formData.use5Whys && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:col-span-4 space-y-4 overflow-hidden"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {formData.whySteps.slice(0, 4).map((step, idx) => (
                  <div key={idx} className="bg-card p-6 rounded-xl border border-border shadow-sm flex gap-4">
                    <div className="size-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold text-sm shrink-0">
                      {idx + 1}
                    </div>
                    <div className="flex-1">
                      <label className="text-[10px] font-bold text-text-muted mb-1 block uppercase tracking-tight">
                        {idx === 0 ? 'O Problema' : 'Por que isso aconteceu?'}
                      </label>
                      <input 
                        type="text" 
                        className="w-full bg-transparent border-none focus:ring-0 p-0 text-text font-medium placeholder:text-text-muted/30"
                        placeholder="Digite a resposta aqui..."
                        value={step}
                        onChange={(e) => handleWhyChange(idx, e.target.value)}
                      />
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="bg-card p-6 rounded-xl border border-border shadow-sm flex gap-4">
                <div className="size-8 rounded-lg bg-primary text-white flex items-center justify-center font-bold text-sm shrink-0">
                  5
                </div>
                <div className="flex-1">
                  <label className="text-[10px] font-bold text-text-muted mb-1 block uppercase tracking-tight">
                    Identificar Causa Raiz Potencial
                  </label>
                  <input 
                    type="text" 
                    className="w-full bg-transparent border-none focus:ring-0 p-0 text-text font-medium placeholder:text-text-muted/30"
                    placeholder="Expandir análise..."
                    value={formData.whySteps[4]}
                    onChange={(e) => handleWhyChange(4, e.target.value)}
                  />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {formData.use5W2H && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:col-span-4 overflow-hidden"
            >
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {[
                  { label: 'O Quê? (What)', field: 'w2h_what', placeholder: 'Qual é o problema ou ação?' },
                  { label: 'Por Quê? (Why)', field: 'w2h_why', placeholder: 'Motivo da ocorrência ou ação.' },
                  { label: 'Onde? (Where)', field: 'w2h_where', placeholder: 'Local específico.' },
                  { label: 'Quando? (When)', field: 'w2h_when', placeholder: 'Data ou prazo.' },
                  { label: 'Quem? (Who)', field: 'w2h_who', placeholder: 'Responsável.' },
                  { label: 'Como? (How)', field: 'w2h_how', placeholder: 'Processo ou método.' },
                  { label: 'Quanto custa? (How Much)', field: 'w2h_howMuch', placeholder: 'Custo estimado se houver.' },
                ].map((item, idx) => (
                  <div key={idx} className={`bg-card p-5 rounded-xl border border-border shadow-sm flex flex-col ${idx === 0 || idx === 1 ? 'md:col-span-2' : ''}`}>
                    <label className="text-[10px] font-bold text-primary mb-2 uppercase tracking-widest">{item.label}</label>
                    <textarea 
                      className="w-full bg-transparent border-none focus:ring-0 p-0 text-text font-medium placeholder:text-text-muted/30 resize-none"
                      rows={2}
                      placeholder={item.placeholder}
                      value={(formData as any)[item.field]}
                      onChange={(e) => setFormData({ ...formData, [item.field]: e.target.value })}
                    />
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {formData.useIshikawa && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:col-span-4 overflow-hidden pt-4"
            >
              <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-inner space-y-8">
                <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <AlertTriangle className="size-5 text-primary" />
                    </div>
                    <div>
                      <h5 className="font-black text-gray-900 uppercase tracking-tight">Diagrama de Causa e Efeito</h5>
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest leading-none">Identifique as causas em cada categoria</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1.5 px-3 py-1 bg-green-50 rounded-full border border-green-100">
                      <div className="size-2 bg-green-500 rounded-full" />
                      <span className="text-[9px] font-bold text-green-700 uppercase">Controlado</span>
                    </div>
                    <div className="flex items-center gap-1.5 px-3 py-1 bg-yellow-50 rounded-full border border-yellow-100">
                      <div className="size-2 bg-yellow-500 rounded-full" />
                      <span className="text-[9px] font-bold text-yellow-700 uppercase">Risco</span>
                    </div>
                    <div className="flex items-center gap-1.5 px-3 py-1 bg-red-50 rounded-full border border-red-100">
                      <div className="size-2 bg-red-500 rounded-full" />
                      <span className="text-[9px] font-bold text-red-700 uppercase">Crítico</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {([
                    { key: 'manpower', label: 'Mão de Obra', icon: '👤', desc: 'Fatores humanos' },
                    { key: 'method', label: 'Método', icon: '📋', desc: 'Processos e padrões' },
                    { key: 'machine', label: 'Máquina', icon: '⚙️', desc: 'Equipamentos e ferramentas' },
                    { key: 'material', label: 'Material', icon: '📦', desc: 'Insumos e matérias-primas' },
                    { key: 'measurement', label: 'Medida', icon: '📏', desc: 'Dados e métricas' },
                    { key: 'environment', label: 'Meio Ambiente', icon: '🌱', desc: 'Local e condições' }
                  ] as const).map((cat) => (
                    <div key={cat.key} className="flex flex-col space-y-3 p-5 bg-gray-50/50 rounded-2xl border border-gray-100 group">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-xl">{cat.icon}</span>
                          <span className="font-black text-gray-900 text-sm uppercase tracking-tight">{cat.label}</span>
                        </div>
                        <button 
                          type="button"
                          onClick={() => {
                            const newData = { ...formData.ishikawaData };
                            newData[cat.key] = [...newData[cat.key], { text: '', status: 'green' }];
                            setFormData({ ...formData, ishikawaData: newData });
                          }}
                          className="p-1.5 bg-white rounded-lg border border-gray-200 text-primary hover:bg-primary hover:text-white transition-all shadow-sm"
                        >
                          <CheckCircle2 className="size-3" />
                        </button>
                      </div>
                      
                      <div className="space-y-2 min-h-[100px]">
                        {formData.ishikawaData[cat.key].map((item, idx) => (
                          <div key={idx} className="flex items-start gap-2 bg-white p-2 rounded-xl shadow-sm border border-gray-100 animate-in fade-in slide-in-from-top-1">
                            <button 
                              type="button"
                              onClick={() => {
                                const newData = { ...formData.ishikawaData };
                                const statusMap: Record<string, 'green'|'yellow'|'red'> = { green: 'yellow', yellow: 'red', red: 'green' };
                                newData[cat.key][idx].status = statusMap[item.status];
                                setFormData({ ...formData, ishikawaData: newData });
                              }}
                              className={`size-3 rounded-full mt-1.5 shrink-0 transition-all ${
                                item.status === 'green' ? 'bg-green-500 shadow-lg shadow-green-200' :
                                item.status === 'yellow' ? 'bg-yellow-500 shadow-lg shadow-yellow-200' :
                                'bg-red-500 shadow-lg shadow-red-200'
                              }`}
                            />
                            <div className="flex-1 min-w-0">
                              <textarea 
                                className="w-full bg-transparent border-none focus:ring-0 p-0 text-[11px] font-bold text-gray-700 placeholder:text-gray-300 resize-none leading-tight"
                                placeholder="..."
                                rows={1}
                                value={item.text}
                                onChange={(e) => {
                                  const newData = { ...formData.ishikawaData };
                                  newData[cat.key][idx].text = e.target.value;
                                  setFormData({ ...formData, ishikawaData: newData });
                                }}
                              />
                            </div>
                            <button 
                              type="button"
                              onClick={() => {
                                const newData = { ...formData.ishikawaData };
                                newData[cat.key] = newData[cat.key].filter((_, i) => i !== idx);
                                setFormData({ ...formData, ishikawaData: newData });
                              }}
                              className="text-gray-200 hover:text-red-500 transition-colors"
                            >
                              <X className="size-3" />
                            </button>
                          </div>
                        ))}
                        {formData.ishikawaData[cat.key].length === 0 && (
                          <div className="h-full flex flex-col items-center justify-center p-4 border-2 border-dashed border-gray-200 rounded-xl">
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Nenhuma causa</p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="md:col-span-4 mt-6">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            className="bg-primary/5 p-8 rounded-xl border border-primary/20 shadow-lg"
          >
            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 bg-primary rounded-xl text-white">
                <AlertTriangle className="size-6" />
              </div>
              <h4 className="text-xl font-headline font-bold text-text">Conclusão: Causa Raiz</h4>
            </div>
            <div className="flex flex-col">
              <label className="text-[10px] font-bold uppercase tracking-wider text-text-muted mb-2">DECLARAÇÃO CONFIRMADA DA CAUSA RAIZ</label>
              <textarea 
                className="minimal-input font-bold text-xl text-text py-4 leading-snug border-primary/20" 
                rows={2}
                placeholder="Defina a falha fundamental..."
                value={formData.rootCause}
                onChange={(e) => setFormData({ ...formData, rootCause: e.target.value })}
              />
            </div>
          </motion.div>
        </div>

        {/* Action Buttons */}
        <div className="md:col-span-4 flex flex-col sm:flex-row justify-between items-center gap-6 pt-12 border-t border-border/30">
          <button className="flex items-center gap-2 text-text-muted hover:text-error transition-colors font-bold text-xs uppercase tracking-widest group">
            <Trash2 className="size-4" />
            Descartar Rascunho
          </button>
          
          <div className="flex flex-wrap justify-center items-center gap-4">
            <AnimatePresence>
              {showSuccess && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9, x: 20 }}
                  animate={{ opacity: 1, scale: 1, x: 0 }}
                  exit={{ opacity: 0, scale: 0.9, x: 20 }}
                  className="bg-green-50 text-green-700 px-4 py-2 rounded-lg border border-green-200 text-xs font-bold flex items-center gap-2 shadow-sm"
                >
                  <CheckCircle2 className="size-4" />
                  Progresso Salvo!
                </motion.div>
              )}
            </AnimatePresence>

            <button 
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className={`px-8 py-3.5 rounded-xl border border-border text-text-muted font-bold text-xs uppercase tracking-widest hover:bg-card transition-all flex items-center gap-2 relative overflow-hidden ${isSaving ? 'cursor-wait opacity-80' : ''}`}
            >
              {isSaving && (
                <motion.div 
                  initial={{ rotate: 0 }}
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                  className="size-3 border-2 border-primary border-t-transparent rounded-full"
                />
              )}
              {isSaving ? 'Salvando...' : 'Salvar Progresso'}
            </button>
            <button 
              type="submit"
              disabled={isSaving}
              className="px-8 py-3.5 rounded-xl bg-primary text-white font-bold text-xs uppercase tracking-widest shadow-xl shadow-primary/30 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
            >
              {isSaving ? 'Enviando...' : 'Enviar Relatório'}
            </button>
          </div>
        </div>
        {saveError && (
          <div className="md:col-span-4 mt-4 p-4 bg-red-50 text-red-600 rounded-xl border border-red-100 text-sm font-medium">
            Erro ao salvar: {saveError}
          </div>
        )}
      </form>

      <EmployeeModal 
        isOpen={isEmployeeModalOpen}
        onClose={() => setIsEmployeeModalOpen(false)}
      />

      <LocationModal 
        isOpen={isLocationModalOpen}
        onClose={() => setIsLocationModalOpen(false)}
      />
    </div>
  );
}
