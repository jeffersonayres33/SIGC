import React, { useState, useEffect } from 'react';
import {
  Globe,
  Newspaper,
  Image as ImageIcon,
  Sliders,
  Plus,
  Edit3,
  Trash2,
  Search,
  Upload,
  X,
  CheckCircle2,
  Eye,
  EyeOff,
  Star,
  ArrowUp,
  ArrowDown,
  Link2,
  Save,
  ExternalLink,
  AlertTriangle,
  Calendar,
  User
} from 'lucide-react';
import { SiteNoticia, SiteBanner, SiteMenuItem, SiteConfig } from '../../types';
import { storageService } from '../../services/storageService';
import { toastService } from '../../services/toastService';
import { uploadOriginalFile } from '../../services/fileStorageService';
import { SIGCON_LOGO } from '../../constants/assets';

export type WebsiteSubTab = 'noticias' | 'banners' | 'configuracao';

interface WebsiteAdminViewProps {
  initialTab?: WebsiteSubTab;
  onTabChange?: (tab: WebsiteSubTab) => void;
  onPreviewSite?: () => void;
}

const CATEGORIAS_NOTICIAS = [
  'Institucional',
  'Fiscalização',
  'Legislação',
  'Educação',
  'Comunicado',
  'Eventos'
];

const DESTINOS_MENU_PADRAO = [
  { label: 'Início (#inicio)', value: '#inicio' },
  { label: 'Serviços Online (#formularios)', value: '#formularios' },
  { label: 'Notícias & Editais (#noticias)', value: '#noticias' },
  { label: 'Portal Transparência (#transparencia)', value: '#transparencia' }
];

