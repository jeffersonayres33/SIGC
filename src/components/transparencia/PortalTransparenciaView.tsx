import React, { useState, useEffect, useMemo } from 'react';
import {
  Landmark,
  Search,
  Download,
  Eye,
  FileText,
  ArrowLeft,
  Lock,
  Calendar,
  X,
  RefreshCw,
  ShieldCheck,
  Building2
} from 'lucide-react';
import { TransparenciaDocumento, SiteConfig } from '../../types';
import { storageService, CouncilConfig } from '../../services/storageService';
import { toastService } from '../../services/toastService';
import { SIGCON_LOGO } from '../../constants/assets';
import {
  downloadOriginalAttachment,
  formatAttachmentSize,
  isValidDownloadableUrl,
  normalizeDataUrlHeader,
  resolveSafePreviewUrl
} from '../../services/fileStorageService';

interface PortalTransparenciaViewProps {
  councilConfig?: CouncilConfig;
  siteConfig?: SiteConfig;
  onBackToSite?: () => void;
  onOpenLogin?: () => void;
  isStandalonePublic?: boolean;
}

const CATEGORIAS_TRANSPARENCIA = [
  'TODOS',
  'Balanço Patrimonial',
  'Balanço Orçamentário',
  'Balanço Financeiro',
  'Receitas e Despesas',
  'Relatório de Gestão',
  'Licitações e Contratos',
  'Folha e Diárias'
];

