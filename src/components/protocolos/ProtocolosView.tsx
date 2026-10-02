import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Search, 
  Plus, 
  Clock, 
  CheckCircle2, 
  ChevronRight, 
  ChevronLeft,
  Calendar, 
  X, 
  Eye, 
  Trash2, 
  Send, 
  Building, 
  Building2, 
  UserCheck, 
  Users, 
  Globe, 
  Check, 
  ArrowRight, 
  ShieldCheck, 
  FolderOpen, 
  Filter, 
  RefreshCw, 
  FileSpreadsheet, 
  RotateCcw, 
  Phone, 
  Mail, 
  User,
  ZoomIn,
  AlertCircle,
  MapPin
} from 'lucide-react';
import { ProtocoloProcesso, ItemCadastroBasico, Profissional, Empresa } from '../../types';
import { storageService } from '../../services/storageService';
import { toastService } from '../../services/toastService';
import { maskCPF, maskCNPJ, sanitizeToUpper } from '../../utils/documentUtils';
import { exportToCSV, exportToPDF } from '../../services/exportService';

export const ProtocolosView: React.FC = () => {
  // Filtros da Tela Principal
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('Todos');
  const [tipoFilter, setTipoFilter] = useState('Todos');
  const [setorFilter, setSetorFilter] = useState('Todos');
  const [tipoInteressadoFilter, setTipoInteressadoFilter] = useState('Todos');
  const [showFilters, setShowFilters] = useState(false);
  
  // Modais de Controle
  const [isNewModal, setIsNewModal] = useState(false);
  const [selectedProcesso, setSelectedProcesso] = useState<ProtocoloProcesso | null>(null);
  const [isTramitacaoOpen, setIsTramitacaoOpen] = useState(false);
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState<string | null>(null);

  // Cadastros Básicos vinculados dinamicamente
  const [cadastrosTipos, setCadastrosTipos] = useState<ItemCadastroBasico[]>([]);
  const [cadastrosSetores, setCadastrosSetores] = useState<ItemCadastroBasico[]>([]);
  const [cadastrosStatus, setCadastrosStatus] = useState<ItemCadastroBasico[]>([]);
  const [cadastrosTiposProf, setCadastrosTiposProf] = useState<ItemCadastroBasico[]>([]);
  const [cadastrosSituacoesProf, setCadastrosSituacoesProf] = useState<ItemCadastroBasico[]>([]);
  const [cadastrosTiposEmp, setCadastrosTiposEmp] = useState<ItemCadastroBasico[]>([]);
  
  // Bases de Dados
  const [allProcessos, setAllProcessos] = useState<ProtocoloProcesso[]>([]);
  const [allProfissionais, setAllProfissionais] = useState<Profissional[]>([]);
  const [allEmpresas, setAllEmpresas] = useState<Empresa[]>([]);

  // Estados para Modal de Consulta de Profissionais (com todos os filtros do cadastro)
  const [isConsultaProfissionalOpen, setIsConsultaProfissionalOpen] = useState(false);
  const [profBusca, setProfBusca] = useState('');
  const [profTipoFilter, setProfTipoFilter] = useState('Todos');
  const [profSituacaoFilter, setProfSituacaoFilter] = useState('Todos');
  const [profStatusFinFilter, setProfStatusFinFilter] = useState('Todos');
  const [profCidadeFilter, setProfCidadeFilter] = useState('');

  // Estados para Modal de Consulta de Empresas (com todos os filtros do cadastro)
  const [isConsultaEmpresaOpen, setIsConsultaEmpresaOpen] = useState(false);
  const [empBusca, setEmpBusca] = useState('');
  const [empCondicaoFilter, setEmpCondicaoFilter] = useState('Todos');
  const [empTipoFilter, setEmpTipoFilter] = useState('Todos');
  const [empTipoEmpresaFilter, setEmpTipoEmpresaFilter] = useState('Todos');
  const [empStatusFinFilter, setEmpStatusFinFilter] = useState('Todos');
  const [empCidadeFilter, setEmpCidadeFilter] = useState('');

  // Carregar dados e sincronizar com Cadastros Básicos
  const loadData = () => {
    setCadastrosTipos(storageService.getCadastrosBasicos('TIPO_REQUERIMENTO_PROTOCOLO').filter(i => i.ativo));
    setCadastrosSetores(storageService.getCadastrosBasicos('SETOR_PROTOCOLO').filter(i => i.ativo));
    setCadastrosStatus(storageService.getCadastrosBasicos('STATUS_PROTOCOLO').filter(i => i.ativo));
    setCadastrosTiposProf(storageService.getCadastrosBasicos('TIPO_PROFISSIONAL').filter(i => i.ativo));
    setCadastrosSituacoesProf(storageService.getCadastrosBasicos('SITUACAO_PROFISSIONAL').filter(i => i.ativo));
    setCadastrosTiposEmp(storageService.getCadastrosBasicos('TIPO_EMPRESA').filter(i => i.ativo));
    setAllProcessos(storageService.getProtocolos());
    setAllProfissionais(storageService.getProfissionais());
    setAllEmpresas(storageService.getEmpresas());
  };

  useEffect(() => {
    loadData();
    const unsubscribe = storageService.subscribe(() => {
      loadData();
    });
    return () => unsubscribe();
  }, []);

  // Form de Autuação com Vínculo ao Conselho ou Público Geral
  const [novoProt, setNovoProt] = useState<{
    tipoInteressado: 'PROFISSIONAL' | 'EMPRESA' | 'PUBLICO';
    vinculoId: string;
    vinculoInscricao: string;
    vinculoDetalhes: string;
    fotoUrl?: string;
    interessado: string;
    documentoInteressado: string;
    contatoEmail: string;
    contatoTelefone: string;
    cidadeUf: string;
    tipo: string;
    setorAtual: string;
    status: string;
    conselheiroRelator: string;
    prazoDias: number;
    descricao: string;
  }>({
    tipoInteressado: 'PROFISSIONAL',
    vinculoId: '',
    vinculoInscricao: '',
    vinculoDetalhes: '',
    fotoUrl: '',
    interessado: '',
    documentoInteressado: '',
    contatoEmail: '',
    contatoTelefone: '',
    cidadeUf: '',
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
      tipoInteressado: 'PROFISSIONAL',
      vinculoId: '',
      vinculoInscricao: '',
      vinculoDetalhes: '',
      fotoUrl: '',
      interessado: '',
      documentoInteressado: '',
      contatoEmail: '',
      contatoTelefone: '',
      cidadeUf: '',
      tipo: defaultTipo,
      setorAtual: defaultSetor,
      status: defaultStatus,
      conselheiroRelator: '',
      prazoDias: 30,
      descricao: ''
    });
    setIsNewModal(true);
  };

  const handleSelecionarProfissional = (p: Profissional) => {
    setNovoProt(prev => ({
      ...prev,
      tipoInteressado: 'PROFISSIONAL',
      vinculoId: p.id,
      vinculoInscricao: p.inscricao,
      vinculoDetalhes: `${p.tipoAssociado} • ${p.situacao} (${p.cidade || 'MANAUS'}/${p.uf || 'AM'})`,
      fotoUrl: p.fotoUrl || '',
      interessado: p.nome,
      documentoInteressado: maskCPF(p.cpf),
      contatoEmail: p.emailPessoal || p.emailComercial || '',
      contatoTelefone: p.celular || p.telefone || '',
      cidadeUf: `${p.cidade || 'MANAUS'}/${p.uf || 'AM'}`
    }));
    setIsConsultaProfissionalOpen(false);
    toastService.success(
      'Profissional Vinculado',
      `${p.nome} (CRF nº ${p.inscricao}) foi vinculado ao requerimento com sucesso.`
    );
  };

  const handleSelecionarEmpresa = (e: Empresa) => {
    setNovoProt(prev => ({
      ...prev,
      tipoInteressado: 'EMPRESA',
      vinculoId: e.id,
      vinculoInscricao: e.inscricao,
      vinculoDetalhes: `${e.tipoEstabelecimento || 'Farmácia'} • ${e.condicao || 'Regular'} (${e.cidade || 'MANAUS'}/${e.uf || 'AM'})`,
      fotoUrl: '',
      interessado: e.razaoSocial,
      documentoInteressado: maskCNPJ(e.cnpj),
      contatoEmail: e.email || '',
      contatoTelefone: e.telefone || '',
      cidadeUf: `${e.cidade || 'MANAUS'}/${e.uf || 'AM'}`
    }));
    setIsConsultaEmpresaOpen(false);
    toastService.success(
      'Empresa Vinculada',
      `${e.razaoSocial} (Inscrição PJ nº ${e.inscricao}) vinculada ao requerimento com sucesso.`
    );
  };

  const handleRemoverVinculo = () => {
    setNovoProt(prev => ({
      ...prev,
      vinculoId: '',
      vinculoInscricao: '',
      vinculoDetalhes: '',
      fotoUrl: '',
      interessado: '',
      documentoInteressado: '',
      contatoEmail: '',
      contatoTelefone: '',
      cidadeUf: ''
    }));
    toastService.info('Vínculo Removido', 'Os dados do interessado foram limpos para novo vínculo.');
  };

  const handleClearMainFilters = () => {
    setSearchTerm('');
    setStatusFilter('Todos');
    setTipoFilter('Todos');
    setSetorFilter('Todos');
    setTipoInteressadoFilter('Todos');
  };

  // Filtragem para Consulta de Profissionais com TODOS os filtros do cadastro
  const handleClearProfFilters = () => {
    setProfBusca('');
    setProfTipoFilter('Todos');
    setProfSituacaoFilter('Todos');
    setProfStatusFinFilter('Todos');
    setProfCidadeFilter('');
  };

  const profissionaisFiltrados = allProfissionais.filter(p => {
    if (profBusca.trim()) {
      const qNum = profBusca.replace(/\D/g, '');
      const qText = profBusca.toLowerCase().trim();
      const matchDoc = qNum && p.cpf?.replace(/\D/g, '').includes(qNum);
      const matchInscricao = qText && p.inscricao?.toLowerCase().includes(qText);
      const matchNome = qText && p.nome?.toLowerCase().includes(qText);
      if (!matchDoc && !matchInscricao && !matchNome) return false;
    }
    if (profTipoFilter !== 'Todos' && p.tipoAssociado !== profTipoFilter) return false;
    if (profSituacaoFilter !== 'Todos' && p.situacao !== profSituacaoFilter) return false;
    if (profStatusFinFilter !== 'Todos' && p.statusFinanceiro !== profStatusFinFilter) return false;
    if (profCidadeFilter.trim() && !p.cidade?.toLowerCase().includes(profCidadeFilter.toLowerCase().trim())) return false;
    return true;
  });

  // Filtragem para Consulta de Empresas com TODOS os filtros do cadastro
  const handleClearEmpFilters = () => {
    setEmpBusca('');
    setEmpCondicaoFilter('Todos');
    setEmpTipoFilter('Todos');
    setEmpTipoEmpresaFilter('Todos');
    setEmpStatusFinFilter('Todos');
    setEmpCidadeFilter('');
  };

  const empresasFiltradas = allEmpresas.filter(e => {
    if (empBusca.trim()) {
      const qNum = empBusca.replace(/\D/g, '');
      const qText = empBusca.toLowerCase().trim();
      const matchDoc = qNum && e.cnpj?.replace(/\D/g, '').includes(qNum);
      const matchInscricao = qText && e.inscricao?.toLowerCase().includes(qText);
      const matchRazao = qText && e.razaoSocial?.toLowerCase().includes(qText);
      const matchFantasia = qText && e.nomeFantasia?.toLowerCase().includes(qText);
      if (!matchDoc && !matchInscricao && !matchRazao && !matchFantasia) return false;
    }
    if (empCondicaoFilter !== 'Todos' && e.condicao !== empCondicaoFilter) return false;
    if (empTipoFilter !== 'Todos' && e.tipoEstabelecimento !== empTipoFilter) return false;
    if (empTipoEmpresaFilter !== 'Todos' && e.tipoEmpresa !== empTipoEmpresaFilter) return false;
    if (empStatusFinFilter !== 'Todos' && e.statusFinanceiro !== empStatusFinFilter) return false;
    if (empCidadeFilter.trim() && !e.cidade?.toLowerCase().includes(empCidadeFilter.toLowerCase().trim())) return false;
    return true;
  });

  const handleCreateProcesso = (e: React.FormEvent) => {
    e.preventDefault();
    if (!novoProt.interessado.trim()) {
      if (novoProt.tipoInteressado === 'PROFISSIONAL') {
        toastService.warning('Profissional Obrigatório', 'Consulte e vincule um profissional do conselho.');
      } else if (novoProt.tipoInteressado === 'EMPRESA') {
        toastService.warning('Empresa Obrigatória', 'Consulte e vincule uma empresa do conselho.');
      } else {
        toastService.warning('Campo Obrigatório', 'Preencha o nome do Interessado / Requerente.');
      }
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
      documentoInteressado: novoProt.documentoInteressado.trim() || 'SEM DOCUMENTO',
      tipoInteressado: novoProt.tipoInteressado,
      vinculoId: novoProt.vinculoId || undefined,
      vinculoInscricao: novoProt.vinculoInscricao || undefined,
      vinculoDetalhes: novoProt.vinculoDetalhes || undefined,
      contatoEmail: novoProt.contatoEmail || undefined,
      contatoTelefone: novoProt.contatoTelefone || undefined,
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

    const novo = sanitizeToUpper(rawProt, ['id', 'anexos', 'contatoEmail']);
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

  // Filtragem combinada da tela principal
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
    const matchesTipoInteressado = tipoInteressadoFilter === 'Todos' || p.tipoInteressado === tipoInteressadoFilter;

    return matchesSearch && matchesStatus && matchesTipo && matchesSetor && matchesTipoInteressado;
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
      'TIPO INTERESSADO': p.tipoInteressado || 'PÚBLICO',
      'INSCRIÇÃO VINCULADA': p.vinculoInscricao || '-',
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

  const isMainFiltersActive = searchTerm || statusFilter !== 'Todos' || tipoFilter !== 'Todos' || setorFilter !== 'Todos' || tipoInteressadoFilter !== 'Todos';

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
              Vínculo integrado com Profissionais (PF), Empresas (PJ) e Público Geral com tramitação por setores.
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

      {/* Filter Toolbar com Busca Persistente e Filtros Expansíveis (Padrão Unificado) */}
      <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-xs space-y-3 text-xs">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="PESQUISAR POR Nº PROTOCOLO, INTERESSADO OU CPF/CNPJ..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all uppercase text-xs font-medium"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center space-x-1.5 px-4 py-2.5 rounded-xl border text-xs font-bold transition-all uppercase shadow-2xs cursor-pointer ${
                showFilters ? 'bg-blue-50 border-blue-300 text-blue-700' : 'bg-white border-slate-300 hover:bg-slate-50 text-slate-700'
              }`}
            >
              <Filter className="w-4 h-4 text-blue-600" />
              <span>{showFilters ? 'Ocultar Filtros' : 'Filtros'}</span>
            </button>
            {isMainFiltersActive && (
              <button
                onClick={handleClearMainFilters}
                className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs uppercase transition-colors cursor-pointer"
                title="Limpar todos os filtros"
              >
                Limpar
              </button>
            )}
          </div>
        </div>

        {/* Painel Expansível de Filtros Avançados */}
        {showFilters && (
          <div className="pt-3 border-t border-slate-100 space-y-3 animate-in fade-in duration-150">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="min-w-0">
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Tipo de Requerimento</label>
                <select
                  value={tipoFilter}
                  onChange={(e) => setTipoFilter(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-semibold uppercase focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 text-xs"
                >
                  <option value="Todos">TODOS OS REQUERIMENTOS</option>
                  {cadastrosTipos.map(t => (
                    <option key={t.id} value={t.nome}>{t.nome}</option>
                  ))}
                </select>
              </div>

              <div className="min-w-0">
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Setor Atual</label>
                <select
                  value={setorFilter}
                  onChange={(e) => setSetorFilter(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-semibold uppercase focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 text-xs"
                >
                  <option value="Todos">TODOS OS SETORES</option>
                  {cadastrosSetores.map(s => (
                    <option key={s.id} value={s.nome}>{s.nome}</option>
                  ))}
                </select>
              </div>

              <div className="min-w-0">
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Status do Processo</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-semibold uppercase focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 text-xs"
                >
                  <option value="Todos">TODOS STATUS</option>
                  {cadastrosStatus.map(st => (
                    <option key={st.id} value={st.nome}>{st.nome}</option>
                  ))}
                </select>
              </div>

              <div className="min-w-0">
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Origem / Vínculo</label>
                <select
                  value={tipoInteressadoFilter}
                  onChange={(e) => setTipoInteressadoFilter(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-semibold uppercase focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 text-xs"
                >
                  <option value="Todos">TODOS OS VÍNCULOS</option>
                  <option value="PROFISSIONAL">PROFISSIONAL (PF)</option>
                  <option value="EMPRESA">EMPRESA (PJ)</option>
                  <option value="PUBLICO">PÚBLICO GERAL</option>
                </select>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Barra Informativa de Processos Filtrados */}
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
      </div>

      {/* Tabela de Processos */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-600 border-b border-slate-200 font-bold uppercase tracking-wider text-[11px]">
                <th className="py-3.5 px-4">PROTOCOLO Nº</th>
                <th className="py-3.5 px-4">INTERESSADO / VÍNCULO</th>
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
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {proc.tipoInteressado === 'PROFISSIONAL' ? (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
                            <UserCheck className="w-2.5 h-2.5" />
                            PF
                          </span>
                        ) : proc.tipoInteressado === 'EMPRESA' ? (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                            <Building2 className="w-2.5 h-2.5" />
                            PJ
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                            <Globe className="w-2.5 h-2.5" />
                            EXTERNO
                          </span>
                        )}
                        <span className="font-bold text-slate-900 uppercase">{proc.interessado}</span>
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                        {proc.documentoInteressado}
                        {proc.vinculoInscricao && (
                          <span className="ml-1 text-purple-700 font-bold">• Inscrição: {proc.vinculoInscricao}</span>
                        )}
                      </div>
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
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Informações Gerais */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/70 space-y-1">
                <div className="text-slate-400 font-bold uppercase text-[10px] flex items-center justify-between">
                  <span>Interessado & Documento</span>
                  {selectedProcesso.tipoInteressado === 'PROFISSIONAL' ? (
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-purple-50 text-purple-700 font-bold border border-purple-200">PF REGISTRADO</span>
                  ) : selectedProcesso.tipoInteressado === 'EMPRESA' ? (
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 font-bold border border-blue-200">PJ REGISTRADA</span>
                  ) : (
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 font-bold border border-amber-200">PÚBLICO GERAL</span>
                  )}
                </div>
                <div className="font-bold text-slate-900 uppercase">{selectedProcesso.interessado}</div>
                <div className="font-mono text-slate-600 text-xs">
                  {selectedProcesso.documentoInteressado}
                  {selectedProcesso.vinculoInscricao && <span className="ml-1 text-purple-700 font-bold">• Inscrição: {selectedProcesso.vinculoInscricao}</span>}
                </div>
                {selectedProcesso.vinculoDetalhes && (
                  <div className="text-[10px] text-slate-500 font-medium">{selectedProcesso.vinculoDetalhes}</div>
                )}
                {(selectedProcesso.contatoEmail || selectedProcesso.contatoTelefone) && (
                  <div className="pt-1 border-t border-slate-200/60 text-[10px] text-slate-500 space-y-0.5">
                    {selectedProcesso.contatoEmail && <div className="truncate flex items-center gap-1"><Mail className="w-3 h-3 text-slate-400" /> {selectedProcesso.contatoEmail}</div>}
                    {selectedProcesso.contatoTelefone && <div className="flex items-center gap-1"><Phone className="w-3 h-3 text-slate-400" /> {selectedProcesso.contatoTelefone}</div>}
                  </div>
                )}
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/70 space-y-1">
                <div className="text-slate-400 font-bold uppercase text-[10px]">Setor Atual & Relator</div>
                <div>Setor: <strong className="text-blue-800 uppercase">{selectedProcesso.setorAtual}</strong></div>
                <div className="text-slate-600 truncate">Relator: <span className="font-medium uppercase">{selectedProcesso.conselheiroRelator || 'Não distribuído'}</span></div>
                <div className="text-slate-500 text-[11px] pt-1">Requerimento: <span className="font-semibold text-slate-700">{selectedProcesso.tipo}</span></div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/70 space-y-1">
                <div className="text-slate-400 font-bold uppercase text-[10px]">Prazos Regulamentares</div>
                <div>Abertura: <span className="font-mono text-slate-800">{selectedProcesso.dataAbertura}</span></div>
                <div>Prazo Limite: <span className="font-mono text-rose-700 font-bold">{selectedProcesso.prazoResposta}</span></div>
                <div>Última Atualização: <span className="font-mono text-slate-500">{selectedProcesso.dataUltimaAtualizacao}</span></div>
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

      {/* Modal Autuação de Processo Administrativo com Vínculo ao Conselho ou Público */}
      {isNewModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-2xl w-full my-6 max-h-[92vh] overflow-y-auto shadow-2xl p-5 sm:p-6 text-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-200">
                  <Plus className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900 uppercase">
                    Autuação de Processo Administrativo
                  </h2>
                  <p className="text-[11px] text-slate-500">
                    Vincule a um Profissional (PF), Empresa (PJ) ou Requerente Externo (Público Geral).
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsNewModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateProcesso} className="space-y-4">
              {/* Seletor de Origem do Requerente */}
              <div className="space-y-1.5">
                <label className="block text-slate-700 font-bold uppercase text-[11px]">
                  Tipo de Requerente / Vínculo com o Conselho *
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (novoProt.tipoInteressado !== 'PROFISSIONAL') {
                        setNovoProt(prev => ({
                          ...prev,
                          tipoInteressado: 'PROFISSIONAL',
                          vinculoId: '',
                          vinculoInscricao: '',
                          vinculoDetalhes: '',
                          fotoUrl: '',
                          interessado: '',
                          documentoInteressado: '',
                          contatoEmail: '',
                          contatoTelefone: '',
                          cidadeUf: ''
                        }));
                      }
                    }}
                    className={`flex items-center justify-center space-x-2 py-2.5 px-3 rounded-xl border text-xs font-bold uppercase transition-all cursor-pointer ${
                      novoProt.tipoInteressado === 'PROFISSIONAL'
                        ? 'bg-purple-50 border-purple-300 text-purple-700 shadow-xs ring-2 ring-purple-500/20'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <UserCheck className="w-4 h-4 text-purple-600" />
                    <span>Profissional (PF)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (novoProt.tipoInteressado !== 'EMPRESA') {
                        setNovoProt(prev => ({
                          ...prev,
                          tipoInteressado: 'EMPRESA',
                          vinculoId: '',
                          vinculoInscricao: '',
                          vinculoDetalhes: '',
                          fotoUrl: '',
                          interessado: '',
                          documentoInteressado: '',
                          contatoEmail: '',
                          contatoTelefone: '',
                          cidadeUf: ''
                        }));
                      }
                    }}
                    className={`flex items-center justify-center space-x-2 py-2.5 px-3 rounded-xl border text-xs font-bold uppercase transition-all cursor-pointer ${
                      novoProt.tipoInteressado === 'EMPRESA'
                        ? 'bg-blue-50 border-blue-300 text-blue-700 shadow-xs ring-2 ring-blue-500/20'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <Building2 className="w-4 h-4 text-blue-600" />
                    <span>Empresa (PJ)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (novoProt.tipoInteressado !== 'PUBLICO') {
                        setNovoProt(prev => ({
                          ...prev,
                          tipoInteressado: 'PUBLICO',
                          vinculoId: '',
                          vinculoInscricao: '',
                          vinculoDetalhes: 'SEM CADASTRO NO CONSELHO',
                          fotoUrl: '',
                          interessado: '',
                          documentoInteressado: '',
                          contatoEmail: '',
                          contatoTelefone: '',
                          cidadeUf: ''
                        }));
                      }
                    }}
                    className={`flex items-center justify-center space-x-2 py-2.5 px-3 rounded-xl border text-xs font-bold uppercase transition-all cursor-pointer ${
                      novoProt.tipoInteressado === 'PUBLICO'
                        ? 'bg-amber-50 border-amber-300 text-amber-700 shadow-xs ring-2 ring-amber-500/20'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <Globe className="w-4 h-4 text-amber-600" />
                    <span>Público Geral</span>
                  </button>
                </div>
              </div>

              {/* CARD DE VÍNCULO ESPECÍFICO CONFORME A SELEÇÃO */}
              {novoProt.tipoInteressado === 'PROFISSIONAL' && (
                <div className="p-3.5 bg-purple-50/50 rounded-2xl border border-purple-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-purple-900 uppercase text-[11px] flex items-center gap-1.5">
                      <UserCheck className="w-4 h-4 text-purple-700" />
                      <span>Profissional do Conselho (Pessoa Física)</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsConsultaProfissionalOpen(true)}
                      className="flex items-center space-x-1.5 px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold uppercase text-[11px] shadow-sm transition-all cursor-pointer"
                    >
                      <Search className="w-3.5 h-3.5" />
                      <span>{novoProt.vinculoId ? 'Alterar Profissional' : 'Consultar e Vincular Profissional'}</span>
                    </button>
                  </div>

                  {novoProt.vinculoId ? (
                    <div className="bg-white rounded-xl p-3 border border-purple-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xs">
                      <div className="flex items-center space-x-3 min-w-0">
                        {novoProt.fotoUrl ? (
                          <div 
                            onClick={() => setPhotoPreviewUrl(novoProt.fotoUrl || null)}
                            className="relative w-12 h-12 rounded-xl overflow-hidden border border-purple-200 shrink-0 cursor-pointer group"
                            title="Clique para ampliar a foto"
                          >
                            <img src={novoProt.fotoUrl} alt={novoProt.interessado} className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-slate-900/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white">
                              <ZoomIn className="w-3.5 h-3.5" />
                            </div>
                          </div>
                        ) : (
                          <div className="w-12 h-12 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-base border border-purple-200 shrink-0">
                            {novoProt.interessado.slice(0, 2).toUpperCase()}
                          </div>
                        )}
                        <div className="min-w-0">
                          <div className="font-bold text-slate-900 text-sm uppercase truncate">{novoProt.interessado}</div>
                          <div className="text-[11px] text-purple-800 font-bold font-mono">
                            CRF nº {novoProt.vinculoInscricao} • CPF: {novoProt.documentoInteressado}
                          </div>
                          <div className="text-[10px] text-slate-500 font-medium truncate">{novoProt.vinculoDetalhes}</div>
                          {(novoProt.contatoEmail || novoProt.contatoTelefone) && (
                            <div className="text-[10px] text-slate-500 flex items-center gap-2 mt-0.5">
                              {novoProt.contatoEmail && <span>{novoProt.contatoEmail}</span>}
                              {novoProt.contatoTelefone && <span>• {novoProt.contatoTelefone}</span>}
                            </div>
                          )}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={handleRemoverVinculo}
                        className="px-2.5 py-1.5 text-rose-600 hover:bg-rose-50 border border-rose-200 rounded-lg font-bold text-[10px] uppercase transition-colors shrink-0 cursor-pointer"
                        title="Desvincular profissional"
                      >
                        Desvincular
                      </button>
                    </div>
                  ) : (
                    <div 
                      onClick={() => setIsConsultaProfissionalOpen(true)}
                      className="bg-white/80 border-2 border-dashed border-purple-200 hover:border-purple-400 rounded-xl p-4 text-center cursor-pointer transition-all"
                    >
                      <UserCheck className="w-7 h-7 text-purple-400 mx-auto mb-1.5" />
                      <p className="font-bold text-purple-900 uppercase text-xs">Nenhum profissional vinculado ainda</p>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Clique aqui para abrir o modal de consulta e filtrar por Inscrição, CPF, Nome, Tipo ou Situação.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {novoProt.tipoInteressado === 'EMPRESA' && (
                <div className="p-3.5 bg-blue-50/50 rounded-2xl border border-blue-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-blue-900 uppercase text-[11px] flex items-center gap-1.5">
                      <Building2 className="w-4 h-4 text-blue-700" />
                      <span>Empresa / Estabelecimento Registrado (Pessoa Jurídica)</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsConsultaEmpresaOpen(true)}
                      className="flex items-center space-x-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold uppercase text-[11px] shadow-sm transition-all cursor-pointer"
                    >
                      <Search className="w-3.5 h-3.5" />
                      <span>{novoProt.vinculoId ? 'Alterar Empresa' : 'Consultar e Vincular Empresa'}</span>
                    </button>
                  </div>

                  {novoProt.vinculoId ? (
                    <div className="bg-white rounded-xl p-3 border border-blue-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xs">
                      <div className="flex items-center space-x-3 min-w-0">
                        <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-base border border-blue-200 shrink-0">
                          <Building className="w-6 h-6" />
                        </div>
                        <div className="min-w-0">
                          <div className="font-bold text-slate-900 text-sm uppercase truncate">{novoProt.interessado}</div>
                          <div className="text-[11px] text-blue-800 font-bold font-mono">
                            Inscrição PJ: {novoProt.vinculoInscricao} • CNPJ: {novoProt.documentoInteressado}
                          </div>
                          <div className="text-[10px] text-slate-500 font-medium truncate">{novoProt.vinculoDetalhes}</div>
                          {(novoProt.contatoEmail || novoProt.contatoTelefone) && (
                            <div className="text-[10px] text-slate-500 flex items-center gap-2 mt-0.5">
                              {novoProt.contatoEmail && <span>{novoProt.contatoEmail}</span>}
                              {novoProt.contatoTelefone && <span>• {novoProt.contatoTelefone}</span>}
                            </div>
                          )}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={handleRemoverVinculo}
                        className="px-2.5 py-1.5 text-rose-600 hover:bg-rose-50 border border-rose-200 rounded-lg font-bold text-[10px] uppercase transition-colors shrink-0 cursor-pointer"
                        title="Desvincular empresa"
                      >
                        Desvincular
                      </button>
                    </div>
                  ) : (
                    <div 
                      onClick={() => setIsConsultaEmpresaOpen(true)}
                      className="bg-white/80 border-2 border-dashed border-blue-200 hover:border-blue-400 rounded-xl p-4 text-center cursor-pointer transition-all"
                    >
                      <Building2 className="w-7 h-7 text-blue-400 mx-auto mb-1.5" />
                      <p className="font-bold text-blue-900 uppercase text-xs">Nenhuma empresa vinculada ainda</p>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Clique aqui para abrir o modal de consulta e filtrar por Razão Social, CNPJ, Categoria ou Condição.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {novoProt.tipoInteressado === 'PUBLICO' && (
                <div className="p-3.5 bg-amber-50/50 rounded-2xl border border-amber-200 space-y-3">
                  <div className="flex items-center gap-1.5 text-amber-900 font-bold uppercase text-[11px]">
                    <Globe className="w-4 h-4 text-amber-700" />
                    <span>Público Geral / Requerente Sem Cadastro no Conselho</span>
                  </div>
                  <p className="text-[11px] text-slate-600">
                    Utilize esta opção para cidadãos, órgãos públicos, vigilâncias sanitárias ou denunciantes sem registro profissional ou empresarial prévio.
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div className="sm:col-span-2">
                      <label className="block text-slate-700 font-bold mb-1 uppercase text-[10px]">
                        Nome Completo ou Razão Social do Requerente *
                      </label>
                      <input
                        type="text"
                        required
                        value={novoProt.interessado}
                        onChange={(e) => setNovoProt(prev => ({ ...prev, interessado: e.target.value.toUpperCase() }))}
                        placeholder="EX: MARIA SILVA DOS SANTOS OU SECRETARIA MUNICIPAL DE SAÚDE"
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 uppercase font-semibold focus:outline-hidden focus:ring-2 focus:ring-amber-500/20"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-700 font-bold mb-1 uppercase text-[10px]">
                        CPF ou CNPJ (Opcional)
                      </label>
                      <input
                        type="text"
                        value={novoProt.documentoInteressado}
                        onChange={(e) => {
                          const clean = e.target.value.replace(/\D/g, '');
                          const masked = clean.length > 11 ? maskCNPJ(e.target.value) : maskCPF(e.target.value);
                          setNovoProt(prev => ({ ...prev, documentoInteressado: masked }));
                        }}
                        placeholder="000.000.000-00 ou 00.000.000/0000-00"
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 font-mono font-bold focus:outline-hidden focus:ring-2 focus:ring-amber-500/20"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-700 font-bold mb-1 uppercase text-[10px]">
                        Cidade / UF
                      </label>
                      <input
                        type="text"
                        value={novoProt.cidadeUf}
                        onChange={(e) => setNovoProt(prev => ({ ...prev, cidadeUf: e.target.value.toUpperCase() }))}
                        placeholder="EX: MANAUS/AM"
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 uppercase font-medium focus:outline-hidden focus:ring-2 focus:ring-amber-500/20"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-700 font-bold mb-1 uppercase text-[10px]">
                        E-mail de Contato
                      </label>
                      <input
                        type="email"
                        value={novoProt.contatoEmail}
                        onChange={(e) => setNovoProt(prev => ({ ...prev, contatoEmail: e.target.value }))}
                        placeholder="contato@exemplo.com"
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-amber-500/20"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-700 font-bold mb-1 uppercase text-[10px]">
                        Telefone / WhatsApp
                      </label>
                      <input
                        type="text"
                        value={novoProt.contatoTelefone}
                        onChange={(e) => setNovoProt(prev => ({ ...prev, contatoTelefone: e.target.value }))}
                        placeholder="(00) 00000-0000"
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 font-mono focus:outline-hidden focus:ring-2 focus:ring-amber-500/20"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* DADOS REGULAMENTARES DO PROCESSO */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
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
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
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

      {/* MODAL DE CONSULTA DE PROFISSIONAIS (PF) COM TODOS OS FILTROS DO CADASTRO */}
      {isConsultaProfissionalOpen && (
        <div className="fixed inset-0 z-70 bg-slate-900/65 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-4xl w-full my-6 max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-150">
            {/* Header Modal Consulta */}
            <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-100 bg-purple-50/40">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-purple-600 text-white flex items-center justify-center shadow-xs">
                  <UserCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 uppercase">
                    Consulta de Profissionais (Pessoa Física)
                  </h3>
                  <p className="text-xs text-slate-500">
                    Selecione o profissional com registro no conselho para vincular ao protocolo.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsConsultaProfissionalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Painel Completo de Filtros do Cadastro de Profissionais */}
            <div className="p-4 bg-slate-50 border-b border-slate-200 space-y-3 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
                <div className="sm:col-span-2 relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="BUSCAR NOME, CPF OU INSCRIÇÃO..."
                    value={profBusca}
                    onChange={(e) => setProfBusca(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 uppercase font-medium focus:outline-hidden focus:ring-2 focus:ring-purple-500/20"
                  />
                </div>

                <div>
                  <select
                    value={profTipoFilter}
                    onChange={(e) => setProfTipoFilter(e.target.value)}
                    className="w-full px-2.5 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 font-semibold uppercase text-xs focus:outline-hidden focus:ring-2 focus:ring-purple-500/20"
                  >
                    <option value="Todos">TODOS OS TIPOS</option>
                    {cadastrosTiposProf.length > 0 ? (
                      cadastrosTiposProf.map(t => (
                        <option key={t.id} value={t.nome}>{t.nome}</option>
                      ))
                    ) : (
                      <>
                        <option value="Farmacêutico">Farmacêutico</option>
                        <option value="Farmacêutico Bioquímico">Farmacêutico Bioquímico</option>
                        <option value="Técnico em Farmácia">Técnico em Farmácia</option>
                        <option value="Não Farmacêutico">Não Farmacêutico</option>
                      </>
                    )}
                  </select>
                </div>

                <div>
                  <select
                    value={profSituacaoFilter}
                    onChange={(e) => setProfSituacaoFilter(e.target.value)}
                    className="w-full px-2.5 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 font-semibold uppercase text-xs focus:outline-hidden focus:ring-2 focus:ring-purple-500/20"
                  >
                    <option value="Todos">TODAS SITUAÇÕES</option>
                    {cadastrosSituacoesProf.length > 0 ? (
                      cadastrosSituacoesProf.map(s => (
                        <option key={s.id} value={s.nome}>{s.nome}</option>
                      ))
                    ) : (
                      <>
                        <option value="Definitivo">Definitivo</option>
                        <option value="Provisório">Provisório</option>
                        <option value="Remido">Remido</option>
                        <option value="Cancelado">Cancelado</option>
                        <option value="Suspenso">Suspenso</option>
                      </>
                    )}
                  </select>
                </div>

                <div>
                  <select
                    value={profStatusFinFilter}
                    onChange={(e) => setProfStatusFinFilter(e.target.value)}
                    className="w-full px-2.5 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 font-semibold uppercase text-xs focus:outline-hidden focus:ring-2 focus:ring-purple-500/20"
                  >
                    <option value="Todos">STATUS FINANCEIRO</option>
                    <option value="Adimplente">Adimplente</option>
                    <option value="Inadimplente">Inadimplente</option>
                    <option value="Isento">Isento</option>
                    <option value="Parcelamento">Parcelamento</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-between gap-2 pt-1">
                <div className="flex items-center space-x-2 w-full sm:w-auto">
                  <div className="relative flex-1 sm:w-64">
                    <MapPin className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder="FILTRAR POR CIDADE..."
                      value={profCidadeFilter}
                      onChange={(e) => setProfCidadeFilter(e.target.value)}
                      className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-300 rounded-xl text-slate-900 uppercase text-xs font-medium focus:outline-hidden focus:ring-2 focus:ring-purple-500/20"
                    />
                  </div>
                  {(profBusca || profTipoFilter !== 'Todos' || profSituacaoFilter !== 'Todos' || profStatusFinFilter !== 'Todos' || profCidadeFilter) && (
                    <button
                      onClick={handleClearProfFilters}
                      className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-xl uppercase text-[11px] cursor-pointer"
                    >
                      Limpar Filtros
                    </button>
                  )}
                </div>

                <span className="text-purple-900 font-bold text-xs uppercase shrink-0">
                  {profissionaisFiltrados.length} profissionais encontrados
                </span>
              </div>
            </div>

            {/* Lista com Rolagem dos Profissionais */}
            <div className="flex-1 overflow-y-auto p-4 divide-y divide-slate-100">
              {profissionaisFiltrados.length === 0 ? (
                <div className="py-12 text-center text-slate-400">
                  <UserCheck className="w-10 h-10 mx-auto mb-2 opacity-40 text-purple-400" />
                  <p className="font-bold uppercase text-slate-700">Nenhum profissional localizado</p>
                  <p className="text-xs text-slate-400 mt-1">
                    Revise os filtros de busca ou verifique se o profissional está cadastrado no sistema.
                  </p>
                </div>
              ) : (
                profissionaisFiltrados.map((p) => (
                  <div
                    key={p.id}
                    className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-purple-50/30 p-2 rounded-xl transition-colors"
                  >
                    <div className="flex items-center space-x-3 min-w-0">
                      {p.fotoUrl ? (
                        <div 
                          onClick={() => setPhotoPreviewUrl(p.fotoUrl || null)}
                          className="relative w-11 h-11 rounded-xl overflow-hidden border border-purple-200 shrink-0 cursor-pointer group"
                          title="Clique para ampliar a foto"
                        >
                          <img src={p.fotoUrl} alt={p.nome} className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-slate-900/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white">
                            <ZoomIn className="w-3.5 h-3.5" />
                          </div>
                        </div>
                      ) : (
                        <div className="w-11 h-11 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-sm border border-purple-200 shrink-0">
                          {p.nome.slice(0, 2).toUpperCase()}
                        </div>
                      )}

                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-slate-900 text-sm uppercase truncate">{p.nome}</span>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800 border border-purple-200">
                            CRF nº {p.inscricao}
                          </span>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            p.situacao?.toUpperCase().includes('DEF')
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}>
                            {p.situacao}
                          </span>
                        </div>

                        <div className="text-[11px] text-slate-500 font-mono mt-0.5 flex items-center gap-2 flex-wrap">
                          <span>CPF: {maskCPF(p.cpf)}</span>
                          <span>• {p.tipoAssociado}</span>
                          <span>• {p.cidade || 'MANAUS'}/{p.uf || 'AM'}</span>
                          {p.statusFinanceiro && (
                            <span className={`px-1.5 py-0.2 rounded font-bold text-[9px] ${
                              p.statusFinanceiro === 'Adimplente' ? 'text-emerald-700 bg-emerald-50' : 'text-rose-700 bg-rose-50'
                            }`}>
                              {p.statusFinanceiro}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => handleSelecionarProfissional(p)}
                      className="flex items-center justify-center space-x-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold uppercase text-xs shadow-sm transition-all shrink-0 cursor-pointer"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Selecionar & Vincular</span>
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Footer Modal Consulta */}
            <div className="p-3 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setIsConsultaProfissionalOpen(false)}
                className="px-4 py-2 rounded-xl bg-white border border-slate-300 text-slate-700 font-bold uppercase text-xs hover:bg-slate-100 cursor-pointer"
              >
                Fechar Consulta
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE CONSULTA DE EMPRESAS (PJ) COM TODOS OS FILTROS DO CADASTRO */}
      {isConsultaEmpresaOpen && (
        <div className="fixed inset-0 z-70 bg-slate-900/65 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-4xl w-full my-6 max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-150">
            {/* Header Modal Consulta */}
            <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-100 bg-blue-50/40">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 uppercase">
                    Consulta de Empresas (Pessoa Jurídica)
                  </h3>
                  <p className="text-xs text-slate-500">
                    Selecione o estabelecimento registrado no conselho para vincular ao protocolo.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsConsultaEmpresaOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Painel Completo de Filtros do Cadastro de Empresas */}
            <div className="p-4 bg-slate-50 border-b border-slate-200 space-y-3 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
                <div className="sm:col-span-2 relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="BUSCAR RAZÃO, FANTASIA, CNPJ OU INSCRIÇÃO..."
                    value={empBusca}
                    onChange={(e) => setEmpBusca(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 uppercase font-medium focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>

                <div>
                  <select
                    value={empCondicaoFilter}
                    onChange={(e) => setEmpCondicaoFilter(e.target.value)}
                    className="w-full px-2.5 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 font-semibold uppercase text-xs focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
                  >
                    <option value="Todos">TODAS CONDIÇÕES</option>
                    <option value="Regular">Regular</option>
                    <option value="Irregular">Irregular</option>
                    <option value="Ilegal">Ilegal</option>
                    <option value="Inativa">Inativa</option>
                    <option value="Interditada">Interditada</option>
                    <option value="Em Processo">Em Processo</option>
                  </select>
                </div>

                <div>
                  <select
                    value={empTipoFilter}
                    onChange={(e) => setEmpTipoFilter(e.target.value)}
                    className="w-full px-2.5 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 font-semibold uppercase text-xs focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
                  >
                    <option value="Todos">TODOS ESTABELECIMENTOS</option>
                    {cadastrosTiposEmp.length > 0 ? (
                      cadastrosTiposEmp.map(t => (
                        <option key={t.id} value={t.nome}>{t.nome}</option>
                      ))
                    ) : (
                      <>
                        <option value="Drogaria">Drogaria</option>
                        <option value="Farmácia com Manipulação">Farmácia com Manipulação</option>
                        <option value="Distribuidora de Medicamentos">Distribuidora</option>
                        <option value="Farmácia Hospitalar">Hospitalar</option>
                        <option value="Indústria Farmacêutica">Indústria</option>
                      </>
                    )}
                  </select>
                </div>

                <div>
                  <select
                    value={empTipoEmpresaFilter}
                    onChange={(e) => setEmpTipoEmpresaFilter(e.target.value)}
                    className="w-full px-2.5 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 font-semibold uppercase text-xs focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
                  >
                    <option value="Todos">TODOS OS TIPOS</option>
                    <option value="Matriz">Matriz</option>
                    <option value="Filial">Filial</option>
                    <option value="Privado">Privado</option>
                    <option value="Público">Público</option>
                    <option value="Filantrópico">Filantrópico</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-between gap-2 pt-1">
                <div className="flex items-center space-x-2 w-full sm:w-auto">
                  <div className="relative flex-1 sm:w-64">
                    <MapPin className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder="FILTRAR POR CIDADE..."
                      value={empCidadeFilter}
                      onChange={(e) => setEmpCidadeFilter(e.target.value)}
                      className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-300 rounded-xl text-slate-900 uppercase text-xs font-medium focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>

                  <select
                    value={empStatusFinFilter}
                    onChange={(e) => setEmpStatusFinFilter(e.target.value)}
                    className="px-2.5 py-1.5 bg-white border border-slate-300 rounded-xl text-slate-900 font-semibold uppercase text-xs focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
                  >
                    <option value="Todos">STATUS FINANCEIRO</option>
                    <option value="Adimplente">Adimplente</option>
                    <option value="Inadimplente">Inadimplente</option>
                    <option value="Em Cobrança">Em Cobrança</option>
                  </select>

                  {(empBusca || empCondicaoFilter !== 'Todos' || empTipoFilter !== 'Todos' || empTipoEmpresaFilter !== 'Todos' || empStatusFinFilter !== 'Todos' || empCidadeFilter) && (
                    <button
                      onClick={handleClearEmpFilters}
                      className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-xl uppercase text-[11px] cursor-pointer"
                    >
                      Limpar Filtros
                    </button>
                  )}
                </div>

                <span className="text-blue-900 font-bold text-xs uppercase shrink-0">
                  {empresasFiltradas.length} empresas encontradas
                </span>
              </div>
            </div>

            {/* Lista com Rolagem das Empresas */}
            <div className="flex-1 overflow-y-auto p-4 divide-y divide-slate-100">
              {empresasFiltradas.length === 0 ? (
                <div className="py-12 text-center text-slate-400">
                  <Building2 className="w-10 h-10 mx-auto mb-2 opacity-40 text-blue-400" />
                  <p className="font-bold uppercase text-slate-700">Nenhuma empresa localizada</p>
                  <p className="text-xs text-slate-400 mt-1">
                    Revise os filtros de busca ou verifique se a empresa está registrada no sistema.
                  </p>
                </div>
              ) : (
                empresasFiltradas.map((e) => (
                  <div
                    key={e.id}
                    className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-blue-50/30 p-2 rounded-xl transition-colors"
                  >
                    <div className="flex items-center space-x-3 min-w-0">
                      <div className="w-11 h-11 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-sm border border-blue-200 shrink-0">
                        <Building className="w-5 h-5" />
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-slate-900 text-sm uppercase truncate">{e.razaoSocial}</span>
                          {e.nomeFantasia && (
                            <span className="text-xs text-slate-500 uppercase font-medium">({e.nomeFantasia})</span>
                          )}
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-200">
                            Inscrição PJ: {e.inscricao}
                          </span>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            e.condicao === 'Regular'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}>
                            {e.condicao}
                          </span>
                        </div>

                        <div className="text-[11px] text-slate-500 font-mono mt-0.5 flex items-center gap-2 flex-wrap">
                          <span>CNPJ: {maskCNPJ(e.cnpj)}</span>
                          <span>• {e.tipoEstabelecimento || 'Drogaria'}</span>
                          <span>• {e.tipoEmpresa || 'Matriz'}</span>
                          <span>• {e.cidade || 'MANAUS'}/{e.uf || 'AM'}</span>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => handleSelecionarEmpresa(e)}
                      className="flex items-center justify-center space-x-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold uppercase text-xs shadow-sm transition-all shrink-0 cursor-pointer"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Selecionar & Vincular</span>
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Footer Modal Consulta */}
            <div className="p-3 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setIsConsultaEmpresaOpen(false)}
                className="px-4 py-2 rounded-xl bg-white border border-slate-300 text-slate-700 font-bold uppercase text-xs hover:bg-slate-100 cursor-pointer"
              >
                Fechar Consulta
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Visualização da Foto em Tamanho Grande */}
      {photoPreviewUrl && (
        <div 
          onClick={() => setPhotoPreviewUrl(null)}
          className="fixed inset-0 z-80 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 cursor-pointer animate-in fade-in duration-150"
        >
          <div 
            onClick={(e) => e.stopPropagation()} 
            className="relative bg-white rounded-2xl p-2.5 max-w-lg w-full shadow-2xl overflow-hidden cursor-default"
          >
            <div className="flex items-center justify-between pb-2 px-2 border-b border-slate-100">
              <span className="font-bold text-xs uppercase text-slate-800">Visualização de Foto em Alta Resolução</span>
              <button
                onClick={() => setPhotoPreviewUrl(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="mt-2.5 max-h-[75vh] flex items-center justify-center overflow-hidden rounded-xl bg-slate-100">
              <img 
                src={photoPreviewUrl} 
                alt="Foto Ampliada" 
                className="w-full h-auto max-h-[72vh] object-contain rounded-xl"
              />
            </div>
          </div>
        </div>
      )}

      {/* Modal Tramitação / Despacho Rápido */}
      {isTramitacaoOpen && selectedProcesso && (
        <div className="fixed inset-0 z-60 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full shadow-2xl p-5 text-xs space-y-4 animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <div className="flex items-center space-x-2">
                <Send className="w-4 h-4 text-blue-600" />
                <span className="font-bold text-slate-900 uppercase">Tramitação e Despacho Processual</span>
              </div>
              <button
                onClick={() => setIsTramitacaoOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer"
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
                  className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold uppercase cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold uppercase shadow-sm cursor-pointer"
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
