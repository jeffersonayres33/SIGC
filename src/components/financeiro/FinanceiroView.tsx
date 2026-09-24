import React, { useState } from 'react';
import { 
  Coins, 
  Search, 
  Filter, 
  Plus, 
  Download, 
  QrCode, 
  Barcode, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  Calendar, 
  Calculator, 
  DollarSign, 
  FileText, 
  ChevronRight, 
  ShieldAlert, 
  CreditCard, 
  X,
  Check,
  FileSpreadsheet
} from 'lucide-react';
import { LancamentoFinanceiro } from '../../types';
import { storageService } from '../../services/storageService';
import { exportToCSV, exportToPDF } from '../../services/exportService';
import { toastService } from '../../services/toastService';

interface FinanceiroViewProps {
  onOpenBoletoPix?: (lancamento: LancamentoFinanceiro) => void;
}

export const FinanceiroView: React.FC<FinanceiroViewProps> = ({ onOpenBoletoPix }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [tipoFilter, setTipoFilter] = useState<string>('Todos');
  const [statusFilter, setStatusFilter] = useState<string>('Todos');
  const [isNovoLancModal, setIsNovoLancModal] = useState(false);
  const [selectedForParcelamento, setSelectedForParcelamento] = useState<LancamentoFinanceiro | null>(null);
  const [qtdParcelas, setQtdParcelas] = useState(6);

  const [novoLanc, setNovoLanc] = useState<Partial<LancamentoFinanceiro>>({
    tipo: 'Anuidade',
    exercicio: 2026,
    valorOriginal: 620.00,
    targetTipo: 'PROFISSIONAL'
  });

  const lancamentos = storageService.getLancamentos().filter(l => {
    const matchesSearch = l.targetNome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.targetDoc.includes(searchTerm) ||
      l.targetInscricao.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.descricao.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTipo = tipoFilter === 'Todos' || l.tipo === tipoFilter;
    const matchesStatus = statusFilter === 'Todos' || l.status === statusFilter;
    return matchesSearch && matchesTipo && matchesStatus;
  });

  const totalArrecadado = lancamentos
    .filter(l => l.status === 'Pago')
    .reduce((acc, curr) => acc + curr.valorTotal, 0);

  const totalPendente = lancamentos
    .filter(l => l.status === 'Pendente')
    .reduce((acc, curr) => acc + curr.valorTotal, 0);

  const totalVencido = lancamentos
    .filter(l => l.status === 'Vencido' || l.status === 'Em Cobrança Judicial')
    .reduce((acc, curr) => acc + curr.valorTotal, 0);

  const handleExportCSV = () => {
    const data = lancamentos.map(l => ({
      'Sacado / Devedor': l.targetNome,
      'CPF/CNPJ': l.targetDoc,
      'Inscrição': l.targetInscricao,
      'Descrição': l.descricao,
      'Tipo': l.tipo,
      'Exercício': l.exercicio,
      'Valor Total (R$)': l.valorTotal.toFixed(2),
      'Vencimento': l.dataVencimento,
      'Status': l.status,
      'Data Pagamento': l.dataPagamento || 'Pendente'
    }));
    exportToCSV(`financeiro_lancamentos_${Date.now()}`, data);
    toastService.info('Exportação Excel Concluída', `${lancamentos.length} títulos financeiros exportados para Excel/CSV.`);
  };

  const handleExportPDF = () => {
    if (!lancamentos.length) {
      toastService.warning('Sem Dados', 'Nenhum lançamento encontrado com os filtros atuais.');
      return;
    }
    const headers = ['Sacado / Devedor', 'CPF/CNPJ', 'Descrição', 'Tipo', 'Vencimento', 'Valor Total', 'Status'];
    const rows = lancamentos.map(l => [
      l.targetNome,
      l.targetDoc,
      `${l.descricao} (${l.exercicio})`,
      l.tipo,
      l.dataVencimento,
      `R$ ${l.valorTotal.toFixed(2)}`,
      l.status
    ]);
    const councilConfig = storageService.getCouncilConfig();
    exportToPDF({
      title: 'Relatório Financeiro de Títulos e Anuidades',
      subtitle: `${lancamentos.length} títulos filtrados | SISCON Cloud`,
      filename: `financeiro_titulos_${Date.now()}`,
      headers,
      rows,
      orientation: 'landscape',
      councilName: councilConfig.nomeCompleto || 'Conselho Regional de Farmácia',
      councilUF: councilConfig.uf || 'AM'
    });
    toastService.info('Exportação PDF Concluída', `${lancamentos.length} títulos exportados para documento PDF oficial.`);
  };

  const handleCreateLancamento = (e: React.FormEvent) => {
    e.preventDefault();
    if (!novoLanc.targetNome || !novoLanc.targetDoc || !novoLanc.valorOriginal) {
      toastService.warning('Campos Obrigatórios', 'Preencha o Sacado, CPF/CNPJ e o Valor.');
      return;
    }

    const lancFinal: LancamentoFinanceiro = {
      id: `lan-${Date.now()}`,
      targetId: `target-${Date.now()}`,
      targetTipo: novoLanc.targetTipo || 'PROFISSIONAL',
      targetNome: novoLanc.targetNome,
      targetDoc: novoLanc.targetDoc,
      targetInscricao: novoLanc.targetInscricao || 'CRF-AM',
      descricao: novoLanc.descricao || `${novoLanc.tipo} ${novoLanc.exercicio}`,
      tipo: novoLanc.tipo || 'Anuidade',
      exercicio: novoLanc.exercicio || 2026,
      valorOriginal: Number(novoLanc.valorOriginal),
      desconto: 0,
      jurosMulta: 0,
      valorTotal: Number(novoLanc.valorOriginal),
      dataEmissao: new Date().toLocaleDateString('pt-BR'),
      dataVencimento: novoLanc.dataVencimento || new Date(Date.now() + 30 * 86400000).toLocaleDateString('pt-BR'),
      status: 'Pendente',
      codigoBarras: '00190000090' + Date.now().toString().slice(-10),
      linhaDigitavel: '00190.00009 01234.567890 12345.678901 1 ' + String(Number(novoLanc.valorOriginal) * 100).padStart(14, '0'),
      pixCopiaECola: `00020126580014br.gov.bcb.pix0136crfam-financeiro-key-${Date.now()}5204000053039865405${novoLanc.valorOriginal}5802BR5915CRF AMAZONAS6006MANAUS62070503***6304`
    };

    storageService.addLancamento(lancFinal);
    setIsNovoLancModal(false);
    toastService.success(
      'Título Financeiro Gerado',
      `Boleto/Pix de ${lancFinal.descricao} (R$ ${lancFinal.valorTotal.toFixed(2)}) gerado com sucesso para ${lancFinal.targetNome}.`
    );
  };

  const handleEfetivarParcelamento = () => {
    if (!selectedForParcelamento) return;
    const valorParcela = (selectedForParcelamento.valorTotal / qtdParcelas).toFixed(2);
    selectedForParcelamento.status = 'Parcelado';
    toastService.edit(
      'Acordo de Parcelamento Formalizado',
      `O débito de ${selectedForParcelamento.targetNome} foi refinanciado em ${qtdParcelas}x de R$ ${valorParcela}.`
    );
    setSelectedForParcelamento(null);
  };

  const handleRegistrarBaixa = (lanc: LancamentoFinanceiro) => {
    storageService.payLancamento(lanc.id);
    toastService.success(
      'Pagamento Baixado',
      `Baixa registrada para o título de ${lanc.targetNome} no valor de R$ ${lanc.valorTotal.toFixed(2)}.`
    );
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white border border-slate-200 p-4 sm:p-5 rounded-2xl shadow-xs">
        <div className="flex items-center space-x-3.5">
          <div className="w-11 h-11 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600 shadow-xs">
            <Coins className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900 flex items-center space-x-2">
              <span>Gestão Financeira & Cobrança de Anuidades</span>
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Controle de arrecadação, emissão de boletos FEBRABAN, Pix instantâneo e acordos de parcelamento.
            </p>
          </div>
        </div>

        <div className="flex items-center flex-wrap gap-2">
          <button
            onClick={handleExportCSV}
            className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-white border border-slate-300 hover:bg-emerald-50 hover:border-emerald-300 text-slate-700 hover:text-emerald-800 font-bold text-xs uppercase shadow-2xs transition-all cursor-pointer"
            title="Exportar títulos para planilha Excel/CSV"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>EXPORTAR EXCEL</span>
          </button>
          <button
            onClick={handleExportPDF}
            className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-white border border-slate-300 hover:bg-rose-50 hover:border-rose-300 text-slate-700 hover:text-rose-800 font-bold text-xs uppercase shadow-2xs transition-all cursor-pointer"
            title="Exportar títulos para relatório em PDF Oficial"
          >
            <FileText className="w-4 h-4 text-rose-600" />
            <span>EXPORTAR PDF</span>
          </button>
          <button
            onClick={() => setIsNovoLancModal(true)}
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm shadow-blue-500/20 transition-all uppercase cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Novo Lançamento</span>
          </button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Arrecadado</div>
          <div className="text-2xl font-bold text-emerald-600 font-mono mt-1">
            R$ {totalArrecadado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">Valores quitados via Pix e Boletos</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Pendente a Vencer</div>
          <div className="text-2xl font-bold text-blue-600 font-mono mt-1">
            R$ {totalPendente.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">Títulos vigentes no prazo</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Inadimplência / Vencido</div>
          <div className="text-2xl font-bold text-rose-600 font-mono mt-1">
            R$ {totalVencido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">Elegíveis para cobrança e dívida ativa</p>
        </div>
      </div>

      {/* Filters Toolbar */}
      <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Buscar por Sacado, CPF/CNPJ ou Inscrição..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all"
            />
          </div>

          <div>
            <select
              value={tipoFilter}
              onChange={(e) => setTipoFilter(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all font-medium"
            >
              <option value="Todos">Todos os Tipos de Receita</option>
              <option value="Anuidade">Anuidade</option>
              <option value="Taxa de Inscrição">Taxa de Inscrição</option>
              <option value="Taxa de CRT">Taxa de CRT</option>
              <option value="Multa de Fiscalização">Multa de Fiscalização</option>
            </select>
          </div>

          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all font-medium"
            >
              <option value="Todos">Todos os Status</option>
              <option value="Pendente">Pendente</option>
              <option value="Pago">Pago / Quitado</option>
              <option value="Vencido">Vencido</option>
              <option value="Parcelado">Parcelado</option>
              <option value="Em Cobrança Judicial">Em Cobrança Judicial</option>
            </select>
          </div>
        </div>
      </div>

      {/* Barra Informativa de Títulos Filtrados e Ações Rápidas */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-1">
        <div className="flex items-center flex-wrap gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-bold uppercase tracking-wide shadow-2xs">
            <Coins className="w-3.5 h-3.5 text-amber-600" />
            <span>{lancamentos.length} títulos filtrados</span>
          </span>
          <span className="text-xs text-slate-500 font-medium">
            (totalizando R$ {lancamentos.reduce((acc, curr) => acc + curr.valorTotal, 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })})
          </span>
        </div>

        <div className="flex items-center space-x-2 text-xs">
          <button
            onClick={handleExportCSV}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-white hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 border border-slate-200 rounded-xl font-bold transition-all shadow-2xs cursor-pointer"
            title="Exportar títulos para Excel"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            <span>Exportar Excel</span>
          </button>
          <button
            onClick={handleExportPDF}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-white hover:bg-rose-50 text-slate-700 hover:text-rose-700 border border-slate-200 rounded-xl font-bold transition-all shadow-2xs cursor-pointer"
            title="Exportar títulos para PDF"
          >
            <FileText className="w-3.5 h-3.5 text-rose-600" />
            <span>Exportar PDF</span>
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-600 border-b border-slate-200 font-bold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">Sacado / Inscrição</th>
                <th className="py-3 px-4">Descrição / Exercício</th>
                <th className="py-3 px-4">Tipo</th>
                <th className="py-3 px-4">Vencimento</th>
                <th className="py-3 px-4">Valor Total</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {lancamentos.map((l) => (
                <tr key={l.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 px-4">
                    <div className="font-bold text-slate-900">{l.targetNome}</div>
                    <div className="text-[11px] text-slate-500 font-mono">{l.targetDoc} • {l.targetInscricao}</div>
                  </td>
                  <td className="py-3 px-4 text-slate-800 font-medium">
                    {l.descricao} ({l.exercicio})
                  </td>
                  <td className="py-3 px-4 text-slate-600 font-medium">
                    {l.tipo}
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-700">
                    {l.dataVencimento}
                  </td>
                  <td className="py-3 px-4 font-mono font-bold text-slate-900">
                    R$ {l.valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap">
                    <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${
                      l.status === 'Pago' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                      l.status === 'Pendente' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                      l.status === 'Parcelado' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                      'bg-rose-50 text-rose-700 border-rose-200'
                    }`}>
                      {l.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right whitespace-nowrap space-x-1">
                    {onOpenBoletoPix && (
                      <button
                        onClick={() => onOpenBoletoPix(l)}
                        className="p-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg border border-blue-200 transition-colors"
                        title="Visualizar Boleto FEBRABAN & Pix"
                      >
                        <QrCode className="w-3.5 h-3.5 inline" />
                      </button>
                    )}

                    {l.status !== 'Pago' && (
                      <>
                        <button
                          onClick={() => handleRegistrarBaixa(l)}
                          className="p-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg border border-emerald-200 transition-colors"
                          title="Registrar Baixa / Pagamento"
                        >
                          <Check className="w-3.5 h-3.5 inline" />
                        </button>
                        <button
                          onClick={() => setSelectedForParcelamento(l)}
                          className="p-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-lg border border-amber-200 transition-colors"
                          title="Simular Acordo / Parcelamento"
                        >
                          <Calculator className="w-3.5 h-3.5 inline" />
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de Parcelamento */}
      {selectedForParcelamento && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full shadow-2xl p-6 text-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                <Calculator className="w-4 h-4 text-amber-600" />
                <span>Simulação de Acordo / Parcelamento</span>
              </h2>
              <button
                onClick={() => setSelectedForParcelamento(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <div className="text-slate-500">Devedor:</div>
                <div className="font-bold text-slate-900 text-sm">{selectedForParcelamento.targetNome}</div>
                <div className="text-slate-500 font-mono">Valor Total do Débito: <strong>R$ {selectedForParcelamento.valorTotal.toFixed(2)}</strong></div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Quantidade de Parcelas</label>
                <select
                  value={qtdParcelas}
                  onChange={(e) => setQtdParcelas(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-bold"
                >
                  <option value={2}>2x de R$ {(selectedForParcelamento.valorTotal / 2).toFixed(2)}</option>
                  <option value={3}>3x de R$ {(selectedForParcelamento.valorTotal / 3).toFixed(2)}</option>
                  <option value={4}>4x de R$ {(selectedForParcelamento.valorTotal / 4).toFixed(2)}</option>
                  <option value={6}>6x de R$ {(selectedForParcelamento.valorTotal / 6).toFixed(2)}</option>
                  <option value={10}>10x de R$ {(selectedForParcelamento.valorTotal / 10).toFixed(2)}</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100">
              <button
                onClick={() => setSelectedForParcelamento(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-semibold"
              >
                Cancelar
              </button>
              <button
                onClick={handleEfetivarParcelamento}
                className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold shadow-md shadow-amber-500/20"
              >
                Confirmar Acordo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Novo Lançamento */}
      {isNovoLancModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-lg w-full shadow-2xl p-6 text-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                <Plus className="w-4 h-4 text-blue-600" />
                <span>Novo Lançamento Financeiro</span>
              </h2>
              <button
                onClick={() => setIsNovoLancModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateLancamento} className="space-y-3">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Nome do Sacado (Pessoa Física ou Jurídica) *</label>
                <input
                  type="text"
                  required
                  value={novoLanc.targetNome || ''}
                  onChange={(e) => setNovoLanc(prev => ({ ...prev, targetNome: e.target.value }))}
                  placeholder="Ex: Dra. Ana Paula Silva"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">CPF ou CNPJ *</label>
                  <input
                    type="text"
                    required
                    value={novoLanc.targetDoc || ''}
                    onChange={(e) => setNovoLanc(prev => ({ ...prev, targetDoc: e.target.value }))}
                    placeholder="000.000.000-00"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-mono focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Valor do Título (R$) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={novoLanc.valorOriginal || 620}
                    onChange={(e) => setNovoLanc(prev => ({ ...prev, valorOriginal: parseFloat(e.target.value) || 0 }))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-mono font-bold focus:bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Tipo de Receita</label>
                  <select
                    value={novoLanc.tipo || 'Anuidade'}
                    onChange={(e) => setNovoLanc(prev => ({ ...prev, tipo: e.target.value as any }))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-medium"
                  >
                    <option value="Anuidade">Anuidade</option>
                    <option value="Taxa de Inscrição">Taxa de Inscrição</option>
                    <option value="Taxa de CRT">Taxa de CRT</option>
                    <option value="Multa de Fiscalização">Multa de Fiscalização</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Exercício</label>
                  <input
                    type="number"
                    value={novoLanc.exercicio || 2026}
                    onChange={(e) => setNovoLanc(prev => ({ ...prev, exercicio: parseInt(e.target.value, 10) || 2026 }))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-mono"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsNovoLancModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-md shadow-blue-500/20"
                >
                  Emitir Título
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