export const WebsiteAdminView: React.FC<WebsiteAdminViewProps> = ({
  initialTab = 'noticias',
  onTabChange,
  onPreviewSite
}) => {
  const [activeTab, setActiveTab] = useState<WebsiteSubTab>(initialTab);
  const [noticias, setNoticias] = useState<SiteNoticia[]>(() => storageService.getSiteNoticias());
  const [banners, setBanners] = useState<SiteBanner[]>(() => storageService.getSiteBanners());
  const [siteConfig, setSiteConfig] = useState<SiteConfig>(() => storageService.getSiteConfig());

  // Notícias state
  const [searchNoticia, setSearchNoticia] = useState('');
  const [editingNoticia, setEditingNoticia] = useState<SiteNoticia | null>(null);
  const [isNoticiaModalOpen, setIsNoticiaModalOpen] = useState(false);
  const [noticiaToDelete, setNoticiaToDelete] = useState<SiteNoticia | null>(null);

  // Banners state
  const [editingBanner, setEditingBanner] = useState<SiteBanner | null>(null);
  const [isBannerModalOpen, setIsBannerModalOpen] = useState(false);
  const [bannerToDelete, setBannerToDelete] = useState<SiteBanner | null>(null);

  // Configuração state
  const [cfgNoticiasPorPagina, setCfgNoticiasPorPagina] = useState<number>(siteConfig.noticiasPorPagina || 6);
  const [cfgLogoUrl, setCfgLogoUrl] = useState<string>(siteConfig.logoUrl || '');
  const [cfgTituloSite, setCfgTituloSite] = useState<string>(siteConfig.tituloSite || '');
  const [cfgSubtituloSite, setCfgSubtituloSite] = useState<string>(siteConfig.subtituloSite || '');
  const [cfgMenus, setCfgMenus] = useState<SiteMenuItem[]>(siteConfig.menus || []);
  const [newMenuLabel, setNewMenuLabel] = useState('');
  const [newMenuUrl, setNewMenuUrl] = useState('#transparencia');
  const [newMenuNovaAba, setNewMenuNovaAba] = useState(false);
  const [editingMenuId, setEditingMenuId] = useState<string | null>(null);

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  useEffect(() => {
    const unsub = storageService.subscribe(() => {
      setNoticias(storageService.getSiteNoticias());
      setBanners(storageService.getSiteBanners());
      const latestCfg = storageService.getSiteConfig();
      setSiteConfig(latestCfg);
    });
    return () => unsub();
  }, []);

  const handleSelectTab = (tab: WebsiteSubTab) => {
    setActiveTab(tab);
    onTabChange?.(tab);
    if (tab === 'configuracao') {
      const latest = storageService.getSiteConfig();
      setCfgNoticiasPorPagina(latest.noticiasPorPagina || 6);
      setCfgLogoUrl(latest.logoUrl || '');
      setCfgTituloSite(latest.tituloSite || '');
      setCfgSubtituloSite(latest.subtituloSite || '');
      setCfgMenus(latest.menus || []);
    }
  };

  // ==================== HANDLERS NOTÍCIAS ====================
  const handleOpenNewNoticia = () => {
    const today = new Date().toLocaleDateString('pt-BR');
    setEditingNoticia({
      id: '',
      titulo: '',
      resumo: '',
      conteudo: '',
      categoria: 'Institucional',
      dataPublicacao: today,
      autor: 'Assessoria de Comunicação',
      imagemUrl: '',
      destaque: false,
      publicado: true,
      ordem: noticias.length + 1
    });
    setIsNoticiaModalOpen(true);
  };

  const handleOpenEditNoticia = (not: SiteNoticia) => {
    setEditingNoticia({ ...not });
    setIsNoticiaModalOpen(true);
  };

  const handleUploadNoticiaImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !editingNoticia) return;
    if (!file.type.startsWith('image/')) {
      toastService.warning('Formato Inválido', 'Selecione uma imagem (JPG, PNG ou WebP).');
      return;
    }
    try {
      const stored = await uploadOriginalFile(file, 'website');
      setEditingNoticia({ ...editingNoticia, imagemUrl: stored.url });
      toastService.success('Imagem Carregada', 'Imagem da notícia carregada com sucesso.');
    } catch {
      toastService.error('Erro no Upload', 'Não foi possível carregar a imagem selecionada.');
    }
  };

  const handleSaveNoticia = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingNoticia) return;
    if (!editingNoticia.titulo.trim()) {
      toastService.warning('Campo Obrigatório', 'Informe o título da notícia.');
      return;
    }
    storageService.saveSiteNoticia({
      ...editingNoticia,
      titulo: editingNoticia.titulo.trim(),
      resumo: editingNoticia.resumo.trim(),
      conteudo: editingNoticia.conteudo.trim() || editingNoticia.resumo.trim()
    });
    setIsNoticiaModalOpen(false);
    setEditingNoticia(null);
    toastService.success('Notícia Salva', 'A notícia foi atualizada e sincronizada com o site público.');
  };

  const handleConfirmDeleteNoticia = () => {
    if (!noticiaToDelete) return;
    storageService.deleteSiteNoticia(noticiaToDelete.id);
    setNoticiaToDelete(null);
    toastService.success('Notícia Excluída', 'A notícia foi removida do site.');
  };

  // ==================== HANDLERS BANNERS ====================
  const handleOpenNewBanner = () => {
    setEditingBanner({
      id: '',
      titulo: '',
      subtitulo: '',
      imagemUrl: '',
      textoBotao: 'Saiba Mais',
      linkDestino: '#formularios',
      ordem: banners.length + 1,
      ativo: true
    });
    setIsBannerModalOpen(true);
  };

  const handleOpenEditBanner = (ban: SiteBanner) => {
    setEditingBanner({ ...ban });
    setIsBannerModalOpen(true);
  };

  const handleUploadBannerImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !editingBanner) return;
    if (!file.type.startsWith('image/')) {
      toastService.warning('Formato Inválido', 'Selecione uma imagem (JPG, PNG ou WebP).');
      return;
    }
    try {
      const stored = await uploadOriginalFile(file, 'website');
      setEditingBanner({ ...editingBanner, imagemUrl: stored.url });
      toastService.success('Banner Carregado', 'Imagem do banner carregada com sucesso.');
    } catch {
      toastService.error('Erro no Upload', 'Não foi possível carregar a imagem do banner.');
    }
  };

  const handleSaveBanner = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBanner) return;
    if (!editingBanner.titulo.trim()) {
      toastService.warning('Campo Obrigatório', 'Informe o título principal do banner.');
      return;
    }
    storageService.saveSiteBanner({
      ...editingBanner,
      titulo: editingBanner.titulo.trim(),
      subtitulo: editingBanner.subtitulo?.trim() || '',
      textoBotao: editingBanner.textoBotao?.trim() || '',
      linkDestino: editingBanner.linkDestino?.trim() || ''
    });
    setIsBannerModalOpen(false);
    setEditingBanner(null);
    toastService.success('Banner Salvo', 'O banner foi salvo e já pode ser exibido no site público.');
  };

  const handleConfirmDeleteBanner = () => {
    if (!bannerToDelete) return;
    storageService.deleteSiteBanner(bannerToDelete.id);
    setBannerToDelete(null);
    toastService.success('Banner Removido', 'O banner foi excluído do site.');
  };

  // ==================== HANDLERS CONFIGURAÇÃO ====================
  const handleUploadSiteLogo = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toastService.warning('Formato Inválido', 'Selecione uma imagem para a logo do site (PNG, JPG, SVG ou WebP).');
      return;
    }
    try {
      const stored = await uploadOriginalFile(file, 'website');
      setCfgLogoUrl(stored.url);
      toastService.info('Logo Carregada', 'Clique em "Salvar Configurações do Site" para aplicar no site.');
    } catch {
      toastService.error('Erro no Upload', 'Não foi possível processar a imagem da logo.');
    }
  };

  const handleAddOrUpdateMenu = () => {
    if (!newMenuLabel.trim() || !newMenuUrl.trim()) {
      toastService.warning('Campos Obrigatórios', 'Informe o rótulo do menu e o link de destino.');
      return;
    }

    if (editingMenuId) {
      setCfgMenus(prev =>
        prev.map(m =>
          m.id === editingMenuId
            ? {
                ...m,
                label: newMenuLabel.trim(),
                url: newMenuUrl.trim(),
                abrirNovaAba: newMenuNovaAba
              }
            : m
        )
      );
      setEditingMenuId(null);
    } else {
      const nextOrdem = cfgMenus.length + 1;
      setCfgMenus(prev => [
        ...prev,
        {
          id: `menu-${Date.now()}`,
          label: newMenuLabel.trim(),
          url: newMenuUrl.trim(),
          ordem: nextOrdem,
          ativo: true,
          abrirNovaAba: newMenuNovaAba
        }
      ]);
    }
    setNewMenuLabel('');
    setNewMenuUrl('#formularios');
    setNewMenuNovaAba(false);
  };

  const handleEditMenu = (item: SiteMenuItem) => {
    setEditingMenuId(item.id);
    setNewMenuLabel(item.label);
    setNewMenuUrl(item.url);
    setNewMenuNovaAba(Boolean(item.abrirNovaAba));
  };

  const handleMoveMenu = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= cfgMenus.length) return;
    const copy = [...cfgMenus];
    const [removed] = copy.splice(index, 1);
    copy.splice(target, 0, removed);
    setCfgMenus(copy.map((item, idx) => ({ ...item, ordem: idx + 1 })));
  };

  const handleDeleteMenu = (id: string) => {
    setCfgMenus(prev => prev.filter(m => m.id !== id).map((m, idx) => ({ ...m, ordem: idx + 1 })));
    if (editingMenuId === id) {
      setEditingMenuId(null);
      setNewMenuLabel('');
      setNewMenuUrl('#formularios');
    }
  };

  const handleSaveConfiguracao = (e: React.FormEvent) => {
    e.preventDefault();
    const qtd = Math.max(1, Math.min(24, Number(cfgNoticiasPorPagina) || 6));
    storageService.updateSiteConfig({
      noticiasPorPagina: qtd,
      logoUrl: cfgLogoUrl,
      tituloSite: cfgTituloSite.trim(),
      subtituloSite: cfgSubtituloSite.trim(),
      menus: cfgMenus.map((m, idx) => ({ ...m, ordem: idx + 1 }))
    });
    toastService.success('Configurações Salvas', 'Logo, menus e paginação de notícias aplicados ao site público.');
  };

  const filteredNoticias = noticias.filter(n =>
    n.titulo.toLowerCase().includes(searchNoticia.toLowerCase()) ||
    n.categoria.toLowerCase().includes(searchNoticia.toLowerCase()) ||
    n.autor.toLowerCase().includes(searchNoticia.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Top Bar / Breadcrumb */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center space-x-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
            <Globe className="w-3.5 h-3.5 text-indigo-600" />
            <span>WEB SITE</span>
            <span>/</span>
            <span className="text-indigo-700">
              {activeTab === 'noticias' ? 'Notícias' : activeTab === 'banners' ? 'Banner' : 'Configuração'}
            </span>
          </div>
          <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
            Gerenciamento do Portal Institucional (WEB SITE)
          </h1>
          <p className="text-xs text-slate-500">
            Administre notícias, banners rotativos, logo oficial, menus de navegação e paginação do site público.
          </p>
        </div>

        <div className="flex items-center space-x-2 shrink-0">
          {onPreviewSite && (
            <button
              type="button"
              onClick={onPreviewSite}
              className="flex items-center space-x-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer whitespace-nowrap"
            >
              <ExternalLink className="w-3.5 h-3.5 text-cyan-300" />
              <span>Abrir Site Público</span>
            </button>
          )}
        </div>
      </div>

      {/* Submenu Navigation Pills */}
      <div className="bg-white border border-slate-200 rounded-2xl p-2 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => handleSelectTab('noticias')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'noticias'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <Newspaper className="w-4 h-4" />
          <span>Notícias ({noticias.length})</span>
        </button>

        <button
          type="button"
          onClick={() => handleSelectTab('banners')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'banners'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <ImageIcon className="w-4 h-4" />
          <span>Banner ({banners.length})</span>
        </button>

        <button
          type="button"
          onClick={() => handleSelectTab('configuracao')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'configuracao'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <Sliders className="w-4 h-4" />
          <span>Configuração</span>
        </button>
      </div>

      {/* ==================== TAB 1: NOTÍCIAS ==================== */}
      {activeTab === 'noticias' && (
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
          <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/70">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchNoticia}
                onChange={(e) => setSearchNoticia(e.target.value)}
                placeholder="Buscar notícia por título, categoria ou autor..."
                className="w-full pl-9 pr-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>
            <button
              type="button"
              onClick={handleOpenNewNoticia}
              className="flex items-center justify-center space-x-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer whitespace-nowrap"
            >
              <Plus className="w-4 h-4" />
              <span>Nova Notícia</span>
            </button>
          </div>

          {filteredNoticias.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <Newspaper className="w-10 h-10 text-slate-300 mx-auto" />
              <p className="text-sm font-bold text-slate-700">Nenhuma notícia cadastrada</p>
              <p className="text-xs text-slate-500">Adicione notícias e editais para exibição pública no site oficial.</p>
              <button
                type="button"
                onClick={handleOpenNewNoticia}
                className="inline-flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white font-bold text-xs rounded-xl cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Cadastrar Primeira Notícia</span>
              </button>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {filteredNoticias.map((not) => (
                <div key={not.id} className="p-4 hover:bg-slate-50/80 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-start space-x-3.5 min-w-0 flex-1">
                    {not.imagemUrl ? (
                      <img
                        src={not.imagemUrl}
                        alt={not.titulo}
                        className="w-20 h-16 object-cover rounded-xl border border-slate-200 shrink-0"
                      />
                    ) : (
                      <div className="w-20 h-16 rounded-xl border border-slate-200 bg-slate-100 flex items-center justify-center shrink-0 text-slate-400">
                        <Newspaper className="w-6 h-6" />
                      </div>
                    )}

                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex flex-wrap items-center gap-2 text-[11px]">
                        <span className="font-bold uppercase text-indigo-700">{not.categoria}</span>
                        <span className="text-slate-300">•</span>
                        <span className="font-mono text-slate-500 flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {not.dataPublicacao}
                        </span>
                        <span className="text-slate-300">•</span>
                        <span className="text-slate-500 flex items-center gap-1">
                          <User className="w-3 h-3" />
                          {not.autor}
                        </span>
                        {not.destaque && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded">
                            <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                            Destaque
                          </span>
                        )}
                        <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded border ${
                          not.publicado
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-slate-100 text-slate-500 border-slate-200'
                        }`}>
                          {not.publicado ? 'Publicado' : 'Oculto'}
                        </span>
                      </div>
                      <h3 className="font-bold text-slate-900 text-sm truncate">{not.titulo}</h3>
                      <p className="text-xs text-slate-600 line-clamp-2">{not.resumo}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => storageService.saveSiteNoticia({ ...not, publicado: !not.publicado })}
                      className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 cursor-pointer"
                      title={not.publicado ? 'Ocultar do site' : 'Publicar no site'}
                    >
                      {not.publicado ? <Eye className="w-4 h-4 text-emerald-600" /> : <EyeOff className="w-4 h-4 text-slate-400" />}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleOpenEditNoticia(not)}
                      className="flex items-center space-x-1 px-3 py-1.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-200 text-xs font-bold cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Editar</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setNoticiaToDelete(not)}
                      className="flex items-center space-x-1 px-3 py-1.5 rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-bold cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Excluir</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ==================== TAB 2: BANNERS ==================== */}
      {activeTab === 'banners' && (
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
          <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/70">
            <div>
              <h2 className="font-bold text-sm text-slate-900">Banners do Site Oficial</h2>
              <p className="text-xs text-slate-500">Os banners ativos aparecem no carrossel principal do site público.</p>
            </div>
            <button
              type="button"
              onClick={handleOpenNewBanner}
              className="flex items-center space-x-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Novo Banner</span>
            </button>
          </div>

          {banners.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <ImageIcon className="w-10 h-10 text-slate-300 mx-auto" />
              <p className="text-sm font-bold text-slate-700">Nenhum banner configurado</p>
              <button
                type="button"
                onClick={handleOpenNewBanner}
                className="inline-flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white font-bold text-xs rounded-xl cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Adicionar Primeiro Banner</span>
              </button>
            </div>
          ) : (
            <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              {banners.map((ban) => (
                <div key={ban.id} className="border border-slate-200 rounded-2xl overflow-hidden flex flex-col justify-between bg-white">
                  <div>
                    <div className="relative h-40 bg-linear-to-r from-slate-900 via-blue-950 to-indigo-900 flex items-end p-4 text-white overflow-hidden">
                      {ban.imagemUrl && (
                        <img
                          src={ban.imagemUrl}
                          alt={ban.titulo}
                          className="absolute inset-0 w-full h-full object-cover opacity-55"
                        />
                      )}
                      <div className="relative z-10 space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[10px] font-bold bg-black/50 px-2 py-0.5 rounded">
                            Ordem #{ban.ordem}
                          </span>
                          <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                            ban.ativo ? 'bg-emerald-500/90 text-white' : 'bg-slate-600 text-slate-200'
                          }`}>
                            {ban.ativo ? 'Ativo' : 'Inativo'}
                          </span>
                        </div>
                        <h3 className="font-extrabold text-sm leading-snug">{ban.titulo}</h3>
                        {ban.subtitulo && (
                          <p className="text-[11px] text-slate-200 line-clamp-2">{ban.subtitulo}</p>
                        )}
                      </div>
                    </div>

                    <div className="p-3.5 text-xs space-y-1 bg-slate-50/50 border-t border-slate-100">
                      <div className="flex items-center justify-between text-slate-600">
                        <span className="font-semibold">Botão CTA:</span>
                        <span className="font-bold text-slate-800">{ban.textoBotao || '—'}</span>
                      </div>
                      <div className="flex items-center justify-between text-slate-600">
                        <span className="font-semibold">Link / Destino:</span>
                        <span className="font-mono text-[11px] text-indigo-700 truncate max-w-[200px]">
                          {ban.linkDestino || '—'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="p-3 border-t border-slate-100 flex items-center justify-end space-x-2">
                    <button
                      type="button"
                      onClick={() => storageService.saveSiteBanner({ ...ban, ativo: !ban.ativo })}
                      className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-100 cursor-pointer"
                    >
                      {ban.ativo ? 'Desativar' : 'Ativar'}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleOpenEditBanner(ban)}
                      className="flex items-center space-x-1 px-3 py-1.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 text-xs font-bold cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Editar</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setBannerToDelete(ban)}
                      className="flex items-center space-x-1 px-3 py-1.5 rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-bold cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Excluir</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ==================== TAB 3: CONFIGURAÇÃO ==================== */}
      {activeTab === 'configuracao' && (
        <form onSubmit={handleSaveConfiguracao} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Logo e Paginação de Notícias */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-5">
              <h2 className="font-extrabold text-sm text-slate-900 border-b border-slate-100 pb-3">
                Identidade Visual & Paginação de Notícias
              </h2>

              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700 uppercase">
                  Logo Oficial do Site Público
                </label>
                <div className="flex items-center space-x-4 p-4 rounded-xl border border-slate-200 bg-slate-50">
                  <img
                    src={cfgLogoUrl || SIGCON_LOGO}
                    alt="Logo configurada"
                    className="h-16 w-16 object-contain rounded-xl bg-white border border-slate-200 p-1 shrink-0"
                  />
                  <div className="space-y-2 flex-1">
                    <div className="flex flex-wrap gap-2">
                      <label className="inline-flex items-center space-x-1.5 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl cursor-pointer transition-colors">
                        <Upload className="w-3.5 h-3.5" />
                        <span>Enviar Logo do Site</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleUploadSiteLogo}
                          className="hidden"
                        />
                      </label>
                      {cfgLogoUrl && (
                        <button
                          type="button"
                          onClick={() => setCfgLogoUrl('')}
                          className="px-3 py-2 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold text-xs rounded-xl cursor-pointer"
                        >
                          Restaurar Padrão
                        </button>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500">
                      Substitui a logomarca exibida no cabeçalho e rodapé do site oficial e do Portal Transparência.
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                  Quantidade de Notícias por Página
                </label>
                <input
                  type="number"
                  min={1}
                  max={24}
                  value={cfgNoticiasPorPagina}
                  onChange={(e) => setCfgNoticiasPorPagina(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  Controla quantas notícias são exibidas por página antes dos botões de paginação no site público.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                  Título do Portal (Opcional)
                </label>
                <input
                  type="text"
                  value={cfgTituloSite}
                  onChange={(e) => setCfgTituloSite(e.target.value)}
                  placeholder="Deixe em branco para usar Sigla + Nome do Conselho"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                  Subtítulo Institucional
                </label>
                <textarea
                  rows={2}
                  value={cfgSubtituloSite}
                  onChange={(e) => setCfgSubtituloSite(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>
            </div>

            {/* Gerenciador de Menus e Links */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h2 className="font-extrabold text-sm text-slate-900">Menus de Navegação & Links</h2>
                  <p className="text-[11px] text-slate-500">Adicione links internos (#transparencia, #noticias, #formularios) ou URLs externas.</p>
                </div>
              </div>

              {/* Formulário de adição / edição de menu */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Texto do Menu</label>
                    <input
                      type="text"
                      value={newMenuLabel}
                      onChange={(e) => setNewMenuLabel(e.target.value)}
                      placeholder="Ex: Portal Transparência"
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs focus:outline-hidden focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Link / Destino</label>
                    <input
                      type="text"
                      value={newMenuUrl}
                      onChange={(e) => setNewMenuUrl(e.target.value)}
                      placeholder="#transparencia ou https://..."
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-mono focus:outline-hidden focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap gap-1.5">
                    {DESTINOS_MENU_PADRAO.map((d) => (
                      <button
                        key={d.value}
                        type="button"
                        onClick={() => setNewMenuUrl(d.value)}
                        className="text-[10px] px-2 py-1 rounded bg-white border border-slate-200 hover:border-indigo-300 text-slate-600 font-semibold cursor-pointer"
                      >
                        {d.value}
                      </button>
                    ))}
                  </div>

                  <label className="flex items-center space-x-1.5 text-[11px] text-slate-700 font-medium cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newMenuNovaAba}
                      onChange={(e) => setNewMenuNovaAba(e.target.checked)}
                      className="rounded border-slate-300 text-indigo-600"
                    />
                    <span>Abrir em nova aba</span>
                  </label>
                </div>

                <div className="flex justify-end gap-2">
                  {editingMenuId && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingMenuId(null);
                        setNewMenuLabel('');
                        setNewMenuUrl('#formularios');
                      }}
                      className="px-3 py-1.5 bg-white border border-slate-200 text-slate-600 font-bold text-xs rounded-lg cursor-pointer"
                    >
                      Cancelar
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={handleAddOrUpdateMenu}
                    className="flex items-center space-x-1.5 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-lg cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>{editingMenuId ? 'Atualizar Item de Menu' : 'Adicionar Menu'}</span>
                  </button>
                </div>
              </div>

              {/* Lista de menus cadastrados */}
              <div className="border border-slate-200 rounded-xl divide-y divide-slate-100 max-h-72 overflow-y-auto">
                {cfgMenus.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-500">
                    Nenhum item de menu configurado.
                  </div>
                ) : (
                  cfgMenus.map((item, idx) => (
                    <div key={item.id} className="p-3 flex items-center justify-between gap-2 hover:bg-slate-50">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[10px] text-slate-400 font-bold">#{idx + 1}</span>
                          <span className="font-bold text-xs text-slate-800 truncate">{item.label}</span>
                          {!item.ativo && (
                            <span className="text-[10px] font-bold text-slate-400 uppercase">(Oculto)</span>
                          )}
                        </div>
                        <span className="text-[11px] font-mono text-indigo-600 flex items-center gap-1 truncate">
                          <Link2 className="w-3 h-3 shrink-0" />
                          {item.url}
                        </span>
                      </div>

                      <div className="flex items-center space-x-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleMoveMenu(idx, -1)}
                          disabled={idx === 0}
                          className="p-1.5 rounded border border-slate-200 text-slate-500 hover:bg-slate-100 disabled:opacity-30 cursor-pointer"
                          title="Mover para cima"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleMoveMenu(idx, 1)}
                          disabled={idx === cfgMenus.length - 1}
                          className="p-1.5 rounded border border-slate-200 text-slate-500 hover:bg-slate-100 disabled:opacity-30 cursor-pointer"
                          title="Mover para baixo"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setCfgMenus(prev => prev.map(m => (m.id === item.id ? { ...m, ativo: !m.ativo } : m)))
                          }
                          className="p-1.5 rounded border border-slate-200 text-slate-600 hover:bg-slate-100 cursor-pointer"
                          title={item.ativo ? 'Ocultar menu' : 'Exibir menu'}
                        >
                          {item.ativo ? <Eye className="w-3.5 h-3.5 text-emerald-600" /> : <EyeOff className="w-3.5 h-3.5 text-slate-400" />}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleEditMenu(item)}
                          className="p-1.5 rounded border border-slate-200 text-indigo-600 hover:bg-indigo-50 cursor-pointer"
                          title="Editar menu"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteMenu(item.id)}
                          className="p-1.5 rounded border border-rose-200 text-rose-600 hover:bg-rose-50 cursor-pointer"
                          title="Remover menu"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              className="flex items-center space-x-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs uppercase rounded-xl shadow-md transition-colors cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>Salvar Configurações do Site</span>
            </button>
          </div>
        </form>
      )}

      {/* ==================== MODAL CRIAR/EDITAR NOTÍCIA ==================== */}
      {isNoticiaModalOpen && editingNoticia && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden my-auto max-h-[92vh] flex flex-col">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center space-x-2">
                <Newspaper className="w-5 h-5 text-indigo-400" />
                <h3 className="font-bold text-sm uppercase">
                  {editingNoticia.id ? 'Editar Notícia do Site' : 'Publicar Nova Notícia'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsNoticiaModalOpen(false)}
                className="p-1.5 rounded-lg hover:bg-white/10 text-slate-300 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveNoticia} className="p-6 overflow-y-auto space-y-4 text-xs flex-1">
              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Título da Notícia *</label>
                <input
                  type="text"
                  required
                  value={editingNoticia.titulo}
                  onChange={(e) => setEditingNoticia({ ...editingNoticia, titulo: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:border-indigo-500 font-semibold"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Categoria</label>
                  <select
                    value={editingNoticia.categoria}
                    onChange={(e) => setEditingNoticia({ ...editingNoticia, categoria: e.target.value })}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:border-indigo-500 font-semibold"
                  >
                    {CATEGORIAS_NOTICIAS.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Data Publicação</label>
                  <input
                    type="text"
                    value={editingNoticia.dataPublicacao}
                    onChange={(e) => setEditingNoticia({ ...editingNoticia, dataPublicacao: e.target.value })}
                    placeholder="DD/MM/AAAA"
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Autor / Setor</label>
                  <input
                    type="text"
                    value={editingNoticia.autor}
                    onChange={(e) => setEditingNoticia({ ...editingNoticia, autor: e.target.value })}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Resumo / Chamada *</label>
                <textarea
                  rows={2}
                  required
                  value={editingNoticia.resumo}
                  onChange={(e) => setEditingNoticia({ ...editingNoticia, resumo: e.target.value })}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Conteúdo Completo da Matéria</label>
                <textarea
                  rows={5}
                  value={editingNoticia.conteudo}
                  onChange={(e) => setEditingNoticia({ ...editingNoticia, conteudo: e.target.value })}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:border-indigo-500 leading-relaxed"
                />
              </div>

              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5">
                <label className="block font-bold text-slate-700 uppercase">Imagem de Capa (Opcional)</label>
                <div className="flex flex-wrap items-center gap-3">
                  <label className="inline-flex items-center space-x-2 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl cursor-pointer">
                    <Upload className="w-3.5 h-3.5" />
                    <span>Enviar Imagem</span>
                    <input type="file" accept="image/*" onChange={handleUploadNoticiaImage} className="hidden" />
                  </label>
                  {editingNoticia.imagemUrl && (
                    <button
                      type="button"
                      onClick={() => setEditingNoticia({ ...editingNoticia, imagemUrl: '' })}
                      className="px-3 py-2 bg-white border border-rose-200 text-rose-600 font-bold rounded-xl cursor-pointer"
                    >
                      Remover Imagem
                    </button>
                  )}
                </div>
                {editingNoticia.imagemUrl && (
                  <img
                    src={editingNoticia.imagemUrl}
                    alt="Preview capa"
                    className="h-32 w-full object-cover rounded-xl border border-slate-200"
                  />
                )}
              </div>

              <div className="flex flex-wrap items-center gap-6 pt-1">
                <label className="flex items-center space-x-2 font-bold text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={Boolean(editingNoticia.publicado)}
                    onChange={(e) => setEditingNoticia({ ...editingNoticia, publicado: e.target.checked })}
                    className="rounded border-slate-300 text-indigo-600"
                  />
                  <span>Publicado no Site</span>
                </label>

                <label className="flex items-center space-x-2 font-bold text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={Boolean(editingNoticia.destaque)}
                    onChange={(e) => setEditingNoticia({ ...editingNoticia, destaque: e.target.checked })}
                    className="rounded border-slate-300 text-amber-600"
                  />
                  <span>Notícia em Destaque</span>
                </label>
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsNoticiaModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl uppercase cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex items-center space-x-2 px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl uppercase cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Salvar Notícia</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================== MODAL CRIAR/EDITAR BANNER ==================== */}
      {isBannerModalOpen && editingBanner && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl border border-slate-200 overflow-hidden my-auto max-h-[92vh] flex flex-col">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center space-x-2">
                <ImageIcon className="w-5 h-5 text-cyan-400" />
                <h3 className="font-bold text-sm uppercase">
                  {editingBanner.id ? 'Editar Banner do Site' : 'Adicionar Novo Banner'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsBannerModalOpen(false)}
                className="p-1.5 rounded-lg hover:bg-white/10 text-slate-300 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveBanner} className="p-6 overflow-y-auto space-y-4 text-xs flex-1">
              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Título do Banner *</label>
                <input
                  type="text"
                  required
                  value={editingBanner.titulo}
                  onChange={(e) => setEditingBanner({ ...editingBanner, titulo: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:border-indigo-500 font-semibold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Subtítulo / Chamada</label>
                <textarea
                  rows={2}
                  value={editingBanner.subtitulo || ''}
                  onChange={(e) => setEditingBanner({ ...editingBanner, subtitulo: e.target.value })}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Texto do Botão (CTA)</label>
                  <input
                    type="text"
                    value={editingBanner.textoBotao || ''}
                    onChange={(e) => setEditingBanner({ ...editingBanner, textoBotao: e.target.value })}
                    placeholder="Ex: Acessar Portal Transparência"
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Ordem de Exibição</label>
                  <input
                    type="number"
                    min={1}
                    value={editingBanner.ordem}
                    onChange={(e) => setEditingBanner({ ...editingBanner, ordem: Number(e.target.value) })}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Link de Destino</label>
                <input
                  type="text"
                  value={editingBanner.linkDestino || ''}
                  onChange={(e) => setEditingBanner({ ...editingBanner, linkDestino: e.target.value })}
                  placeholder="#transparencia, #formularios, #noticias ou https://..."
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono"
                />
                <div className="flex flex-wrap gap-1.5 mt-1.5">
                  {['#transparencia', '#formularios', '#noticias'].map(anchor => (
                    <button
                      key={anchor}
                      type="button"
                      onClick={() => setEditingBanner({ ...editingBanner, linkDestino: anchor })}
                      className="text-[10px] px-2 py-0.5 rounded bg-slate-100 hover:bg-indigo-50 text-slate-700 font-mono cursor-pointer"
                    >
                      {anchor}
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5">
                <label className="block font-bold text-slate-700 uppercase">Imagem de Fundo do Banner (Opcional)</label>
                <div className="flex flex-wrap items-center gap-3">
                  <label className="inline-flex items-center space-x-2 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl cursor-pointer">
                    <Upload className="w-3.5 h-3.5" />
                    <span>Enviar Imagem do Banner</span>
                    <input type="file" accept="image/*" onChange={handleUploadBannerImage} className="hidden" />
                  </label>
                  {editingBanner.imagemUrl && (
                    <button
                      type="button"
                      onClick={() => setEditingBanner({ ...editingBanner, imagemUrl: '' })}
                      className="px-3 py-2 bg-white border border-rose-200 text-rose-600 font-bold rounded-xl cursor-pointer"
                    >
                      Remover Imagem
                    </button>
                  )}
                </div>
                {editingBanner.imagemUrl && (
                  <img
                    src={editingBanner.imagemUrl}
                    alt="Preview banner"
                    className="h-32 w-full object-cover rounded-xl border border-slate-200"
                  />
                )}
              </div>

              <label className="flex items-center space-x-2 font-bold text-slate-700 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={editingBanner.ativo}
                  onChange={(e) => setEditingBanner({ ...editingBanner, ativo: e.target.checked })}
                  className="rounded border-slate-300 text-indigo-600"
                />
                <span>Banner Ativo no Carrossel do Site</span>
              </label>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsBannerModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl uppercase cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex items-center space-x-2 px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl uppercase cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Salvar Banner</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================== MODAL CONFIRMAÇÃO EXCLUSÃO NOTÍCIA ==================== */}
      {noticiaToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mb-4">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Excluir Notícia</h3>
            <p className="text-xs text-slate-600 mt-2 leading-relaxed">
              Deseja realmente excluir a notícia <strong className="text-slate-900">"{noticiaToDelete.titulo}"</strong>? Esta ação removerá o conteúdo do site oficial.
            </p>
            <div className="flex justify-end space-x-2.5 mt-6">
              <button
                type="button"
                onClick={() => setNoticiaToDelete(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteNoticia}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl cursor-pointer"
              >
                Excluir Notícia
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================== MODAL CONFIRMAÇÃO EXCLUSÃO BANNER ==================== */}
      {bannerToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mb-4">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Excluir Banner</h3>
            <p className="text-xs text-slate-600 mt-2 leading-relaxed">
              Tem certeza que deseja excluir o banner <strong className="text-slate-900">"{bannerToDelete.titulo}"</strong>?
            </p>
            <div className="flex justify-end space-x-2.5 mt-6">
              <button
                type="button"
                onClick={() => setBannerToDelete(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteBanner}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl cursor-pointer"
              >
                Excluir Banner
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
