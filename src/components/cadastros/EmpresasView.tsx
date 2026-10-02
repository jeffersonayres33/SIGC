import React, { useState } from 'react';
import { 
  Building2, 
  Search, 
  Filter, 
  Plus, 
  Download, 
  Eye, 
  Edit3, 
  Trash2, 
  FileCheck2, 
  MapPin, 
  Phone, 
  Mail, 
  Users, 
  Calendar, 
  ShieldCheck, 
  AlertTriangle, 
  X, 
  CheckCircle2, 
  Printer, 
  Building,
  FileText,
  Hash,
  Sparkles,
  Loader2,
  DollarSign,
  UserCheck,
  Briefcase,
  UserPlus,
  Lock,
  Receipt,
  Unlink,
  Check,
  Clock,
  ChevronLeft,
  ChevronRight,
  Award,
  Scale,
  FileSpreadsheet,
  ShieldAlert
} from 'lucide-react';
import { Empresa, CondicaoFirma, Socio, ResponsavelTecnico, Profissional, HorarioFuncionamentoItem, HorarioAssistenciaItem } from '../../types';
import { storageService, DEFAULT_HORARIOS_FUNCIONAMENTO, DEFAULT_HORARIOS_ASSISTENCIA, calculateIntervalHours, calculateDayTotalHours } from '../../services/storageService';
import { exportToCSV, exportToPDF } from '../../services/exportService';
import { toastService } from '../../services/toastService';
import { EmpresaHorariosEditor } from './EmpresaHorariosEditor';
import { ResponsavelTecnicoEditorModal } from './ResponsavelTecnicoEditorModal';
import { 
  maskCNPJ, 
  validateCNPJ, 
  maskPhone, 
  maskCEP, 
  validateCEP,
  fetchAddressByCEP,
  maskCPF,
  sanitizeToUpper,
  dateToInput,
  inputToDate
} from '../../utils/documentUtils';

interface EmpresasViewProps {
  onOpenCrtModal?: (empresa: Empresa) => void;
  onOpenBoletoPix?: (lancamento: any) => void;
}

