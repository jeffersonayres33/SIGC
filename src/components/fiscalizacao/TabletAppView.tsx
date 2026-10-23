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
  Maximize2
} from 'lucide-react';
import { TermoFiscalizacao, Empresa, Profissional } from '../../types';
import { storageService } from '../../services/storageService';
import { toastService } from '../../services/toastService';

interface TabletAppViewProps {
  onSwitchToWebAdmin: () => void;
  onOpenSqlModal: () => void;
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
  onOpenSqlModal
}) => {
  const council = storageService.getCouncilConfig();
  const authUser = storageService.getCurrentAuthUser();

  // Screen State
  const [currentScreen, setCurrentScreen] = useState<TabletScreen>('menu');
  const [selectedEmpresa, setSelectedEmpresa] = useState<Empresa | null>(null);
  const [selectedTermoParaVisualizar, setSelectedTermoParaVisualizar] = useState<TermoFiscalizacao | null>(null);

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
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);

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

  // Atendente (Screen 9)
  const [atendenteCargo, setAtendenteCargo] = useState('Farmacêutico Responsável Técnico');
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

  // Toggle handlers for Notificação and Intimação com geração de número sequencial único anti-duplicidade
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
    }
  };

  const handleToggleIntimacao = (checked: boolean) => {
    setIntimacaoAtiva(checked);
    if (checked && !numeroIntimacao) {
      const num = storageService.getNextNumeroIntimacao();
      setNumeroIntimacao(num);
    }
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

    if (!recusouAssinar && !signatureNotificadoUrl) {
      toastService.warning('Assinatura Pendente', 'Solicite a assinatura do atendente ou marque "Recusou-se a assinar".');
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
      assinaturaNotificado: signatureNotificadoUrl || undefined,
      assinaturaEstabelecimento: signatureNotificadoUrl || undefined,
      assinaturaEstabelecimentoDataHora: signatureNotificadoUrl ? `${agora.toLocaleDateString('pt-BR')} ${agora.toLocaleTimeString('pt-BR')}` : undefined,
      tipoSignatarioNotificado: atendenteCargo as any,
      nomeSignatarioNotificado: atendenteNome,
      documentoSignatarioNotificado: atendenteCpf || atendenteRg,
      recusaAssinatura: recusouAssinar,

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

    // Show preview of created term
    setSelectedTermoParaVisualizar(novoTermo);
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
      <div className="bg-slate-900 text-slate-100 px-4 py-2 border-b border-slate-800 flex items-center justify-between text-xs shadow-md">
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-1.5 bg-blue-900/60 text-blue-300 px-2 py-0.5 rounded-lg border border-blue-700/50">
            <Tablet className="w-3.5 h-3.5 text-blue-400" />
            <span className="font-extrabold tracking-wide">FEM TABLET</span>
          </div>
          <span className="text-slate-600">|</span>
          <span className="font-bold text-slate-300">{council.sigla} - Fiscalização de Campo</span>
          <span className="hidden md:inline text-slate-500">•</span>
          <span className="hidden md:inline text-slate-400">Rota: <strong className="text-emerald-400">{filtroRota}</strong></span>
        </div>

        {/* Center / Right Tablet Indicators */}
        <div className="flex items-center space-x-3 sm:space-x-4">
          {/* GPS Coordinates Indicator */}
          <button 
            onClick={handleCaptureGPS}
            className="flex items-center space-x-1 bg-slate-800 hover:bg-slate-700 text-slate-300 px-2 py-0.5 rounded text-[11px] transition-colors"
            title="Atualizar Coordenadas GPS"
          >
            <MapPin className={`w-3 h-3 ${isGettingGps ? 'animate-bounce text-amber-400' : 'text-emerald-400'}`} />
            <span className="font-mono">{gpsCoords ? `${gpsCoords.lat}, ${gpsCoords.lng}` : 'Sem GPS'}</span>
          </button>

          {/* Network status */}
          <div className={`flex items-center space-x-1 px-2 py-0.5 rounded text-[11px] font-bold ${
            network.isOnline ? 'bg-emerald-950 text-emerald-300 border border-emerald-700' : 'bg-rose-950 text-rose-300 border border-rose-700 animate-pulse'
          }`}>
            {network.isOnline ? <Wifi className="w-3 h-3 text-emerald-400" /> : <WifiOff className="w-3 h-3 text-rose-400" />}
            <span>{network.isOnline ? 'Online' : 'Offline'}</span>
          </div>

          {/* Battery & Time */}
          <div className="flex items-center space-x-2 text-slate-300 font-mono text-[11px]">
            <span className="flex items-center"><BatteryCharging className="w-3.5 h-3.5 mr-0.5 text-emerald-400" /> {batteryLevel}</span>
            <span className="text-slate-600">•</span>
            <span className="font-bold">{currentTime}</span>
          </div>

          {/* Web Admin View Switcher */}
          <button
            onClick={onSwitchToWebAdmin}
            className="hidden sm:flex items-center space-x-1 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-blue-300 hover:text-blue-200 rounded-lg text-xs font-semibold border border-slate-700 transition-colors cursor-pointer"
            title="Alternar para Visão Administrativa Desktop"
          >
            <ExternalLink className="w-3 h-3" />
            <span>Gestão Web</span>
          </button>

          {/* SQL Database Modal Trigger */}
          <button
            onClick={onOpenSqlModal}
            className="flex items-center space-x-1 px-2.5 py-1 bg-purple-900/80 hover:bg-purple-800 text-purple-200 rounded-lg text-xs font-bold border border-purple-700 transition-colors cursor-pointer"
            title="Visualizar e Copiar Script SQL do Banco de Dados"
          >
            <span>Script SQL</span>
          </button>
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
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm mb-6 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 rounded-2xl bg-blue-50 border border-blue-200 p-2 flex items-center justify-center shadow-xs">
                  <img 
                    src="/public/assets/aistudio/Gemini_Generated_Image_ftnohaftnohaftno_8f366e0b.jpeg" 
                    alt="SIGCON Gear" 
                    className="w-full h-full object-contain"
                  />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase bg-blue-100 text-blue-800 tracking-wider">
                      Módulo Fiscal de Campo
                    </span>
                    <span className="text-slate-400 text-xs">•</span>
                    <span className="text-xs font-semibold text-slate-500">Android / Tablet Offline</span>
                  </div>
                  <h1 className="text-2xl font-black text-slate-900 tracking-tight mt-0.5">
                    Fiscalização Eletrônica
                  </h1>
                  <p className="text-sm text-slate-500">
                    {council.sigla} — {council.nomeCompleto}
                  </p>
                </div>
              </div>

              {/* Fiscal Logado Card */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-right sm:min-w-56">
                <div className="text-[11px] text-slate-500 uppercase tracking-wider font-semibold">Fiscal Autuante</div>
                <div className="font-bold text-sm text-slate-900">{authUser?.nome || 'Dr. Marcelo Queiroz'}</div>
                <div className="text-xs text-blue-700 font-mono font-semibold">Matrícula: {(authUser as any)?.matricula || 'MAT-402'}</div>
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

              {/* Card 3: Informação Lote */}
              <button
                onClick={() => setCurrentScreen('info_lote')}
                className="group bg-white hover:bg-purple-50/50 border-2 border-slate-200 hover:border-purple-500 rounded-2xl p-6 sm:p-8 flex flex-col items-center text-center transition-all shadow-sm hover:shadow-md cursor-pointer"
              >
                <div className="w-20 h-20 rounded-2xl bg-purple-100 group-hover:bg-purple-600 text-purple-700 group-hover:text-white flex items-center justify-center transition-colors mb-4 shadow-xs">
                  <Layers className="w-10 h-10" />
                </div>
                <h2 className="text-xl font-black text-slate-900 group-hover:text-purple-900">
                  Informação Lote
                </h2>
                <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                  Detalhes do pacote de dados baixado para o tablet, municípios e quantidade de farmácias na rota.
                </p>
                <div className="mt-5 inline-flex items-center space-x-1.5 px-4 py-1.5 rounded-full bg-purple-50 group-hover:bg-purple-600 text-purple-700 group-hover:text-white font-bold text-xs transition-colors">
                  <span>Ver Lote Canutama</span>
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
                      Estabelecimentos da Rota
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

                  {/* Filter Trigger Button (Screen 1, 2, 5) */}
                  <button
                    onClick={() => setIsFilterModalOpen(true)}
                    className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-slate-700 border border-slate-200 text-xs font-bold flex items-center space-x-1.5 transition-colors cursor-pointer"
                    title="Abrir Filtros Avançados"
                  >
                    <Filter className="w-3.5 h-3.5 text-blue-600" />
                    <span>Filtros</span>
                  </button>
                </div>
              </div>
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
                        setCurrentScreen('ficha_estabelecimento');
                      }}
                      className="bg-white hover:bg-blue-50/40 border border-slate-200 hover:border-blue-400 rounded-xl p-3.5 shadow-2xs hover:shadow-sm transition-all cursor-pointer flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                    >
                      <div className="flex items-start space-x-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 font-mono font-bold text-xs ${
                          fiscalizadoHoje 
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' 
                            : 'bg-blue-50 text-blue-700 border border-blue-200'
                        }`}>
                          {emp.inscricao.slice(0, 4)}
                        </div>

                        <div>
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="font-mono text-xs font-bold text-slate-500">
                              {emp.inscricao}
                            </span>
                            <span className="text-slate-300">•</span>
                            <h3 className="font-black text-sm text-slate-900 hover:text-blue-600">
                              {emp.nomeFantasia}
                            </h3>

                            {fiscalizadoHoje && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                                <Check className="w-3 h-3 mr-1" /> Fiscalizada Hoje
                              </span>
                            )}

                            {temAuto && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-300">
                                <AlertOctagon className="w-3 h-3 mr-1" /> Autuado
                              </span>
                            )}
                          </div>

                          <div className="text-xs text-slate-600 mt-0.5 flex flex-wrap items-center gap-2">
                            <span>{emp.razaoSocial}</span>
                            <span className="text-slate-300">•</span>
                            <span className="font-mono text-slate-500">CNPJ: {emp.cnpj}</span>
                          </div>

                          <div className="text-[11px] text-slate-500 mt-1 flex flex-wrap items-center gap-2">
                            <span className="flex items-center"><MapPin className="w-3 h-3 mr-0.5 text-slate-400" /> {emp.endereco || 'Centro'}, {emp.bairro || 'Centro'} - {emp.cidade}</span>
                            <span className="text-slate-300">•</span>
                            <span>RT: <strong className="text-slate-700">{emp.responsavelTecnico || 'Não averbado'}</strong></span>
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
            <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => setCurrentScreen('estabelecimentos')}
                  className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
                  title="Voltar à lista"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                      Inscrição: {selectedEmpresa.inscricao}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                      selectedEmpresa.condicao === 'Regular' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                    }`}>
                      {selectedEmpresa.condicao || 'Regular'}
                    </span>
                  </div>
                  <h1 className="text-xl font-black text-slate-900 tracking-tight mt-0.5">
                    {selectedEmpresa.nomeFantasia}
                  </h1>
                </div>
              </div>

              {/* Primary Action: Novo Termo de Inspeção */}
              <button
                onClick={() => setCurrentScreen('novo_termo')}
                className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-extrabold flex items-center space-x-2 shadow-xs transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>+ Iniciar Termo de Inspeção</span>
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
                      Averbado
                    </span>
                  </h2>

                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-800 font-bold flex items-center justify-center text-xs">
                        RT
                      </div>
                      <div>
                        <h3 className="font-black text-xs text-slate-900">
                          {selectedEmpresa.responsavelTecnico || 'ANA KERCIA OLIVEIRA MENDES'}
                        </h3>
                        <p className="font-mono text-[11px] text-blue-700 font-bold">
                          {selectedEmpresa.crfResponsavel || 'CRF-AM 4821'}
                        </p>
                        <p className="text-[10px] text-slate-500 uppercase font-semibold">
                          DIRETOR TÉCNICO • 44H SEMANAIS
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => setCurrentScreen('ficha_rt')}
                      className="mt-3 w-full py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-lg text-xs font-bold flex items-center justify-center space-x-1 transition-colors"
                    >
                      <Eye className="w-3.5 h-3.5 text-slate-500" />
                      <span>Ver Ficha e Horários do RT</span>
                    </button>
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
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
              <div className="flex items-center space-x-4 border-b border-slate-100 pb-5">
                <div className="w-16 h-16 rounded-2xl bg-blue-100 text-blue-700 font-extrabold text-xl flex items-center justify-center border border-blue-200">
                  AK
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                      REGULAR / ATIVO
                    </span>
                    <span className="text-xs text-slate-400">•</span>
                    <span className="text-xs font-mono font-bold text-blue-700">
                      CRF-AM 4821
                    </span>
                  </div>
                  <h1 className="text-xl font-black text-slate-900 mt-0.5">
                    ANA KERCIA OLIVEIRA MENDES
                  </h1>
                  <p className="text-xs text-slate-500 font-medium">
                    Farmacêutica • DIRETOR TÉCNICO • Carga Horária: 44 horas semanais
                  </p>
                </div>
              </div>

              {/* Weekly Working Hours Table (Screen 11) */}
              <div>
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center">
                  <Clock className="w-4 h-4 mr-1.5 text-blue-600" />
                  Horário de Assistência Técnica Declarado pelo Farmacêutico
                </h3>

                <div className="overflow-hidden border border-slate-200 rounded-xl">
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
                      <tr>
                        <td className="py-2 px-3 font-sans font-semibold text-slate-900">Segunda-feira</td>
                        <td className="py-2 px-3">08:00 - 12:00</td>
                        <td className="py-2 px-3">14:00 - 18:00</td>
                        <td className="py-2 px-3 text-right font-bold text-blue-700">8h</td>
                      </tr>
                      <tr>
                        <td className="py-2 px-3 font-sans font-semibold text-slate-900">Terça-feira</td>
                        <td className="py-2 px-3">08:00 - 12:00</td>
                        <td className="py-2 px-3">14:00 - 18:00</td>
                        <td className="py-2 px-3 text-right font-bold text-blue-700">8h</td>
                      </tr>
                      <tr>
                        <td className="py-2 px-3 font-sans font-semibold text-slate-900">Quarta-feira</td>
                        <td className="py-2 px-3">08:00 - 12:00</td>
                        <td className="py-2 px-3">14:00 - 18:00</td>
                        <td className="py-2 px-3 text-right font-bold text-blue-700">8h</td>
                      </tr>
                      <tr>
                        <td className="py-2 px-3 font-sans font-semibold text-slate-900">Quinta-feira</td>
                        <td className="py-2 px-3">08:00 - 12:00</td>
                        <td className="py-2 px-3">14:00 - 18:00</td>
                        <td className="py-2 px-3 text-right font-bold text-blue-700">8h</td>
                      </tr>
                      <tr>
                        <td className="py-2 px-3 font-sans font-semibold text-slate-900">Sexta-feira</td>
                        <td className="py-2 px-3">08:00 - 12:00</td>
                        <td className="py-2 px-3">14:00 - 18:00</td>
                        <td className="py-2 px-3 text-right font-bold text-blue-700">8h</td>
                      </tr>
                      <tr>
                        <td className="py-2 px-3 font-sans font-semibold text-slate-900">Sábado</td>
                        <td className="py-2 px-3">08:00 - 12:00</td>
                        <td className="py-2 px-3 text-slate-400">---</td>
                        <td className="py-2 px-3 text-right font-bold text-blue-700">4h</td>
                      </tr>
                      <tr className="bg-slate-50 text-slate-400">
                        <td className="py-2 px-3 font-sans font-semibold">Domingo</td>
                        <td className="py-2 px-3">Folga</td>
                        <td className="py-2 px-3">Folga</td>
                        <td className="py-2 px-3 text-right">0h</td>
                      </tr>
                    </tbody>
                    <tfoot className="bg-blue-50 font-bold text-blue-900 border-t border-blue-200">
                      <tr>
                        <td colSpan={3} className="py-2 px-3 font-sans">Carga Horária Semanal Total</td>
                        <td className="py-2 px-3 text-right font-mono">44 horas</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              {/* Botão de Retorno */}
              <button
                onClick={() => setCurrentScreen('ficha_estabelecimento')}
                className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors"
              >
                Voltar para Ficha do Estabelecimento
              </button>
            </div>
          </div>
        )}

        {/* ======================================================================= */}
        {/* SCREEN: NOVO TERMO DE INSPEÇÃO (SCREENS 3, 4, 6, 7, 8, 9) */}
        {/* ======================================================================= */}
        {currentScreen === 'novo_termo' && selectedEmpresa && (
          <div className="flex-1 flex flex-col space-y-4 max-w-4xl mx-auto w-full pb-10 animate-in fade-in duration-150">
            {/* Header da Lavratura do Termo */}
            <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => setCurrentScreen('ficha_estabelecimento')}
                  className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
                  title="Cancelar e Voltar"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                      {selectedEmpresa.inscricao}
                    </span>
                    <span className="text-xs text-slate-400">•</span>
                    <span className="text-xs text-slate-600 font-mono">CNPJ: {selectedEmpresa.cnpj}</span>
                  </div>
                  <h1 className="text-lg font-black text-slate-900 mt-0.5">
                    {selectedEmpresa.nomeFantasia}
                  </h1>
                </div>
              </div>

              {/* GPS Coordenadas & Fiscal */}
              <div className="text-right text-xs">
                <div className="font-bold text-slate-800">{authUser?.nome || 'Dr. Marcelo Queiroz'}</div>
                <div className="text-[11px] font-mono text-emerald-700 flex items-center justify-end space-x-1">
                  <MapPin className="w-3 h-3 text-emerald-600" />
                  <span>{gpsCoords ? `${gpsCoords.lat}, ${gpsCoords.lng}` : 'Coordenadas locais'}</span>
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
                  <div className="flex items-center justify-between text-[11px] text-amber-800 font-medium">
                    <span>Texto regulatório oficial (configurável no Painel do Administrador):</span>
                    {numeroNotificacao && (
                      <span className="font-mono font-bold bg-white px-2 py-0.5 rounded border border-amber-200">
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
            <div className={`rounded-2xl border p-5 transition-colors shadow-2xs ${
              autuacaoAtiva ? 'bg-rose-50/40 border-rose-300' : 'bg-white border-slate-200'
            }`}>
              <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-3">
                <div className="flex items-center space-x-2">
                  <span className="w-5 h-5 rounded-full bg-rose-100 text-rose-700 font-bold flex items-center justify-center text-[10px]">4</span>
                  <h2 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Auto de Infração (Autuação)
                  </h2>
                </div>

                <div className="flex items-center space-x-3">
                  <button
                    type="button"
                    onClick={() => {
                      setHorariosVagosVerificados(true);
                      toastService.info(
                        'Verificação de Horários Vagos',
                        'Escala verificada: Farmácia aberta sem RT cobrindo o intervalo atual (Art. 24 da Lei 3820/60).'
                      );
                    }}
                    className="px-2.5 py-1 bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 rounded-lg text-xs font-bold flex items-center space-x-1"
                  >
                    <Clock className="w-3.5 h-3.5 text-blue-600" />
                    <span>Verificar Horários Vagos</span>
                  </button>

                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={autuacaoAtiva}
                      onChange={(e) => setAutuacaoAtiva(e.target.checked)}
                      className="w-4 h-4 text-rose-600 rounded border-slate-300 focus:ring-rose-500"
                    />
                    <span className="text-xs font-bold text-rose-900">Lavrar Auto de Infração</span>
                  </label>
                </div>
              </div>

              {horariosVagosVerificados && (
                <div className="mb-3 p-2.5 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-900 flex items-center justify-between">
                  <span>Horário Oficial: <strong>07h00 às 21h00</strong>. Horário RT: <strong>08h às 12h / 14h às 18h</strong>. Intervalo desassistido constatado.</span>
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
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
                <div className="flex items-center space-x-2">
                  {/* Ícone 1: Preencher com dados do Farmacêutico RT Titular Selecionado */}
                  <button
                    type="button"
                    onClick={handlePreencherComDadosRt}
                    className="px-2.5 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-xs font-bold flex items-center space-x-1.5 transition-colors cursor-pointer"
                    title="Preencher todos os campos com os dados do Farmacêutico RT Titular Selecionado"
                  >
                    <UserCheck className="w-3.5 h-3.5 text-blue-600" />
                    <span className="text-[11px]">Puxar RT Titular</span>
                  </button>

                  {/* Ícone 2: Limpar dados */}
                  <button
                    type="button"
                    onClick={handleLimparDadosAtendente}
                    className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-rose-50 hover:text-rose-700 text-slate-600 border border-slate-200 text-xs font-bold flex items-center space-x-1.5 transition-colors cursor-pointer"
                    title="Limpar campos: Nome completo, RG, CPF e Inscrição"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-rose-600" />
                    <span className="text-[11px]">Limpar Campos</span>
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
                    <option value="Farmacêutico Responsável Técnico">Farmacêutico RT</option>
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

                {/* NOVO CAMPO: NÚMERO DE INSCRIÇÃO DO PROFISSIONAL */}
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
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <div className="flex items-center space-x-2">
                  <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-[10px]">6</span>
                  <h2 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Assinaturas Digitais na Tela do Tablet
                  </h2>
                </div>

                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={recusouAssinar}
                    onChange={(e) => setRecusouAssinar(e.target.checked)}
                    className="w-4 h-4 text-rose-600 rounded border-slate-300"
                  />
                  <span className="text-xs font-bold text-rose-700">Recusou-se a assinar</span>
                </label>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* 1. Assinatura do Notificado / Estabelecimento */}
                <div className="border border-slate-200 rounded-xl p-3 bg-slate-50 flex flex-col justify-between">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-slate-800">
                      Assinatura do Notificado ({atendenteCargo})
                    </span>
                    <button
                      type="button"
                      onClick={clearCanvasNotificado}
                      className="text-[11px] text-rose-600 hover:text-rose-800 font-bold flex items-center space-x-1"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>Limpar</span>
                    </button>
                  </div>

                  {recusouAssinar ? (
                    <div className="h-32 border-2 border-dashed border-rose-300 rounded-lg bg-rose-50 flex items-center justify-center text-xs text-rose-700 font-bold p-3 text-center">
                      Notificado recusou-se a apor sua assinatura na tela deste dispositivo tablet. Lavrado com 2 testemunhas conforme previsão legal.
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
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-slate-300 text-xs font-bold">
                          Desenhe a assinatura com a caneta ou dedo
                        </div>
                      )}
                    </div>
                  )}
                  <span className="text-[10px] text-slate-400 mt-1.5 block">
                    {atendenteNome || 'Representante do Estabelecimento'}
                  </span>
                </div>

                {/* 2. Assinatura do Fiscal Autuante */}
                <div className="border border-slate-200 rounded-xl p-3 bg-slate-50 flex flex-col justify-between">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-slate-800">
                      Assinatura do Fiscal do Conselho
                    </span>
                    <button
                      type="button"
                      onClick={clearCanvasFiscal}
                      className="text-[11px] text-rose-600 hover:text-rose-800 font-bold flex items-center space-x-1"
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
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-slate-300 text-xs font-bold">
                        Assinatura digital do fiscal
                      </div>
                    )}
                  </div>
                  <span className="text-[10px] text-slate-400 mt-1.5 block">
                    {authUser?.nome || 'Dr. Marcelo Queiroz'} — Fiscal do {council.sigla}
                  </span>
                </div>
              </div>
            </div>

            {/* BOTÕES DE GRAVAR E CONCLUIR */}
            <div className="flex items-center justify-end space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setCurrentScreen('ficha_estabelecimento')}
                className="px-4 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={handleSalvarTermo}
                className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-black shadow-md flex items-center space-x-2 transition-all cursor-pointer"
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
        {currentScreen === 'historico_termos' && (
          <div className="flex-1 flex flex-col space-y-4 animate-in fade-in duration-150">
            {/* Top Bar */}
            <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => setCurrentScreen('ficha_estabelecimento')}
                  className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <div>
                  <h2 className="text-lg font-black text-slate-900">
                    Termos Lavrados
                  </h2>
                  <p className="text-xs text-slate-500">
                    {selectedEmpresa ? selectedEmpresa.nomeFantasia : 'Todos os Estabelecimentos'}
                  </p>
                </div>
              </div>

              {selectedEmpresa && (
                <button
                  onClick={() => setCurrentScreen('novo_termo')}
                  className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>Novo Termo</span>
                </button>
              )}
            </div>

            {/* List or Selected Preview */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* List */}
              <div className="space-y-2.5">
                {termosDaEmpresa.length === 0 ? (
                  <div className="bg-white rounded-xl p-8 border border-slate-200 text-center text-xs text-slate-500">
                    Nenhum termo cadastrado.
                  </div>
                ) : (
                  termosDaEmpresa.map(termo => (
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
                    <div className="border-b border-slate-200 pb-3 flex items-center justify-between">
                      <div>
                        <span className="font-mono font-bold text-xs text-blue-700">
                          {selectedTermoParaVisualizar.numeroTermo}
                        </span>
                        <h3 className="font-black text-slate-900 text-sm">
                          Termo de Inspeção e Visita Fiscal
                        </h3>
                      </div>
                      <button
                        onClick={() => window.print()}
                        className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold flex items-center space-x-1"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span>Imprimir</span>
                      </button>
                    </div>

                    <div className="space-y-2 bg-slate-50 p-3 rounded-xl border border-slate-200 font-mono text-[11px]">
                      <div><strong>Estabelecimento:</strong> {selectedTermoParaVisualizar.empresaNome}</div>
                      <div><strong>CNPJ:</strong> {selectedTermoParaVisualizar.cnpj}</div>
                      <div><strong>Inscrição CRF:</strong> {selectedTermoParaVisualizar.empresaInscricao}</div>
                      <div><strong>Data/Hora:</strong> {selectedTermoParaVisualizar.dataHora}</div>
                      <div><strong>Localização:</strong> Lat: {selectedTermoParaVisualizar.latitude}, Lng: {selectedTermoParaVisualizar.longitude}</div>
                      <div><strong>Fiscal:</strong> {selectedTermoParaVisualizar.fiscalNome} ({selectedTermoParaVisualizar.fiscalMatricula})</div>
                    </div>

                    {selectedTermoParaVisualizar.notificacaoAtiva && (
                      <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-900 text-xs">
                        <strong>Notificação Regulamentar:</strong>
                        <p className="mt-1">{selectedTermoParaVisualizar.notificacaoTexto}</p>
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
        )}

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
                    Informações do Lote de Fiscalização
                  </h2>
                  <p className="text-xs text-slate-500">
                    Dados baixados para operação offline no tablet
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  <span className="text-slate-500 block text-[11px]">Município da Rota:</span>
                  <span className="text-sm font-black text-slate-900">Canutama — AM</span>
                  <span className="text-[10px] text-slate-400 block mt-0.5">Polo Purus / Calha Sul</span>
                </div>
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  <span className="text-slate-500 block text-[11px]">Total de Farmácias no Pacote:</span>
                  <span className="text-sm font-black text-blue-700">9 Estabelecimentos</span>
                  <span className="text-[10px] text-emerald-600 block mt-0.5">Cadastros completos baixados</span>
                </div>
              </div>

              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                    <tr>
                      <th className="py-2 px-3">Inscrição</th>
                      <th className="py-2 px-3">Nome Fantasia</th>
                      <th className="py-2 px-3">Bairro</th>
                      <th className="py-2 px-3 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700 font-mono">
                    {filteredEmpresas.slice(0, 9).map(e => (
                      <tr key={e.id}>
                        <td className="py-2 px-3 font-bold text-blue-700">{e.inscricao}</td>
                        <td className="py-2 px-3 font-sans font-semibold text-slate-900">{e.nomeFantasia}</td>
                        <td className="py-2 px-3 font-sans text-slate-500">{e.bairro || 'Centro'}</td>
                        <td className="py-2 px-3 text-right font-sans">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700">
                            Pronto
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

                <button
                  onClick={onOpenSqlModal}
                  className="w-full py-3 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 rounded-xl text-xs font-bold flex items-center justify-center space-x-2 transition-colors cursor-pointer"
                >
                  <FileText className="w-4 h-4 text-purple-600" />
                  <span>Ver Script SQL de Atualização da Base de Dados</span>
                </button>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* ========================================================================= */}
      {/* 3. MODAL DE FILTROS AVANÇADOS (SCREENS 1, 2, 5) */}
      {/* ========================================================================= */}
      {isFilterModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-xl w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-5 py-3.5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Filter className="w-4 h-4 text-blue-600" />
                <h3 className="font-black text-sm text-slate-900">Filtros e Busca Avançada</h3>
              </div>
              <button
                onClick={() => setIsFilterModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto text-xs">
              {/* Ordenação */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">Ordenação:</label>
                <select
                  value={filtroOrdenacao}
                  onChange={(e) => setFiltroOrdenacao(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800"
                >
                  <option value="fantasia">Nome Fantasia</option>
                  <option value="codigo">Código / Inscrição</option>
                  <option value="razao">Razão Social</option>
                  <option value="bairro">Bairro</option>
                  <option value="endereco">Endereço</option>
                </select>
              </div>

              {/* Rota e Cidade */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Rota:</label>
                  <select
                    value={filtroRota}
                    onChange={(e) => setFiltroRota(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800"
                  >
                    <option value="Canutama">Canutama</option>
                    <option value="Manaus - Centro">Manaus - Centro</option>
                    <option value="Manaus - Zona Leste">Manaus - Zona Leste</option>
                    <option value="todos">Todas as Rotas</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Cidade:</label>
                  <select
                    value={filtroCidade}
                    onChange={(e) => setFiltroCidade(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800"
                  >
                    <option value="Canutama">Canutama</option>
                    <option value="Manaus">Manaus</option>
                    <option value="todos">Todas</option>
                  </select>
                </div>
              </div>

              {/* Situação e Fiscalizadas */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Situação:</label>
                  <select
                    value={filtroSituacao}
                    onChange={(e) => setFiltroSituacao(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800"
                  >
                    <option value="todos">Todos</option>
                    <option value="regular">Regular</option>
                    <option value="irregular">Irregular</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Fiscalizadas Hoje:</label>
                  <select
                    value={filtroFiscalizadas}
                    onChange={(e) => setFiltroFiscalizadas(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800"
                  >
                    <option value="todos">Todos</option>
                    <option value="sim">Apenas Fiscalizadas</option>
                    <option value="nao">Não Fiscalizadas</option>
                  </select>
                </div>
              </div>

              {/* Bairro e Endereço */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Bairro:</label>
                  <input
                    type="text"
                    value={filtroBairro}
                    onChange={(e) => setFiltroBairro(e.target.value)}
                    placeholder="Filtrar por bairro"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Endereço:</label>
                  <input
                    type="text"
                    value={filtroEndereco}
                    onChange={(e) => setFiltroEndereco(e.target.value)}
                    placeholder="Filtrar por logradouro"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800"
                  />
                </div>
              </div>
            </div>

            <div className="px-5 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
              <button
                type="button"
                onClick={() => {
                  setFiltroOrdenacao('fantasia');
                  setFiltroSituacao('todos');
                  setFiltroCondicao('todos');
                  setFiltroNatureza('todos');
                  setFiltroBairro('');
                  setFiltroEndereco('');
                  setFiltroFiscalizadas('todos');
                }}
                className="text-xs text-rose-600 font-bold hover:underline"
              >
                Limpar Filtros
              </button>

              <button
                type="button"
                onClick={() => setIsFilterModalOpen(false)}
                className="px-5 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition-colors"
              >
                Aplicar Filtros
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
