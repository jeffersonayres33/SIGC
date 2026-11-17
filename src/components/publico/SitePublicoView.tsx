import React, { useState, useEffect, useRef } from 'react';
import {
  Globe,
  FileText,
  Upload,
  Send,
  CheckCircle2,
  Newspaper,
  Calendar,
  Search,
  ChevronRight,
  ChevronLeft,
  Paperclip,
  X,
  ExternalLink,
  Lock,
  Landmark,
  BookOpen,
  User,
  Star,
  ArrowRight
} from 'lucide-react';
import {
  FormularioDinamico,
  RespostaFormulario,
  SiteNoticia,
  SiteBanner,
  SiteMenuItem,
  SiteConfig
} from '../../types';
import { storageService, CouncilConfig } from '../../services/storageService';
import { toastService } from '../../services/toastService';
import { SIGCON_LOGO } from '../../constants/assets';
import { DynamicFieldRenderer } from '../formularios/DynamicFieldRenderer';
import {
  uploadOriginalFile,
  formatAttachmentSize,
  StoredAttachment
} from '../../services/fileStorageService';

interface SitePublicoViewProps {
  councilConfig?: CouncilConfig;
  onNavigateToPortal?: (view: string) => void;
  onOpenLogin?: () => void;
  onOpenTransparencia?: () => void;
  isStandalonePublic?: boolean;
}

