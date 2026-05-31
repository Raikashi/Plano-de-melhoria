import { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { collection, onSnapshot, query, orderBy, limit } from 'firebase/firestore';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, LineChart, Line, Legend 
} from 'recharts';
import { LayoutDashboard, AlertTriangle, TrendingUp, MapPin, CheckCircle2, Clock, FileText } from 'lucide-react';
import { motion } from 'motion/react';

interface RecordData {
  id: string;
  type: string;
  location: string;
  createdAt: string;
  status: string;
  eventTitle: string;
}

const COLORS = ['#F97316', '#3B82F6', '#10B981', '#EF4444', '#8B5CF6'];

export default function Dashboard() {
  const [records, setRecords] = useState<RecordData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'records'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as RecordData));
      const sorted = [...data].sort((a, b) => {
        return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
      });
      setRecords(sorted);
      setLoading(false);
    }, (err) => {
      console.error("Dashboard snap listener error:", err);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Process data for charts
  const typeData = [
    { name: 'Ocorrência', value: records.filter(r => r.type === 'ocorrencia').length },
    { name: 'Melhoria', value: records.filter(r => r.type === 'melhoria').length },
  ].filter(d => d.value > 0);

  const locationCounts: Record<string, number> = {};
  records.forEach(r => {
    const loc = r.location || 'Não Definido';
    locationCounts[loc] = (locationCounts[loc] || 0) + 1;
  });
  const locationData = Object.entries(locationCounts).map(([name, value]) => ({ name, value }));

  const statusData = [
    { name: 'Aberto', value: records.filter(r => r.status === 'draft').length },
    { name: 'Submetido', value: records.filter(r => r.status === 'submitted').length },
  ].filter(d => d.value > 0);

  const recentRecords = records.slice(0, 5);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-8 space-y-8"
      id="dashboard-container"
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-gray-900 tracking-tight flex items-center gap-3">
            <LayoutDashboard className="size-8 text-primary" />
            DASHBOARD DA QUALIDADE
          </h2>
          <p className="text-sm text-gray-500 font-bold uppercase tracking-widest mt-1">Visão geral do sistema ISO 9001</p>
        </div>
        <div className="bg-white px-6 py-2 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="text-right">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Total de Registros</p>
            <p className="text-2xl font-black text-primary leading-none">{records.length}</p>
          </div>
          <div className="size-10 bg-primary/10 rounded-xl flex items-center justify-center">
            <FileText className="size-5 text-primary" />
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard 
          icon={<AlertTriangle className="size-5" />}
          label="Ocorrências"
          value={records.filter(r => r.type === 'ocorrencia').length}
          color="text-orange-600"
          bgColor="bg-orange-50"
        />
        <StatCard 
          icon={<TrendingUp className="size-5" />}
          label="Melhorias"
          value={records.filter(r => r.type === 'melhoria').length}
          color="text-blue-600"
          bgColor="bg-blue-50"
        />
        <StatCard 
          icon={<CheckCircle2 className="size-5" />}
          label="Eficácia Média"
          value="94%"
          color="text-green-600"
          bgColor="bg-green-50"
        />
        <StatCard 
          icon={<Clock className="size-5" />}
          label="Prazos Atendidos"
          value="100%"
          color="text-purple-600"
          bgColor="bg-purple-50"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Type Distribution */}
        <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
          <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest mb-8 border-l-4 border-primary pl-4">Distribuição por Tipo</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={typeData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {typeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Location Distribution */}
        <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
          <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest mb-8 border-l-4 border-primary pl-4">Registros por Local</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={locationData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} fontSize={10} tick={{ fill: '#9CA3AF', fontWeight: 'bold' }} />
                <YAxis axisLine={false} tickLine={false} fontSize={10} tick={{ fill: '#9CA3AF', fontWeight: 'bold' }} />
                <Tooltip 
                  cursor={{ fill: '#F9731610' }}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="value" fill="#F97316" radius={[4, 4, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Records List */}
        <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm md:col-span-2">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest border-l-4 border-primary pl-4">Últimos Registros</h3>
            <button className="text-[10px] font-black text-primary uppercase tracking-widest hover:underline">Ver Todos</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-gray-50">
                  <th className="pb-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">ID</th>
                  <th className="pb-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Título</th>
                  <th className="pb-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Local</th>
                  <th className="pb-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Tipo</th>
                  <th className="pb-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Data</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {recentRecords.map((record) => (
                  <tr key={record.id} className="group hover:bg-gray-50 transition-colors">
                    <td className="py-4 font-mono text-xs text-gray-400">{record.id.slice(0, 8)}</td>
                    <td className="py-4">
                      <p className="text-sm font-bold text-gray-900">{record.eventTitle || 'Sem Título'}</p>
                    </td>
                    <td className="py-4">
                      <div className="flex items-center gap-2 text-xs text-gray-500 font-medium">
                        <MapPin className="size-3" />
                        {record.location}
                      </div>
                    </td>
                    <td className="py-4">
                      <span className={`text-[10px] px-2 py-1 rounded-md font-black uppercase tracking-widest ${
                        record.type === 'ocorrencia' ? 'bg-orange-50 text-orange-600' : 'bg-blue-50 text-blue-600'
                      }`}>
                        {record.type}
                      </span>
                    </td>
                    <td className="py-4 text-[11px] text-gray-400 font-bold">
                      {new Date(record.createdAt).toLocaleDateString('pt-BR')}
                    </td>
                  </tr>
                ))}
                {recentRecords.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-gray-400 font-medium italic text-sm">
                      Nenhum registro encontrado. Comece criando uma nova ação corretiva.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function StatCard({ icon, label, value, color, bgColor }: any) {
  return (
    <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center gap-4">
      <div className={`size-12 ${bgColor} ${color} rounded-2xl flex items-center justify-center`}>
        {icon}
      </div>
      <div>
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{label}</p>
        <p className={`text-2xl font-black ${color} leading-none mt-1`}>{value}</p>
      </div>
    </div>
  );
}
