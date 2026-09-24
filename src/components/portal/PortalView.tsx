import React, { useState } from 'react';
import { 
  UserCheck, 
  FileCheck2, 
  Coins, 
  FileText, 
  Plus, 
  Building2, 
  QrCode, 
  Download, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight, 
  ShieldCheck, 
  Send, 
  Printer,
  Sparkles,
  CreditCard
} from 'lucide-react';
import { storageService } from '../../services/storageService';
import { LancamentoFinanceiro, Empresa } from '../../types';
import { toastService } from '../../services/toastService';

interface PortalViewProps {
  onOpenBoletoPix?: (lanc: LancamentoFinanceiro) => void;
  onOpenCrtModal?: (empresa: Empresa) => void;
}

export const PortalView: React.FC<PortalViewProps> = ({ onOpenBoletoPix, onOpenCrtModal }) => {
  const [activeSubTab, setActiveSubTab] = useState<'PROFISSIONAL' | 'EMPRESA'>('PROFISSIONAL');
  const [protocoloAssunto, setProtocoloAssunto] = useState('Assunção de Responsabilidade Técnica (RT)');
  const [protocoloDetalhes, setProtocoloDetalhes] = useState('');

  // Mock logged user
  const profLogado = storageService.getProfissionaisPaginated(1, 1).items[0];
  const empresaLogada = storageService.getEmpresas()[0];
  const lancamentos = storageService.getLancamentos();

  const handleCreateProtocolo = (e: React.FormEvent) => {
    e.preventDefault();
    const protNum = `PROT-2026/${Math.floor(1000 + Math.random() * 9000)}`;
    toastService.success(
      'Requerimento Protocolado',
      `Seu pedido foi registrado com o protocolo eletrônico nº ${protNum}.`
    );
    setProtocoloDetalhes('');
  };

  const handleEmitirQuitacao = () => {
    toastService.success(
      'Certidão Negativa Emitida',
      `Certidão de Quitação de Débitos e Regularidade Eleitoral de ${profLogado?.nome} gerada com validação criptográfica.`
    );
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white border border-slate-200 p-4 sm:p-5 rounded-2xl shadow-xs">
        <div className="flex items-center space-x-3.5">
          <div className="w-11 h-11 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shadow-xs">
            <UserCheck className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900 flex items-center space-x-2">
              <span>Portal do Inscrito & Autoatendimento Cidadão</span>
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Ambiente seguro para emissão instantânea de CRT, certidões de quitação e peticionamento eletrônico.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-1.5 bg-slate-100 p-1.5 rounded-xl border border-slate-200">
          <button
            onClick={() => setActiveSubTab('PROFISSIONAL')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeSubTab === 'PROFISSIONAL'
                ? 'bg-white text-blue-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Farmacêutico (PF)
          </button>
          <button
            onClick={() => setActiveSubTab('EMPRESA')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeSubTab === 'EMPRESA'
                ? 'bg-white text-cyan-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Estabelecimento (PJ)
          </button>
        </div>
      </div>

      {activeSubTab === 'PROFISSIONAL' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Left: Professional Card & Certificates */}
          <div className="space-y-4">
            <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3 shadow-xs">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 font-bold text-base font-mono">
                  {profLogado?.inscricao.replace('CRF-AM ', '') || '1000'}
                </div>
                <div>
                  <h2 className="font-bold text-slate-900 text-sm">{profLogado?.nome || 'Dra. Marcela Silva'}</h2>
                  <p className="text-slate-500 text-xs font-mono">{profLogado?.inscricao} • CPF: {profLogado?.cpf}</p>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">Situação Cadastral:</span>
                  <span className="font-bold text-emerald-700">{profLogado?.situacao || 'Definitivo'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Habilitação:</span>
                  <span className="font-medium text-slate-800">{profLogado?.tipoAssociado || 'Farmacêutico'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Status Financeiro:</span>
                  <span className="font-bold text-blue-700">{profLogado?.statusFinanceiro || 'Adimplente'}</span>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 space-y-2">
                <button
                  onClick={handleEmitirQuitacao}
                  className="w-full flex items-center justify-center space-x-2 py-2.5 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs rounded-xl border border-blue-200 transition-colors"
                >
                  <FileCheck2 className="w-4 h-4" />
                  <span>Emitir Certidão de Quitação / Negativa</span>
                </button>
              </div>
            </div>
          </div>

          {/* Right: Electronic Petitions & Pending Boletos */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-3">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2">
                Peticionamento Eletrônico & Requerimentos Online
              </h3>

              <form onSubmit={handleCreateProtocolo} className="space-y-3 text-xs">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Assunto do Requerimento</label>
                  <select
                    value={protocoloAssunto}
                    onChange={(e) => setProtocoloAssunto(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-medium"
                  >
                    <option value="Assunção de Responsabilidade Técnica (RT)">Assunção de Responsabilidade Técnica (RT)</option>
                    <option value="Baixa de Responsabilidade Técnica">Baixa de Responsabilidade Técnica</option>
                    <option value="Solicitação de 2ª Via de Carteira">Solicitação de 2ª Via de Carteira Profissional</option>
                    <option value="Defesa Prévia de Fiscalização">Defesa Prévia de Fiscalização</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Justificativa e Detalhes da Solicitação</label>
                  <textarea
                    rows={3}
                    required
                    value={protocoloDetalhes}
                    onChange={(e) => setProtocoloDetalhes(e.target.value)}
                    placeholder="Descreva o motivo da sua solicitação ao conselho..."
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900"
                  />
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    className="flex items-center space-x-1.5 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md shadow-blue-500/20 transition-all"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Protocolar Requerimento Digital</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-base font-bold text-slate-900">{empresaLogada?.razaoSocial}</h2>
              <p className="text-xs text-slate-500 font-mono">CNPJ: {empresaLogada?.cnpj} • {empresaLogada?.inscricao}</p>
            </div>
            {onOpenCrtModal && (
              empresaLogada?.condicao === 'Regular' ? (
                <button
                  onClick={() => onOpenCrtModal(empresaLogada)}
                  className="flex items-center space-x-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-sm shadow-emerald-500/20 transition-all cursor-pointer"
                >
                  <FileCheck2 className="w-4 h-4" />
                  <span>Emitir CRT Digital (Com QR Code)</span>
                </button>
              ) : (
                <button
                  onClick={() => onOpenCrtModal(empresaLogada)}
                  className="flex items-center space-x-2 px-4 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-300 font-bold text-xs rounded-xl shadow-sm transition-all cursor-pointer"
                  title="Emissão vedada: Estabelecimento na condição Irregular"
                >
                  <FileCheck2 className="w-4 h-4 text-rose-600" />
                  <span>CRT Bloqueada ({empresaLogada?.condicao?.toUpperCase()})</span>
                </button>
              )
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-slate-500 block">Condição Sanitária / Conselho</span>
              <strong className="text-emerald-700 text-sm">{empresaLogada?.condicao}</strong>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-slate-500 block">Validade CRT Vigente</span>
              <strong className="text-slate-900 text-sm font-mono">{empresaLogada?.validadeCRT}</strong>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-slate-500 block">Assistência Farmacêutica</span>
              <strong className="text-blue-700 text-sm">{empresaLogada?.assistenciaPlena ? 'Plena (Horário Integral)' : 'Parcial'}</strong>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
