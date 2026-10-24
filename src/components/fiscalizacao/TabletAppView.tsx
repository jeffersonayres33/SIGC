import React, { useState, useEffect, useRef } from 'react';
import { 
  Compass, 
  MapPin, 
  Wifi, 
  WifiOff, 
  RefreshCw, 
  Plus, 
  CheckCircle2, 
  AlertTriangle, 
  Camera, 
  PenTool, 
  FileText, 
  Save, 
  Clock, 
  UserCheck, 
  UserX, 
  Search, 
  X, 
  Send, 
  Download, 
  Eye, 
  Crosshair, 
  Tablet, 
  ShieldCheck,
  Printer,
  Info,
  RotateCcw,
  Trash2,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Mail,
  Filter,
  Check,
  Layers,
  ArrowRight,
  Shield,
  Building,
  Calendar,
  Phone,
  FileCheck2,
  AlertOctagon,
  Copy,
  ExternalLink,
  BatteryCharging,
  Maximize2,
  ChevronUp,
  LogOut
} from 'lucide-react';
import { TermoFiscalizacao, Empresa, Profissional } from '../../types';
import { storageService } from '../../services/storageService';
import { toastService } from '../../services/toastService';
import { printTermoFiscalizacao } from '../../utils/printTermoFiscalizacao';
import { ModalEnviarTermoEmail } from './ModalEnviarTermoEmail';
import { SIGCON_LOGO } from '../../constants/assets';

interface TabletAppViewProps {
  onSwitchToWebAdmin?: () => void;
  onOpenSqlModal?: () => void;
  onExitFiscalizacao?: () => void;
  isTopBarHidden?: boolean;
  onToggleTopBar?: () => void;
}

type TabletScreen = 
  | 'menu' 
  | 'estabelecimentos' 
  | 'ficha_estabelecimento' 
  | 'ficha_rt' 
  | 'novo_termo' 
  | 'historico_termos' 
  | 'info_lote' 
  | 'sincronizacao';