export const SitePublicoView: React.FC<SitePublicoViewProps> = ({
  councilConfig: propCouncilConfig,
  onNavigateToPortal,
  onOpenLogin,
  onOpenTransparencia,
  isStandalonePublic = false
}) => {
  const [activeTab, setActiveTab] = useState<'formularios' | 'noticias'>('formularios');
  const [searchTerm, setSearchTerm] = useState('');
  const [categoriaFilter, setCategoriaFilter] = useState('TODOS');
  const [newsSearchTerm, setNewsSearchTerm] = useState('');
  const [newsPage, setNewsPage] = useState(1);
  const [bannerIndex, setBannerIndex] = useState(0);

  const [councilConfigState, setCouncilConfigState] = useState<CouncilConfig>(() => propCouncilConfig || storageService.getCouncilConfig());
  const [siteConfig, setSiteConfig] = useState<SiteConfig>(() => storageService.getSiteConfig());
  const [noticias, setNoticias] = useState<SiteNoticia[]>(() => storageService.getSiteNoticias(true));
  const [banners, setBanners] = useState<SiteBanner[]>(() => storageService.getSiteBanners(true));
  const [allFormularios, setAllFormularios] = useState<FormularioDinamico[]>(() => storageService.getFormularios());

  const [activeNoticiaModal, setActiveNoticiaModal] = useState<SiteNoticia | null>(null);

  // Estado do modal de preenchimento de formulário
  const [activeFormModal, setActiveFormModal] = useState<FormularioDinamico | null>(null);
  const [formResponses, setFormResponses] = useState<Record<string, any>>({});
  const [anexosSelecionados, setAnexosSelecionados] = useState<StoredAttachment[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [protocoloSucesso, setProtocoloSucesso] = useState<string | null>(null);

  const contentSectionRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const unsub = storageService.subscribe(() => {
      setAllFormularios(storageService.getFormularios());
      setCouncilConfigState(storageService.getCouncilConfig());
      setSiteConfig(storageService.getSiteConfig());
      setNoticias(storageService.getSiteNoticias(true));
      setBanners(storageService.getSiteBanners(true));
    });
    return () => unsub();
  }, []);

  const councilConfig = propCouncilConfig || councilConfigState;

  // Ajuste automático de índice do carrossel de banners
  useEffect(() => {
    if (banners.length === 0) {
      setBannerIndex(0);
      return;
    }
    if (bannerIndex >= banners.length) {
      setBannerIndex(0);
    }
  }, [banners.length, bannerIndex]);

  // Rotação automática do carrossel a cada 6s
  useEffect(() => {
    if (banners.length <= 1) return;
    const timer = setInterval(() => {
      setBannerIndex(prev => (prev + 1) % banners.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [banners.length]);

  const activeMenus = [...(siteConfig.menus || [])]
    .filter(m => m.ativo !== false)
    .sort((a, b) => (a.ordem ?? 0) - (b.ordem ?? 0));

  const hasTransparenciaMenu = activeMenus.some(m => m.url.trim().toLowerCase() === '#transparencia');

  const scrollToContent = () => {
    setTimeout(() => {
      contentSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 50);
  };

  const handleLinkNavigation = (url?: string) => {
    const target = (url || '').trim();
    if (!target) return;

    const lower = target.toLowerCase();
    if (lower === '#transparencia') {
      if (onOpenTransparencia) {
        onOpenTransparencia();
      } else if (onNavigateToPortal) {
        onNavigateToPortal('portal_transparencia');
      } else {
        toastService.info('Portal Transparência', 'Acesse o módulo Portal Transparência pelo menu lateral.');
      }
      return;
    }

    if (lower === '#formularios') {
      setActiveTab('formularios');
      scrollToContent();
      return;
    }

    if (lower === '#noticias') {
      setActiveTab('noticias');
      scrollToContent();
      return;
    }

    if (lower === '#inicio') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
  };

  // Formulários com publicação no site público
  const formulariosPublicos = allFormularios.filter(
    f => f.ativo && (f.publicarSite || f.publicoAlvo === 'Público Geral' || f.publicoAlvo === 'Cidadão' || f.publicoAlvo === 'Ambos')
  );

  const filteredFormularios = formulariosPublicos.filter(f => {
    const matchesSearch =
      f.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.descricao.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCat = categoriaFilter === 'TODOS' || f.categoria === categoriaFilter;
    return matchesSearch && matchesCat;
  });

  // Notícias filtradas + paginação configurável pelo módulo WebSITE
  const filteredNoticias = noticias.filter(n => {
    if (!newsSearchTerm.trim()) return true;
    const q = newsSearchTerm.toLowerCase();
    return (
      n.titulo.toLowerCase().includes(q) ||
      n.resumo.toLowerCase().includes(q) ||
      n.categoria.toLowerCase().includes(q) ||
      n.autor.toLowerCase().includes(q)
    );
  });

  const noticiasPorPagina = Math.max(1, Number(siteConfig.noticiasPorPagina) || 6);
  const totalNewsPages = Math.max(1, Math.ceil(filteredNoticias.length / noticiasPorPagina));

  useEffect(() => {
    if (newsPage > totalNewsPages) {
      setNewsPage(1);
    }
  }, [newsPage, totalNewsPages]);

  const paginatedNoticias = filteredNoticias.slice(
    (newsPage - 1) * noticiasPorPagina,
    newsPage * noticiasPorPagina
  );

  const handleOpenForm = (form: FormularioDinamico) => {
    setActiveFormModal(form);
    setFormResponses({});
    setAnexosSelecionados([]);
    setProtocoloSucesso(null);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const limiteMB = activeFormModal?.tamanhoMaximoMb || councilConfig.tamanhoMaximoAnexoMb || 15;
    const fileList = Array.from(files);
    e.target.value = '';

    let adicionados = 0;
    for (const file of fileList) {
      const tamanhoMB = file.size / (1024 * 1024);
      if (tamanhoMB > limiteMB) {
        toastService.warning(
          'Arquivo Excede o Limite',
          `O arquivo "${file.name}" (${tamanhoMB.toFixed(2)} MB) excede o máximo de ${limiteMB} MB.`
        );
        continue;
      }
      try {
        const stored = await uploadOriginalFile(file, 'site-publico');
        setAnexosSelecionados(prev => [...prev, stored]);
        adicionados++;
      } catch {
        toastService.error('Erro no Anexo', `Não foi possível processar o arquivo "${file.name}".`);
      }
    }

    if (adicionados > 0) {
      toastService.info('Anexo Adicionado', `${adicionados} arquivo(s) original(is) carregado(s) sem alterações.`);
    }
  };

  const handleRemoveAnexo = (index: number) => {
    setAnexosSelecionados(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmitPublicForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeFormModal || isSubmitting) return;

    for (const campo of activeFormModal.campos) {
      const v = formResponses[campo.id];
      if (campo.obrigatorio && (v === undefined || v === null || v === '' || v === false)) {
        toastService.warning('Campo Obrigatório', `Por favor preencha o campo: "${campo.label}"`);
        return;
      }
    }

    let nomeFinal = 'CIDADÃO / SOLICITANTE';
    let docFinal = 'NÃO INFORMADO';
    let emailFinal = '';
    let telFinal = '';

    Object.entries(formResponses).forEach(([key, val]) => {
      const campo = activeFormModal.campos.find(c => c.id === key);
      const label = (campo?.label || '').toLowerCase();
      if (typeof val === 'string' && val.trim()) {
        if (label.includes('nome')) nomeFinal = val.trim().toUpperCase();
        if (label.includes('cpf') || label.includes('cnpj') || label.includes('documento')) docFinal = val.trim().slice(0, 100);
        if (label.includes('email') || label.includes('e-mail')) emailFinal = val.trim().slice(0, 150);
        if (label.includes('telefone') || label.includes('celular') || label.includes('whatsapp')) telFinal = val.trim().slice(0, 50);
      }
    });

    setIsSubmitting(true);

    try {
      const novaResposta: RespostaFormulario = {
        id: `resp-pub-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        formularioId: activeFormModal.id,
        formularioTitulo: activeFormModal.titulo,
        autorNome: nomeFinal,
        autorDocumento: docFinal,
        autorEmail: emailFinal,
        autorTelefone: telFinal,
        canalOrigem: 'SITE',
        protocoloGerado: '',
        dataEnvio: new Date().toLocaleDateString('pt-BR') + ' às ' + new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        respostas: formResponses,
        dadosCampos: formResponses,
        anexos: anexosSelecionados,
        status: activeFormModal.statusProtocoloInicial || 'Em Análise'
      };

      const result = await storageService.submitFormResponseAsync(novaResposta);
      setProtocoloSucesso(result.protocolo);

      if (result.synced) {
        toastService.success(
          'Solicitação Enviada com Sucesso!',
          `Seu protocolo foi gerado e salvo na base oficial: ${result.protocolo}. Guarde este número para acompanhamento.`
        );
      } else {
        toastService.warning(
          'Protocolo Registrado Localmente',
          `Protocolo ${result.protocolo} criado, mas houve instabilidade ao gravar no banco online (${result.error || 'verifique a conexão'}).`
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const siteLogo = siteConfig.logoUrl || SIGCON_LOGO;
  const currentBanner = banners[bannerIndex] || null;

  const isInternalHash = (url?: string) => (url || '').trim().startsWith('#');

  const renderMenuItem = (menu: SiteMenuItem) => {
    const isTransp = menu.url.trim().toLowerCase() === '#transparencia';
    const isActive =
      (menu.url.trim().toLowerCase() === '#formularios' && activeTab === 'formularios') ||
      (menu.url.trim().toLowerCase() === '#noticias' && activeTab === 'noticias');

    if (isInternalHash(menu.url)) {
      return (
        <button
          key={menu.id}
          type="button"
          onClick={() => handleLinkNavigation(menu.url)}
          className={`px-3 py-2 rounded-xl text-xs font-bold uppercase tracking-wide transition-all cursor-pointer flex items-center gap-1.5 ${
            isTransp
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100'
              : isActive
              ? 'bg-slate-900 text-white shadow-2xs'
              : 'text-slate-600 hover:text-slate-950 hover:bg-slate-100'
          }`}
        >
          {isTransp && <Landmark className="w-3.5 h-3.5 text-emerald-700" />}
          <span>{menu.label}</span>
        </button>
      );
    }

    return (
      <a
        key={menu.id}
        href={menu.url}
        target={menu.abrirNovaAba ? '_blank' : undefined}
        rel={menu.abrirNovaAba ? 'noopener noreferrer' : undefined}
        className="px-3 py-2 rounded-xl text-xs font-bold uppercase tracking-wide text-slate-600 hover:text-slate-950 hover:bg-slate-100 transition-all flex items-center gap-1"
      >
        <span>{menu.label}</span>
        {menu.abrirNovaAba && <ExternalLink className="w-3 h-3 text-slate-400" />}
      </a>
    );
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 px-3 sm:px-0">
      {/* Barra de Navegação Superior Institucional com Logo & Menus Configuráveis */}
      <header className="bg-white border border-slate-200/90 rounded-2xl px-4 sm:px-6 py-3.5 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-center space-x-3.5 min-w-0">
          <img
            src={siteLogo}
            alt="Logo Oficial do Conselho"
            className="h-11 w-11 object-contain rounded-xl p-1 bg-white border border-slate-200 shadow-2xs shrink-0"
          />
          <div className="min-w-0">
            <span className="font-extrabold text-sm sm:text-base tracking-tight text-slate-900 block truncate">
              {councilConfig.sigla || 'CRF'} • {councilConfig.nomeCompleto || 'Conselho Regional'}
            </span>
            <span className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider block truncate">
              {siteConfig.tituloSite || 'Portal Oficial • Serviços Públicos, Transparência & Notícias'}
            </span>
          </div>
        </div>

        {/* Menus Dinâmicos configurados em WebSITE -> Configuração */}
        <nav className="flex flex-wrap items-center gap-1.5 sm:gap-2">
          {activeMenus.map(renderMenuItem)}

          {!hasTransparenciaMenu && (onOpenTransparencia || onNavigateToPortal) && (
            <button
              type="button"
              onClick={() => handleLinkNavigation('#transparencia')}
              className="px-3 py-2 rounded-xl text-xs font-bold uppercase tracking-wide bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100 transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Landmark className="w-3.5 h-3.5 text-emerald-700" />
              <span>Portal Transparência</span>
            </button>
          )}

          {onOpenLogin && (
            <button
              type="button"
              onClick={onOpenLogin}
              className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-linear-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:via-indigo-700 hover:to-purple-700 text-white font-extrabold text-xs shadow-md shadow-blue-500/20 hover:shadow-blue-500/35 transition-all uppercase tracking-wide cursor-pointer active:scale-95"
            >
              <Lock className="w-3.5 h-3.5 text-cyan-200" />
              <span>{isStandalonePublic ? 'Acesso Restrito' : 'Login'}</span>
            </button>
          )}
        </nav>
      </header>

      {/* Carrossel Dinâmico de Banners (Gerenciado em WebSITE -> Banners) */}
      {banners.length > 0 && currentBanner && (
        <section className="relative overflow-hidden rounded-3xl border border-slate-800 bg-slate-950 text-white shadow-xl min-h-[260px] sm:min-h-[320px] flex flex-col justify-between">
          {currentBanner.imagemUrl ? (
            <>
              <img
                src={currentBanner.imagemUrl}
                alt={currentBanner.titulo}
                className="absolute inset-0 w-full h-full object-cover opacity-50 transition-opacity duration-500"
              />
              <div className="absolute inset-0 bg-linear-to-r from-slate-950 via-slate-950/80 to-slate-900/40" />
            </>
          ) : (
            <>
              <div className="absolute inset-0 bg-linear-to-br from-slate-950 via-blue-950 to-emerald-950" />
              <div className="absolute inset-0 bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:20px_20px] opacity-15" />
            </>
          )}

          <div className="relative z-10 p-6 sm:p-10 md:p-12 flex flex-col md:flex-row md:items-end justify-between gap-6 flex-1">
            <div className="space-y-3.5 max-w-2xl">
              <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-200 text-[11px] font-bold uppercase tracking-wider">
                <SparklesDot />
                <span>Destaque Institucional • {councilConfig.sigla || 'CRF'}</span>
              </div>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-white leading-tight">
                {currentBanner.titulo}
              </h2>
              {currentBanner.subtitulo && (
                <p className="text-slate-200 text-xs sm:text-sm leading-relaxed max-w-xl">
                  {currentBanner.subtitulo}
                </p>
              )}

              {currentBanner.linkDestino && (
                <div className="pt-1">
                  {isInternalHash(currentBanner.linkDestino) ? (
                    <button
                      type="button"
                      onClick={() => handleLinkNavigation(currentBanner.linkDestino)}
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs uppercase tracking-wider shadow-lg transition-all cursor-pointer active:scale-95"
                    >
                      <span>{currentBanner.textoBotao || 'Acessar Agora'}</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  ) : (
                    <a
                      href={currentBanner.linkDestino}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs uppercase tracking-wider shadow-lg transition-all"
                    >
                      <span>{currentBanner.textoBotao || 'Acessar Agora'}</span>
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  )}
                </div>
              )}
            </div>

            {/* Indicadores e Controles do Carrossel */}
            {banners.length > 1 && (
              <div className="flex items-center gap-3 self-start md:self-end">
                <button
                  type="button"
                  onClick={() => setBannerIndex((bannerIndex - 1 + banners.length) % banners.length)}
                  className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-white transition-colors cursor-pointer"
                  title="Banner anterior"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <div className="flex items-center gap-1.5 px-2">
                  {banners.map((ban, idx) => (
                    <button
                      key={ban.id}
                      type="button"
                      onClick={() => setBannerIndex(idx)}
                      className={`h-2 rounded-full transition-all cursor-pointer ${
                        idx === bannerIndex ? 'w-6 bg-emerald-400' : 'w-2 bg-white/35 hover:bg-white/60'
                      }`}
                      title={`Banner ${idx + 1}: ${ban.titulo}`}
                    />
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => setBannerIndex((bannerIndex + 1) % banners.length)}
                  className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-white transition-colors cursor-pointer"
                  title="Próximo banner"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Cabeçalho de Serviços & Abas Principais */}
      <div
        ref={contentSectionRef}
        className="relative overflow-hidden rounded-3xl bg-linear-to-r from-slate-900 via-blue-950 to-indigo-950 text-white shadow-xl border border-blue-900/40"
      >
        <div className="absolute inset-0 bg-[radial-gradient(#3b82f6_1px,transparent_1px)] [background-size:16px_16px] opacity-15" />
        <div className="relative p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 z-10">
          <div className="space-y-2.5 max-w-2xl">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-200 text-xs font-bold uppercase tracking-wider">
              <Globe className="w-3.5 h-3.5 text-blue-300" />
              <span>{siteConfig.tituloSite || 'Portal Oficial de Notícias & Acesso Público'}</span>
            </div>
            <h1 className="text-xl sm:text-3xl font-extrabold tracking-tight text-white leading-tight">
              {councilConfig.sigla} • {councilConfig.nomeCompleto}
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
              {siteConfig.subtituloSite ||
                'Serviços de autoatendimento, transparência regulatória, formulários eletrônicos para o cidadão e comunicados em defesa da saúde pública.'}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row md:flex-col gap-2.5 shrink-0">
            {(onOpenTransparencia || onNavigateToPortal) && (
              <button
                type="button"
                onClick={() => handleLinkNavigation('#transparencia')}
                className="flex items-center justify-center space-x-2 px-5 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs shadow-lg transition-all uppercase tracking-wider cursor-pointer border border-emerald-400/30 active:scale-95"
              >
                <Landmark className="w-4 h-4 text-emerald-100" />
                <span>Acessar Portal Transparência</span>
              </button>
            )}

            <div className="px-4 py-3 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 text-center">
              <span className="block text-[10px] text-blue-200 uppercase font-bold">Autoatendimento Liberado</span>
              <span className="text-lg font-extrabold text-white tabular-nums">
                {formulariosPublicos.length} Formulários • {noticias.length} Notícias
              </span>
            </div>
          </div>
        </div>

        {/* Abas Superiores do Site */}
        <div className="bg-slate-950/60 px-4 sm:px-10 border-t border-white/10 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('formularios')}
            className={`px-4 sm:px-5 py-3 font-bold text-xs uppercase transition-all border-b-2 cursor-pointer flex items-center space-x-2 ${
              activeTab === 'formularios'
                ? 'border-cyan-400 text-cyan-300 bg-white/5'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <FileText className="w-4 h-4 text-cyan-400" />
            <span>Formulários & Serviços Online ({formulariosPublicos.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('noticias')}
            className={`px-4 sm:px-5 py-3 font-bold text-xs uppercase transition-all border-b-2 cursor-pointer flex items-center space-x-2 ${
              activeTab === 'noticias'
                ? 'border-blue-400 text-blue-300 bg-white/5'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <Newspaper className="w-4 h-4 text-blue-400" />
            <span>Notícias & Editais Regulatórios ({noticias.length})</span>
          </button>

          {(onOpenTransparencia || onNavigateToPortal) && (
            <button
              type="button"
              onClick={() => handleLinkNavigation('#transparencia')}
              className="px-4 sm:px-5 py-3 font-bold text-xs uppercase transition-all border-b-2 border-transparent text-emerald-300 hover:text-emerald-200 hover:bg-white/5 cursor-pointer flex items-center space-x-2 ml-auto"
            >
              <Landmark className="w-4 h-4 text-emerald-400" />
              <span>Balanços & Transparência Pública</span>
            </button>
          )}
        </div>
      </div>

      {/* Conteúdo Aba: Formulários e Serviços Online */}
      {activeTab === 'formularios' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs">
            <div className="flex items-center space-x-2 flex-wrap gap-1">
              <span className="font-bold text-slate-700 uppercase text-[11px]">Categoria:</span>
              {['TODOS', 'Ouvidoria', 'Fiscalização', 'Responsabilidade Técnica', 'Inscrição PF'].map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategoriaFilter(cat)}
                  className={`px-3 py-1.5 rounded-xl font-bold text-xs uppercase transition-colors cursor-pointer ${
                    categoriaFilter === cat
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            <div className="relative w-full md:w-72">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Pesquisar serviço ou formulário..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs uppercase focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium"
              />
            </div>
          </div>

          {filteredFormularios.length === 0 ? (
            <div className="bg-white border border-slate-200 p-12 rounded-3xl text-center space-y-3">
              <FileText className="w-12 h-12 text-slate-300 mx-auto" />
              <h3 className="font-bold text-slate-700 text-sm uppercase">Nenhum formulário público localizado</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Não foram encontrados formulários com os termos pesquisados. Limpe os filtros ou tente outra busca.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredFormularios.map((form) => (
                <div
                  key={form.id}
                  className="bg-white border border-slate-200 hover:border-blue-300 rounded-2xl p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between group space-y-4"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-200">
                        {form.categoria}
                      </span>
                      {form.permiteAnexos && (
                        <span
                          className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-bold bg-purple-50 text-purple-700 border border-purple-200"
                          title="Permite envio de arquivos anexos"
                        >
                          <Paperclip className="w-3 h-3" />
                          <span>Anexo Liberado</span>
                        </span>
                      )}
                    </div>

                    <div>
                      <h3 className="font-extrabold text-slate-900 text-sm uppercase group-hover:text-blue-600 transition-colors line-clamp-2">
                        {form.titulo}
                      </h3>
                      <p className="text-xs text-slate-500 mt-1 line-clamp-3 leading-relaxed">
                        {form.descricao}
                      </p>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                    <div className="text-[10px] text-slate-400 font-mono">
                      <span>{form.campos.length} campos • Versão {form.versao}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleOpenForm(form)}
                      className="flex items-center space-x-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all uppercase cursor-pointer"
                    >
                      <span>Preencher</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Conteúdo Aba: Notícias & Editais Regulatórios (Com Paginação Configurável) */}
      {activeTab === 'noticias' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
            <div className="flex items-center gap-2 text-slate-600 font-bold uppercase">
              <Newspaper className="w-4 h-4 text-blue-600" />
              <span>
                {filteredNoticias.length} Publicação(ões) • Exibindo até {noticiasPorPagina} por página
              </span>
            </div>

            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar notícia ou edital..."
                value={newsSearchTerm}
                onChange={(e) => {
                  setNewsSearchTerm(e.target.value);
                  setNewsPage(1);
                }}
                className="w-full pl-9 pr-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs uppercase focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium"
              />
            </div>
          </div>

          {paginatedNoticias.length === 0 ? (
            <div className="bg-white border border-slate-200 p-12 rounded-3xl text-center space-y-3">
              <Newspaper className="w-12 h-12 text-slate-300 mx-auto" />
              <h3 className="font-bold text-slate-700 text-sm uppercase">Nenhuma notícia publicada</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Não existem publicações disponíveis para os critérios informados.
              </p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {paginatedNoticias.map((not) => (
                  <article
                    key={not.id}
                    onClick={() => setActiveNoticiaModal(not)}
                    className="bg-white border border-slate-200 hover:border-blue-300 rounded-2xl overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col justify-between cursor-pointer group"
                  >
                    <div>
                      {not.imagemUrl ? (
                        <img
                          src={not.imagemUrl}
                          alt={not.titulo}
                          className="w-full h-44 object-cover group-hover:scale-[1.02] transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-44 bg-linear-to-br from-slate-900 via-blue-950 to-indigo-950 flex flex-col items-center justify-center text-blue-200 relative overflow-hidden">
                          <div className="absolute inset-0 bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:16px_16px] opacity-20" />
                          <Newspaper className="w-10 h-10 mb-1.5 text-cyan-300 relative z-10" />
                          <span className="text-[10px] font-bold uppercase tracking-widest text-blue-200/80 relative z-10">
                            {not.categoria}
                          </span>
                        </div>
                      )}

                      <div className="p-5 space-y-2.5">
                        <div className="flex items-center justify-between text-[11px] text-slate-500 gap-2">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-blue-600 uppercase">{not.categoria}</span>
                            {not.destaque && (
                              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200 text-[9px] font-bold uppercase">
                                <Star className="w-2.5 h-2.5 fill-amber-500 text-amber-500" />
                                Destaque
                              </span>
                            )}
                          </div>
                          <span className="flex items-center gap-1 font-mono shrink-0">
                            <Calendar className="w-3 h-3" />
                            <span>{not.dataPublicacao}</span>
                          </span>
                        </div>

                        <h3 className="font-extrabold text-slate-900 text-sm leading-snug uppercase group-hover:text-blue-700 transition-colors line-clamp-2">
                          {not.titulo}
                        </h3>
                        <p className="text-xs text-slate-600 leading-relaxed line-clamp-3">
                          {not.resumo}
                        </p>
                      </div>
                    </div>

                    <div className="px-5 py-3.5 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-500 font-semibold">
                      <span className="truncate max-w-[180px]">Por: {not.autor}</span>
                      <span className="text-blue-600 font-extrabold uppercase inline-flex items-center gap-1 shrink-0">
                        Ler Matéria <ChevronRight className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </article>
                ))}
              </div>

              {/* Controles de Paginação de Notícias */}
              {totalNewsPages > 1 && (
                <div className="bg-white border border-slate-200 rounded-2xl px-5 py-3.5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <span className="text-xs font-semibold text-slate-600">
                    Página <strong className="text-slate-900 tabular-nums">{newsPage}</strong> de{' '}
                    <strong className="text-slate-900 tabular-nums">{totalNewsPages}</strong> • Total de{' '}
                    <strong className="text-slate-900 tabular-nums">{filteredNoticias.length}</strong> notícias
                  </span>

                  <div className="flex items-center gap-1.5 flex-wrap">
                    <button
                      type="button"
                      onClick={() => setNewsPage(p => Math.max(1, p - 1))}
                      disabled={newsPage <= 1}
                      className="px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 disabled:opacity-40 text-xs font-bold text-slate-700 cursor-pointer flex items-center gap-1"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                      <span>Anterior</span>
                    </button>

                    {Array.from({ length: totalNewsPages }, (_, i) => i + 1).map((pageNum) => (
                      <button
                        key={pageNum}
                        type="button"
                        onClick={() => setNewsPage(pageNum)}
                        className={`w-8 h-8 rounded-xl text-xs font-extrabold tabular-nums transition-colors cursor-pointer ${
                          pageNum === newsPage
                            ? 'bg-blue-600 text-white shadow-xs'
                            : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                        }`}
                      >
                        {pageNum}
                      </button>
                    ))}

                    <button
                      type="button"
                      onClick={() => setNewsPage(p => Math.min(totalNewsPages, p + 1))}
                      disabled={newsPage >= totalNewsPages}
                      className="px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 disabled:opacity-40 text-xs font-bold text-slate-700 cursor-pointer flex items-center gap-1"
                    >
                      <span>Próxima</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Modal de Leitura Completa da Notícia */}
      {activeNoticiaModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/75 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl max-w-3xl w-full my-auto flex flex-col max-h-[90vh] overflow-hidden border border-slate-200 animate-in fade-in zoom-in duration-150">
            <div className="px-6 py-4 bg-linear-to-r from-slate-900 to-blue-950 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center space-x-2.5 min-w-0">
                <BookOpen className="w-5 h-5 text-cyan-300 shrink-0" />
                <div className="min-w-0">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-300 block">
                    {activeNoticiaModal.categoria} • {activeNoticiaModal.dataPublicacao}
                  </span>
                  <h3 className="font-bold text-sm uppercase truncate">
                    Informativo Oficial do Conselho
                  </h3>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveNoticiaModal(null)}
                className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white/20 transition-colors text-white cursor-pointer shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 sm:p-8 overflow-y-auto space-y-5 flex-1">
              {activeNoticiaModal.imagemUrl && (
                <img
                  src={activeNoticiaModal.imagemUrl}
                  alt={activeNoticiaModal.titulo}
                  className="w-full max-h-72 object-cover rounded-2xl border border-slate-200"
                />
              )}

              <div className="space-y-2">
                <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 leading-tight uppercase">
                  {activeNoticiaModal.titulo}
                </h2>
                <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 font-medium pt-1">
                  <span className="inline-flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    <span>{activeNoticiaModal.autor}</span>
                  </span>
                  <span className="inline-flex items-center gap-1.5 font-mono">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>{activeNoticiaModal.dataPublicacao}</span>
                  </span>
                </div>
              </div>

              {activeNoticiaModal.resumo && (
                <div className="p-4 bg-blue-50/70 border border-blue-200 rounded-2xl text-xs sm:text-sm text-blue-950 font-medium leading-relaxed">
                  {activeNoticiaModal.resumo}
                </div>
              )}

              <div className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">
                {activeNoticiaModal.conteudo || activeNoticiaModal.resumo}
              </div>
            </div>

            <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-end shrink-0">
              <button
                type="button"
                onClick={() => setActiveNoticiaModal(null)}
                className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs uppercase cursor-pointer"
              >
                Fechar Leitura
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Preenchimento Público */}
      {activeFormModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full my-auto flex flex-col max-h-[92vh] overflow-hidden border border-slate-200 animate-in fade-in zoom-in duration-150">
            <div className="px-6 py-4 bg-linear-to-r from-blue-700 to-indigo-800 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center space-x-2.5">
                <FileText className="w-5 h-5 text-blue-200" />
                <div>
                  <h3 className="font-bold text-sm uppercase tracking-wide">
                    {activeFormModal.titulo}
                  </h3>
                  <p className="text-[10px] text-blue-200 font-mono">
                    Canal: Acesso Público Oficial • Protocolo Digital Instantâneo
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveFormModal(null)}
                className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white/20 transition-colors text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-5 flex-1 text-xs">
              {protocoloSucesso ? (
                <div className="p-6 bg-emerald-50 border border-emerald-200 rounded-2xl text-center space-y-3.5">
                  <div className="w-14 h-14 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-emerald-950 text-base uppercase">
                      Solicitação Protocolada com Sucesso!
                    </h4>
                    <p className="text-xs text-emerald-800 mt-1">
                      Seu requerimento foi inserido no sistema de protocolos do Conselho e encaminhado para triagem.
                    </p>
                  </div>
                  <div className="p-3 bg-white border border-emerald-300 rounded-xl inline-block font-mono font-extrabold text-sm text-emerald-900">
                    Número do Protocolo: {protocoloSucesso}
                  </div>
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={() => setActiveFormModal(null)}
                      className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs uppercase shadow-sm cursor-pointer"
                    >
                      Fechar Janela
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmitPublicForm} className="space-y-4">
                  <div className="p-3.5 bg-blue-50/70 border border-blue-200 rounded-xl text-blue-900 leading-relaxed">
                    <strong className="block font-bold mb-0.5 uppercase">Finalidade do Atendimento:</strong>
                    <span>{activeFormModal.descricao}</span>
                  </div>

                  <div className="space-y-4 pt-1">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      {activeFormModal.campos.map((campo) => (
                        <div
                          key={campo.id}
                          className={
                            campo.tipo === 'textarea' || campo.tipo === 'endereco_cep' || campo.larguraCol === '12' || campo.larguraCol === 12
                              ? 'sm:col-span-2'
                              : 'sm:col-span-1'
                          }
                        >
                          <DynamicFieldRenderer
                            campo={campo}
                            value={formResponses[campo.id]}
                            onChange={(val) => setFormResponses(prev => ({ ...prev, [campo.id]: val }))}
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  {activeFormModal.permiteAnexos && (
                    <div className="p-4 bg-purple-50/70 border border-purple-200 rounded-2xl space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-purple-900 uppercase flex items-center gap-1.5">
                          <Paperclip className="w-4 h-4 text-purple-600" />
                          <span>Anexo de Documentos Comprobatórios (PDF, DOCX, Imagens)</span>
                        </span>
                        <span className="text-[10px] text-purple-700 bg-purple-100 px-2 py-0.5 rounded font-mono font-bold">
                          Até {activeFormModal.tamanhoMaximoMb || 15} MB
                        </span>
                      </div>

                      {activeFormModal.instrucoesAnexo && (
                        <p className="text-[11px] text-purple-800">
                          {activeFormModal.instrucoesAnexo}
                        </p>
                      )}

                      <div className="flex items-center space-x-3">
                        <label className="flex items-center space-x-2 px-3.5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold text-xs uppercase cursor-pointer transition-colors shadow-xs">
                          <Upload className="w-3.5 h-3.5" />
                          <span>Escolher Arquivos</span>
                          <input
                            type="file"
                            multiple
                            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                            onChange={handleFileUpload}
                            className="hidden"
                          />
                        </label>
                        <span className="text-[11px] text-slate-500">
                          Formatos aceitos: PDF, Word (DOCX), Imagens (JPG, PNG)
                        </span>
                      </div>

                      {anexosSelecionados.length > 0 && (
                        <div className="space-y-1.5 pt-1">
                          {anexosSelecionados.map((anexo, idx) => (
                            <div key={idx} className="flex items-center justify-between p-2 bg-white border border-purple-200 rounded-xl text-xs">
                              <span className="font-semibold text-slate-800 truncate max-w-sm flex items-center gap-1.5">
                                <FileText className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                                <span>{anexo.nome} ({formatAttachmentSize(anexo)})</span>
                              </span>
                              <button
                                type="button"
                                onClick={() => handleRemoveAnexo(idx)}
                                className="text-rose-600 hover:text-rose-800 p-1 cursor-pointer"
                                title="Remover anexo"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  <div className="flex items-center justify-end space-x-2.5 pt-3 border-t border-slate-200">
                    <button
                      type="button"
                      onClick={() => setActiveFormModal(null)}
                      className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs uppercase cursor-pointer"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="flex items-center space-x-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white font-bold rounded-xl text-xs uppercase shadow-md transition-all cursor-pointer"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>{isSubmitting ? 'Enviando...' : 'Enviar Solicitação & Gerar Protocolo'}</span>
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const SparklesDot: React.FC = () => (
  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse inline-block" />
);
