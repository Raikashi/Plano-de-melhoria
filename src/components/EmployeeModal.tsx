import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, UserPlus, Phone, Briefcase, Trash2 } from 'lucide-react';
import { db } from '../lib/firebase';
import { collection, addDoc, getDocs, deleteDoc, doc, onSnapshot, query, orderBy } from 'firebase/firestore';

interface Employee {
  id: string;
  name: string;
  sector: string;
  phone: string;
}

export default function EmployeeModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [newEmployee, setNewEmployee] = useState({ name: '', sector: '', phone: '' });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    // Removing orderBy to ensure no index issues
    const q = query(collection(db, 'employees'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Employee));
      const sortedData = [...data].sort((a, b) => a.name.localeCompare(b.name));
      setEmployees(sortedData);
    }, (error) => {
       console.error("Firestore listener error:", error);
    });
    return () => unsubscribe();
  }, [isOpen]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmployee.name || !newEmployee.sector || !newEmployee.phone || loading) return;
    setLoading(true);
    try {
      await addDoc(collection(db, 'employees'), {
        ...newEmployee,
        createdAt: new Date().toISOString()
      });
      setNewEmployee({ name: '', sector: '', phone: '' });
    } catch (err) {
      console.error("Add error:", err);
      alert("Erro ao adicionar funcionário. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'employees', id));
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="bg-white rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl relative z-10"
          >
            <div className="p-8 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <div>
                <h3 className="text-2xl font-black text-gray-900 tracking-tight">Gerenciar Responsáveis</h3>
                <p className="text-sm text-gray-500 font-medium mt-1">Adicione ou remova funcionários do banco de dados.</p>
              </div>
              <button 
                onClick={onClose}
                className="p-2 hover:bg-gray-200 rounded-full transition-colors"
              >
                <X className="size-6 text-gray-400" />
              </button>
            </div>

            <div className="p-8 space-y-8 max-h-[70vh] overflow-y-auto">
              {/* Form to add new */}
              <form onSubmit={handleAdd} className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-blue-50/50 p-6 rounded-2xl border border-blue-100">
                <div className="flex flex-col">
                  <label className="text-[10px] font-bold text-blue-600 uppercase mb-1">Nome Completo</label>
                  <div className="relative">
                    <UserPlus className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-blue-400" />
                    <input 
                      type="text"
                      className="w-full bg-white border border-blue-200 rounded-xl py-2 pl-10 pr-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                      placeholder="Ex: João Silva"
                      value={newEmployee.name}
                      onChange={e => setNewEmployee({...newEmployee, name: e.target.value})}
                    />
                  </div>
                </div>
                <div className="flex flex-col">
                  <label className="text-[10px] font-bold text-blue-600 uppercase mb-1">Setor</label>
                  <div className="relative">
                    <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-blue-400" />
                    <input 
                      type="text"
                      className="w-full bg-white border border-blue-200 rounded-xl py-2 pl-10 pr-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                      placeholder="Ex: Produção"
                      value={newEmployee.sector}
                      onChange={e => setNewEmployee({...newEmployee, sector: e.target.value})}
                    />
                  </div>
                </div>
                <div className="flex flex-col">
                  <label className="text-[10px] font-bold text-blue-600 uppercase mb-1">Telefone (WhatsApp)</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-blue-400" />
                    <input 
                      type="text"
                      className="w-full bg-white border border-blue-200 rounded-xl py-2 pl-10 pr-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                      placeholder="Ex: 5511999999999"
                      value={newEmployee.phone}
                      onChange={e => setNewEmployee({...newEmployee, phone: e.target.value})}
                    />
                  </div>
                </div>
                <button 
                  disabled={loading || !newEmployee.name || !newEmployee.sector || !newEmployee.phone}
                  className="md:col-span-3 py-3 rounded-xl font-bold text-sm transition-all shadow-lg bg-blue-600 shadow-blue-200 hover:bg-blue-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                  type="submit"
                >
                  {loading ? 'Adicionando...' : 'Adicionar Responsável'}
                </button>
              </form>

              {/* List of employees */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Contatos Cadastrados ({employees.length})</h4>
                {employees.length === 0 ? (
                  <div className="text-center py-12 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                    <p className="text-sm text-gray-400">Banco de dados zerado. Comece adicionando acima.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-3">
                    {employees.map(emp => (
                      <div key={emp.id} className="flex items-center justify-between p-4 bg-white border border-gray-100 rounded-2xl hover:border-blue-200 transition-all shadow-sm group">
                        <div className="flex items-center gap-4">
                          <div className="size-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 font-bold uppercase">
                            {emp.name.charAt(0)}
                          </div>
                          <div>
                            <p className="font-bold text-gray-900">{emp.name}</p>
                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter">
                              {emp.sector} • {emp.phone}
                            </p>
                          </div>
                        </div>
                        <button 
                          onClick={() => handleDelete(emp.id)}
                          className="p-2 text-gray-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                        >
                          <Trash2 className="size-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
