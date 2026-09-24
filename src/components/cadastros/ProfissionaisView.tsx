import React, { useState } from 'react';
import { 
  Users, 
  Search, 
  Filter, 
  Plus, 
  Download, 
  Eye, 
  Edit3, 
  Trash2,
  ShieldCheck, 
  GraduationCap, 
  FileCheck2, 
  Phone, 
  Mail, 
  MapPin, 
  Calendar,
  X,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Clock,
  ChevronLeft,
  ChevronRight,
  UserCheck,
  Hash,
  Sparkles,
  Loader2,
  Camera,
  Upload,
  Building2,
  DollarSign,
  Award,
  Layers,
  Briefcase,
  Check,
  Receipt,
  FileText,
  Send,
  MessageSquare,
  History,
  FileEdit,
  ArrowRight,
  Activity,
  FileSpreadsheet
} from 'lucide-react';
import { Profissional, SituacaoProfissional, TipoAssociado, Empresa, ProtocoloProcesso } from '../../types';
import { storageService } from '../../services/storageService';
import { exportToCSV, exportToPDF } from '../../services/exportService';
import { toastService } from '../../services/toastService';
import { 
  maskCPF, 
  validateCPF, 
  maskPhone, 
  maskCEP, 
  validateCEP,
  fetchAddressByCEP,
  maskRG, 
  sanitizeToUpper 
} from '../../utils/documentUtils';

interface ProfissionaisViewProps {
  onOpenBoletoPix?: (lancamento: any) => void;
}

