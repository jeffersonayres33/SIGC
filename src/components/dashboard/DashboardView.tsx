import React from 'react';
import { 
  Users, 
  Building2, 
  Coins, 
  Scale, 
  Compass, 
  CheckCircle2, 
  AlertTriangle, 
  TrendingUp, 
  ArrowUpRight,
  ShieldCheck,
  FileCheck,
  Zap,
  Activity,
  Calendar,
  Settings
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  PieChart, 
  Pie, 
  Cell, 
  LineChart, 
  Line, 
  CartesianGrid 
} from 'recharts';
import { storageService } from '../../services/storageService';
import { MainSection } from '../Sidebar';

interface DashboardViewProps {
  onNavigate: (section: MainSection) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ onNavigate }) => {
  const council = storageService.getCouncilConfig();
  const empresas = storageService.getEmpresas();
  const lancamentos = storageService.getLancamentos();
  const cobrancas = storageService.getCobrancas();
  const fiscalizacoes = storageService.getTermosFiscalizacao();
  const network = storageService.getNetworkStatus();

  // Metrics
  const empresasRegulares = empresas.filter(e => e.condicao === 'Regular').length;
  const empresasIrregulares = empresas.filter(e => e.condicao === 'Irregular').length;
  const totalArrecadado = lancamentos
    .filter(l => l.status === 'Pago')
    .reduce((acc, curr) => acc + curr.valorTotal, 0);
  const totalInadimplente = lancamentos
    .filter(l => l.status === 'Vencido' || l.status === 'Em Cobrança Judicial')
    .reduce((acc, curr) => acc + curr.valorTotal, 0);

  // Chart data
  const arrecadacaoMensal = [
    { mes: 'Jan', arrecadado: 480000, meta: 450000 },
    { mes: 'Fev', arrecadado: 590000, meta: 500000 },
    { mes: 'Mar (Anuidade)', arrecadado: 1420000, meta: 1200000 },
    { mes: 'Abr', arrecadado: 380000, meta: 350000 },
    { mes: 'Mai', arrecadado: 410000, meta: 380000 },
    { mes: 'Jun', arrecadado: 450000, meta: 400000 },
    { mes: 'Jul', arrecadado: 490000, meta: 420000 },
    { mes: 'Ago', arrecadado: 520000, meta: 460000 },
    { mes: 'Set (Atual)', arrecadado: 395000, meta: 450000 },
  ];

  const situacaoEmpresasData = [
    { name: 'Regulares (RT Ativa)', value: empresasRegulares, color: '#10b981' },
    { name: 'Irregulares (Sem RT / Notificada)', value: empresasIrregulares, color: '#f59e0b' },
    { name: 'Em Cobrança / Dívida Ativa', value: 8, color: '#ef4444' },
    { name: 'Inativas / Baixadas', value: 5, color: '#64748b' },
  ];

  const fiscalizacoesPorTipo = [
    { name: 'Rotina Semestral', total: 640 },
    { name: 'Denúncia de Cidadão', total: 128 },
    { name: 'Reinspeção Notificados', total: 95 },
    { name: 'À Distância / Digital', total: 310 },
  ];

  return (
    <div className="space-y-6 pb-12">
      {/* Welcome Banner */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 relative z-10">
          <div>
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold mb-2">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
              <span>SIGC Cloud • Painel Executivo & Regulatório</span>
            </div>
            <h1 className="text-2xl lg:text-3xl font-bold text-slate-900 tracking-tight">
              {council.sigla} - Sistema Central de Governança
            </h1>
            <p className="text-slate-600 text-xs sm:text-sm mt-1 max-w-3xl leading-relaxed">
              Monitoramento unificado de {council.totalProfissionaisRegistrados.toLocaleString('pt-BR')} profissionais habilitados e {council.totalEmpresasRegistradas.toLocaleString('pt-BR')} estabelecimentos farmacêuticos em toda a jurisdição do conselho.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => onNavigate('fiscalizacao')}
              className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm shadow-emerald-600/20 transition-all"
            >
              <Compass className="w-4 h-4" />
              <span>Modo Fiscal GPS</span>
            </button>
            <button
              onClick={() => onNavigate('configuracoes')}
              className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 text-xs font-semibold transition-all"
            >
              <Settings className="w-4 h-4 text-slate-500" />
              <span>Configurações</span>
            </button>
          </div>
        </div>
      </div>

      {/* Top 4 Key Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Profissionais */}
        <div 
          onClick={() => onNavigate('profissionais')}
          className="bg-white border border-slate-200 rounded-2xl p-5 hover:border-blue-300 hover:shadow-md cursor-pointer transition-all group shadow-xs"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Profissionais Ativos</span>
            <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 group-hover:scale-105 transition-transform">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-slate-900 font-mono">
              {council.totalProfissionaisRegistrados.toLocaleString('pt-BR')}
            </span>
            <span className="text-xs font-bold text-emerald-600 flex items-center">
              +142 neste mês <ArrowUpRight className="w-3.5 h-3.5 ml-0.5" />
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">94.2% em situação regular definitiva</p>
        </div>

        {/* Card 2: Empresas & Firmas */}
        <div 
          onClick={() => onNavigate('empresas')}
          className="bg-white border border-slate-200 rounded-2xl p-5 hover:border-cyan-300 hover:shadow-md cursor-pointer transition-all group shadow-xs"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Firmas & Estabelecimentos</span>
            <div className="w-10 h-10 rounded-xl bg-cyan-50 border border-cyan-100 flex items-center justify-center text-cyan-600 group-hover:scale-105 transition-transform">
              <Building2 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-slate-900 font-mono">
              {council.totalEmpresasRegistradas.toLocaleString('pt-BR')}
            </span>
            <span className="text-xs font-bold text-emerald-600 flex items-center">
              {Math.round((empresasRegulares / (empresas.length || 1)) * 100)}% CRT Vigente
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">{empresasIrregulares} empresas sem RT ou notificadas</p>
        </div>

        {/* Card 3: Arrecadação Financeira */}
        <div 
          onClick={() => onNavigate('financeiro')}
          className="bg-white border border-slate-200 rounded-2xl p-5 hover:border-amber-300 hover:shadow-md cursor-pointer transition-all group shadow-xs"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Arrecadação Ex. 2026</span>
            <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600 group-hover:scale-105 transition-transform">
              <Coins className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-slate-900 font-mono">
              R$ 5.06M
            </span>
            <span className="text-xs font-bold text-emerald-600 flex items-center">
              +12.4% vs 2025
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">87.5% de adimplência na anuidade</p>
        </div>

        {/* Card 4: Fiscalizações & Vistorias */}
        <div 
          onClick={() => onNavigate('fiscalizacao')}
          className="bg-white border border-slate-200 rounded-2xl p-5 hover:border-emerald-300 hover:shadow-md cursor-pointer transition-all group shadow-xs"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Vistorias em Campo (Ano)</span>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 group-hover:scale-105 transition-transform">
              <Compass className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-slate-900 font-mono">
              1.173
            </span>
            <span className="text-xs font-bold text-blue-600 flex items-center">
              100% Digital / GPS
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">{network.queueSize} termos na fila offline</p>
        </div>
      </div>

      {/* Main Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly Revenue Chart (2 cols) */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Fluxo Financeiro & Arrecadação Mensal</h2>
              <p className="text-xs text-slate-500">Comparativo entre valor arrecadado vs meta orçamentária do Conselho</p>
            </div>
            <span className="text-xs font-mono text-emerald-800 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full font-bold">
              Total Acumulado: R$ 5.060.000,00
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={arrecadacaoMensal} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="mes" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} tickFormatter={(v) => `R$ ${(v / 1000)}k`} />
                <Tooltip 
                  formatter={(value: any) => [`R$ ${Number(value).toLocaleString('pt-BR')}`, '']}
                  contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '12px', color: '#1e293b', fontSize: '12px', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                />
                <Bar dataKey="arrecadado" name="Arrecadado Real" fill="#2563eb" radius={[4, 4, 0, 0]} />
                <Bar dataKey="meta" name="Meta Orçamentária" fill="#cbd5e1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Regularity Distribution Chart (1 col) */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Situação Cadastral das Firmas</h2>
            <p className="text-xs text-slate-500">Status de regularidade técnica e assistência farmacêutica</p>
          </div>

          <div className="h-52 w-full my-auto">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={situacaoEmpresasData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {situacaoEmpresasData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '8px', color: '#0f172a' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-1.5 pt-3 border-t border-slate-100 text-xs">
            {situacaoEmpresasData.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-slate-600">{item.name}</span>
                </div>
                <span className="font-bold text-slate-800 font-mono">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
