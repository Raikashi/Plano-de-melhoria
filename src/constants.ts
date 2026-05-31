export interface Employee {
  id: number;
  name: string;
  sector: string;
  phone: string;
}

export const EMPLOYEES: Employee[] = [
  { id: 1, name: 'João Silva', sector: 'Produção', phone: '5511999999999' },
  { id: 2, name: 'Maria Oliveira', sector: 'Logística', phone: '5511888888888' },
  { id: 3, name: 'Carlos Santos', sector: 'Qualidade', phone: '5511777777777' },
  { id: 4, name: 'Ana Costa', sector: 'Engenharia', phone: '5511666666666' },
  { id: 5, name: 'Ricardo Pereira', sector: 'Expedição', phone: '5511555555555' },
];