export const ProfissionaisView: React.FC<ProfissionaisViewProps> = ({ onOpenBoletoPix }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [situacaoFilter, setSituacaoFilter] = useState<string>('Todos');
  const [tipoFilter, setTipoFilter] = useState<string>('Todos');
  const [statusFinFilter, setStatusFinFilter] = useState<string>('Todos');
  const [cepFilter, setCepFilter] = useState('');
  const [enderecoFilter, setEnderecoFilter] = useState('');
  const [complementoFilter, setComplementoFilter] = useState('');
  const [habilitacaoFilter, setHabilitacaoFilter] = useState('Todos');
  const [page, setPage] = useState(1);
  const pageSize = 15;

  const handleClearFilters = () => {
    setSearchTerm('');
    setSituacaoFilter('Todos');
    setTipoFilter('Todos');
    setStatusFinFilter('Todos');
    setCepFilter('');
    setEnderecoFilter('');
    setComplementoFilter('');
    setHabilitacaoFilter('Todos');
    setPage(1);
    toastService.info('Filtros Limpos', 'Todos os filtros de profissionais foram redefinidos.');
  };

  // Visualizar Cadastro Modal State
  const [selectedProfissional, setSelectedProfissional] = useState<Profissional | null>(null);
  const [viewDetailsTab, setViewDetailsTab] = useState<'dados_gerais' | 'protocolos' | 'empresas' | 'financeiro'>('dados_gerais');

  // Protocol Operations Modal State within Visualizar Cadastro
  const [isNewProtocolModalOpen, setIsNewProtocolModalOpen] = useState(false);
  const [newProtocolForm, setNewProtocolForm] = useState({
    tipo: '',
    setorAtual: '',
    status: 'Em Análise',
    assunto: '',
    conselheiroRelator: '',
    prazoDias: 15
  });

  const [protocolToEdit, setProtocolToEdit] = useState<ProtocoloProcesso | null>(null);
  const [protocolToAddAction, setProtocolToAddAction] = useState<ProtocoloProcesso | null>(null);
  const [newActionForm, setNewActionForm] = useState({
    setor: '',
    descricao: '',
    responsavel: 'Secretaria Geral'
  });

  // Cadastro / Edição Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalTab, setModalTab] = useState<'dados_pessoais' | 'filiacao_formacao' | 'endereco_contato' | 'empresas_rt' | 'posicao_financeira'>('dados_pessoais');
  const [editingProfissional, setEditingProfissional] = useState<Partial<Profissional> | null>(null);
  const [profToDelete, setProfToDelete] = useState<Profissional | null>(null);
  const [isSearchingCep, setIsSearchingCep] = useState(false);

  const councilConfig = storageService.getCouncilConfig();
  const cadastrosTipos = storageService.getCadastrosBasicos('TIPO_PROFISSIONAL').filter(i => i.ativo);
  const cadastrosSituacoes = storageService.getCadastrosBasicos('SITUACAO_PROFISSIONAL').filter(i => i.ativo);
  const cadastrosHabilitacoes = storageService.getCadastrosBasicos('HABILITACAO').filter(i => i.ativo);
  const cadastrosTiposRequerimento = storageService.getCadastrosBasicos('TIPO_REQUERIMENTO_PROTOCOLO').filter(i => i.ativo);
  const cadastrosSetoresProtocolo = storageService.getCadastrosBasicos('SETOR_PROTOCOLO').filter(i => i.ativo);
  const cadastrosStatusProtocolo = storageService.getCadastrosBasicos('STATUS_PROTOCOLO').filter(i => i.ativo);
  const todasEmpresas = storageService.getEmpresas();

  // Fetch paginated professionals
  const result = storageService.getProfissionaisPaginated(page, pageSize, {
    search: searchTerm,
    situacao: situacaoFilter,
    tipoAssociado: tipoFilter,
    statusFinanceiro: statusFinFilter,
    cep: cepFilter,
    endereco: enderecoFilter,
    complemento: complementoFilter,
    habilitacao: habilitacaoFilter
  });

  // Busca conjunto completo de profissionais filtrados para exportação
  const getAllFilteredProfissionais = () => {
    return storageService.getProfissionaisPaginated(1, 10000, {
      search: searchTerm,
      situacao: situacaoFilter,
      tipoAssociado: tipoFilter,
      statusFinanceiro: statusFinFilter,
      cep: cepFilter,
      endereco: enderecoFilter,
      complemento: complementoFilter,
      habilitacao: habilitacaoFilter
    }).items;
  };

  const handleExportCSV = () => {
    const items = getAllFilteredProfissionais();
    if (!items.length) {
      toastService.warning('Sem Dados', 'Nenhum profissional encontrado para os filtros selecionados.');
      return;
    }
    const dataToExport = items.map(p => ({
      'INSCRIÇÃO': p.inscricao,
      'NOME COMPLETO': p.nome,
      'CPF': p.cpf,
      'RG': p.rg,
      'NOME DA MÃE': p.nomeMae || '',
      'NOME DO PAI': p.nomePai || '',
      'SITUAÇÃO': p.situacao,
      'TIPO DE PROFISSIONAL': p.tipoAssociado,
      'HABILITAÇÕES': p.habilitacoes && p.habilitacoes.length > 0 ? p.habilitacoes.join('; ') : '-',
      'DATA INSCRIÇÃO': p.dataInscricao,
      'FACULDADE': p.faculdade,
      'E-MAIL': p.emailPessoal,
      'TELEFONE': p.telefone,
      'CIDADE': p.cidade,
      'UF': p.uf,
      'STATUS FINANCEIRO': p.statusFinanceiro
    }));
    exportToCSV(`profissionais_conselho_${Date.now()}`, dataToExport);
    toastService.info('Exportação Excel Concluída', `${items.length} profissionais exportados para planilha Excel/CSV.`);
  };

  const handleExportPDF = () => {
    const items = getAllFilteredProfissionais();
    if (!items.length) {
      toastService.warning('Sem Dados', 'Nenhum profissional encontrado para os filtros selecionados.');
      return;
    }

    const headers = ['Inscrição', 'Nome Completo', 'CPF', 'Tipo / Categoria', 'Habilitações', 'Município/UF', 'Situação', 'Financeiro'];
    const rows: (string | number)[][] = items.map(p => [
      p.inscricao || '',
      p.nome || '',
      maskCPF(p.cpf),
      p.tipoAssociado || '',
      p.habilitacoes && p.habilitacoes.length > 0 ? p.habilitacoes.join(', ') : '-',
      `${p.cidade || '-'}/${p.uf || 'AM'}`,
      p.situacao || 'Ativo',
      p.statusFinanceiro || 'Regular'
    ]);

    exportToPDF({
      title: 'Relatório Oficial de Profissionais Cadastrados (PF)',
      subtitle: `${result.total} profissionais filtrados | Emitido pelo SISCON Cloud`,
      filename: `profissionais_filtrados_${Date.now()}`,
      headers,
      rows,
      orientation: 'landscape',
      councilName: councilConfig.nomeCompleto || 'Conselho Regional de Farmácia',
      councilUF: councilConfig.uf || 'AM'
    });
    toastService.info('Exportação PDF Concluída', `${items.length} profissionais exportados para documento PDF oficial.`);
  };

  const isCpfValid = editingProfissional?.cpf ? validateCPF(editingProfissional.cpf) : false;

  const handleOpenNewModal = () => {
    const generatedInscricao = storageService.peekNextInscricaoProfissional();
    setEditingProfissional({
      id: '',
      inscricao: generatedInscricao,
      nome: '',
      cpf: '',
      rg: '',
      orgaoExpeditor: 'SSP/AM',
      dataNascimento: '15/05/1990',
      sexo: 'F',
      nacionalidade: 'BRASILEIRA',
      naturalidade: 'MANAUS/AM',
      nomeMae: '',
      nomePai: '',
      situacao: (cadastrosSituacoes[0]?.nome as any) || 'Definitivo',
      tipoAssociado: (cadastrosTipos[0]?.nome as any) || 'Farmacêutico',
      dataInscricao: new Date().toLocaleDateString('pt-BR'),
      dataColacaoGrau: '18/12/2015',
      dataExpDiploma: '20/01/2016',
      faculdade: 'UNIVERSIDADE FEDERAL DO AMAZONAS - UFAM',
      emailPessoal: '',
      emailComercial: '',
      telefone: '',
      celular: '',
      uf: councilConfig.uf || 'AM',
      cidade: councilConfig.cidadeSede || 'MANAUS',
      cep: '',
      endereco: '',
      bairro: '',
      statusFinanceiro: 'Adimplente',
      carteiraProfissional: `CFF-${Math.floor(10000 + Math.random() * 90000)}`,
      habilitacoes: ['Farmácia Comunitária e Dispensação'],
      fotoUrl: ''
    });
    setModalTab('dados_pessoais');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (prof: Profissional) => {
    setEditingProfissional({ ...prof });
    setModalTab('dados_pessoais');
    setIsModalOpen(true);
  };

  const handleCepChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    const masked = maskCEP(raw);
    setEditingProfissional(prev => ({ ...prev, cep: masked }));
  };

  const searchCep = async (targetCep?: string) => {
    const cepToSearch = targetCep || editingProfissional?.cep;
    if (!cepToSearch) return;

    if (!validateCEP(cepToSearch)) {
      toastService.warning('CEP Inválido', 'O CEP informado deve conter 8 dígitos válidos.');
      return;
    }

    setIsSearchingCep(true);
    try {
      const address = await fetchAddressByCEP(cepToSearch);
      if (address) {
        setEditingProfissional(prev => ({
          ...prev,
          endereco: address.logradouro ? address.logradouro.toUpperCase() : prev?.endereco,
          bairro: address.bairro ? address.bairro.toUpperCase() : prev?.bairro,
          cidade: address.localidade ? address.localidade.toUpperCase() : prev?.cidade,
          uf: address.uf ? address.uf.toUpperCase() : prev?.uf
        }));
        toastService.info('Endereço Preenchido', `${address.localidade}/${address.uf} obtido via Correios.`);
      } else {
        toastService.warning('CEP Não Localizado', 'Não foi possível encontrar endereço para este CEP.');
      }
    } catch {
      toastService.warning('Erro na Busca de CEP', 'Falha ao conectar ao serviço de busca de endereço.');
    } finally {
      setIsSearchingCep(false);
    }
  };

  const handleSaveProfissional = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProfissional) return;

    if (!editingProfissional.nome?.trim()) {
      toastService.warning('Nome Obrigatório', 'Por favor preencha o nome completo do profissional.');
      return;
    }

    if (!editingProfissional.cpf || !validateCPF(editingProfissional.cpf)) {
      toastService.warning('CPF Inválido', 'O CPF informado é inválido. Corrija para prosseguir.');
      return;
    }

    const isNew = !editingProfissional.id;
    const finalInscricao = isNew 
      ? storageService.getNextInscricaoProfissional(true)
      : editingProfissional.inscricao!;

    const rawProfissional: Profissional = {
      id: editingProfissional.id || `prof-custom-${Date.now()}`,
      inscricao: finalInscricao,
      nome: editingProfissional.nome.trim(),
      cpf: editingProfissional.cpf.replace(/\D/g, ''),
      rg: editingProfissional.rg || '',
      orgaoExpeditor: editingProfissional.orgaoExpeditor || 'SSP/AM',
      dataNascimento: editingProfissional.dataNascimento || '',
      sexo: editingProfissional.sexo || 'M',
      nacionalidade: editingProfissional.nacionalidade || 'BRASILEIRA',
      naturalidade: editingProfissional.naturalidade || 'MANAUS/AM',
      nomeMae: editingProfissional.nomeMae?.trim() || '',
      nomePai: editingProfissional.nomePai?.trim() || '',
      situacao: editingProfissional.situacao || 'Definitivo',
      tipoAssociado: editingProfissional.tipoAssociado || 'Farmacêutico',
      dataInscricao: editingProfissional.dataInscricao || new Date().toLocaleDateString('pt-BR'),
      dataColacaoGrau: editingProfissional.dataColacaoGrau || '',
      dataExpDiploma: editingProfissional.dataExpDiploma || '',
      faculdade: editingProfissional.faculdade || '',
      emailPessoal: editingProfissional.emailPessoal || '',
      emailComercial: editingProfissional.emailComercial || '',
      telefone: editingProfissional.telefone || '',
      celular: editingProfissional.celular || editingProfissional.telefone || '',
      uf: editingProfissional.uf || 'AM',
      cidade: editingProfissional.cidade || 'MANAUS',
      cep: editingProfissional.cep || '',
      endereco: editingProfissional.endereco || '',
      complemento: editingProfissional.complemento || '',
      bairro: editingProfissional.bairro || '',
      statusFinanceiro: editingProfissional.statusFinanceiro || 'Adimplente',
      carteiraProfissional: editingProfissional.carteiraProfissional || '',
      habilitacoes: editingProfissional.habilitacoes || [],
      fotoUrl: editingProfissional.fotoUrl || '',
      observacoes: editingProfissional.observacoes || ''
    };

    const finalProf = sanitizeToUpper(rawProfissional, ['id', 'fotoUrl', 'emailPessoal', 'emailComercial']);
    storageService.saveProfissional(finalProf);
    setIsModalOpen(false);
    setEditingProfissional(null);

    toastService.success(
      isNew ? 'Profissional Cadastrado' : 'Cadastro Atualizado',
      `${finalProf.nome} (${finalProf.inscricao}) foi salvo com sucesso no banco de dados.`
    );
  };

  const handleConfirmDelete = () => {
    if (!profToDelete) return;
    storageService.deleteProfissional(profToDelete.id);
    toastService.delete(
      'Cadastro Excluído',
      `O cadastro de ${profToDelete.nome} (${profToDelete.inscricao}) foi removido do sistema.`
    );
    setProfToDelete(null);
  };

  // Helper para obter vínculos de RT do profissional
  const getEmpresasVinculadas = (prof: Profissional | Partial<Profissional> | null) => {
    if (!prof) return [];
    const profId = prof.id || '';
    const profInscricao = prof.inscricao || '';
    const profNome = prof.nome?.toUpperCase().trim() || '';
    const vinculadas: Array<{ empresa: Empresa; vinculo: any }> = [];

    todasEmpresas.forEach(emp => {
      if (emp.responsaveisTecnicos) {
        emp.responsaveisTecnicos.forEach(rt => {
          const matchId = profId && rt.profissionalId === profId;
          const matchInscricao = profInscricao && rt.profissionalInscricao === profInscricao;
          const matchNome = profNome && rt.profissionalNome?.toUpperCase().trim() === profNome;
          if (matchId || matchInscricao || matchNome) {
            vinculadas.push({ empresa: emp, vinculo: rt });
          }
        });
      }
    });
    return vinculadas;
  };

  // Helper para obter protocolos do profissional
  const getProtocolosProfissional = (prof: Profissional | null): ProtocoloProcesso[] => {
    if (!prof) return [];
    const all = storageService.getProtocolos();
    const profCpf = prof.cpf?.replace(/\D/g, '') || '';
    const profNome = prof.nome?.toUpperCase().trim() || '';

    return all.filter(p => {
      const pDoc = p.documentoInteressado?.replace(/\D/g, '') || '';
      const pNome = p.interessado?.toUpperCase().trim() || '';
      return (profCpf && pDoc === profCpf) || (profNome && pNome === profNome) || (profNome && pNome.includes(profNome));
    });
  };

  // Helper para calcular débitos financeiros
  const getPosicaoFinanceira = (prof: Profissional | Partial<Profissional> | null) => {
    if (!prof) return { totalAberto: 0, lancamentos: [], valorTotalAberto: 0 };
    const profCpf = prof.cpf?.replace(/\D/g, '') || '';
    const allLancamentos = storageService.getLancamentos();
    const filtered = allLancamentos.filter(l => l.targetDoc?.replace(/\D/g, '') === profCpf || l.targetId === prof.id);
    const abertos = filtered.filter(l => l.status !== 'Pago');
    const valorTotalAberto = abertos.reduce((acc, curr) => acc + (curr.valorTotal || 0), 0);

    return {
      lancamentos: filtered,
      totalAberto: abertos.length,
      valorTotalAberto
    };
  };

  // Handler para criação de novo protocolo
  const handleOpenNewProtocolModal = () => {
    if (!selectedProfissional) return;
    setNewProtocolForm({
      tipo: cadastrosTiposRequerimento[0]?.nome || 'Inscrição Definitiva',
      setorAtual: cadastrosSetoresProtocolo[0]?.nome || 'Secretaria Geral',
      status: cadastrosStatusProtocolo[0]?.nome || 'Em Análise',
      assunto: `REQUERIMENTO DE ${cadastrosTiposRequerimento[0]?.nome || 'INSCRIÇÃO DEFINITIVA'}`,
      conselheiroRelator: '',
      prazoDias: 15
    });
    setIsNewProtocolModalOpen(true);
  };

  const handleSaveNewProtocol = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProfissional) return;

    const ano = new Date().getFullYear();
    const sequencial = Math.floor(1000 + Math.random() * 9000);
    const numeroProtocolo = `${ano}.${sequencial}/CRF-AM`;
    const dataAtual = new Date().toLocaleDateString('pt-BR');
    const dataHoraAtual = `${dataAtual} ${new Date().toLocaleTimeString('pt-BR').slice(0, 5)}`;
    const prazoResp = new Date(Date.now() + (newProtocolForm.prazoDias || 15) * 86400000).toLocaleDateString('pt-BR');

    const novoProt: ProtocoloProcesso = {
      id: `prot-${Date.now()}`,
      numeroProtocolo,
      tipo: newProtocolForm.tipo,
      interessado: selectedProfissional.nome,
      documentoInteressado: selectedProfissional.cpf,
      dataInscricao: selectedProfissional.dataInscricao,
      dataAbertura: dataAtual,
      dataUltimaAtualizacao: dataAtual,
      prazoResposta: prazoResp,
      status: newProtocolForm.status as any,
      setorAtual: newProtocolForm.setorAtual,
      conselheiroRelator: newProtocolForm.conselheiroRelator ? newProtocolForm.conselheiroRelator.toUpperCase() : undefined,
      anexos: [],
      historico: [
        {
          data: dataHoraAtual,
          setor: newProtocolForm.setorAtual,
          descricao: `Abertura de Protocolo: ${newProtocolForm.assunto.toUpperCase()}`,
          responsavel: 'Atendimento ao Profissional'
        }
      ]
    };

    storageService.saveProtocolo(novoProt);
    setIsNewProtocolModalOpen(false);
    toastService.success(
      'Protocolo Aberto',
      `Protocolo nº ${numeroProtocolo} registrado com sucesso para ${selectedProfissional.nome}.`
    );
  };

  // Handler para adicionar ação / tramitação a um protocolo
  const handleOpenAddActionModal = (prot: ProtocoloProcesso) => {
    setProtocolToAddAction(prot);
    setNewActionForm({
      setor: prot.setorAtual || (cadastrosSetoresProtocolo[0]?.nome || 'Secretaria Geral'),
      descricao: '',
      responsavel: 'Secretaria Geral'
    });
  };

  const handleSaveAction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!protocolToAddAction || !newActionForm.descricao.trim()) {
      toastService.warning('Descrição Obrigatória', 'Informe o despacho ou ação realizada.');
      return;
    }

    const dataHoraAtual = `${new Date().toLocaleDateString('pt-BR')} ${new Date().toLocaleTimeString('pt-BR').slice(0, 5)}`;
    const updatedProt: ProtocoloProcesso = {
      ...protocolToAddAction,
      setorAtual: newActionForm.setor || protocolToAddAction.setorAtual,
      dataUltimaAtualizacao: new Date().toLocaleDateString('pt-BR'),
      historico: [
        ...(protocolToAddAction.historico || []),
        {
          data: dataHoraAtual,
          setor: newActionForm.setor.toUpperCase(),
          descricao: newActionForm.descricao.trim().toUpperCase(),
          responsavel: newActionForm.responsavel.trim().toUpperCase()
        }
      ]
    };

    storageService.saveProtocolo(updatedProt);
    setProtocolToAddAction(null);
    toastService.success(
      'Ação Registrada',
      `Nova tramitação registrada no protocolo nº ${protocolToAddAction.numeroProtocolo}.`
    );
  };

  // Handler para editar protocolo existente
  const handleOpenEditProtocolModal = (prot: ProtocoloProcesso) => {
    setProtocolToEdit({ ...prot });
  };

  const handleSaveEditProtocol = (e: React.FormEvent) => {
    e.preventDefault();
    if (!protocolToEdit) return;

    const dataHoraAtual = `${new Date().toLocaleDateString('pt-BR')} ${new Date().toLocaleTimeString('pt-BR').slice(0, 5)}`;
    const updatedProt: ProtocoloProcesso = {
      ...protocolToEdit,
      dataUltimaAtualizacao: new Date().toLocaleDateString('pt-BR'),
      historico: [
        ...(protocolToEdit.historico || []),
        {
          data: dataHoraAtual,
          setor: protocolToEdit.setorAtual,
          descricao: `Atualização de cadastro/status do protocolo para "${protocolToEdit.status}" no setor ${protocolToEdit.setorAtual}.`,
          responsavel: 'Administração do Sistema'
        }
      ]
    };

    storageService.saveProtocolo(updatedProt);
    setProtocolToEdit(null);
    toastService.success(
      'Protocolo Atualizado',
      `O protocolo nº ${protocolToEdit.numeroProtocolo} foi atualizado com sucesso.`
    );
  };

  const empresasVinculadas = getEmpresasVinculadas(selectedProfissional || editingProfissional);
  const posicaoFin = getPosicaoFinanceira(selectedProfissional || editingProfissional);
  const protocolosDoProfissional = selectedProfissional ? getProtocolosProfissional(selectedProfissional) : [];

  return (
    <div className="space-y-6">
      {/* Header View */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white border border-slate-200 p-5 rounded-2xl shadow-xs">
        <div className="flex items-center space-x-3.5">
          <div className="w-12 h-12 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600 shadow-xs shrink-0">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                CADASTRO DE PROFISSIONAIS (PF)
              </h1>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-purple-50 text-purple-700 font-semibold border border-purple-200">
                {councilConfig.sigla || 'CRF-AM'}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Gestão de farmacêuticos e técnicos, habilitações averbadas, protocolos e vínculos de RT.
            </p>
          </div>
        </div>

        <div className="flex items-center flex-wrap gap-2">
          <button
            onClick={handleExportCSV}
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-white border border-slate-300 hover:bg-emerald-50 hover:border-emerald-300 text-slate-700 hover:text-emerald-800 font-bold text-xs transition-all uppercase shadow-2xs cursor-pointer"
            title="Exportar profissionais filtrados para planilha Excel/CSV"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>EXPORTAR EXCEL</span>
          </button>
          <button
            onClick={handleExportPDF}
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-white border border-slate-300 hover:bg-rose-50 hover:border-rose-300 text-slate-700 hover:text-rose-800 font-bold text-xs transition-all uppercase shadow-2xs cursor-pointer"
            title="Exportar profissionais filtrados para documento PDF Oficial"
          >
            <FileText className="w-4 h-4 text-rose-600" />
            <span>EXPORTAR PDF</span>
          </button>
          <button
            onClick={handleOpenNewModal}
            className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-md shadow-purple-500/20 transition-all uppercase cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>NOVO PROFISSIONAL</span>
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-xs space-y-3 text-xs">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3">
          <div className="sm:col-span-2 lg:col-span-4 relative min-w-0">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="PESQUISAR NOME, CPF, INSCRIÇÃO..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(1);
              }}
              className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 transition-all uppercase text-xs font-medium"
            />
          </div>

          <div className="sm:col-span-1 lg:col-span-3 min-w-0">
            <select
              value={tipoFilter}
              onChange={(e) => {
                setTipoFilter(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-semibold uppercase focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-purple-500/20 text-xs"
            >
              <option value="Todos">TIPO: TODOS</option>
              {cadastrosTipos.map(t => (
                <option key={t.id} value={t.nome}>{t.nome}</option>
              ))}
            </select>
          </div>

          <div className="sm:col-span-1 lg:col-span-2 min-w-0">
            <select
              value={situacaoFilter}
              onChange={(e) => {
                setSituacaoFilter(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-semibold uppercase focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-purple-500/20 text-xs"
            >
              <option value="Todos">SITUAÇÃO: TODAS</option>
              {cadastrosSituacoes.map(s => (
                <option key={s.id} value={s.nome}>{s.nome}</option>
              ))}
            </select>
          </div>

          <div className="sm:col-span-2 lg:col-span-3 flex items-center space-x-2 min-w-0">
            <select
              value={statusFinFilter}
              onChange={(e) => {
                setStatusFinFilter(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-semibold uppercase focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-purple-500/20 text-xs"
            >
              <option value="Todos">FINANCEIRO: TODOS</option>
              <option value="Adimplente">ADIMPLENTE</option>
              <option value="Inadimplente">INADIMPLENTE</option>
              <option value="Isento">ISENTO</option>
              <option value="Parcelamento">PARCELAMENTO</option>
            </select>
            <button
              onClick={handleClearFilters}
              className="px-3 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs uppercase transition-colors shrink-0 cursor-pointer"
              title="Limpar todos os filtros"
            >
              Limpar
            </button>
          </div>
        </div>

        {/* Linha 2 de Filtros Avançados: CEP, Endereço, Habilitação */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-100 text-xs">
          <input
            type="text"
            placeholder="FILTRAR POR CEP..."
            value={cepFilter}
            onChange={(e) => {
              setCepFilter(e.target.value);
              setPage(1);
            }}
            className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-xl uppercase font-medium"
          />
          <input
            type="text"
            placeholder="ENDEREÇO / BAIRRO..."
            value={enderecoFilter}
            onChange={(e) => {
              setEnderecoFilter(e.target.value);
              setPage(1);
            }}
            className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-xl uppercase font-medium"
          />
          <select
            value={habilitacaoFilter}
            onChange={(e) => {
              setHabilitacaoFilter(e.target.value);
              setPage(1);
            }}
            className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-semibold uppercase text-xs"
          >
            <option value="Todos">HABILITAÇÃO: TODAS</option>
            {cadastrosHabilitacoes.map(h => (
              <option key={h.id} value={h.nome}>{h.nome}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Barra Informativa de Profissionais Filtrados */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center flex-wrap gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-50 border border-purple-200 text-purple-800 text-xs font-bold uppercase tracking-wide shadow-2xs">
            <Users className="w-3.5 h-3.5 text-purple-600" />
            <span>{result.total} profissionais filtrados</span>
          </span>
          <span className="text-xs text-slate-500 font-medium">
            (exibindo {result.items.length} de {result.total} registros • página {result.page} de {result.totalPages || 1})
          </span>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                <th className="py-3.5 px-4">INSCRIÇÃO / FOTO</th>
                <th className="py-3.5 px-4">PROFISSIONAL / CPF</th>
                <th className="py-3.5 px-4">TIPO / HABILITAÇÃO</th>
                <th className="py-3.5 px-4">CIDADE / UF</th>
                <th className="py-3.5 px-4 text-center">SITUAÇÃO</th>
                <th className="py-3.5 px-4 text-center">FINANCEIRO</th>
                <th className="py-3.5 px-4 text-right">AÇÕES</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {result.items.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <Users className="w-10 h-10 mx-auto mb-2 opacity-40" />
                    <p className="font-semibold uppercase">NENHUM PROFISSIONAL ENCONTRADO</p>
                    <p className="text-[11px] text-slate-400 mt-1 uppercase">Tente ajustar os filtros ou cadastre um novo profissional.</p>
                  </td>
                </tr>
              ) : (
                result.items.map((prof) => (
                  <tr key={prof.id} className="hover:bg-purple-50/40 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center space-x-2.5">
                        <div className="w-9 h-9 rounded-full bg-purple-100 border border-purple-200 flex items-center justify-center overflow-hidden shrink-0 font-bold text-purple-700 text-xs">
                          {prof.fotoUrl ? (
                            <img src={prof.fotoUrl} alt={prof.nome} className="w-full h-full object-cover" />
                          ) : (
                            prof.nome.substring(0, 2).toUpperCase()
                          )}
                        </div>
                        <div>
                          <div className="font-mono font-bold text-purple-800">{prof.inscricao}</div>
                          <div className="text-[10px] text-slate-400 font-mono">{prof.dataInscricao}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900 uppercase">{prof.nome}</div>
                      <div className="text-[10px] text-slate-500 font-mono">{maskCPF(prof.cpf)}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-semibold text-slate-800 uppercase">{prof.tipoAssociado}</span>
                      <div className="text-[10px] text-slate-500 uppercase truncate max-w-[200px]">
                        {prof.habilitacoes && prof.habilitacoes.length > 0 ? prof.habilitacoes[0] : prof.faculdade}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="text-slate-800 uppercase font-medium">{prof.cidade} - {prof.uf}</div>
                      <div className="text-[10px] text-slate-500 font-mono">{prof.telefone}</div>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                        prof.situacao === 'Definitivo'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : prof.situacao === 'Provisório'
                          ? 'bg-blue-50 text-blue-700 border border-blue-200'
                          : prof.situacao === 'Suspenso'
                          ? 'bg-rose-50 text-rose-700 border border-rose-200'
                          : 'bg-slate-100 text-slate-700 border border-slate-200'
                      }`}>
                        {prof.situacao}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                        prof.statusFinanceiro === 'Adimplente'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : prof.statusFinanceiro === 'Inadimplente'
                          ? 'bg-rose-50 text-rose-700 border border-rose-200'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}>
                        {prof.statusFinanceiro}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end space-x-1.5">
                        <button
                          onClick={() => {
                            setSelectedProfissional(prof);
                            setViewDetailsTab('dados_gerais');
                          }}
                          title="Visualizar Cadastro"
                          aria-label="Visualizar Cadastro"
                          className="p-1.5 rounded-lg bg-slate-100 hover:bg-purple-100 text-purple-700 border border-slate-200 hover:border-purple-300 transition-colors cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleOpenEditModal(prof)}
                          title="EDITAR CADASTRO"
                          className="p-1.5 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 transition-colors cursor-pointer"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setProfToDelete(prof)}
                          title="EXCLUIR CADASTRO"
                          className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="p-3.5 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600 uppercase font-medium">
          <div>
            PÁGINA <span className="font-bold text-slate-900">{result.page}</span> DE <span className="font-bold text-slate-900">{result.totalPages}</span> ({result.total.toLocaleString('pt-BR')} REGISTROS)
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="flex items-center space-x-1 px-3 py-1.5 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed text-slate-700 font-bold transition-colors uppercase cursor-pointer"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>ANTERIOR</span>
            </button>
            <button
              onClick={() => setPage(p => Math.min(result.totalPages, p + 1))}
              disabled={page >= result.totalPages}
              className="flex items-center space-x-1 px-3 py-1.5 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed text-slate-700 font-bold transition-colors uppercase cursor-pointer"
            >
              <span>PRÓXIMA</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODAL: VISUALIZAR CADASTRO (COM MÓDULO INTEGRADO DE PROTOCOLOS)           */}
      {/* ========================================================================= */}
      {selectedProfissional && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-4xl w-full my-6 max-h-[92vh] overflow-y-auto shadow-2xl p-4 sm:p-6 text-xs space-y-4 animate-in fade-in zoom-in duration-150">
            {/* Header do Cadastro */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-100 pb-4">
              <div className="flex items-center space-x-3.5">
                <div className="w-14 h-14 rounded-2xl bg-purple-100 border border-purple-200 flex items-center justify-center overflow-hidden shrink-0 font-bold text-purple-700 text-base shadow-xs">
                  {selectedProfissional.fotoUrl ? (
                    <img src={selectedProfissional.fotoUrl} alt={selectedProfissional.nome} className="w-full h-full object-cover" />
                  ) : (
                    selectedProfissional.nome.substring(0, 2).toUpperCase()
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-bold text-slate-900 uppercase tracking-tight">{selectedProfissional.nome}</h2>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200 uppercase">
                      {selectedProfissional.situacao}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-slate-500 font-medium uppercase text-xs mt-0.5">
                    <span className="font-mono font-bold text-purple-800 bg-purple-50 px-2 py-0.5 rounded-md border border-purple-200">
                      INSCRIÇÃO: {selectedProfissional.inscricao}
                    </span>
                    <span>•</span>
                    <span className="text-slate-700 font-bold">{selectedProfissional.tipoAssociado}</span>
                    <span>•</span>
                    <span className="font-mono text-slate-600">CPF: {maskCPF(selectedProfissional.cpf)}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-2 self-end sm:self-auto">
                <button
                  onClick={() => {
                    const toEdit = selectedProfissional;
                    setSelectedProfissional(null);
                    handleOpenEditModal(toEdit);
                  }}
                  className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-purple-50 text-purple-700 border border-purple-200 font-bold hover:bg-purple-100 uppercase cursor-pointer"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>EDITAR CADASTRO</span>
                </button>
                <button
                  onClick={() => setSelectedProfissional(null)}
                  className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
                  title="Fechar"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Abas Internas de "Visualizar Cadastro" */}
            <div className="flex border-b border-slate-200 gap-2 overflow-x-auto pb-1">
              <button
                type="button"
                onClick={() => setViewDetailsTab('dados_gerais')}
                className={`flex items-center space-x-1.5 px-4 py-2.5 rounded-xl font-bold text-xs uppercase transition-all cursor-pointer ${
                  viewDetailsTab === 'dados_gerais'
                    ? 'bg-purple-600 text-white shadow-md shadow-purple-500/25'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <UserCheck className="w-4 h-4" />
                <span>DADOS GERAIS & FORMAÇÃO</span>
              </button>

              <button
                type="button"
                onClick={() => setViewDetailsTab('protocolos')}
                className={`flex items-center space-x-1.5 px-4 py-2.5 rounded-xl font-bold text-xs uppercase transition-all cursor-pointer ${
                  viewDetailsTab === 'protocolos'
                    ? 'bg-purple-600 text-white shadow-md shadow-purple-500/25'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <FileText className="w-4 h-4" />
                <span>PROTOCOLOS & PROCESSOS</span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold ${
                  viewDetailsTab === 'protocolos' ? 'bg-white/20 text-white' : 'bg-purple-100 text-purple-800'
                }`}>
                  {protocolosDoProfissional.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setViewDetailsTab('empresas')}
                className={`flex items-center space-x-1.5 px-4 py-2.5 rounded-xl font-bold text-xs uppercase transition-all cursor-pointer ${
                  viewDetailsTab === 'empresas'
                    ? 'bg-purple-600 text-white shadow-md shadow-purple-500/25'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Building2 className="w-4 h-4" />
                <span>EMPRESAS VINCULADAS (RT)</span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold ${
                  viewDetailsTab === 'empresas' ? 'bg-white/20 text-white' : 'bg-blue-100 text-blue-800'
                }`}>
                  {empresasVinculadas.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setViewDetailsTab('financeiro')}
                className={`flex items-center space-x-1.5 px-4 py-2.5 rounded-xl font-bold text-xs uppercase transition-all cursor-pointer ${
                  viewDetailsTab === 'financeiro'
                    ? 'bg-purple-600 text-white shadow-md shadow-purple-500/25'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <DollarSign className="w-4 h-4" />
                <span>FINANCEIRO</span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                  posicaoFin.valorTotalAberto > 0 ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-800'
                }`}>
                  {posicaoFin.valorTotalAberto > 0 ? `R$ ${posicaoFin.valorTotalAberto.toFixed(2)}` : 'REGULAR'}
                </span>
              </button>
            </div>

            {/* CONTEÚDO DA ABA 1: DADOS GERAIS */}
            {viewDetailsTab === 'dados_gerais' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  {/* Dados Pessoais & Filiação */}
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2 uppercase">
                    <div className="font-bold text-purple-900 uppercase text-xs pb-2 border-b border-slate-200 flex items-center space-x-1.5">
                      <UserCheck className="w-4 h-4 text-purple-600" />
                      <span>DADOS PESSOAIS & FILIAÇÃO</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div><span className="text-slate-400 block text-[10px]">CPF:</span> <strong className="text-slate-800 font-mono">{maskCPF(selectedProfissional.cpf)}</strong></div>
                      <div><span className="text-slate-400 block text-[10px]">RG / ÓRGÃO:</span> <span className="text-slate-800 font-mono">{selectedProfissional.rg || '-'} ({selectedProfissional.orgaoExpeditor || 'SSP'})</span></div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div><span className="text-slate-400 block text-[10px]">NASCIMENTO:</span> <span className="text-slate-800 font-mono">{selectedProfissional.dataNascimento || '-'}</span></div>
                      <div><span className="text-slate-400 block text-[10px]">NATURALIDADE:</span> <span className="text-slate-800">{selectedProfissional.naturalidade || '-'}</span></div>
                    </div>
                    <div><span className="text-slate-400 block text-[10px]">NOME DA MÃE:</span> <strong className="text-slate-800">{selectedProfissional.nomeMae || 'NÃO INFORMADO'}</strong></div>
                    <div><span className="text-slate-400 block text-[10px]">NOME DO PAI:</span> <span className="text-slate-800">{selectedProfissional.nomePai || 'NÃO INFORMADO'}</span></div>
                    <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-slate-200/60">
                      <div><span className="text-slate-400 block text-[10px]">TELEFONE:</span> <span className="text-slate-800 font-mono">{selectedProfissional.telefone || '-'}</span></div>
                      <div><span className="text-slate-400 block text-[10px]">E-MAIL:</span> <span className="text-slate-800 lowercase font-mono truncate block">{selectedProfissional.emailPessoal || '-'}</span></div>
                    </div>
                  </div>

                  {/* Formação & Registro */}
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2 uppercase">
                    <div className="font-bold text-purple-900 uppercase text-xs pb-2 border-b border-slate-200 flex items-center space-x-1.5">
                      <GraduationCap className="w-4 h-4 text-purple-600" />
                      <span>FORMAÇÃO & HABILITAÇÃO</span>
                    </div>
                    <div><span className="text-slate-400 block text-[10px]">FACULDADE / INSTITUIÇÃO:</span> <strong className="text-slate-800">{selectedProfissional.faculdade || '-'}</strong></div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div><span className="text-slate-400 block text-[10px]">COLAÇÃO DE GRAU:</span> <span className="text-slate-800 font-mono">{selectedProfissional.dataColacaoGrau || '-'}</span></div>
                      <div><span className="text-slate-400 block text-[10px]">EXPEDIÇÃO DIPLOMA:</span> <span className="text-slate-800 font-mono">{selectedProfissional.dataExpDiploma || '-'}</span></div>
                    </div>
                    <div><span className="text-slate-400 block text-[10px]">CARTEIRA PROFISSIONAL (CFF):</span> <span className="text-slate-800 font-mono font-bold">{selectedProfissional.carteiraProfissional || '-'}</span></div>
                    <div>
                      <span className="text-slate-400 block text-[10px] mb-1">HABILITAÇÕES AVERBADAS:</span>
                      <div className="flex flex-wrap gap-1">
                        {selectedProfissional.habilitacoes && selectedProfissional.habilitacoes.length > 0 ? (
                          selectedProfissional.habilitacoes.map((h, i) => (
                            <span key={i} className="px-2 py-0.5 bg-purple-100 text-purple-800 rounded-md font-bold text-[10px]">
                              {h}
                            </span>
                          ))
                        ) : (
                          <span className="text-slate-500 italic text-[10px]">NENHUMA HABILITAÇÃO ESPECÍFICA AVERBADA</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Endereço Residencial */}
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2 uppercase text-xs">
                  <div className="font-bold text-purple-900 uppercase text-xs pb-2 border-b border-slate-200 flex items-center space-x-1.5">
                    <MapPin className="w-4 h-4 text-purple-600" />
                    <span>ENDEREÇO RESIDENCIAL</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <span className="text-slate-400 block text-[10px]">LOGRADOURO:</span>
                      <strong className="text-slate-800">{selectedProfissional.endereco || '-'}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">COMPLEMENTO / BAIRRO:</span>
                      <span className="text-slate-800">{selectedProfissional.complemento ? `${selectedProfissional.complemento}, ` : ''}{selectedProfissional.bairro || '-'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">CIDADE / UF / CEP:</span>
                      <span className="text-slate-800">{selectedProfissional.cidade}/{selectedProfissional.uf} (CEP: {selectedProfissional.cep || '-'})</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* CONTEÚDO DA ABA 2: PROTOCOLOS & PROCESSOS (MÓDULO COMPLETO) */}
            {viewDetailsTab === 'protocolos' && (
              <div className="space-y-4">
                {/* Header dos Protocolos com botão Novo Protocolo */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 bg-indigo-50/70 border border-indigo-200 rounded-2xl">
                  <div>
                    <span className="font-extrabold text-indigo-950 uppercase text-xs flex items-center gap-1.5">
                      <FileText className="w-4 h-4 text-indigo-600" />
                      <span>PROTOCOLOS & PROCESSOS DO PROFISSIONAL</span>
                    </span>
                    <p className="text-[11px] text-indigo-800 mt-0.5">
                      Todos os requerimentos, petições e processos abertos em nome de <strong className="uppercase">{selectedProfissional.nome}</strong>.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleOpenNewProtocolModal}
                    className="flex items-center space-x-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs uppercase shadow-md shadow-indigo-500/20 transition-all shrink-0 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>INCLUIR NOVO PROTOCOLO</span>
                  </button>
                </div>

                {protocolosDoProfissional.length === 0 ? (
                  <div className="p-10 text-center bg-slate-50 border border-slate-200 rounded-2xl">
                    <FileText className="w-10 h-10 text-slate-400 mx-auto mb-2 opacity-50" />
                    <p className="font-bold text-slate-700 uppercase text-xs">Nenhum protocolo ou processo registrado</p>
                    <p className="text-[11px] text-slate-400 mt-1 uppercase">
                      Clique no botão "Incluir Novo Protocolo" acima para abrir um requerimento para este profissional.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {protocolosDoProfissional.map((prot) => (
                      <div key={prot.id} className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-3 transition-all hover:border-indigo-300">
                        {/* Top Protocol Row */}
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-100 pb-3">
                          <div className="flex items-center space-x-3">
                            <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 font-bold shrink-0">
                              <FileText className="w-4 h-4" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-mono font-bold text-indigo-700 text-xs">{prot.numeroProtocolo}</span>
                                <span className="font-bold text-slate-900 uppercase text-xs">• {prot.tipo}</span>
                              </div>
                              <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                                ABERTURA: {prot.dataAbertura} {prot.prazoResposta ? `| PRAZO: ${prot.prazoResposta}` : ''} | SETOR: <strong className="text-slate-700 uppercase">{prot.setorAtual}</strong>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center space-x-2">
                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                              prot.status === 'Deferido / Aprovado' || prot.status === 'Concluído'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : prot.status === 'Indeferido'
                                ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                : prot.status === 'Aguardando Documentação'
                                ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                : 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                            }`}>
                              {prot.status}
                            </span>

                            <button
                              type="button"
                              onClick={() => handleOpenAddActionModal(prot)}
                              className="flex items-center space-x-1 px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg font-bold text-[10px] uppercase transition-colors cursor-pointer"
                              title="Incluir despacho ou tramitação"
                            >
                              <Send className="w-3 h-3" />
                              <span>INCLUIR AÇÃO</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleOpenEditProtocolModal(prot)}
                              className="p-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
                              title="Alterar dados do protocolo"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Relator e Pareceres (se houver) */}
                        {(prot.conselheiroRelator || prot.parecerRelator || prot.decisaoPlenario) && (
                          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 text-xs space-y-1.5">
                            {prot.conselheiroRelator && (
                              <div>
                                <span className="text-slate-400 uppercase text-[10px] font-bold">Conselheiro Relator: </span>
                                <strong className="text-slate-800 uppercase">{prot.conselheiroRelator}</strong>
                              </div>
                            )}
                            {prot.parecerRelator && (
                              <div>
                                <span className="text-slate-400 uppercase text-[10px] font-bold">Parecer Técnico/Relatoria: </span>
                                <span className="text-slate-700 uppercase">{prot.parecerRelator}</span>
                              </div>
                            )}
                            {prot.decisaoPlenario && (
                              <div>
                                <span className="text-slate-400 uppercase text-[10px] font-bold">Decisão de Plenário: </span>
                                <span className="text-slate-900 font-bold uppercase">{prot.decisaoPlenario}</span>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Histórico de Ações / Tramitações */}
                        <div className="space-y-1.5 pt-1">
                          <span className="font-bold text-slate-700 uppercase text-[10px] flex items-center gap-1">
                            <History className="w-3 h-3 text-slate-500" />
                            <span>Histórico de Tramitações e Ações ({prot.historico?.length || 0})</span>
                          </span>

                          {(!prot.historico || prot.historico.length === 0) ? (
                            <p className="text-slate-400 italic text-[10px] uppercase">Nenhuma ação registrada ainda.</p>
                          ) : (
                            <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                              {prot.historico.map((act, actIdx) => (
                                <div key={actIdx} className="p-2 rounded-xl bg-slate-50 border border-slate-200/80 flex items-start justify-between text-[11px]">
                                  <div className="space-y-0.5">
                                    <div className="font-bold text-slate-800 uppercase">{act.descricao}</div>
                                    <div className="text-[10px] text-slate-500 font-mono uppercase">
                                      SETOR: {act.setor} | RESPONSÁVEL: {act.responsavel}
                                    </div>
                                  </div>
                                  <span className="text-[10px] font-mono text-slate-400 shrink-0 ml-2">
                                    {act.data}
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* CONTEÚDO DA ABA 3: EMPRESAS VINCULADAS */}
            {viewDetailsTab === 'empresas' && (
              <div className="space-y-3">
                <div className="p-3.5 bg-blue-50/70 border border-blue-200 rounded-2xl flex items-center justify-between">
                  <div>
                    <span className="font-bold text-blue-950 uppercase text-xs flex items-center space-x-1.5">
                      <Building2 className="w-4 h-4 text-blue-600" />
                      <span>Empresas Vinculadas / Responsabilidade Técnica (RT)</span>
                    </span>
                    <p className="text-[11px] text-blue-800 mt-0.5">
                      Estabelecimentos onde este profissional figura como Responsável Técnico, Substituto ou Assistente.
                    </p>
                  </div>
                  <span className="text-[10px] font-mono px-2.5 py-1 bg-blue-600 text-white font-bold rounded-lg uppercase">
                    {empresasVinculadas.length} VÍNCULOS
                  </span>
                </div>

                {empresasVinculadas.length === 0 ? (
                  <div className="p-8 text-center bg-slate-50 border border-slate-200 rounded-2xl">
                    <Building2 className="w-8 h-8 text-slate-400 mx-auto mb-2 opacity-50" />
                    <p className="font-bold text-slate-700 uppercase text-xs">Nenhum Vínculo Técnico Ativo</p>
                    <p className="text-[11px] text-slate-400 mt-1 uppercase">
                      Os vínculos de responsabilidade técnica são gerenciados exclusivamente através do módulo de Cadastro de Empresas (PJ).
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {empresasVinculadas.map(({ empresa, vinculo }, idx) => (
                      <div key={idx} className="p-3.5 rounded-2xl bg-white border border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 shadow-xs">
                        <div>
                          <div className="font-bold text-slate-900 uppercase text-xs">{empresa.razaoSocial}</div>
                          <div className="text-[10px] text-slate-500 uppercase font-mono mt-0.5">
                            INSCRIÇÃO PJ: {empresa.inscricao} | CNPJ: {empresa.cnpj} | CARGO: <strong className="text-purple-700">{vinculo.cargo}</strong>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2 shrink-0">
                          <span className="text-[10px] font-bold px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-200 uppercase">
                            {vinculo.cargaHorariaSemanal}H SEMANAIS
                          </span>
                          <span className={`text-[10px] font-bold px-2.5 py-1 rounded-lg uppercase ${
                            empresa.condicao === 'Regular' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}>
                            {empresa.condicao}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* CONTEÚDO DA ABA 4: POSIÇÃO FINANCEIRA */}
            {viewDetailsTab === 'financeiro' && (
              <div className="space-y-3">
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between">
                  <div>
                    <span className="font-bold text-slate-900 uppercase text-xs flex items-center space-x-1.5">
                      <DollarSign className="w-4 h-4 text-emerald-600" />
                      <span>Situação Financeira Consolidada</span>
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono mt-0.5 block">
                      DÉBITOS EM ABERTO: R$ {posicaoFin.valorTotalAberto.toFixed(2)}
                    </span>
                  </div>
                  <span className={`text-xs px-3 py-1 rounded-full font-bold uppercase ${
                    posicaoFin.valorTotalAberto > 0 ? 'bg-rose-50 text-rose-700 border border-rose-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  }`}>
                    {posicaoFin.valorTotalAberto > 0 ? 'INADIMPLENTE' : 'ADIMPLENTE / REGULAR'}
                  </span>
                </div>

                {posicaoFin.lancamentos.length === 0 ? (
                  <div className="p-8 text-center bg-slate-50 border border-slate-200 rounded-2xl">
                    <DollarSign className="w-8 h-8 text-slate-400 mx-auto mb-2 opacity-50" />
                    <p className="font-bold text-slate-700 uppercase text-xs">Nenhum Lançamento Financeiro</p>
                    <p className="text-[11px] text-slate-400 mt-1 uppercase">
                      Não há registros de boletos, anuidades ou multas para este CPF.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-56 overflow-y-auto">
                    {posicaoFin.lancamentos.map((l) => (
                      <div key={l.id} className="p-3 rounded-xl bg-white border border-slate-200 flex items-center justify-between shadow-xs">
                        <div>
                          <span className="font-bold text-slate-800 uppercase text-xs block">{l.descricao}</span>
                          <span className="text-[10px] text-slate-500 font-mono">
                            VENCIMENTO: {l.dataVencimento} | EXERCÍCIO: {l.exercicio}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2.5">
                          <span className="font-mono font-bold text-slate-900 text-xs">R$ {l.valorTotal.toFixed(2)}</span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase ${
                            l.status === 'Pago' ? 'bg-emerald-100 text-emerald-800' : l.status === 'Vencido' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                          }`}>
                            {l.status}
                          </span>
                          {onOpenBoletoPix && l.status !== 'Pago' && (
                            <button
                              type="button"
                              onClick={() => onOpenBoletoPix(l)}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-[9px] uppercase flex items-center space-x-1 cursor-pointer"
                            >
                              <Receipt className="w-3 h-3" />
                              <span>BOLETO / PIX</span>
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Rodapé do Modal */}
            <div className="flex justify-end pt-3 border-t border-slate-100">
              <button
                onClick={() => setSelectedProfissional(null)}
                className="px-5 py-2.5 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200 uppercase transition-colors cursor-pointer"
              >
                FECHAR VISUALIZAÇÃO
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUBMODAL: INCLUIR NOVO PROTOCOLO (DENTRO DE VISUALIZAR CADASTRO)          */}
      {/* ========================================================================= */}
      {isNewProtocolModalOpen && selectedProfissional && (
        <div className="fixed inset-0 z-60 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-lg w-full shadow-2xl p-5 text-xs space-y-4 animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <span className="font-bold text-slate-900 uppercase text-xs flex items-center space-x-2">
                <FileText className="w-4 h-4 text-indigo-600" />
                <span>INCLUIR NOVO PROTOCOLO PARA O PROFISSIONAL</span>
              </span>
              <button
                type="button"
                onClick={() => setIsNewProtocolModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveNewProtocol} className="space-y-3.5">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <span className="text-[10px] text-slate-400 uppercase block font-bold">Interessado / Requerente:</span>
                <strong className="text-slate-800 uppercase block">{selectedProfissional.nome}</strong>
                <span className="text-[10px] font-mono text-slate-500">CPF: {maskCPF(selectedProfissional.cpf)} | INSCRIÇÃO: {selectedProfissional.inscricao}</span>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1 uppercase text-[10px]">
                  Tipo de Requerimento *
                </label>
                <select
                  required
                  value={newProtocolForm.tipo}
                  onChange={(e) => setNewProtocolForm(prev => ({ ...prev, tipo: e.target.value }))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-semibold uppercase focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20"
                >
                  {cadastrosTiposRequerimento.map(r => (
                    <option key={r.id} value={r.nome}>{r.nome}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1 uppercase text-[10px]">
                    Setor Inicial de Tramitação
                  </label>
                  <select
                    value={newProtocolForm.setorAtual}
                    onChange={(e) => setNewProtocolForm(prev => ({ ...prev, setorAtual: e.target.value }))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-semibold uppercase"
                  >
                    {cadastrosSetoresProtocolo.map(s => (
                      <option key={s.id} value={s.nome}>{s.nome}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1 uppercase text-[10px]">
                    Status Inicial
                  </label>
                  <select
                    value={newProtocolForm.status}
                    onChange={(e) => setNewProtocolForm(prev => ({ ...prev, status: e.target.value }))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-semibold uppercase"
                  >
                    {cadastrosStatusProtocolo.map(st => (
                      <option key={st.id} value={st.nome}>{st.nome}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1 uppercase text-[10px]">
                  Assunto / Detalhamento do Requerimento *
                </label>
                <textarea
                  required
                  rows={3}
                  value={newProtocolForm.assunto}
                  onChange={(e) => setNewProtocolForm(prev => ({ ...prev, assunto: e.target.value.toUpperCase() }))}
                  placeholder="EX: SOLICITAÇÃO DE CERTIDÃO DE REGULARIDADE TÉCNICA OU AVERBAÇÃO DE ESPECIALIDADE..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 uppercase focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1 uppercase text-[10px]">
                    Conselheiro Relator (Opcional)
                  </label>
                  <input
                    type="text"
                    value={newProtocolForm.conselheiroRelator}
                    onChange={(e) => setNewProtocolForm(prev => ({ ...prev, conselheiroRelator: e.target.value.toUpperCase() }))}
                    placeholder="DR. CONSELHEIRO..."
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 uppercase"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1 uppercase text-[10px]">
                    Prazo de Resposta (Dias)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={120}
                    value={newProtocolForm.prazoDias}
                    onChange={(e) => setNewProtocolForm(prev => ({ ...prev, prazoDias: parseInt(e.target.value, 10) || 15 }))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-mono font-bold"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsNewProtocolModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold uppercase cursor-pointer"
                >
                  CANCELAR
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold uppercase shadow-sm cursor-pointer"
                >
                  GERAR PROTOCOLO
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUBMODAL: INCLUIR AÇÃO / TRAMITAÇÃO EM UM PROTOCOLO                       */}
      {/* ========================================================================= */}
      {protocolToAddAction && (
        <div className="fixed inset-0 z-60 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full shadow-2xl p-5 text-xs space-y-4 animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <span className="font-bold text-slate-900 uppercase text-xs flex items-center space-x-2">
                <Send className="w-4 h-4 text-indigo-600" />
                <span>INCLUIR AÇÃO / TRAMITAÇÃO</span>
              </span>
              <button
                type="button"
                onClick={() => setProtocolToAddAction(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveAction} className="space-y-3.5">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <span className="text-[10px] text-slate-400 uppercase block font-bold">Protocolo Selecionado:</span>
                <strong className="text-indigo-700 font-mono text-xs block">{protocolToAddAction.numeroProtocolo}</strong>
                <span className="text-[10px] uppercase text-slate-600">{protocolToAddAction.tipo}</span>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1 uppercase text-[10px]">
                  Setor de Destino / Despacho
                </label>
                <select
                  value={newActionForm.setor}
                  onChange={(e) => setNewActionForm(prev => ({ ...prev, setor: e.target.value }))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-semibold uppercase"
                >
                  {cadastrosSetoresProtocolo.map(s => (
                    <option key={s.id} value={s.nome}>{s.nome}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1 uppercase text-[10px]">
                  Descrição da Ação / Despacho / Parecer *
                </label>
                <textarea
                  required
                  rows={4}
                  value={newActionForm.descricao}
                  onChange={(e) => setNewActionForm(prev => ({ ...prev, descricao: e.target.value.toUpperCase() }))}
                  placeholder="EX: DOCUMENTAÇÃO CONFERIDA E APROVADA. ENCAMINHADO PARA ASSINATURA DA DIRETORIA..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 uppercase focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1 uppercase text-[10px]">
                  Servidor / Responsável pela Ação
                </label>
                <input
                  type="text"
                  value={newActionForm.responsavel}
                  onChange={(e) => setNewActionForm(prev => ({ ...prev, responsavel: e.target.value.toUpperCase() }))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 uppercase"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setProtocolToAddAction(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold uppercase cursor-pointer"
                >
                  CANCELAR
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold uppercase shadow-sm cursor-pointer"
                >
                  REGISTRAR AÇÃO
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUBMODAL: ALTERAR PROTOCOLO                                               */}
      {/* ========================================================================= */}
      {protocolToEdit && (
        <div className="fixed inset-0 z-60 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-lg w-full shadow-2xl p-5 text-xs space-y-4 animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <span className="font-bold text-slate-900 uppercase text-xs flex items-center space-x-2">
                <Edit3 className="w-4 h-4 text-indigo-600" />
                <span>ALTERAR DADOS DO PROTOCOLO</span>
              </span>
              <button
                type="button"
                onClick={() => setProtocolToEdit(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEditProtocol} className="space-y-3.5">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase block font-bold">Número do Protocolo:</span>
                  <strong className="text-indigo-700 font-mono text-xs">{protocolToEdit.numeroProtocolo}</strong>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 uppercase block font-bold">Abertura:</span>
                  <span className="text-slate-700 font-mono">{protocolToEdit.dataAbertura}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1 uppercase text-[10px]">
                    Status do Protocolo
                  </label>
                  <select
                    value={protocolToEdit.status}
                    onChange={(e) => setProtocolToEdit(prev => prev ? ({ ...prev, status: e.target.value as any }) : null)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-semibold uppercase"
                  >
                    {cadastrosStatusProtocolo.map(st => (
                      <option key={st.id} value={st.nome}>{st.nome}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1 uppercase text-[10px]">
                    Setor Atual
                  </label>
                  <select
                    value={protocolToEdit.setorAtual}
                    onChange={(e) => setProtocolToEdit(prev => prev ? ({ ...prev, setorAtual: e.target.value }) : null)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-semibold uppercase"
                  >
                    {cadastrosSetoresProtocolo.map(s => (
                      <option key={s.id} value={s.nome}>{s.nome}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1 uppercase text-[10px]">
                  Conselheiro Relator (Se distribuído)
                </label>
                <input
                  type="text"
                  value={protocolToEdit.conselheiroRelator || ''}
                  onChange={(e) => setProtocolToEdit(prev => prev ? ({ ...prev, conselheiroRelator: e.target.value.toUpperCase() }) : null)}
                  placeholder="NOME DO CONSELHEIRO RELATOR"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 uppercase"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1 uppercase text-[10px]">
                  Parecer Técnico do Relator
                </label>
                <textarea
                  rows={2}
                  value={protocolToEdit.parecerRelator || ''}
                  onChange={(e) => setProtocolToEdit(prev => prev ? ({ ...prev, parecerRelator: e.target.value.toUpperCase() }) : null)}
                  placeholder="PARECER CONCLUSIVO DO RELATOR..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 uppercase"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1 uppercase text-[10px]">
                  Decisão de Plenário / Homologação
                </label>
                <input
                  type="text"
                  value={protocolToEdit.decisaoPlenario || ''}
                  onChange={(e) => setProtocolToEdit(prev => prev ? ({ ...prev, decisaoPlenario: e.target.value.toUpperCase() }) : null)}
                  placeholder="EX: APROVADO EM SESSÃO PLENÁRIA ORDINÁRIA Nº 640"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 uppercase"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setProtocolToEdit(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold uppercase cursor-pointer"
                >
                  CANCELAR
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold uppercase shadow-sm cursor-pointer"
                >
                  SALVAR ALTERAÇÕES
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: NOVO CADASTRO / EDITAR CADASTRO DE PROFISSIONAL (PF)               */}
      {/* ========================================================================= */}
      {isModalOpen && editingProfissional && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-2xl w-full my-6 max-h-[90vh] overflow-y-auto shadow-2xl p-4 sm:p-6 text-xs space-y-4 animate-in fade-in zoom-in duration-150">
            {/* Header Modal */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0 font-bold">
                  {editingProfissional.id ? <Edit3 className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-900 uppercase">
                    {editingProfissional.id ? 'EDITAR CADASTRO DO PROFISSIONAL' : 'NOVO CADASTRO DE PROFISSIONAL (PF)'}
                  </h2>
                  <p className="text-[10px] text-slate-500 font-mono">
                    INSCRIÇÃO: {editingProfissional.inscricao}
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setIsModalOpen(false);
                  setEditingProfissional(null);
                }}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Inscription Cronológica Box */}
            {!editingProfissional.id && (
              <div className="p-3 bg-purple-50/70 border border-purple-200 rounded-xl flex items-center justify-between">
                <div className="flex items-center space-x-2.5">
                  <div className="w-7 h-7 rounded-lg bg-purple-600 text-white flex items-center justify-center font-mono text-xs shrink-0">
                    <Hash className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[10px] text-purple-700 font-bold uppercase block">Inscrição Cronológica Automática:</span>
                    <span className="font-mono font-extrabold text-purple-900 text-sm">{editingProfissional.inscricao}</span>
                  </div>
                </div>
                <span className="text-[10px] px-2 py-0.5 bg-purple-100 text-purple-800 font-bold rounded-md uppercase shrink-0">
                  Sequencial +1
                </span>
              </div>
            )}

            {/* Tabs Selector */}
            <div className="flex border-b border-slate-200 overflow-x-auto gap-1 pb-1">
              <button
                type="button"
                onClick={() => setModalTab('dados_pessoais')}
                className={`px-3 py-2 rounded-lg font-bold text-[11px] uppercase transition-all shrink-0 flex items-center space-x-1.5 cursor-pointer ${
                  modalTab === 'dados_pessoais' ? 'bg-purple-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <UserCheck className="w-3.5 h-3.5" />
                <span>1. Dados & Foto</span>
              </button>
              <button
                type="button"
                onClick={() => setModalTab('filiacao_formacao')}
                className={`px-3 py-2 rounded-lg font-bold text-[11px] uppercase transition-all shrink-0 flex items-center space-x-1.5 cursor-pointer ${
                  modalTab === 'filiacao_formacao' ? 'bg-purple-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <GraduationCap className="w-3.5 h-3.5" />
                <span>2. Filiação & Formação</span>
              </button>
              <button
                type="button"
                onClick={() => setModalTab('endereco_contato')}
                className={`px-3 py-2 rounded-lg font-bold text-[11px] uppercase transition-all shrink-0 flex items-center space-x-1.5 cursor-pointer ${
                  modalTab === 'endereco_contato' ? 'bg-purple-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <MapPin className="w-3.5 h-3.5" />
                <span>3. Endereço & Contato</span>
              </button>
              <button
                type="button"
                onClick={() => setModalTab('empresas_rt')}
                className={`px-3 py-2 rounded-lg font-bold text-[11px] uppercase transition-all shrink-0 flex items-center space-x-1.5 cursor-pointer ${
                  modalTab === 'empresas_rt' ? 'bg-purple-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Building2 className="w-3.5 h-3.5" />
                <span>4. Empresas (RT)</span>
              </button>
              <button
                type="button"
                onClick={() => setModalTab('posicao_financeira')}
                className={`px-3 py-2 rounded-lg font-bold text-[11px] uppercase transition-all shrink-0 flex items-center space-x-1.5 cursor-pointer ${
                  modalTab === 'posicao_financeira' ? 'bg-purple-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <DollarSign className="w-3.5 h-3.5" />
                <span>5. Financeiro</span>
              </button>
            </div>

            <form onSubmit={handleSaveProfissional} className="space-y-4">
              {/* ABA 1: DADOS PESSOAIS */}
              {modalTab === 'dados_pessoais' && (
                <div className="space-y-3.5">
                  {/* Foto do Profissional */}
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center space-x-3.5">
                    <div className="w-14 h-14 rounded-full bg-purple-100 border border-purple-200 flex items-center justify-center overflow-hidden shrink-0 font-bold text-purple-700 text-sm">
                      {editingProfissional.fotoUrl ? (
                        <img src={editingProfissional.fotoUrl} alt="Foto" className="w-full h-full object-cover" />
                      ) : (
                        <Camera className="w-6 h-6 text-purple-400" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <label className="block text-slate-700 font-bold mb-1 uppercase text-[10px]">
                        URL da Foto do Profissional (Opcional)
                      </label>
                      <input
                        type="url"
                        value={editingProfissional.fotoUrl || ''}
                        onChange={(e) => setEditingProfissional(prev => ({ ...prev, fotoUrl: e.target.value }))}
                        placeholder="https://exemplo.com/foto-profissional.jpg"
                        className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-900 text-xs font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold mb-1 uppercase text-[10px]">
                      Nome Completo do Profissional *
                    </label>
                    <input
                      type="text"
                      required
                      value={editingProfissional.nome || ''}
                      onChange={(e) => setEditingProfissional(prev => ({ ...prev, nome: e.target.value.toUpperCase() }))}
                      placeholder="EX: DRA. MARIANA SANTOS COSTA"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 uppercase font-semibold focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-purple-500/20"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-slate-700 font-bold mb-1 uppercase text-[10px]">
                        CPF *
                      </label>
                      <input
                        type="text"
                        required
                        maxLength={14}
                        value={editingProfissional.cpf || ''}
                        onChange={(e) => setEditingProfissional(prev => ({ ...prev, cpf: maskCPF(e.target.value) }))}
                        placeholder="000.000.000-00"
                        className={`w-full px-3 py-2 bg-slate-50 border rounded-xl text-slate-900 font-mono font-bold ${
                          editingProfissional.cpf && !isCpfValid ? 'border-rose-400 bg-rose-50/50' : 'border-slate-300'
                        }`}
                      />
                      {editingProfissional.cpf && !isCpfValid && (
                        <span className="text-[10px] text-rose-600 font-semibold block mt-0.5">CPF Inválido</span>
                      )}
                    </div>

                    <div>
                      <label className="block text-slate-700 font-bold mb-1 uppercase text-[10px]">
                        RG (Identidade)
                      </label>
                      <input
                        type="text"
                        value={editingProfissional.rg || ''}
                        onChange={(e) => setEditingProfissional(prev => ({ ...prev, rg: e.target.value.toUpperCase() }))}
                        placeholder="1234567-8"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-700 font-bold mb-1 uppercase text-[10px]">
                        Órgão Expeditor
                      </label>
                      <input
                        type="text"
                        value={editingProfissional.orgaoExpeditor || ''}
                        onChange={(e) => setEditingProfissional(prev => ({ ...prev, orgaoExpeditor: e.target.value.toUpperCase() }))}
                        placeholder="SSP/AM"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 uppercase"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-slate-700 font-bold mb-1 uppercase text-[10px]">Data de Nascimento</label>
                      <input
                        type="text"
                        value={editingProfissional.dataNascimento || ''}
                        onChange={(e) => setEditingProfissional(prev => ({ ...prev, dataNascimento: e.target.value }))}
                        placeholder="DD/MM/AAAA"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-700 font-bold mb-1 uppercase text-[10px]">Sexo</label>
                      <select
                        value={editingProfissional.sexo || 'F'}
                        onChange={(e) => setEditingProfissional(prev => ({ ...prev, sexo: e.target.value as any }))}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 uppercase font-semibold"
                      >
                        <option value="F">FEMININO</option>
                        <option value="M">MASCULINO</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-slate-700 font-bold mb-1 uppercase text-[10px]">Naturalidade</label>
                      <input
                        type="text"
                        value={editingProfissional.naturalidade || ''}
                        onChange={(e) => setEditingProfissional(prev => ({ ...prev, naturalidade: e.target.value.toUpperCase() }))}
                        placeholder="MANAUS/AM"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 uppercase"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-700 font-bold mb-1 uppercase text-[10px]">
                        Tipo de Profissional (Título) *
                      </label>
                      <select
                        value={editingProfissional.tipoAssociado || 'Farmacêutico'}
                        onChange={(e) => setEditingProfissional(prev => ({ ...prev, tipoAssociado: e.target.value as any }))}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-semibold uppercase"
                      >
                        {cadastrosTipos.map(t => (
                          <option key={t.id} value={t.nome}>{t.nome}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-slate-700 font-bold mb-1 uppercase text-[10px]">
                        Situação Cadastral *
                      </label>
                      <select
                        value={editingProfissional.situacao || 'Definitivo'}
                        onChange={(e) => setEditingProfissional(prev => ({ ...prev, situacao: e.target.value as any }))}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-semibold uppercase"
                      >
                        {cadastrosSituacoes.map(s => (
                          <option key={s.id} value={s.nome}>{s.nome}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* ABA 2: FILIAÇÃO & FORMAÇÃO */}
              {modalTab === 'filiacao_formacao' && (
                <div className="space-y-3.5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-700 font-bold mb-1 uppercase text-[10px]">Nome da Mãe *</label>
                      <input
                        type="text"
                        value={editingProfissional.nomeMae || ''}
                        onChange={(e) => setEditingProfissional(prev => ({ ...prev, nomeMae: e.target.value.toUpperCase() }))}
                        placeholder="NOME COMPLETO DA MÃE"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 uppercase font-semibold focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-purple-500/20"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-700 font-bold mb-1 uppercase text-[10px]">Nome do Pai</label>
                      <input
                        type="text"
                        value={editingProfissional.nomePai || ''}
                        onChange={(e) => setEditingProfissional(prev => ({ ...prev, nomePai: e.target.value.toUpperCase() }))}
                        placeholder="NOME COMPLETO DO PAI (SE HOUVER)"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 uppercase font-semibold focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-purple-500/20"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-700 font-bold mb-1 uppercase text-[10px]">Instituição Formadora (Faculdade)</label>
                      <input
                        type="text"
                        value={editingProfissional.faculdade || ''}
                        onChange={(e) => setEditingProfissional(prev => ({ ...prev, faculdade: e.target.value.toUpperCase() }))}
                        placeholder="UFAM, NILTON LINS, FAMETRO..."
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 uppercase font-medium"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-700 font-bold mb-1 uppercase text-[10px]">Data de Colação de Grau</label>
                      <input
                        type="text"
                        value={editingProfissional.dataColacaoGrau || ''}
                        onChange={(e) => setEditingProfissional(prev => ({ ...prev, dataColacaoGrau: e.target.value }))}
                        placeholder="DD/MM/AAAA"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-mono"
                      />
                    </div>
                  </div>

                  {/* Habilitações Profissionais */}
                  <div>
                    <label className="block text-slate-700 font-bold mb-1 uppercase text-[10px]">
                      Habilitações / Especialidades Averbadas
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-3 bg-slate-50 border border-slate-200 rounded-xl max-h-36 overflow-y-auto">
                      {cadastrosHabilitacoes.map((hab) => {
                        const isChecked = editingProfissional.habilitacoes?.includes(hab.nome);
                        return (
                          <label key={hab.id} className="flex items-center space-x-2 text-[10px] uppercase font-bold text-slate-800 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={(e) => {
                                const current = editingProfissional.habilitacoes || [];
                                if (e.target.checked) {
                                  setEditingProfissional(prev => ({ ...prev, habilitacoes: [...current, hab.nome] }));
                                } else {
                                  setEditingProfissional(prev => ({ ...prev, habilitacoes: current.filter(h => h !== hab.nome) }));
                                }
                              }}
                              className="w-3.5 h-3.5 text-purple-600 rounded-md border-slate-300 cursor-pointer"
                            />
                            <span className="truncate">{hab.nome}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* ABA 3: ENDEREÇO & CONTATO */}
              {modalTab === 'endereco_contato' && (
                <div className="space-y-3.5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-700 font-bold mb-1 uppercase text-[10px]">Telefone / Celular *</label>
                      <input
                        type="text"
                        maxLength={15}
                        value={editingProfissional.telefone || ''}
                        onChange={(e) => {
                          const masked = maskPhone(e.target.value);
                          setEditingProfissional(prev => ({ ...prev, telefone: masked, celular: masked }));
                        }}
                        placeholder="(92) 99999-9999"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-mono font-bold"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-700 font-bold mb-1 uppercase text-[10px]">E-mail Principal</label>
                      <input
                        type="email"
                        value={editingProfissional.emailPessoal || ''}
                        onChange={(e) => setEditingProfissional(prev => ({ ...prev, emailPessoal: e.target.value }))}
                        placeholder="contato@profissional.com"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-mono"
                      />
                    </div>
                  </div>

                  {/* Bloco Endereço Residencial com layout 100% responsivo */}
                  <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 uppercase text-[11px] flex items-center space-x-1.5">
                        <MapPin className="w-3.5 h-3.5 text-purple-600" />
                        <span>Endereço Residencial do Profissional</span>
                      </span>
                      {councilConfig.autoPreencherEnderecoCEP && (
                        <span className="text-[10px] text-purple-700 bg-purple-50 border border-purple-200 px-2 py-0.5 rounded-md font-bold uppercase">
                          ViaCEP Ativo
                        </span>
                      )}
                    </div>

                    {/* CEP Field */}
                    <div className="space-y-1">
                      <label className="block text-slate-700 font-bold uppercase text-[10px]">CEP:</label>
                      <div className="flex items-center gap-2 max-w-sm">
                        <input
                          type="text"
                          maxLength={9}
                          value={editingProfissional.cep || ''}
                          onChange={handleCepChange}
                          placeholder="00000-000"
                          className="flex-1 min-w-0 px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 font-mono font-bold focus:outline-hidden focus:ring-2 focus:ring-purple-500/20"
                        />
                        <button
                          type="button"
                          onClick={() => searchCep()}
                          disabled={isSearchingCep}
                          className="shrink-0 px-3.5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold flex items-center space-x-1 text-[11px] shadow-xs uppercase disabled:opacity-50 transition-colors cursor-pointer"
                          title="Consultar CEP nos Correios"
                        >
                          {isSearchingCep ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
                          <span>BUSCAR CEP</span>
                        </button>
                      </div>
                    </div>

                    {/* Logradouro e Complemento */}
                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
                      <div className="sm:col-span-8">
                        <label className="block text-slate-700 font-bold mb-1 uppercase text-[10px]">Logradouro / Rua e Número:</label>
                        <input
                          type="text"
                          value={editingProfissional.endereco || ''}
                          onChange={(e) => setEditingProfissional(prev => ({ ...prev, endereco: e.target.value.toUpperCase() }))}
                          placeholder="RUA, AV., NÚMERO..."
                          className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 uppercase font-medium focus:outline-hidden focus:ring-2"
                        />
                      </div>
                      <div className="sm:col-span-4">
                        <label className="block text-slate-700 font-bold mb-1 uppercase text-[10px]">Complemento / Apto:</label>
                        <input
                          type="text"
                          value={editingProfissional.complemento || ''}
                          onChange={(e) => setEditingProfissional(prev => ({ ...prev, complemento: e.target.value.toUpperCase() }))}
                          placeholder="BLOCO, APTO..."
                          className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 uppercase font-medium"
                        />
                      </div>
                    </div>

                    {/* Bairro, Cidade, UF */}
                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
                      <div className="sm:col-span-5">
                        <label className="block text-slate-700 font-bold mb-1 uppercase text-[10px]">Bairro:</label>
                        <input
                          type="text"
                          value={editingProfissional.bairro || ''}
                          onChange={(e) => setEditingProfissional(prev => ({ ...prev, bairro: e.target.value.toUpperCase() }))}
                          placeholder="BAIRRO"
                          className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 uppercase font-medium"
                        />
                      </div>
                      <div className="sm:col-span-5">
                        <label className="block text-slate-700 font-bold mb-1 uppercase text-[10px]">Cidade:</label>
                        <input
                          type="text"
                          value={editingProfissional.cidade || ''}
                          onChange={(e) => setEditingProfissional(prev => ({ ...prev, cidade: e.target.value.toUpperCase() }))}
                          placeholder="MANAUS"
                          className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 uppercase font-medium"
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="block text-slate-700 font-bold mb-1 uppercase text-[10px]">UF:</label>
                        <input
                          type="text"
                          maxLength={2}
                          value={editingProfissional.uf || ''}
                          onChange={(e) => setEditingProfissional(prev => ({ ...prev, uf: e.target.value.toUpperCase() }))}
                          placeholder="AM"
                          className="w-full px-2 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 font-mono font-bold text-center uppercase"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ABA 4: EMPRESAS VINCULADAS (RT) - Sem botão de vincular empresa (função exclusiva do cadastro de empresas) */}
              {modalTab === 'empresas_rt' && (
                <div className="space-y-3.5">
                  <div className="p-3.5 bg-blue-50/70 border border-blue-200 rounded-2xl">
                    <span className="font-bold text-blue-950 uppercase text-xs flex items-center space-x-1.5">
                      <Building2 className="w-4 h-4 text-blue-600" />
                      <span>Vínculos de Responsabilidade Técnica (RT)</span>
                    </span>
                    <p className="text-[11px] text-blue-800 mt-1">
                      ℹ️ A inclusão, alteração e baixa de Responsabilidade Técnica (RT) é uma função exclusiva do <strong>Cadastro de Empresas (PJ)</strong>. Abaixo são exibidos os vínculos ativos atualmente associados a este profissional.
                    </p>
                  </div>

                  {empresasVinculadas.length === 0 ? (
                    <div className="p-8 text-center bg-slate-50 border border-slate-200 rounded-2xl">
                      <Building2 className="w-8 h-8 text-slate-400 mx-auto mb-2 opacity-50" />
                      <p className="font-bold text-slate-700 uppercase text-xs">Nenhum Vínculo Técnico Ativo</p>
                      <p className="text-[11px] text-slate-400 mt-1 uppercase">
                        Para vincular este profissional a uma drogaria, farmácia ou distribuidora, acesse o módulo de <strong>Cadastro de Empresas (PJ)</strong> e adicione o RT no estabelecimento correspondente.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {empresasVinculadas.map(({ empresa, vinculo }) => (
                        <div key={empresa.id} className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                          <div>
                            <div className="font-bold text-slate-900 uppercase">{empresa.razaoSocial}</div>
                            <div className="text-[10px] text-slate-500 font-mono uppercase">
                              INSCRIÇÃO: {empresa.inscricao} | CARGO: {vinculo.cargo} ({vinculo.cargaHorariaSemanal}H)
                            </div>
                          </div>
                          <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg font-bold text-[10px] uppercase">
                            RT ATIVO
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* ABA 5: POSIÇÃO FINANCEIRA */}
              {modalTab === 'posicao_financeira' && (
                <div className="space-y-3.5">
                  <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                    <div>
                      <span className="font-bold text-slate-900 uppercase text-[11px] block">Situação Financeira Consolidada</span>
                      <span className="text-[10px] text-slate-500 font-mono">
                        TOTAL DE DÉBITOS EM ABERTO: R$ {posicaoFin.valorTotalAberto.toFixed(2)}
                      </span>
                    </div>
                    <span className={`text-xs px-3 py-1 rounded-full font-bold uppercase ${
                      posicaoFin.valorTotalAberto > 0 ? 'bg-rose-50 text-rose-700 border border-rose-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    }`}>
                      {posicaoFin.valorTotalAberto > 0 ? 'INADIMPLENTE' : 'ADIMPLENTE'}
                    </span>
                  </div>

                  <div className="space-y-2">
                    <span className="font-bold text-slate-800 uppercase text-[10px] block">Lançamentos Financeiros Registrados:</span>
                    {posicaoFin.lancamentos.length === 0 ? (
                      <div className="p-6 text-center bg-slate-50 border border-slate-200 rounded-xl">
                        <DollarSign className="w-6 h-6 text-slate-400 mx-auto mb-1 opacity-50" />
                        <p className="text-slate-500 uppercase font-semibold text-[11px]">Nenhum boleto ou lançamento encontrado</p>
                      </div>
                    ) : (
                      posicaoFin.lancamentos.map((lanc) => (
                        <div key={lanc.id} className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                          <div>
                            <div className="font-bold text-slate-900 uppercase">{lanc.descricao}</div>
                            <div className="text-[10px] text-slate-500 font-mono">
                              VENCIMENTO: {lanc.dataVencimento} | EXERCÍCIO: {lanc.exercicio}
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="font-mono font-bold text-slate-900 text-xs">R$ {lanc.valorTotal.toFixed(2)}</span>
                            {onOpenBoletoPix && lanc.status !== 'Pago' && (
                              <button
                                type="button"
                                onClick={() => onOpenBoletoPix(lanc)}
                                className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-[9px] uppercase flex items-center space-x-1 cursor-pointer"
                              >
                                <Receipt className="w-3 h-3" />
                                <span>BOLETO / PIX</span>
                              </button>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* Botões do Rodapé */}
              <div className="flex justify-between items-center pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    setEditingProfissional(null);
                  }}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold uppercase cursor-pointer"
                >
                  CANCELAR
                </button>
                <button
                  type="submit"
                  className="flex items-center space-x-1.5 px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold shadow-md shadow-purple-500/20 uppercase cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{editingProfissional.id ? 'SALVAR ALTERAÇÕES' : 'CONCLUIR CADASTRO'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {profToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full shadow-2xl p-6 text-xs space-y-4 animate-in fade-in zoom-in duration-150">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-base font-bold text-slate-900 uppercase">CONFIRMAR EXCLUSÃO DE PROFISSIONAL</h3>
              <p className="text-slate-500 uppercase">
                VOCÊ TEM CERTEZA QUE DESEJA REMOVER O CADASTRO DE <strong className="text-slate-800">{profToDelete.nome}</strong> (INSCRIÇÃO: {profToDelete.inscricao})? ESTA AÇÃO NÃO PODE SER DESFEITA.
              </p>
            </div>

            <div className="flex space-x-2 pt-2">
              <button
                onClick={() => setProfToDelete(null)}
                className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold transition-colors uppercase cursor-pointer"
              >
                CANCELAR
              </button>
              <button
                onClick={handleConfirmDelete}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold shadow-md shadow-rose-500/20 transition-colors uppercase cursor-pointer"
              >
                SIM, EXCLUIR
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
