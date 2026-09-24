import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Search, 
  Plus, 
  Clock, 
  CheckCircle2, 
  ChevronRight, 
  Calendar, 
  X, 
  Eye,
  Trash2,
  Send,
  Building,
  UserCheck,
  ArrowRight,
  ShieldCheck,
  FolderOpen,
  Filter,
  RefreshCw,
  FileSpreadsheet
} from 'lucide-react';
import { ProtocoloProcesso, ItemCadastroBasico } from '../../types';
import { storageService } from '../../services/storageService';
import { toastService } from '../../services/toastService';
import { maskCPF, maskCNPJ, sanitizeToUpper } from '../../utils/documentUtils';
import { exportToCSV, exportToPDF } from '../../services/exportService';

export const ProtocolosView: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('Todos');
  const [tipoFilter, setTipoFilter] = useState('Todos');
  const [setorFilter, setSetorFilter] = useState('Todos');
  
  const [isNewModal, setIsNewModal] = useState(false);
  const [selectedProcesso, setSelectedProcesso] = useState<ProtocoloProcesso | null>(null);
  const [isTramitacaoOpen, setIsTramitacaoOpen] = useState(false);

  // Cadastros Básicos vinculados dinamicamente
  const [cadastrosTipos, setCadastrosTipos] = useState<ItemCadastroBasico[]>([]);
  const [cadastrosSetores, setCadastrosSetores] = useState<ItemCadastroBasico[]>([]);
  const [cadastrosStatus, setCadastrosStatus] = useState<ItemCadastroBasico[]>([]);
  const [allProcessos, setAllProcessos] = useState<ProtocoloProcesso[]>([]);

  // Carregar dados e sincronizar com Cadastros Básicos
  const loadData = () => {
    setCadastrosTipos(storageService.getCadastrosBasicos('TIPO_REQUERIMENTO_PROTOCOLO').filter(i => i.ativo));
    setCadastrosSetores(storageService.getCadastrosBasicos('SETOR_PROTOCOLO').filter(i => i.ativo));
    setCadastrosStatus(storageService.getCadastrosBasicos('STATUS_PROTOCOLO').filter(i => i.ativo));
    setAllProcessos(storageService.getProtocolos());
  };

  useEffect(() => {
    loadData();
    const unsubscribe = storageService.subscribe(() => {
      loadData();
    });
    return () => unsubscribe();
  }, []);

  // Form de Autuação
  const [novoProt, setNovoProt] = useState({
    interessado: '',
    documentoInteressado: '',
    tipo: '',
    setorAtual: '',
    status: '',
    conselheiroRelator: '',
    prazoDias: 30,
    descricao: ''
  });

  // Form de Tramitação / Despacho no Processo Selecionado
  const [tramitacaoForm, setTramitacaoForm] = useState({
    novoSetor: '',
    novoStatus: '',
    novoRelator: '',
    despachoTexto: '',
    responsavel: 'Secretaria Geral'
  });

  const handleOpenNewModal = () => {
    const defaultTipo = cadastrosTipos[0]?.nome || 'Inscrição Definitiva';
    const defaultSetor = cadastrosSetores[0]?.nome || 'Secretaria Geral';
    const defaultStatus = cadastrosStatus[0]?.nome || 'Em Análise';

    setNovoProt({
      interessado: '',
      documentoInteressado: '',
      tipo: defaultTipo,
      setorAtual: defaultSetor,
      status: defaultStatus,
      conselheiroRelator: '',
      prazoDias: 30,
      descricao: ''
    });
    setIsNewModal(true);
  };

  const handleCreateProcesso = (e: React.FormEvent) => {
    e.preventDefault();
    if (!novoProt.interessado.trim()) {
      toastService.warning('Campo Obrigatório', 'Preencha o nome do Interessado / Requerente.');
      return;
    }

    const ano = new Date().getFullYear();
    const sequencial = Math.floor(1000 + Math.random() * 9000);
    const numeroProtocolo = `PROT-${ano}/${sequencial}`;
    const dataAtual = new Date().toLocaleDateString('pt-BR');
    const dataHoraAtual = `${dataAtual} ${new Date().toLocaleTimeString('pt-BR').slice(0, 5)}`;
    const prazoResp = new Date(Date.now() + (novoProt.prazoDias || 30) * 86400000).toLocaleDateString('pt-BR');

    const rawProt: ProtocoloProcesso = {
      id: `prot-${Date.now()}`,
      numeroProtocolo,
      tipo: (novoProt.tipo || cadastrosTipos[0]?.nome || 'Inscrição Definitiva') as any,
      interessado: novoProt.interessado.trim().toUpperCase(),
      documentoInteressado: novoProt.documentoInteressado.trim() || '000.000.000-00',
      dataInscricao: dataAtual,
      dataAbertura: dataAtual,
      dataUltimaAtualizacao: dataAtual,
      prazoResposta: prazoResp,
      status: (novoProt.status || cadastrosStatus[0]?.nome || 'Em Análise') as any,
      setorAtual: novoProt.setorAtual || cadastrosSetores[0]?.nome || 'Secretaria Geral',
      conselheiroRelator: novoProt.conselheiroRelator ? novoProt.conselheiroRelator.trim().toUpperCase() : undefined,
      anexos: ['Requerimento_Autuacao.pdf'],
      historico: [
        {
          data: dataHoraAtual,
          setor: novoProt.setorAtual || 'Protocolo Central',
          descricao: novoProt.descricao?.trim().toUpperCase() || 'Autuado no sistema e distribuído para instrução processual.',
          responsavel: 'Protocolo Geral'
        }
      ]
    };

    const novo = sanitizeToUpper(rawProt, ['id', 'anexos']);
    storageService.saveProtocolo(novo);
    setIsNewModal(false);

    toastService.success(
      'Processo Autuado com Sucesso',
      `Protocolo nº ${novo.numeroProtocolo} aberto para ${novo.interessado}.`
    );
  };

  const handleOpenTramitacao = (proc: ProtocoloProcesso) => {
    setSelectedProcesso(proc);
    setTramitacaoForm({
      novoSetor: proc.setorAtual || (cadastrosSetores[0]?.nome || 'Secretaria Geral'),
      novoStatus: proc.status || (cadastrosStatus[0]?.nome || 'Em Análise'),
      novoRelator: proc.conselheiroRelator || '',
      despachoTexto: '',
      responsavel: 'Secretaria Geral'
    });
    setIsTramitacaoOpen(true);
  };

  const handleSaveTramitacao = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProcesso) return;

    if (!tramitacaoForm.despachoTexto.trim()) {
      toastService.warning('Despacho Obrigatório', 'Informe o despacho ou parecer desta tramitação.');
      return;
    }

    const dataAtual = new Date().toLocaleDateString('pt-BR');
    const dataHoraAtual = `${dataAtual} ${new Date().toLocaleTimeString('pt-BR').slice(0, 5)}`;

    const updated: ProtocoloProcesso = {
      ...selectedProcesso,
      setorAtual: tramitacaoForm.novoSetor || selectedProcesso.setorAtual,
      status: (tramitacaoForm.novoStatus || selectedProcesso.status) as any,
      conselheiroRelator: tramitacaoForm.novoRelator ? tramitacaoForm.novoRelator.trim().toUpperCase() : selectedProcesso.conselheiroRelator,
      dataUltimaAtualizacao: dataAtual,
      historico: [
        ...(selectedProcesso.historico || []),
        {
          data: dataHoraAtual,
          setor: (tramitacaoForm.novoSetor || selectedProcesso.setorAtual).toUpperCase(),
          descricao: tramitacaoForm.despachoTexto.trim().toUpperCase(),
          responsavel: tramitacaoForm.responsavel.trim().toUpperCase()
        }
      ]
    };

    storageService.saveProtocolo(updated);
    setSelectedProcesso(updated);
    setIsTramitacaoOpen(false);

    toastService.success(
      'Tramitação Registrada',
      `Processo nº ${updated.numeroProtocolo} despachado para ${updated.setorAtual} (${updated.status}).`
    );
  };

  const handleDeletarProtocolo = (id: string, num: string) => {
    storageService.deleteProtocolo(id);
    if (selectedProcesso?.id === id) {
      setSelectedProcesso(null);
    }
    toastService.delete('Processo Excluído', `O protocolo ${num} foi removido.`);
  };

  // Filtragem combinada
  const filteredProcessos = allProcessos.filter(p => {
    const q = searchTerm.toLowerCase();
    const matchesSearch = !searchTerm || 
      p.numeroProtocolo.toLowerCase().includes(q) ||
      p.interessado.toLowerCase().includes(q) ||
      p.documentoInteressado?.toLowerCase().includes(q) ||
      p.tipo.toLowerCase().includes(q) ||
      p.setorAtual?.toLowerCase().includes(q);

    const matchesStatus = statusFilter === 'Todos' || p.status?.toUpperCase() === statusFilter.toUpperCase();
    const matchesTipo = tipoFilter === 'Todos' || p.tipo?.toUpperCase() === tipoFilter.toUpperCase();
    const matchesSetor = setorFilter === 'Todos' || p.setorAtual?.toUpperCase() === setorFilter.toUpperCase();

    return matchesSearch && matchesStatus && matchesTipo && matchesSetor;
  });

  const handleExportCSV = () => {
    if (!filteredProcessos.length) {
      toastService.warning('Sem Dados', 'Nenhum processo encontrado com os filtros atuais.');
      return;
    }
    const data = filteredProcessos.map(p => ({
      'NÚMERO PROTOCOLO': p.numeroProtocolo,
      'INTERESSADO': p.interessado,
      'DOCUMENTO': p.documentoInteressado || '-',
      'TIPO DE REQUERIMENTO': p.tipo,
      'SETOR ATUAL': p.setorAtual || '-',
      'STATUS': p.status,
      'CONSELHEIRO RELATOR': p.conselheiroRelator || 'NÃO DISTRIBUÍDO',
      'DATA ABERTURA': p.dataAbertura,
      'PRAZO RESPOSTA': p.prazoResposta || '30 DIAS'
    }));
    exportToCSV(`processos_protocolo_${Date.now()}`, data);
    toastService.info('Exportação Excel Concluída', `${filteredProcessos.length} processos exportados para planilha Excel/CSV.`);
  };

  const handleExportPDF = () => {
    if (!filteredProcessos.length) {
      toastService.warning('Sem Dados', 'Nenhum processo encontrado com os filtros atuais.');
      return;
    }
    const headers = ['Nº Protocolo', 'Interessado', 'Requerimento', 'Setor Atual', 'Relator', 'Abertura', 'Status'];
    const rows = filteredProcessos.map(p => [
      p.numeroProtocolo,
      `${p.interessado}${p.documentoInteressado ? ` (${p.documentoInteressado})` : ''}`,
      p.tipo,
      p.setorAtual || '-',
      p.conselheiroRelator || '-',
      p.dataAbertura,
      p.status
    ]);
    const councilConfig = storageService.getCouncilConfig();
    exportToPDF({
      title: 'Relatório Oficial de Protocolos e Processos Administrativos',
      subtitle: `${filteredProcessos.length} processos filtrados | SISCON Cloud`,
      filename: `processos_protocolo_${Date.now()}`,
      headers,
      rows,
      orientation: 'landscape',
      councilName: councilConfig.nomeCompleto || 'Conselho Regional de Farmácia',
      councilUF: councilConfig.uf || 'AM'
    });
    toastService.info('Exportação PDF Concluída', `${filteredProcessos.length} processos exportados para documento PDF oficial.`);
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white border border-slate-200 p-4 sm:p-5 rounded-2xl shadow-xs">
        <div className="flex items-center space-x-3.5">
          <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shadow-xs shrink-0">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
                PROTOCOLO ADMINISTRATIVO & TRAMITAÇÃO ELETRÔNICA
              </h1>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 font-semibold border border-blue-200">
                {allProcessos.length} PROCESSOS
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Integrado aos Cadastros Básicos de Requerimentos ({cadastrosTipos.length}), Setores ({cadastrosSetores.length}) e Status ({cadastrosStatus.length}).
            </p>
          </div>
        </div>

        <div className="flex items-center flex-wrap gap-2">
          <button
            onClick={handleExportCSV}
            className="flex items-center space-x-1.5 px-3 py-2.5 rounded-xl bg-white border border-slate-300 hover:bg-emerald-50 hover:border-emerald-300 text-slate-700 hover:text-emerald-800 font-bold text-xs transition-all uppercase shadow-2xs cursor-pointer"
            title="Exportar processos para planilha Excel/CSV"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>EXPORTAR EXCEL</span>
          </button>
          <button
            onClick={handleExportPDF}
            className="flex items-center space-x-1.5 px-3 py-2.5 rounded-xl bg-white border border-slate-300 hover:bg-rose-50 hover:border-rose-300 text-slate-700 hover:text-rose-800 font-bold text-xs transition-all uppercase shadow-2xs cursor-pointer"
            title="Exportar processos para relatório em PDF Oficial"
          >
            <FileText className="w-4 h-4 text-rose-600" />
            <span>EXPORTAR PDF</span>
          </button>
          <button
            onClick={handleOpenNewModal}
            className="flex items-center justify-center space-x-1.5 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 transition-all uppercase shrink-0 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>AUTUAR NOVO PROCESSO</span>
          </button>
        </div>
      </div>

      {/* Filter Toolbar Vinculada aos Cadastros Básicos */}
      <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-xs grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 text-xs">
        <div className="sm:col-span-2 lg:col-span-4 relative min-w-0">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="PESQUISAR POR Nº PROTOCOLO, INTERESSADO OU CPF/CNPJ..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all uppercase text-xs font-medium"
          />
        </div>

        <div className="sm:col-span-1 lg:col-span-3 min-w-0">
          <select
            value={tipoFilter}
            onChange={(e) => setTipoFilter(e.target.value)}
            className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-semibold uppercase focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 text-xs"
          >
            <option value="Todos">TODOS OS REQUERIMENTOS</option>
            {cadastrosTipos.map(t => (
              <option key={t.id} value={t.nome}>{t.nome}</option>
            ))}
          </select>
        </div>

        <div className="sm:col-span-1 lg:col-span-3 min-w-0">
          <select
            value={setorFilter}
            onChange={(e) => setSetorFilter(e.target.value)}
            className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-semibold uppercase focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 text-xs"
          >
            <option value="Todos">TODOS OS SETORES</option>
            {cadastrosSetores.map(s => (
              <option key={s.id} value={s.nome}>{s.nome}</option>
            ))}
          </select>
        </div>

        <div className="sm:col-span-2 lg:col-span-2 min-w-0">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-semibold uppercase focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 text-xs"
          >
            <option value="Todos">TODOS STATUS</option>
            {cadastrosStatus.map(st => (
              <option key={st.id} value={st.nome}>{st.nome}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Barra Informativa de Processos Filtrados e Ações Rápidas */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-1">
        <div className="flex items-center flex-wrap gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-800 text-xs font-bold uppercase tracking-wide shadow-2xs">
            <FileText className="w-3.5 h-3.5 text-blue-600" />
            <span>{filteredProcessos.length} processos filtrados</span>
          </span>
          <span className="text-xs text-slate-500 font-medium">
            (de um total de {allProcessos.length} no sistema)
          </span>
        </div>

        <div className="flex items-center space-x-2 text-xs">
          <button
            onClick={handleExportCSV}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-white hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 border border-slate-200 rounded-xl font-bold transition-all shadow-2xs cursor-pointer"
            title="Exportar processos para Excel"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            <span>Exportar Excel</span>
          </button>
          <button
            onClick={handleExportPDF}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-white hover:bg-rose-50 text-slate-700 hover:text-rose-700 border border-slate-200 rounded-xl font-bold transition-all shadow-2xs cursor-pointer"
            title="Exportar processos para PDF"
          >
            <FileText className="w-3.5 h-3.5 text-rose-600" />
            <span>Exportar PDF</span>
          </button>
        </div>
      </div>

      {/* Table de Processos */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-600 border-b border-slate-200 font-bold uppercase tracking-wider text-[11px]">
                <th className="py-3.5 px-4">PROTOCOLO Nº</th>
                <th className="py-3.5 px-4">INTERESSADO / DOCUMENTO</th>
                <th className="py-3.5 px-4">TIPO DE REQUERIMENTO</th>
                <th className="py-3.5 px-4">SETOR ATUAL</th>
                <th className="py-3.5 px-4">CONSELHEIRO RELATOR</th>
                <th className="py-3.5 px-4 text-center">STATUS</th>
                <th className="py-3.5 px-4 text-right">AÇÕES</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredProcessos.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <FileText className="w-10 h-10 mx-auto mb-2 opacity-40" />
                    <p className="font-semibold uppercase">NENHUM PROCESSO ENCONTRADO</p>
                    <p className="text-[11px] text-slate-400 mt-1 uppercase">Tente ajustar os filtros ou autue um novo processo.</p>
                  </td>
                </tr>
              ) : (
                filteredProcessos.map((proc) => (
                  <tr key={proc.id} className="hover:bg-blue-50/40 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-blue-700 whitespace-nowrap">
                      {proc.numeroProtocolo}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900 uppercase">{proc.interessado}</div>
                      <div className="text-[10px] text-slate-500 font-mono">{proc.documentoInteressado}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-semibold text-slate-800 uppercase">{proc.tipo}</span>
                      <div className="text-[10px] text-slate-400">Aberto em: {proc.dataAbertura}</div>
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-medium text-[11px] border border-slate-200 uppercase">
                        {proc.setorAtual}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 truncate max-w-xs uppercase">
                      {proc.conselheiroRelator || 'Aguardando Distribuição'}
                    </td>
                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                        proc.status?.toUpperCase().includes('DEFERIDO') || proc.status?.toUpperCase().includes('APROVADO')
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : proc.status?.toUpperCase().includes('INDEFERIDO')
                          ? 'bg-rose-50 text-rose-700 border border-rose-200'
                          : proc.status?.toUpperCase().includes('DOCUMENTAÇÃO')
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : 'bg-blue-50 text-blue-700 border border-blue-200'
                      }`}>
                        {proc.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right whitespace-nowrap space-x-1.5">
                      <button
                        onClick={() => setSelectedProcesso(proc)}
                        className="p-1.5 rounded-lg bg-slate-100 hover:bg-blue-100 text-blue-700 border border-slate-200 transition-colors cursor-pointer"
                        title="Ver Autos do Processo"
                        aria-label="Ver Autos do Processo"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleOpenTramitacao(proc)}
                        className="p-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 transition-colors cursor-pointer"
                        title="Tramitar / Despachar Processo"
                        aria-label="Tramitar / Despachar Processo"
                      >
                        <Send className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeletarProtocolo(proc.id, proc.numeroProtocolo)}
                        className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition-colors cursor-pointer"
                        title="Excluir Protocolo"
                        aria-label="Excluir Protocolo"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Visualização de Processo / Autos */}
      {selectedProcesso && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-3xl w-full my-6 max-h-[92vh] overflow-y-auto shadow-2xl p-4 sm:p-6 text-xs space-y-4 animate-in fade-in zoom-in duration-150">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-3">
                <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
                  <FileText className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-bold text-slate-900 font-mono">{selectedProcesso.numeroProtocolo}</h2>
                    <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-bold border border-blue-200 text-[10px] uppercase">
                      {selectedProcesso.status}
                    </span>
                  </div>
                  <div className="text-slate-500 uppercase">{selectedProcesso.interessado} • {selectedProcesso.tipo}</div>
                </div>
              </div>
              <button
                onClick={() => setSelectedProcesso(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Informações Gerais */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/70 space-y-1">
                <div className="text-slate-400 font-bold uppercase text-[10px]">Interessado & Documento</div>
                <div className="font-bold text-slate-900 uppercase">{selectedProcesso.interessado}</div>
                <div className="font-mono text-slate-600">{selectedProcesso.documentoInteressado}</div>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/70 space-y-1">
                <div className="text-slate-400 font-bold uppercase text-[10px]">Setor Atual & Relator</div>
                <div>Setor: <strong className="text-blue-800 uppercase">{selectedProcesso.setorAtual}</strong></div>
                <div className="text-slate-600 truncate">Relator: <span className="font-medium uppercase">{selectedProcesso.conselheiroRelator || 'Não distribuído'}</span></div>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/70 space-y-1">
                <div className="text-slate-400 font-bold uppercase text-[10px]">Prazos Regulamentares</div>
                <div>Abertura: <span className="font-mono text-slate-800">{selectedProcesso.dataAbertura}</span></div>
                <div>Prazo Limite: <span className="font-mono text-rose-700 font-bold">{selectedProcesso.prazoResposta}</span></div>
              </div>
            </div>

            {/* Linha do Tempo e Histórico de Despachos */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="font-bold text-slate-800 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-blue-600" />
                  <span>Histórico de Despachos, Movimentações & Pareceres</span>
                </div>
                <button
                  onClick={() => handleOpenTramitacao(selectedProcesso)}
                  className="flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 font-bold hover:bg-blue-100 border border-blue-200 transition-colors uppercase cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Novo Despacho</span>
                </button>
              </div>

              <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
                {selectedProcesso.historico && selectedProcesso.historico.length > 0 ? (
                  selectedProcesso.historico.map((h, i) => (
                    <div key={i} className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                      <div className="flex justify-between items-center text-slate-500 font-mono text-[10px] pb-1 border-b border-slate-100">
                        <span className="font-bold text-blue-700">{h.data}</span>
                        <span className="uppercase font-semibold">{h.setor} • {h.responsavel}</span>
                      </div>
                      <div className="text-slate-800 mt-2 whitespace-pre-wrap uppercase font-medium">{h.descricao}</div>
                    </div>
                  ))
                ) : (
                  <div className="p-4 text-center text-slate-400 bg-slate-50 rounded-xl">
                    Nenhum despacho registrado nos autos.
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-between items-center pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => handleDeletarProtocolo(selectedProcesso.id, selectedProcesso.numeroProtocolo)}
                className="flex items-center space-x-1.5 px-3 py-2 rounded-xl text-rose-600 hover:bg-rose-50 font-bold uppercase transition-colors cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>Excluir Processo</span>
              </button>

              <div className="flex space-x-2">
                <button
                  onClick={() => setSelectedProcesso(null)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 font-semibold rounded-xl hover:bg-slate-200 uppercase cursor-pointer"
                >
                  Fechar Autos
                </button>
                <button
                  onClick={() => handleOpenTramitacao(selectedProcesso)}
                  className="flex items-center space-x-1.5 px-4 py-2 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 shadow-md shadow-blue-500/20 uppercase cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                  <span>Tramitar / Despachar</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Autuar Processo */}
      {isNewModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-lg w-full my-6 max-h-[92vh] overflow-y-auto shadow-2xl p-5 sm:p-6 text-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-base font-bold text-slate-900 flex items-center space-x-2 uppercase">
                <Plus className="w-4 h-4 text-blue-600" />
                <span>Autuação de Processo Administrativo</span>
              </h2>
              <button
                onClick={() => setIsNewModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateProcesso} className="space-y-3.5">
              <div>
                <label className="block text-slate-700 font-bold mb-1 uppercase text-[10px]">Interessado / Requerente *</label>
                <input
                  type="text"
                  required
                  value={novoProt.interessado}
                  onChange={(e) => setNovoProt(prev => ({ ...prev, interessado: e.target.value.toUpperCase() }))}
                  placeholder="EX: DR. LUCAS COSTA OU DROGARIA CENTRAL LTDA"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 uppercase font-semibold focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1 uppercase text-[10px]">CPF ou CNPJ</label>
                  <input
                    type="text"
                    value={novoProt.documentoInteressado}
                    onChange={(e) => {
                      const clean = e.target.value.replace(/\D/g, '');
                      const masked = clean.length > 11 ? maskCNPJ(e.target.value) : maskCPF(e.target.value);
                      setNovoProt(prev => ({ ...prev, documentoInteressado: masked }));
                    }}
                    placeholder="000.000.000-00"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-mono font-bold focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1 uppercase text-[10px]">Tipo de Requerimento *</label>
                  <select
                    value={novoProt.tipo}
                    onChange={(e) => setNovoProt(prev => ({ ...prev, tipo: e.target.value }))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-semibold uppercase focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
                  >
                    {cadastrosTipos.map(t => (
                      <option key={t.id} value={t.nome}>{t.nome}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1 uppercase text-[10px]">Setor Inicial de Tramitação</label>
                  <select
                    value={novoProt.setorAtual}
                    onChange={(e) => setNovoProt(prev => ({ ...prev, setorAtual: e.target.value }))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-semibold uppercase focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
                  >
                    {cadastrosSetores.map(s => (
                      <option key={s.id} value={s.nome}>{s.nome}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1 uppercase text-[10px]">Status Inicial</label>
                  <select
                    value={novoProt.status}
                    onChange={(e) => setNovoProt(prev => ({ ...prev, status: e.target.value }))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-semibold uppercase focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
                  >
                    {cadastrosStatus.map(st => (
                      <option key={st.id} value={st.nome}>{st.nome}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1 uppercase text-[10px]">Conselheiro Relator (Opcional)</label>
                  <input
                    type="text"
                    value={novoProt.conselheiroRelator}
                    onChange={(e) => setNovoProt(prev => ({ ...prev, conselheiroRelator: e.target.value.toUpperCase() }))}
                    placeholder="EX: DR. VALMIR BEZERRA"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 uppercase font-semibold focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1 uppercase text-[10px]">Prazo Regulamentar (Dias)</label>
                  <input
                    type="number"
                    min={1}
                    max={120}
                    value={novoProt.prazoDias}
                    onChange={(e) => setNovoProt(prev => ({ ...prev, prazoDias: parseInt(e.target.value, 10) || 30 }))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-bold font-mono focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1 uppercase text-[10px]">Objeto / Síntese da Petição</label>
                <textarea
                  rows={2}
                  value={novoProt.descricao}
                  onChange={(e) => setNovoProt(prev => ({ ...prev, descricao: e.target.value.toUpperCase() }))}
                  placeholder="SÍNTESE DOS DOCUMENTOS APRESENTADOS E OBJETO DO PEDIDO..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 uppercase focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 font-medium"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsNewModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-semibold uppercase hover:bg-slate-200 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold uppercase shadow-md shadow-blue-500/20 cursor-pointer"
                >
                  Autuar e Distribuir
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Tramitação / Despacho Rápido */}
      {isTramitacaoOpen && selectedProcesso && (
        <div className="fixed inset-0 z-60 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full shadow-2xl p-5 text-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <div className="flex items-center space-x-2">
                <Send className="w-4 h-4 text-blue-600" />
                <span className="font-bold text-slate-900 uppercase">Tramitação e Despacho Processual</span>
              </div>
              <button
                onClick={() => setIsTramitacaoOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-2.5 bg-blue-50 rounded-xl border border-blue-100 text-blue-800">
              <span className="font-bold font-mono">{selectedProcesso.numeroProtocolo}</span> - {selectedProcesso.interessado}
            </div>

            <form onSubmit={handleSaveTramitacao} className="space-y-3">
              <div>
                <label className="block text-slate-700 font-bold mb-1 uppercase text-[10px]">Encaminhar para o Setor (Cadastros Básicos)</label>
                <select
                  value={tramitacaoForm.novoSetor}
                  onChange={(e) => setTramitacaoForm(prev => ({ ...prev, novoSetor: e.target.value }))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-semibold uppercase"
                >
                  {cadastrosSetores.map(s => (
                    <option key={s.id} value={s.nome}>{s.nome}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1 uppercase text-[10px]">Atualizar Status (Cadastros Básicos)</label>
                <select
                  value={tramitacaoForm.novoStatus}
                  onChange={(e) => setTramitacaoForm(prev => ({ ...prev, novoStatus: e.target.value }))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-semibold uppercase"
                >
                  {cadastrosStatus.map(st => (
                    <option key={st.id} value={st.nome}>{st.nome}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1 uppercase text-[10px]">Conselheiro Relator / Responsável</label>
                <input
                  type="text"
                  value={tramitacaoForm.novoRelator}
                  onChange={(e) => setTramitacaoForm(prev => ({ ...prev, novoRelator: e.target.value.toUpperCase() }))}
                  placeholder="EX: DRA. LUANA SANTANA"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 uppercase font-semibold"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1 uppercase text-[10px]">Texto do Parecer / Despacho *</label>
                <textarea
                  rows={3}
                  required
                  value={tramitacaoForm.despachoTexto}
                  onChange={(e) => setTramitacaoForm(prev => ({ ...prev, despachoTexto: e.target.value.toUpperCase() }))}
                  placeholder="DIGITE O TEOR DO DESPACHO OU DECISÃO..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 uppercase font-medium"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsTramitacaoOpen(false)}
                  className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold uppercase"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold uppercase shadow-sm"
                >
                  Registrar Despacho
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
