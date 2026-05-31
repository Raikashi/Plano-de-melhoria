import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, MapPin, Plus, Trash2 } from 'lucide-react';
import { db } from '../lib/firebase';
import { collection, addDoc, deleteDoc, doc, onSnapshot, query, orderBy } from 'firebase/firestore';

interface Location {
  id: string;
  name: string;
}

export default function LocationModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [locations, setLocations] = useState<Location[]>([]);
  const [newName, setNewName] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const q = query(collection(db, 'locations'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Location));
      const sortedData = [...data].sort((a, b) => a.name.localeCompare(b.name));
      setLocations(sortedData);
    }, (error) => {
      console.error("Firestore listener error:", error);
    });
    return () => unsubscribe();
  }, [isOpen]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = newName.trim();
    if (!cleanName || loading) return;
    setLoading(true);
    try {
      await addDoc(collection(db, 'locations'), {
        name: cleanName,
        createdAt: new Date().toISOString()
      });
      setNewName('');
    } catch (err) {
      console.error("Add error:", err);
      alert("Erro ao adicionar local. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'locations', id));
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
            className="bg-white rounded-3xl w-full max-w-xl overflow-hidden shadow-2xl relative z-10"
          >
            <div className="p-8 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <div>
                <h3 className="text-2xl font-black text-gray-900 tracking-tight">Gerenciar Locais</h3>
                <p className="text-sm text-gray-500 font-medium mt-1">Configure os setores ou áreas de ocorrência.</p>
              </div>
              <button 
                onClick={onClose}
                className="p-2 hover:bg-gray-200 rounded-full transition-colors"
              >
                <X className="size-6 text-gray-400" />
              </button>
            </div>

            <div className="p-8 space-y-8 max-h-[70vh] overflow-y-auto">
              <form onSubmit={handleAdd} className="flex gap-4 bg-orange-50/50 p-6 rounded-2xl border border-orange-100">
                <div className="flex-1 flex flex-col">
                  <label className="text-[10px] font-bold text-orange-600 uppercase mb-1">Nome do Local/Setor</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-orange-400" />
                    <input 
                      type="text"
                      className="w-full bg-white border border-orange-200 rounded-xl py-2 pl-10 pr-3 text-sm focus:ring-2 focus:ring-orange-500 outline-none"
                      placeholder="Ex: Refeitório ou Linha B"
                      value={newName}
                      onChange={e => setNewName(e.target.value)}
                    />
                  </div>
                </div>
                 <button 
                  disabled={loading || !newName.trim()}
                  className="px-6 rounded-xl font-bold text-sm transition-all shadow-lg mt-5 flex items-center gap-2 bg-orange-600 shadow-orange-200 hover:bg-orange-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                  type="submit"
                >
                  <Plus className="size-4" />
                </button>
              </form>

              <div className="space-y-3">
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Locais Cadastrados ({locations.length})</h4>
                {locations.length === 0 ? (
                  <div className="text-center py-12 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                    <p className="text-sm text-gray-400">Nenhum local cadastrado.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-3">
                    {locations.map(loc => (
                      <div key={loc.id} className="flex items-center justify-between p-4 bg-white border border-gray-100 rounded-2xl hover:border-orange-200 transition-all shadow-sm group">
                        <div className="flex items-center gap-4">
                          <MapPin className="size-5 text-gray-400" />
                          <p className="font-bold text-gray-900">{loc.name}</p>
                        </div>
                        <button 
                          onClick={() => handleDelete(loc.id)}
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
