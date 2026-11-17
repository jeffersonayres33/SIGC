import React, { useState, useEffect, useMemo } from 'react';
import {
  Landmark,
  Plus,
  Edit3,
  Trash2,
  Search,
  Upload,
  X,
  CheckCircle2,
  Eye,
  EyeOff,
  Download,
  ExternalLink,
  AlertTriangle,
  FileText,
  ListTree,
  ArrowUp,
  ArrowDown,
  Link2
} from 'lucide-react';
import { TransparenciaDocumento, TransparenciaMenuItem, SiteConfig } from '../../types';
import { storageService, DEFAULT_TRANSPARENCIA_MENUS } from '../../services/storageService';
import { toastService } from '../../services/toastService';
import {
  uploadOriginalFile,
  downloadOriginalAttachment,
  formatAttachmentSize,
  isValidDownloadableUrl
} from '../../services/fileStorageService';

interface TransparenciaAdminViewProps {
  onOpenPublicPortal?: () => void;
}

const CATEGORIAS_BALANCO_PADRAO = [
  'Balanço Patrimonial',
  'Balanço Orçamentário',
  'Balanço Financeiro',
  'Receitas e Despesas',
  'Relatório de Gestão',
  'Licitações e Contratos',
  'Folha e Diárias'
];

export const TransparenciaAdminView: React.FC<TransparenciaAdminViewProps> = ({ onOpenPublicPortal }) => {
  const [activeSubTab, setActiveSubTab] = useState<'documentos' | 'menus'>('documentos');
  const [documentos, setDocumentos] = useState<TransparenciaDocumento[]>(() => storageService.getTransparenciaDocumentos());
  const [siteConfig, setSiteConfig] = useState<SiteConfig>(() => storageService.getSiteConfig());

  const [searchTerm, setSearchTerm] = useState('');
  const [categoriaFilter, setCategoriaFilter] = useState('TODOS');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDoc, setEditingDoc] = useState<TransparenciaDocumento | null>(null);
  const [docToDelete, setDocToDelete] = useState<TransparenciaDocumento | null>(null);

  // Estado de gerenciamento de Menus do Portal Transparência
  const [isMenuModalOpen, setIsMenuModalOpen] = useState(false);
  const [editingMenu, setEditingMenu] = useState<TransparenciaMenuItem | null>(null);
  const [menuToDelete, setMenuToDelete] = useState<TransparenciaMenuItem | null>(null);

  useEffect(() => {
    const unsub = storageService.subscribe(() => {
      setDocumentos(storageService.getTransparenciaDocumentos());
      setSiteConfig(storageService.getSiteConfig());
    });
    return () => unsub();
  }, []);

  const menusTransparencia = useMemo(() => {
    const list = siteConfig.transparenciaMenus && siteConfig.transparenciaMenus.length > 0
      ? siteConfig.transparenciaMenus
      : DEFAULT_TRANSPARENCIA_MENUS;
    return [...list].sort((a, b) => (a.ordem ?? 0) - (b.ordem ?? 0));
  }, [siteConfig.transparenciaMenus]);

  const categoriasDisponiveis = useMemo(() => {
    const set = new Set<string>(CATEGORIAS_BALANCO_PADRAO);
    menusTransparencia.forEach((m) => {
      if (m.tipo === 'CATEGORIA' && m.categoriaFiltro && m.categoriaFiltro !== 'TODOS') {
        set.add(m.categoriaFiltro);
      }
    });
    documentos.forEach((d) => {
      if (d.categoria && d.categoria.trim()) set.add(d.categoria.trim());
    });
    return Array.from(set);
  }, [menusTransparencia, documentos]);

  const saveMenusList = (nextMenus: TransparenciaMenuItem[]) => {
    const reordered = nextMenus.map((m, idx) => ({ ...m, ordem: idx + 1 }));
    storageService.updateSiteConfig({ transparenciaMenus: reordered });
  };

  const handleOpenNew = () => {
    setEditingDoc({
      id: '',
      titulo: '',
      descricao: '',
      categoria: categoriasDisponiveis[0] || 'Balanço Patrimonial',
      exercicio: new Date().getFullYear(),
      competencia: 'Anual (Consolidado)',
      dataPublicacao: new Date().toLocaleDateString('pt-BR'),
      valorTotal: undefined,
      responsavel: 'Departamento Contábil e Controladoria',
      numeroDocumento: '',
      publicado: true
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (doc: TransparenciaDocumento) => {
    setEditingDoc({ ...doc });
    setIsModalOpen(true);
  };

  const handleUploadArquivo = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !editingDoc) return;
    try {
      const stored = await uploadOriginalFile(file, 'transparencia');
      setEditingDoc({
        ...editingDoc,
        arquivoNome: stored.nome,
        arquivoTipo: stored.tipo,
        arquivoTamanho: stored.tamanho,
        arquivoTamanhoBytes: stored.tamanhoBytes,
        arquivoUrl: stored.url,
        storagePath: stored.storagePath
      });
      toastService.success('Documento Anexado', `Arquivo "${stored.nome}" preservado exatamente como enviado.`);
    } catch {
      toastService.error('Erro no Anexo', 'Não foi possível carregar o arquivo selecionado.');
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDoc) return;
    if (!editingDoc.titulo.trim()) {
      toastService.warning('Campo Obrigatório', 'Informe o título da informação, balanço ou demonstrativo.');
      return;
    }

    storageService.saveTransparenciaDocumento({
      ...editingDoc,
      titulo: editingDoc.titulo.trim(),
      categoria: editingDoc.categoria.trim() || 'Balanço Patrimonial',
      exercicio: Number(editingDoc.exercicio) || new Date().getFullYear()
    });
    setIsModalOpen(false);
    setEditingDoc(null);
    toastService.success('Registro Salvo', 'Informação e arquivo salvos no Portal da Transparência.');
  };

  const handleConfirmDelete = () => {
    if (!docToDelete) return;
    storageService.deleteTransparenciaDocumento(docToDelete.id);
    setDocToDelete(null);
    toastService.success('Documento Excluído', 'Registro removido do Portal da Transparência.');
  };

  const handleDownload = async (doc: TransparenciaDocumento) => {
    const res = await downloadOriginalAttachment({
      nome: doc.arquivoNome || `${doc.numeroDocumento || doc.id}.pdf`,
      url: doc.arquivoUrl,
      tipo: doc.arquivoTipo
    });
    if (!res.ok) {
      toastService.warning('Sem Arquivo Anexo', res.reason || 'Este documento não possui arquivo anexado.');
    }
  };

  // CRUD de Menus da Transparência
  const handleOpenNewMenu = () => {
    setEditingMenu({
      id: '',
      label: '',
      tipo: 'CATEGORIA',
      categoriaFiltro: '',
      url: '',
      descricao: '',
      ordem: menusTransparencia.length + 1,
      ativo: true,
      abrirNovaAba: true
    });
    setIsMenuModalOpen(true);
  };

  const handleOpenEditMenu = (menu: TransparenciaMenuItem) => {
    setEditingMenu({ ...menu });
    setIsMenuModalOpen(true);
  };

  const handleSaveMenu = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMenu) return;
    if (!editingMenu.label.trim()) {
      toastService.warning('Campo Obrigatório', 'Informe o nome do menu.');
      return;
    }

    if (editingMenu.tipo === 'LINK_EXTERNO' && !(editingMenu.url || '').trim()) {
      toastService.warning('URL Obrigatória', 'Informe o link de destino para menus do tipo Link Externo.');
      return;
    }

    const catFiltro = editingMenu.tipo === 'CATEGORIA'
      ? ((editingMenu.categoriaFiltro || '').trim() || editingMenu.label.trim())
      : undefined;

    const normalized: TransparenciaMenuItem = {
      ...editingMenu,
      id: editingMenu.id || `tmenu-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      label: editingMenu.label.trim(),
      categoriaFiltro: catFiltro,
      url: editingMenu.tipo === 'LINK_EXTERNO' ? (editingMenu.url || '').trim() : '',
      ordem: Number(editingMenu.ordem) || menusTransparencia.length + 1
    };

    const exists = menusTransparencia.some(m => m.id === normalized.id);
    const updated = exists
      ? menusTransparencia.map(m => (m.id === normalized.id ? normalized : m))
      : [...menusTransparencia, normalized];

    saveMenusList(updated.sort((a, b) => (a.ordem ?? 0) - (b.ordem ?? 0)));
    setIsMenuModalOpen(false);
    setEditingMenu(null);
    toastService.success('Menu Salvo', `O menu "${normalized.label}" foi salvo no Portal Transparência.`);
  };

  const handleMoveMenu = (index: number, delta: number) => {
    const targetIdx = index + delta;
    if (targetIdx < 0 || targetIdx >= menusTransparencia.length) return;
    const copy = [...menusTransparencia];
    const [item] = copy.splice(index, 1);
    copy.splice(targetIdx, 0, item);
    saveMenusList(copy);
  };

  const handleToggleMenuAtivo = (menu: TransparenciaMenuItem) => {
    const updated = menusTransparencia.map(m => (m.id === menu.id ? { ...m, ativo: !m.ativo } : m));
    saveMenusList(updated);
  };

  const handleConfirmDeleteMenu = () => {
    if (!menuToDelete) return;
    const updated = menusTransparencia.filter(m => m.id !== menuToDelete.id);
    saveMenusList(updated);
    setMenuToDelete(null);
    toastService.success('Menu Excluído', 'Menu removido do Portal da Transparência.');
  };

  const filteredDocs = documentos.filter(d => {
    const matchesCat = categoriaFilter === 'TODOS' || d.categoria === categoriaFilter;
    const q = searchTerm.trim().toLowerCase();
    const matchesSearch =
      !q ||
      d.titulo.toLowerCase().includes(q) ||
      (d.numeroDocumento || '').toLowerCase().includes(q) ||
      String(d.exercicio).includes(q) ||
      d.categoria.toLowerCase().includes(q);
    return matchesCat && matchesSearch;
  });

  const publicadosCount = documentos.filter(d => d.publicado).length;

  return (
    <div className="space-y-6">
      {/* Cabeçalho Administrativo */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center space-x-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
            <Landmark className="w-3.5 h-3.5 text-emerald-600" />
            <span>Transparência</span>
            <span>/</span>
            <span className="text-emerald-700">Gestão de Informações, Menus & Arquivos</span>
          </div>
          <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
            Gestão do Portal da Transparência
          </h1>
          <p className="text-xs text-slate-500">
            Inclua, edite e exclua informações, balanços, menus de navegação e faça upload de arquivos originais para download dos usuários.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {onOpenPublicPortal && (
            <button
              type="button"
              onClick={onOpenPublicPortal}
              className="flex items-center space-x-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl transition-colors cursor-pointer"
            >
              <ExternalLink className="w-3.5 h-3.5 text-emerald-700" />
              <span>Visualizar Portal Público</span>
            </button>
          )}
          {activeSubTab === 'documentos' ? (
            <button
              type="button"
              onClick={handleOpenNew}
              className="flex items-center space-x-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Nova Informação / Arquivo</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={handleOpenNewMenu}
              className="flex items-center space-x-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Novo Menu</span>
            </button>
          )}
        </div>
      </div>

      {/* Abas: Informações & Arquivos vs Menus do Portal Transparência */}
      <div className="bg-white border border-slate-200 rounded-2xl p-1.5 inline-flex flex-wrap gap-1.5 shadow-2xs">
        <button
          type="button"
          onClick={() => setActiveSubTab('documentos')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeSubTab === 'documentos'
              ? 'bg-emerald-700 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Informações & Arquivos ({documentos.length})</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveSubTab('menus')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeSubTab === 'menus'
              ? 'bg-emerald-700 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <ListTree className="w-4 h-4" />
          <span>Menus do Portal Transparência ({menusTransparencia.length})</span>
        </button>
      </div>

      {activeSubTab === 'documentos' ? (
        <>
          {/* Resumo Numérico Compacto */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white border border-slate-200 rounded-2xl p-4">
              <span className="text-[11px] font-bold uppercase text-slate-500 block">Total Cadastrado</span>
              <span className="text-2xl font-extrabold font-mono text-slate-900 tabular-nums">{documentos.length}</span>
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl p-4">
              <span className="text-[11px] font-bold uppercase text-slate-500 block">Visíveis ao Público</span>
              <span className="text-2xl font-extrabold font-mono text-emerald-700 tabular-nums">{publicadosCount}</span>
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl p-4">
              <span className="text-[11px] font-bold uppercase text-slate-500 block">Menus Ativos</span>
              <span className="text-2xl font-extrabold font-mono text-slate-700 tabular-nums">
                {menusTransparencia.filter(m => m.ativo !== false).length}
              </span>
            </div>
          </div>

          {/* Filtros & Tabela */}
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
            <div className="p-4 border-b border-slate-200 bg-slate-50/70 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
              <div className="flex flex-wrap items-center gap-1.5">
                {['TODOS', ...categoriasDisponiveis].map(cat => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCategoriaFilter(cat)}
                    className={`px-3 py-1.5 rounded-lg font-bold text-[11px] transition-colors cursor-pointer ${
                      categoriaFilter === cat ? 'bg-emerald-700 text-white' : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
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
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Buscar por título, ano ou nº..."
                  className="w-full pl-9 pr-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-hidden focus:border-emerald-600"
                />
              </div>
            </div>

            {filteredDocs.length === 0 ? (
              <div className="p-12 text-center space-y-3">
                <Landmark className="w-10 h-10 text-slate-300 mx-auto" />
                <p className="text-sm font-bold text-slate-700">Nenhum documento localizado</p>
                <button
                  type="button"
                  onClick={handleOpenNew}
                  className="inline-flex items-center space-x-2 px-4 py-2 bg-emerald-600 text-white font-bold text-xs rounded-xl cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Publicar Informação / Arquivo</span>
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold uppercase text-slate-500">
                      <th className="py-3 px-4">Documento / Título</th>
                      <th className="py-3 px-4">Menu / Categoria</th>
                      <th className="py-3 px-4">Exercício</th>
                      <th className="py-3 px-4 text-right">Valor</th>
                      <th className="py-3 px-4">Arquivo p/ Download</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredDocs.map(doc => {
                      const hasFile = isValidDownloadableUrl(doc.arquivoUrl);
                      return (
                        <tr key={doc.id} className="hover:bg-slate-50/80">
                          <td className="py-3 px-4 max-w-sm">
                            <span className="font-mono text-[10px] font-bold text-emerald-700 block">
                              {doc.numeroDocumento || 'S/N'}
                            </span>
                            <span className="font-bold text-slate-900">{doc.titulo}</span>
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap text-slate-700 font-medium">{doc.categoria}</td>
                          <td className="py-3 px-4 whitespace-nowrap">
                            <span className="font-mono font-bold text-slate-900 tabular-nums">{doc.exercicio}</span>
                            {doc.competencia && <span className="block text-[10px] text-slate-500">{doc.competencia}</span>}
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap text-right font-mono font-bold text-slate-900 tabular-nums">
                            {doc.valorTotal !== undefined && doc.valorTotal !== null
                              ? Number(doc.valorTotal).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
                              : '—'}
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap">
                            {hasFile ? (
                              <button
                                type="button"
                                onClick={() => handleDownload(doc)}
                                className="inline-flex items-center space-x-1 text-indigo-700 hover:underline font-semibold cursor-pointer"
                              >
                                <Download className="w-3.5 h-3.5" />
                                <span className="truncate max-w-[160px]">{doc.arquivoNome || 'Arquivo'}</span>
                              </button>
                            ) : (
                              <span className="text-slate-400">Sem anexo</span>
                            )}
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap">
                            <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded border ${
                              doc.publicado
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : 'bg-slate-100 text-slate-500 border-slate-200'
                            }`}>
                              {doc.publicado ? 'Público' : 'Oculto'}
                            </span>
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap text-right">
                            <div className="inline-flex items-center space-x-1.5">
                              <button
                                type="button"
                                onClick={() => storageService.saveTransparenciaDocumento({ ...doc, publicado: !doc.publicado })}
                                className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 cursor-pointer"
                                title={doc.publicado ? 'Ocultar do Portal Público' : 'Publicar no Portal Público'}
                              >
                                {doc.publicado ? <Eye className="w-3.5 h-3.5 text-emerald-600" /> : <EyeOff className="w-3.5 h-3.5 text-slate-400" />}
                              </button>
                              <button
                                type="button"
                                onClick={() => handleOpenEdit(doc)}
                                className="p-1.5 rounded-lg border border-slate-200 text-indigo-600 hover:bg-indigo-50 cursor-pointer"
                                title="Editar"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => setDocToDelete(doc)}
                                className="p-1.5 rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50 cursor-pointer"
                                title="Excluir"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      ) : (
        /* Aba Menus do Portal Transparência */
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
          <div className="p-4 border-b border-slate-200 bg-slate-50/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Menus de Navegação do Portal Transparência</h2>
              <p className="text-xs text-slate-500">
                Gerencie os botões de menu exibidos no Portal da Transparência (seções de filtro por categoria ou links externos oficiais).
              </p>
            </div>
            <button
              type="button"
              onClick={handleOpenNewMenu}
              className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl cursor-pointer shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Adicionar Menu</span>
            </button>
          </div>

          {menusTransparencia.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <ListTree className="w-10 h-10 text-slate-300 mx-auto" />
              <p className="text-sm font-bold text-slate-700">Nenhum menu configurado</p>
              <button
                type="button"
                onClick={handleOpenNewMenu}
                className="inline-flex items-center space-x-2 px-4 py-2 bg-emerald-600 text-white font-bold text-xs rounded-xl cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Criar Primeiro Menu</span>
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold uppercase text-slate-500">
                    <th className="py-3 px-4">Ordem</th>
                    <th className="py-3 px-4">Nome do Menu</th>
                    <th className="py-3 px-4">Tipo de Ação</th>
                    <th className="py-3 px-4">Categoria / Destino</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {menusTransparencia.map((menu, index) => (
                    <tr key={menu.id} className="hover:bg-slate-50/80">
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="inline-flex items-center space-x-1">
                          <span className="font-mono font-bold text-slate-700 w-6">#{index + 1}</span>
                          <button
                            type="button"
                            disabled={index === 0}
                            onClick={() => handleMoveMenu(index, -1)}
                            className="p-1 rounded border border-slate-200 hover:bg-slate-100 disabled:opacity-30 cursor-pointer"
                            title="Subir posição"
                          >
                            <ArrowUp className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            disabled={index === menusTransparencia.length - 1}
                            onClick={() => handleMoveMenu(index, 1)}
                            className="p-1 rounded border border-slate-200 hover:bg-slate-100 disabled:opacity-30 cursor-pointer"
                            title="Descer posição"
                          >
                            <ArrowDown className="w-3 h-3" />
                          </button>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-bold text-slate-900">{menu.label}</span>
                        {menu.descricao && <span className="block text-[11px] text-slate-500">{menu.descricao}</span>}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${
                          menu.tipo === 'LINK_EXTERNO'
                            ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                            : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        }`}>
                          {menu.tipo === 'LINK_EXTERNO' ? <Link2 className="w-3 h-3" /> : <ListTree className="w-3 h-3" />}
                          <span>{menu.tipo === 'LINK_EXTERNO' ? 'Link Externo' : 'Seção / Categoria'}</span>
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-600">
                        {menu.tipo === 'LINK_EXTERNO' ? menu.url : (menu.categoriaFiltro || menu.label)}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => handleToggleMenuAtivo(menu)}
                          className={`text-[10px] font-bold uppercase px-2.5 py-1 rounded border cursor-pointer ${
                            menu.ativo !== false
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-slate-100 text-slate-500 border-slate-200'
                          }`}
                        >
                          {menu.ativo !== false ? 'Ativo' : 'Oculto'}
                        </button>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap text-right">
                        <div className="inline-flex items-center space-x-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenEditMenu(menu)}
                            className="p-1.5 rounded-lg border border-slate-200 text-indigo-600 hover:bg-indigo-50 cursor-pointer"
                            title="Editar Menu"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setMenuToDelete(menu)}
                            className="p-1.5 rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50 cursor-pointer"
                            title="Excluir Menu"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Modal Adicionar / Editar Informação & Arquivo */}
      {isModalOpen && editingDoc && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden my-auto max-h-[92vh] flex flex-col">
            <div className="px-6 py-4 bg-emerald-900 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center space-x-2">
                <Landmark className="w-5 h-5 text-emerald-300" />
                <h3 className="font-bold text-sm uppercase">
                  {editingDoc.id ? 'Editar Informação / Documento' : 'Publicar Nova Informação no Portal Transparência'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg hover:bg-white/10 text-emerald-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 overflow-y-auto space-y-4 text-xs flex-1">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-700 uppercase mb-1">Título da Informação / Balanço *</label>
                  <input
                    type="text"
                    required
                    value={editingDoc.titulo}
                    onChange={(e) => setEditingDoc({ ...editingDoc, titulo: e.target.value })}
                    placeholder="Ex: Balanço Patrimonial Consolidado 2026"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:border-emerald-600 font-semibold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Nº Documento</label>
                  <input
                    type="text"
                    value={editingDoc.numeroDocumento || ''}
                    onChange={(e) => setEditingDoc({ ...editingDoc, numeroDocumento: e.target.value })}
                    placeholder="Ex: BP-2026/001"
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Menu / Categoria *</label>
                  <input
                    type="text"
                    list="transparencia-categorias-list"
                    required
                    value={editingDoc.categoria}
                    onChange={(e) => setEditingDoc({ ...editingDoc, categoria: e.target.value })}
                    placeholder="Selecione ou digite..."
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold focus:bg-white focus:outline-hidden focus:border-emerald-600"
                  />
                  <datalist id="transparencia-categorias-list">
                    {categoriasDisponiveis.map(cat => (
                      <option key={cat} value={cat} />
                    ))}
                  </datalist>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Exercício (Ano)</label>
                  <input
                    type="number"
                    required
                    min={2000}
                    max={2100}
                    value={editingDoc.exercicio}
                    onChange={(e) => setEditingDoc({ ...editingDoc, exercicio: Number(e.target.value) })}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Competência / Período</label>
                  <input
                    type="text"
                    value={editingDoc.competencia || ''}
                    onChange={(e) => setEditingDoc({ ...editingDoc, competencia: e.target.value })}
                    placeholder="Ex: Anual, 1º Trimestre"
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Valor Total (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={editingDoc.valorTotal ?? ''}
                    onChange={(e) =>
                      setEditingDoc({
                        ...editingDoc,
                        valorTotal: e.target.value === '' ? undefined : Number(e.target.value)
                      })
                    }
                    placeholder="0.00"
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Data Publicação</label>
                  <input
                    type="text"
                    value={editingDoc.dataPublicacao}
                    onChange={(e) => setEditingDoc({ ...editingDoc, dataPublicacao: e.target.value })}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Responsável / Setor</label>
                  <input
                    type="text"
                    value={editingDoc.responsavel || ''}
                    onChange={(e) => setEditingDoc({ ...editingDoc, responsavel: e.target.value })}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Descrição / Informação Pública</label>
                <textarea
                  rows={3}
                  value={editingDoc.descricao || ''}
                  onChange={(e) => setEditingDoc({ ...editingDoc, descricao: e.target.value })}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-2.5">
                <label className="block font-bold text-emerald-900 uppercase">Arquivo para Download dos Usuários (PDF, Planilha, ZIP ou Documento Original)</label>
                <div className="flex flex-wrap items-center gap-3">
                  <label className="inline-flex items-center space-x-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl cursor-pointer">
                    <Upload className="w-3.5 h-3.5" />
                    <span>Fazer Upload do Arquivo</span>
                    <input
                      type="file"
                      accept=".pdf,.xls,.xlsx,.csv,.doc,.docx,.zip,.jpg,.jpeg,.png"
                      onChange={handleUploadArquivo}
                      className="hidden"
                    />
                  </label>
                  {editingDoc.arquivoNome && (
                    <div className="flex items-center space-x-2 px-3 py-1.5 bg-white border border-emerald-200 rounded-lg">
                      <FileText className="w-3.5 h-3.5 text-emerald-700" />
                      <span className="font-semibold text-slate-800 truncate max-w-xs">
                        {editingDoc.arquivoNome} ({formatAttachmentSize({ tamanho: editingDoc.arquivoTamanho, tamanhoBytes: editingDoc.arquivoTamanhoBytes })})
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          setEditingDoc({
                            ...editingDoc,
                            arquivoNome: undefined,
                            arquivoTipo: undefined,
                            arquivoTamanho: undefined,
                            arquivoTamanhoBytes: undefined,
                            arquivoUrl: undefined,
                            storagePath: undefined
                          })
                        }
                        className="text-rose-600 hover:text-rose-800 cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <label className="flex items-center space-x-2 font-bold text-slate-700 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={editingDoc.publicado}
                  onChange={(e) => setEditingDoc({ ...editingDoc, publicado: e.target.checked })}
                  className="rounded border-slate-300 text-emerald-600"
                />
                <span>Disponibilizar publicamente no Portal Transparência</span>
              </label>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl uppercase cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex items-center space-x-2 px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl uppercase cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Salvar Registro</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Adicionar / Editar Menu da Transparência */}
      {isMenuModalOpen && editingMenu && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden my-auto">
            <div className="px-6 py-4 bg-emerald-900 text-white flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <ListTree className="w-5 h-5 text-emerald-300" />
                <h3 className="font-bold text-sm uppercase">
                  {editingMenu.id ? 'Editar Menu da Transparência' : 'Novo Menu no Portal Transparência'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsMenuModalOpen(false)}
                className="p-1.5 rounded-lg hover:bg-white/10 text-emerald-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveMenu} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Nome do Menu *</label>
                <input
                  type="text"
                  required
                  value={editingMenu.label}
                  onChange={(e) => setEditingMenu({ ...editingMenu, label: e.target.value })}
                  placeholder="Ex: Contratos e Convênios"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold focus:bg-white focus:outline-hidden focus:border-emerald-600"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Tipo de Menu</label>
                  <select
                    value={editingMenu.tipo}
                    onChange={(e) => setEditingMenu({ ...editingMenu, tipo: e.target.value as 'CATEGORIA' | 'LINK_EXTERNO' })}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold"
                  >
                    <option value="CATEGORIA">Seção / Filtro de Categoria</option>
                    <option value="LINK_EXTERNO">Link Externo / Portal Parceiro</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Ordem de Exibição</label>
                  <input
                    type="number"
                    min={1}
                    value={editingMenu.ordem}
                    onChange={(e) => setEditingMenu({ ...editingMenu, ordem: Number(e.target.value) })}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono"
                  />
                </div>
              </div>

              {editingMenu.tipo === 'CATEGORIA' ? (
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">
                    Categoria Vinculada (opcional — se vazio usa o nome do menu)
                  </label>
                  <input
                    type="text"
                    value={editingMenu.categoriaFiltro || ''}
                    onChange={(e) => setEditingMenu({ ...editingMenu, categoriaFiltro: e.target.value })}
                    placeholder="Ex: TODOS ou Contratos e Convênios"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
              ) : (
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">URL de Destino *</label>
                  <input
                    type="url"
                    required
                    value={editingMenu.url || ''}
                    onChange={(e) => setEditingMenu({ ...editingMenu, url: e.target.value })}
                    placeholder="https://portal.exemplo.gov.br"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono"
                  />
                </div>
              )}

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Descrição Breve (Opcional)</label>
                <input
                  type="text"
                  value={editingMenu.descricao || ''}
                  onChange={(e) => setEditingMenu({ ...editingMenu, descricao: e.target.value })}
                  placeholder="Subtítulo explicativo exibido em destaque"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <label className="flex items-center space-x-2 font-bold text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={editingMenu.ativo !== false}
                  onChange={(e) => setEditingMenu({ ...editingMenu, ativo: e.target.checked })}
                  className="rounded border-slate-300 text-emerald-600"
                />
                <span>Menu visível no Portal da Transparência</span>
              </label>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsMenuModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl uppercase cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex items-center space-x-2 px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl uppercase cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Salvar Menu</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Confirmação Exclusão Documento */}
      {docToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mb-4">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Excluir Documento da Transparência</h3>
            <p className="text-xs text-slate-600 mt-2 leading-relaxed">
              Deseja excluir permanentemente o registro <strong className="text-slate-900">"{docToDelete.titulo}"</strong>?
            </p>
            <div className="flex justify-end space-x-2.5 mt-6">
              <button
                type="button"
                onClick={() => setDocToDelete(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl cursor-pointer"
              >
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Confirmação Exclusão Menu */}
      {menuToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mb-4">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Excluir Menu da Transparência</h3>
            <p className="text-xs text-slate-600 mt-2 leading-relaxed">
              Deseja excluir o menu <strong className="text-slate-900">"{menuToDelete.label}"</strong> do Portal Transparência?
            </p>
            <div className="flex justify-end space-x-2.5 mt-6">
              <button
                type="button"
                onClick={() => setMenuToDelete(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteMenu}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl cursor-pointer"
              >
                Excluir Menu
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
