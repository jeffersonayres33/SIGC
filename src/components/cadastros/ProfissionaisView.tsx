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
  FileSpreadsheet,
  ShieldAlert
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
  sanitizeToUpper,
  dateToInput,
  inputToDate
} from '../../utils/documentUtils';

interface ProfissionaisViewProps {
  onOpenBoletoPix?: (lancamento: any) => void;
}

export const ProfissionaisView: React.FC<ProfissionaisViewProps> = ({ onOpenBoletoPix }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [inscricaoFilter, setInscricaoFilter] = useState('');
  const [situacaoFilter, setSituacaoFilter] = useState<string>('Todos');
  const [tipoFilter, setTipoFilter] = useState<string>('Todos');
  const [statusFinFilter, setStatusFinFilter] = useState<string>('Todos');
  const [cepFilter, setCepFilter] = useState('');
  const [enderecoFilter, setEnderecoFilter] = useState('');
  const [complementoFilter, setComplementoFilter] = useState('');
  const [habilitacaoFilter, setHabilitacaoFilter] = useState('Todos');
  const [dataNascimentoFilter, setDataNascimentoFilter] = useState('');
  const [naturalidadeFilter, setNaturalidadeFilter] = useState('');
  const [dtInicioInscProvisoriaFilter, setDtInicioInscProvisoriaFilter] = useState('');
  const [dtVencInscProvisoriaFilter, setDtVencInscProvisoriaFilter] = useState('');
  const [dataSolicitacaoBaixaFilter, setDataSolicitacaoBaixaFilter] = useState('');
  const [dataReabilitacaoFilter, setDataReabilitacaoFilter] = useState('');
  const [anuidadeReduzidaFilter, setAnuidadeReduzidaFilter] = useState('Todos');
  const [isentoAnuidadeFilter, setIsentoAnuidadeFilter] = useState('Todos');
  const [eVotanteFilter, setEVotanteFilter] = useState('Todos');
  const [eMilitarFilter, setEMilitarFilter] = useState('Todos');
  const [estadoCivilFilter, setEstadoCivilFilter] = useState('Todos');
  const [nomeMaeFilter, setNomeMaeFilter] = useState('');
  const [bloqueadoFilter, setBloqueadoFilter] = useState('Todos');
  const [motivoBloqueioFilter, setMotivoBloqueioFilter] = useState('');
  const [dataBloqueioFilter, setDataBloqueioFilter] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(1);
  const pageSize = 15;

  const handleClearFilters = () => {
    setSearchTerm('');
    setInscricaoFilter('');
    setSituacaoFilter('Todos');
    setTipoFilter('Todos');
    setStatusFinFilter('Todos');
    setCepFilter('');
    setEnderecoFilter('');
    setComplementoFilter('');
    setHabilitacaoFilter('Todos');
    setDataNascimentoFilter('');
    setNaturalidadeFilter('');
    setDtInicioInscProvisoriaFilter('');
    setDtVencInscProvisoriaFilter('');
    setDataSolicitacaoBaixaFilter('');
    setDataReabilitacaoFilter('');
    setAnuidadeReduzidaFilter('Todos');
    setIsentoAnuidadeFilter('Todos');
    setEVotanteFilter('Todos');
    setEMilitarFilter('Todos');
    setEstadoCivilFilter('Todos');
    setNomeMaeFilter('');
    setBloqueadoFilter('Todos');
    setMotivoBloqueioFilter('');
    setDataBloqueioFilter('');
    setPage(1);
    toastService.info('Filtros Limpos', 'Todos os filtros de profissionais foram redefinidos.');
  };

  // Visualizar Cadastro Modal State
  const [selectedProfissional, setSelectedProfissional] = useState<Profissional | null>(null);
  const [viewDetailsTab, setViewDetailsTab] = useState<'dados_gerais' | 'protocolos' | 'empresas' | 'financeiro' | 'historico_alteracoes'>('dados_gerais');

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
  const [modalTab, setModalTab] = useState<'dados_pessoais' | 'filiacao_formacao' | 'endereco_contato' | 'empresas_rt' | 'posicao_financeira' | 'bloqueio' | 'historico'>('dados_pessoais');
  const [editingProfissional, setEditingProfissional] = useState<Partial<Profissional> | null>(null);
  const [profToDelete, setProfToDelete] = useState<Profissional | null>(null);
  const [profToConvertDefinitivo, setProfToConvertDefinitivo] = useState<Profissional | null>(null);
  const [isSearchingCep, setIsSearchingCep] = useState(false);

  const [initialModalSituacao, setInitialModalSituacao] = useState<string>('');
  const [provisorioConfirmModal, setProvisorioConfirmModal] = useState<{
    isOpen: boolean;
    targetSituacao: string;
    prevSituacao: string;
    numeroAtual: string;
    novaInscricao: string;
  } | null>(null);

  const handleSituacaoChange = (novaSituacao: string) => {
    if (!editingProfissional) return;
    const currentSit = editingProfissional.situacao || 'Definitivo';
    const wasProvisorio = storageService.isSituacaoProvisoria(currentSit);
    const willBeProvisorio = storageService.isSituacaoProvisoria(novaSituacao);

    if (!wasProvisorio && willBeProvisorio) {
      // Pergunta se deseja mesmo alterar para Provisório mantendo o número atual
      const inscricaoAtual = editingProfissional.inscricao || '';
      const numeroAtual = storageService.extrairNumeroInscricao(inscricaoAtual) || String(councilConfig.proximoNumeroInscricaoProvisoriaProfissional || 100);
      const novaInscricaoProvisoria = storageService.alternarInscricaoParaProvisorio(inscricaoAtual, 'PF');

      setProvisorioConfirmModal({
        isOpen: true,
        targetSituacao: novaSituacao,
        prevSituacao: currentSit,
        numeroAtual,
        novaInscricao: novaInscricaoProvisoria
      });
    } else if (wasProvisorio && !willBeProvisorio) {
      const inscricaoAtual = editingProfissional.inscricao || '';
      const foiDef = storageService.foiDefinitivoEmAlgumMomento(editingProfissional.id || '', 'PROFISSIONAL');
      let novaInscricaoDefinitiva = '';

      if (foiDef) {
        novaInscricaoDefinitiva = storageService.alternarInscricaoParaDefinitivo(inscricaoAtual, 'PF');
        const numeroAtual = storageService.extrairNumeroInscricao(inscricaoAtual);
        setEditingProfissional(prev => prev ? ({
          ...prev,
          situacao: novaSituacao as any,
          inscricao: novaInscricaoDefinitiva
        }) : null);
        toastService.info(
          'Inscrição Revertida para Definitiva',
          `A numeração cronológica original (${numeroAtual}) foi mantida e o prefixo/sufixo definitivo aplicado com sucesso.`
        );
      } else {
        novaInscricaoDefinitiva = storageService.getNextInscricaoProfissional(true);
        setEditingProfissional(prev => prev ? ({
          ...prev,
          situacao: novaSituacao as any,
          inscricao: novaInscricaoDefinitiva
        }) : null);
        toastService.info(
          'Inscrição Definitiva Gerada',
          `Nova numeração sequencial definitiva gerada (${novaInscricaoDefinitiva}) seguindo a continuidade cronológica.`
        );
      }
    } else {
      setEditingProfissional(prev => prev ? ({
        ...prev,
        situacao: novaSituacao as any
      }) : null);
    }
  };

  const handleConfirmChangeToProvisorio = () => {
    if (!provisorioConfirmModal || !editingProfissional) return;
    const { targetSituacao, novaInscricao, numeroAtual } = provisorioConfirmModal;

    const validadeMeses = councilConfig.validadeProvisoriaMesesProfissional ?? 12;
    const today = new Date();
    const vencDate = new Date();
    vencDate.setMonth(vencDate.getMonth() + validadeMeses);

    setEditingProfissional(prev => {
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

    setProvisorioConfirmModal(null);
    toastService.success(
      'Situação Alterada para Provisório',
      `O número (${numeroAtual}) foi preservado e o prefixo/sufixo alterado para o padrão provisório (${novaInscricao}).`
    );
  };

  const handleSelectTipoInscricao = (tipo: 'Definitiva' | 'Provisória') => {
    if (!editingProfissional) return;
    if (editingProfissional.id) {
      // Cadastro existente: usa a lógica de alteração de situação que preserva o número e formata prefixo/sufixo
      if (tipo === 'Provisória') {
        handleSituacaoChange('Provisório');
      } else {
        handleSituacaoChange('Definitivo');
      }
    } else {
      // Novo cadastro: gera um novo número sequencial do lote correspondente
      if (tipo === 'Provisória') {
        const generated = storageService.peekNextInscricaoProvisoriaProfissional();
        const validadeMeses = councilConfig.validadeProvisoriaMesesProfissional ?? 12;
        const today = new Date();
        const vencDate = new Date();
        vencDate.setMonth(vencDate.getMonth() + validadeMeses);

        setEditingProfissional(prev => prev ? ({
          ...prev,
          inscricao: generated,
          situacao: 'Provisório',
          dtInicioInscProvisoria: today.toLocaleDateString('pt-BR'),
          dtVencInscProvisoria: vencDate.toLocaleDateString('pt-BR')
        }) : null);
      } else {
        const generated = storageService.peekNextInscricaoProfissional();
        setEditingProfissional(prev => prev ? ({
          ...prev,
          inscricao: generated,
          situacao: 'Definitivo'
        }) : null);
      }
    }
  };

  const handleConfirmConversaoDefinitiva = () => {
    if (!profToConvertDefinitivo) return;
    const updated = storageService.converterProfissionalParaDefinitivo(profToConvertDefinitivo.id);
    if (updated) {
      toastService.success(
        'Inscrição Definitiva Efetivada!',
        `O profissional ${updated.nome} agora possui a inscrição definitiva ${updated.inscricao}. Numeração anterior (${profToConvertDefinitivo.inscricao}) arquivada com sucesso.`
      );
      if (selectedProfissional && selectedProfissional.id === updated.id) {
        setSelectedProfissional(updated);
      }
    } else {
      toastService.error('Erro na Conversão', 'Não foi possível converter a inscrição para definitiva.');
    }
    setProfToConvertDefinitivo(null);
  };

  // Modal de Visualização da Foto em Tamanho Grande & Upload Avançado
  const [previewPhotoModal, setPreviewPhotoModal] = useState<{ url: string; nome: string; info?: string } | null>(null);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

  // Otimização e compressão inteligente de fotos em alta resolução (suporta arquivos de até 25MB)
  const optimizePhotoUpload = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(new Error('Erro ao ler o arquivo de imagem.'));
      reader.onload = (e) => {
        const img = new Image();
        img.onerror = () => reject(new Error('O arquivo selecionado não é uma imagem válida.'));
        img.onload = () => {
          // Mantém proporção e nitidez com limite amplo em alta definição (até 1600x1600)
          const maxDimension = 1600;
          let width = img.width;
          let height = img.height;

          if (width > maxDimension || height > maxDimension) {
            if (width > height) {
              height = Math.round((height * maxDimension) / width);
              width = maxDimension;
            } else {
              width = Math.round((width * maxDimension) / height);
              height = maxDimension;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(e.target?.result as string);
            return;
          }

          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(img, 0, 0, width, height);

          // Exportar em alta qualidade (JPEG 90%) para manter fidelidade visual e peso leve
          const optimizedDataUrl = canvas.toDataURL('image/jpeg', 0.90);
          resolve(optimizedDataUrl);
        };
        img.src = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    });
  };

  const handlePhotoFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Limite generoso de 25 MB para fotos de câmeras modernas e smartphones
    if (file.size > 25 * 1024 * 1024) {
      toastService.warning('Arquivo Muito Grande', 'A foto selecionada ultrapassa o limite de 25MB.');
      return;
    }

    try {
      setIsUploadingPhoto(true);
      const optimizedUrl = await optimizePhotoUpload(file);
      setEditingProfissional(prev => prev ? ({ ...prev, fotoUrl: optimizedUrl }) : null);
      toastService.success(
        'Foto Carregada com Sucesso',
        `Imagem de ${(file.size / (1024 * 1024)).toFixed(1)}MB processada e otimizada em alta definição!`
      );
    } catch (err: any) {
      toastService.error('Erro no Upload', err?.message || 'Não foi possível carregar a imagem.');
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const councilConfig = storageService.getCouncilConfig();
  const cadastrosTipos = storageService.getCadastrosBasicos('TIPO_PROFISSIONAL').filter(i => i.ativo);
  const cadastrosSituacoes = storageService.getCadastrosBasicos('SITUACAO_PROFISSIONAL').filter(i => i.ativo);
  const cadastrosMotivosSituacaoProf = storageService.getCadastrosBasicos('MOTIVO_SITUACAO_PROFISSIONAL').filter(i => i.ativo);
  const cadastrosHabilitacoes = storageService.getCadastrosBasicos('HABILITACAO').filter(i => i.ativo);
  const cadastrosTiposRequerimento = storageService.getCadastrosBasicos('TIPO_REQUERIMENTO_PROTOCOLO').filter(i => i.ativo);
  const cadastrosSetoresProtocolo = storageService.getCadastrosBasicos('SETOR_PROTOCOLO').filter(i => i.ativo);
  const cadastrosStatusProtocolo = storageService.getCadastrosBasicos('STATUS_PROTOCOLO').filter(i => i.ativo);
  const todasEmpresas = storageService.getEmpresas();

  // Fetch paginated professionals
  const result = storageService.getProfissionaisPaginated(page, pageSize, {
    search: searchTerm,
    inscricao: inscricaoFilter,
    situacao: situacaoFilter,
    tipoAssociado: tipoFilter,
    statusFinanceiro: statusFinFilter,
    cep: cepFilter,
    endereco: enderecoFilter,
    complemento: complementoFilter,
    habilitacao: habilitacaoFilter,
    dataNascimento: dataNascimentoFilter,
    naturalidade: naturalidadeFilter,
    dtInicioInscProvisoria: dtInicioInscProvisoriaFilter,
    dtVencInscProvisoria: dtVencInscProvisoriaFilter,
    dataSolicitacaoBaixa: dataSolicitacaoBaixaFilter,
    dataReabilitacao: dataReabilitacaoFilter,
    anuidadeReduzida: anuidadeReduzidaFilter,
    isentoAnuidade: isentoAnuidadeFilter,
    eVotante: eVotanteFilter,
    eMilitar: eMilitarFilter,
    estadoCivil: estadoCivilFilter,
    nomeMae: nomeMaeFilter,
    bloqueado: bloqueadoFilter,
    motivoBloqueio: motivoBloqueioFilter,
    dataBloqueio: dataBloqueioFilter
  });

  // Busca conjunto completo de profissionais filtrados para exportação
  const getAllFilteredProfissionais = () => {
    return storageService.getProfissionaisPaginated(1, 10000, {
      search: searchTerm,
      inscricao: inscricaoFilter,
      situacao: situacaoFilter,
      tipoAssociado: tipoFilter,
      statusFinanceiro: statusFinFilter,
      cep: cepFilter,
      endereco: enderecoFilter,
      complemento: complementoFilter,
      habilitacao: habilitacaoFilter,
      dataNascimento: dataNascimentoFilter,
      naturalidade: naturalidadeFilter,
      dtInicioInscProvisoria: dtInicioInscProvisoriaFilter,
      dtVencInscProvisoria: dtVencInscProvisoriaFilter,
      dataSolicitacaoBaixa: dataSolicitacaoBaixaFilter,
      dataReabilitacao: dataReabilitacaoFilter,
      anuidadeReduzida: anuidadeReduzidaFilter,
      isentoAnuidade: isentoAnuidadeFilter,
      eVotante: eVotanteFilter,
      eMilitar: eMilitarFilter,
      estadoCivil: estadoCivilFilter,
      nomeMae: nomeMaeFilter,
      bloqueado: bloqueadoFilter,
      motivoBloqueio: motivoBloqueioFilter,
      dataBloqueio: dataBloqueioFilter
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
      dataNascimento: '',
      sexo: 'F',
      nacionalidade: 'BRASILEIRA',
      naturalidade: '',
      nomeMae: '',
      nomePai: '',
      situacao: (cadastrosSituacoes[0]?.nome as any) || 'Definitivo',
      motivoSituacao: '',
      dtInicioInscProvisoria: '',
      dtVencInscProvisoria: '',
      dataSolicitacaoBaixa: '',
      dataReabilitacao: '',
      transferidoOutroRegional: false,
      nrInscricaoRegionalOrigem: '',
      anuidRefAnoInscricaoEmDia: false,
      ufRegionalOrigem: councilConfig.uf || 'AM',
      anuidadeReduzida: false,
      isentoAnuidade: false,
      eVotante: true,
      eMilitar: false,
      dtVenctoMilitar: '',
      recadastrado: false,
      dataRecadastramento: '',
      estadoCivil: '',
      dataMandatoSeguranca: '',
      orgaoMandatoSeguranca: '',
      observacaoMandato: '',
      formaEnvioBoletoParcelamento: '',
      grupoSanguineo: '',
      fatorRH: '',
      doadorOrgaosTecidos: false,
      participouCursoQualifarma: '',
      rgDataExpedicao: '',
      rgDataVencimento: '',
      tituloEleitoral: '',
      tituloZona: '',
      tituloSecao: '',
      tituloUfExp: councilConfig.uf || 'AM',
      reservista: '',
      cartTrabalho: '',
      cartTrabalhoSerie: '',
      cartTrabalhoUfExp: councilConfig.uf || 'AM',
      cartTrabalhoDataExp: '',
      nomeSocial: '',
      tipoAssociado: (cadastrosTipos[0]?.nome as any) || 'Farmacêutico',
      dataInscricao: new Date().toLocaleDateString('pt-BR'),
      dataColacaoGrau: '',
      dataExpDiploma: '',
      faculdade: '',
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
      carteiraProfissional: '',
      habilitacoes: [],
      fotoUrl: '',
      bloqueado: false,
      motivoBloqueio: '',
      dataBloqueio: '',
      dataDesbloqueioPrevista: '',
      usuarioBloqueio: '',
      observacoesBloqueio: ''
    });
    setModalTab('dados_pessoais');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (prof: Profissional) => {
    const matched = cadastrosSituacoes.find(s => 
      storageService.isSituacaoProvisoria(s.nome) === storageService.isSituacaoProvisoria(prof.situacao) &&
      (storageService.isSituacaoProvisoria(s.nome) || s.nome.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase() === (prof.situacao || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase())
    );
    const situacaoNormalizada = (matched ? matched.nome : (prof.situacao || 'Definitivo')).toUpperCase();

    setEditingProfissional({ 
      ...prof,
      situacao: situacaoNormalizada
    });
    setInitialModalSituacao(situacaoNormalizada);
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

    if (!editingProfissional.cpf || !editingProfissional.cpf.trim()) {
      toastService.warning('CPF Obrigatório', 'Por favor preencha o CPF do profissional.');
      return;
    }

    if (councilConfig.validarCPF && !validateCPF(editingProfissional.cpf)) {
      toastService.warning('CPF Inválido', 'O CPF informado é inválido. Corrija para prosseguir (ou mantenha a validação de CPF desativada em Configurações).');
      return;
    }

    const cleanCpfDigits = (editingProfissional.cpf || '').replace(/\D/g, '');
    const duplicateProf = storageService.getProfissionais().find(p => 
      p.id !== editingProfissional.id && (p.cpf || '').replace(/\D/g, '') === cleanCpfDigits
    );
    if (duplicateProf) {
      toastService.warning(
        'CPF Já Cadastrado',
        `Já existe um profissional cadastrado com este CPF (${maskCPF(cleanCpfDigits)}): ${duplicateProf.nome} (Inscrição: ${duplicateProf.inscricao}).`
      );
      return;
    }

    if (!editingProfissional.fotoUrl?.trim()) {
      toastService.warning('Foto Obrigatória', 'Por favor faça o upload da foto do profissional para prosseguir.');
      return;
    }

    const isNew = !editingProfissional.id;
    const isProvisorio = storageService.isSituacaoProvisoria(editingProfissional.situacao) || editingProfissional.inscricao?.includes('PROV');
    const finalInscricao = isNew 
      ? (isProvisorio ? storageService.getNextInscricaoProvisoriaProfissional(true) : storageService.getNextInscricaoProfissional(true))
      : editingProfissional.inscricao!;

    const rawProfissional: Profissional = {
      id: editingProfissional.id || `prof-custom-${Date.now()}`,
      inscricao: finalInscricao,
      nome: editingProfissional.nome.trim(),
      cpf: maskCPF(editingProfissional.cpf),
      rg: editingProfissional.rg || '',
      orgaoExpeditor: editingProfissional.orgaoExpeditor || 'SSP/AM',
      dataNascimento: editingProfissional.dataNascimento || '',
      sexo: editingProfissional.sexo || 'M',
      nacionalidade: editingProfissional.nacionalidade || 'BRASILEIRA',
      naturalidade: editingProfissional.naturalidade || 'MANAUS/AM',
      nomeMae: editingProfissional.nomeMae?.trim() || '',
      nomePai: editingProfissional.nomePai?.trim() || '',
      situacao: editingProfissional.situacao || 'Definitivo',
      motivoSituacao: editingProfissional.motivoSituacao || '',
      dtInicioInscProvisoria: editingProfissional.dtInicioInscProvisoria || '',
      dtVencInscProvisoria: editingProfissional.dtVencInscProvisoria || '',
      dataSolicitacaoBaixa: editingProfissional.dataSolicitacaoBaixa || '',
      dataReabilitacao: editingProfissional.dataReabilitacao || '',
      dataConversaoDefinitiva: editingProfissional.dataConversaoDefinitiva || '',
      transferidoOutroRegional: Boolean(editingProfissional.transferidoOutroRegional),
      nrInscricaoRegionalOrigem: editingProfissional.nrInscricaoRegionalOrigem || '',
      anuidRefAnoInscricaoEmDia: Boolean(editingProfissional.anuidRefAnoInscricaoEmDia),
      ufRegionalOrigem: editingProfissional.ufRegionalOrigem || '',
      anuidadeReduzida: Boolean(editingProfissional.anuidadeReduzida),
      isentoAnuidade: Boolean(editingProfissional.isentoAnuidade),
      eVotante: Boolean(editingProfissional.eVotante),
      eMilitar: Boolean(editingProfissional.eMilitar),
      dtVenctoMilitar: editingProfissional.dtVenctoMilitar || '',
      recadastrado: Boolean(editingProfissional.recadastrado),
      dataRecadastramento: editingProfissional.dataRecadastramento || '',
      estadoCivil: editingProfissional.estadoCivil || 'Solteiro',
      dataMandatoSeguranca: editingProfissional.dataMandatoSeguranca || '',
      orgaoMandatoSeguranca: editingProfissional.orgaoMandatoSeguranca || '',
      observacaoMandato: editingProfissional.observacaoMandato || '',
      formaEnvioBoletoParcelamento: editingProfissional.formaEnvioBoletoParcelamento || '',
      grupoSanguineo: editingProfissional.grupoSanguineo || '',
      fatorRH: editingProfissional.fatorRH || '',
      doadorOrgaosTecidos: Boolean(editingProfissional.doadorOrgaosTecidos),
      participouCursoQualifarma: editingProfissional.participouCursoQualifarma || '',
      rgDataExpedicao: editingProfissional.rgDataExpedicao || '',
      rgDataVencimento: editingProfissional.rgDataVencimento || '',
      tituloEleitoral: editingProfissional.tituloEleitoral || '',
      tituloZona: editingProfissional.tituloZona || '',
      tituloSecao: editingProfissional.tituloSecao || '',
      tituloUfExp: editingProfissional.tituloUfExp || '',
      reservista: editingProfissional.reservista || '',
      cartTrabalho: editingProfissional.cartTrabalho || '',
      cartTrabalhoSerie: editingProfissional.cartTrabalhoSerie || '',
      cartTrabalhoUfExp: editingProfissional.cartTrabalhoUfExp || '',
      cartTrabalhoDataExp: editingProfissional.cartTrabalhoDataExp || '',
      nomeSocial: editingProfissional.nomeSocial || '',
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
      observacoes: editingProfissional.observacoes || '',
      bloqueado: Boolean(editingProfissional.bloqueado),
      motivoBloqueio: editingProfissional.motivoBloqueio || '',
      dataBloqueio: editingProfissional.dataBloqueio || '',
      dataDesbloqueioPrevista: editingProfissional.dataDesbloqueioPrevista || '',
      usuarioBloqueio: editingProfissional.usuarioBloqueio || '',
      observacoesBloqueio: editingProfissional.observacoesBloqueio || ''
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

      {/* Filter Toolbar with Persistent Search & Expandable Advanced Filters */}
      <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-xs space-y-3 text-xs">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="PESQUISAR NOME, CPF, INSCRIÇÃO, CEP, ENDEREÇO..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(1);
              }}
              className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 transition-all uppercase text-xs font-medium"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center space-x-1.5 px-4 py-2.5 rounded-xl border text-xs font-bold transition-all uppercase shadow-2xs cursor-pointer ${
                showFilters ? 'bg-purple-50 border-purple-300 text-purple-700' : 'bg-white border-slate-300 hover:bg-slate-50 text-slate-700'
              }`}
            >
              <Filter className="w-4 h-4 text-purple-600" />
              <span>{showFilters ? 'Ocultar Filtros' : 'Filtros'}</span>
            </button>
            {(searchTerm || inscricaoFilter || situacaoFilter !== 'Todos' || tipoFilter !== 'Todos' || statusFinFilter !== 'Todos' || cepFilter || enderecoFilter || complementoFilter || habilitacaoFilter !== 'Todos' || dataNascimentoFilter || naturalidadeFilter || dtInicioInscProvisoriaFilter || dtVencInscProvisoriaFilter || dataSolicitacaoBaixaFilter || dataReabilitacaoFilter || anuidadeReduzidaFilter !== 'Todos' || isentoAnuidadeFilter !== 'Todos' || eVotanteFilter !== 'Todos' || eMilitarFilter !== 'Todos' || estadoCivilFilter !== 'Todos' || nomeMaeFilter || bloqueadoFilter !== 'Todos' || motivoBloqueioFilter || dataBloqueioFilter) && (
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

        {/* Expandable Advanced Filters */}
        {showFilters && (
          <div className="pt-3 border-t border-slate-100 space-y-4 animate-in fade-in duration-150">
            {/* Bloco 1: Identificação & Classificação Profissional */}
            <div>
              <span className="text-[10px] font-bold text-purple-900 uppercase tracking-wider block mb-1.5">
                1. Identificação & Classificação
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-2.5">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Nº Inscrição (Exato)</label>
                  <input
                    type="text"
                    placeholder="EX: 1000..."
                    value={inscricaoFilter}
                    onChange={(e) => {
                      setInscricaoFilter(e.target.value);
                      setPage(1);
                    }}
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-mono font-bold uppercase text-xs"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Tipo de Profissional</label>
                  <select
                    value={tipoFilter}
                    onChange={(e) => {
                      setTipoFilter(e.target.value);
                      setPage(1);
                    }}
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-semibold uppercase text-xs"
                  >
                    <option value="Todos">TODOS</option>
                    {cadastrosTipos.map(t => (
                      <option key={t.id} value={t.nome}>{t.nome}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Situação Cadastral</label>
                  <select
                    value={situacaoFilter}
                    onChange={(e) => {
                      setSituacaoFilter(e.target.value);
                      setPage(1);
                    }}
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-semibold uppercase text-xs"
                  >
                    <option value="Todos">TODAS</option>
                    {cadastrosSituacoes.map(s => (
                      <option key={s.id} value={s.nome}>{s.nome}</option>
                    ))}
                    {!cadastrosSituacoes.some(s => s.nome.toLowerCase() === 'remido') && <option value="Remido">REMIDO</option>}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Status Financeiro</label>
                  <select
                    value={statusFinFilter}
                    onChange={(e) => {
                      setStatusFinFilter(e.target.value);
                      setPage(1);
                    }}
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-semibold uppercase text-xs"
                  >
                    <option value="Todos">TODOS</option>
                    <option value="Adimplente">ADIMPLENTE</option>
                    <option value="Inadimplente">INADIMPLENTE</option>
                    <option value="Isento">ISENTO</option>
                    <option value="Parcelamento">PARCELAMENTO</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Habilitação</label>
                  <select
                    value={habilitacaoFilter}
                    onChange={(e) => {
                      setHabilitacaoFilter(e.target.value);
                      setPage(1);
                    }}
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-semibold uppercase text-xs"
                  >
                    <option value="Todos">TODAS</option>
                    {cadastrosHabilitacoes.map(h => (
                      <option key={h.id} value={h.nome}>{h.nome}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Naturalidade</label>
                  <input
                    type="text"
                    placeholder="MANAUS/AM..."
                    value={naturalidadeFilter}
                    onChange={(e) => {
                      setNaturalidadeFilter(e.target.value);
                      setPage(1);
                    }}
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-xl uppercase font-medium text-xs"
                  />
                </div>
              </div>
            </div>

            {/* Bloco 2: Datas & Prazos Oficiais */}
            <div>
              <span className="text-[10px] font-bold text-purple-900 uppercase tracking-wider block mb-1.5">
                2. Datas & Prazos Cadastrais
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Data de Nascimento</label>
                  <input
                    type="date"
                    value={dataNascimentoFilter}
                    onChange={(e) => {
                      setDataNascimentoFilter(e.target.value);
                      setPage(1);
                    }}
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-xl font-mono text-xs"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Dt. Início Insc. Provisória</label>
                  <input
                    type="date"
                    value={dtInicioInscProvisoriaFilter}
                    onChange={(e) => {
                      setDtInicioInscProvisoriaFilter(e.target.value);
                      setPage(1);
                    }}
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-xl font-mono text-xs"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Dt. Venc. Insc. Provisória</label>
                  <input
                    type="date"
                    value={dtVencInscProvisoriaFilter}
                    onChange={(e) => {
                      setDtVencInscProvisoriaFilter(e.target.value);
                      setPage(1);
                    }}
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-xl font-mono text-xs"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Data Solicitação Baixa</label>
                  <input
                    type="date"
                    value={dataSolicitacaoBaixaFilter}
                    onChange={(e) => {
                      setDataSolicitacaoBaixaFilter(e.target.value);
                      setPage(1);
                    }}
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-xl font-mono text-xs"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Data da Reabilitação</label>
                  <input
                    type="date"
                    value={dataReabilitacaoFilter}
                    onChange={(e) => {
                      setDataReabilitacaoFilter(e.target.value);
                      setPage(1);
                    }}
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-xl font-mono text-xs"
                  />
                </div>
              </div>
            </div>

            {/* Bloco 3: Dados Pessoais & Localização */}
            <div>
              <span className="text-[10px] font-bold text-purple-900 uppercase tracking-wider block mb-1.5">
                3. Dados Pessoais, Filiação & Endereço
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Nome da Mãe</label>
                  <input
                    type="text"
                    placeholder="NOME DA MÃE..."
                    value={nomeMaeFilter}
                    onChange={(e) => {
                      setNomeMaeFilter(e.target.value);
                      setPage(1);
                    }}
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-xl uppercase font-medium text-xs"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Estado Civil</label>
                  <select
                    value={estadoCivilFilter}
                    onChange={(e) => {
                      setEstadoCivilFilter(e.target.value);
                      setPage(1);
                    }}
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-semibold uppercase text-xs"
                  >
                    <option value="Todos">TODOS</option>
                    <option value="Solteiro">SOLTEIRO(A)</option>
                    <option value="Casado">CASADO(A)</option>
                    <option value="Divorciado">DIVORCIADO(A)</option>
                    <option value="Viúvo">VIÚVO(A)</option>
                    <option value="Separado">SEPARADO(A)</option>
                    <option value="União Estável">UNIÃO ESTÁVEL</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">CEP</label>
                  <input
                    type="text"
                    placeholder="00000-000..."
                    value={cepFilter}
                    onChange={(e) => {
                      setCepFilter(e.target.value);
                      setPage(1);
                    }}
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-xl uppercase font-medium font-mono text-xs"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Endereço / Bairro</label>
                  <input
                    type="text"
                    placeholder="LOGRADOURO OU BAIRRO..."
                    value={enderecoFilter}
                    onChange={(e) => {
                      setEnderecoFilter(e.target.value);
                      setPage(1);
                    }}
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-xl uppercase font-medium text-xs"
                  />
                </div>
              </div>
            </div>

            {/* Bloco 4: Isenções & Obrigações */}
            <div>
              <span className="text-[10px] font-bold text-purple-900 uppercase tracking-wider block mb-1.5">
                4. Isenções, Direitos & Situação Militar
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Anuidade Reduzida?</label>
                  <select
                    value={anuidadeReduzidaFilter}
                    onChange={(e) => {
                      setAnuidadeReduzidaFilter(e.target.value);
                      setPage(1);
                    }}
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-semibold uppercase text-xs"
                  >
                    <option value="Todos">TODOS</option>
                    <option value="Sim">SIM (REDUZIDA)</option>
                    <option value="Não">NÃO (INTEGRAL)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Isento de Anuidade</label>
                  <select
                    value={isentoAnuidadeFilter}
                    onChange={(e) => {
                      setIsentoAnuidadeFilter(e.target.value);
                      setPage(1);
                    }}
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-semibold uppercase text-xs"
                  >
                    <option value="Todos">TODOS</option>
                    <option value="Sim">SIM (ISENTO)</option>
                    <option value="Não">NÃO</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">É Votante?</label>
                  <select
                    value={eVotanteFilter}
                    onChange={(e) => {
                      setEVotanteFilter(e.target.value);
                      setPage(1);
                    }}
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-semibold uppercase text-xs"
                  >
                    <option value="Todos">TODOS</option>
                    <option value="Sim">SIM (VOTANTE)</option>
                    <option value="Não">NÃO (NÃO VOTANTE)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">É Militar?</label>
                  <select
                    value={eMilitarFilter}
                    onChange={(e) => {
                      setEMilitarFilter(e.target.value);
                      setPage(1);
                    }}
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-semibold uppercase text-xs"
                  >
                    <option value="Todos">TODOS</option>
                    <option value="Sim">SIM (MILITAR)</option>
                    <option value="Não">NÃO (CIVIL)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Bloco 5: Controle de Bloqueio do Cadastro */}
            <div className="p-3 bg-red-50/50 border border-red-200/80 rounded-xl space-y-2">
              <span className="text-[10px] font-bold text-red-900 uppercase tracking-wider block">
                5. Status de Bloqueio do Cadastro do Profissional
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <div>
                  <label className="block text-[10px] font-bold text-slate-700 uppercase mb-1">Status de Bloqueio</label>
                  <select
                    value={bloqueadoFilter}
                    onChange={(e) => {
                      setBloqueadoFilter(e.target.value);
                      setPage(1);
                    }}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-xl text-slate-900 font-semibold uppercase text-xs"
                  >
                    <option value="Todos">TODOS OS STATUS</option>
                    <option value="Sim">🔒 APENAS BLOQUEADOS</option>
                    <option value="Não">🟢 APENAS DESBLOQUEADOS / ATIVOS</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-700 uppercase mb-1">Motivo do Bloqueio</label>
                  <input
                    type="text"
                    placeholder="MOTIVO DO BLOQUEIO..."
                    value={motivoBloqueioFilter}
                    onChange={(e) => {
                      setMotivoBloqueioFilter(e.target.value);
                      setPage(1);
                    }}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-xl uppercase font-medium text-xs"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-700 uppercase mb-1">Data do Bloqueio</label>
                  <input
                    type="date"
                    value={dataBloqueioFilter}
                    onChange={(e) => {
                      setDataBloqueioFilter(e.target.value);
                      setPage(1);
                    }}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-xl font-mono text-xs"
                  />
                </div>
              </div>
            </div>
          </div>
        )}
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
                        <div 
                          onClick={() => prof.fotoUrl && setPreviewPhotoModal({ 
                            url: prof.fotoUrl, 
                            nome: prof.nome, 
                            info: `Inscrição: ${prof.inscricao} • ${prof.tipoAssociado}` 
                          })}
                          className={`group relative w-10 h-10 rounded-full bg-purple-100 border border-purple-200 flex items-center justify-center overflow-hidden shrink-0 font-bold text-purple-700 text-xs shadow-2xs ${
                            prof.fotoUrl ? 'cursor-pointer hover:ring-2 hover:ring-purple-500 hover:scale-105 transition-all' : ''
                          }`}
                          title={prof.fotoUrl ? "Clique para visualizar a foto em tamanho grande" : prof.nome}
                        >
                          {prof.fotoUrl ? (
                            <>
                              <img src={prof.fotoUrl} alt={prof.nome} className="w-full h-full object-cover transition-transform group-hover:scale-110" />
                              <div className="absolute inset-0 bg-slate-950/45 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white">
                                <Eye className="w-4 h-4 drop-shadow-sm" />
                              </div>
                            </>
                          ) : (
                            prof.nome.substring(0, 2).toUpperCase()
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono font-bold text-purple-800">{prof.inscricao}</span>
                            {(prof.situacao === 'Provisório' || prof.situacao === 'Provisoria' || prof.inscricao?.includes('PROV') || Boolean(prof.dtVencInscProvisoria)) && (
                              <span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 text-[9px] font-bold border border-amber-300 uppercase shrink-0">
                                PROV
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono">{prof.dataInscricao}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <div className="font-bold text-slate-900 uppercase">{prof.nome}</div>
                        {prof.bloqueado && (
                          <span className="px-2 py-0.5 rounded bg-rose-600 text-white font-bold text-[9px] uppercase">
                            🔴 BLOQUEADO
                          </span>
                        )}
                      </div>
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
                      <div className="text-[10px] text-slate-500 font-mono">
                        CEP: {prof.cep || 'NÃO INF.'} • {prof.telefone || 'S/ TEL'}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                        (prof.situacao || '').toLowerCase().startsWith('definit')
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : storageService.isSituacaoProvisoria(prof.situacao)
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : (prof.situacao || '').toLowerCase().startsWith('suspen')
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
                        {storageService.isSituacaoProvisoria(prof.situacao) && (
                          <button
                            onClick={() => setProfToConvertDefinitivo(prof)}
                            title="EFETIVAR INSCRIÇÃO DEFINITIVA (Sequencial Cronológico Definitivo)"
                            className="p-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-300 transition-colors cursor-pointer"
                          >
                            <Sparkles className="w-3.5 h-3.5" />
                          </button>
                        )}
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
                <div 
                  onClick={() => selectedProfissional.fotoUrl && setPreviewPhotoModal({ 
                    url: selectedProfissional.fotoUrl, 
                    nome: selectedProfissional.nome, 
                    info: `Inscrição: ${selectedProfissional.inscricao} • ${selectedProfissional.tipoAssociado}` 
                  })}
                  className={`group relative w-14 h-14 rounded-2xl bg-purple-100 border border-purple-200 flex items-center justify-center overflow-hidden shrink-0 font-bold text-purple-700 text-base shadow-xs ${
                    selectedProfissional.fotoUrl ? 'cursor-pointer hover:ring-2 hover:ring-purple-500 hover:scale-105 transition-all' : ''
                  }`}
                  title={selectedProfissional.fotoUrl ? "Clique para visualizar a foto em tamanho grande" : selectedProfissional.nome}
                >
                  {selectedProfissional.fotoUrl ? (
                    <>
                      <img src={selectedProfissional.fotoUrl} alt={selectedProfissional.nome} className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                      <div className="absolute inset-0 bg-slate-950/45 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center transition-opacity text-white">
                        <Eye className="w-4 h-4 drop-shadow-sm" />
                        <span className="text-[7px] font-bold uppercase mt-0.5 tracking-wider">Ampliar</span>
                      </div>
                    </>
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

              <button
                type="button"
                onClick={() => setViewDetailsTab('historico_alteracoes')}
                className={`flex items-center space-x-1.5 px-4 py-2.5 rounded-xl font-bold text-xs uppercase transition-all cursor-pointer shrink-0 ${
                  viewDetailsTab === 'historico_alteracoes'
                    ? 'bg-purple-600 text-white shadow-md shadow-purple-500/25'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Clock className="w-4 h-4" />
                <span>HISTÓRICO</span>
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
                      <div><span className="text-slate-400 block text-[10px]">CELULAR:</span> <span className="text-slate-800 font-mono">{selectedProfissional.celular || selectedProfissional.telefone || '-'}</span></div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                      <div><span className="text-slate-400 block text-[10px]">E-MAIL PESSOAL:</span> <span className="text-slate-800 lowercase font-mono truncate block">{selectedProfissional.emailPessoal || '-'}</span></div>
                      <div><span className="text-slate-400 block text-[10px]">E-MAIL COMERCIAL:</span> <span className="text-slate-800 lowercase font-mono truncate block">{selectedProfissional.emailComercial || '-'}</span></div>
                    </div>
                  </div>

                  {/* Dados Pessoais Complementares, Documentos & Parâmetros */}
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2 uppercase text-xs">
                    <div className="font-bold text-purple-900 uppercase text-xs pb-2 border-b border-slate-200 flex items-center space-x-1.5">
                      <Hash className="w-4 h-4 text-purple-600" />
                      <span>DOCUMENTAÇÃO ADICIONAL & PARÂMETROS</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div><span className="text-slate-400 block text-[10px]">SEXO:</span> <strong className="text-slate-800">{selectedProfissional.sexo === 'M' ? 'MASCULINO' : selectedProfissional.sexo === 'F' ? 'FEMININO' : selectedProfissional.sexo || '-'}</strong></div>
                      <div><span className="text-slate-400 block text-[10px]">ESTADO CIVIL:</span> <strong className="text-slate-800">{selectedProfissional.estadoCivil || 'SOLTEIRO'}</strong></div>
                    </div>
                    {selectedProfissional.nomeSocial && (
                      <div><span className="text-slate-400 block text-[10px]">NOME SOCIAL:</span> <span className="text-slate-800 font-bold">{selectedProfissional.nomeSocial}</span></div>
                    )}
                    <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-slate-200/60">
                      <div><span className="text-slate-400 block text-[10px]">RG EXPEDIÇÃO:</span> <span className="text-slate-800 font-mono text-[10px] block">{selectedProfissional.rgDataExpedicao || '-'}</span></div>
                      <div><span className="text-slate-400 block text-[10px]">RG VENCIMENTO:</span> <span className="text-slate-800 font-mono text-[10px] block">{selectedProfissional.rgDataVencimento || '-'}</span></div>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-xs pt-1 border-t border-slate-200/60">
                      <div><span className="text-slate-400 block text-[10px]">GRUPO SANGUÍNEO:</span> <span className="text-slate-800 font-bold">{selectedProfissional.grupoSanguineo || '-'}</span></div>
                      <div><span className="text-slate-400 block text-[10px]">FATOR RH:</span> <span className="text-slate-800 font-bold">{selectedProfissional.fatorRH || '-'}</span></div>
                      <div><span className="text-slate-400 block text-[10px]">DOADOR ÓRGÃOS:</span> <span className={selectedProfissional.doadorOrgaosTecidos ? 'text-emerald-700 font-bold' : 'text-slate-500 font-bold'}>{selectedProfissional.doadorOrgaosTecidos ? 'SIM' : 'NÃO'}</span></div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-slate-200/60">
                      <div><span className="text-slate-400 block text-[10px]">TÍTULO ELEITORAL:</span> <span className="text-slate-800 font-mono text-[10px] truncate block">{selectedProfissional.tituloEleitoral || '-'} (ZONA: {selectedProfissional.tituloZona || '-'} SEÇÃO: {selectedProfissional.tituloSecao || '-'} UF: {selectedProfissional.tituloUfExp || '-'})</span></div>
                      <div><span className="text-slate-400 block text-[10px]">RESERVISTA:</span> <span className="text-slate-800 font-mono text-[10px] truncate block">{selectedProfissional.reservista || '-'}</span></div>
                    </div>
                    <div className="grid grid-cols-1 gap-1">
                      <div><span className="text-slate-400 block text-[10px]">CARTEIRA DE TRABALHO:</span> <span className="text-slate-800 font-mono text-[10px] block truncate">{selectedProfissional.cartTrabalho || '-'} (SÉRIE: {selectedProfissional.cartTrabalhoSerie || '-'} UF: {selectedProfissional.cartTrabalhoUfExp || '-'} DATA EXP: {selectedProfissional.cartTrabalhoDataExp || '-'})</span></div>
                      <div><span className="text-slate-400 block text-[10px]">CURSO QUALIFARMA:</span> <span className="text-slate-800 font-bold">{selectedProfissional.participouCursoQualifarma || 'NÃO'}</span></div>
                    </div>
                    <div className="pt-2 border-t border-slate-200/60 grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10px] font-bold text-slate-600">
                      <div className="p-1 rounded bg-slate-100 flex flex-col justify-center">
                        <span className="text-[8px] text-slate-400">VOTANTE?</span>
                        <span className={selectedProfissional.eVotante !== false ? 'text-emerald-700' : 'text-rose-700'}>{selectedProfissional.eVotante !== false ? 'SIM' : 'NÃO'}</span>
                      </div>
                      <div className="p-1 rounded bg-slate-100 flex flex-col justify-center">
                        <span className="text-[8px] text-slate-400">MILITAR?</span>
                        <span className={selectedProfissional.eMilitar ? 'text-blue-700' : 'text-slate-500'}>{selectedProfissional.eMilitar ? `SIM (${selectedProfissional.dtVenctoMilitar || '-'})` : 'NÃO'}</span>
                      </div>
                      <div className="p-1 rounded bg-slate-100 flex flex-col justify-center">
                        <span className="text-[8px] text-slate-400">ANUID. REDUZIDA?</span>
                        <span className={selectedProfissional.anuidadeReduzida ? 'text-indigo-700' : 'text-slate-500'}>{selectedProfissional.anuidadeReduzida ? 'SIM' : 'NÃO'}</span>
                      </div>
                      <div className="p-1 rounded bg-slate-100 flex flex-col justify-center">
                        <span className="text-[8px] text-slate-400">ISENTO ANUIDADE?</span>
                        <span className={selectedProfissional.isentoAnuidade ? 'text-purple-700' : 'text-slate-500'}>{selectedProfissional.isentoAnuidade ? 'SIM' : 'NÃO'}</span>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-slate-200/60">
                      <div><span className="text-slate-400 block text-[10px]">RECADASTRAMENTO:</span> <span className="text-slate-800 font-bold">{selectedProfissional.recadastrado ? `SIM (${selectedProfissional.dataRecadastramento || '-'})` : 'NÃO'}</span></div>
                      <div><span className="text-slate-400 block text-[10px]">FORMA ENVIO BOLETO:</span> <span className="text-slate-800 font-bold">{selectedProfissional.formaEnvioBoletoParcelamento || 'NÃO CONFIGURADO'}</span></div>
                    </div>
                    {selectedProfissional.dataMandatoSeguranca && (
                      <div className="p-2 bg-yellow-50 border border-yellow-200 rounded text-[10px] text-yellow-900 mt-1 font-bold">
                        ⚠️ MANDATO DE SEGURANÇA ATIVO DESDE {selectedProfissional.dataMandatoSeguranca} ({selectedProfissional.orgaoMandatoSeguranca || 'NÃO ESPECIFICADO'})
                        {selectedProfissional.observacaoMandato && <span className="block font-medium mt-0.5 lowercase font-mono">{selectedProfissional.observacaoMandato}</span>}
                      </div>
                    )}
                  </div>

                  {/* Formação & Registro */}
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2 uppercase">
                    <div className="font-bold text-purple-900 uppercase text-xs pb-2 border-b border-slate-200 flex items-center space-x-1.5">
                      <GraduationCap className="w-4 h-4 text-purple-600" />
                      <span>FORMAÇÃO, REGISTRO & INSCRIÇÃO</span>
                    </div>
                    <div><span className="text-slate-400 block text-[10px]">FACULDADE / INSTITUIÇÃO:</span> <strong className="text-slate-800">{selectedProfissional.faculdade || '-'}</strong></div>
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div><span className="text-slate-400 block text-[10px]">COLAÇÃO DE GRAU:</span> <span className="text-slate-800 font-mono">{selectedProfissional.dataColacaoGrau || '-'}</span></div>
                      <div><span className="text-slate-400 block text-[10px]">EXPEDIÇÃO DIPLOMA:</span> <span className="text-slate-800 font-mono">{selectedProfissional.dataExpDiploma || '-'}</span></div>
                      <div><span className="text-slate-400 block text-[10px]">DATA INSCRIÇÃO:</span> <span className="text-slate-800 font-mono font-bold">{selectedProfissional.dataInscricao || '-'}</span></div>
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

                {/* Observações Gerais */}
                {selectedProfissional.observacoes && (
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-1.5 uppercase text-xs">
                    <div className="font-bold text-purple-900 uppercase text-xs pb-1 border-b border-slate-200 flex items-center space-x-1.5">
                      <FileText className="w-4 h-4 text-purple-600" />
                      <span>OBSERVAÇÕES GERAIS</span>
                    </div>
                    <p className="text-slate-700 normal-case font-medium leading-relaxed whitespace-pre-wrap">
                      {selectedProfissional.observacoes}
                    </p>
                  </div>
                )}

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

                {/* Situação Cadastral, Motivo e Informações de Bloqueio */}
                <div className={`p-4 rounded-2xl border space-y-2 uppercase text-xs ${
                  selectedProfissional.bloqueado ? 'bg-red-50/85 border-red-300 text-red-950' : 'bg-slate-50 border-slate-200/80 text-slate-800'
                }`}>
                  <div className="font-bold uppercase text-xs pb-2 border-b border-slate-200 flex items-center justify-between">
                    <span className="flex items-center space-x-1.5">
                      <ShieldAlert className={`w-4 h-4 ${selectedProfissional.bloqueado ? 'text-red-600' : 'text-purple-600'}`} />
                      <span>SITUAÇÃO, MOTIVO & CONTROLE DE BLOQUEIO</span>
                    </span>
                    <span className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] ${
                      selectedProfissional.bloqueado ? 'bg-red-600 text-white' : 'bg-emerald-100 text-emerald-800'
                    }`}>
                      {selectedProfissional.bloqueado ? '🔒 BLOQUEADO' : '🟢 ATIVO'}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <span className="text-slate-400 block text-[10px]">SITUAÇÃO:</span>
                      <strong>{selectedProfissional.situacao}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">MOTIVO DA SITUAÇÃO:</span>
                      <span>{selectedProfissional.motivoSituacao || '-'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">REGIONAL DE ORIGEM:</span>
                      <span>{selectedProfissional.transferidoOutroRegional ? `SIM (${selectedProfissional.nrInscricaoRegionalOrigem || '-'}/${selectedProfissional.ufRegionalOrigem || 'AM'})` : 'NÃO'}</span>
                    </div>
                  </div>
                  {selectedProfissional.bloqueado && (
                    <div className="p-3 bg-white border border-red-200 rounded-xl space-y-1 mt-2 text-[11px]">
                      <div><span className="text-red-700 font-bold">MOTIVO DO BLOQUEIO:</span> {selectedProfissional.motivoBloqueio || 'NÃO INFORMADO'}</div>
                      <div className="grid grid-cols-2 gap-2 font-mono">
                        <div><span className="text-slate-400">DATA BLOQUEIO:</span> {selectedProfissional.dataBloqueio || '-'}</div>
                        <div><span className="text-slate-400">PREVISÃO DESBLOQUEIO:</span> {selectedProfissional.dataDesbloqueioPrevista || 'NÃO INFORMADA'}</div>
                      </div>
                      <div><span className="text-slate-400">AUTORIDADE / RESPONSÁVEL:</span> {selectedProfissional.usuarioBloqueio || '-'}</div>
                      {selectedProfissional.observacoesBloqueio && (
                        <div><span className="text-slate-400">OBSERVAÇÕES:</span> {selectedProfissional.observacoesBloqueio}</div>
                      )}
                    </div>
                  )}
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

            {/* CONTEÚDO DA ABA 5: HISTÓRICO DE AUDITORIA */}
            {viewDetailsTab === 'historico_alteracoes' && (
              <div className="space-y-4">
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl">
                  <span className="font-bold text-slate-900 uppercase text-xs flex items-center space-x-1.5">
                    <Clock className="w-4 h-4 text-purple-600" />
                    <span>Registro Completo de Auditoria de Dados</span>
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono mt-0.5 block">
                    HISTÓRICO COMPLETO DE ALTERAÇÕES REALIZADAS PELO SISTEMA E SEUS OPERADORES
                  </span>
                </div>

                {storageService.getHistoricoAuditoriaByTarget(selectedProfissional.id, 'PROFISSIONAL').length === 0 ? (
                  <div className="p-12 text-center text-slate-400 bg-white border border-slate-200 rounded-2xl border-dashed">
                    <Clock className="w-10 h-10 mx-auto text-slate-300 opacity-60 mb-2.5" />
                    <span className="font-bold uppercase text-xs block text-slate-700">Sem alterações registradas</span>
                    <p className="text-[10px] text-slate-500 mt-1 uppercase">ESTE CADASTRO NÃO POSSUI ATUALIZAÇÕES OU O HISTÓRICO DE AUDITORIA ESTÁ LIMPO.</p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-1">
                    {storageService.getHistoricoAuditoriaByTarget(selectedProfissional.id, 'PROFISSIONAL').map((audit) => (
                      <div key={audit.id} className="p-3.5 bg-white border border-slate-200 rounded-xl space-y-2 relative shadow-2xs hover:border-purple-300 transition-colors">
                        <div className="flex flex-wrap items-center justify-between gap-1.5 text-[10px]">
                          <span className="font-extrabold uppercase bg-purple-100 text-purple-800 px-2 py-0.5 rounded-md border border-purple-200">
                            CAMPO: {audit.campo}
                          </span>
                          <div className="flex items-center space-x-2 text-slate-400 font-bold font-mono">
                            <span className="bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded uppercase">OPERADOR: {audit.usuario}</span>
                            <span>•</span>
                            <span>{audit.dataFormatada}</span>
                          </div>
                        </div>
                        {audit.campo === 'CADASTRO' ? (
                          <div className="p-2.5 bg-purple-50/50 border border-purple-100 rounded-lg text-xs font-semibold text-purple-900 uppercase">
                            {audit.valorNovo}
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs uppercase font-medium">
                            <div className="p-2.5 bg-slate-50 border border-slate-100 rounded-lg text-slate-600">
                              <span className="text-[9px] text-slate-400 block font-bold">VALOR ANTERIOR:</span>
                              <span className="font-mono mt-0.5 block truncate max-w-full text-ellipsis overflow-hidden">{audit.valorAnterior || <em className="text-slate-400 text-[10px]">VAZIO</em>}</span>
                            </div>
                            <div className="p-2.5 bg-emerald-50/40 border border-emerald-100 rounded-lg text-emerald-800">
                              <span className="text-[9px] text-emerald-400 block font-bold">VALOR NOVO:</span>
                              <span className="font-mono mt-0.5 block font-bold truncate max-w-full text-ellipsis overflow-hidden">{audit.valorNovo || <em className="text-emerald-400 text-[10px]">VAZIO</em>}</span>
                            </div>
                          </div>
                        )}
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

            {/* Inscription Cronológica Box with Definitiva / Provisória Toggle */}
            {!editingProfissional.id ? (
              <div className="p-3 bg-purple-50/70 border border-purple-200 rounded-xl space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center space-x-2.5">
                    <div className="w-7 h-7 rounded-lg bg-purple-600 text-white flex items-center justify-center font-mono text-xs shrink-0">
                      <Hash className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-[10px] text-purple-700 font-bold uppercase block">Inscrição Cronológica Automática:</span>
                      <span className="font-mono font-extrabold text-purple-900 text-sm">{editingProfissional.inscricao}</span>
                    </div>
                  </div>

                  {/* Toggle Definitiva vs Provisória */}
                  <div className="flex items-center gap-1 bg-white p-1 rounded-lg border border-purple-200 shadow-2xs shrink-0">
                    <button
                      type="button"
                      onClick={() => handleSelectTipoInscricao('Definitiva')}
                      className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase transition-all cursor-pointer ${
                        !storageService.isSituacaoProvisoria(editingProfissional.situacao)
                          ? 'bg-purple-600 text-white shadow-xs'
                          : 'text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      Definitiva
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSelectTipoInscricao('Provisória')}
                      className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase transition-all cursor-pointer ${
                        storageService.isSituacaoProvisoria(editingProfissional.situacao)
                          ? 'bg-amber-600 text-white shadow-xs'
                          : 'text-amber-800 hover:bg-amber-50'
                      }`}
                    >
                      Provisória
                    </button>
                  </div>
                </div>

                {storageService.isSituacaoProvisoria(editingProfissional.situacao) && (
                  <div className="text-[10px] text-amber-900 bg-amber-100/70 border border-amber-300 p-2 rounded-lg flex items-center justify-between">
                    <span>
                      Inscrição Provisória com validade de {councilConfig.validadeProvisoriaMesesProfissional ?? 12} meses ({editingProfissional.dtInicioInscProvisoria} a {editingProfissional.dtVencInscProvisoria}).
                    </span>
                    <span className="font-bold uppercase text-[9px] bg-amber-200 px-1.5 py-0.5 rounded text-amber-900 shrink-0">
                      Provisório
                    </span>
                  </div>
                )}
              </div>
            ) : (
              storageService.isSituacaoProvisoria(editingProfissional.situacao) && (
                <div className="p-3 bg-amber-50 border border-amber-300 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-start sm:items-center space-x-2.5">
                    <div className="w-7 h-7 rounded-lg bg-amber-600 text-white flex items-center justify-center font-mono text-xs shrink-0">
                      <Sparkles className="w-4 h-4 animate-pulse" />
                    </div>
                    <div>
                      <span className="text-[10px] text-amber-800 font-bold uppercase block">Inscrição Provisória Ativa: {editingProfissional.inscricao}</span>
                      <span className="text-[11px] text-slate-600 block sm:inline">Período provisório concluído? Converta agora para definitiva dando continuidade cronológica.</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setIsModalOpen(false);
                      setProfToConvertDefinitivo(editingProfissional as Profissional);
                    }}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg uppercase shadow-xs flex items-center space-x-1.5 cursor-pointer shrink-0 self-end sm:self-auto"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Efetivar Definitivo</span>
                  </button>
                </div>
              )
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
              <button
                type="button"
                onClick={() => setModalTab('bloqueio')}
                className={`px-3 py-2 rounded-lg font-bold text-[11px] uppercase transition-all shrink-0 flex items-center space-x-1.5 cursor-pointer ${
                  modalTab === 'bloqueio' ? 'bg-red-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>6. Bloqueio</span>
                {editingProfissional.bloqueado && (
                  <span className="text-[9px] font-extrabold px-1.5 py-0.2 rounded-full uppercase bg-white text-red-700 ml-1">
                    BLOQUEADO
                  </span>
                )}
              </button>
              <button
                type="button"
                onClick={() => setModalTab('historico')}
                className={`px-3 py-2 rounded-lg font-bold text-[11px] uppercase transition-all shrink-0 flex items-center space-x-1.5 cursor-pointer ${
                  modalTab === 'historico' ? 'bg-purple-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <History className="w-3.5 h-3.5" />
                <span>7. Histórico</span>
              </button>
            </div>

            <form onSubmit={handleSaveProfissional} className="space-y-4">
              {/* ABA BLOQUEIO */}
              {modalTab === 'bloqueio' && (
                <div className="space-y-4 p-4 bg-red-50/40 border border-red-200 rounded-xl">
                  <div className="flex items-center space-x-2 text-red-900 font-bold uppercase text-xs mb-2">
                    <ShieldAlert className="w-4 h-4 text-red-600" />
                    <span>Controle de Bloqueio e Restrição Cadastral do Profissional</span>
                  </div>

                  <div className="p-3 bg-white border border-red-200 rounded-xl flex items-center justify-between shadow-xs">
                    <div>
                      <span className="text-[10px] font-bold text-slate-700 uppercase block">Status de Bloqueio do Cadastro</span>
                      <span className={`text-xs font-bold uppercase ${editingProfissional.bloqueado ? 'text-red-600' : 'text-emerald-600'}`}>
                        {editingProfissional.bloqueado ? '🔒 CADASTRO BLOQUEADO' : '🟢 CADASTRO ATIVO / DESBLOQUEADO'}
                      </span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={Boolean(editingProfissional.bloqueado)}
                        onChange={(e) => {
                          const isChecked = e.target.checked;
                          const todayStr = new Date().toLocaleDateString('pt-BR');
                          setEditingProfissional(prev => prev ? ({ 
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
                        value={editingProfissional.motivoBloqueio || ''}
                        onChange={(e) => setEditingProfissional(prev => prev ? ({ ...prev, motivoBloqueio: e.target.value.toUpperCase() }) : null)}
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 uppercase font-semibold text-xs"
                      >
                        <option value="">SELECIONE O MOTIVO DO BLOQUEIO</option>
                        <option value="INADIMPLENCIA ANUIDADE">INADIMPLÊNCIA DE ANUIDADE</option>
                        <option value="PROCESSO ÉTICO DISCIPLINAR">PROCESSO ÉTICO DISCIPLINAR</option>
                        <option value="SUSPENSÃO JUDICIAL">SUSPENSÃO JUDICIAL</option>
                        <option value="FALTA DE DOCUMENTAÇÃO OBRIGATÓRIA">FALTA DE DOCUMENTAÇÃO OBRIGATÓRIA</option>
                        <option value="OUTROS">OUTROS</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-slate-700 font-bold mb-1 uppercase text-[10px]">Data do Bloqueio</label>
                      <input
                        type="date"
                        value={dateToInput(editingProfissional.dataBloqueio || '')}
                        onChange={(e) => setEditingProfissional(prev => prev ? ({ ...prev, dataBloqueio: inputToDate(e.target.value) }) : null)}
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 font-mono text-xs cursor-pointer"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-700 font-bold mb-1 uppercase text-[10px]">Data Prevista de Desbloqueio</label>
                      <input
                        type="date"
                        value={dateToInput(editingProfissional.dataDesbloqueioPrevista || '')}
                        onChange={(e) => setEditingProfissional(prev => prev ? ({ ...prev, dataDesbloqueioPrevista: inputToDate(e.target.value) }) : null)}
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 font-mono text-xs cursor-pointer"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-700 font-bold mb-1 uppercase text-[10px]">Usuário Responsável / Autoridade</label>
                      <input
                        type="text"
                        value={editingProfissional.usuarioBloqueio || ''}
                        onChange={(e) => setEditingProfissional(prev => prev ? ({ ...prev, usuarioBloqueio: e.target.value.toUpperCase() }) : null)}
                        placeholder="EX: SETOR JURÍDICO / DIRETORIA"
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 uppercase font-semibold text-xs"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold mb-1 uppercase text-[10px]">Observações / Justificativa do Bloqueio</label>
                    <textarea
                      rows={3}
                      value={editingProfissional.observacoesBloqueio || ''}
                      onChange={(e) => setEditingProfissional(prev => prev ? ({ ...prev, observacoesBloqueio: e.target.value.toUpperCase() }) : null)}
                      placeholder="INFORME OS DETALHES, NÚMERO DO PROCESSO OU DELIBERAÇÃO..."
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 uppercase text-xs"
                    />
                  </div>
                </div>
              )}

              {/* ABA HISTÓRICO DE ALTERAÇÕES */}
              {modalTab === 'historico' && (
                <div className="space-y-4">
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
                    <div className="flex items-center space-x-2 text-slate-800 font-bold uppercase text-xs mb-1">
                      <History className="w-4 h-4 text-purple-600" />
                      <span>Histórico de Alterações Cadastrais (Trilha de Auditoria)</span>
                    </div>
                    <p className="text-[11px] text-slate-500 uppercase font-semibold leading-relaxed">
                      Todas as alterações feitas nos campos deste profissional são registradas automaticamente na trilha de auditoria do conselho, identificando o usuário responsável, data/hora e valores antes/depois da alteração.
                    </p>
                  </div>

                  <div className="border border-slate-200 rounded-xl overflow-hidden max-h-[400px] overflow-y-auto bg-white shadow-xs">
                    {!editingProfissional.id ? (
                      <div className="p-8 text-center text-slate-500 text-xs">
                        <History className="w-8 h-8 mx-auto text-slate-300 mb-2 opacity-50 animate-pulse" />
                        <span className="text-xs uppercase font-extrabold block">Novo Cadastro</span>
                        <span className="text-[10px] text-slate-400 uppercase font-semibold">O histórico será gerado após salvar o profissional pela primeira vez.</span>
                      </div>
                    ) : storageService.getHistoricoAuditoriaByTarget(editingProfissional.id, 'PROFISSIONAL').length === 0 ? (
                      <div className="p-8 text-center text-slate-500 text-xs">
                        <History className="w-8 h-8 mx-auto text-slate-300 mb-2 opacity-50" />
                        <span className="text-xs uppercase font-extrabold block">Sem Alterações</span>
                        <span className="text-[10px] text-slate-400 uppercase font-semibold">Nenhuma alteração cadastral foi registrada para este profissional até o momento.</span>
                      </div>
                    ) : (
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="bg-slate-100 border-b border-slate-200 text-[10px] text-slate-700 font-extrabold uppercase">
                            <th className="px-3.5 py-2.5">Data/Hora</th>
                            <th className="px-3.5 py-2.5">Usuário</th>
                            <th className="px-3.5 py-2.5">Campo Alterado</th>
                            <th className="px-3.5 py-2.5">Valor Anterior</th>
                            <th className="px-3.5 py-2.5">Novo Valor</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {storageService.getHistoricoAuditoriaByTarget(editingProfissional.id, 'PROFISSIONAL').map((log) => (
                            <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                              <td className="px-3.5 py-3 font-mono font-bold text-slate-600 shrink-0 whitespace-nowrap">
                                {log.dataFormatada}
                              </td>
                              <td className="px-3.5 py-3 whitespace-nowrap">
                                <span className="px-2 py-0.5 bg-purple-50 text-purple-700 font-extrabold uppercase rounded-md text-[9px] border border-purple-100">
                                  {log.usuario || 'SISTEMA'}
                                </span>
                              </td>
                              <td className="px-3.5 py-3 font-semibold text-slate-700 uppercase">
                                {log.campo}
                              </td>
                              <td className="px-3.5 py-3 text-red-600 line-through max-w-[150px] truncate" title={log.valorAnterior || ''}>
                                {log.valorAnterior || '-'}
                              </td>
                              <td className="px-3.5 py-3 text-emerald-700 font-semibold max-w-[150px] truncate" title={log.valorNovo || ''}>
                                {log.valorNovo || '-'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                </div>
              )}

              {/* ABA 1: DADOS PESSOAIS */}
              {modalTab === 'dados_pessoais' && (
                <div className="space-y-3.5">
                  {/* Foto do Profissional */}
                  <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center space-x-3.5">
                    <div 
                      onClick={() => editingProfissional.fotoUrl && setPreviewPhotoModal({ 
                        url: editingProfissional.fotoUrl, 
                        nome: editingProfissional.nome || 'Foto do Profissional', 
                        info: 'Pré-visualização da foto carregada' 
                      })}
                      className={`group relative w-16 h-16 rounded-full bg-purple-100 border-2 border-purple-200 flex items-center justify-center overflow-hidden shrink-0 font-bold text-purple-700 text-sm shadow-xs ${
                        editingProfissional.fotoUrl ? 'cursor-pointer hover:ring-2 hover:ring-purple-500 transition-all' : ''
                      }`}
                      title={editingProfissional.fotoUrl ? "Clique para visualizar a foto em tamanho grande" : "Aguardando upload da foto"}
                    >
                      {editingProfissional.fotoUrl ? (
                        <>
                          <img src={editingProfissional.fotoUrl} alt="Foto" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                          <div className="absolute inset-0 bg-slate-950/45 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center transition-opacity text-white">
                            <Eye className="w-4 h-4 drop-shadow-sm" />
                            <span className="text-[7px] font-bold uppercase mt-0.5">Ampliar</span>
                          </div>
                        </>
                      ) : isUploadingPhoto ? (
                        <Loader2 className="w-6 h-6 text-purple-600 animate-spin" />
                      ) : (
                        <Camera className="w-7 h-7 text-purple-400" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-slate-700 font-bold uppercase text-[10px]">
                          Foto do Profissional (Upload Obrigatório) *
                        </label>
                        {editingProfissional.fotoUrl && (
                          <button
                            type="button"
                            onClick={() => setPreviewPhotoModal({ 
                              url: editingProfissional.fotoUrl!, 
                              nome: editingProfissional.nome || 'Foto do Profissional', 
                              info: 'Pré-visualização da foto carregada' 
                            })}
                            className="inline-flex items-center space-x-1 text-[10px] text-purple-700 hover:text-purple-900 font-bold uppercase hover:underline cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Ver foto em tamanho grande</span>
                          </button>
                        )}
                      </div>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handlePhotoFileChange}
                        disabled={isUploadingPhoto}
                        className="w-full text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100 cursor-pointer disabled:opacity-50"
                      />
                      <div className="flex items-center justify-between mt-1 text-[10px] text-slate-400">
                        <span>Formatos aceitos: JPG, PNG, WEBP (Limite ampliado para até 25MB)</span>
                        {isUploadingPhoto && (
                          <span className="text-purple-600 font-semibold flex items-center gap-1">
                            <Loader2 className="w-3 h-3 animate-spin" /> Processando imagem...
                          </span>
                        )}
                      </div>
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
                          councilConfig.validarCPF && editingProfissional.cpf && !isCpfValid ? 'border-rose-400 bg-rose-50/50' : 'border-slate-300'
                        }`}
                      />
                      {councilConfig.validarCPF && editingProfissional.cpf && !isCpfValid && (
                        <span className="text-[10px] text-rose-600 font-semibold block mt-0.5">CPF Inválido</span>
                      )}
                      {!councilConfig.validarCPF && editingProfissional.cpf && (
                        <span className="text-[10px] text-slate-400 font-medium block mt-0.5">Validação de CPF desativada (Qualquer número aceito)</span>
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
                        type="date"
                        value={dateToInput(editingProfissional.dataNascimento || '')}
                        onChange={(e) => setEditingProfissional(prev => ({ ...prev, dataNascimento: inputToDate(e.target.value) }))}
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
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-semibold uppercase text-xs"
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
                        value={
                          (cadastrosSituacoes.find(s => 
                            storageService.isSituacaoProvisoria(s.nome) === storageService.isSituacaoProvisoria(editingProfissional.situacao) &&
                            (storageService.isSituacaoProvisoria(s.nome) || s.nome.toLowerCase() === editingProfissional.situacao?.toLowerCase())
                          )?.nome || editingProfissional.situacao || 'Definitivo').toUpperCase()
                        }
                        onChange={(e) => handleSituacaoChange(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-semibold uppercase text-xs"
                      >
                        {cadastrosSituacoes.map(s => (
                          <option key={s.id} value={s.nome.toUpperCase()}>{s.nome.toUpperCase()}</option>
                        ))}
                        {editingProfissional.situacao && !cadastrosSituacoes.some(s => s.nome.toLowerCase() === editingProfissional.situacao?.toLowerCase()) && (
                          <option value={editingProfissional.situacao.toUpperCase()}>{editingProfissional.situacao.toUpperCase()} (Atual)</option>
                        )}
                      </select>
                    </div>
                  </div>

                  {/* SEÇÃO COMPLEMENTAR DO CADASTRO DE PROFISSIONAL (CONFORME ANEXO) */}
                  <div className="space-y-3.5 pt-3 border-t border-slate-200">
                    {/* Motivo da Situação */}
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
                        value={editingProfissional.motivoSituacao || ''}
                        onChange={(e) => setEditingProfissional(prev => ({ ...prev, motivoSituacao: e.target.value.toUpperCase() }))}
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 uppercase font-semibold text-xs"
                      >
                        <option value="">SELECIONE O MOTIVO DA SITUAÇÃO</option>
                        {cadastrosMotivosSituacaoProf.map(m => (
                          <option key={m.id} value={m.nome}>{m.nome.toUpperCase()}</option>
                        ))}
                        {editingProfissional.motivoSituacao && !cadastrosMotivosSituacaoProf.some(m => m.nome.toLowerCase() === editingProfissional.motivoSituacao?.toLowerCase()) && (
                          <option value={editingProfissional.motivoSituacao}>{editingProfissional.motivoSituacao.toUpperCase()} (Atual)</option>
                        )}
                      </select>
                    </div>

                    {/* Datas Específicas */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
                      <div>
                        <label className="block text-slate-700 font-bold mb-1 uppercase text-[9px]">Dt. Início Insc. Provisória</label>
                        <input
                          type="date"
                          value={dateToInput(editingProfissional.dtInicioInscProvisoria || '')}
                          onChange={(e) => setEditingProfissional(prev => ({ ...prev, dtInicioInscProvisoria: inputToDate(e.target.value) }))}
                          className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-xl font-mono text-xs text-slate-900"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-700 font-bold mb-1 uppercase text-[9px]">Dt. Venc. Insc. Provisória</label>
                        <input
                          type="date"
                          value={dateToInput(editingProfissional.dtVencInscProvisoria || '')}
                          onChange={(e) => setEditingProfissional(prev => ({ ...prev, dtVencInscProvisoria: inputToDate(e.target.value) }))}
                          className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-xl font-mono text-xs text-slate-900"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-700 font-bold mb-1 uppercase text-[9px]">Data Solicitação Baixa</label>
                        <input
                          type="date"
                          value={dateToInput(editingProfissional.dataSolicitacaoBaixa || '')}
                          onChange={(e) => setEditingProfissional(prev => ({ ...prev, dataSolicitacaoBaixa: inputToDate(e.target.value) }))}
                          className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-xl font-mono text-xs text-slate-900"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-700 font-bold mb-1 uppercase text-[9px]">Data da Reabilitação</label>
                        <input
                          type="date"
                          value={dateToInput(editingProfissional.dataReabilitacao || '')}
                          onChange={(e) => setEditingProfissional(prev => ({ ...prev, dataReabilitacao: inputToDate(e.target.value) }))}
                          className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-xl font-mono text-xs text-slate-900"
                        />
                      </div>
                    </div>

                    {/* Regional de Origem */}
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2 text-xs">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 items-center">
                        <label className="flex items-center space-x-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={Boolean(editingProfissional.transferidoOutroRegional)}
                            onChange={(e) => setEditingProfissional(prev => ({ ...prev, transferidoOutroRegional: e.target.checked }))}
                            className="rounded text-purple-600"
                          />
                          <span className="font-bold text-slate-700 uppercase text-[11px]">Transferido de Outro Regional</span>
                        </label>
                        <div>
                          <input
                            type="text"
                            value={editingProfissional.nrInscricaoRegionalOrigem || ''}
                            onChange={(e) => setEditingProfissional(prev => ({ ...prev, nrInscricaoRegionalOrigem: e.target.value.toUpperCase() }))}
                            placeholder="NR. INSCRIÇÃO ORIGEM"
                            className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-xl uppercase font-mono"
                          />
                        </div>
                        <div>
                          <select
                            value={editingProfissional.ufRegionalOrigem || 'AM'}
                            onChange={(e) => setEditingProfissional(prev => ({ ...prev, ufRegionalOrigem: e.target.value }))}
                            className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-xl uppercase font-bold"
                          >
                            {['AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'].map(uf => (
                              <option key={uf} value={uf}>U.F. Origem: {uf}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                      <label className="flex items-center space-x-2 cursor-pointer pt-1">
                        <input
                          type="checkbox"
                          checked={Boolean(editingProfissional.anuidRefAnoInscricaoEmDia)}
                          onChange={(e) => setEditingProfissional(prev => ({ ...prev, anuidRefAnoInscricaoEmDia: e.target.checked }))}
                          className="rounded text-purple-600"
                        />
                        <span className="font-medium text-slate-700 uppercase text-[11px]">Anuid. Ref. Ano da Inscrição em dia no Regional de Origem?</span>
                      </label>
                    </div>

                    {/* Checkboxes e Flags */}
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
                      <label className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={Boolean(editingProfissional.anuidadeReduzida)}
                          onChange={(e) => setEditingProfissional(prev => ({ ...prev, anuidadeReduzida: e.target.checked }))}
                          className="rounded text-purple-600"
                        />
                        <span className="font-medium text-slate-700 uppercase text-[11px]">Anuidade Reduzida?</span>
                      </label>
                      <label className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={Boolean(editingProfissional.isentoAnuidade)}
                          onChange={(e) => setEditingProfissional(prev => ({ ...prev, isentoAnuidade: e.target.checked }))}
                          className="rounded text-purple-600"
                        />
                        <span className="font-medium text-slate-700 uppercase text-[11px]">Isento de Anuidade</span>
                      </label>
                      <label className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={Boolean(editingProfissional.eVotante)}
                          onChange={(e) => setEditingProfissional(prev => ({ ...prev, eVotante: e.target.checked }))}
                          className="rounded text-purple-600"
                        />
                        <span className="font-medium text-slate-700 uppercase text-[11px]">É Votante?</span>
                      </label>
                      <label className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={Boolean(editingProfissional.eMilitar)}
                          onChange={(e) => setEditingProfissional(prev => ({ ...prev, eMilitar: e.target.checked }))}
                          className="rounded text-purple-600"
                        />
                        <span className="font-medium text-slate-700 uppercase text-[11px]">É Militar?</span>
                      </label>
                    </div>

                    {/* Estado Civil e Nome Social */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                      <div>
                        <label className="block text-slate-700 font-bold mb-1 uppercase text-[10px]">Estado Civil</label>
                        <select
                          value={(editingProfissional.estadoCivil || 'SOLTEIRO').toUpperCase()}
                          onChange={(e) => setEditingProfissional(prev => ({ ...prev, estadoCivil: e.target.value.toUpperCase() }))}
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 uppercase font-semibold"
                        >
                          {['Solteiro', 'Casado', 'Viúvo', 'Desquitado', 'Divorciado', 'Outros'].map(ec => (
                            <option key={ec} value={ec.toUpperCase()}>{ec.toUpperCase()}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-slate-700 font-bold mb-1 uppercase text-[10px]">Nome Social</label>
                        <input
                          type="text"
                          value={editingProfissional.nomeSocial || ''}
                          onChange={(e) => setEditingProfissional(prev => ({ ...prev, nomeSocial: e.target.value.toUpperCase() }))}
                          placeholder="NOME SOCIAL (SE HOUVER)"
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 uppercase font-medium"
                        />
                      </div>
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
                        type="date"
                        value={dateToInput(editingProfissional.dataColacaoGrau || '')}
                        onChange={(e) => setEditingProfissional(prev => ({ ...prev, dataColacaoGrau: inputToDate(e.target.value) }))}
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

      {/* ========================================================================= */}
      {/* MODAL: VISUALIZAR FOTO DO PROFISSIONAL EM TAMANHO GRANDE (LIGHTBOX)       */}
      {/* ========================================================================= */}
      {previewPhotoModal && (
        <div 
          className="fixed inset-0 z-70 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 animate-in fade-in duration-200"
          onClick={() => setPreviewPhotoModal(null)}
        >
          <div 
            className="relative bg-slate-900 border border-slate-700/80 rounded-3xl max-w-3xl w-full max-h-[94vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-800 bg-slate-900/90">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-xl bg-purple-600/20 text-purple-400 border border-purple-500/30 flex items-center justify-center">
                  <Eye className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white uppercase tracking-wide">
                    {previewPhotoModal.nome}
                  </h3>
                  {previewPhotoModal.info && (
                    <p className="text-[11px] text-purple-300 font-mono">
                      {previewPhotoModal.info}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <a
                  href={previewPhotoModal.url}
                  download={`foto_${previewPhotoModal.nome.replace(/\s+/g, '_').toLowerCase()}.jpg`}
                  className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
                  title="Baixar foto em alta definição"
                >
                  <Download className="w-4 h-4" />
                </a>
                <button
                  type="button"
                  onClick={() => setPreviewPhotoModal(null)}
                  className="p-2 rounded-xl bg-slate-800 hover:bg-rose-900/50 text-slate-300 hover:text-rose-300 transition-colors cursor-pointer"
                  title="Fechar (Esc)"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Imagem em tamanho grande */}
            <div className="p-4 sm:p-6 flex items-center justify-center overflow-auto bg-slate-950/70 max-h-[75vh]">
              <img 
                src={previewPhotoModal.url} 
                alt={previewPhotoModal.nome} 
                className="max-h-[70vh] max-w-full object-contain rounded-2xl shadow-2xl border border-slate-800 transition-all"
              />
            </div>

            {/* Footer */}
            <div className="px-5 py-3 border-t border-slate-800 bg-slate-900/80 flex items-center justify-between text-[11px] text-slate-400">
              <span className="flex items-center gap-1.5">
                <Camera className="w-3.5 h-3.5 text-purple-400" />
                Foto Oficial em Alta Resolução
              </span>
              <button
                type="button"
                onClick={() => setPreviewPhotoModal(null)}
                className="px-4 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold transition-colors cursor-pointer uppercase text-xs"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Modal de Confirmação para Efetivação de Inscrição Definitiva */}
      {profToConvertDefinitivo && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-lg w-full p-6 shadow-2xl text-xs space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-start space-x-3.5 border-b border-slate-100 pb-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                <Sparkles className="w-5 h-5 text-emerald-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-bold text-slate-900 uppercase">
                  Efetivar Inscrição Definitiva do Profissional
                </h3>
                <p className="text-[11px] text-slate-500 uppercase mt-0.5 font-semibold">
                  Transição oficial de Inscrição Provisória para Definitiva
                </p>
              </div>
              <button
                onClick={() => setProfToConvertDefinitivo(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                <div className="font-bold text-slate-900 text-sm uppercase">{profToConvertDefinitivo.nome}</div>
                <div className="text-[11px] text-slate-600 font-mono">CPF: {maskCPF(profToConvertDefinitivo.cpf)} • {profToConvertDefinitivo.tipoAssociado}</div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl space-y-1">
                  <span className="text-[10px] text-amber-800 font-bold uppercase block">Inscrição Provisória Atual:</span>
                  <span className="text-sm font-mono font-extrabold text-amber-950 block">{profToConvertDefinitivo.inscricao}</span>
                  <span className="text-[10px] text-amber-700 block">Será arquivada no histórico</span>
                </div>

                <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-xl space-y-1">
                  <span className="text-[10px] text-emerald-800 font-bold uppercase block">Nova Inscrição Definitiva:</span>
                  <span className="text-sm font-mono font-extrabold text-emerald-950 block">{storageService.peekNextInscricaoProfissional()}</span>
                  <span className="text-[10px] text-emerald-700 block">Próximo cronológico oficial (+1)</span>
                </div>
              </div>

              <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-[11px] text-blue-900 leading-relaxed">
                <strong>Continuidade Cronológica:</strong> Ao confirmar, o cadastro do profissional receberá a situação <strong>"Definitivo"</strong> e a numeração cronológica dos inscritos definitivos dará continuidade sequencial regular. Todos os vínculos de responsabilidade técnica (RT) em empresas ativas serão atualizados automaticamente.
              </div>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setProfToConvertDefinitivo(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold uppercase text-xs cursor-pointer transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmConversaoDefinitiva}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold uppercase text-xs flex items-center space-x-1.5 cursor-pointer shadow-md shadow-emerald-500/20 transition-all"
              >
                <Sparkles className="w-4 h-4" />
                <span>Confirmar Efetivação Definitiva</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Confirmação para Alteração para Provisório */}
      {provisorioConfirmModal?.isOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-70 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-amber-300 space-y-4">
            <div className="flex items-center space-x-3 text-amber-600">
              <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 uppercase">Alterar Cadastro para Provisório?</h3>
                <p className="text-[11px] text-slate-500 font-medium">Confirmação de alteração da situação cadastral</p>
              </div>
            </div>

            <div className="p-3.5 bg-amber-50/80 rounded-xl border border-amber-200 text-xs text-amber-950 space-y-2">
              <p>
                A situação cadastral do profissional será alterada para <strong className="uppercase">Provisório</strong>.
              </p>
              <div className="p-2.5 bg-white rounded-lg border border-amber-200 text-[11px] space-y-1 font-medium">
                <div className="flex justify-between text-slate-600">
                  <span>Número Sequencial:</span>
                  <strong className="font-mono text-slate-900">{provisorioConfirmModal.numeroAtual} (MANTIDO)</strong>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Inscrição Atual:</span>
                  <span className="font-mono text-slate-700">{editingProfissional?.inscricao}</span>
                </div>
                <div className="flex justify-between text-amber-900 font-bold border-t border-amber-100 pt-1">
                  <span>Nova Inscrição Provisória:</span>
                  <span className="font-mono text-amber-800">{provisorioConfirmModal.novaInscricao}</span>
                </div>
              </div>
              <p className="text-[11px] text-amber-800">
                * Conforme as configurações do Conselho, apenas o prefixo e sufixo serão modificados, mantendo o número atual. Ao retornar para definitivo no futuro, o prefixo e sufixo definitivos serão restaurados mantendo a numeração.
              </p>
            </div>

            <div className="flex justify-end space-x-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setProvisorioConfirmModal(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl uppercase transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmChangeToProvisorio}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl uppercase transition-colors flex items-center space-x-1.5 shadow-md shadow-amber-500/20 cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>Sim, Alterar para Provisório</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