export const TabletAppView: React.FC<TabletAppViewProps> = ({
  onSwitchToWebAdmin,
  onOpenSqlModal,
  onExitFiscalizacao,
  isTopBarHidden,
  onToggleTopBar
}) => {
  const council = storageService.getCouncilConfig();
  const authUser = storageService.getCurrentAuthUser();
  const cadastrosBasicos = storageService.getCadastrosBasicos();

  // Screen State
  const [currentScreen, setCurrentScreen] = useState<TabletScreen>('menu');
  const [selectedEmpresa, setSelectedEmpresa] = useState<Empresa | null>(null);
  const [selectedTermoParaVisualizar, setSelectedTermoParaVisualizar] = useState<TermoFiscalizacao | null>(null);
  const [selectedRtForFicha, setSelectedRtForFicha] = useState<any>(null);

  // Email & PDF Modal State
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [termoParaEmail, setTermoParaEmail] = useState<TermoFiscalizacao | null>(null);

  // Tablet Device State
  const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }));
  const [batteryLevel] = useState('94%');
  const [network, setNetwork] = useState(storageService.getNetworkStatus());
  const [gpsCoords, setGpsCoords] = useState<{ lat: number; lng: number } | null>({
    lat: -6.5338, // Canutama - AM
    lng: -64.3833
  });
  const [isGettingGps, setIsGettingGps] = useState(false);

  // Estabelecimentos Data & Filters
  const allEmpresas = storageService.getEmpresas();
  const allTermos = storageService.getTermosFiscalizacao();
  const [searchTerm, setSearchTerm] = useState('');
  const [showFiltrosInline, setShowFiltrosInline] = useState(false);

  // Advanced Filters (Screens 1, 2, 5)
  const [filtroOrdenacao, setFiltroOrdenacao] = useState<'codigo' | 'razao' | 'fantasia' | 'bairro' | 'endereco'>('fantasia');
  const [filtroSituacao, setFiltroSituacao] = useState<'todos' | 'regular' | 'irregular'>('todos');
  const [filtroCondicao, setFiltroCondicao] = useState<'todos' | 'ativo' | 'baixado' | 'suspenso'>('todos');
  const [filtroNatureza, setFiltroNatureza] = useState<'todos' | 'drogaria' | 'manipulacao' | 'hospitalar' | 'distribuidora'>('todos');
  const [filtroRota, setFiltroRota] = useState<string>('Canutama');
  const [filtroCidade, setFiltroCidade] = useState<string>('Canutama');
  const [filtroBairro, setFiltroBairro] = useState<string>('');
  const [filtroEndereco, setFiltroEndereco] = useState<string>('');
  const [filtroFantasia, setFiltroFantasia] = useState<string>('');
  const [filtroFiscalizadas, setFiltroFiscalizadas] = useState<'todos' | 'sim' | 'nao'>('todos');

  // Histórico de Termos Filters
  const [filtroHistoricoPeriodo, setFiltroHistoricoPeriodo] = useState<'todos' | '1_ano' | '2_anos' | '3_anos'>('todos');
  const [filtroHistoricoTipo, setFiltroHistoricoTipo] = useState<'todos' | 'intimada' | 'notificada' | 'autuada' | 'regular'>('todos');

  // Form State for Novo Termo (Screens 3, 4, 6, 7, 8, 9)
  const [encontrava, setEncontrava] = useState<'Aberta' | 'Fechada'>('Aberta');
  const [motivoFechada, setMotivoFechada] = useState<'Mot. Desconhecido' | 'Em reforma' | 'Feriado' | 'Horário de almoço' | 'Encerrada'>('Mot. Desconhecido');
  const [rtSituacao, setRtSituacao] = useState<string>('Presente');
  const [selectedRtNome, setSelectedRtNome] = useState('ANA KERCIA OLIVEIRA MENDES');
  const [selectedRtInscricao, setSelectedRtInscricao] = useState('CRF-AM 4821');
  const [selectedRtCargo, setSelectedRtCargo] = useState('RESPONSÁVEL TÉCNICO');
  const [rtPresenteMomentoNome, setRtPresenteMomentoNome] = useState('');
  const [observacaoFiscais, setObservacaoFiscais] = useState('');
  const [outrasObservacoesGerais, setOutrasObservacoesGerais] = useState('');

  // Notificação (Screen 4)
  const [notificacaoAtiva, setNotificacaoAtiva] = useState(false);
  const [numeroNotificacao, setNumeroNotificacao] = useState('');
  const NOTIFICACAO_TEXTO_PADRAO = 
    storageService.getCouncilConfig().textoPadraoNotificacao ||
    "A empresa foi encontrada aberta e em funcionamento em horário não declarado ao CRF/AM, com a presença no local de profissional farmacêutico que NÃO é responsável técnico (RT) no horário, não havendo farmacêutico RT averbado e legalmente habilitado da empresa no horário desta fiscalização. A empresa fica notificada a providenciar regularização do seu horário de funcionamento e averbação de farmacêutico responsável técnico em até 05 dias, sob pena de autuação no artigo 24 da lei federal 3820/1960.";
  const [notificacaoTexto, setNotificacaoTexto] = useState(NOTIFICACAO_TEXTO_PADRAO);
  const [notificacaoObservacoes, setNotificacaoObservacoes] = useState('');

  // Intimação (Screen 6)
  const [intimacaoAtiva, setIntimacaoAtiva] = useState(false);
  const [numeroIntimacao, setNumeroIntimacao] = useState('');
  const [intimacaoCrtAtualizada, setIntimacaoCrtAtualizada] = useState(false);
  const [intimacaoCrtLocalVisivel, setIntimacaoCrtLocalVisivel] = useState(false);
  const [intimacaoAlteracaoSocial, setIntimacaoAlteracaoSocial] = useState(false);
  const [intimacaoOutrasObservacoes, setIntimacaoOutrasObservacoes] = useState('');

  // Auto de Infração (Screen 7, 8)
  const [autuacaoAtiva, setAutuacaoAtiva] = useState(false);
  const [autuacaoAusente, setAutuacaoAusente] = useState(false);
  const [autuacaoSemRt, setAutuacaoSemRt] = useState(false);
  const [autuacaoChi, setAutuacaoChi] = useState(false);
  const [autuacaoSemSubstituto, setAutuacaoSemSubstituto] = useState(false);
  const [autuacaoIlegal, setAutuacaoIlegal] = useState(false);
  const [autuacaoPrivativas, setAutuacaoPrivativas] = useState(false);
  const [autuacaoOutrasObservacoes, setAutuacaoOutrasObservacoes] = useState('');
  const [horariosVagosVerificados, setHorariosVagosVerificados] = useState(false);

  interface DiagnosticoHorariosVagos {
    temInconformidade: boolean;
    motivoPrincipal: string;
    intervalosVagos: string[];
    regraNome: string;
    regraBaseLegal: string;
    horasFuncionamento: number;
    horasAssistencia: number;
    bloqueiosIdentificados: string[];
    diaSemana: string;
    horaVerificacao: string;
    rtNome?: string;
    rtStatus?: string;
  }

  const [diagnosticoHorariosVagos, setDiagnosticoHorariosVagos] = useState<DiagnosticoHorariosVagos | null>(null);

  // Atendente (Screen 9)
  const [currentTermoNum, setCurrentTermoNum] = useState<string>('');
  const [numeroAutoInfracao, setNumeroAutoInfracao] = useState<string>('');
  const [atendenteCargo, setAtendenteCargo] = useState('Farmacêutico');
  const [atendenteNome, setAtendenteNome] = useState('');
  const [atendenteRg, setAtendenteRg] = useState('');
  const [atendenteCpf, setAtendenteCpf] = useState('');
  const [atendenteInscricao, setAtendenteInscricao] = useState('');
  const [recusouAssinar, setRecusouAssinar] = useState(false);

  // Dual Touch Signature Pads
  const canvasNotificadoRef = useRef<HTMLCanvasElement | null>(null);
  const canvasFiscalRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawingNotificado, setIsDrawingNotificado] = useState(false);
  const [isDrawingFiscal, setIsDrawingFiscal] = useState(false);
  const [signatureNotificadoUrl, setSignatureNotificadoUrl] = useState<string | null>(null);
  const [signatureFiscalUrl, setSignatureFiscalUrl] = useState<string | null>(null);

  // Update clock every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }));
      setNetwork(storageService.getNetworkStatus());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Set default selected establishment if not yet set
  useEffect(() => {
    if (!selectedEmpresa && allEmpresas.length > 0) {
      // Find Drogaria Lucia if exists
      const lucia = allEmpresas.find(e => e.inscricao === '580400' || e.nomeFantasia.toLowerCase().includes('lucia'));
      setSelectedEmpresa(lucia || allEmpresas[0]);
    }
  }, [allEmpresas]);

  // When changing establishment, preload RT data from company's linked RTs
  useEffect(() => {
    if (selectedEmpresa) {
      const rts = selectedEmpresa.responsaveisTecnicos || [];
      if (rts.length > 0) {
        setSelectedRtNome(rts[0].profissionalNome);
        setSelectedRtInscricao(rts[0].profissionalInscricao);
        setSelectedRtCargo(rts[0].cargo || 'RESPONSÁVEL TÉCNICO');
      } else if (selectedEmpresa.responsavelTecnico) {
        setSelectedRtNome(selectedEmpresa.responsavelTecnico);
        setSelectedRtInscricao(selectedEmpresa.crfResponsavel || 'CRF-AM');
        setSelectedRtCargo('RESPONSÁVEL TÉCNICO');
      } else {
        setSelectedRtNome('');
        setSelectedRtInscricao('');
        setSelectedRtCargo('');
      }
    }
  }, [selectedEmpresa]);

  // Toggle handlers for Notificação, Intimação and Autuação com geração e rollback automático
  const handleToggleNotificacao = (checked: boolean) => {
    setNotificacaoAtiva(checked);
    if (checked) {
      if (!numeroNotificacao) {
        const num = storageService.getNextNumeroNotificacao();
        setNumeroNotificacao(num);
      }
      const cfg = storageService.getCouncilConfig();
      if (cfg.textoPadraoNotificacao && (!notificacaoTexto || notificacaoTexto === NOTIFICACAO_TEXTO_PADRAO)) {
        setNotificacaoTexto(cfg.textoPadraoNotificacao);
      }
    } else {
      if (numeroNotificacao) {
        storageService.rollbackNumeroNotificacao(numeroNotificacao);
        setNumeroNotificacao('');
      }
    }
  };

  const handleToggleIntimacao = (checked: boolean) => {
    setIntimacaoAtiva(checked);
    if (checked) {
      if (!numeroIntimacao) {
        const num = storageService.getNextNumeroIntimacao();
        setNumeroIntimacao(num);
      }
    } else {
      if (numeroIntimacao) {
        storageService.rollbackNumeroIntimacao(numeroIntimacao);
        setNumeroIntimacao('');
      }
    }
  };

  const handleToggleAutuacao = (checked: boolean) => {
    setAutuacaoAtiva(checked);
    if (checked) {
      if (!numeroAutoInfracao) {
        const num = storageService.getNextNumeroAutuacao();
        setNumeroAutoInfracao(num);
      }
    } else {
      if (numeroAutoInfracao) {
        storageService.rollbackNumeroAutuacao(numeroAutoInfracao);
        setNumeroAutoInfracao('');
      }
    }
  };

  const handleCancelarTermo = () => {
    if (currentTermoNum) {
      storageService.rollbackNumeroTermo(currentTermoNum);
      setCurrentTermoNum('');
    }
    if (notificacaoAtiva && numeroNotificacao) {
      storageService.rollbackNumeroNotificacao(numeroNotificacao);
      setNotificacaoAtiva(false);
      setNumeroNotificacao('');
    }
    if (intimacaoAtiva && numeroIntimacao) {
      storageService.rollbackNumeroIntimacao(numeroIntimacao);
      setIntimacaoAtiva(false);
      setNumeroIntimacao('');
    }
    if (autuacaoAtiva && numeroAutoInfracao) {
      storageService.rollbackNumeroAutuacao(numeroAutoInfracao);
      setAutuacaoAtiva(false);
      setNumeroAutoInfracao('');
    }
    setCurrentScreen('ficha_estabelecimento');
  };

  // Limpar campos de atendimento
  const handleLimparDadosAtendente = () => {
    setAtendenteNome('');
    setAtendenteRg('');
    setAtendenteCpf('');
    setAtendenteInscricao('');
    toastService.info('Campos Limpos', 'Nome, RG, CPF e Inscrição do atendente foram limpos.');
  };

  // Preencher campos de atendimento com dados do Farmacêutico RT Titular Selecionado
  const handlePreencherComDadosRt = () => {
    if (!selectedRtInscricao && !selectedRtNome) {
      toastService.warning('Aviso', 'Nenhum Farmacêutico RT selecionado no cadastro.');
      return;
    }

    const cleanInsc = selectedRtInscricao.trim().toUpperCase();
    const prof = storageService.findProfissionalByInscricao(cleanInsc) ||
                 storageService.getProfissionais().find(p => 
                   cleanInsc.includes(p.inscricao?.toUpperCase()) || 
                   p.nome.toUpperCase() === selectedRtNome.toUpperCase()
                 );

    if (prof) {
      setAtendenteNome(prof.nome);
      setAtendenteRg(prof.rg || '');
      setAtendenteCpf(prof.cpf || '');
      setAtendenteInscricao(prof.inscricao);
      setAtendenteCargo('Farmacêutico Responsável Técnico');
      toastService.success('Dados Preenchidos', `Dados de ${prof.nome} (${prof.inscricao}) aplicados.`);
    } else {
      setAtendenteNome(selectedRtNome);
      setAtendenteInscricao(selectedRtInscricao);
      setAtendenteCargo('Farmacêutico Responsável Técnico');
      toastService.info('Dados Aplicados', `Nome e Inscrição do RT ${selectedRtNome} aplicados.`);
    }
  };

  // Verificação inteligente de Horários Vagos respeitando regras do Módulo de Assistência por Município e Ramo, e restrições de bloqueio
  const handleVerificarHorariosVagos = () => {
    if (!selectedEmpresa) {
      toastService.warning('Aviso', 'Selecione um estabelecimento antes de verificar horários.');
      return;
    }

    const agora = new Date();
    const diasSemana = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
    const diaAtual = diasSemana[agora.getDay()];
    const horaAtualStr = agora.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

    // 1. Avaliar regularidade de assistência pelo módulo por Município e Ramo
    const avaliacao = storageService.avaliarRegularidadeAssistencia(selectedEmpresa);
    const regra = avaliacao.regraAplicada;

    // 2. Verificar restrições de bloqueio cadastral de Profissionais e Empresas
    const bloqueios: string[] = [];
    if (selectedEmpresa.bloqueado) {
      bloqueios.push(`EMPRESA BLOQUEADA no cadastro sanitário/administrativo: ${selectedEmpresa.motivoBloqueio || 'Bloqueio ativo no CRF'}`);
    }

    const todosProfissionais = storageService.getProfissionais();
    const rtsVinculados = selectedEmpresa.responsaveisTecnicos || [];
    const rtsAtivosEValidos: typeof rtsVinculados = [];

    rtsVinculados.forEach(rt => {
      const prof = todosProfissionais.find(p => p.id === rt.profissionalId || p.inscricao === rt.profissionalInscricao);
      if (prof) {
        if (prof.bloqueado) {
          bloqueios.push(`Farmacêutico RT ${rt.profissionalNome} (${rt.profissionalInscricao}) BLOQUEADO: ${prof.motivoBloqueio || 'Bloqueio cadastral ativo'}`);
        } else {
          const impedimento = storageService.isProfissionalImpedidoRT(prof);
          if (impedimento.impedido) {
            bloqueios.push(`Farmacêutico RT ${rt.profissionalNome} IMPEDIDO para RT: ${impedimento.motivo}`);
          } else {
            rtsAtivosEValidos.push(rt);
          }
        }
      } else {
        rtsAtivosEValidos.push(rt);
      }
    });

    // 3. Verificar horários declarados de funcionamento e assistência para o dia de hoje
    const normalizeDay = (d: string) => (d || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().slice(0, 3);
    const diaNorm = normalizeDay(diaAtual);

    const horariosFunc = (selectedEmpresa.horariosFuncionamento && selectedEmpresa.horariosFuncionamento.length > 0)
      ? selectedEmpresa.horariosFuncionamento
      : [
          { dia: 'Segunda-feira', ativo: true, inicio1: '07:00', fim1: '12:00', inicio2: '14:00', fim2: '21:00' },
          { dia: 'Terça-feira', ativo: true, inicio1: '07:00', fim1: '12:00', inicio2: '14:00', fim2: '21:00' },
          { dia: 'Quarta-feira', ativo: true, inicio1: '07:00', fim1: '12:00', inicio2: '14:00', fim2: '21:00' },
          { dia: 'Quinta-feira', ativo: true, inicio1: '07:00', fim1: '12:00', inicio2: '14:00', fim2: '21:00' },
          { dia: 'Sexta-feira', ativo: true, inicio1: '07:00', fim1: '12:00', inicio2: '14:00', fim2: '21:00' },
          { dia: 'Sábado', ativo: true, inicio1: '08:00', fim1: '13:00' }
        ];

    const funcHoje = horariosFunc.find(h => normalizeDay(h.dia) === diaNorm && h.ativo !== false);

    const intervalosVagos: string[] = [];
    let rtCobreMomentoAtual = false;

    const toMinutes = (timeStr: string) => {
      if (!timeStr || !timeStr.includes(':')) return 0;
      const [h, m] = timeStr.split(':').map(Number);
      return (h || 0) * 60 + (m || 0);
    };

    const horaAtualMin = toMinutes(horaAtualStr);

    if (funcHoje) {
      // Coleta todos os horários cobertos pelos RTs válidos hoje
      const faixasRT: { inicio: number; fim: number }[] = [];
      rtsAtivosEValidos.forEach(rt => {
        const hDia = rt.horarios?.find(item => normalizeDay(item.dia) === diaNorm && item.ativo !== false);
        if (hDia) {
          if (hDia.inicio1 && hDia.fim1) {
            faixasRT.push({ inicio: toMinutes(hDia.inicio1), fim: toMinutes(hDia.fim1) });
          }
          if (hDia.inicio2 && hDia.fim2) {
            faixasRT.push({ inicio: toMinutes(hDia.inicio2), fim: toMinutes(hDia.fim2) });
          }
        }
      });

      // Checa se o horário atual está coberto por algum RT
      rtCobreMomentoAtual = faixasRT.some(f => horaAtualMin >= f.inicio && horaAtualMin <= f.fim);

      // Checa se há períodos declarados da empresa sem cobertura de RT hoje
      const faixasEmpresa: { inicio: number; fim: number; label: string }[] = [];
      if (funcHoje.inicio1 && funcHoje.fim1) {
        faixasEmpresa.push({ inicio: toMinutes(funcHoje.inicio1), fim: toMinutes(funcHoje.fim1), label: `${funcHoje.inicio1} às ${funcHoje.fim1}` });
      }
      if (funcHoje.inicio2 && funcHoje.fim2) {
        faixasEmpresa.push({ inicio: toMinutes(funcHoje.inicio2), fim: toMinutes(funcHoje.fim2), label: `${funcHoje.inicio2} às ${funcHoje.fim2}` });
      }

      faixasEmpresa.forEach(fe => {
        let cobertoTotalmente = false;
        for (const frt of faixasRT) {
          if (frt.inicio <= fe.inicio && frt.fim >= fe.fim) {
            cobertoTotalmente = true;
            break;
          }
        }
        if (!cobertoTotalmente) {
          if (faixasRT.length === 0) {
            intervalosVagos.push(`Turno ${fe.label} sem nenhum RT averbado`);
          } else {
            intervalosVagos.push(`Intervalo desassistido dentro de ${fe.label}`);
          }
        }
      });
    }

    // 4. Detecção de Inconformidade
    const semRtValido = rtsAtivosEValidos.length === 0;
    const rtAusenteNoMomento = rtSituacao === 'Ausente' || !rtCobreMomentoAtual;
    const temHorariosVagos = intervalosVagos.length > 0 || semRtValido;
    const temBloqueio = bloqueios.length > 0;
    const temInconformidade = temHorariosVagos || temBloqueio || rtSituacao === 'Ausente' || avaliacao.condicao === 'Irregular';

    let motivoPrincipal = '';
    if (selectedEmpresa.bloqueado) {
      motivoPrincipal = 'Estabelecimento em funcionamento com BLOQUEIO ADMINISTRATIVO ativo no CRF.';
    } else if (semRtValido) {
      motivoPrincipal = 'Estabelecimento em funcionamento sem Responsável Técnico legalmente habilitado (ou todos os RTs encontram-se bloqueados/impedidos).';
    } else if (rtSituacao === 'Ausente') {
      motivoPrincipal = `Estabelecimento aberto e em funcionamento durante horário de assistência obrigatória com AUSÊNCIA DO FARMACÊUTICO RT (${selectedRtNome}).`;
    } else if (intervalosVagos.length > 0) {
      motivoPrincipal = `Estabelecimento funcionando em horário declarado com HORÁRIOS VAGOS (intervalos desassistidos sem presença de farmacêutico).`;
    } else {
      motivoPrincipal = 'Escala de horários e assistência em total conformidade com as regras do CRF.';
    }

    const diagnostico: DiagnosticoHorariosVagos = {
      temInconformidade,
      motivoPrincipal,
      intervalosVagos,
      regraNome: regra?.descricao || 'Assistência Farmacêutica Obrigatória',
      regraBaseLegal: regra?.baseLegal || 'Lei Federal nº 13.021/2014 & Art. 24 da Lei Federal nº 3.820/1960',
      horasFuncionamento: avaliacao.horasFuncionamentoSemanais,
      horasAssistencia: avaliacao.horasAssistenciaSemanais,
      bloqueiosIdentificados: bloqueios,
      diaSemana: diaAtual,
      horaVerificacao: horaAtualStr,
      rtNome: selectedRtNome,
      rtStatus: rtSituacao
    };

    setDiagnosticoHorariosVagos(diagnostico);
    setHorariosVagosVerificados(true);

    if (temInconformidade) {
      // Habilita Auto de Infração automaticamente com geração do sequencial crescente anti-duplicidade
      handleToggleAutuacao(true);

      // Marca tipificações legais cabíveis
      if (rtSituacao === 'Ausente') {
        setAutuacaoAusente(true);
      }
      if (semRtValido) {
        setAutuacaoSemRt(true);
      }
      if (intervalosVagos.length > 0) {
        setAutuacaoSemSubstituto(true);
      }

      // Preenche / complementa o campo obrigatório Observação
      const novoRelato = `Constatado funcionamento do estabelecimento em horário declarado sem a presença de farmacêutico em conformidade com as normas do município de ${selectedEmpresa.cidade} (${regra?.descricao || 'Carga Horária Regulamentar'}). ` +
        (intervalosVagos.length > 0 ? `Horários vagos / intervalos desassistidos identificados: ${intervalosVagos.join('; ')}. ` : '') +
        (bloqueios.length > 0 ? `Restrições cadastrais ativas: ${bloqueios.join('; ')}. ` : '') +
        (rtSituacao === 'Ausente' ? `Farmacêutico RT ${selectedRtNome} ausente no momento da inspeção (${horaAtualStr}). ` : '') +
        `Enquadramento legal: ${regra?.baseLegal || 'Lei Federal nº 13.021/2014, Art. 5º e 6º c/c Art. 24 da Lei Federal nº 3.820/1960'}.`;

      if (!observacaoFiscais.trim()) {
        setObservacaoFiscais(novoRelato);
      } else if (!observacaoFiscais.includes('Horários vagos')) {
        setObservacaoFiscais(prev => `${prev}\n\n[VERIFICAÇÃO DE HORÁRIOS VAGOS - ${horaAtualStr}]: ${novoRelato}`);
      }

      toastService.warning(
        'Horários Vagos / Irregularidade Identificada',
        `Estabelecimento funcionando em horário declarado sem farmacêutico. Tipificações preenchidas para lavratura do Auto de Infração.`
      );
    } else {
      toastService.success(
        'Assistência Farmacêutica Regular',
        `Horários verificados com sucesso para ${selectedEmpresa.cidade}. Nenhuma pendência ou horário vago identificado.`
      );
    }
  };

  // Adjust Atendente role based on RT Situacao
  useEffect(() => {
    if (rtSituacao === 'Presente') {
      setAtendenteCargo('Farmacêutico Responsável Técnico');
    } else {
      setAtendenteCargo('Gerente / Administrador');
    }

    // Se a situação não for "Ausente", a opção 1 do Auto de Infração deve ser desmarcada
    if (rtSituacao !== 'Ausente') {
      setAutuacaoAusente(false);
    }
  }, [rtSituacao]);

  // Filter establishments
  const filteredEmpresas = allEmpresas.filter(emp => {
    // Search query
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      const matchQuery = 
        emp.nomeFantasia.toLowerCase().includes(q) ||
        emp.razaoSocial.toLowerCase().includes(q) ||
        emp.inscricao.toLowerCase().includes(q) ||
        emp.cnpj.toLowerCase().includes(q) ||
        (emp.bairro && emp.bairro.toLowerCase().includes(q)) ||
        (emp.endereco && emp.endereco.toLowerCase().includes(q));
      if (!matchQuery) return false;
    }

    // Rota
    if (filtroRota !== 'todos' && filtroRota) {
      if (filtroRota === 'Canutama' && emp.cidade !== 'Canutama') return false;
    }

    // Cidade
    if (filtroCidade !== 'todos' && filtroCidade) {
      if (emp.cidade && emp.cidade.toLowerCase() !== filtroCidade.toLowerCase()) return false;
    }

    // Bairro
    if (filtroBairro) {
      if (!emp.bairro || !emp.bairro.toLowerCase().includes(filtroBairro.toLowerCase())) return false;
    }

    // Fantasia
    if (filtroFantasia) {
      if (!emp.nomeFantasia.toLowerCase().includes(filtroFantasia.toLowerCase())) return false;
    }

    // Situação
    if (filtroSituacao === 'regular' && emp.condicao !== 'Regular') return false;
    if (filtroSituacao === 'irregular' && emp.condicao === 'Regular') return false;

    // Condição
    if (filtroCondicao !== 'todos') {
      if (emp.condicao?.toLowerCase() !== filtroCondicao) return false;
    }

    // Natureza
    if (filtroNatureza !== 'todos') {
      if (!emp.tipoEstabelecimento?.toLowerCase().includes(filtroNatureza)) return false;
    }

    // Fiscalizadas
    if (filtroFiscalizadas !== 'todos') {
      const hasTermos = allTermos.some(t => t.empresaId === emp.id);
      if (filtroFiscalizadas === 'sim' && !hasTermos) return false;
      if (filtroFiscalizadas === 'nao' && hasTermos) return false;
    }

    return true;
  }).sort((a, b) => {
    if (filtroOrdenacao === 'codigo') return a.inscricao.localeCompare(b.inscricao);
    if (filtroOrdenacao === 'razao') return a.razaoSocial.localeCompare(b.razaoSocial);
    if (filtroOrdenacao === 'fantasia') return a.nomeFantasia.localeCompare(b.nomeFantasia);
    if (filtroOrdenacao === 'bairro') return (a.bairro || '').localeCompare(b.bairro || '');
    if (filtroOrdenacao === 'endereco') return (a.endereco || '').localeCompare(b.endereco || '');
    return 0;
  });

  // GPS Capture Handler
  const handleCaptureGPS = () => {
    setIsGettingGps(true);
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setGpsCoords({
            lat: Number(pos.coords.latitude.toFixed(6)),
            lng: Number(pos.coords.longitude.toFixed(6))
          });
          setIsGettingGps(false);
          toastService.success('GPS Capturado', `Lat: ${pos.coords.latitude.toFixed(4)}, Lng: ${pos.coords.longitude.toFixed(4)}`);
        },
        () => {
          // Fallback to Canutama coords
          setGpsCoords({ lat: -6.5338, lng: -64.3833 });
          setIsGettingGps(false);
          toastService.info('Localização Registrada', 'Coordenadas locais de Canutama/AM aplicadas.');
        },
        { enableHighAccuracy: true, timeout: 6000 }
      );
    } else {
      setIsGettingGps(false);
    }
  };

  // Canvas Drawing Handlers
  const startDrawingNotificado = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasNotificadoRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    setIsDrawingNotificado(true);
    const rect = canvas.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const drawNotificado = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawingNotificado) return;
    const canvas = canvasNotificadoRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#1e3a8a';
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawingNotificado = () => {
    if (!isDrawingNotificado) return;
    setIsDrawingNotificado(false);
    const canvas = canvasNotificadoRef.current;
    if (canvas) {
      setSignatureNotificadoUrl(canvas.toDataURL('image/png'));
    }
  };

  const clearCanvasNotificado = () => {
    const canvas = canvasNotificadoRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setSignatureNotificadoUrl(null);
  };

  // Canvas Fiscal Drawing
  const startDrawingFiscal = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasFiscalRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    setIsDrawingFiscal(true);
    const rect = canvas.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const drawFiscal = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawingFiscal) return;
    const canvas = canvasFiscalRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#047857';
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawingFiscal = () => {
    if (!isDrawingFiscal) return;
    setIsDrawingFiscal(false);
    const canvas = canvasFiscalRef.current;
    if (canvas) {
      setSignatureFiscalUrl(canvas.toDataURL('image/png'));
    }
  };

  const clearCanvasFiscal = () => {
    const canvas = canvasFiscalRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setSignatureFiscalUrl(null);
  };

  // Salvar Novo Termo de Inspeção
  const handleSalvarTermo = () => {
    if (!selectedEmpresa) {
      toastService.error('Erro', 'Nenhum estabelecimento selecionado.');
      return;
    }

    // 1. Campo Obrigatório: Observação
    if (!observacaoFiscais || !observacaoFiscais.trim()) {
      toastService.error(
        'Campo Obrigatório',
        'O campo Observação é obrigatório para lavrar o Termo de Inspeção. Descreva as constatações fiscais no local.'
      );
      return;
    }

    // 2. Campo Obrigatório: Assinatura do Fiscal
    if (!signatureFiscalUrl) {
      toastService.error(
        'Campo Obrigatório',
        'A Assinatura do Fiscal é obrigatória para lavrar o Termo de Inspeção. Assine digitalmente no campo correspondente antes de salvar.'
      );
      return;
    }

    const agora = new Date();
    const numeroTermo = `TI-${agora.getFullYear()}/${Math.floor(1000 + Math.random() * 9000)}`;
    const numeroAuto = autuacaoAtiva ? `AI-${agora.getFullYear()}/${Math.floor(100 + Math.random() * 900)}` : undefined;

    const infracoes: string[] = [];
    if (autuacaoAusente) infracoes.push('1 - Farmacêutico RT Ausente durante o horário de assistência');
    if (autuacaoSemRt) infracoes.push('2 - Funcionamento Sem Responsável Técnico averbado');
    if (autuacaoChi) infracoes.push('3 - Certidão de Regularidade (CRT/CHI) vencida');
    if (autuacaoSemSubstituto) infracoes.push('4 - Ausência de Farmacêutico Substituto no desfalque');
    if (autuacaoIlegal) infracoes.push('5 - Exercício Ilegal da Profissão');
    if (autuacaoPrivativas) infracoes.push('6 - Comercialização irregular de produtos privativos');

    const novoTermo: TermoFiscalizacao = {
      id: `termo-${Date.now()}`,
      numeroTermo,
      numeroAutoInfracao: numeroAuto,
      dataHora: `${agora.toLocaleDateString('pt-BR')} ${agora.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`,
      
      empresaId: selectedEmpresa.id,
      empresaInscricao: selectedEmpresa.inscricao,
      empresaNome: selectedEmpresa.nomeFantasia,
      razaoSocial: selectedEmpresa.razaoSocial,
      cnpj: selectedEmpresa.cnpj,
      endereco: selectedEmpresa.endereco || 'Centro Comercial de Canutama',
      bairro: selectedEmpresa.bairro || 'Centro',
      cidade: selectedEmpresa.cidade || 'Canutama',
      rota: filtroRota,

      fiscalId: authUser?.id || 'fisc-01',
      fiscalNome: authUser?.nome || 'Dr. Marcelo Queiroz',
      fiscalMatricula: (authUser as any)?.matricula || 'MAT-402',

      latitude: gpsCoords?.lat,
      longitude: gpsCoords?.lng,
      status: 'Concluído e Assinado',
      tipoVisita: 'Rotina',
      presencaRT: rtSituacao === 'Presente',
      rtPresenteNome: rtSituacao === 'Presente' ? selectedRtNome : undefined,
      rtPresenteInscricao: rtSituacao === 'Presente' ? selectedRtInscricao : undefined,

      encontrava,
      motivoFechada: encontrava === 'Fechada' ? motivoFechada : undefined,
      rtSituacao,
      respTecnicoSelecionadoNome: selectedRtNome,
      respTecnicoSelecionadoTipo: selectedRtCargo || 'RESPONSÁVEL TÉCNICO',
      respTecnicoSelecionadoInscricao: selectedRtInscricao,
      rtPresenteMomentoNome: rtPresenteMomentoNome || undefined,
      observacao: observacaoFiscais || undefined,
      outrasObservacoesGerais: observacaoFiscais || outrasObservacoesGerais || undefined,

      // Notificação
      notificacaoAtiva,
      numeroNotificacao: notificacaoAtiva ? numeroNotificacao : undefined,
      notificacaoTexto: notificacaoAtiva ? notificacaoTexto : undefined,
      notificacaoObservacoes: notificacaoAtiva ? notificacaoObservacoes : undefined,

      // Intimação
      intimacaoAtiva,
      numeroIntimacao: intimacaoAtiva ? numeroIntimacao : undefined,
      intimacaoCrtAtualizada,
      intimacaoCrtLocalVisivel,
      intimacaoAlteracaoSocial,
      intimacaoOutrasObservacoes: intimacaoAtiva ? intimacaoOutrasObservacoes : undefined,

      // Autuação
      autuacaoAtiva,
      autoInfracaoGerado: autuacaoAtiva,
      autuacaoAusente,
      autuacaoSemRt,
      autuacaoChi,
      autuacaoSemSubstituto,
      autuacaoIlegal,
      autuacaoPrivativas,
      autuacaoOutrasObservacoes: autuacaoAtiva ? autuacaoOutrasObservacoes : undefined,
      infracoesIdentificadas: infracoes,
      valorMultaPrevisto: autuacaoAtiva ? (infracoes.length * 1500) : 0,

      // Atendente
      atendenteCargo,
      atendenteNome: atendenteNome || 'Não informado',
      atendenteRg,
      atendenteCpf,
      atendenteInscricao: atendenteInscricao || undefined,

      // Assinaturas
      assinaturaNotificado: recusouAssinar ? undefined : (signatureNotificadoUrl || undefined),
      assinaturaEstabelecimento: recusouAssinar ? undefined : (signatureNotificadoUrl || undefined),
      assinaturaFiscal: signatureFiscalUrl || undefined,
      assinaturaFiscalDataHora: signatureFiscalUrl ? `${agora.toLocaleDateString('pt-BR')} ${agora.toLocaleTimeString('pt-BR')}` : undefined,
      assinaturaEstabelecimentoDataHora: signatureNotificadoUrl ? `${agora.toLocaleDateString('pt-BR')} ${agora.toLocaleTimeString('pt-BR')}` : undefined,
      tipoSignatarioNotificado: atendenteCargo as any,
      nomeSignatarioNotificado: atendenteNome || 'Estabelecimento/Farmacêutico',
      documentoSignatarioNotificado: atendenteCpf || atendenteRg,
      recusaAssinatura: recusouAssinar,
      observacaoRecusa: recusouAssinar ? 'Recusou-se a assinar' : undefined,

      hashValidacaoDigital: `SHA256-${Date.now().toString(16).toUpperCase()}-SIGCON-CRFAM`,
      sincronizado: network.isOnline
    };

    const result = storageService.submitTermoFiscalizacao(novoTermo);

    if (result.offline) {
      toastService.warning(
        'Salvo em Fila Offline',
        `Termo ${numeroTermo} registrado localmente no dispositivo. Será sincronizado assim que a conexão retornar.`
      );
    } else {
      toastService.success(
        'Termo Registrado!',
        `Termo ${numeroTermo} ${autuacaoAtiva ? 'com Auto de Infração' : ''} lavrado com sucesso no servidor.`
      );
    }

    // Reset Form
    setNotificacaoAtiva(false);
    setNumeroNotificacao('');
    setIntimacaoAtiva(false);
    setNumeroIntimacao('');
    setObservacaoFiscais('');
    setAtendenteInscricao('');
    setAutuacaoAtiva(false);
    setAutuacaoAusente(false);
    setAutuacaoSemRt(false);
    setAutuacaoChi(false);
    setAutuacaoSemSubstituto(false);
    setAutuacaoIlegal(false);
    setAutuacaoPrivativas(false);
    clearCanvasNotificado();
    clearCanvasFiscal();

    // Show preview of created term and set for PDF/email
    setSelectedTermoParaVisualizar(novoTermo);
    setTermoParaEmail(novoTermo);
    setCurrentScreen('historico_termos');
  };

  // Helper: Get Termos for Selected Empresa
  const termosDaEmpresa = selectedEmpresa 
    ? allTermos.filter(t => t.empresaId === selectedEmpresa.id || t.cnpj === selectedEmpresa.cnpj)
    : [];

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans select-none">
      {/* ========================================================================= */}
      {/* 1. TOP TABLET SYSTEM STATUS BAR (Screen 15 Header) */}
      {/* ========================================================================= */}
      <div className="bg-slate-900 text-slate-100 px-3 sm:px-4 py-2 border-b border-slate-800 shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
        {/* Row 1 on mobile / Left group on Desktop */}
        <div className="flex items-center justify-between sm:justify-start gap-2 min-w-0 w-full sm:w-auto">
          <div className="flex items-center space-x-1.5 sm:space-x-2 min-w-0">
            <div className="flex items-center space-x-1.5 bg-blue-900/60 text-blue-300 px-2 py-0.5 rounded-lg border border-blue-700/50 shrink-0">
              <Tablet className="w-3.5 h-3.5 text-blue-400 shrink-0" />
              <span className="font-extrabold tracking-wide text-[11px] sm:text-xs">Fiscalização Eletrônica</span>
            </div>
            <span className="font-bold text-slate-200 font-mono tracking-wider shrink-0 text-xs">{council.sigla}</span>
            <span className="hidden lg:inline text-slate-500">•</span>
            <span className="hidden lg:inline text-slate-400 truncate text-xs">Rota: <strong className="text-emerald-400">{filtroRota}</strong></span>
          </div>

          {/* Sair da Fiscalização (Shown here on mobile so it is ALWAYS visible and never cut off) */}
          {onExitFiscalizacao && (
            <button
              onClick={onExitFiscalizacao}
              className="sm:hidden flex items-center space-x-1.5 px-3 py-1 rounded-lg text-xs font-bold bg-linear-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 active:from-rose-700 text-white border border-rose-500 shadow-xs shrink-0 cursor-pointer transition-all"
              title="Sair da Fiscalização Eletrônica e restaurar menus e topos do SIGCON"
            >
              <LogOut className="w-3.5 h-3.5 shrink-0 text-rose-100" />
              <span>Sair</span>
            </button>
          )}
        </div>

        {/* Row 2 on mobile / Right group on Desktop */}
        <div className="flex items-center justify-between sm:justify-end flex-wrap gap-1.5 sm:gap-2.5 w-full sm:w-auto shrink-0">
          {/* GPS Coordinates Indicator */}
          <button 
            onClick={handleCaptureGPS}
            className="flex items-center space-x-1 bg-slate-800 hover:bg-slate-700 text-slate-300 px-2 py-0.5 rounded text-[10px] sm:text-[11px] transition-colors shrink-0"
            title="Atualizar Coordenadas GPS"
          >
            <MapPin className={`w-3 h-3 shrink-0 ${isGettingGps ? 'animate-bounce text-amber-400' : 'text-emerald-400'}`} />
            <span className="font-mono">{gpsCoords ? `${gpsCoords.lat.toFixed(4)}, ${gpsCoords.lng.toFixed(4)}` : 'Sem GPS'}</span>
          </button>

          {/* Network status */}
          <div className={`flex items-center space-x-1 px-2 py-0.5 rounded text-[10px] sm:text-[11px] font-bold shrink-0 ${
            network.isOnline ? 'bg-emerald-950 text-emerald-300 border border-emerald-700' : 'bg-rose-950 text-rose-300 border border-rose-700 animate-pulse'
          }`}>
            {network.isOnline ? <Wifi className="w-3 h-3 text-emerald-400 shrink-0" /> : <WifiOff className="w-3 h-3 text-rose-400 shrink-0" />}
            <span>{network.isOnline ? 'Online' : 'Offline'}</span>
          </div>

          {/* Battery & Time */}
          <div className="flex items-center space-x-1.5 text-slate-300 font-mono text-[10px] sm:text-[11px] shrink-0">
            <span className="flex items-center"><BatteryCharging className="w-3 h-3 mr-0.5 text-emerald-400 shrink-0" /> {batteryLevel}</span>
            <span className="text-slate-600">•</span>
            <span className="font-bold">{currentTime}</span>
          </div>

          {/* Web Admin View Switcher */}
          {onSwitchToWebAdmin && (
            <button
              onClick={onSwitchToWebAdmin}
              className="hidden md:flex items-center space-x-1 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-blue-300 hover:text-blue-200 rounded-lg text-xs font-semibold border border-slate-700 transition-colors cursor-pointer shrink-0"
              title="Acessar Seção Geral de Termos de Inspeção"
            >
              <ExternalLink className="w-3 h-3 shrink-0" />
              <span>Termos</span>
            </button>
          )}

          {/* Sair da Fiscalização (Shown on sm+ screens) */}
          {onExitFiscalizacao && (
            <button
              onClick={onExitFiscalizacao}
              className="hidden sm:flex items-center space-x-1.5 px-3 py-1 rounded-lg text-xs font-bold bg-linear-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 active:from-rose-700 text-white border border-rose-500 shadow-xs shrink-0 cursor-pointer transition-all transform hover:scale-102 active:scale-98"
              title="Sair da Fiscalização Eletrônica e restaurar menus e topos do SIGCON"
            >
              <LogOut className="w-3.5 h-3.5 shrink-0 text-rose-100" />
              <span>Sair da Fiscalização</span>
            </button>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. TABLET APPLICATION BODY */}
      {/* ========================================================================= */}
      <div className="flex-1 flex flex-col max-w-6xl w-full mx-auto p-3 sm:p-5">

        {/* ======================================================================= */}
        {/* SCREEN: MENU PRINCIPAL (SCREEN 15) */}
        {/* ======================================================================= */}
        {currentScreen === 'menu' && (
          <div className="flex-1 flex flex-col justify-between max-w-4xl mx-auto w-full animate-in fade-in duration-200">
            {/* Tablet App Title Card */}
            <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-6 shadow-sm mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center space-x-3 sm:space-x-4 min-w-0 flex-1">
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-blue-50 border border-blue-200 p-2 flex items-center justify-center shadow-xs shrink-0">
                  <img 
                    src={SIGCON_LOGO} 
                    alt="SIGCON Gear" 
                    className="w-full h-full object-contain"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase bg-blue-100 text-blue-800 tracking-wider shrink-0">
                      Módulo Fiscal de Campo
                    </span>
                    <span className="text-slate-400 text-xs hidden sm:inline">•</span>
                    <span className="text-xs font-semibold text-slate-500 hidden sm:inline">Android / Tablet Offline</span>
                  </div>
                  <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mt-0.5 break-words">
                    Fiscalização Eletrônica
                  </h1>
                  <p className="text-xs sm:text-sm text-slate-500 break-words">
                    {council.sigla} — {council.nomeCompleto}
                  </p>
                </div>
              </div>

              {/* Fiscal Logado Card & Sair da Fiscalização Button */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full sm:w-auto">
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-left sm:text-right w-full sm:w-auto sm:min-w-56 shrink-0">
                  <div className="text-[11px] text-slate-500 uppercase tracking-wider font-semibold">Fiscal Autuante</div>
                  <div className="font-bold text-sm text-slate-900 break-words">{authUser?.nome || 'Dr. Marcelo Queiroz'}</div>
                  <div className="text-xs text-blue-700 font-mono font-semibold">Matrícula: {(authUser as any)?.matricula || 'MAT-402'}</div>
                </div>

                {onExitFiscalizacao && isTopBarHidden && (
                  <button
                    onClick={onExitFiscalizacao}
                    className="flex items-center justify-center space-x-2 px-4 py-3 bg-linear-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white rounded-xl text-xs font-extrabold shadow-sm hover:shadow-md transition-all cursor-pointer transform hover:-translate-y-0.5 active:translate-y-0 shrink-0"
                    title="Sair da Fiscalização Eletrônica e restaurar menus e topos do SIGCON"
                  >
                    <LogOut className="w-4 h-4 text-white" />
                    <span className="whitespace-nowrap">Sair da Fiscalização</span>
                  </button>
                )}
              </div>
            </div>

            {/* 3 Main Big Action Buttons (Matching Screen 15) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 my-auto py-4">
              {/* Card 1: Fiscalização */}
              <button
                onClick={() => setCurrentScreen('estabelecimentos')}
                className="group bg-white hover:bg-blue-50/50 border-2 border-slate-200 hover:border-blue-500 rounded-2xl p-6 sm:p-8 flex flex-col items-center text-center transition-all shadow-sm hover:shadow-md cursor-pointer"
              >
                <div className="w-20 h-20 rounded-2xl bg-blue-100 group-hover:bg-blue-600 text-blue-700 group-hover:text-white flex items-center justify-center transition-colors mb-4 shadow-xs">
                  <FileCheck2 className="w-10 h-10" />
                </div>
                <h2 className="text-xl font-black text-slate-900 group-hover:text-blue-900">
                  Fiscalização
                </h2>
                <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                  Localizar estabelecimentos da rota, consultar RTs e lavrar termos de inspeção com notificação e autuação.
                </p>
                <div className="mt-5 inline-flex items-center space-x-1.5 px-4 py-1.5 rounded-full bg-blue-50 group-hover:bg-blue-600 text-blue-700 group-hover:text-white font-bold text-xs transition-colors">
                  <span>Acessar Rota</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </button>

              {/* Card 2: Sincronização */}
              <button
                onClick={() => setCurrentScreen('sincronizacao')}
                className="group bg-white hover:bg-emerald-50/50 border-2 border-slate-200 hover:border-emerald-500 rounded-2xl p-6 sm:p-8 flex flex-col items-center text-center transition-all shadow-sm hover:shadow-md cursor-pointer"
              >
                <div className="w-20 h-20 rounded-2xl bg-emerald-100 group-hover:bg-emerald-600 text-emerald-700 group-hover:text-white flex items-center justify-center transition-colors mb-4 shadow-xs">
                  <RefreshCw className="w-10 h-10" />
                </div>
                <h2 className="text-xl font-black text-slate-900 group-hover:text-emerald-900">
                  Sincronização
                </h2>
                <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                  Enviar termos de inspeção lavrados no tablet e baixar cadastros atualizados de empresas e RTs.
                </p>
                <div className="mt-5 inline-flex items-center space-x-1.5 px-4 py-1.5 rounded-full bg-emerald-50 group-hover:bg-emerald-600 text-emerald-700 group-hover:text-white font-bold text-xs transition-colors">
                  <span>{network.queueSize} na Fila Offline</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </button>

              {/* Card 3: Importar Estabelecimentos Offline */}
              <button
                onClick={() => setCurrentScreen('info_lote')}
                className="group bg-white hover:bg-purple-50/50 border-2 border-slate-200 hover:border-purple-500 rounded-2xl p-6 sm:p-8 flex flex-col items-center text-center transition-all shadow-sm hover:shadow-md cursor-pointer"
              >
                <div className="w-20 h-20 rounded-2xl bg-purple-100 group-hover:bg-purple-600 text-purple-700 group-hover:text-white flex items-center justify-center transition-colors mb-4 shadow-xs">
                  <Layers className="w-10 h-10" />
                </div>
                <h2 className="text-xl font-black text-slate-900 group-hover:text-purple-900">
                  Importar Estabelecimentos Offline
                </h2>
                <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                  Filtre por cidade, zona e rota para baixar estabelecimentos para o SQLite/IndexedDB e fiscalizar sem internet.
                </p>
                <div className="mt-5 inline-flex items-center space-x-1.5 px-4 py-1.5 rounded-full bg-purple-50 group-hover:bg-purple-600 text-purple-700 group-hover:text-white font-bold text-xs transition-colors">
                  <span>Baixar / Atualizar Lote</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </button>
            </div>

            {/* Bottom Status / Rota Info */}
            <div className="mt-6 bg-white border border-slate-200 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600">
              <div className="flex items-center space-x-2">
                <MapPin className="w-4 h-4 text-rose-500" />
                <span>Rota Ativa: <strong className="text-slate-900 font-bold">{filtroRota} (Polo Purus)</strong></span>
                <span className="text-slate-400">•</span>
                <span>{filteredEmpresas.length} estabelecimentos carregados</span>
              </div>

              <div className="flex items-center space-x-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                <span>Banco Local SQLite / IndexedDB Ativo</span>
              </div>
            </div>
          </div>
        )}

        {/* ======================================================================= */}
        {/* SCREEN: LISTA DE ESTABELECIMENTOS (SCREEN 13) */}
        {/* ======================================================================= */}
        {currentScreen === 'estabelecimentos' && (
          <div className="flex-1 flex flex-col animate-in fade-in duration-150">
            {/* Top Navigation & Search Bar */}
            <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm mb-4">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => setCurrentScreen('menu')}
                    className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
                    title="Voltar ao Menu Principal"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <div>
                    <h2 className="text-lg font-black text-slate-900">
                      Estabelecimentos
                    </h2>
                    <p className="text-xs text-slate-500">
                      {filtroRota} • {filteredEmpresas.length} cadastros encontrados
                    </p>
                  </div>
                </div>

                {/* Search Input & Filter Button */}
                <div className="flex items-center space-x-2 flex-1 sm:max-w-md">
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Pesquisa por Fantasia, Inscrição, Endereço..."
                      className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    {searchTerm && (
                      <button 
                        onClick={() => setSearchTerm('')}
                        className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Filter Trigger Button (Inline Toggle) */}
                  <button
                    onClick={() => setShowFiltrosInline(!showFiltrosInline)}
                    className={`px-3 py-2 rounded-xl border text-xs font-bold flex items-center space-x-1.5 transition-colors cursor-pointer ${
                      showFiltrosInline 
                        ? 'bg-blue-600 text-white border-blue-600 shadow-xs' 
                        : 'bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-slate-700 border-slate-200'
                    }`}
                    title="Abrir/Fechar Filtros Avançados nesta mesma tela"
                  >
                    <Filter className="w-3.5 h-3.5" />
                    <span>Filtros</span>
                    {showFiltrosInline ? <ChevronDown className="w-3 h-3 ml-0.5" /> : <ChevronRight className="w-3 h-3 ml-0.5" />}
                  </button>
                </div>
              </div>

              {/* INLINE COLLAPSIBLE FILTER PANEL (Screen 1, 2, 5 directly on same screen) */}
              {showFiltrosInline && (
                <div className="mt-4 pt-4 border-t border-slate-200 animate-in fade-in duration-200 space-y-3 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-slate-700 uppercase tracking-wider text-[11px] flex items-center">
                      <Filter className="w-3.5 h-3.5 mr-1 text-blue-600" />
                      Filtros e Busca Avançada (Dados dos Cadastros Básicos)
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setFiltroOrdenacao('fantasia');
                        setFiltroSituacao('todos');
                        setFiltroCondicao('todos');
                        setFiltroNatureza('todos');
                        setFiltroRota('todos');
                        setFiltroCidade('todos');
                        setFiltroBairro('');
                        setFiltroEndereco('');
                        setFiltroFiscalizadas('todos');
                      }}
                      className="text-xs text-rose-600 font-bold hover:underline"
                    >
                      Limpar Todos
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    {/* Rota (Cadastros Básicos / Empresas) */}
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Rota:</label>
                      <select
                        value={filtroRota}
                        onChange={(e) => setFiltroRota(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-medium text-slate-800"
                      >
                        <option value="Canutama">Canutama (Polo Purus)</option>
                        <option value="Manaus - Centro">Manaus - Centro</option>
                        <option value="Manaus - Zona Leste">Manaus - Zona Leste</option>
                        <option value="INTERIOR">Interior Geral</option>
                        <option value="todos">Todas as Rotas</option>
                      </select>
                    </div>

                    {/* Cidade (Cadastros Básicos MUNICIPIO) */}
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Cidade / Município:</label>
                      <select
                        value={filtroCidade}
                        onChange={(e) => setFiltroCidade(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-medium text-slate-800"
                      >
                        <option value="todos">Todas as Cidades</option>
                        <option value="Canutama">Canutama</option>
                        <option value="Manaus">Manaus</option>
                        <option value="Manacapuru">Manacapuru</option>
                        <option value="Itacoatiara">Itacoatiara</option>
                        <option value="Parintins">Parintins</option>
                        {cadastrosBasicos
                          .filter(i => i.categoria === 'MUNICIPIO' && i.ativo && !['Canutama', 'Manaus', 'Manacapuru', 'Itacoatiara', 'Parintins'].includes(i.nome))
                          .map(m => (
                            <option key={m.id} value={m.nome}>{m.nome}</option>
                          ))
                        }
                      </select>
                    </div>

                    {/* Situação Cadastral (SITUACAO_EMPRESA) */}
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Situação:</label>
                      <select
                        value={filtroSituacao}
                        onChange={(e) => setFiltroSituacao(e.target.value as any)}
                        className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-medium text-slate-800"
                      >
                        <option value="todos">Todos</option>
                        <option value="regular">Regular</option>
                        <option value="irregular">Irregular</option>
                      </select>
                    </div>

                    {/* Ordenação */}
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Ordenar Por:</label>
                      <select
                        value={filtroOrdenacao}
                        onChange={(e) => setFiltroOrdenacao(e.target.value as any)}
                        className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-medium text-slate-800"
                      >
                        <option value="fantasia">Nome Fantasia</option>
                        <option value="razao">Razão Social</option>
                        <option value="codigo">Inscrição / Código</option>
                        <option value="bairro">Bairro</option>
                        <option value="endereco">Endereço</option>
                      </select>
                    </div>

                    {/* Bairro */}
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Bairro:</label>
                      <input
                        type="text"
                        value={filtroBairro}
                        onChange={(e) => setFiltroBairro(e.target.value)}
                        placeholder="Ex: Centro, São Francisco..."
                        className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
                      />
                    </div>

                    {/* Fiscalizadas */}
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Fiscalizadas Hoje:</label>
                      <select
                        value={filtroFiscalizadas}
                        onChange={(e) => setFiltroFiscalizadas(e.target.value as any)}
                        className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-medium text-slate-800"
                      >
                        <option value="todos">Todos</option>
                        <option value="sim">Apenas Fiscalizadas</option>
                        <option value="nao">Não Fiscalizadas</option>
                      </select>
                    </div>

                    {/* Natureza / Atividade */}
                    <div className="sm:col-span-2">
                      <label className="block font-bold text-slate-700 mb-1">Tipo de Estabelecimento / Atividade:</label>
                      <select
                        value={filtroNatureza}
                        onChange={(e) => setFiltroNatureza(e.target.value as any)}
                        className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-medium text-slate-800"
                      >
                        <option value="todos">Todos os Tipos de Estabelecimento</option>
                        <option value="drogaria">Drogarias</option>
                        <option value="manipulacao">Farmácias com Manipulação</option>
                        <option value="hospitalar">Farmácias Hospitalares / Clínicas</option>
                        <option value="distribuidora">Distribuidoras / Transportadoras</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* List of Establishments (Matching Screen 13 Card Format) */}
            <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
              {filteredEmpresas.length === 0 ? (
                <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
                  <Building className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <h3 className="text-sm font-bold text-slate-700">Nenhum estabelecimento encontrado</h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Ajuste os filtros de busca ou verifique se a rota selecionada está correta.
                  </p>
                  <button
                    onClick={() => {
                      setSearchTerm('');
                      setFiltroRota('todos');
                      setFiltroCidade('todos');
                      setFiltroBairro('');
                    }}
                    className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700"
                  >
                    Limpar Filtros de Busca
                  </button>
                </div>
              ) : (
                filteredEmpresas.map(emp => {
                  const termosEmpresa = allTermos.filter(t => t.empresaId === emp.id || t.cnpj === emp.cnpj);
                  const fiscalizadoHoje = termosEmpresa.some(t => t.dataHora?.includes(new Date().toLocaleDateString('pt-BR')));
                  const temAuto = termosEmpresa.some(t => t.autoInfracaoGerado);

                  return (
                    <div
                      key={emp.id}
                      onClick={() => {
                        setSelectedEmpresa(emp);
                        const primaryRt = (emp.responsaveisTecnicos && emp.responsaveisTecnicos.length > 0)
                          ? emp.responsaveisTecnicos[0]
                          : null;
                        if (primaryRt) {
                          setSelectedRtNome(primaryRt.profissionalNome);
                          setSelectedRtInscricao(primaryRt.profissionalInscricao.startsWith('CRF') ? primaryRt.profissionalInscricao : `CRF-AM ${primaryRt.profissionalInscricao}`);
                          setSelectedRtCargo(primaryRt.cargo || 'RESPONSÁVEL TÉCNICO');
                          setSelectedRtForFicha(primaryRt);
                        } else {
                          setSelectedRtNome(emp.responsavelTecnico || 'ANA KERCIA OLIVEIRA MENDES');
                          setSelectedRtInscricao(emp.crfResponsavel || 'CRF-AM 4821');
                          setSelectedRtCargo('RESPONSÁVEL TÉCNICO');
                          setSelectedRtForFicha({
                            profissionalNome: emp.responsavelTecnico || 'ANA KERCIA OLIVEIRA MENDES',
                            profissionalInscricao: emp.crfResponsavel || 'CRF-AM 4821',
                            cargo: 'RESPONSÁVEL TÉCNICO',
                            cargaHorariaSemanal: 44
                          });
                        }
                        setCurrentScreen('ficha_estabelecimento');
                      }}
                      className="bg-white hover:bg-blue-50/40 border border-slate-200 hover:border-blue-400 rounded-xl p-3 sm:p-3.5 shadow-2xs hover:shadow-sm transition-all cursor-pointer flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                    >
                      <div className="flex items-start space-x-3 min-w-0 flex-1 w-full sm:w-auto">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 font-mono font-bold text-xs ${
                          fiscalizadoHoje 
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' 
                            : 'bg-blue-50 text-blue-700 border border-blue-200'
                        }`}>
                          {emp.inscricao.slice(0, 4)}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="font-mono text-xs font-bold text-slate-500 shrink-0">
                              {emp.inscricao}
                            </span>
                            <span className="text-slate-300">•</span>
                            <h3 className="font-black text-sm text-slate-900 hover:text-blue-600 break-words">
                              {emp.nomeFantasia}
                            </h3>

                            {fiscalizadoHoje && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 shrink-0">
                                <Check className="w-3 h-3 mr-1" /> Fiscalizada Hoje
                              </span>
                            )}

                            {temAuto && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-300 shrink-0">
                                <AlertOctagon className="w-3 h-3 mr-1" /> Autuado
                              </span>
                            )}
                          </div>

                          <div className="text-xs text-slate-600 mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5">
                            <span className="break-words font-medium">{emp.razaoSocial}</span>
                            <span className="text-slate-300 hidden sm:inline">•</span>
                            <span className="font-mono text-slate-500 shrink-0">CNPJ: {emp.cnpj}</span>
                          </div>

                          <div className="text-[11px] text-slate-500 mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5">
                            <span className="flex items-center break-words"><MapPin className="w-3 h-3 mr-0.5 text-slate-400 shrink-0" /> {emp.endereco || 'Centro'}, {emp.bairro || 'Centro'} - {emp.cidade}</span>
                            <span className="text-slate-300 hidden sm:inline">•</span>
                            <span className="break-words">RT: <strong className="text-slate-700">{emp.responsavelTecnico || 'Não averbado'}</strong></span>
                          </div>
                        </div>
                      </div>

                      {/* Right Action / Status Badge */}
                      <div className="flex items-center space-x-2 self-end sm:self-center shrink-0">
                        <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${
                          emp.condicao === 'Regular' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}>
                          {emp.condicao || 'Regular'}
                        </span>
                        <ChevronRight className="w-5 h-5 text-slate-400" />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* ======================================================================= */}
        {/* SCREEN: FICHA DO ESTABELECIMENTO (SCREEN 12) */}
        {/* ======================================================================= */}
        {currentScreen === 'ficha_estabelecimento' && selectedEmpresa && (
          <div className="flex-1 flex flex-col space-y-4 animate-in fade-in duration-150">
            {/* Top Bar with Back and Actions */}
            <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <div className="flex items-center space-x-3 min-w-0 flex-1">
                <button
                  onClick={() => setCurrentScreen('estabelecimentos')}
                  className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer shrink-0"
                  title="Voltar à lista"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 shrink-0">
                      Inscrição: {selectedEmpresa.inscricao}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase shrink-0 ${
                      selectedEmpresa.condicao === 'Regular' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                    }`}>
                      {selectedEmpresa.condicao || 'Regular'}
                    </span>
                  </div>
                  <h1 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight mt-0.5 break-words">
                    {selectedEmpresa.nomeFantasia}
                  </h1>
                </div>
              </div>

              {/* Primary Action: Novo Termo de Inspeção */}
              <button
                onClick={() => setCurrentScreen('novo_termo')}
                className="w-full sm:w-auto justify-center px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-extrabold flex items-center space-x-2 shadow-xs transition-colors cursor-pointer shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>Iniciar Termo de Inspeção</span>
              </button>
            </div>

            {/* Grid with Details */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Left Column: Dados Cadastrais & Horário de Funcionamento */}
              <div className="lg:col-span-2 space-y-4">
                {/* Dados da Empresa */}
                <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs">
                  <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center">
                    <Building className="w-4 h-4 mr-1.5 text-blue-600" />
                    Identificação do Estabelecimento
                  </h2>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-slate-500 block text-[11px]">Razão Social:</span>
                      <span className="font-bold text-slate-900">{selectedEmpresa.razaoSocial}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[11px]">CNPJ:</span>
                      <span className="font-mono font-bold text-slate-900">{selectedEmpresa.cnpj}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[11px]">Tipo de Estabelecimento:</span>
                      <span className="font-medium text-slate-800">{selectedEmpresa.tipoEstabelecimento}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[11px]">Natureza / Categoria:</span>
                      <span className="font-medium text-slate-800">{selectedEmpresa.categoria || 'Privada'}</span>
                    </div>
                    <div className="sm:col-span-2">
                      <span className="text-slate-500 block text-[11px]">Endereço Completo:</span>
                      <span className="font-medium text-slate-800">
                        {selectedEmpresa.endereco || 'Rua Principal'}, {selectedEmpresa.bairro || 'Centro'} — {selectedEmpresa.cidade} / {selectedEmpresa.uf || 'AM'} • CEP: {selectedEmpresa.cep || '69860-000'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Horário de Funcionamento do Estabelecimento (Photo 12) */}
                <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs">
                  <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center">
                    <Clock className="w-4 h-4 mr-1.5 text-blue-600" />
                    Horário Declarado de Funcionamento
                  </h2>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
                    <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                      <span className="text-slate-500 block text-[11px] font-semibold">Segunda a Sexta</span>
                      <span className="font-mono font-bold text-slate-900">07:00 às 21:00</span>
                      <span className="text-[10px] text-slate-400 block mt-0.5">14h diárias</span>
                    </div>
                    <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                      <span className="text-slate-500 block text-[11px] font-semibold">Sábado</span>
                      <span className="font-mono font-bold text-slate-900">07:00 às 21:00</span>
                      <span className="text-[10px] text-slate-400 block mt-0.5">14h diárias</span>
                    </div>
                    <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                      <span className="text-slate-500 block text-[11px] font-semibold">Domingo e Feriados</span>
                      <span className="font-mono font-bold text-slate-900">08:00 às 13:00</span>
                      <span className="text-[10px] text-slate-400 block mt-0.5">05h diárias</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: Quadro de RTs & Histórico */}
              <div className="space-y-4">
                {/* Quadro de Responsáveis Técnicos (Screen 11 / 12) */}
                <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs">
                  <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center justify-between">
                    <span className="flex items-center">
                      <UserCheck className="w-4 h-4 mr-1.5 text-emerald-600" />
                      Responsável Técnico (RT)
                    </span>
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold">
                      {selectedEmpresa.responsaveisTecnicos?.length || (selectedEmpresa.responsavelTecnico ? 1 : 0)} Averbado(s)
                    </span>
                  </h2>

                  <div className="space-y-3">
                    {selectedEmpresa.responsaveisTecnicos && selectedEmpresa.responsaveisTecnicos.length > 0 ? (
                      selectedEmpresa.responsaveisTecnicos.map((rt, idx) => (
                        <div key={rt.profissionalId || idx} className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-800 font-bold flex items-center justify-center text-xs shrink-0">
                              RT
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-black text-xs text-slate-900 truncate">
                                {rt.profissionalNome}
                              </h3>
                              <p className="font-mono text-[11px] text-blue-700 font-bold">
                                {rt.profissionalInscricao.startsWith('CRF') ? rt.profissionalInscricao : `CRF-AM ${rt.profissionalInscricao}`}
                              </p>
                              <p className="text-[10px] text-slate-500 uppercase font-semibold">
                                {rt.cargo} • {rt.cargaHorariaSemanal || 44}H SEMANAIS
                              </p>
                            </div>
                          </div>

                          <button
                            onClick={() => {
                              setSelectedRtForFicha(rt);
                              setCurrentScreen('ficha_rt');
                            }}
                            className="w-full py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-lg text-xs font-bold flex items-center justify-center space-x-1 transition-colors cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5 text-slate-500" />
                            <span>Ver Ficha e Horários do RT</span>
                          </button>
                        </div>
                      ))
                    ) : selectedEmpresa.responsavelTecnico ? (
                      <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-800 font-bold flex items-center justify-center text-xs shrink-0">
                            RT
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-black text-xs text-slate-900 truncate">
                              {selectedEmpresa.responsavelTecnico}
                            </h3>
                            <p className="font-mono text-[11px] text-blue-700 font-bold">
                              {selectedEmpresa.crfResponsavel || 'CRF REGULAR'}
                            </p>
                            <p className="text-[10px] text-slate-500 uppercase font-semibold">
                              DIRETOR TÉCNICO • 44H SEMANAIS
                            </p>
                          </div>
                        </div>

                        <button
                          onClick={() => {
                            setSelectedRtForFicha({
                              profissionalNome: selectedEmpresa.responsavelTecnico,
                              profissionalInscricao: selectedEmpresa.crfResponsavel || 'CRF-AM 4821',
                              cargo: 'DIRETOR TÉCNICO',
                              cargaHorariaSemanal: 44
                            });
                            setCurrentScreen('ficha_rt');
                          }}
                          className="w-full py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-lg text-xs font-bold flex items-center justify-center space-x-1 transition-colors cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5 text-slate-500" />
                          <span>Ver Ficha e Horários do RT</span>
                        </button>
                      </div>
                    ) : (
                      <div className="p-3 text-center bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-400">
                        Nenhum farmacêutico responsável técnico averbado no cadastro.
                      </div>
                    )}
                  </div>
                </div>

                {/* Histórico de Termos do Estabelecimento */}
                <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs">
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center">
                      <FileText className="w-4 h-4 mr-1.5 text-blue-600" />
                      Histórico ({termosDaEmpresa.length})
                    </h2>
                    {termosDaEmpresa.length > 0 && (
                      <button
                        onClick={() => setCurrentScreen('historico_termos')}
                        className="text-xs text-blue-600 font-bold hover:underline"
                      >
                        Ver todos
                      </button>
                    )}
                  </div>

                  {termosDaEmpresa.length === 0 ? (
                    <div className="text-center py-4 text-xs text-slate-400">
                      Nenhum termo de fiscalização registrado para este estabelecimento.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {termosDaEmpresa.slice(0, 3).map(termo => (
                        <div
                          key={termo.id}
                          onClick={() => {
                            setSelectedTermoParaVisualizar(termo);
                            setCurrentScreen('historico_termos');
                          }}
                          className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer text-xs"
                        >
                          <div className="flex items-center justify-between font-bold">
                            <span className="text-blue-700">{termo.numeroTermo}</span>
                            <span className="text-[10px] text-slate-500">{termo.dataHora?.split(' ')[0]}</span>
                          </div>
                          <div className="text-[11px] text-slate-600 mt-0.5">
                            {termo.autoInfracaoGerado ? '⚠️ Auto de Infração Lavrado' : '✅ Visita Regular'}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ======================================================================= */}
        {/* SCREEN: FICHA DO RESPONSÁVEL TÉCNICO (SCREEN 11) */}
        {/* ======================================================================= */}
        {currentScreen === 'ficha_rt' && selectedEmpresa && (
          <div className="flex-1 flex flex-col space-y-4 max-w-3xl mx-auto w-full animate-in fade-in duration-150">
            {/* Top Bar */}
            <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => setCurrentScreen('ficha_estabelecimento')}
                  className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
                  title="Voltar"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <div>
                  <h2 className="text-lg font-black text-slate-900">
                    Ficha do Responsável Técnico
                  </h2>
                  <p className="text-xs text-slate-500">
                    {selectedEmpresa.nomeFantasia} • Inscrição {selectedEmpresa.inscricao}
                  </p>
                </div>
              </div>
            </div>

            {/* RT Profile Card (Screen 11) */}
            {(() => {
              const rtAtual = selectedRtForFicha || (selectedEmpresa.responsaveisTecnicos && selectedEmpresa.responsaveisTecnicos.length > 0 ? selectedEmpresa.responsaveisTecnicos[0] : null) || {
                profissionalNome: selectedEmpresa.responsavelTecnico || 'FARMACÊUTICO RESPONSÁVEL',
                profissionalInscricao: selectedEmpresa.crfResponsavel || 'CRF-AM 4821',
                cargo: 'DIRETOR TÉCNICO',
                cargaHorariaSemanal: 44,
                horarios: [
                  { dia: 'Segunda-feira', inicio1: '08:00', fim1: '12:00', inicio2: '14:00', fim2: '18:00', totalHorasDia: 8 },
                  { dia: 'Terça-feira', inicio1: '08:00', fim1: '12:00', inicio2: '14:00', fim2: '18:00', totalHorasDia: 8 },
                  { dia: 'Quarta-feira', inicio1: '08:00', fim1: '12:00', inicio2: '14:00', fim2: '18:00', totalHorasDia: 8 },
                  { dia: 'Quinta-feira', inicio1: '08:00', fim1: '12:00', inicio2: '14:00', fim2: '18:00', totalHorasDia: 8 },
                  { dia: 'Sexta-feira', inicio1: '08:00', fim1: '12:00', inicio2: '14:00', fim2: '18:00', totalHorasDia: 8 },
                  { dia: 'Sábado', inicio1: '08:00', fim1: '12:00', totalHorasDia: 4 }
                ]
              };

              const initials = rtAtual.profissionalNome
                .split(' ')
                .filter(Boolean)
                .slice(0, 2)
                .map((n: string) => n[0])
                .join('');

              const inscricaoFmt = rtAtual.profissionalInscricao.startsWith('CRF')
                ? rtAtual.profissionalInscricao
                : `CRF-AM ${rtAtual.profissionalInscricao}`;

              const defaultHorarios = [
                { dia: 'Segunda-feira', inicio1: '08:00', fim1: '12:00', inicio2: '14:00', fim2: '18:00', totalHorasDia: 8 },
                { dia: 'Terça-feira', inicio1: '08:00', fim1: '12:00', inicio2: '14:00', fim2: '18:00', totalHorasDia: 8 },
                { dia: 'Quarta-feira', inicio1: '08:00', fim1: '12:00', inicio2: '14:00', fim2: '18:00', totalHorasDia: 8 },
                { dia: 'Quinta-feira', inicio1: '08:00', fim1: '12:00', inicio2: '14:00', fim2: '18:00', totalHorasDia: 8 },
                { dia: 'Sexta-feira', inicio1: '08:00', fim1: '12:00', inicio2: '14:00', fim2: '18:00', totalHorasDia: 8 },
                { dia: 'Sábado', inicio1: '08:00', fim1: '12:00', totalHorasDia: 4 }
              ];

              const horariosRender = (rtAtual.horarios && rtAtual.horarios.length > 0) ? rtAtual.horarios : defaultHorarios;

              return (
                <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
                  <div className="flex items-center space-x-4 border-b border-slate-100 pb-5">
                    <div className="w-16 h-16 rounded-2xl bg-blue-100 text-blue-700 font-extrabold text-xl flex items-center justify-center border border-blue-200">
                      {initials || 'RT'}
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                          REGULAR / ATIVO
                        </span>
                        <span className="text-xs text-slate-400">•</span>
                        <span className="text-xs font-mono font-bold text-blue-700">
                          {inscricaoFmt}
                        </span>
                      </div>
                      <h1 className="text-xl font-black text-slate-900 mt-0.5">
                        {rtAtual.profissionalNome}
                      </h1>
                      <p className="text-xs text-slate-500 font-medium">
                        Farmacêutico • {rtAtual.cargo || 'DIRETOR TÉCNICO'} • Carga Horária: {rtAtual.cargaHorariaSemanal || 44} horas semanais
                      </p>
                    </div>
                  </div>

                  {/* Weekly Working Hours Table (Screen 11) */}
                  <div>
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center">
                      <Clock className="w-4 h-4 mr-1.5 text-blue-600" />
                      Horário de Assistência Técnica Declarado pelo Farmacêutico
                    </h3>

                    <div className="overflow-x-auto border border-slate-200 rounded-xl">
                      <table className="w-full text-xs text-left">
                        <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                          <tr>
                            <th className="py-2.5 px-3">Dia da Semana</th>
                            <th className="py-2.5 px-3">Turno Manhã</th>
                            <th className="py-2.5 px-3">Turno Tarde</th>
                            <th className="py-2.5 px-3 text-right">Total Horas</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-slate-700 font-mono">
                          {horariosRender.map((h: any, i: number) => (
                            <tr key={i}>
                              <td className="py-2 px-3 font-sans font-semibold text-slate-900">{h.dia}</td>
                              <td className="py-2 px-3">{h.inicio1 && h.fim1 ? `${h.inicio1} - ${h.fim1}` : (h.inicio1 || '---')}</td>
                              <td className="py-2 px-3">{h.inicio2 && h.fim2 ? `${h.inicio2} - ${h.fim2}` : '---'}</td>
                              <td className="py-2 px-3 text-right font-bold text-blue-700">{h.totalHorasDia || 8}h</td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot className="bg-blue-50 font-bold text-blue-900 border-t border-blue-200">
                          <tr>
                            <td colSpan={3} className="py-2 px-3 font-sans">Carga Horária Semanal Total</td>
                            <td className="py-2 px-3 text-right font-mono">{rtAtual.cargaHorariaSemanal || 44} horas</td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Botão de Retorno */}
            <button
              onClick={() => setCurrentScreen('ficha_estabelecimento')}
              className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
            >
              Voltar para Ficha do Estabelecimento
            </button>
          </div>
        )}

        {/* ======================================================================= */}
        {/* SCREEN: NOVO TERMO DE INSPEÇÃO (SCREENS 3, 4, 6, 7, 8, 9) */}
        {/* ======================================================================= */}
        {currentScreen === 'novo_termo' && selectedEmpresa && (
          <div className="flex-1 flex flex-col space-y-4 max-w-4xl mx-auto w-full pb-10 animate-in fade-in duration-150">
            {/* Header da Lavratura do Termo */}
            <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <div className="flex items-center space-x-3 min-w-0 flex-1">
                <button
                  onClick={() => setCurrentScreen('ficha_estabelecimento')}
                  className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer shrink-0"
                  title="Cancelar e Voltar"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 shrink-0">
                      {selectedEmpresa.inscricao}
                    </span>
                    <span className="text-xs text-slate-400">•</span>
                    <span className="text-xs text-slate-600 font-mono shrink-0">CNPJ: {selectedEmpresa.cnpj}</span>
                  </div>
                  <h1 className="text-base sm:text-lg font-black text-slate-900 mt-0.5 break-words">
                    {selectedEmpresa.nomeFantasia}
                  </h1>
                </div>
              </div>

              {/* GPS Coordenadas & Fiscal */}
              <div className="text-left sm:text-right text-xs bg-slate-50 sm:bg-transparent p-2 sm:p-0 rounded-xl border sm:border-0 border-slate-200 shrink-0">
                <div className="font-bold text-slate-800 break-words">{authUser?.nome || 'Dr. Marcelo Queiroz'}</div>
                <div className="text-[11px] font-mono text-emerald-700 flex items-center sm:justify-end space-x-1 mt-0.5">
                  <MapPin className="w-3 h-3 text-emerald-600 shrink-0" />
                  <span className="truncate">{gpsCoords ? `${gpsCoords.lat}, ${gpsCoords.lng}` : 'Coordenadas locais'}</span>
                </div>
              </div>
            </div>

            {/* SEÇÃO 1: ESTADO DA EMPRESA E RESPONSÁVEL TÉCNICO (Screen 3 & 4) */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-4">
              <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center border-b border-slate-100 pb-2">
                <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-[10px] mr-2">1</span>
                Estado do Estabelecimento & Responsável Técnico
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Aberta ou Fechada */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    A empresa se encontrava:
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setEncontrava('Aberta')}
                      className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center space-x-1.5 transition-colors ${
                        encontrava === 'Aberta' 
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-400 ring-2 ring-emerald-200' 
                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <Check className="w-4 h-4" />
                      <span>Aberta</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setEncontrava('Fechada')}
                      className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center space-x-1.5 transition-colors ${
                        encontrava === 'Fechada' 
                          ? 'bg-rose-50 text-rose-800 border-rose-400 ring-2 ring-rose-200' 
                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <X className="w-4 h-4" />
                      <span>Fechada</span>
                    </button>
                  </div>
                </div>

                {/* Se Fechada, Motivo */}
                {encontrava === 'Fechada' && (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Motivo:
                    </label>
                    <select
                      value={motivoFechada}
                      onChange={(e) => setMotivoFechada(e.target.value as any)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="Mot. Desconhecido">Mot. Desconhecido</option>
                      <option value="Em reforma">Em reforma</option>
                      <option value="Feriado">Feriado</option>
                      <option value="Horário de almoço">Horário de almoço</option>
                      <option value="Encerrada">Encerrada</option>
                    </select>
                  </div>
                )}

                {/* Dropdown R.T. (Photo 4) */}
                <div className={encontrava === 'Fechada' ? 'sm:col-span-2' : ''}>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Responsável Técnico (R.T.):
                  </label>
                  <select
                    value={rtSituacao}
                    onChange={(e) => {
                      const val = e.target.value;
                      setRtSituacao(val);
                      if (val === 'Ausente') {
                        setAutuacaoAtiva(true);
                        setAutuacaoAusente(true);
                      } else {
                        setAutuacaoAusente(false);
                      }
                    }}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Presente">Presente</option>
                    <option value="Ausente">Ausente</option>
                    <option value="Não possui">Não possui</option>
                    <option value="Não possui Farm.Sub ou A.T">Não possui Farm.Sub ou A.T</option>
                    <option value="Fiscalização Realizada fora do HAT">Fiscalização Realizada fora do HAT</option>
                    <option value="Dentro do prazo de 30 dias">Dentro do prazo de 30 dias</option>
                  </select>
                </div>
              </div>

              {/* RT Titular Declarado no Cadastro: Ocultar automaticamente se for "Não Possui", "Não Possui farm. Sub ou A.T" ou "Dentro do prazo de 30 dias" */}
              {!(
                rtSituacao === 'Não possui' || 
                rtSituacao === 'Não Possui' || 
                rtSituacao === 'Não possui Farm.Sub ou A.T' || 
                rtSituacao === 'Não Possui farm. Sub ou A.T' || 
                rtSituacao === 'Dentro do prazo de 30 dias'
              ) && (
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs space-y-2 animate-in fade-in duration-150">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                    <label className="font-bold text-slate-700 flex items-center space-x-1.5">
                      <UserCheck className="w-3.5 h-3.5 text-blue-600" />
                      <span>RT Titular Declarado no Cadastro:</span>
                    </label>
                    <span className="text-[10px] text-slate-400">
                      Selecione o farmacêutico vinculado que irá atendê-lo
                    </span>
                  </div>

                  {selectedEmpresa.responsaveisTecnicos && selectedEmpresa.responsaveisTecnicos.length > 0 ? (
                    <select
                      value={selectedRtInscricao}
                      onChange={(e) => {
                        const insc = e.target.value;
                        const rt = selectedEmpresa.responsaveisTecnicos?.find(r => r.profissionalInscricao === insc);
                        if (rt) {
                          setSelectedRtNome(rt.profissionalNome);
                          setSelectedRtInscricao(rt.profissionalInscricao);
                          setSelectedRtCargo(rt.cargo || 'RESPONSÁVEL TÉCNICO');
                        }
                      }}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-2xs"
                    >
                      {selectedEmpresa.responsaveisTecnicos.map((rt) => (
                        <option key={rt.profissionalId || rt.profissionalInscricao} value={rt.profissionalInscricao}>
                          {rt.profissionalNome} — {rt.profissionalInscricao} ({rt.cargo})
                        </option>
                      ))}
                    </select>
                  ) : selectedEmpresa.responsavelTecnico ? (
                    <div className="p-2.5 bg-white border border-slate-200 rounded-lg flex items-center justify-between">
                      <span className="font-bold text-slate-900">{selectedEmpresa.responsavelTecnico}</span>
                      <span className="font-mono text-blue-700 font-bold">{selectedEmpresa.crfResponsavel || 'CRF REGULAR'}</span>
                    </div>
                  ) : (
                    <div className="p-2 bg-amber-50 text-amber-800 rounded-lg text-xs border border-amber-200 flex items-center space-x-2">
                      <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600" />
                      <span>Nenhum profissional farmacêutico averbado no cadastro desta empresa.</span>
                    </div>
                  )}
                </div>
              )}

              {/* CAMPO OBSERVAÇÃO (logo abaixo do campo RT Titular Declarado no Cadastro) */}
              <div className="pt-1">
                <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center justify-between">
                  <span className="flex items-center space-x-1.5">
                    <FileText className="w-3.5 h-3.5 text-blue-600" />
                    <span>Observação:</span>
                    <span className="text-rose-600 font-bold">*</span>
                    <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-1.5 py-0.2 rounded border border-rose-200">
                      Obrigatório
                    </span>
                  </span>
                  <span className="text-[10px] text-slate-400 font-normal">
                    Orientações prestadas e constatações gerais in loco
                  </span>
                </label>
                <textarea
                  rows={4}
                  value={observacaoFiscais}
                  onChange={(e) => setObservacaoFiscais(e.target.value)}
                  placeholder="Digite aqui todas as orientações fornecidas e observações encontradas no local durante a inspeção..."
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-normal leading-relaxed"
                />
              </div>
            </div>

            {/* SEÇÃO 2: NOTIFICAÇÃO (Renomeado de NOTIFICAÇÃO FISCAL REGULATÓRIA) */}
            <div className={`rounded-2xl border p-5 transition-colors shadow-2xs ${
              notificacaoAtiva ? 'bg-amber-50/40 border-amber-300' : 'bg-white border-slate-200'
            }`}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-2 mb-3 gap-2">
                <div className="flex items-center space-x-2">
                  <span className="w-5 h-5 rounded-full bg-amber-100 text-amber-700 font-bold flex items-center justify-center text-[10px]">2</span>
                  <h2 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    NOTIFICAÇÃO
                  </h2>
                  {numeroNotificacao && (
                    <span className="font-mono text-[11px] font-bold px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 border border-amber-300">
                      Nº {numeroNotificacao}
                    </span>
                  )}
                </div>

                <label className="flex items-center space-x-2 cursor-pointer self-start sm:self-auto">
                  <input
                    type="checkbox"
                    checked={notificacaoAtiva}
                    onChange={(e) => handleToggleNotificacao(e.target.checked)}
                    className="w-4 h-4 text-amber-600 rounded border-slate-300 focus:ring-amber-500"
                  />
                  <span className="text-xs font-bold text-amber-900">Lavrar Notificação</span>
                </label>
              </div>

              {notificacaoAtiva && (
                <div className="space-y-3 animate-in fade-in duration-150">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between text-[11px] text-amber-800 font-medium gap-1.5">
                    <span className="break-words">Texto regulatório oficial (configurável no Painel do Administrador):</span>
                    {numeroNotificacao && (
                      <span className="font-mono font-bold bg-white px-2 py-0.5 rounded border border-amber-200 self-start sm:self-auto shrink-0">
                        Sequencial Anti-Duplicidade: {numeroNotificacao}
                      </span>
                    )}
                  </div>
                  <textarea
                    rows={4}
                    value={notificacaoTexto}
                    onChange={(e) => setNotificacaoTexto(e.target.value)}
                    className="w-full p-3 bg-white border border-amber-300 rounded-xl text-xs text-slate-800 font-medium focus:ring-2 focus:ring-amber-500 focus:outline-none leading-relaxed"
                  />
                </div>
              )}
            </div>

            {/* SEÇÃO 3: INTIMAÇÃO */}
            <div className={`rounded-2xl border p-5 transition-colors shadow-2xs ${
              intimacaoAtiva ? 'bg-blue-50/40 border-blue-300' : 'bg-white border-slate-200'
            }`}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-2 mb-3 gap-2">
                <div className="flex items-center space-x-2">
                  <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-[10px]">3</span>
                  <h2 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    INTIMAÇÃO
                  </h2>
                  {numeroIntimacao && (
                    <span className="font-mono text-[11px] font-bold px-2 py-0.5 rounded-md bg-blue-100 text-blue-900 border border-blue-300">
                      Nº {numeroIntimacao}
                    </span>
                  )}
                </div>

                <label className="flex items-center space-x-2 cursor-pointer self-start sm:self-auto">
                  <input
                    type="checkbox"
                    checked={intimacaoAtiva}
                    onChange={(e) => handleToggleIntimacao(e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                  />
                  <span className="text-xs font-bold text-blue-900">Lavrar Intimação</span>
                </label>
              </div>

              {intimacaoAtiva && (
                <div className="space-y-2.5 animate-in fade-in duration-150">
                  <label className="flex items-center space-x-2 text-xs text-slate-800 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={intimacaoCrtAtualizada}
                      onChange={(e) => setIntimacaoCrtAtualizada(e.target.checked)}
                      className="w-4 h-4 text-blue-600 rounded border-slate-300"
                    />
                    <span>Apresentar Certidão de Regularidade Técnica (CRT) atualizada</span>
                  </label>

                  <label className="flex items-center space-x-2 text-xs text-slate-800 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={intimacaoCrtLocalVisivel}
                      onChange={(e) => setIntimacaoCrtLocalVisivel(e.target.checked)}
                      className="w-4 h-4 text-blue-600 rounded border-slate-300"
                    />
                    <span>Manter a CRT afixada em local visível ao público</span>
                  </label>

                  <label className="flex items-center space-x-2 text-xs text-slate-800 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={intimacaoAlteracaoSocial}
                      onChange={(e) => setIntimacaoAlteracaoSocial(e.target.checked)}
                      className="w-4 h-4 text-blue-600 rounded border-slate-300"
                    />
                    <span>Regularizar alteração social / contratual ou de endereço</span>
                  </label>

                  <input
                    type="text"
                    placeholder="Outras exigências da intimação..."
                    value={intimacaoOutrasObservacoes}
                    onChange={(e) => setIntimacaoOutrasObservacoes(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              )}
            </div>

            {/* SEÇÃO 4: AUTO DE INFRAÇÃO / AUTUAÇÃO (Screen 7, 8) */}
            <div className={`rounded-2xl border p-4 sm:p-5 transition-colors shadow-2xs ${
              autuacaoAtiva ? 'bg-rose-50/40 border-rose-300' : 'bg-white border-slate-200'
            }`}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-2 mb-3 gap-2.5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-rose-100 text-rose-700 font-bold flex items-center justify-center text-[10px] shrink-0">4</span>
                  <h2 className="text-xs font-bold text-slate-700 uppercase tracking-wider break-words">
                    Auto de Infração (Autuação)
                  </h2>
                  {numeroAutoInfracao && (
                    <span className="font-mono text-[11px] font-bold px-2 py-0.5 rounded-md bg-rose-100 text-rose-900 border border-rose-300 shrink-0">
                      Nº {numeroAutoInfracao}
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={handleVerificarHorariosVagos}
                    className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 rounded-xl text-xs font-bold flex items-center space-x-1.5 shadow-2xs transition-colors cursor-pointer shrink-0"
                    title="Verificar horários vagos conforme módulo de assistência por município/ramo e restrições de bloqueio"
                  >
                    <Clock className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                    <span className="whitespace-nowrap">Verificar Horários Vagos</span>
                  </button>

                  <label className="flex items-center space-x-2 cursor-pointer shrink-0">
                    <input
                      type="checkbox"
                      checked={autuacaoAtiva}
                      onChange={(e) => handleToggleAutuacao(e.target.checked)}
                      className="w-4 h-4 text-rose-600 rounded border-slate-300 focus:ring-rose-500"
                    />
                    <span className="text-xs font-bold text-rose-900 whitespace-nowrap">Lavrar Auto de Infração</span>
                  </label>
                </div>
              </div>

              {horariosVagosVerificados && diagnosticoHorariosVagos && (
                <div className={`mb-3 p-3.5 rounded-xl border text-xs space-y-2 animate-in fade-in duration-200 ${
                  diagnosticoHorariosVagos.temInconformidade 
                    ? 'bg-rose-50 border-rose-200 text-rose-950' 
                    : 'bg-emerald-50 border-emerald-200 text-emerald-950'
                }`}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center space-x-2">
                      {diagnosticoHorariosVagos.temInconformidade ? (
                        <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                      ) : (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      )}
                      <div>
                        <strong className="font-extrabold text-xs block">
                          {diagnosticoHorariosVagos.temInconformidade 
                            ? 'HORÁRIOS VAGOS / DESASSISTÊNCIA DETECTADA' 
                            : 'ASSISTÊNCIA FARMACÊUTICA REGULAR'}
                        </strong>
                        <span className="text-[11px] opacity-90">
                          {diagnosticoHorariosVagos.motivoPrincipal}
                        </span>
                      </div>
                    </div>

                    <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-white border border-slate-200 shrink-0">
                      {diagnosticoHorariosVagos.diaSemana} • {diagnosticoHorariosVagos.horaVerificacao}
                    </span>
                  </div>

                  <div className="pt-1.5 border-t border-rose-200/50 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px]">
                    <div>
                      <strong>Regra do Município ({selectedEmpresa.cidade}):</strong> {diagnosticoHorariosVagos.regraNome}
                    </div>
                    <div>
                      <strong>Base Legal:</strong> {diagnosticoHorariosVagos.regraBaseLegal}
                    </div>
                    <div>
                      <strong>Carga Horária Semanal:</strong> Func: {diagnosticoHorariosVagos.horasFuncionamento}h • Assist: {diagnosticoHorariosVagos.horasAssistencia}h
                    </div>
                  </div>

                  {diagnosticoHorariosVagos.intervalosVagos.length > 0 && (
                    <div className="bg-white/80 p-2 rounded-lg border border-rose-200 space-y-1">
                      <div className="font-bold text-[10px] text-rose-900 uppercase tracking-wide">
                        Intervalos Desassistidos (Horários Vagos):
                      </div>
                      <ul className="list-disc list-inside space-y-0.5 text-[11px] text-rose-800 font-mono">
                        {diagnosticoHorariosVagos.intervalosVagos.map((iv, idx) => (
                          <li key={idx}>{iv}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {diagnosticoHorariosVagos.bloqueiosIdentificados.length > 0 && (
                    <div className="bg-amber-50 p-2 rounded-lg border border-amber-200 text-amber-900 space-y-1">
                      <div className="font-bold text-[10px] uppercase tracking-wide flex items-center space-x-1">
                        <AlertTriangle className="w-3 h-3 text-amber-600" />
                        <span>Restrições de Bloqueio no Cadastro:</span>
                      </div>
                      <ul className="list-disc list-inside space-y-0.5 text-[11px]">
                        {diagnosticoHorariosVagos.bloqueiosIdentificados.map((b, idx) => (
                          <li key={idx}>{b}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {autuacaoAtiva && (
                <div className="space-y-2.5 animate-in fade-in duration-150">
                  <p className="text-[11px] text-rose-900 font-bold uppercase tracking-wider">
                    Tipificações Legais e Fatos Enquadrados (Marque as ocorrências):
                  </p>

                  {/* 6 Tipificações Legais da Foto 7 e 8 */}
                  <label className={`flex items-start space-x-2 text-xs cursor-pointer ${
                    rtSituacao !== 'Ausente' ? 'opacity-50 cursor-not-allowed text-slate-400' : 'text-slate-800'
                  }`}>
                    <input
                      type="checkbox"
                      disabled={rtSituacao !== 'Ausente'}
                      checked={rtSituacao === 'Ausente' && autuacaoAusente}
                      onChange={(e) => setAutuacaoAusente(e.target.checked)}
                      className="w-4 h-4 text-rose-600 rounded border-slate-300 mt-0.5 disabled:opacity-50"
                    />
                    <div>
                      <span><strong>1 -</strong> Farmacêutico RT Ausente durante o horário de assistência obrigatória (Art. 24 da Lei 3820/60)</span>
                      {rtSituacao !== 'Ausente' && (
                        <span className="block text-[10px] text-slate-400 font-normal italic">
                          (Habilitado exclusivamente quando o campo Responsável Técnico (R.T.) for "Ausente")
                        </span>
                      )}
                    </div>
                  </label>

                  <label className="flex items-start space-x-2 text-xs text-slate-800 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={autuacaoSemRt}
                      onChange={(e) => setAutuacaoSemRt(e.target.checked)}
                      className="w-4 h-4 text-rose-600 rounded border-slate-300 mt-0.5"
                    />
                    <span><strong>2 -</strong> Estabelecimento funcionando Sem Responsável Técnico averbado (Lei 3820/60 c/c Lei 13021/14)</span>
                  </label>

                  <label className="flex items-start space-x-2 text-xs text-slate-800 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={autuacaoChi}
                      onChange={(e) => setAutuacaoChi(e.target.checked)}
                      className="w-4 h-4 text-rose-600 rounded border-slate-300 mt-0.5"
                    />
                    <span><strong>3 -</strong> Certidão de Regularidade (CRT/CHI) vencida ou não solicitada</span>
                  </label>

                  <label className="flex items-start space-x-2 text-xs text-slate-800 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={autuacaoSemSubstituto}
                      onChange={(e) => setAutuacaoSemSubstituto(e.target.checked)}
                      className="w-4 h-4 text-rose-600 rounded border-slate-300 mt-0.5"
                    />
                    <span><strong>4 -</strong> Ausência de Farmacêutico Substituto no intervalo ou desfalque de jornada</span>
                  </label>

                  <label className="flex items-start space-x-2 text-xs text-slate-800 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={autuacaoIlegal}
                      onChange={(e) => setAutuacaoIlegal(e.target.checked)}
                      className="w-4 h-4 text-rose-600 rounded border-slate-300 mt-0.5"
                    />
                    <span><strong>5 -</strong> Exercício Ilegal da Profissão / Venda de medicamentos por leigo desassistido</span>
                  </label>

                  <label className="flex items-start space-x-2 text-xs text-slate-800 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={autuacaoPrivativas}
                      onChange={(e) => setAutuacaoPrivativas(e.target.checked)}
                      className="w-4 h-4 text-rose-600 rounded border-slate-300 mt-0.5"
                    />
                    <span><strong>6 -</strong> Comercialização irregular de produtos ou serviços privativos da farmácia</span>
                  </label>

                  <div className="pt-2">
                    <input
                      type="text"
                      placeholder="Circunstâncias adicionais do auto de infração..."
                      value={autuacaoOutrasObservacoes}
                      onChange={(e) => setAutuacaoOutrasObservacoes(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-rose-500 focus:outline-none"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* SEÇÃO 5: IDENTIFICAÇÃO DE QUEM ATENDEU (Screen 9) */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-2 gap-2">
                <div className="flex items-center space-x-2">
                  <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-[10px]">5</span>
                  <h2 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Identificação de Quem Atendeu a Fiscalização
                  </h2>
                </div>

                {/* 2 ÍCONES DE AÇÃO SOLICITADOS: LIMPAR DADOS & PREENCHER COM RT TITULAR */}
                <div className="flex flex-wrap items-center gap-2">
                  {/* Ícone 1: Preencher com dados do Farmacêutico RT Titular Selecionado */}
                  <button
                    type="button"
                    onClick={handlePreencherComDadosRt}
                    className="px-2.5 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-xs font-bold flex items-center space-x-1.5 transition-colors cursor-pointer shrink-0"
                    title="Preencher todos os campos com os dados do Farmacêutico RT Titular Selecionado"
                  >
                    <UserCheck className="w-3.5 h-3.5 text-blue-600" />
                    <span className="text-[11px] whitespace-nowrap">Puxar RT Titular</span>
                  </button>

                  {/* Ícone 2: Limpar dados */}
                  <button
                    type="button"
                    onClick={handleLimparDadosAtendente}
                    className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-rose-50 hover:text-rose-700 text-slate-600 border border-slate-200 text-xs font-bold flex items-center space-x-1.5 transition-colors cursor-pointer shrink-0"
                    title="Limpar campos: Nome completo, RG, CPF e Inscrição"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-rose-600" />
                    <span className="text-[11px] whitespace-nowrap">Limpar Campos</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Cargo / Função:</label>
                  <select
                    value={atendenteCargo}
                    onChange={(e) => setAtendenteCargo(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Farmacêutico">Farmacêutico</option>
                    <option value="Gerente / Administrador">Gerente / Administrador</option>
                    <option value="Balconista / Atendente">Balconista / Atendente</option>
                    <option value="Proprietário / Sócio">Proprietário / Sócio</option>
                    <option value="Outro">Outro Representante</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Nome Completo:</label>
                  <input
                    type="text"
                    value={atendenteNome}
                    onChange={(e) => setAtendenteNome(e.target.value)}
                    placeholder="Nome do atendente"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* CAMPO NÚMERO DE INSCRIÇÃO: SÓ APARECE SE O CARGO FOR FARMACÊUTICO */}
                {atendenteCargo === 'Farmacêutico' && (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Número de Inscrição (CRF):</label>
                    <input
                      type="text"
                      value={atendenteInscricao}
                      onChange={(e) => setAtendenteInscricao(e.target.value)}
                      placeholder="Ex: CRF-AM 4821"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-blue-700 font-mono focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">RG:</label>
                  <input
                    type="text"
                    value={atendenteRg}
                    onChange={(e) => setAtendenteRg(e.target.value)}
                    placeholder="Ex: 1234567 SSP/AM"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">CPF:</label>
                  <input
                    type="text"
                    value={atendenteCpf}
                    onChange={(e) => setAtendenteCpf(e.target.value)}
                    placeholder="000.000.000-00"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* SEÇÃO 6: ASSINATURAS DIGITAIS NA TELA DO TABLET (Screen 9) */}
            <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-2xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-2 gap-2">
                <div className="flex items-center space-x-2">
                  <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-[10px] shrink-0">6</span>
                  <h2 className="text-xs font-bold text-slate-700 uppercase tracking-wider break-words">
                    Assinaturas Digitais na Tela do Tablet
                  </h2>
                </div>

                <label className="flex items-center space-x-2 cursor-pointer self-start sm:self-auto shrink-0">
                  <input
                    type="checkbox"
                    checked={recusouAssinar}
                    onChange={(e) => setRecusouAssinar(e.target.checked)}
                    className="w-4 h-4 text-rose-600 rounded border-slate-300"
                  />
                  <span className="text-xs font-bold text-rose-700 whitespace-nowrap">Recusou-se a assinar</span>
                </label>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* 1. Assinatura Estabelecimento / Farmacêutico (Opcional) */}
                <div className="border border-slate-200 rounded-xl p-3 bg-slate-50 flex flex-col justify-between">
                  <div className="flex flex-wrap items-center justify-between gap-1 mb-2">
                    <span className="text-xs font-bold text-slate-800 flex flex-wrap items-center gap-1 min-w-0">
                      <span className="break-words">Assinatura Estabelecimento/Farmacêutico</span>
                      <span className="text-[10px] font-normal text-slate-500 shrink-0">(Opcional)</span>
                    </span>
                    <button
                      type="button"
                      onClick={clearCanvasNotificado}
                      className="text-[11px] text-rose-600 hover:text-rose-800 font-bold flex items-center space-x-1 shrink-0 ml-auto"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>Limpar</span>
                    </button>
                  </div>

                  {recusouAssinar ? (
                    <div className="h-32 border-2 border-dashed border-rose-300 rounded-lg bg-rose-50 flex items-center justify-center text-xs text-rose-700 font-bold p-3 text-center">
                      Notificado recusou-se a apor sua assinatura na tela deste dispositivo tablet. Lavrado com a observação formal: "Recusou-se a assinar".
                    </div>
                  ) : (
                    <div className="bg-white border border-slate-300 rounded-lg overflow-hidden relative">
                      <canvas
                        ref={canvasNotificadoRef}
                        width={380}
                        height={130}
                        className="w-full h-32 touch-none cursor-crosshair"
                        onMouseDown={startDrawingNotificado}
                        onMouseMove={drawNotificado}
                        onMouseUp={stopDrawingNotificado}
                        onMouseLeave={stopDrawingNotificado}
                        onTouchStart={startDrawingNotificado}
                        onTouchMove={drawNotificado}
                        onTouchEnd={stopDrawingNotificado}
                      />
                      {!signatureNotificadoUrl && (
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-slate-300 text-xs font-bold text-center px-2">
                          Assinatura opcional (deixar em branco se ausente)
                        </div>
                      )}
                    </div>
                  )}
                  <span className="text-[10px] text-slate-400 mt-1.5 block break-words">
                    {atendenteNome || 'Representante do Estabelecimento'} ({atendenteCargo})
                  </span>
                </div>

                {/* 2. Assinatura do Fiscal Autuante (Obrigatório) */}
                <div className="border border-slate-200 rounded-xl p-3 bg-slate-50 flex flex-col justify-between">
                  <div className="flex flex-wrap items-center justify-between gap-1 mb-2">
                    <span className="text-xs font-bold text-slate-800 flex flex-wrap items-center gap-1 min-w-0">
                      <span className="break-words">Assinatura do Fiscal</span>
                      <span className="text-rose-600 font-bold shrink-0">*</span>
                      <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-1.5 py-0.2 rounded border border-rose-200 shrink-0">
                        Obrigatório
                      </span>
                    </span>
                    <button
                      type="button"
                      onClick={clearCanvasFiscal}
                      className="text-[11px] text-rose-600 hover:text-rose-800 font-bold flex items-center space-x-1 shrink-0 ml-auto"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>Limpar</span>
                    </button>
                  </div>

                  <div className="bg-white border border-slate-300 rounded-lg overflow-hidden relative">
                    <canvas
                      ref={canvasFiscalRef}
                      width={380}
                      height={130}
                      className="w-full h-32 touch-none cursor-crosshair"
                      onMouseDown={startDrawingFiscal}
                      onMouseMove={drawFiscal}
                      onMouseUp={stopDrawingFiscal}
                      onMouseLeave={stopDrawingFiscal}
                      onTouchStart={startDrawingFiscal}
                      onTouchMove={drawFiscal}
                      onTouchEnd={stopDrawingFiscal}
                    />
                    {!signatureFiscalUrl && (
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-slate-400 text-xs font-bold text-center px-2">
                        Desenhe a assinatura do Fiscal aqui *
                      </div>
                    )}
                  </div>
                  <span className="text-[10px] text-slate-400 mt-1.5 block break-words">
                    {authUser?.nome || 'Dr. Marcelo Queiroz'} — Fiscal do {council.sigla}
                  </span>
                </div>
              </div>
            </div>

            {/* BOTÕES DE GRAVAR E CONCLUIR */}
            <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setCurrentScreen('ficha_estabelecimento')}
                className="w-full sm:w-auto text-center px-4 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={handleSalvarTermo}
                className="w-full sm:w-auto justify-center px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-black shadow-md flex items-center space-x-2 transition-all cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>Salvar e Gerar Termo de Inspeção</span>
              </button>
            </div>
          </div>
        )}

        {/* ======================================================================= */}
        {/* SCREEN: HISTÓRICO DE TERMOS (SCREEN 10) */}
        {/* ======================================================================= */}
        {/* ======================================================================= */}
        {/* SCREEN: HISTÓRICO DE TERMOS (SCREEN 10) */}
        {/* ======================================================================= */}
        {currentScreen === 'historico_termos' && (() => {
          const now = new Date();
          const oneYearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
          const twoYearsAgo = new Date(now.getFullYear() - 2, now.getMonth(), now.getDate());
          const threeYearsAgo = new Date(now.getFullYear() - 3, now.getMonth(), now.getDate());

          const termosFiltrados = termosDaEmpresa.filter(termo => {
            // Occurrence filter
            if (filtroHistoricoTipo === 'autuada' && !termo.autoInfracaoGerado) return false;
            if (filtroHistoricoTipo === 'notificada' && !termo.notificacaoAtiva) return false;
            if (filtroHistoricoTipo === 'intimada' && !termo.intimacaoAtiva) return false;
            if (filtroHistoricoTipo === 'regular' && (termo.autoInfracaoGerado || termo.notificacaoAtiva || termo.intimacaoAtiva)) return false;

            // Period filter
            if (filtroHistoricoPeriodo !== 'todos') {
              const datePart = termo.dataHora ? termo.dataHora.split(' ')[0] : '';
              const parts = datePart.split('/');
              if (parts.length === 3) {
                const d = parseInt(parts[0], 10);
                const m = parseInt(parts[1], 10) - 1;
                const y = parseInt(parts[2], 10);
                const termoDate = new Date(y, m, d);

                if (filtroHistoricoPeriodo === '1_ano' && termoDate < oneYearAgo) return false;
                if (filtroHistoricoPeriodo === '2_anos' && termoDate < twoYearsAgo) return false;
                if (filtroHistoricoPeriodo === '3_anos' && termoDate < threeYearsAgo) return false;
              }
            }

            return true;
          });

          return (
            <div className="flex-1 flex flex-col space-y-4 animate-in fade-in duration-150">
              {/* Top Bar */}
              <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => setCurrentScreen('ficha_estabelecimento')}
                    className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <div>
                    <h2 className="text-lg font-black text-slate-900">
                      Histórico de Termos Lavrados
                    </h2>
                    <p className="text-xs text-slate-500">
                      {selectedEmpresa ? selectedEmpresa.nomeFantasia : 'Todos os Estabelecimentos'} • {termosFiltrados.length} termo(s) exibido(s)
                    </p>
                  </div>
                </div>

                {selectedEmpresa && (
                  <button
                    onClick={() => setCurrentScreen('novo_termo')}
                    className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 cursor-pointer self-start sm:self-auto"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Iniciar Termo de Inspeção</span>
                  </button>
                )}
              </div>

              {/* Filtros por Período e Tipo (Pré-definidos 1, 2, 3 anos e ocorrências) */}
              <div className="bg-white rounded-2xl border border-slate-200 p-3.5 shadow-2xs flex flex-wrap items-center justify-between gap-3 text-xs">
                {/* Período Pré-definido */}
                <div className="flex items-center space-x-2">
                  <span className="font-bold text-slate-700 flex items-center space-x-1">
                    <Calendar className="w-3.5 h-3.5 text-blue-600" />
                    <span>Período:</span>
                  </span>
                  <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-xl">
                    <button
                      type="button"
                      onClick={() => setFiltroHistoricoPeriodo('todos')}
                      className={`px-2.5 py-1 rounded-lg font-semibold text-[11px] transition-colors ${
                        filtroHistoricoPeriodo === 'todos' ? 'bg-white text-blue-700 shadow-2xs font-bold' : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Todos
                    </button>
                    <button
                      type="button"
                      onClick={() => setFiltroHistoricoPeriodo('1_ano')}
                      className={`px-2.5 py-1 rounded-lg font-semibold text-[11px] transition-colors ${
                        filtroHistoricoPeriodo === '1_ano' ? 'bg-white text-blue-700 shadow-2xs font-bold' : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Último 1 ano
                    </button>
                    <button
                      type="button"
                      onClick={() => setFiltroHistoricoPeriodo('2_anos')}
                      className={`px-2.5 py-1 rounded-lg font-semibold text-[11px] transition-colors ${
                        filtroHistoricoPeriodo === '2_anos' ? 'bg-white text-blue-700 shadow-2xs font-bold' : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      2 anos
                    </button>
                    <button
                      type="button"
                      onClick={() => setFiltroHistoricoPeriodo('3_anos')}
                      className={`px-2.5 py-1 rounded-lg font-semibold text-[11px] transition-colors ${
                        filtroHistoricoPeriodo === '3_anos' ? 'bg-white text-blue-700 shadow-2xs font-bold' : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      3 anos
                    </button>
                  </div>
                </div>

                {/* Filtro Ocorrência: intimada, notificada, autuada, todos */}
                <div className="flex items-center space-x-2">
                  <span className="font-bold text-slate-700 flex items-center space-x-1">
                    <Filter className="w-3.5 h-3.5 text-blue-600" />
                    <span>Ocorrência:</span>
                  </span>
                  <select
                    value={filtroHistoricoTipo}
                    onChange={(e) => setFiltroHistoricoTipo(e.target.value as any)}
                    className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:bg-white text-xs"
                  >
                    <option value="todos">Todas as Inspeções</option>
                    <option value="intimada">Apenas Intimada</option>
                    <option value="notificada">Apenas Notificada</option>
                    <option value="autuada">Apenas Autuada (Auto de Infração)</option>
                    <option value="regular">Apenas Conforme / Regular</option>
                  </select>
                </div>
              </div>

              {/* List or Selected Preview */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* List */}
                <div className="space-y-2.5">
                  {termosFiltrados.length === 0 ? (
                    <div className="bg-white rounded-2xl p-8 border border-slate-200 text-center text-xs text-slate-500">
                      <FileText className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                      <p className="font-bold text-slate-700">Nenhum termo encontrado para os filtros selecionados.</p>
                      <p className="text-[11px] mt-0.5">Altere o período ou o filtro de ocorrência.</p>
                    </div>
                  ) : (
                    termosFiltrados.map(termo => (
                      <div
                        key={termo.id}
                        onClick={() => setSelectedTermoParaVisualizar(termo)}
                        className={`p-4 rounded-xl border transition-all cursor-pointer ${
                          selectedTermoParaVisualizar?.id === termo.id 
                            ? 'bg-blue-50/70 border-blue-400 ring-2 ring-blue-200 shadow-xs' 
                            : 'bg-white border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-mono font-black text-sm text-blue-700">
                            {termo.numeroTermo}
                          </span>
                          <span className="text-[11px] text-slate-500 font-mono">
                            {termo.dataHora}
                          </span>
                        </div>

                        <div className="mt-1 text-xs text-slate-700 flex flex-wrap items-center gap-1.5">
                          <span className="font-bold">{termo.empresaNome}</span>
                          <span className="text-slate-300">•</span>
                          <span>Fiscal: {termo.fiscalNome}</span>
                        </div>

                        <div className="mt-2 flex flex-wrap items-center gap-2">
                          {termo.autoInfracaoGerado ? (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800">
                              Auto de Infração: {termo.numeroAutoInfracao}
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                              Sem Auto de Infração
                            </span>
                          )}

                          {termo.notificacaoAtiva && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
                              Notificado
                            </span>
                          )}

                          {termo.intimacaoAtiva && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800">
                              Intimado
                            </span>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Preview Document Panel */}
                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs">
                  {selectedTermoParaVisualizar ? (
                    <div className="space-y-4 text-xs">
                      <div className="border-b border-slate-200 pb-3 flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <span className="font-mono font-bold text-xs text-blue-700">
                            {selectedTermoParaVisualizar.numeroTermo}
                          </span>
                          <h3 className="font-black text-slate-900 text-sm">
                            Termo de Inspeção e Visita Fiscal
                          </h3>
                        </div>

                        <div className="flex items-center space-x-1.5">
                          {/* Botão Imprimir corrigido com template oficial e iframe */}
                          <button
                            type="button"
                            onClick={() => printTermoFiscalizacao(selectedTermoParaVisualizar, council)}
                            className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold flex items-center space-x-1 transition-colors cursor-pointer"
                            title="Imprimir Termo em papel ou salvar PDF via navegador"
                          >
                            <Printer className="w-3.5 h-3.5 text-blue-600" />
                            <span>Imprimir</span>
                          </button>

                          {/* Botão Transformar em PDF e Enviar por E-mail */}
                          <button
                            type="button"
                            onClick={() => {
                              setTermoParaEmail(selectedTermoParaVisualizar);
                              setIsEmailModalOpen(true);
                            }}
                            className="px-2.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold flex items-center space-x-1 shadow-2xs transition-colors cursor-pointer"
                            title="Gerar PDF oficial e enviar por e-mail para RT e empresa"
                          >
                            <Mail className="w-3.5 h-3.5" />
                            <span>PDF / E-mail</span>
                          </button>
                        </div>
                      </div>

                      <div className="space-y-2 bg-slate-50 p-3 rounded-xl border border-slate-200 font-mono text-[11px]">
                        <div><strong>Estabelecimento:</strong> {selectedTermoParaVisualizar.empresaNome}</div>
                        <div><strong>CNPJ:</strong> {selectedTermoParaVisualizar.cnpj}</div>
                        <div><strong>Inscrição CRF:</strong> {selectedTermoParaVisualizar.empresaInscricao}</div>
                        <div><strong>Data/Hora:</strong> {selectedTermoParaVisualizar.dataHora}</div>
                        <div><strong>Localização:</strong> Lat: {selectedTermoParaVisualizar.latitude}, Lng: {selectedTermoParaVisualizar.longitude}</div>
                        <div><strong>Fiscal:</strong> {selectedTermoParaVisualizar.fiscalNome} ({selectedTermoParaVisualizar.fiscalMatricula})</div>
                      </div>

                      {selectedTermoParaVisualizar.observacao && (
                        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-slate-800 text-xs">
                          <strong className="block mb-1 text-slate-900 font-bold">Relato Fiscal / Observações:</strong>
                          <div className="whitespace-pre-wrap leading-relaxed text-slate-700 font-sans">{selectedTermoParaVisualizar.observacao}</div>
                        </div>
                      )}

                      {selectedTermoParaVisualizar.notificacaoAtiva && (
                        <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-900 text-xs">
                          <strong className="block mb-1 font-bold">Notificação Regulamentar:</strong>
                          <div className="whitespace-pre-wrap leading-relaxed text-amber-950 font-sans">{selectedTermoParaVisualizar.notificacaoTexto}</div>
                        </div>
                      )}

                      {selectedTermoParaVisualizar.autoInfracaoGerado && (
                        <div className="p-3 bg-rose-50 rounded-xl border border-rose-200 text-rose-900 text-xs">
                          <strong className="text-rose-800">Auto de Infração nº {selectedTermoParaVisualizar.numeroAutoInfracao}:</strong>
                          <ul className="mt-1 list-disc list-inside space-y-0.5">
                            {selectedTermoParaVisualizar.infracoesIdentificadas?.map((inf, idx) => (
                              <li key={idx}>{inf}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {selectedTermoParaVisualizar.assinaturaEstabelecimento && (
                        <div className="border border-slate-200 rounded-xl p-3 bg-white">
                          <span className="text-[11px] text-slate-500 block mb-1">Assinatura do Notificado:</span>
                          <img 
                            src={selectedTermoParaVisualizar.assinaturaEstabelecimento} 
                            alt="Assinatura" 
                            className="h-16 object-contain"
                          />
                          <span className="text-[10px] text-slate-400 block mt-1 font-mono">
                            {selectedTermoParaVisualizar.atendenteNome} ({selectedTermoParaVisualizar.atendenteCargo})
                          </span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="h-64 flex flex-col items-center justify-center text-slate-400 text-xs">
                      <FileText className="w-10 h-10 mb-2 text-slate-300" />
                      <span>Selecione um termo na lista ao lado para visualizar os detalhes.</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })()}

        {/* ======================================================================= */}
        {/* SCREEN: INFORMAÇÃO DO LOTE (SCREEN 15) */}
        {/* ======================================================================= */}
        {currentScreen === 'info_lote' && (
          <div className="flex-1 flex flex-col space-y-4 max-w-3xl mx-auto w-full animate-in fade-in duration-150">
            <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => setCurrentScreen('menu')}
                  className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <div>
                  <h2 className="text-lg font-black text-slate-900">
                    Importar Estabelecimentos Offline
                  </h2>
                  <p className="text-xs text-slate-500">
                    Baixe estabelecimentos para o SQLite do tablet usando filtros de cidade e zona para operação sem internet
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-5 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Filtrar por Município / Cidade:</label>
                  <select 
                    value={filtroCidade}
                    onChange={(e) => setFiltroCidade(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800"
                  >
                    <option value="Canutama">Canutama</option>
                    <option value="Manaus">Manaus</option>
                    <option value="Manacapuru">Manacapuru</option>
                    <option value="todos">Todos os Municípios</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Filtrar por Zona / Rota:</label>
                  <select 
                    value={filtroRota}
                    onChange={(e) => setFiltroRota(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800"
                  >
                    <option value="Canutama">Canutama (Polo Purus)</option>
                    <option value="Manaus - Centro">Manaus - Centro</option>
                    <option value="Manaus - Zona Leste">Manaus - Zona Leste</option>
                    <option value="todos">Todas as Rotas</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <button
                  onClick={() => {
                    toastService.success(
                      'Lote Baixado com Sucesso',
                      `Foram baixados ${filteredEmpresas.length} estabelecimentos para o SQLite/IndexedDB do tablet para operação offline na rota ${filtroRota}.`
                    );
                  }}
                  className="flex-1 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-black flex items-center justify-center space-x-2 shadow-sm transition-colors cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Baixar Estabelecimentos para SQLite (Offline)</span>
                </button>

                <button
                  onClick={() => {
                    toastService.success(
                      'Atualizar Lote',
                      'Verificando atualizações de cadastros e RTs no servidor central em segundo plano... Banco local atualizado!'
                    );
                  }}
                  className="py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black flex items-center justify-center space-x-2 shadow-sm transition-colors cursor-pointer"
                  title="Atualizar lote de estabelecimentos e profissionais"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>Atualizar Lote</span>
                </button>
              </div>

              <div className="border border-slate-200 rounded-xl overflow-hidden mt-2">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                    <tr>
                      <th className="py-2 px-3">Inscrição</th>
                      <th className="py-2 px-3">Nome Fantasia</th>
                      <th className="py-2 px-3">Município / Rota</th>
                      <th className="py-2 px-3 text-right">Status Offline</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700 font-mono">
                    {filteredEmpresas.slice(0, 9).map(e => (
                      <tr key={e.id}>
                        <td className="py-2 px-3 font-bold text-blue-700">{e.inscricao}</td>
                        <td className="py-2 px-3 font-sans font-semibold text-slate-900">{e.nomeFantasia}</td>
                        <td className="py-2 px-3 font-sans text-slate-500">{e.cidade} / {filtroRota}</td>
                        <td className="py-2 px-3 text-right font-sans">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700">
                            Disponível Offline
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <button
                onClick={() => setCurrentScreen('estabelecimentos')}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-colors"
              >
                Ir para Lista de Fiscalização
              </button>
            </div>
          </div>
        )}

        {/* ======================================================================= */}
        {/* SCREEN: SINCRONIZAÇÃO (SCREEN 15) */}
        {/* ======================================================================= */}
        {currentScreen === 'sincronizacao' && (
          <div className="flex-1 flex flex-col space-y-4 max-w-3xl mx-auto w-full animate-in fade-in duration-150">
            <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => setCurrentScreen('menu')}
                  className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <div>
                  <h2 className="text-lg font-black text-slate-900">
                    Sincronização com o Servidor
                  </h2>
                  <p className="text-xs text-slate-500">
                    Transmissão de autos de fiscalização e download de atualizações
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-5 text-xs">
              <div className="flex items-center justify-between p-4 bg-slate-50 border border-slate-200 rounded-xl">
                <div className="flex items-center space-x-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    network.isOnline ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                  }`}>
                    {network.isOnline ? <Wifi className="w-5 h-5" /> : <WifiOff className="w-5 h-5" />}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900">
                      Conexão com os Servidores Centrais
                    </h3>
                    <p className="text-slate-500 text-[11px]">
                      {network.isOnline ? 'Online e sincronizado com o banco PostgreSQL/Supabase.' : 'Dispositivo desconectado da internet.'}
                    </p>
                  </div>
                </div>

                <span className="font-mono font-bold text-xs bg-white px-2.5 py-1 rounded border border-slate-300">
                  {network.queueSize} termos na fila
                </span>
              </div>

              <div className="space-y-3">
                <button
                  onClick={() => {
                    const synced = storageService.syncOfflineQueue();
                    toastService.success(
                      'Sincronização Concluída',
                      `${synced} termos enviados e banco local atualizado com sucesso!`
                    );
                  }}
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black flex items-center justify-center space-x-2 shadow-sm transition-colors cursor-pointer"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>Sincronizar Termos Pendentes Agora</span>
                </button>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* Modal de Download em PDF e Envio por E-mail */}
      <ModalEnviarTermoEmail
        isOpen={isEmailModalOpen}
        onClose={() => {
          setIsEmailModalOpen(false);
          setTermoParaEmail(null);
        }}
        termo={termoParaEmail}
        empresa={selectedEmpresa}
      />
    </div>
  );
};