export const PortalTransparenciaView: React.FC<PortalTransparenciaViewProps> = ({
  councilConfig: propCouncilConfig,
  siteConfig: propSiteConfig,
  onBackToSite,
  onOpenLogin,
  isStandalonePublic = false
}) => {
  const [councilConfigState, setCouncilConfigState] = useState<CouncilConfig>(() => propCouncilConfig || storageService.getCouncilConfig());
  const [siteConfigState, setSiteConfigState] = useState<SiteConfig>(() => propSiteConfig || storageService.getSiteConfig());
  const [documentos, setDocumentos] = useState<TransparenciaDocumento[]>(() => storageService.getTransparenciaDocumentos(true));

  const [searchTerm, setSearchTerm] = useState('');
  const [anoFilter, setAnoFilter] = useState<string>('TODOS');
  const [categoriaFilter, setCategoriaFilter] = useState<string>('TODOS');

  // Visualização segura de anexo (usando Blob Object URL para evitar bloqueio do Chrome)
  const [docPreview, setDocPreview] = useState<TransparenciaDocumento | null>(null);
  const [safePreviewUrl, setSafePreviewUrl] = useState<string>('');
  const [isLoadingPreview, setIsLoadingPreview] = useState<boolean>(false);

  useEffect(() => {
    const unsub = storageService.subscribe(() => {
      setCouncilConfigState(storageService.getCouncilConfig());
      setSiteConfigState(storageService.getSiteConfig());
      setDocumentos(storageService.getTransparenciaDocumentos(true));
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    let revokeFn: (() => void) | undefined;
    let active = true;

    if (!docPreview?.arquivoUrl) {
      setSafePreviewUrl('');
      setIsLoadingPreview(false);
      return;
    }

    setIsLoadingPreview(true);
    resolveSafePreviewUrl(docPreview.arquivoUrl, docPreview.arquivoTipo, docPreview.arquivoNome)
      .then((res) => {
        if (!active) {
          res.revoke?.();
          return;
        }
        revokeFn = res.revoke;
        setSafePreviewUrl(res.url);
      })
      .finally(() => {
        if (active) setIsLoadingPreview(false);
      });

    return () => {
      active = false;
      revokeFn?.();
    };
  }, [docPreview]);

  const councilConfig = propCouncilConfig || councilConfigState;
  const siteConfig = propSiteConfig || siteConfigState;
  const activeLogo = siteConfig.logoUrl || SIGCON_LOGO;

  const anosDisponiveis = useMemo(() => {
    const set = new Set<number>(documentos.map(d => d.exercicio));
    return Array.from(set).sort((a, b) => b - a);
  }, [documentos]);

  const filteredDocs = useMemo(() => {
    return documentos.filter(d => {
      const matchAno = anoFilter === 'TODOS' || String(d.exercicio) === anoFilter;
      const matchCat = categoriaFilter === 'TODOS' || d.categoria === categoriaFilter;
      const q = searchTerm.trim().toLowerCase();
      const matchSearch =
        !q ||
        d.titulo.toLowerCase().includes(q) ||
        (d.descricao || '').toLowerCase().includes(q) ||
        (d.numeroDocumento || '').toLowerCase().includes(q) ||
        (d.competencia || '').toLowerCase().includes(q);
      return matchAno && matchCat && matchSearch;
    });
  }, [documentos, anoFilter, categoriaFilter, searchTerm]);

  const valorTotalFiltrado = useMemo(() => {
    return filteredDocs.reduce((acc, doc) => acc + (Number(doc.valorTotal) || 0), 0);
  }, [filteredDocs]);

  const formatCurrency = (val?: number) => {
    if (val === undefined || val === null || isNaN(val)) return '—';
    return val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  const handleDownload = async (doc: TransparenciaDocumento) => {
    if (!doc.arquivoUrl || !isValidDownloadableUrl(doc.arquivoUrl)) {
      toastService.info('Demonstrativo em Texto', 'Este registro ainda não possui arquivo anexo enviado.');
      return;
    }
    const res = await downloadOriginalAttachment({
      nome: doc.arquivoNome || `${doc.numeroDocumento || doc.id}.pdf`,
      url: doc.arquivoUrl,
      tipo: doc.arquivoTipo
    });
    if (res.ok) {
      toastService.success('Download Iniciado', `Arquivo "${doc.arquivoNome || doc.titulo}" baixado sem alterações.`);
    } else {
      toastService.error('Erro no Download', res.reason || 'Não foi possível baixar o documento.');
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 px-3 sm:px-4 lg:px-6 pt-4">
      {/* Barra Superior Institucional */}
      <div className="bg-white border border-slate-200 rounded-2xl px-4 sm:px-6 py-3.5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center space-x-3 min-w-0">
          <img
            src={activeLogo}
            alt="Logo do Conselho"
            className="h-10 w-10 object-contain rounded-xl p-0.5 bg-white border border-slate-200 shrink-0"
          />
          <div className="min-w-0">
            <span className="font-extrabold text-sm tracking-tight text-slate-900 block truncate">
              {councilConfig.sigla || 'CRF'} • Portal da Transparência
            </span>
            <span className="text-[10px] text-emerald-700 font-bold uppercase tracking-wider block truncate">
              Acesso Público • Lei de Acesso à Informação (LAI nº 12.527/2011)
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {onBackToSite && (
            <button
              type="button"
              onClick={onBackToSite}
              className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Voltar ao Site Oficial</span>
            </button>
          )}
          {isStandalonePublic && onOpenLogin && (
            <button
              type="button"
              onClick={onOpenLogin}
              className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-colors cursor-pointer"
            >
              <Lock className="w-3.5 h-3.5 text-cyan-300" />
              <span>Acesso Restrito</span>
            </button>
          )}
        </div>
      </div>

      {/* Hero Editorial do Portal da Transparência */}
      <div className="rounded-3xl bg-linear-to-r from-slate-900 via-emerald-950 to-slate-900 text-white p-6 sm:p-8 border border-emerald-900/40 shadow-lg">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2.5 max-w-2xl">
            <div className="inline-flex items-center space-x-2 text-emerald-300 text-xs font-bold uppercase tracking-widest">
              <Landmark className="w-4 h-4" />
              <span>Contas Públicas & Balanços do Conselho</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Portal da Transparência — {councilConfig.sigla}
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Consulte e baixe os balanços patrimoniais, orçamentários, financeiros, demonstrativos mensais de receitas e despesas e relatórios de gestão da autarquia com acesso público livre.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3 shrink-0">
            <div className="bg-white/10 border border-white/15 rounded-2xl p-3.5 text-center">
              <span className="block text-[10px] uppercase font-bold text-emerald-200">Publicações</span>
              <span className="text-xl font-extrabold font-mono tabular-nums">{filteredDocs.length}</span>
            </div>
            <div className="bg-white/10 border border-white/15 rounded-2xl p-3.5 text-center">
              <span className="block text-[10px] uppercase font-bold text-emerald-200">Exercícios</span>
              <span className="text-xl font-extrabold font-mono tabular-nums">{anosDisponiveis.length}</span>
            </div>
            <div className="bg-white/10 border border-white/15 rounded-2xl p-3.5 text-center">
              <span className="block text-[10px] uppercase font-bold text-emerald-200">Soma Filtrada</span>
              <span className="text-sm sm:text-base font-extrabold font-mono tabular-nums block mt-0.5">
                {formatCurrency(valorTotalFiltrado)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Filtros e Pesquisa */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-3 text-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center flex-wrap gap-1.5">
            <span className="font-bold text-slate-600 uppercase text-[11px] mr-1">Exercício:</span>
            <button
              type="button"
              onClick={() => setAnoFilter('TODOS')}
              className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-colors cursor-pointer ${
                anoFilter === 'TODOS' ? 'bg-emerald-700 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Todos
            </button>
            {anosDisponiveis.map(ano => (
              <button
                key={ano}
                type="button"
                onClick={() => setAnoFilter(String(ano))}
                className={`px-3 py-1.5 rounded-lg font-bold font-mono text-xs transition-colors cursor-pointer ${
                  anoFilter === String(ano) ? 'bg-emerald-700 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {ano}
              </button>
            ))}
          </div>

          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Pesquisar balanço, número ou competência..."
              className="w-full pl-9 pr-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
            />
          </div>
        </div>

        <div className="flex items-center flex-wrap gap-1.5 pt-2 border-t border-slate-100">
          <span className="font-bold text-slate-600 uppercase text-[11px] mr-1">Menus & Seções:</span>
          {(() => {
            const configuredMenus = (siteConfig.transparenciaMenus || [])
              .filter(m => m.ativo !== false)
              .sort((a, b) => (a.ordem ?? 0) - (b.ordem ?? 0));

            if (configuredMenus.length > 0) {
              return configuredMenus.map((menu) => {
                if (menu.tipo === 'LINK_EXTERNO' && menu.url) {
                  return (
                    <a
                      key={menu.id}
                      href={menu.url}
                      target={menu.abrirNovaAba !== false ? '_blank' : '_self'}
                      rel="noopener noreferrer"
                      className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg font-bold text-[11px] bg-indigo-50 text-indigo-800 border border-indigo-200 hover:bg-indigo-100 transition-colors"
                    >
                      <span>{menu.label}</span>
                    </a>
                  );
                }
                const targetCat = menu.categoriaFiltro || menu.label;
                const isSelected = categoriaFilter === targetCat;
                return (
                  <button
                    key={menu.id}
                    type="button"
                    onClick={() => setCategoriaFilter(targetCat)}
                    className={`px-3 py-1.5 rounded-lg font-bold text-[11px] transition-colors cursor-pointer ${
                      isSelected ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {menu.label}
                  </button>
                );
              });
            }

            return CATEGORIAS_TRANSPARENCIA.map(cat => (
              <button
                key={cat}
                type="button"
                onClick={() => setCategoriaFilter(cat)}
                className={`px-3 py-1.5 rounded-lg font-bold text-[11px] transition-colors cursor-pointer ${
                  categoriaFilter === cat ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {cat}
              </button>
            ));
          })()}
        </div>
      </div>

      {/* Tabela de Balanços & Documentos Públicos */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
        {filteredDocs.length === 0 ? (
          <div className="p-12 text-center space-y-2">
            <Landmark className="w-10 h-10 text-slate-300 mx-auto" />
            <p className="text-sm font-bold text-slate-700">Nenhum balanço ou demonstrativo encontrado</p>
            <p className="text-xs text-slate-500">Ajuste os filtros de exercício ou categoria para visualizar outras prestações de contas.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold uppercase text-slate-500 tracking-wider">
                  <th className="py-3 px-4">Nº / Documento</th>
                  <th className="py-3 px-4">Categoria</th>
                  <th className="py-3 px-4">Exercício / Período</th>
                  <th className="py-3 px-4">Publicação</th>
                  <th className="py-3 px-4 text-right">Valor Consolidado</th>
                  <th className="py-3 px-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredDocs.map(doc => {
                  const hasFile = isValidDownloadableUrl(doc.arquivoUrl);
                  return (
                    <tr key={doc.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4 max-w-md">
                        <div className="font-mono text-[10px] font-bold text-emerald-700">
                          {doc.numeroDocumento || 'DOC-OFICIAL'}
                        </div>
                        <div className="font-bold text-slate-900 text-xs mt-0.5">{doc.titulo}</div>
                        {doc.descricao && (
                          <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-2">{doc.descricao}</p>
                        )}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap font-semibold text-slate-700">
                        {doc.categoria}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="font-mono font-bold text-slate-900 block tabular-nums">{doc.exercicio}</span>
                        <span className="text-[11px] text-slate-500">{doc.competencia || 'Anual'}</span>
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap font-mono text-slate-600 tabular-nums">
                        {doc.dataPublicacao}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap text-right font-mono font-bold text-slate-900 tabular-nums">
                        {formatCurrency(doc.valorTotal)}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap text-right">
                        <div className="inline-flex items-center space-x-1.5">
                          <button
                            type="button"
                            onClick={() => setDocPreview(doc)}
                            className="inline-flex items-center space-x-1 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-[11px] rounded-lg cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5 text-indigo-600" />
                            <span>{hasFile ? 'Visualizar' : 'Detalhes'}</span>
                          </button>
                          {hasFile && (
                            <button
                              type="button"
                              onClick={() => handleDownload(doc)}
                              className="inline-flex items-center space-x-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] rounded-lg cursor-pointer"
                            >
                              <Download className="w-3.5 h-3.5" />
                              <span>Baixar</span>
                            </button>
                          )}
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

      {/* Modal de Visualização / Detalhes */}
      {docPreview && (
        <div
          onClick={() => setDocPreview(null)}
          className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden shadow-2xl border border-slate-200"
          >
            <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
              <div className="min-w-0 pr-3">
                <span className="text-[10px] font-mono uppercase text-emerald-300 block">
                  {docPreview.numeroDocumento || 'TRANSPARÊNCIA'} • Exercício {docPreview.exercicio}
                </span>
                <h3 className="font-bold text-sm truncate">{docPreview.titulo}</h3>
              </div>
              <div className="flex items-center space-x-2 shrink-0">
                {isValidDownloadableUrl(docPreview.arquivoUrl) && (
                  <button
                    type="button"
                    onClick={() => handleDownload(docPreview)}
                    className="flex items-center space-x-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Baixar Original</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setDocPreview(null)}
                  className="p-1.5 rounded-lg hover:bg-white/10 text-slate-300 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-5 overflow-y-auto flex-1 space-y-4 bg-slate-50">
              <div className="bg-white border border-slate-200 rounded-xl p-4 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">Categoria</span>
                  <span className="font-bold text-slate-800">{docPreview.categoria}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">Competência</span>
                  <span className="font-bold text-slate-800">{docPreview.competencia || 'Anual'}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">Valor Consolidado</span>
                  <span className="font-mono font-bold text-emerald-700 tabular-nums">
                    {formatCurrency(docPreview.valorTotal)}
                  </span>
                </div>
                {docPreview.responsavel && (
                  <div className="sm:col-span-2">
                    <span className="text-[10px] font-bold uppercase text-slate-400 block">Responsável Técnico / Setor</span>
                    <span className="font-semibold text-slate-700">{docPreview.responsavel}</span>
                  </div>
                )}
                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">Data Publicação</span>
                  <span className="font-mono text-slate-700">{docPreview.dataPublicacao}</span>
                </div>
              </div>

              {docPreview.descricao && (
                <div className="bg-white border border-slate-200 rounded-xl p-4 text-xs text-slate-700 leading-relaxed">
                  {docPreview.descricao}
                </div>
              )}

              {isValidDownloadableUrl(docPreview.arquivoUrl) ? (
                (() => {
                  const rawUrl = normalizeDataUrlHeader(docPreview.arquivoUrl);
                  const effectiveUrl = safePreviewUrl || rawUrl;
                  const lowerName = (docPreview.arquivoNome || '').toLowerCase();
                  const lowerType = (docPreview.arquivoTipo || '').toLowerCase();
                  const isImage = rawUrl.startsWith('data:image/') || lowerType.startsWith('image/') || /\.(png|jpe?g|webp|gif)$/i.test(lowerName);
                  const isPdf = rawUrl.startsWith('data:application/pdf') || lowerType === 'application/pdf' || /\.pdf$/i.test(lowerName);

                  if (isLoadingPreview) {
                    return (
                      <div className="py-12 flex flex-col items-center justify-center space-y-2 text-slate-500">
                        <RefreshCw className="w-6 h-6 animate-spin text-emerald-600" />
                        <span className="text-xs font-bold uppercase">Preparando visualização segura...</span>
                      </div>
                    );
                  }

                  if (isImage) {
                    return <img src={effectiveUrl} alt={docPreview.titulo} className="max-w-full max-h-[55vh] mx-auto rounded-xl border border-slate-200" />;
                  }

                  if (isPdf) {
                    return (
                      <object data={effectiveUrl} type="application/pdf" className="w-full h-[55vh] rounded-xl border border-slate-300 bg-white">
                        <iframe src={effectiveUrl} title={docPreview.titulo} className="w-full h-[55vh] rounded-xl border border-slate-300 bg-white" />
                      </object>
                    );
                  }

                  return (
                    <div className="p-6 bg-white border border-slate-200 rounded-xl text-center space-y-3 text-xs">
                      <FileText className="w-10 h-10 text-emerald-600 mx-auto" />
                      <p className="font-bold text-slate-800">
                        {docPreview.arquivoNome} ({formatAttachmentSize({ tamanho: docPreview.arquivoTamanho, tamanhoBytes: docPreview.arquivoTamanhoBytes })})
                      </p>
                      <button
                        type="button"
                        onClick={() => handleDownload(docPreview)}
                        className="inline-flex items-center space-x-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl cursor-pointer"
                      >
                        <Download className="w-4 h-4" />
                        <span>Baixar Arquivo</span>
                      </button>
                    </div>
                  );
                })()
              ) : (
                <div className="p-6 bg-white border border-slate-200 rounded-xl text-center text-xs text-slate-500 flex items-center justify-center space-x-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>Registro informativo publicado pela autarquia sem anexo digital vinculado.</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
