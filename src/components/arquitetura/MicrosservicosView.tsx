import React from 'react';
import { 
  Cpu, 
  Server, 
  Database, 
  ShieldCheck, 
  Activity, 
  Layers, 
  Network, 
  Zap, 
  HardDrive, 
  CheckCircle2, 
  ArrowRight,
  Boxes
} from 'lucide-react';
import { storageService } from '../../services/storageService';

export const MicrosservicosView: React.FC = () => {
  const council = storageService.getCouncilConfig();

  const services = [
    {
      id: 'srv-gateway',
      name: 'API Gateway & Reverse Proxy',
      port: ':3000 / :8080',
      status: 'Operacional (100% SLA)',
      tech: 'Node.js Express + Nginx Reverse Proxy',
      instances: '3 Replicas (Auto-scaling)',
      latency: '8ms',
      throughput: '1.450 req/s',
      desc: 'Roteamento seguro, rate limiting (anti-DDoS), autenticação JWT e terminação SSL/TLS.'
    },
    {
      id: 'srv-cadastros',
      name: 'Core Registry Service (PF & PJ)',
      port: ':4001',
      status: 'Operacional (10k+ Profissionais)',
      tech: 'Node.js TypeScript + Distributed Storage Engine',
      instances: '4 Replicas',
      latency: '12ms',
      throughput: '890 req/s',
      desc: 'Gestão de 10.000+ profissionais e 1.300+ empresas com controle de diplomas, RTs e validade de CRTs.'
    },
    {
      id: 'srv-financeiro',
      name: 'Financial & Pix Gateway Service',
      port: ':4002',
      status: 'Operacional (FEBRABAN / BACEN)',
      tech: 'Node.js + Webhook Baixa Automática',
      instances: '3 Replicas',
      latency: '15ms',
      throughput: '420 req/s',
      desc: 'Geração de boletos com registro bancário CIP, chaves Pix dinâmicas e simulador Refis.'
    },
    {
      id: 'srv-fiscalizacao',
      name: 'Field Inspection & GPS Sync Service',
      port: ':4003',
      status: 'Operacional (Offline-First Engine)',
      tech: 'Node.js + IndexedDB Sync Queue + GeoJSON Engine',
      instances: '2 Replicas',
      latency: '18ms',
      throughput: '210 req/s',
      desc: 'Sincronização bidirecional de termos de inspeção com telemetria GPS e captura de assinatura touchscreen.'
    },
    {
      id: 'srv-juridico',
      name: 'Legal & Extrajudicial CDA Engine',
      port: ':4004',
      status: 'Operacional (Livro Dívida Ativa)',
      tech: 'Node.js + Assinador ICP-Brasil',
      instances: '2 Replicas',
      latency: '11ms',
      throughput: '150 req/s',
      desc: 'Lavratura de CDAs, régua de execução fiscal extrajudicial e integração com cartórios de protesto.'
    },
    {
      id: 'srv-analytics',
      name: 'Analytics BI & Report Streaming Engine',
      port: ':4005',
      status: 'Operacional (Stream CSV/PDF)',
      tech: 'Node.js + Fast Streaming Query Pipeline',
      instances: '2 Replicas',
      latency: '24ms',
      throughput: '320 req/s',
      desc: 'Exportação em alta velocidade de relatórios customizáveis com ordenação múltipla e filtragem multicritério.'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white border border-slate-200 p-5 rounded-2xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 shadow-xs">
        <div className="flex items-center space-x-3.5">
          <div className="w-11 h-11 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shadow-xs">
            <Boxes className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900 flex items-center space-x-2">
              <span>Topologia da Arquitetura de Microsserviços & Escalabilidade</span>
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Infraestrutura distribuída do {council.nomeCompleto} projetada para 10.000+ profissionais e 10.000+ empresas simultâneas.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <span className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200">
            <Activity className="w-3.5 h-3.5 animate-pulse text-emerald-600" />
            <span>Cluster Saudável (100% SLA)</span>
          </span>
        </div>
      </div>

      {/* Grid of Microservices */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {services.map((srv) => (
          <div
            key={srv.id}
            className="bg-white border border-slate-200 rounded-2xl p-5 hover:border-blue-300 hover:shadow-md transition-all space-y-3.5 shadow-xs flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="p-2 rounded-xl bg-blue-50 border border-blue-100 text-blue-600">
                    <Server className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-xs">{srv.name}</h3>
                    <span className="text-[10px] font-mono text-slate-400">{srv.port}</span>
                  </div>
                </div>
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-xs shadow-emerald-500/50" />
              </div>

              <p className="text-[11px] text-slate-600 leading-relaxed mt-3">{srv.desc}</p>
            </div>

            <div className="space-y-2 border-t border-slate-100 pt-3 text-[11px]">
              <div className="flex justify-between">
                <span className="text-slate-400">Stack:</span>
                <span className="font-semibold text-slate-700">{srv.tech}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Latência / Vazão:</span>
                <span className="font-mono text-emerald-700 font-bold">{srv.latency} • {srv.throughput}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Instâncias Ativas:</span>
                <span className="font-mono text-blue-700 font-bold">{srv.instances}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Security & Resilience Banner */}
      <div className="bg-slate-900 text-white rounded-2xl p-5 sm:p-6 shadow-md flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-1.5 text-left">
          <div className="flex items-center space-x-2 text-blue-400 text-xs font-bold uppercase tracking-wider">
            <ShieldCheck className="w-4 h-4" />
            <span>Conformidade LGPD & Segurança Criptográfica ICP-Brasil</span>
          </div>
          <h2 className="text-base font-bold text-white">
            Segurança em Nível Bancário e Armazenamento Criptografado
          </h2>
          <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
            Todos os dados de profissionais, livros contábeis e certidões são protegidos com chaves de criptografia AES-256 e autenticação mTLS entre os nós de microsserviços.
          </p>
        </div>

        <div className="flex items-center space-x-3 shrink-0">
          <div className="px-4 py-2.5 rounded-xl bg-white/10 border border-white/10 text-xs font-mono text-slate-200">
            TLS 1.3 • AES-256-GCM
          </div>
        </div>
      </div>
    </div>
  );
};
