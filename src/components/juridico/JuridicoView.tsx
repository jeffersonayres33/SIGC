import React, { useState } from 'react';
import { 
  Scale, 
  Search, 
  Plus, 
  FileText, 
  Gavel, 
  ShieldAlert, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  Download, 
  Eye, 
  Printer, 
  ChevronRight, 
  X, 
  FileCheck2,
  BookOpen
} from 'lucide-react';
import { ProcessoCobranca } from '../../types';
import { storageService } from '../../services/storageService';
import { exportToCSV } from '../../services/exportService';
import { toastService } from '../../services/toastService';

interface JuridicoViewProps {
  onOpenCdaModal?: (cobranca: ProcessoCobranca) => void;
}

export const JuridicoView: React.FC<JuridicoViewProps> = ({ onOpenCdaModal }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [faseFilter, setFaseFilter] = useState<string>('Todos');
  const [selectedProcesso, setSelectedProcesso] = useState<ProcessoCobranca | null>(null);
  const [isNovaCdaModal, setIsNovaCdaModal] = useState(false);

  const [novaCda, setNovaCda] = useState({
    targetNome: '',
    targetDoc: '',
    targetInscricao: '',
    valorTotalDebito: 4800,
    livroCDA: 'Livro 18-A',
    folhaCDA: 'Fls. 155'
  });

  const cobrancas = storageService.getCobrancas().filter(c => {
    const matchesSearch = c.targetNome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.targetDoc.includes(searchTerm) ||
      (c.numeroCDA && c.numeroCDA.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesFase = faseFilter === 'Todos' || c.faseCobranca === faseFilter;
    return matchesSearch && matchesFase;
  });

  const handleExportCSV = () => {
    const data = cobrancas.map(c => ({
      'Devedor': c.targetNome,
      'CPF/CNPJ': c.targetDoc,
      'Inscrição': c.targetInscricao,
      'Valor Débito (R$)': c.valorTotalDebito.toFixed(2),
      'Fase da Execução': c.faseCobranca,
      'Número CDA': c.numeroCDA || 'Não Inscrito',
      'Livro / Folha': `${c.livroCDA || ''} ${c.folhaCDA || ''}`,
      'Status Acordo': c.statusAcordo,
      'Data Limite Defesa': c.dataLimiteDefesa
    }));
    exportToCSV(`processos_juridicos_cda_${Date.now()}`, data);
    toastService.info('Exportação Concluída', `${cobrancas.length} processos jurídicos exportados.`);
  };

  const handleCriarCDA = (e: React.FormEvent) => {
    e.preventDefault();
    if (!novaCda.targetNome || !novaCda.targetDoc) {
      toastService.warning('Campos Obrigatórios', 'Preencha o Nome do Devedor e CPF/CNPJ.');
      return;
    }

    const ano = new Date().getFullYear();
    const cdaNumero = `CDA-${ano}/${Math.floor(1000 + Math.random() * 9000)}`;

    const novoProcesso: ProcessoCobranca = {
      id: `cob-cda-${Date.now()}`,
      targetId: `target-${Date.now()}`,
      targetTipo: 'EMPRESA',
      targetNome: novaCda.targetNome,
      targetDoc: novaCda.targetDoc,
      targetInscricao: novaCda.targetInscricao || 'CRF-AM',
      valorTotalDebito: Number(novaCda.valorTotalDebito),
      qtdLancamentos: 2,
      faseCobranca: 'Inscrição Dívida Ativa',
      dataInicio: new Date().toLocaleDateString('pt-BR'),
      dataUltimaNotificacao: new Date().toLocaleDateString('pt-BR'),
      dataLimiteDefesa: new Date(Date.now() + 15 * 86400000).toLocaleDateString('pt-BR'),
      numeroCDA: cdaNumero,
      livroCDA: novaCda.livroCDA,
      folhaCDA: novaCda.folhaCDA,
      dataCDA: new Date().toLocaleDateString('pt-BR'),
      statusAcordo: 'Sem Acordo',
      historicoNotificacoes: [
        {
          data: new Date().toLocaleDateString('pt-BR'),
          tipo: 'Inscrição em Dívida Ativa',
          descricao: `Lavratura de Certidão de Dívida Ativa nº ${cdaNumero} no ${novaCda.livroCDA} ${novaCda.folhaCDA}`,
          usuario: 'Procuradoria Jurídica'
        }
      ]
    };

    storageService.saveCobranca(novoProcesso);
    setIsNovaCdaModal(false);
    toastService.success(
      'Certidão de Dívida Ativa (CDA) Emitida',
      `Título executivo extrajudicial ${cdaNumero} lavrado no ${novaCda.livroCDA} para ${novaCda.targetNome}.`
    );
  };

  const handleAvancarFase = (processo: ProcessoCobranca) => {
    const fases: ProcessoCobranca['faseCobranca'][] = [
      'Notificação Amigável',
      'Carta de 30 Dias',
      'Notificação Extrajudicial',
      'Inscrição Dívida Ativa',
      'Protesto em Cartório',
      'Execução Fiscal'
    ];
    const currentIndex = fases.indexOf(processo.faseCobranca);
    if (currentIndex < fases.length - 1) {
      const proximaFase = fases[currentIndex + 1];
      processo.faseCobranca = proximaFase;
      processo.historicoNotificacoes.push({
        data: new Date().toLocaleDateString('pt-BR'),
        tipo: proximaFase,
        descricao: `Fase do processo avançada para: ${proximaFase}`,
        usuario: 'Procuradoria Geral'
      });
      storageService.saveCobranca(processo);
      toastService.edit(
        'Fase Processual Atualizada',
        `Processo de ${processo.targetNome} promovido para a fase: ${proximaFase}.`
      );
      setSelectedProcesso({ ...processo });
    }
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white border border-slate-200 p-4 sm:p-5 rounded-2xl shadow-xs">
        <div className="flex items-center space-x-3.5">
          <div className="w-11 h-11 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600 shadow-xs">
            <Scale className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900 flex items-center space-x-2">
              <span>Setor Jurídico & Execução Extrajudicial (CDA / Dívida Ativa)</span>
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Lavratura de Certidões de Dívida Ativa (Lei 6.830/80), notificações extrajudiciais e protesto em cartório.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleExportCSV}
            className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs border border-slate-200 transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Exportar CSV</span>
          </button>
          <button
            onClick={() => setIsNovaCdaModal(true)}
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-sm shadow-purple-500/20 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Inscrever em CDA</span>
          </button>
        </div>
      </div>

      {/* Filter toolbar */}
      <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Buscar por Devedor, CPF/CNPJ ou Nº de CDA..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 transition-all"
            />
          </div>

          <div>
            <select
              value={faseFilter}
              onChange={(e) => setFaseFilter(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 transition-all font-medium"
            >
              <option value="Todos">Todas as Fases Jurídicas</option>
              <option value="Notificação Amigável">Notificação Amigável</option>
              <option value="Carta de 30 Dias">Carta de 30 Dias</option>
              <option value="Notificação Extrajudicial">Notificação Extrajudicial</option>
              <option value="Inscrição Dívida Ativa">Inscrição em Dívida Ativa (CDA)</option>
              <option value="Protesto em Cartório">Protesto em Cartório</option>
              <option value="Execução Fiscal">Execução Fiscal (Justiça Federal)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-600 border-b border-slate-200 font-bold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">Devedor / Inscrição</th>
                <th className="py-3 px-4">Título Executivo / CDA</th>
                <th className="py-3 px-4">Fase do Processo</th>
                <th className="py-3 px-4">Valor em Execução</th>
                <th className="py-3 px-4">Prazo / Defesa</th>
                <th className="py-3 px-4">Status Acordo</th>
                <th className="py-3 px-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {cobrancas.map((proc) => (
                <tr key={proc.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 px-4">
                    <div className="font-bold text-slate-900">{proc.targetNome}</div>
                    <div className="text-[11px] text-slate-500 font-mono">{proc.targetDoc} • {proc.targetInscricao}</div>
                  </td>
                  <td className="py-3 px-4">
                    {proc.numeroCDA ? (
                      <div>
                        <div className="font-bold font-mono text-purple-700">{proc.numeroCDA}</div>
                        <div className="text-[10px] text-slate-400">{proc.livroCDA} • {proc.folhaCDA}</div>
                      </div>
                    ) : (
                      <span className="text-slate-400 italic">Pré-Inscrição</span>
                    )}
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap">
                    <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${
                      proc.faseCobranca === 'Execução Fiscal' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                      proc.faseCobranca === 'Protesto em Cartório' ? 'bg-orange-50 text-orange-700 border-orange-200' :
                      proc.faseCobranca === 'Inscrição Dívida Ativa' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                      'bg-blue-50 text-blue-700 border-blue-200'
                    }`}>
                      {proc.faseCobranca}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-mono font-bold text-slate-900 whitespace-nowrap">
                    R$ {proc.valorTotalDebito.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-600 whitespace-nowrap">
                    {proc.dataLimiteDefesa}
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      proc.statusAcordo === 'Acordo Firmado' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                      proc.statusAcordo === 'Acordo Solicitado' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                      proc.statusAcordo === 'Acordo Rompido' ? 'bg-rose-50 text-rose-700 border border-rose-200' :
                      'bg-slate-100 text-slate-700 border border-slate-200'
                    }`}>
                      {proc.statusAcordo}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right whitespace-nowrap space-x-1">
                    {proc.numeroCDA && onOpenCdaModal && (
                      <button
                        onClick={() => onOpenCdaModal(proc)}
                        className="p-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-lg border border-purple-200 transition-colors"
                        title="Imprimir Certidão de Dívida Ativa (CDA)"
                      >
                        <Printer className="w-3.5 h-3.5 inline" />
                      </button>
                    )}
                    <button
                      onClick={() => setSelectedProcesso(proc)}
                      className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors"
                      title="Ver Autos Processuais"
                    >
                      <Eye className="w-3.5 h-3.5 inline" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Visualização de Processo */}
      {selectedProcesso && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl p-6 text-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center">
                  <Gavel className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900">{selectedProcesso.targetNome}</h2>
                  <div className="text-slate-500 font-mono">{selectedProcesso.targetDoc} • {selectedProcesso.numeroCDA || 'Sem CDA'}</div>
                </div>
              </div>
              <button
                onClick={() => setSelectedProcesso(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
                <div className="text-slate-500 font-bold uppercase text-[10px]">Fase Atual</div>
                <div className="font-bold text-purple-700 text-sm">{selectedProcesso.faseCobranca}</div>
                <div className="text-slate-500">Valor: <strong>R$ {selectedProcesso.valorTotalDebito.toFixed(2)}</strong></div>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
                <div className="text-slate-500 font-bold uppercase text-[10px]">Prazos</div>
                <div>Início: <span className="font-mono text-slate-800">{selectedProcesso.dataInicio}</span></div>
                <div>Limite Defesa: <span className="font-mono text-slate-800">{selectedProcesso.dataLimiteDefesa}</span></div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="font-bold text-slate-700 uppercase tracking-wider text-[10px]">Histórico de Andamentos</div>
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {selectedProcesso.historicoNotificacoes.map((item, idx) => (
                  <div key={idx} className="p-2.5 bg-slate-50 rounded-lg border border-slate-100">
                    <div className="flex justify-between items-center text-slate-400 font-mono text-[10px]">
                      <span>{item.data}</span>
                      <span>{item.usuario}</span>
                    </div>
                    <div className="font-bold text-slate-800 mt-0.5">{item.tipo}</div>
                    <div className="text-slate-600 text-[11px]">{item.descricao}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-between items-center pt-3 border-t border-slate-100">
              <button
                onClick={() => handleAvancarFase(selectedProcesso)}
                className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-purple-50 text-purple-700 border border-purple-200 font-bold hover:bg-purple-100"
              >
                <span>Avançar Fase Processual</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setSelectedProcesso(null)}
                className="px-4 py-2 bg-slate-100 text-slate-700 font-semibold rounded-xl hover:bg-slate-200"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Nova CDA */}
      {isNovaCdaModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-lg w-full shadow-2xl p-6 text-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                <BookOpen className="w-4 h-4 text-purple-600" />
                <span>Inscrição em Dívida Ativa & Lavratura de CDA</span>
              </h2>
              <button
                onClick={() => setIsNovaCdaModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCriarCDA} className="space-y-3">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Nome do Devedor (PF ou PJ) *</label>
                <input
                  type="text"
                  required
                  value={novaCda.targetNome}
                  onChange={(e) => setNovaCda(prev => ({ ...prev, targetNome: e.target.value }))}
                  placeholder="Ex: Farmácia & Drogaria São Lucas Ltda"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">CPF ou CNPJ *</label>
                  <input
                    type="text"
                    required
                    value={novaCda.targetDoc}
                    onChange={(e) => setNovaCda(prev => ({ ...prev, targetDoc: e.target.value }))}
                    placeholder="00.000.000/0001-00"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-mono focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Valor do Crédito Tributário (R$) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={novaCda.valorTotalDebito}
                    onChange={(e) => setNovaCda(prev => ({ ...prev, valorTotalDebito: parseFloat(e.target.value) || 0 }))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-mono font-bold focus:bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Livro de Registro</label>
                  <input
                    type="text"
                    value={novaCda.livroCDA}
                    onChange={(e) => setNovaCda(prev => ({ ...prev, livroCDA: e.target.value }))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Folha / Folhas</label>
                  <input
                    type="text"
                    value={novaCda.folhaCDA}
                    onChange={(e) => setNovaCda(prev => ({ ...prev, folhaCDA: e.target.value }))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsNovaCdaModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold shadow-md shadow-purple-500/20"
                >
                  Lavrar Certidão de Dívida Ativa
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