export const EmpresasView: React.FC<EmpresasViewProps> = ({ onOpenCrtModal, onOpenBoletoPix }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [condicaoFilter, setCondicaoFilter] = useState<string>('Todos');
  const [situacaoFilter, setSituacaoFilter] = useState<string>('Todos');
  const [tipoFilter, setTipoFilter] = useState<string>('Todos');
  const [tipoEmpresaFilter, setTipoEmpresaFilter] = useState<string>('Todos');
  const [categoriaEmpresaFilter, setCategoriaEmpresaFilter] = useState<string>('Todos');
  const [cepFilter, setCepFilter] = useState('');
  const [enderecoFilter, setEnderecoFilter] = useState('');
  const [bairroFilter, setBairroFilter] = useState('');
  const [cidadeFilter, setCidadeFilter] = useState<string>('Todos');
  const [emailFilter, setEmailFilter] = useState('');
  const [telefoneFilter, setTelefoneFilter] = useState('');
  const [socioFilter, setSocioFilter] = useState('');
  const [profissionalFilter, setProfissionalFilter] = useState('');
  const [naturezaFilter, setNaturezaFilter] = useState('');
  const [isentoAnuidadeFilter, setIsentoAnuidadeFilter] = useState<string>('Todos');
  const [anuidadeReduzidaFilter, setAnuidadeReduzidaFilter] = useState<string>('Todos');
  const [recadastradoFilter, setRecadastradoFilter] = useState<string>('Todos');
  const [isentoTaxaCertificadoFilter, setIsentoTaxaCertificadoFilter] = useState<string>('Todos');
  const [assistenciaPlenaFilter, setAssistenciaPlenaFilter] = useState<string>('Todos');
  const [bloqueadoFilter, setBloqueadoFilter] = useState<string>('Todos');
  const [motivoBloqueioFilter, setMotivoBloqueioFilter] = useState('');
  const [dataBloqueioFilter, setDataBloqueioFilter] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const handleClearFilters = () => {
    setSearchTerm('');
    setCondicaoFilter('Todos');
    setSituacaoFilter('Todos');
    setTipoFilter('Todos');
    setTipoEmpresaFilter('Todos');
    setCategoriaEmpresaFilter('Todos');
    setCepFilter('');
    setEnderecoFilter('');
    setBairroFilter('');
    setCidadeFilter('Todos');
    setEmailFilter('');
    setTelefoneFilter('');
    setSocioFilter('');
    setProfissionalFilter('');
    setNaturezaFilter('');
    setIsentoAnuidadeFilter('Todos');
    setAnuidadeReduzidaFilter('Todos');
    setRecadastradoFilter('Todos');
    setIsentoTaxaCertificadoFilter('Todos');
    setAssistenciaPlenaFilter('Todos');
    setBloqueadoFilter('Todos');
    setMotivoBloqueioFilter('');
    setDataBloqueioFilter('');
    toastService.info('Filtros Limpos', 'Todos os filtros de empresas foram redefinidos.');
  };

  const [selectedEmpresa, setSelectedEmpresa] = useState<Empresa | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalTab, setModalTab] = useState<'dados_pj' | 'horarios' | 'responsaveis_rt' | 'socios_qsa' | 'endereco' | 'posicao_financeira' | 'bloqueio'>('dados_pj');
  const [editingEmpresa, setEditingEmpresa] = useState<Partial<Empresa> | null>(null);
  const [empresaToDelete, setEmpresaToDelete] = useState<Empresa | null>(null);
  const [empresaToConvertDefinitiva, setEmpresaToConvertDefinitiva] = useState<Empresa | null>(null);
  const [isSearchingCep, setIsSearchingCep] = useState(false);

  const [provisorioConfirmModalPJ, setProvisorioConfirmModalPJ] = useState<{
    isOpen: boolean;
    targetSituacao: string;
    prevSituacao: string;
    numeroAtual: string;
    novaInscricao: string;
  } | null>(null);

  const handleSituacaoEmpresaChange = (novaSituacao: string) => {
    if (!editingEmpresa) return;
    const currentSit = editingEmpresa.situacao || 'Definitiva';
    const wasProvisorio = storageService.isSituacaoProvisoria(currentSit);
    const willBeProvisorio = storageService.isSituacaoProvisoria(novaSituacao);

    if (!wasProvisorio && willBeProvisorio) {
      // Pergunta se deseja mesmo alterar para Provisório mantendo o número atual
      const inscricaoAtual = editingEmpresa.inscricao || '';
      const numeroAtual = storageService.extrairNumeroInscricao(inscricaoAtual) || String(councilConfig.proximoNumeroInscricaoProvisoriaEmpresa || 100);
      const novaInscricaoProvisoria = storageService.alternarInscricaoParaProvisorio(inscricaoAtual, 'PJ');

      setProvisorioConfirmModalPJ({
        isOpen: true,
        targetSituacao: novaSituacao,
        prevSituacao: currentSit,
        numeroAtual,
        novaInscricao: novaInscricaoProvisoria
      });
    } else if (wasProvisorio && !willBeProvisorio) {
      // Voltando de Provisório para Definitivo (altera somente prefixo e sufixo mantendo o número atual)
      const inscricaoAtual = editingEmpresa.inscricao || '';
      const novaInscricaoDefinitiva = storageService.alternarInscricaoParaDefinitivo(inscricaoAtual, 'PJ');
      const numeroAtual = storageService.extrairNumeroInscricao(inscricaoAtual);

      setEditingEmpresa(prev => prev ? ({
        ...prev,
        situacao: novaSituacao as any,
        inscricao: novaInscricaoDefinitiva
      }) : null);

      toastService.info(
        'Inscrição Revertida para Definitiva',
        `A numeração cronológica (${numeroAtual}) foi mantida e o prefixo/sufixo definitivo aplicado com sucesso.`
      );
    } else {
      setEditingEmpresa(prev => prev ? ({
        ...prev,
        situacao: novaSituacao as any
      }) : null);
    }
  };

  const handleConfirmChangeToProvisorioPJ = () => {
    if (!provisorioConfirmModalPJ || !editingEmpresa) return;
    const { targetSituacao, novaInscricao, numeroAtual } = provisorioConfirmModalPJ;

    const validadeMeses = councilConfig.validadeProvisoriaMesesEmpresa ?? 12;
    const today = new Date();
    const vencDate = new Date();
    vencDate.setMonth(vencDate.getMonth() + validadeMeses);

    setEditingEmpresa(prev => {
      if (!prev) return null;
      const inscricaoAtual = prev.inscricao || '';
      const isCurrentlyDefinitivo = !storageService.isSituacaoProvisoria(prev.situacao);
      const prevDefinitiva = isCurrentlyDefinitivo ? inscricaoAtual : prev.inscricaoDefinitivaAnterior;

      return {
        ...prev,
        situacao: targetSituacao as any,
        inscricao: novaInscricao,
        inscricaoDefinitivaAnterior: prevDefinitiva,
        dtInicioInscProvisoria: prev.dtInicioInscProvisoria || today.toLocaleDateString('pt-BR'),
        dtVencInscProvisoria: prev.dtVencInscProvisoria || vencDate.toLocaleDateString('pt-BR')
      };
    });

    setProvisorioConfirmModalPJ(null);
    toastService.success(
      'Situação Alterada para Provisório',
      `O número (${numeroAtual}) foi preservado e o prefixo/sufixo alterado para o padrão provisório (${novaInscricao}).`
    );
  };

  const handleSelectTipoInscricaoPJ = (tipo: 'Definitiva' | 'Provisória') => {
    if (!editingEmpresa) return;
    if (editingEmpresa.id) {
      // Cadastro existente: usa a lógica de alteração que preserva o número e formata prefixo/sufixo
      if (tipo === 'Provisória') {
        handleSituacaoEmpresaChange('Provisória');
      } else {
        handleSituacaoEmpresaChange('Definitiva');
      }
    } else {
      // Novo cadastro: gera um novo sequencial do lote correspondente
      if (tipo === 'Provisória') {
        const generated = storageService.peekNextInscricaoProvisoriaEmpresa();
        const validadeMeses = councilConfig.validadeProvisoriaMesesEmpresa ?? 12;
        const today = new Date();
        const vencDate = new Date();
        vencDate.setMonth(vencDate.getMonth() + validadeMeses);

        setEditingEmpresa(prev => prev ? ({
          ...prev,
          inscricao: generated,
          situacao: 'Provisória',
          dtInicioInscProvisoria: today.toLocaleDateString('pt-BR'),
          dtVencInscProvisoria: vencDate.toLocaleDateString('pt-BR')
        }) : null);
      } else {
        const generated = storageService.peekNextInscricaoEmpresa();
        setEditingEmpresa(prev => prev ? ({
          ...prev,
          inscricao: generated,
          situacao: 'Definitiva'
        }) : null);
      }
    }
  };

  const handleConfirmConversaoDefinitivaPJ = () => {
    if (!empresaToConvertDefinitiva) return;
    const updated = storageService.converterEmpresaParaDefinitiva(empresaToConvertDefinitiva.id);
    if (updated) {
      toastService.success(
        'Inscrição Definitiva PJ Efetivada!',
        `A empresa ${updated.razaoSocial} agora possui a inscrição definitiva ${updated.inscricao}. Numeração anterior (${empresaToConvertDefinitiva.inscricao}) arquivada com sucesso.`
      );
      if (selectedEmpresa && selectedEmpresa.id === updated.id) {
        setSelectedEmpresa(updated);
      }
    } else {
      toastService.error('Erro na Conversão', 'Não foi possível converter a inscrição para definitiva.');
    }
    setEmpresaToConvertDefinitiva(null);
  };

  // Sub-modal Sócio
  const [isSocioModalOpen, setIsSocioModalOpen] = useState(false);
  const [editingSocioIndex, setEditingSocioIndex] = useState<number | null>(null);
  const [editingSocio, setEditingSocio] = useState<Partial<Socio>>({
    nome: '',
    cpf: '',
    rg: '',
    participacaoPct: 50,
    tipo: 'Administrador'
  });

  // Modal de RT e Horários de Assistência do Farmacêutico
  const [isRtEditorModalOpen, setIsRtEditorModalOpen] = useState(false);
  const [editingRtData, setEditingRtData] = useState<ResponsavelTecnico | null>(null);
  const [editingRtIndex, setEditingRtIndex] = useState<number | null>(null);

  const councilConfig = storageService.getCouncilConfig();
  const cadastrosTiposEmpresa = storageService.getCadastrosBasicos('TIPO_EMPRESA').filter(i => i.ativo);
  const cadastrosSituacoesEmpresa = storageService.getCadastrosBasicos('SITUACAO_EMPRESA').filter(i => i.ativo);
  const cadastrosMunicipios = storageService.getCadastrosBasicos('MUNICIPIO').filter(i => i.ativo);
  const cadastrosNaturezaAtividade = storageService.getCadastrosBasicos('NATUREZA_ATIVIDADE').filter(i => i.ativo);
  const cadastrosMotivosSituacaoEmpresa = storageService.getCadastrosBasicos('MOTIVO_SITUACAO_EMPRESA').filter(i => i.ativo);

  const empresas = storageService.getEmpresas({
    search: searchTerm,
    condicao: condicaoFilter,
    situacao: situacaoFilter,
    tipoEstabelecimento: tipoFilter,
    tipoEmpresa: tipoEmpresaFilter,
    categoriaEmpresa: categoriaEmpresaFilter,
    bairro: bairroFilter,
    cidade: cidadeFilter,
    cep: cepFilter,
    endereco: enderecoFilter,
    email: emailFilter,
    telefone: telefoneFilter,
    socio: socioFilter,
    profissional: profissionalFilter,
    naturezaAtividade: naturezaFilter,
    isentoAnuidade: isentoAnuidadeFilter,
    anuidadeReduzida: anuidadeReduzidaFilter,
    recadastrado: recadastradoFilter,
    isentoTaxaCertificado: isentoTaxaCertificadoFilter,
    assistenciaPlena: assistenciaPlenaFilter,
    bloqueado: bloqueadoFilter,
    motivoBloqueio: motivoBloqueioFilter,
    dataBloqueio: dataBloqueioFilter
  });

  // Avaliação em tempo real de regularidade para o formulário
  const avaliacaoRegularidade = editingEmpresa ? storageService.avaliarRegularidadeAssistencia(editingEmpresa) : null;
  const totalGeralEmpresas = storageService.getEmpresas().length;

  const handleExportCSV = () => {
    const dataToExport = empresas.map(e => ({
      'INSCRIÇÃO PJ': e.inscricao,
      'CNPJ': e.cnpj,
      'RAZÃO SOCIAL': e.razaoSocial,
      'NOME FANTASIA': e.nomeFantasia,
      'TIPO DE ESTABELECIMENTO': e.tipoEstabelecimento,
      'NATUREZA DE ATIVIDADE': e.naturezaAtividade || '-',
      'CONDIÇÃO': e.condicao,
      'SITUAÇÃO': e.situacao,
      'ASSISTÊNCIA PLENA': e.assistenciaPlena ? 'SIM' : 'NÃO',
      'VALIDADE CRT': e.validadeCRT,
      'CEP': e.cep,
      'ENDEREÇO': e.endereco,
      'BAIRRO': e.bairro,
      'CIDADE': e.cidade,
      'UF': e.uf,
      'RTS ATIVOS': e.responsaveisTecnicos?.map(rt => `${rt.profissionalNome} (${rt.cargo} - ${rt.cargaHorariaSemanal}h)`).join(' | ') || 'NENHUM',
      'SÓCIOS': e.socios?.map(s => `${s.nome} (${s.participacaoPct}%)`).join(' | ') || 'NENHUM'
    }));
    exportToCSV(`empresas_conselho_${Date.now()}`, dataToExport);
    toastService.info('Exportação Excel Concluída', `${empresas.length} empresas exportadas para planilha Excel/CSV.`);
  };

  const handleExportPDF = () => {
    if (!empresas.length) {
      toastService.warning('Sem Dados', 'Nenhuma empresa encontrada para os filtros selecionados.');
      return;
    }

    const headers = ['Inscrição', 'CNPJ', 'Razão Social / Nome Fantasia', 'Tipo / Ramo', 'Município', 'Condição', 'CRT', 'RTs'];
    const rows = empresas.map(e => [
      e.inscricao,
      maskCNPJ(e.cnpj),
      `${e.razaoSocial}${e.nomeFantasia ? ` (${e.nomeFantasia})` : ''}`,
      e.tipoEstabelecimento || '-',
      `${e.cidade || '-'}/${e.uf || 'AM'}`,
      e.condicao || 'Regular',
      e.validadeCRT || '-',
      e.responsaveisTecnicos && e.responsaveisTecnicos.length > 0
        ? e.responsaveisTecnicos.map(rt => `${rt.profissionalNome} (${rt.cargaHorariaSemanal || 0}h)`).join(', ')
        : 'Sem RT Vinculado'
    ]);

    exportToPDF({
      title: 'Relatório Oficial de Empresas e Estabelecimentos (PJ)',
      subtitle: `${empresas.length} empresas filtradas | Emitido pelo SISCON Cloud`,
      filename: `empresas_filtradas_${Date.now()}`,
      headers,
      rows,
      orientation: 'landscape',
      councilName: councilConfig.nomeCompleto || 'Conselho Regional de Farmácia',
      councilUF: councilConfig.uf || 'AM'
    });
    toastService.info('Exportação PDF Concluída', `${empresas.length} empresas exportadas para documento PDF oficial.`);
  };

  const isCnpjValid = editingEmpresa?.cnpj ? validateCNPJ(editingEmpresa.cnpj) : false;

  const handleOpenNewModal = () => {
    const generatedInscricao = storageService.peekNextInscricaoEmpresa();
    setEditingEmpresa({
      id: '',
      inscricao: generatedInscricao,
      cnpj: '',
      razaoSocial: '',
      nomeFantasia: '',
      categoria: 'Comércio Varejista',
      categoriaEmpresa: 'Micro empresa',
      tipoEstabelecimento: (cadastrosTiposEmpresa[0]?.nome as any) || 'Drogaria',
      tipoEmpresa: 'Privado',
      naturezaAtividade: 'FARMÁCIA SEM MANIPULAÇÃO OU DROGARIA',
      condicao: 'Regular',
      situacao: 'Definitiva',
      motivoSituacao: '',
      isentoAnuidade: false,
      anuidadeReduzida: false,
      recadastrado: true,
      dataRecadastramento: new Date().toLocaleDateString('pt-BR'),
      isentoTaxaCertificado: false,
      horarioPlantao: '08:00 ÀS 18:00',
      horasTolerancia: 0,
      dataInscricao: new Date().toLocaleDateString('pt-BR'),
      validadeCRT: `31/12/${new Date().getFullYear()}`,
      numeroCRT: `CRT-${Math.floor(1000 + Math.random() * 9000)}/${new Date().getFullYear()}`,
      assistenciaPlena: true,
      capitalSocial: 150000,
      email: '',
      telefone: '',
      uf: councilConfig.uf || 'AM',
      cidade: (cadastrosMunicipios[0]?.nome as string) || councilConfig.cidadeSede || 'MANAUS',
      cep: '',
      endereco: '',
      bairro: '',
      horariosFuncionamento: [...DEFAULT_HORARIOS_FUNCIONAMENTO],
      horariosAssistencia: [...DEFAULT_HORARIOS_ASSISTENCIA],
      socios: [
        { nome: 'ADMINISTRADOR PRINCIPAL', cpf: '000.000.000-00', rg: '123456 SSP/AM', participacaoPct: 100, tipo: 'Administrador' }
      ],
      responsaveisTecnicos: []
    });
    setModalTab('dados_pj');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (empresa: Empresa) => {
    const cloned = JSON.parse(JSON.stringify(empresa)) as Empresa;
    const situacoesDisponiveis = ['Definitiva', 'Provisória', 'Ilegal Fechada', 'Fechada Motivo Desconhecido', 'Temporária', 'Ilegal Aberta', 'Cancelada'];
    const matched = situacoesDisponiveis.find(s => 
      s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase() === 
      (cloned.situacao || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
    );
    cloned.situacao = (matched || cloned.situacao || 'Definitiva').toUpperCase();

    setEditingEmpresa(cloned);
    setModalTab('dados_pj');
    setIsModalOpen(true);
  };

  const handleCepChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    const masked = maskCEP(raw);
    setEditingEmpresa(prev => ({ ...prev, cep: masked }));

    if (councilConfig.autoPreencherEnderecoCEP && raw.replace(/\D/g, '').length === 8) {
      await searchCep(masked);
    }
  };

  const searchCep = async (cepValue?: string) => {
    const cepToSearch = cepValue || editingEmpresa?.cep;
    if (!cepToSearch || cepToSearch.replace(/\D/g, '').length !== 8) {
      toastService.warning('CEP Incompleto', 'Digite os 8 dígitos do CEP para realizar a busca.');
      return;
    }

    setIsSearchingCep(true);
    try {
      const res = await fetchAddressByCEP(cepToSearch);
      if (res && !res.erro) {
        setEditingEmpresa(prev => ({
          ...prev,
          endereco: res.logradouro ? `${res.logradouro}${res.complemento ? ` - ${res.complemento}` : ''}` : prev?.endereco,
          bairro: res.bairro || prev?.bairro,
          cidade: res.localidade ? res.localidade.toUpperCase() : prev?.cidade,
          uf: res.uf || prev?.uf
        }));
        toastService.info('Endereço Preenchido', `${res.logradouro}, ${res.bairro} - ${res.localidade}/${res.uf}`);
      } else {
        toastService.warning('CEP Não Encontrado', 'Verifique o CEP informado nos Correios.');
      }
    } catch (e) {
      toastService.warning('Falha na Busca', 'Não foi possível consultar o CEP no momento.');
    } finally {
      setIsSearchingCep(false);
    }
  };

  const handleSaveEmpresa = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEmpresa?.razaoSocial || !editingEmpresa?.cnpj) {
      toastService.warning('Campos Obrigatórios', 'Preencha a Razão Social e CNPJ da empresa.');
      return;
    }

    if (councilConfig.validarCNPJ && !isCnpjValid) {
      toastService.warning('CNPJ Inválido', 'Por favor, insira um CNPJ válido antes de salvar (ou desative a validação de CNPJ em Configurações).');
      return;
    }

     const isEditing = Boolean(editingEmpresa.id);
     let finalInscricao = editingEmpresa.inscricao;
 
     if (!isEditing) {
       const isProvisorio = editingEmpresa.situacao === 'Provisória' || editingEmpresa.situacao === 'Provisorio';
       finalInscricao = isProvisorio 
         ? storageService.getNextInscricaoProvisoriaEmpresa(true)
         : storageService.getNextInscricaoEmpresa(true);
     }
 
     // Executar auditoria de regularidade e cálculo automático de condição e justificativa
     const avaliacao = storageService.avaliarRegularidadeAssistencia(editingEmpresa);
 
     const rawEmpresa: Empresa = {
       id: editingEmpresa.id || `emp-${Date.now()}`,
       cnpj: editingEmpresa.cnpj.trim(),
       razaoSocial: editingEmpresa.razaoSocial.trim(),
       nomeFantasia: editingEmpresa.nomeFantasia || editingEmpresa.razaoSocial,
       inscricao: finalInscricao || storageService.peekNextInscricaoEmpresa(),
       inscricaoEstadual: editingEmpresa.inscricaoEstadual || 'ISENTO',
       categoria: editingEmpresa.categoria || 'COMÉRCIO VAREJISTA',
       categoriaEmpresa: editingEmpresa.categoriaEmpresa || editingEmpresa.categoria || 'Micro empresa',
       tipoEstabelecimento: editingEmpresa.tipoEstabelecimento || 'Drogaria',
       naturezaAtividade: editingEmpresa.naturezaAtividade || 'FARMÁCIA SEM MANIPULAÇÃO OU DROGARIA',
       tipoEmpresa: editingEmpresa.tipoEmpresa || 'Matriz',
       condicao: avaliacao.condicao,
       situacao: editingEmpresa.situacao || 'Definitiva',
       motivoSituacao: editingEmpresa.motivoSituacao || '',
       dtInicioInscProvisoria: editingEmpresa.dtInicioInscProvisoria || '',
       dtVencInscProvisoria: editingEmpresa.dtVencInscProvisoria || '',
       dataConversaoDefinitiva: editingEmpresa.dataConversaoDefinitiva || '',
       isentoAnuidade: Boolean(editingEmpresa.isentoAnuidade),
      anuidadeReduzida: Boolean(editingEmpresa.anuidadeReduzida),
      recadastrado: Boolean(editingEmpresa.recadastrado),
      dataRecadastramento: editingEmpresa.dataRecadastramento || '',
      isentoTaxaCertificado: Boolean(editingEmpresa.isentoTaxaCertificado),
      horarioPlantao: editingEmpresa.horarioPlantao || '',
      horasTolerancia: editingEmpresa.horasTolerancia || 0,
      dataInscricao: editingEmpresa.dataInscricao || new Date().toLocaleDateString('pt-BR'),
      validadeCRT: editingEmpresa.validadeCRT || `31/12/${new Date().getFullYear()}`,
      numeroCRT: editingEmpresa.numeroCRT || `CRT-${Math.floor(1000 + Math.random() * 9000)}/${new Date().getFullYear()}`,
      assistenciaPlena: avaliacao.horasFuncionamentoSemanais > 0 && avaliacao.horasAssistenciaSemanais >= avaliacao.horasFuncionamentoSemanais,
      cargaHorariaFuncionamentoSemanal: avaliacao.horasFuncionamentoSemanais,
      cargaHorariaAssistenciaSemanal: avaliacao.horasAssistenciaSemanais,
      regraAssistenciaAplicada: avaliacao.regraAplicada?.baseLegal || avaliacao.regraAplicada?.descricao || 'Diretrizes Técnicas CRF',
      justificativaCondicao: avaliacao.justificativa,
      capitalSocial: Number(editingEmpresa.capitalSocial) || 100000,
      telefone: editingEmpresa.telefone || '(92) 3000-0000',
      email: editingEmpresa.email || 'EMPRESA@EXEMPLO.COM.BR',
      endereco: editingEmpresa.endereco || 'AV. BRASIL, 500',
      complemento: editingEmpresa.complemento || '',
      bairro: editingEmpresa.bairro || 'CENTRO',
      cidade: editingEmpresa.cidade || 'MANAUS',
      uf: editingEmpresa.uf || 'AM',
      cep: editingEmpresa.cep || '69000-000',
      horariosFuncionamento: editingEmpresa.horariosFuncionamento || [...DEFAULT_HORARIOS_FUNCIONAMENTO],
      horariosAssistencia: editingEmpresa.horariosAssistencia || [...DEFAULT_HORARIOS_ASSISTENCIA],
      socios: editingEmpresa.socios || [],
      responsaveisTecnicos: editingEmpresa.responsaveisTecnicos || [],
      bloqueado: Boolean(editingEmpresa.bloqueado),
      motivoBloqueio: editingEmpresa.motivoBloqueio || '',
      dataBloqueio: editingEmpresa.dataBloqueio || '',
      dataDesbloqueioPrevista: editingEmpresa.dataDesbloqueioPrevista || '',
      usuarioBloqueio: editingEmpresa.usuarioBloqueio || '',
      observacoesBloqueio: editingEmpresa.observacoesBloqueio || ''
    };

    const finalEmpresa = sanitizeToUpper(rawEmpresa, ['id', 'email', 'horariosFuncionamento', 'horariosAssistencia', 'responsaveisTecnicos']);
    storageService.saveEmpresa(finalEmpresa);
    setIsModalOpen(false);
    setEditingEmpresa(null);

    if (isEditing) {
      toastService.edit(
        'Empresa Atualizada',
        `Os dados de ${finalEmpresa.razaoSocial} (${finalEmpresa.inscricao}) foram salvos. Condição: ${finalEmpresa.condicao}.`
      );
    } else {
      toastService.success(
        'Empresa Registrada',
        `Nova inscrição PJ gerada: ${finalEmpresa.razaoSocial} (${finalEmpresa.inscricao}). Condição: ${finalEmpresa.condicao}.`
      );
    }
  };

  const handleConfirmDelete = () => {
    if (!empresaToDelete) return;
    storageService.deleteEmpresa(empresaToDelete.id);
    toastService.delete(
      'Empresa Excluída',
      `O registro de ${empresaToDelete.razaoSocial} (${empresaToDelete.inscricao}) foi removido.`
    );
    setEmpresaToDelete(null);
  };

  // SÓCIOS (QSA) HANDLERS
  const handleOpenNewSocio = () => {
    setEditingSocioIndex(null);
    setEditingSocio({
      nome: '',
      cpf: '',
      rg: '',
      participacaoPct: 50,
      tipo: 'Administrador'
    });
    setIsSocioModalOpen(true);
  };

  const handleOpenEditSocio = (socio: Socio, index: number) => {
    setEditingSocioIndex(index);
    setEditingSocio({ ...socio });
    setIsSocioModalOpen(true);
  };

  const handleSaveSocio = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSocio.nome || !editingSocio.cpf) {
      toastService.warning('Campos Obrigatórios', 'Informe o Nome e CPF do sócio.');
      return;
    }

    const currentSocios = [...(editingEmpresa?.socios || [])];
    const newSocioData: Socio = {
      nome: editingSocio.nome.trim().toUpperCase(),
      cpf: editingSocio.cpf.trim(),
      rg: (editingSocio.rg || '').toUpperCase(),
      participacaoPct: Number(editingSocio.participacaoPct) || 0,
      tipo: editingSocio.tipo || 'Cotista'
    };

    if (editingSocioIndex !== null) {
      currentSocios[editingSocioIndex] = newSocioData;
    } else {
      currentSocios.push(newSocioData);
    }

    setEditingEmpresa(prev => ({ ...prev, socios: currentSocios }));
    setIsSocioModalOpen(false);
    toastService.success('Quadro de Sócios Atualizado', `Sócio "${newSocioData.nome}" incluído/atualizado.`);
  };

  const handleRemoveSocio = (index: number) => {
    const currentSocios = [...(editingEmpresa?.socios || [])];
    const removed = currentSocios.splice(index, 1);
    setEditingEmpresa(prev => ({ ...prev, socios: currentSocios }));
    toastService.info('Sócio Removido', `Sócio "${removed[0]?.nome}" foi retirado da sociedade.`);
  };

  // RT & HORÁRIOS DE ASSISTÊNCIA INDIVIDUAIS HANDLERS
  const handleOpenNewRtModal = () => {
    setEditingRtData(null);
    setEditingRtIndex(null);
    setIsRtEditorModalOpen(true);
  };

  const handleOpenEditRtModal = (rt: ResponsavelTecnico, index: number) => {
    setEditingRtData(rt);
    setEditingRtIndex(index);
    setIsRtEditorModalOpen(true);
  };

  const handleSaveRt = (savedRt: ResponsavelTecnico) => {
    const currentRts = [...(editingEmpresa?.responsaveisTecnicos || [])];
    if (editingRtIndex !== null && editingRtIndex >= 0 && editingRtIndex < currentRts.length) {
      currentRts[editingRtIndex] = savedRt;
    } else {
      const existingIdx = currentRts.findIndex(rt => 
        rt.profissionalId === savedRt.profissionalId || 
        rt.profissionalInscricao === savedRt.profissionalInscricao
      );
      if (existingIdx >= 0) {
        currentRts[existingIdx] = savedRt;
      } else {
        currentRts.push(savedRt);
      }
    }
    setEditingEmpresa(prev => ({ ...prev, responsaveisTecnicos: currentRts }));
    toastService.success(
      'Farmacêutico Configurado', 
      `${savedRt.profissionalNome} (${savedRt.cargo}) registrado com ${savedRt.cargaHorariaSemanal}h/semana de assistência.`
    );
  };

  const handleRemoveRtFromEmpresa = (index: number) => {
    const currentRts = [...(editingEmpresa?.responsaveisTecnicos || [])];
    const removed = currentRts.splice(index, 1);
    setEditingEmpresa(prev => ({ ...prev, responsaveisTecnicos: currentRts }));
    toastService.info('Baixa de RT Efetuada', `O vínculo com ${removed[0]?.profissionalNome} foi encerrado.`);
  };

  // Posição Financeira da Empresa
  const targetDoc = editingEmpresa?.cnpj || selectedEmpresa?.cnpj || '';
  const targetInsc = editingEmpresa?.inscricao || selectedEmpresa?.inscricao || '';
  const posicaoFin = storageService.getPosicaoFinanceira(targetDoc || targetInsc, 'EMPRESA');

  return (
    <div className="space-y-6">
      {/* Header com Estatísticas e Botões Rápidos */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center space-x-2">
            <span>CADASTRO DE EMPRESAS (PJ)</span>
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Gestão regulatória de farmácias, drogarias, distribuidoras, indústrias e outras assistências técnicas profissionais.
          </p>
        </div>

        <div className="flex items-center flex-wrap gap-2">
          <button
            onClick={handleExportCSV}
            className="flex items-center space-x-1.5 px-3 py-2 bg-white border border-slate-300 hover:bg-emerald-50 hover:border-emerald-300 text-slate-700 hover:text-emerald-800 rounded-xl font-bold text-xs uppercase shadow-2xs transition-all cursor-pointer"
            title="Exportar base filtrada para planilha Excel/CSV"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>EXPORTAR EXCEL</span>
          </button>

          <button
            onClick={handleExportPDF}
            className="flex items-center space-x-1.5 px-3 py-2 bg-white border border-slate-300 hover:bg-rose-50 hover:border-rose-300 text-slate-700 hover:text-rose-800 rounded-xl font-bold text-xs uppercase shadow-2xs transition-all cursor-pointer"
            title="Exportar base filtrada para relatório em PDF Oficial"
          >
            <FileText className="w-4 h-4 text-rose-600" />
            <span>EXPORTAR PDF</span>
          </button>

          <button
            onClick={handleOpenNewModal}
            className="flex items-center space-x-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs shadow-md shadow-blue-500/20 uppercase transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>NOVA EMPRESA</span>
          </button>
        </div>
      </div>

      {/* Barra de Filtros com Busca Persistente e Filtros Expansíveis */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3 text-xs">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="BUSCAR RAZÃO, FANTASIA, CNPJ..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs uppercase font-medium focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
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
            {(searchTerm || condicaoFilter !== 'Todos' || situacaoFilter !== 'Todos' || tipoFilter !== 'Todos' || tipoEmpresaFilter !== 'Todos' || categoriaEmpresaFilter !== 'Todos' || cepFilter || enderecoFilter || bairroFilter || cidadeFilter !== 'Todos' || emailFilter || telefoneFilter || socioFilter || profissionalFilter || naturezaFilter || isentoAnuidadeFilter !== 'Todos' || anuidadeReduzidaFilter !== 'Todos' || recadastradoFilter !== 'Todos' || isentoTaxaCertificadoFilter !== 'Todos' || assistenciaPlenaFilter !== 'Todos' || bloqueadoFilter !== 'Todos' || motivoBloqueioFilter || dataBloqueioFilter) && (
              <button
                onClick={handleClearFilters}
                className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs uppercase transition-colors cursor-pointer"
                title="Limpar todos os filtros"
              >
                Limpar
              </button>
            )}
          </div>
        </div>

        {/* Filtros Avançados Expansíveis */}
        {showFilters && (
          <div className="pt-3 border-t border-slate-100 space-y-4 animate-in fade-in duration-150">
            {/* Bloco 1: Identificação & Classificação */}
            <div>
              <span className="text-[10px] font-bold text-blue-800 uppercase tracking-wider block mb-1.5">
                1. Classificação & Situação
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-2.5">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Condição</label>
                  <select
                    value={condicaoFilter}
                    onChange={(e) => setCondicaoFilter(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-xl text-xs uppercase font-semibold text-slate-800"
                  >
                    <option value="Todos">TODAS</option>
                    <option value="Regular">REGULAR</option>
                    <option value="Irregular">IRREGULAR</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Situação da Empresa</label>
                  <select
                    value={situacaoFilter}
                    onChange={(e) => setSituacaoFilter(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-xl text-xs uppercase font-semibold text-slate-800"
                  >
                    <option value="Todos">TODAS</option>
                    {cadastrosSituacoesEmpresa.map(s => (
                      <option key={s.id} value={s.nome}>{s.nome.toUpperCase()}</option>
                    ))}
                    {!cadastrosSituacoesEmpresa.some(s => s.nome.toLowerCase() === 'definitiva') && <option value="Definitiva">DEFINITIVA</option>}
                    {!cadastrosSituacoesEmpresa.some(s => s.nome.toLowerCase() === 'provisória') && <option value="Provisória">PROVISÓRIA</option>}
                    {!cadastrosSituacoesEmpresa.some(s => s.nome.toLowerCase() === 'fechada mot. desc.') && <option value="Fechada Mot. Desc.">FECHADA MOT. DESC.</option>}
                    {!cadastrosSituacoesEmpresa.some(s => s.nome.toLowerCase() === 'extinta') && <option value="Extinta">EXTINTA</option>}
                    {!cadastrosSituacoesEmpresa.some(s => s.nome.toLowerCase() === 'baixada') && <option value="Baixada">BAIXADA</option>}
                    {!cadastrosSituacoesEmpresa.some(s => s.nome.toLowerCase() === 'suspensa') && <option value="Suspensa">SUSPENSA</option>}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Tipo Estabelecimento</label>
                  <select
                    value={tipoFilter}
                    onChange={(e) => setTipoFilter(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-xl text-xs uppercase font-semibold text-slate-800"
                  >
                    <option value="Todos">TODOS OS RAMOS</option>
                    {cadastrosTiposEmpresa.map(t => (
                      <option key={t.id} value={t.nome}>{t.nome.toUpperCase()}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Estabelecimento: Privado, Público, Filantrópico</label>
                  <select
                    value={tipoEmpresaFilter}
                    onChange={(e) => setTipoEmpresaFilter(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-xl text-xs uppercase font-semibold text-slate-800"
                  >
                    <option value="Todos">TODOS</option>
                    <option value="Privado">PRIVADO</option>
                    <option value="Público">PÚBLICO</option>
                    <option value="Filantrópico">FILANTRÓPICO</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Categoria da Empresa</label>
                  <input
                    type="text"
                    list="lista-categorias-empresa"
                    placeholder="MICROEMPRESA, MEI, EPP..."
                    value={categoriaEmpresaFilter}
                    onChange={(e) => setCategoriaEmpresaFilter(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-xl text-xs uppercase font-medium"
                  />
                  <datalist id="lista-categorias-empresa">
                    <option value="Microempresa (ME)" />
                    <option value="Empresa de Pequeno Porte (EPP)" />
                    <option value="Microempreendedor Individual (MEI)" />
                    <option value="Médio / Grande Porte" />
                    <option value="Comércio Varejista" />
                    <option value="Distribuidora" />
                    <option value="Farmácia com Manipulação" />
                    <option value="Drogaria" />
                    <option value="Hospital / Clínica" />
                    <option value="Indústria" />
                  </datalist>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Natureza da Atividade</label>
                  <select
                    value={naturezaFilter}
                    onChange={(e) => setNaturezaFilter(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-xl uppercase font-semibold text-xs text-slate-700"
                  >
                    <option value="">TODAS AS NATUREZAS</option>
                    {cadastrosNaturezaAtividade.map(nat => (
                      <option key={nat.id} value={nat.nome}>{nat.nome.toUpperCase()}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Bloco 2: Localização & Contatos */}
            <div>
              <span className="text-[10px] font-bold text-blue-800 uppercase tracking-wider block mb-1.5">
                2. Localização & Contato
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-2.5">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Município</label>
                  <select
                    value={cidadeFilter}
                    onChange={(e) => setCidadeFilter(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-xl text-xs uppercase font-semibold text-slate-800"
                  >
                    <option value="Todos">TODOS OS MUNICÍPIOS</option>
                    {cadastrosMunicipios.map(m => (
                      <option key={m.id} value={m.nome}>{m.nome.toUpperCase()}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Bairro</label>
                  <input
                    type="text"
                    placeholder="FILTRAR BAIRRO..."
                    value={bairroFilter}
                    onChange={(e) => setBairroFilter(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-xl text-xs uppercase font-medium"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">CEP</label>
                  <input
                    type="text"
                    placeholder="00000-000..."
                    value={cepFilter}
                    onChange={(e) => setCepFilter(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-xl text-xs uppercase font-medium font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Endereço / Logradouro</label>
                  <input
                    type="text"
                    placeholder="RUA, AVENIDA..."
                    value={enderecoFilter}
                    onChange={(e) => setEnderecoFilter(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-xl uppercase font-medium text-xs"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Telefone</label>
                  <input
                    type="text"
                    placeholder="(92) 0000-0000..."
                    value={telefoneFilter}
                    onChange={(e) => setTelefoneFilter(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-xl text-xs uppercase font-medium font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">E-mail</label>
                  <input
                    type="text"
                    placeholder="EMAIL@EMPRESA..."
                    value={emailFilter}
                    onChange={(e) => setEmailFilter(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-xl text-xs lowercase font-medium"
                  />
                </div>
              </div>
            </div>

            {/* Bloco 3: RT & Sócios */}
            <div>
              <span className="text-[10px] font-bold text-blue-800 uppercase tracking-wider block mb-1.5">
                3. Responsável Técnico & Quadro Societário (QSA)
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Pesquisar pelo RT (Nome, Inscrição ou CPF)</label>
                  <input
                    type="text"
                    placeholder="DIGITE O NOME, NÚMERO DE INSCRIÇÃO OU CPF DO RT..."
                    value={profissionalFilter}
                    onChange={(e) => setProfissionalFilter(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-xl uppercase font-medium text-xs"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Pesquisar por Sócio (Nome ou CPF)</label>
                  <input
                    type="text"
                    placeholder="DIGITE O NOME OU CPF DO SÓCIO..."
                    value={socioFilter}
                    onChange={(e) => setSocioFilter(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-xl uppercase font-medium text-xs"
                  />
                </div>
              </div>
            </div>

            {/* Bloco 4: Parâmetros & Isenções Regulatórias */}
            <div>
              <span className="text-[10px] font-bold text-blue-800 uppercase tracking-wider block mb-1.5">
                4. Parâmetros & Isenções
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Assistência Plena</label>
                  <select
                    value={assistenciaPlenaFilter}
                    onChange={(e) => setAssistenciaPlenaFilter(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-xl text-xs uppercase font-semibold text-slate-800"
                  >
                    <option value="Todos">TODOS</option>
                    <option value="Sim">SIM (PLENA)</option>
                    <option value="Não">NÃO (PARCIAL)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Isento de Anuidade</label>
                  <select
                    value={isentoAnuidadeFilter}
                    onChange={(e) => setIsentoAnuidadeFilter(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-xl text-xs uppercase font-semibold text-slate-800"
                  >
                    <option value="Todos">TODOS</option>
                    <option value="Sim">SIM (ISENTO)</option>
                    <option value="Não">NÃO</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Anuidade Reduzida</label>
                  <select
                    value={anuidadeReduzidaFilter}
                    onChange={(e) => setAnuidadeReduzidaFilter(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-xl text-xs uppercase font-semibold text-slate-800"
                  >
                    <option value="Todos">TODOS</option>
                    <option value="Sim">SIM (REDUZIDA)</option>
                    <option value="Não">NÃO</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Recadastrado</label>
                  <select
                    value={recadastradoFilter}
                    onChange={(e) => setRecadastradoFilter(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-xl text-xs uppercase font-semibold text-slate-800"
                  >
                    <option value="Todos">TODOS</option>
                    <option value="Sim">SIM</option>
                    <option value="Não">NÃO</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Isento Taxa CRT</label>
                  <select
                    value={isentoTaxaCertificadoFilter}
                    onChange={(e) => setIsentoTaxaCertificadoFilter(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-xl text-xs uppercase font-semibold text-slate-800"
                  >
                    <option value="Todos">TODOS</option>
                    <option value="Sim">SIM (ISENTO)</option>
                    <option value="Não">NÃO</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Bloco 5: Controle de Bloqueio do Estabelecimento */}
            <div className="p-3 bg-red-50/50 border border-red-200/80 rounded-xl space-y-2">
              <span className="text-[10px] font-bold text-red-900 uppercase tracking-wider block">
                5. Status de Bloqueio do Estabelecimento
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <div>
                  <label className="block text-[10px] font-bold text-slate-700 uppercase mb-1">Status de Bloqueio</label>
                  <select
                    value={bloqueadoFilter}
                    onChange={(e) => setBloqueadoFilter(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-xl text-xs uppercase font-semibold text-slate-800"
                  >
                    <option value="Todos">TODOS OS STATUS</option>
                    <option value="Sim">🔒 APENAS BLOQUEADAS</option>
                    <option value="Não">🟢 APENAS DESBLOQUEADAS / ATIVAS</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-700 uppercase mb-1">Motivo do Bloqueio</label>
                  <input
                    type="text"
                    placeholder="MOTIVO (EX: INADIMPLÊNCIA, ÉTICO)..."
                    value={motivoBloqueioFilter}
                    onChange={(e) => setMotivoBloqueioFilter(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-xl text-xs uppercase font-medium"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-700 uppercase mb-1">Data do Bloqueio</label>
                  <input
                    type="date"
                    value={dataBloqueioFilter}
                    onChange={(e) => setDataBloqueioFilter(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-mono"
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Barra Informativa de Empresas Filtradas */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center flex-wrap gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-800 text-xs font-bold uppercase tracking-wide shadow-2xs">
            <Building2 className="w-3.5 h-3.5 text-blue-600" />
            <span>{empresas.length} empresas filtradas</span>
          </span>
          {totalGeralEmpresas > 0 && (
            <span className="text-xs text-slate-500 font-medium">
              (de um total de {totalGeralEmpresas} cadastradas no conselho)
            </span>
          )}
        </div>
      </div>

      {/* Tabela de Empresas */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold uppercase text-[10px]">
                <th className="py-3 px-4">INSCRIÇÃO / CNPJ</th>
                <th className="py-3 px-4">ESTABELECIMENTO</th>
                <th className="py-3 px-4">TIPO / RAMO</th>
                <th className="py-3 px-4 text-center">HORAS / ASSISTÊNCIA</th>
                <th className="py-3 px-4 text-center">CONDIÇÃO</th>
                <th className="py-3 px-4 text-center">CRT</th>
                <th className="py-3 px-4 text-right">AÇÕES</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
              {empresas.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400 uppercase">
                    Nenhuma empresa encontrada com os filtros informados.
                  </td>
                </tr>
              ) : (
                empresas.map((empresa) => (
                  <tr key={empresa.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold">
                      <div className="flex items-center gap-1.5">
                        <span className="text-blue-700">{empresa.inscricao}</span>
                        {(storageService.isSituacaoProvisoria(empresa.situacao) || empresa.inscricao?.includes('PROV') || Boolean(empresa.dtVencInscProvisoria)) && (
                          <span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 text-[9px] font-bold border border-amber-300 uppercase shrink-0">
                            PROV
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-slate-400 font-normal">{maskCNPJ(empresa.cnpj)}</div>
                    </td>

                    <td className="py-3 px-4 uppercase">
                      <div className="flex items-center gap-2">
                        <div className="font-bold text-slate-900">{empresa.razaoSocial}</div>
                        {empresa.bloqueado && (
                          <span className="px-2 py-0.5 rounded bg-rose-600 text-white font-bold text-[9px] uppercase">
                            🔴 EMPRESA BLOQUEADA
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-slate-500 font-normal">{empresa.nomeFantasia || empresa.razaoSocial}</div>
                    </td>

                    <td className="py-3 px-4 uppercase">
                      <span className="font-semibold text-slate-800">{empresa.tipoEstabelecimento}</span>
                      <span className="text-[10px] text-slate-400 block">{empresa.cidade}/{empresa.uf}</span>
                    </td>

                    <td className="py-3 px-4 text-center">
                      <div className="font-mono text-[11px] font-bold">
                        <span className="text-blue-700">{empresa.cargaHorariaFuncionamentoSemanal || 0}h</span>
                        <span className="text-slate-400 mx-1">/</span>
                        <span className="text-emerald-700">{empresa.cargaHorariaAssistenciaSemanal || 0}h RT</span>
                      </div>
                      <span className="text-[9px] text-slate-400 uppercase">
                        {empresa.responsaveisTecnicos?.length || 0} RT(s)
                      </span>
                    </td>

                    <td className="py-3 px-4 text-center">
                      <span className={`px-2.5 py-1 rounded-md font-bold text-[10px] uppercase shadow-2xs ${
                        empresa.condicao === 'Regular'
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                          : 'bg-rose-50 text-rose-800 border border-rose-200'
                      }`}>
                        {empresa.condicao}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-center">
                      {empresa.condicao === 'Regular' ? (
                        <button
                          onClick={() => onOpenCrtModal && onOpenCrtModal(empresa)}
                          className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-lg font-bold text-[10px] uppercase flex items-center space-x-1 mx-auto cursor-pointer transition-colors"
                          title="Visualizar e Imprimir Certidão de Regularidade Técnica"
                        >
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                          <span>EMITIR CRT</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => onOpenCrtModal && onOpenCrtModal(empresa)}
                          className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg font-bold text-[10px] uppercase flex items-center space-x-1 mx-auto cursor-pointer transition-colors"
                          title={`Emissão Bloqueada: Estabelecimento ${empresa.condicao}`}
                        >
                          <Lock className="w-3.5 h-3.5 text-rose-600" />
                          <span>CRT BLOQUEADA</span>
                        </button>
                      )}
                    </td>

                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end space-x-1.5">
                        <button
                          onClick={() => setSelectedEmpresa(empresa)}
                          title="VER DETALHES COMPLETOS"
                          className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleOpenEditModal(empresa)}
                          title="EDITAR CADASTRO"
                          className="p-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg border border-blue-200 transition-colors cursor-pointer"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setEmpresaToDelete(empresa)}
                          title="EXCLUIR REGISTRO"
                          className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg border border-rose-200 transition-colors cursor-pointer"
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
      </div>

      {/* Modal Visualizar Cadastro Empresa */}
      {selectedEmpresa && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-3xl w-full my-6 max-h-[90vh] overflow-y-auto shadow-2xl p-4 sm:p-6 text-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold shrink-0">
                  <Building2 className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900 uppercase">{selectedEmpresa.razaoSocial}</h2>
                  <div className="flex flex-wrap items-center gap-2 text-slate-500 font-medium uppercase text-[11px] mt-0.5">
                    <span className="font-mono font-bold text-blue-700">{selectedEmpresa.inscricao}</span>
                    <span>•</span>
                    <span className="font-mono">{maskCNPJ(selectedEmpresa.cnpj)}</span>
                    <span>•</span>
                    <span className={`font-bold px-2 py-0.5 rounded-md ${
                      selectedEmpresa.condicao === 'Regular'
                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                        : 'bg-rose-50 text-rose-800 border border-rose-200'
                    }`}>
                      {selectedEmpresa.condicao}
                    </span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setSelectedEmpresa(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Diagnóstico de Regularidade Sanitária */}
            <div className={`p-4 rounded-xl border space-y-1.5 ${
              selectedEmpresa.condicao === 'Regular'
                ? 'bg-emerald-50/80 border-emerald-300 text-emerald-950'
                : 'bg-rose-50/80 border-rose-300 text-rose-950'
            }`}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 border-b border-black/10 pb-1.5">
                <div className="flex items-center space-x-2">
                  <Scale className="w-4 h-4 text-slate-700" />
                  <span className="font-extrabold uppercase text-xs">
                    AUDITORIA CRF: CONDIÇÃO {selectedEmpresa.condicao}
                  </span>
                </div>
                <div className="flex items-center gap-2 font-mono text-[10px] font-bold">
                  <span>FUNCIONAMENTO: {selectedEmpresa.cargaHorariaFuncionamentoSemanal || 0}H/SEM</span>
                  <span>•</span>
                  <span>ASSISTÊNCIA RTS: {selectedEmpresa.cargaHorariaAssistenciaSemanal || 0}H/SEM</span>
                </div>
              </div>
              <p className="text-[11px] font-semibold text-slate-800 leading-relaxed">
                {selectedEmpresa.justificativaCondicao || 
                  (selectedEmpresa.condicao === 'Regular' 
                    ? `O estabelecimento cumpre integralmente as exigências de assistência farmacêutica para ${selectedEmpresa.cidade}.`
                    : `Carga horária de assistência farmacêutica insuficiente ou sem farmacêutico RT habilitado.`)}
              </p>
            </div>

            {/* Bloco de Bloqueio (se houver) */}
            {selectedEmpresa.bloqueado && (
              <div className="p-4 rounded-xl border border-red-300 bg-red-50 text-red-950 space-y-2 uppercase text-xs">
                <div className="flex items-center justify-between font-bold pb-1.5 border-b border-red-200">
                  <span className="flex items-center space-x-1.5 text-red-700">
                    <ShieldAlert className="w-4 h-4" />
                    <span>ESTABELECIMENTO COM BLOQUEIO CADASTRAL ATIVO</span>
                  </span>
                  <span className="px-2.5 py-0.5 rounded bg-red-600 text-white font-bold text-[10px]">BLOQUEADO</span>
                </div>
                <div><span className="text-slate-500">MOTIVO DO BLOQUEIO:</span> <strong className="text-red-900">{selectedEmpresa.motivoBloqueio || 'NÃO INFORMADO'}</strong></div>
                <div className="grid grid-cols-2 gap-2 font-mono">
                  <div><span className="text-slate-500">DATA BLOQUEIO:</span> {selectedEmpresa.dataBloqueio || '-'}</div>
                  <div><span className="text-slate-500">PREVISÃO DESBLOQUEIO:</span> {selectedEmpresa.dataDesbloqueioPrevista || 'NÃO INFORMADA'}</div>
                </div>
                <div><span className="text-slate-500">AUTORIDADE RESPONSÁVEL:</span> {selectedEmpresa.usuarioBloqueio || '-'}</div>
                {selectedEmpresa.observacoesBloqueio && (
                  <div><span className="text-slate-500">JUSTIFICATIVA:</span> {selectedEmpresa.observacoesBloqueio}</div>
                )}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1.5 uppercase">
                <div className="font-bold text-blue-900 uppercase text-[10px] pb-1 border-b border-slate-200">
                  DADOS DO ESTABELECIMENTO
                </div>
                <div><span className="text-slate-400">FANTASIA:</span> <strong className="text-slate-800">{selectedEmpresa.nomeFantasia}</strong></div>
                <div><span className="text-slate-400">RAMO:</span> <span className="text-slate-800">{selectedEmpresa.tipoEstabelecimento}</span></div>
                <div><span className="text-slate-400">TIPO:</span> <span className="text-slate-800">{selectedEmpresa.tipoEmpresa}</span></div>
                <div><span className="text-slate-400">CAPITAL SOCIAL:</span> <span className="text-slate-800 font-mono">R$ {Number(selectedEmpresa.capitalSocial).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span></div>
                <div><span className="text-slate-400">ENDEREÇO:</span> <span className="text-slate-800">{selectedEmpresa.endereco}, {selectedEmpresa.bairro} - {selectedEmpresa.cidade}/{selectedEmpresa.uf} (CEP: {selectedEmpresa.cep})</span></div>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1.5 uppercase">
                <div className="font-bold text-blue-900 uppercase text-[10px] pb-1 border-b border-slate-200">
                  CERTIDÃO & REGULARIDADE (CRT)
                </div>
                <div><span className="text-slate-400">NÚMERO CRT:</span> <strong className="text-slate-800 font-mono">{selectedEmpresa.numeroCRT}</strong></div>
                <div><span className="text-slate-400">VALIDADE CRT:</span> <span className="text-slate-800">{selectedEmpresa.validadeCRT}</span></div>
                <div><span className="text-slate-400">ASSISTÊNCIA PLENA:</span> <span className="font-bold text-emerald-700">{selectedEmpresa.assistenciaPlena ? 'SIM (COBERTURA INTEGRAL)' : 'PARCIAL'}</span></div>
                <div><span className="text-slate-400">TELEFONE:</span> <span className="text-slate-800 font-mono">{selectedEmpresa.telefone}</span></div>
                <div><span className="text-slate-400">E-MAIL:</span> <span className="text-slate-800 lowercase font-mono">{selectedEmpresa.email}</span></div>
              </div>
            </div>

            {/* Horário de Funcionamento da Empresa */}
            <div className="border border-slate-200 rounded-xl p-3.5 bg-white space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900 uppercase text-[11px] flex items-center space-x-1.5">
                  <Clock className="w-4 h-4 text-blue-600" />
                  <span>Horário de Funcionamento do Estabelecimento</span>
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 bg-blue-50 text-blue-700 font-bold rounded-md">
                  {selectedEmpresa.cargaHorariaFuncionamentoSemanal || 0}H / SEMANA
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-7 gap-1.5">
                {DEFAULT_HORARIOS_FUNCIONAMENTO.map((defHf, hIdx) => {
                  const hf = (selectedEmpresa.horariosFuncionamento || []).find(h => h.dia.toLowerCase().slice(0, 3) === defHf.dia.toLowerCase().slice(0, 3)) || defHf;
                  const isAtivo = hf.ativo !== false && (hf.inicio1 || hf.inicio2);
                  return (
                    <div key={hIdx} className={`p-2 rounded-xl border text-center ${
                      isAtivo ? 'bg-blue-50/70 border-blue-200 text-blue-950' : 'bg-slate-100 border-slate-200 text-slate-400'
                    }`}>
                      <div className="font-bold uppercase text-[10px]">{hf.dia}</div>
                      <div className="text-[9px] font-mono mt-0.5">
                        {isAtivo ? (
                          <>
                            {hf.inicio1 && hf.fim1 ? `${hf.inicio1}-${hf.fim1}` : ''}
                            {hf.inicio2 && hf.fim2 ? <><br />{hf.inicio2}-{hf.fim2}</> : ''}
                          </>
                        ) : (
                          'FECHADO'
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Quadro Técnico (RT) com Horários Individuais */}
            <div className="border border-slate-200 rounded-xl p-3.5 bg-white space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900 uppercase text-[11px] flex items-center space-x-1.5">
                  <UserCheck className="w-4 h-4 text-emerald-600" />
                  <span>Quadro de Farmacêuticos & Assistência Técnica (RTs)</span>
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 bg-emerald-50 text-emerald-700 font-bold rounded-md">
                  {selectedEmpresa.responsaveisTecnicos?.length || 0} PROFISSIONAIS
                </span>
              </div>

              {(!selectedEmpresa.responsaveisTecnicos || selectedEmpresa.responsaveisTecnicos.length === 0) ? (
                <p className="text-rose-600 font-semibold uppercase text-[11px] py-1">
                  ATENÇÃO: ESTE ESTABELECIMENTO ESTÁ SEM RESPONSÁVEL TÉCNICO VINCULADO!
                </p>
              ) : (
                <div className="space-y-2">
                  {selectedEmpresa.responsaveisTecnicos.map((rt, idx) => {
                    const prof = storageService.getProfissionais().find(p => p.id === rt.profissionalId || p.inscricao === rt.profissionalInscricao);
                    const impedimento = prof ? storageService.isProfissionalImpedidoRT(prof) : { impedido: false };
                    const isBlockedOrImpeded = prof ? (prof.bloqueado || impedimento.impedido) : false;

                    return (
                      <div key={idx} className={`p-3 rounded-xl border space-y-1.5 ${
                        isBlockedOrImpeded ? 'bg-rose-50/80 border-rose-300' : 'bg-slate-50 border-slate-200'
                      }`}>
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-900 uppercase">{rt.profissionalNome}</span>
                              {isBlockedOrImpeded && (
                                <span className="px-2 py-0.5 rounded bg-rose-600 text-white font-bold text-[9px] uppercase flex items-center gap-1">
                                  <ShieldAlert className="w-3 h-3" />
                                  <span>{prof?.bloqueado ? 'PROFISSIONAL BLOQUEADO' : `IMPEDIDO (${prof?.situacao})`}</span>
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] text-slate-500 font-mono block">
                              INSCRIÇÃO: {rt.profissionalInscricao} | FUNÇÃO: {rt.cargo} | VÍNCULO: {rt.situacaoVinculo || 'CTPS'}
                            </span>
                            {isBlockedOrImpeded && (
                              <p className="text-[10px] text-rose-700 font-bold uppercase mt-1">
                                ⚠️ Vínculo mantido, porém a hora trabalhada NÃO ESTÁ SENDO COMPUTADA (Profissional bloqueado ou em situação impeditiva).
                              </p>
                            )}
                          </div>
                          <span className={`text-xs font-mono font-bold px-2.5 py-1 rounded-lg border ${
                            isBlockedOrImpeded ? 'bg-rose-100 text-rose-800 border-rose-300 line-through' : 'bg-white text-emerald-700 border-emerald-200'
                          }`}>
                            {isBlockedOrImpeded ? '0h (Não computada)' : `${rt.cargaHorariaSemanal}h / sem`}
                          </span>
                        </div>

                        {/* Mini visualização dos horários */}
                        <div className="grid grid-cols-7 gap-1 text-[9px] font-mono text-center pt-1 border-t border-slate-200/60">
                          {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((dia) => {
                            const h = rt.horarios?.find(item => item.dia.toLowerCase().startsWith(dia.toLowerCase()));
                            const isActive = h && h.ativo !== false && h.inicio1;
                            return (
                              <div key={dia} className={`p-1 rounded ${isActive ? 'bg-emerald-100/70 text-emerald-900 font-bold' : 'bg-slate-200/50 text-slate-400'}`}>
                                <div>{dia}</div>
                                <div className="text-[8px]">{isActive ? `${h.inicio1}-${h.fim1}` : '-'}</div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Quadro Societário (QSA) */}
            <div className="border border-slate-200 rounded-xl p-3.5 bg-white space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900 uppercase text-[11px] flex items-center space-x-1.5">
                  <Users className="w-4 h-4 text-blue-600" />
                  <span>Quadro de Sócios e Administradores (QSA)</span>
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 bg-blue-50 text-blue-700 font-bold rounded-md">
                  {selectedEmpresa.socios?.length || 0} SÓCIOS REGISTRADOS
                </span>
              </div>

              {(!selectedEmpresa.socios || selectedEmpresa.socios.length === 0) ? (
                <p className="text-slate-400 italic uppercase text-[11px] py-1">Nenhum sócio informado.</p>
              ) : (
                <div className="space-y-1.5">
                  {selectedEmpresa.socios.map((s, idx) => (
                    <div key={idx} className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between">
                      <div>
                        <span className="font-bold text-slate-900 uppercase">{s.nome}</span>
                        <span className="text-[10px] text-slate-500 font-mono block">
                          CPF: {maskCPF(s.cpf)} | TIPO: {s.tipo}
                        </span>
                      </div>
                      <span className="text-xs font-mono font-bold text-blue-700 px-2.5 py-1 bg-blue-50 rounded-md">
                        {s.participacaoPct}%
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => {
                  const toEdit = selectedEmpresa;
                  setSelectedEmpresa(null);
                  handleOpenEditModal(toEdit);
                }}
                className="w-full sm:w-auto flex items-center justify-center space-x-1.5 px-3.5 py-2 rounded-xl bg-blue-50 text-blue-700 border border-blue-200 font-bold hover:bg-blue-100 uppercase cursor-pointer"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>EDITAR CADASTRO PJ</span>
              </button>

              {selectedEmpresa.condicao === 'Regular' ? (
                <button
                  onClick={() => onOpenCrtModal && onOpenCrtModal(selectedEmpresa)}
                  className="w-full sm:w-auto flex items-center justify-center space-x-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold uppercase shadow-sm cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>GERAR CERTIDÃO DE REGULARIDADE (CRT)</span>
                </button>
              ) : (
                <button
                  onClick={() => onOpenCrtModal && onOpenCrtModal(selectedEmpresa)}
                  className="w-full sm:w-auto flex items-center justify-center space-x-1.5 px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-300 rounded-xl font-bold uppercase cursor-pointer"
                  title="Certidão bloqueada devido à condição do estabelecimento"
                >
                  <Lock className="w-4 h-4 text-rose-600" />
                  <span>CRT BLOQUEADA ({selectedEmpresa.condicao.toUpperCase()})</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal Criar / Editar Empresa */}
      {isModalOpen && editingEmpresa && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-4xl w-full my-4 max-h-[94vh] overflow-y-auto shadow-2xl p-4 sm:p-6 text-xs space-y-4">
            {/* Cabeçalho do Modal */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-sm sm:text-base font-bold text-slate-900 uppercase">
                    {editingEmpresa.id ? 'EDITAR ESTABELECIMENTO (PJ)' : 'CADASTRAR NOVO ESTABELECIMENTO FARMACÊUTICO'}
                  </h2>
                  <p className="text-[11px] text-slate-500 font-mono">
                    INSCRIÇÃO: {editingEmpresa.inscricao || 'GERADA AUTOMATICAMENTE'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setIsModalOpen(false);
                  setEditingEmpresa(null);
                }}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Inscription PJ Cronológica Box with Definitiva / Provisória Toggle */}
            {!editingEmpresa.id ? (
              <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center space-x-2.5">
                    <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center font-mono text-xs shrink-0">
                      <Hash className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-[10px] text-blue-700 font-bold uppercase block">Inscrição Cronológica Automática:</span>
                      <span className="font-mono font-extrabold text-blue-900 text-sm">{editingEmpresa.inscricao}</span>
                    </div>
                  </div>

                   {/* Toggle Definitiva vs Provisória PJ */}
                  <div className="flex items-center gap-1 bg-white p-1 rounded-lg border border-blue-200 shadow-2xs shrink-0">
                    <button
                      type="button"
                      onClick={() => handleSelectTipoInscricaoPJ('Definitiva')}
                      className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase transition-all cursor-pointer ${
                        !storageService.isSituacaoProvisoria(editingEmpresa.situacao)
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      Definitiva
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSelectTipoInscricaoPJ('Provisória')}
                      className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase transition-all cursor-pointer ${
                        storageService.isSituacaoProvisoria(editingEmpresa.situacao)
                          ? 'bg-amber-600 text-white shadow-xs'
                          : 'text-amber-800 hover:bg-amber-50'
                      }`}
                    >
                      Provisória
                    </button>
                  </div>
                </div>

                {storageService.isSituacaoProvisoria(editingEmpresa.situacao) && (
                  <div className="text-[10px] text-amber-900 bg-amber-100/70 border border-amber-300 p-2 rounded-lg flex items-center justify-between">
                    <span>
                      Inscrição Provisória PJ com validade de {councilConfig.validadeProvisoriaMesesEmpresa ?? 12} meses ({editingEmpresa.dtInicioInscProvisoria} a {editingEmpresa.dtVencInscProvisoria}).
                    </span>
                    <span className="font-bold uppercase text-[9px] bg-amber-200 px-1.5 py-0.5 rounded text-amber-900 shrink-0">
                      Provisória
                    </span>
                  </div>
                )}
              </div>
            ) : (
              (storageService.isSituacaoProvisoria(editingEmpresa.situacao) || editingEmpresa.inscricao?.includes('PROV') || Boolean(editingEmpresa.dtVencInscProvisoria)) && (
                <div className="p-3 bg-amber-50 border border-amber-300 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-start sm:items-center space-x-2.5">
                    <div className="w-7 h-7 rounded-lg bg-amber-600 text-white flex items-center justify-center font-mono text-xs shrink-0">
                      <Sparkles className="w-4 h-4 animate-pulse" />
                    </div>
                    <div>
                      <span className="text-[10px] text-amber-800 font-bold uppercase block">Inscrição Provisória Ativa: {editingEmpresa.inscricao}</span>
                      <span className="text-[11px] text-slate-600 block sm:inline">Período provisório concluído? Efetive agora para definitiva oficial gerando a próxima numeração cronológica.</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setIsModalOpen(false);
                      setEmpresaToConvertDefinitiva(editingEmpresa as Empresa);
                    }}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg uppercase shadow-xs flex items-center space-x-1.5 cursor-pointer shrink-0 self-end sm:self-auto"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Efetivar Definitiva</span>
                  </button>
                </div>
              )
            )}

            {/* Navegação por Abas */}
            <div className="flex items-center space-x-1 border-b border-slate-200 pb-2 overflow-x-auto">
              <button
                type="button"
                onClick={() => setModalTab('dados_pj')}
                className={`px-3 py-2 rounded-lg font-bold text-[11px] uppercase transition-all shrink-0 flex items-center space-x-1.5 cursor-pointer ${
                  modalTab === 'dados_pj' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Building className="w-3.5 h-3.5" />
                <span>1. Dados da Firma</span>
              </button>

              <button
                type="button"
                onClick={() => setModalTab('horarios')}
                className={`px-3 py-2 rounded-lg font-bold text-[11px] uppercase transition-all shrink-0 flex items-center space-x-1.5 cursor-pointer ${
                  modalTab === 'horarios' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Clock className="w-3.5 h-3.5 text-blue-300" />
                <span>2. Horário de Funcionamento</span>
              </button>

              <button
                type="button"
                onClick={() => setModalTab('responsaveis_rt')}
                className={`px-3 py-2 rounded-lg font-bold text-[11px] uppercase transition-all shrink-0 flex items-center space-x-1.5 cursor-pointer ${
                  modalTab === 'responsaveis_rt' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <UserCheck className="w-3.5 h-3.5" />
                <span>3. Profissionais & Assistência (RT)</span>
                {editingEmpresa.responsaveisTecnicos && editingEmpresa.responsaveisTecnicos.length > 0 && (
                  <span className={`text-[9px] font-extrabold px-1.5 py-0.2 rounded-full uppercase ml-1 ${
                    modalTab === 'responsaveis_rt' ? 'bg-white text-emerald-800' : 'bg-emerald-100 text-emerald-800'
                  }`}>
                    {editingEmpresa.responsaveisTecnicos.length}
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => setModalTab('socios_qsa')}
                className={`px-3 py-2 rounded-lg font-bold text-[11px] uppercase transition-all shrink-0 flex items-center space-x-1.5 cursor-pointer ${
                  modalTab === 'socios_qsa' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>4. Sócios (QSA)</span>
              </button>

              <button
                type="button"
                onClick={() => setModalTab('endereco')}
                className={`px-3 py-2 rounded-lg font-bold text-[11px] uppercase transition-all shrink-0 flex items-center space-x-1.5 cursor-pointer ${
                  modalTab === 'endereco' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <MapPin className="w-3.5 h-3.5" />
                <span>5. Endereço</span>
              </button>

              <button
                type="button"
                onClick={() => setModalTab('posicao_financeira')}
                className={`px-3 py-2 rounded-lg font-bold text-[11px] uppercase transition-all shrink-0 flex items-center space-x-1.5 cursor-pointer ${
                  modalTab === 'posicao_financeira' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <DollarSign className="w-3.5 h-3.5" />
                <span>6. Financeiro</span>
              </button>
              <button
                type="button"
                onClick={() => setModalTab('bloqueio')}
                className={`px-3 py-2 rounded-lg font-bold text-[11px] uppercase transition-all shrink-0 flex items-center space-x-1.5 cursor-pointer ${
                  modalTab === 'bloqueio' ? 'bg-red-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>7. Bloqueio</span>
                {editingEmpresa.bloqueado && (
                  <span className="text-[9px] font-extrabold px-1.5 py-0.2 rounded-full uppercase bg-white text-red-700 ml-1">
                    BLOQUEADA
                  </span>
                )}
              </button>
            </div>

            <form onSubmit={handleSaveEmpresa} className="space-y-4">
              {/* ABA BLOQUEIO */}
              {modalTab === 'bloqueio' && (
                <div className="space-y-4 p-4 bg-red-50/40 border border-red-200 rounded-xl">
                  <div className="flex items-center space-x-2 text-red-900 font-bold uppercase text-xs mb-2">
                    <ShieldAlert className="w-4 h-4 text-red-600" />
                    <span>Controle de Bloqueio e Restrição Cadastral do Estabelecimento (PJ)</span>
                  </div>

                  <div className="p-3 bg-white border border-red-200 rounded-xl flex items-center justify-between shadow-xs">
                    <div>
                      <span className="text-[10px] font-bold text-slate-700 uppercase block">Status de Bloqueio do Estabelecimento</span>
                      <span className={`text-xs font-bold uppercase ${editingEmpresa.bloqueado ? 'text-red-600' : 'text-emerald-600'}`}>
                        {editingEmpresa.bloqueado ? '🔒 ESTABELECIMENTO BLOQUEADO' : '🟢 ESTABELECIMENTO ATIVO / DESBLOQUEADO'}
                      </span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={Boolean(editingEmpresa.bloqueado)}
                        onChange={(e) => {
                          const isChecked = e.target.checked;
                          const todayStr = new Date().toLocaleDateString('pt-BR');
                          setEditingEmpresa(prev => prev ? ({ 
                            ...prev, 
                            bloqueado: isChecked,
                            dataBloqueio: isChecked && !prev.dataBloqueio ? todayStr : prev.dataBloqueio 
                          }) : null);
                        }}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-slate-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
                    </label>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-700 font-bold mb-1 uppercase text-[10px]">Motivo do Bloqueio</label>
                      <select
                        value={editingEmpresa.motivoBloqueio || ''}
                        onChange={(e) => setEditingEmpresa(prev => prev ? ({ ...prev, motivoBloqueio: e.target.value.toUpperCase() }) : null)}
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 uppercase font-semibold text-xs"
                      >
                        <option value="">SELECIONE O MOTIVO DO BLOQUEIO</option>
                        <option value="FALTA DE RT (RESPONSÁVEL TÉCNICO)">FALTA DE RT (RESPONSÁVEL TÉCNICO)</option>
                        <option value="INTERDIÇÃO SANITÁRIA">INTERDIÇÃO SANITÁRIA</option>
                        <option value="INADIMPLÊNCIA DE ANUIDADE / TAXAS">INADIMPLÊNCIA DE ANUIDADE / TAXAS</option>
                        <option value="IRREGULARIDADE CADASTRAL GRAVE">IRREGULARIDADE CADASTRAL GRAVE</option>
                        <option value="OUTROS">OUTROS</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-slate-700 font-bold mb-1 uppercase text-[10px]">Data do Bloqueio</label>
                      <input
                        type="date"
                        value={dateToInput(editingEmpresa.dataBloqueio || '')}
                        onChange={(e) => setEditingEmpresa(prev => prev ? ({ ...prev, dataBloqueio: inputToDate(e.target.value) }) : null)}
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 font-mono text-xs cursor-pointer"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-700 font-bold mb-1 uppercase text-[10px]">Data Prevista de Desbloqueio</label>
                      <input
                        type="date"
                        value={dateToInput(editingEmpresa.dataDesbloqueioPrevista || '')}
                        onChange={(e) => setEditingEmpresa(prev => prev ? ({ ...prev, dataDesbloqueioPrevista: inputToDate(e.target.value) }) : null)}
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 font-mono text-xs cursor-pointer"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-700 font-bold mb-1 uppercase text-[10px]">Usuário Responsável / Autoridade</label>
                      <input
                        type="text"
                        value={editingEmpresa.usuarioBloqueio || ''}
                        onChange={(e) => setEditingEmpresa(prev => prev ? ({ ...prev, usuarioBloqueio: e.target.value.toUpperCase() }) : null)}
                        placeholder="EX: SETOR DE FISCALIZAÇÃO / DEFIS"
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 uppercase font-semibold text-xs"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold mb-1 uppercase text-[10px]">Observações / Justificativa do Bloqueio</label>
                    <textarea
                      rows={3}
                      value={editingEmpresa.observacoesBloqueio || ''}
                      onChange={(e) => setEditingEmpresa(prev => prev ? ({ ...prev, observacoesBloqueio: e.target.value.toUpperCase() }) : null)}
                      placeholder="INFORME OS DETALHES DO AUTO DE INFRAÇÃO OU TERMO DE INTERDIÇÃO..."
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 uppercase text-xs"
                    />
                  </div>
                </div>
              )}
              {/* ABA 1: DADOS PJ */}
              {modalTab === 'dados_pj' && (
                <div className="space-y-3.5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-slate-700 font-bold uppercase text-[10px]">CNPJ *</label>
                        {editingEmpresa.cnpj && (
                          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-sm ${
                            !councilConfig.validarCNPJ 
                              ? 'bg-blue-50 text-blue-700 border border-blue-200' 
                              : isCnpjValid 
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                              : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}>
                            {!councilConfig.validarCNPJ ? 'VALIDAÇÃO OFF' : isCnpjValid ? '✓ CNPJ VÁLIDO' : '✕ CNPJ INVÁLIDO'}
                          </span>
                        )}
                      </div>
                      <input
                        type="text"
                        required
                        maxLength={18}
                        value={editingEmpresa.cnpj || ''}
                        onChange={(e) => {
                          const masked = maskCNPJ(e.target.value);
                          setEditingEmpresa(prev => ({ ...prev, cnpj: masked }));
                        }}
                        placeholder="00.000.000/0001-00"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-mono font-bold"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-700 font-bold mb-1 uppercase text-[10px]">Inscrição Estadual</label>
                      <input
                        type="text"
                        value={editingEmpresa.inscricaoEstadual || ''}
                        onChange={(e) => setEditingEmpresa(prev => ({ ...prev, inscricaoEstadual: e.target.value.toUpperCase() }))}
                        placeholder="04.123.456-7 OU ISENTO"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 uppercase font-mono font-medium"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-700 font-bold mb-1 uppercase text-[10px]">Razão Social *</label>
                      <input
                        type="text"
                        required
                        value={editingEmpresa.razaoSocial || ''}
                        onChange={(e) => setEditingEmpresa(prev => ({ ...prev, razaoSocial: e.target.value.toUpperCase() }))}
                        placeholder="DROGARIA E PERFUMARIA EXEMPLO LTDA"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 uppercase font-bold"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-700 font-bold mb-1 uppercase text-[10px]">Nome de Fantasia</label>
                      <input
                        type="text"
                        value={editingEmpresa.nomeFantasia || ''}
                        onChange={(e) => setEditingEmpresa(prev => ({ ...prev, nomeFantasia: e.target.value.toUpperCase() }))}
                        placeholder="DROGARIA EXEMPLO"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 uppercase font-semibold"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-slate-700 font-bold mb-1 uppercase text-[10px]">Tipo de Estabelecimento *</label>
                      <select
                        value={editingEmpresa.tipoEstabelecimento || 'Drogaria'}
                        onChange={(e) => setEditingEmpresa(prev => ({ ...prev, tipoEstabelecimento: e.target.value }))}
                        className="w-full px-2.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-semibold uppercase text-xs"
                      >
                        {cadastrosTiposEmpresa.map(t => (
                          <option key={t.id} value={t.nome}>{t.nome.toUpperCase()}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-slate-700 font-bold mb-1 uppercase text-[10px]">Natureza de Atividade (Cadastro Básico) *</label>
                      <select
                        value={editingEmpresa.naturezaAtividade || ''}
                        onChange={(e) => setEditingEmpresa(prev => ({ ...prev, naturezaAtividade: e.target.value }))}
                        className="w-full px-2.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-semibold uppercase text-xs"
                      >
                        <option value="">SELECIONE A NATUREZA DE ATIVIDADE</option>
                        {cadastrosNaturezaAtividade.map(nat => (
                          <option key={nat.id} value={nat.nome}>{nat.nome.toUpperCase()}</option>
                        ))}
                        {editingEmpresa.naturezaAtividade && !cadastrosNaturezaAtividade.some(n => n.nome.toLowerCase() === editingEmpresa.naturezaAtividade?.toLowerCase()) && (
                          <option value={editingEmpresa.naturezaAtividade}>{editingEmpresa.naturezaAtividade.toUpperCase()} (Atual)</option>
                        )}
                      </select>
                    </div>

                    <div>
                      <label className="block text-slate-700 font-bold mb-1 uppercase text-[10px]">Capital Social (R$)</label>
                      <input
                        type="number"
                        min={0}
                        step={1000}
                        value={editingEmpresa.capitalSocial || 100000}
                        onChange={(e) => setEditingEmpresa(prev => ({ ...prev, capitalSocial: parseFloat(e.target.value) || 0 }))}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-mono font-bold"
                      />
                    </div>
                  </div>

                  {/* SEÇÃO ADICIONAL SOLICITADA DO CADASTRO DE EMPRESAS */}
                  <div className="space-y-4 pt-4 border-t border-slate-200">
                    {/* Situação da Firma */}
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                      <label className="block text-slate-800 font-bold uppercase text-[11px]">Situação da Firma</label>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                        {['Definitiva', 'Provisória', 'Ilegal Fechada', 'Fechada Motivo Desconhecido', 'Temporária', 'Ilegal Aberta', 'Cancelada'].map((sit) => (
                          <label key={sit} className="flex items-center space-x-2 cursor-pointer font-medium text-slate-700">
                            <input
                              type="radio"
                              name="situacaoFirma"
                              checked={
                                (storageService.isSituacaoProvisoria(sit) && storageService.isSituacaoProvisoria(editingEmpresa.situacao)) ||
                                (
                                  sit.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().startsWith('definit') && 
                                  (editingEmpresa.situacao || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().startsWith('definit')
                                ) ||
                                sit.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase() === (editingEmpresa.situacao || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
                              }
                              onChange={() => handleSituacaoEmpresaChange(sit)}
                              className="text-blue-600 focus:ring-blue-500"
                            />
                            <span className="uppercase text-[11px]">{sit}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* Motivo da Situação (Vinculado aos Cadastros Básicos) */}
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <label className="block text-slate-800 font-bold uppercase text-[11px]">Motivo da Situação (Cadastros Básicos):</label>
                        <button
                          type="button"
                          onClick={() => toastService.success('Motivo Atualizado', 'Motivo da situação alterado com conservação da mesma situação.')}
                          className="px-3 py-1 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg text-slate-700 font-bold text-[10px] uppercase cursor-pointer"
                        >
                          Mudar somente o Motivo e conservar a mesma situação
                        </button>
                      </div>
                      <select
                        value={editingEmpresa.motivoSituacao || ''}
                        onChange={(e) => setEditingEmpresa(prev => ({ ...prev, motivoSituacao: e.target.value.toUpperCase() }))}
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 uppercase font-semibold text-xs"
                      >
                        <option value="">SELECIONE O MOTIVO DA SITUAÇÃO</option>
                        {cadastrosMotivosSituacaoEmpresa.map(m => (
                          <option key={m.id} value={m.nome}>{m.nome.toUpperCase()}</option>
                        ))}
                        {editingEmpresa.motivoSituacao && !cadastrosMotivosSituacaoEmpresa.some(m => m.nome.toLowerCase() === editingEmpresa.motivoSituacao?.toLowerCase()) && (
                          <option value={editingEmpresa.motivoSituacao}>{editingEmpresa.motivoSituacao.toUpperCase()} (Atual)</option>
                        )}
                      </select>
                    </div>

                    {/* Estabelecimento (Renomeado de Tipo de Empresa, padrão Privado) */}
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                      <label className="block text-slate-800 font-bold uppercase text-[11px]">Estabelecimento</label>
                      <div className="flex flex-wrap gap-4 text-xs">
                        {['PRIVADO', 'PÚBLICO', 'FILANTRÓPICO'].map((tp) => (
                          <label key={tp} className="flex items-center space-x-2 cursor-pointer font-medium text-slate-700">
                            <input
                              type="radio"
                              name="tipoEmpresaRadio"
                              checked={(editingEmpresa.tipoEmpresa || 'PRIVADO') === tp}
                              onChange={() => setEditingEmpresa(prev => prev ? ({ ...prev, tipoEmpresa: tp as any }) : null)}
                              className="text-blue-600 focus:ring-blue-500 cursor-pointer"
                            />
                            <span className="uppercase text-[11px] font-bold">{tp}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* Categoria da Empresa */}
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                      <label className="block text-slate-800 font-bold uppercase text-[11px]">Categoria da Empresa</label>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                        {[
                          'Micro empresa', 'Federal', 'Estadual', 'Municipal', 
                          'Hospitalar', 'Ltda', 'Ltda ME', 'Sociedade Anonima', 
                          'Sociedade Cota', 'Individual', 'Associação', 'Serv. Social Autonomo', 
                          'Cooperativa', 'Sindicato', 'Ltda EPP', 'Sociedade Civil (S/C)', 
                          'Fundação', 'Filantrópico', 'MEI', 'EIRELI', 
                          'Instituto', 'Sociedade Simples', 'Ong', 'Organização Social', 
                          'Linha de Produção', 'Pessoa Física'
                        ].map((cat) => (
                          <label key={cat} className="flex items-center space-x-2 cursor-pointer font-medium text-slate-700">
                            <input
                              type="radio"
                              name="categoriaEmpresaRadio"
                              checked={(editingEmpresa.categoriaEmpresa || editingEmpresa.categoria || 'Micro empresa') === cat}
                              onChange={() => setEditingEmpresa(prev => ({ ...prev, categoriaEmpresa: cat, categoria: cat }))}
                              className="text-blue-600 focus:ring-blue-500"
                            />
                            <span className="uppercase text-[10px]">{cat}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* Condição da Firma e Parâmetros */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                        <label className="block text-slate-800 font-bold uppercase text-[11px]">Condição da Firma</label>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          {['Regular', 'Irregular', 'Ilegal', 'Inativa'].map((cond) => (
                            <label key={cond} className="flex items-center space-x-2 cursor-pointer font-medium text-slate-700">
                              <input
                                type="radio"
                                name="condicaoFirmaRadio"
                                checked={(editingEmpresa.condicao || 'Regular') === cond}
                                onChange={() => setEditingEmpresa(prev => ({ ...prev, condicao: cond as any }))}
                                className="text-blue-600 focus:ring-blue-500"
                              />
                              <span className="uppercase text-[11px]">{cond}</span>
                            </label>
                          ))}
                        </div>
                      </div>

                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2.5">
                        <label className="block text-slate-800 font-bold uppercase text-[11px]">Parâmetros & Isenções</label>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <label className="flex items-center space-x-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={Boolean(editingEmpresa.assistenciaPlena)}
                              onChange={(e) => setEditingEmpresa(prev => ({ ...prev, assistenciaPlena: e.target.checked }))}
                              className="rounded text-blue-600 focus:ring-blue-500"
                            />
                            <span className="text-[11px] font-medium text-slate-700">Assistência Plena</span>
                          </label>

                          <label className="flex items-center space-x-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={Boolean(editingEmpresa.isentoAnuidade)}
                              onChange={(e) => setEditingEmpresa(prev => ({ ...prev, isentoAnuidade: e.target.checked }))}
                              className="rounded text-blue-600 focus:ring-blue-500"
                            />
                            <span className="text-[11px] font-medium text-slate-700">Isento de Anuidade</span>
                          </label>

                          <label className="flex items-center space-x-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={Boolean(editingEmpresa.anuidadeReduzida)}
                              onChange={(e) => setEditingEmpresa(prev => ({ ...prev, anuidadeReduzida: e.target.checked }))}
                              className="rounded text-blue-600 focus:ring-blue-500"
                            />
                            <span className="text-[11px] font-medium text-slate-700">Anuidade Reduzida?</span>
                          </label>

                          <label className="flex items-center space-x-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={Boolean(editingEmpresa.isentoTaxaCertificado)}
                              onChange={(e) => setEditingEmpresa(prev => ({ ...prev, isentoTaxaCertificado: e.target.checked }))}
                              className="rounded text-blue-600 focus:ring-blue-500"
                            />
                            <span className="text-[11px] font-medium text-slate-700">Isento Taxa Certificado</span>
                          </label>
                        </div>
                      </div>
                    </div>

                    {/* Linha final de Horários e Recadastramento */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-slate-700 font-bold mb-1 uppercase text-[10px]">Hr. Plantão</label>
                        <input
                          type="text"
                          value={editingEmpresa.horarioPlantao || ''}
                          onChange={(e) => setEditingEmpresa(prev => ({ ...prev, horarioPlantao: e.target.value.toUpperCase() }))}
                          placeholder="EX: 08:00 ÀS 22:00"
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 uppercase font-mono text-xs"
                        />
                      </div>

                      <div>
                        <label className="block text-slate-700 font-bold mb-1 uppercase text-[10px]">Horas de Tolerância</label>
                        <input
                          type="number"
                          min={0}
                          value={editingEmpresa.horasTolerancia || 0}
                          onChange={(e) => setEditingEmpresa(prev => ({ ...prev, horasTolerancia: parseInt(e.target.value, 10) || 0 }))}
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-mono font-bold text-xs"
                        />
                      </div>

                      <div>
                        <label className="block text-slate-700 font-bold mb-1 uppercase text-[10px]">Data Recadastramento</label>
                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={Boolean(editingEmpresa.recadastrado)}
                            onChange={(e) => setEditingEmpresa(prev => ({ ...prev, recadastrado: e.target.checked }))}
                            className="rounded text-blue-600"
                            title="Recadastrado"
                          />
                          <input
                            type="date"
                            value={dateToInput(editingEmpresa.dataRecadastramento || '')}
                            onChange={(e) => setEditingEmpresa(prev => ({ ...prev, dataRecadastramento: inputToDate(e.target.value) }))}
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-mono text-xs"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ABA 2: HORÁRIO DE FUNCIONAMENTO DA FIRMA */}
              {modalTab === 'horarios' && (
                <EmpresaHorariosEditor
                  horariosFuncionamento={editingEmpresa.horariosFuncionamento || [...DEFAULT_HORARIOS_FUNCIONAMENTO]}
                  onChangeFuncionamento={(updated) => setEditingEmpresa(prev => ({ ...prev, horariosFuncionamento: updated }))}
                  avaliacao={avaliacaoRegularidade || undefined}
                  cidade={editingEmpresa.cidade || 'MANAUS'}
                  tipoEstabelecimento={editingEmpresa.tipoEstabelecimento || 'Drogaria'}
                />
              )}

              {/* ABA 3: PROFISSIONAIS & ASSISTÊNCIA FARMACÊUTICA (RT) */}
              {modalTab === 'responsaveis_rt' && (
                <div className="space-y-4">
                  {/* Card de Avaliação Automática de Regularidade Sanitária */}
                  {avaliacaoRegularidade && (
                    <div className={`p-4 rounded-2xl border-2 transition-all shadow-xs ${
                      avaliacaoRegularidade.condicao === 'Regular'
                        ? 'bg-emerald-50/90 border-emerald-300 text-emerald-950'
                        : 'bg-rose-50/90 border-rose-300 text-rose-950'
                    }`}>
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-black/10 pb-2.5">
                        <div className="flex items-center space-x-2">
                          <span className={`px-2.5 py-1 rounded-lg font-extrabold text-xs uppercase tracking-wider shadow-xs ${
                            avaliacaoRegularidade.condicao === 'Regular' ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'
                          }`}>
                            CONDIÇÃO DA EMPRESA: {avaliacaoRegularidade.condicao}
                          </span>
                          <span className="text-[11px] font-bold uppercase text-slate-700">
                            AUDITORIA: {editingEmpresa.cidade || 'MANAUS'} • {editingEmpresa.tipoEstabelecimento || 'DROGARIA'}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 font-mono text-[11px] font-bold">
                          <span className="bg-white/90 px-2 py-0.5 rounded-md border border-slate-200">
                            FUNCIONAMENTO: <strong className="text-blue-700">{avaliacaoRegularidade.horasFuncionamentoSemanais}h/sem</strong>
                          </span>
                          <span className="bg-white/90 px-2 py-0.5 rounded-md border border-slate-200">
                            ASSISTÊNCIA RTS: <strong className={avaliacaoRegularidade.condicao === 'Regular' ? 'text-emerald-700' : 'text-rose-700'}>
                              {avaliacaoRegularidade.horasAssistenciaSemanais}h/sem
                            </strong>
                          </span>
                        </div>
                      </div>

                      <div className="pt-2 text-xs leading-relaxed">
                        <p className="font-semibold text-slate-800">
                          {avaliacaoRegularidade.justificativa}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Toolbar Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                    <div>
                      <span className="font-bold text-slate-900 uppercase text-xs flex items-center space-x-1.5">
                        <UserCheck className="w-4 h-4 text-emerald-600" />
                        <span>Quadro de Farmacêuticos & Assistência Farmacêutica (RT)</span>
                      </span>
                      <p className="text-[10px] text-slate-500">
                        Adicione farmacêuticos e configure os dias da semana e horários individuais de cada profissional.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleOpenNewRtModal}
                      className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs uppercase shadow-sm flex items-center space-x-1.5 cursor-pointer shrink-0"
                    >
                      <UserPlus className="w-4 h-4" />
                      <span>+ Vincular Farmacêutico (RT)</span>
                    </button>
                  </div>

                  {/* List of Pharmacists Cards */}
                  {(!editingEmpresa.responsaveisTecnicos || editingEmpresa.responsaveisTecnicos.length === 0) ? (
                    <div className="p-8 text-center bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl">
                      <UserCheck className="w-10 h-10 text-slate-400 mx-auto mb-2 opacity-50" />
                      <p className="font-bold text-slate-700 uppercase text-xs">Nenhum Farmacêutico Vinculado</p>
                      <p className="text-[11px] text-slate-500 mt-1 uppercase">
                        Clique no botão "+ Vincular Farmacêutico (RT)" para associar profissionais e definir suas jornadas semanais.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {editingEmpresa.responsaveisTecnicos.map((rt, idx) => {
                        const weeklyHours = rt.cargaHorariaSemanal || 0;
                        const prof = storageService.getProfissionais().find(p => p.id === rt.profissionalId || p.inscricao === rt.profissionalInscricao);
                        const impedimento = prof ? storageService.isProfissionalImpedidoRT(prof) : { impedido: false };

                        return (
                          <div key={idx} className={`p-4 rounded-2xl shadow-xs space-y-3 transition-all border ${
                            impedimento.impedido 
                              ? 'bg-rose-50/40 border-rose-300' 
                              : 'bg-white border-slate-200 hover:border-emerald-300'
                          }`}>
                            {/* RT Header Row */}
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="w-6 h-6 rounded-md bg-emerald-100 text-emerald-800 font-mono font-bold flex items-center justify-center text-xs">
                                  {rt.tipo || 'F'}
                                </span>
                                <span className="font-bold text-slate-900 uppercase text-xs sm:text-sm">
                                  {rt.profissionalNome}
                                </span>
                                <span className="font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 text-xs">
                                  {rt.profissionalInscricao}
                                </span>
                                <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-800 font-bold text-[10px] uppercase">
                                  {rt.cargo || 'RESPONSÁVEL TÉCNICO'}
                                </span>
                                <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-medium text-[10px] uppercase">
                                  {rt.situacaoVinculo || 'CTPS'}
                                </span>
                                {impedimento.impedido && (
                                  <span className="px-2 py-0.5 rounded bg-rose-100 text-rose-800 border border-rose-300 font-bold text-[9px] uppercase flex items-center gap-1">
                                    <Lock className="w-3 h-3 text-rose-600" />
                                    <span>IMPEDIDO ({prof?.situacao})</span>
                                  </span>
                                )}
                              </div>

                              <div className="flex items-center space-x-2">
                                <span className="px-2.5 py-1 rounded-lg bg-emerald-600 text-white font-mono font-bold text-xs shadow-2xs">
                                  {weeklyHours}h / semana
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleOpenEditRtModal(rt, idx)}
                                  className="px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg font-bold text-[10px] uppercase flex items-center space-x-1 cursor-pointer"
                                  title="Editar Horários e Dados deste RT"
                                >
                                  <Edit3 className="w-3.5 h-3.5" />
                                  <span>Editar Horários</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveRtFromEmpresa(idx)}
                                  className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg font-bold text-[10px] uppercase flex items-center space-x-1 cursor-pointer"
                                  title="Baixar RT"
                                >
                                  <Unlink className="w-3.5 h-3.5" />
                                  <span>Baixar RT</span>
                                </button>
                              </div>
                            </div>

                            {/* RT Days Grid Mini-Table */}
                            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-1.5 text-center text-[10px]">
                              {['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'].map((diaNome) => {
                                const key = diaNome.toLowerCase().slice(0, 3);
                                const h = rt.horarios?.find(item => item.dia.toLowerCase().slice(0, 3) === key);
                                const isActive = h && h.ativo !== false && (h.inicio1 || h.inicio2);

                                return (
                                  <div 
                                    key={diaNome}
                                    className={`p-2 rounded-xl border ${
                                      isActive 
                                        ? 'bg-emerald-50/50 border-emerald-200 text-emerald-950 font-medium' 
                                        : 'bg-slate-50 border-slate-200 text-slate-400 opacity-70'
                                    }`}
                                  >
                                    <span className="block font-bold uppercase text-[9px] text-slate-700 mb-0.5">{diaNome}</span>
                                    {isActive ? (
                                      <div className="font-mono font-bold text-[9px] text-emerald-800">
                                        <div>{h.inicio1} às {h.fim1}</div>
                                        {h.inicio2 && <div>{h.inicio2} às {h.fim2}</div>}
                                      </div>
                                    ) : (
                                      <span className="font-mono text-slate-400">Folga</span>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* ABA 4: SÓCIOS (QSA) */}
              {modalTab === 'socios_qsa' && (
                <div className="space-y-3.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 uppercase text-xs flex items-center space-x-1.5">
                      <Users className="w-4 h-4 text-blue-600" />
                      <span>Quadro Societário & Administradores (QSA)</span>
                    </span>
                    <button
                      type="button"
                      onClick={handleOpenNewSocio}
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-[10px] uppercase shadow-xs flex items-center space-x-1 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>ADICIONAR SÓCIO</span>
                    </button>
                  </div>

                  {(!editingEmpresa.socios || editingEmpresa.socios.length === 0) ? (
                    <div className="p-8 text-center bg-slate-50 border border-slate-200 rounded-2xl">
                      <Users className="w-8 h-8 text-slate-400 mx-auto mb-2 opacity-50" />
                      <p className="font-bold text-slate-700 uppercase text-xs">Nenhum Sócio Cadastrado</p>
                      <p className="text-[10px] text-slate-400 mt-1 uppercase">
                        Clique em "Adicionar Sócio" para incluir sócios administradores ou cotistas.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {editingEmpresa.socios.map((socio, idx) => (
                        <div key={idx} className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                          <div>
                            <div className="font-bold text-slate-900 uppercase">{socio.nome}</div>
                            <div className="text-[10px] text-slate-500 font-mono uppercase mt-0.5">
                              CPF: {maskCPF(socio.cpf)} | VÍNCULO: {socio.tipo} | PARTICIPAÇÃO: {socio.participacaoPct}%
                            </div>
                          </div>
                          <div className="flex items-center space-x-1.5">
                            <button
                              type="button"
                              onClick={() => handleOpenEditSocio(socio, idx)}
                              className="p-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg cursor-pointer"
                              title="Editar Sócio"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRemoveSocio(idx)}
                              className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg cursor-pointer"
                              title="Remover Sócio"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* ABA 5: ENDEREÇO & CONTATO */}
              {modalTab === 'endereco' && (
                <div className="space-y-3.5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-700 font-bold mb-1 uppercase text-[10px]">Telefone Comercial *</label>
                      <input
                        type="text"
                        maxLength={15}
                        value={editingEmpresa.telefone || ''}
                        onChange={(e) => {
                          const masked = maskPhone(e.target.value);
                          setEditingEmpresa(prev => ({ ...prev, telefone: masked }));
                        }}
                        placeholder="(92) 3000-0000"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-mono font-bold"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-700 font-bold mb-1 uppercase text-[10px]">E-mail Corporativo</label>
                      <input
                        type="email"
                        value={editingEmpresa.email || ''}
                        onChange={(e) => setEditingEmpresa(prev => ({ ...prev, email: e.target.value }))}
                        placeholder="contato@drogaria.com.br"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-mono"
                      />
                    </div>
                  </div>

                  {/* Bloco Endereço da Empresa */}
                  <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 uppercase text-[11px] flex items-center space-x-1.5">
                        <MapPin className="w-3.5 h-3.5 text-blue-600" />
                        <span>Endereço do Estabelecimento Farmacêutico</span>
                      </span>
                      {councilConfig.autoPreencherEnderecoCEP && (
                        <span className="text-[10px] text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-md font-bold uppercase">
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
                          value={editingEmpresa.cep || ''}
                          onChange={handleCepChange}
                          placeholder="00000-000"
                          className="flex-1 min-w-0 px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 font-mono font-bold focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
                        />
                        <button
                          type="button"
                          onClick={() => searchCep()}
                          disabled={isSearchingCep}
                          className="shrink-0 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold flex items-center space-x-1 text-[11px] shadow-xs uppercase disabled:opacity-50 transition-colors cursor-pointer"
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
                          value={editingEmpresa.endereco || ''}
                          onChange={(e) => setEditingEmpresa(prev => ({ ...prev, endereco: e.target.value.toUpperCase() }))}
                          placeholder="AV. EDUARDO RIBEIRO, 500"
                          className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 uppercase font-medium"
                        />
                      </div>
                      <div className="sm:col-span-4">
                        <label className="block text-slate-700 font-bold mb-1 uppercase text-[10px]">Complemento / Sala:</label>
                        <input
                          type="text"
                          value={editingEmpresa.complemento || ''}
                          onChange={(e) => setEditingEmpresa(prev => ({ ...prev, complemento: e.target.value.toUpperCase() }))}
                          placeholder="LOJA 01"
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
                          value={editingEmpresa.bairro || ''}
                          onChange={(e) => setEditingEmpresa(prev => ({ ...prev, bairro: e.target.value.toUpperCase() }))}
                          placeholder="CENTRO"
                          className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 uppercase font-medium"
                        />
                      </div>
                      <div className="sm:col-span-5">
                        <label className="block text-slate-700 font-bold mb-1 uppercase text-[10px]">Município / Cidade (Cadastros Básicos):</label>
                        <input
                          type="text"
                          list="municipios-empresa-list"
                          value={editingEmpresa.cidade || ''}
                          onChange={(e) => setEditingEmpresa(prev => ({ ...prev, cidade: e.target.value.toUpperCase() }))}
                          placeholder="MANAUS"
                          className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 uppercase font-bold"
                        />
                        <datalist id="municipios-empresa-list">
                          {cadastrosMunicipios.map(m => (
                            <option key={m.id} value={m.nome}>{m.nome}</option>
                          ))}
                          <option value="MANAUS" />
                          <option value="MANACAPURU" />
                          <option value="ITACOATIARA" />
                          <option value="PARINTINS" />
                        </datalist>
                      </div>
                      <div className="sm:col-span-2">
                        <label className="block text-slate-700 font-bold mb-1 uppercase text-[10px]">UF:</label>
                        <input
                          type="text"
                          maxLength={2}
                          value={editingEmpresa.uf || ''}
                          onChange={(e) => setEditingEmpresa(prev => ({ ...prev, uf: e.target.value.toUpperCase() }))}
                          placeholder="AM"
                          className="w-full px-2 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 font-mono font-bold text-center uppercase"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ABA 6: POSIÇÃO FINANCEIRA PJ */}
              {modalTab === 'posicao_financeira' && (
                <div className="space-y-3.5">
                  <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                    <div>
                      <span className="font-bold text-slate-900 uppercase text-[11px] block">Situação Financeira da Empresa (PJ)</span>
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
                    <span className="font-bold text-slate-800 uppercase text-[10px] block">Lançamentos / Anuidades da Firma:</span>
                    {posicaoFin.lancamentos.length === 0 ? (
                      <div className="p-6 text-center bg-slate-50 border border-slate-200 rounded-xl">
                        <DollarSign className="w-6 h-6 text-slate-400 mx-auto mb-1 opacity-50" />
                        <p className="text-slate-500 uppercase font-semibold text-[11px]">Nenhum débito ou anuidade registrado para este CNPJ</p>
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
                    setEditingEmpresa(null);
                  }}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold uppercase cursor-pointer"
                >
                  CANCELAR
                </button>
                <button
                  type="submit"
                  className="flex items-center space-x-1.5 px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-md shadow-blue-500/20 uppercase cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{editingEmpresa.id ? 'SALVAR ALTERAÇÕES' : 'CONCLUIR CADASTRO'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Sub-modal: Adicionar / Editar Sócio */}
      {isSocioModalOpen && (
        <div className="fixed inset-0 z-60 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full shadow-2xl p-5 text-xs space-y-3.5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <span className="font-bold text-slate-900 uppercase text-xs flex items-center space-x-2">
                <Users className="w-4 h-4 text-blue-600" />
                <span>{editingSocioIndex !== null ? 'ALTERAR DADOS DO SÓCIO' : 'INCLUIR NOVO SÓCIO'}</span>
              </span>
              <button
                type="button"
                onClick={() => setIsSocioModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveSocio} className="space-y-3">
              <div>
                <label className="block text-slate-700 font-bold mb-1 uppercase text-[10px]">Nome Completo do Sócio *</label>
                <input
                  type="text"
                  required
                  value={editingSocio.nome || ''}
                  onChange={(e) => setEditingSocio(prev => ({ ...prev, nome: e.target.value.toUpperCase() }))}
                  placeholder="NOME DO SÓCIO / COTISTA"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 uppercase font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-slate-700 font-bold mb-1 uppercase text-[10px]">CPF do Sócio *</label>
                  <input
                    type="text"
                    required
                    maxLength={14}
                    value={editingSocio.cpf || ''}
                    onChange={(e) => {
                      const masked = maskCPF(e.target.value);
                      setEditingSocio(prev => ({ ...prev, cpf: masked }));
                    }}
                    placeholder="000.000.000-00"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1 uppercase text-[10px]">Documento RG</label>
                  <input
                    type="text"
                    value={editingSocio.rg || ''}
                    onChange={(e) => setEditingSocio(prev => ({ ...prev, rg: e.target.value.toUpperCase() }))}
                    placeholder="123456 SSP/AM"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 uppercase font-mono font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-slate-700 font-bold mb-1 uppercase text-[10px]">Tipo de Vínculo</label>
                  <select
                    value={editingSocio.tipo || 'Cotista'}
                    onChange={(e) => setEditingSocio(prev => ({ ...prev, tipo: e.target.value as any }))}
                    className="w-full px-2.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-semibold uppercase"
                  >
                    <option value="Administrador">ADMINISTRADOR</option>
                    <option value="Cotista">COTISTA</option>
                    <option value="Investidor">INVESTIDOR</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1 uppercase text-[10px]">% de Participação</label>
                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={editingSocio.participacaoPct || 50}
                    onChange={(e) => setEditingSocio(prev => ({ ...prev, participacaoPct: parseFloat(e.target.value) || 0 }))}
                    className="w-full px-2.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-mono font-bold"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsSocioModalOpen(false)}
                  className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold uppercase cursor-pointer"
                >
                  CANCELAR
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold uppercase shadow-sm cursor-pointer"
                >
                  SALVAR SÓCIO
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Sub-modal: Vincular / Editar RT e Horários de Assistência Individual */}
      <ResponsavelTecnicoEditorModal
        isOpen={isRtEditorModalOpen}
        onClose={() => setIsRtEditorModalOpen(false)}
        onSave={handleSaveRt}
        initialData={editingRtData}
        empresaFuncionamento={editingEmpresa?.horariosFuncionamento}
        cidade={editingEmpresa?.cidade}
        tipoEstabelecimento={editingEmpresa?.tipoEstabelecimento}
      />

      {/* Delete Confirmation Dialog */}
      {empresaToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full shadow-2xl p-6 text-xs space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-base font-bold text-slate-900 uppercase">CONFIRMAR EXCLUSÃO DE EMPRESA</h3>
              <p className="text-slate-500 uppercase">
                VOCÊ TEM CERTEZA QUE DESEJA REMOVER O REGISTRO DE <strong className="text-slate-800">{empresaToDelete.razaoSocial}</strong> (INSCRIÇÃO: {empresaToDelete.inscricao})? ESTA AÇÃO NÃO PODE SER DESFEITA.
              </p>
            </div>

            <div className="flex space-x-2 pt-2">
              <button
                onClick={() => setEmpresaToDelete(null)}
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

      {/* Modal de Confirmação para Alteração de Empresa para Provisório */}
      {provisorioConfirmModalPJ?.isOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-70 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-amber-300 space-y-4">
            <div className="flex items-center space-x-3 text-amber-600">
              <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 uppercase">Alterar Empresa para Provisória?</h3>
                <p className="text-[11px] text-slate-500 font-medium">Confirmação de alteração da situação cadastral</p>
              </div>
            </div>

            <div className="p-3.5 bg-amber-50/80 rounded-xl border border-amber-200 text-xs text-amber-950 space-y-2">
              <p>
                A situação cadastral da empresa será alterada para <strong className="uppercase">Provisória</strong>.
              </p>
              <div className="p-2.5 bg-white rounded-lg border border-amber-200 text-[11px] space-y-1 font-medium">
                <div className="flex justify-between text-slate-600">
                  <span>Número Sequencial:</span>
                  <strong className="font-mono text-slate-900">{provisorioConfirmModalPJ.numeroAtual} (MANTIDO)</strong>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Inscrição Atual:</span>
                  <span className="font-mono text-slate-700">{editingEmpresa?.inscricao}</span>
                </div>
                <div className="flex justify-between text-amber-900 font-bold border-t border-amber-100 pt-1">
                  <span>Nova Inscrição Provisória:</span>
                  <span className="font-mono text-amber-800">{provisorioConfirmModalPJ.novaInscricao}</span>
                </div>
              </div>
              <p className="text-[11px] text-amber-800">
                * Conforme as configurações do Conselho, apenas o prefixo e sufixo serão modificados, mantendo o número atual. Ao retornar para definitivo no futuro, o prefixo e sufixo definitivos serão restaurados mantendo a numeração.
              </p>
            </div>

            <div className="flex justify-end space-x-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setProvisorioConfirmModalPJ(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl uppercase transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmChangeToProvisorioPJ}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl uppercase transition-colors flex items-center space-x-1.5 shadow-md shadow-amber-500/20 cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>Sim, Alterar para Provisória</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
