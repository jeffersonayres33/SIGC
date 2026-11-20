import React, { useState, useMemo, useEffect } from 'react';
import {
  FileText,
  Search,
  Filter,
  Printer,
  Mail,
  Eye,
  CheckCircle2,
  AlertTriangle,
  AlertOctagon,
  X,
  Calendar,
  Building,
  User,
  Edit3,
  Trash2,
  ChevronDown,
  ChevronRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown
} from 'lucide-react';
import { TermoFiscalizacao, Empresa } from '../../types';
import { storageService } from '../../services/storageService';
import { toastService } from '../../services/toastService';
import { printTermoFiscalizacao } from '../../utils/printTermoFiscalizacao';
import { ModalEnviarTermoEmail } from './ModalEnviarTermoEmail';
import { ModalEditarTermoFiscalizacao } from './ModalEditarTermoFiscalizacao';

type SortField = 'numeroTermo' | 'data' | 'empresaNome' | 'cidade' | 'fiscalNome' | 'ocorrencia';
type SortDirection = 'asc' | 'desc';

const normFilterText = (val?: string) =>
  (val || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toUpperCase();

const getTermoYmd = (termo: TermoFiscalizacao): string | null => {
  const raw = (termo.dataFiscalizacao || termo.dataHora || '').trim();
  if (!raw) return null;
  const brMatch = raw.match(/(\d{2})\/(\d{2})\/(\d{4})/);
  if (brMatch) {
    return `${brMatch[3]}-${brMatch[2]}-${brMatch[1]}`;
  }
  const isoMatch = raw.match(/(\d{4})-(\d{2})-(\d{2})/);
  if (isoMatch) {
    return `${isoMatch[1]}-${isoMatch[2]}-${isoMatch[3]}`;
  }
  return null;
};

const getTermoTimestamp = (termo: TermoFiscalizacao): number => {
  const raw = (termo.dataHora || termo.dataFiscalizacao || '').trim();
  if (!raw) return 0;
  const brMatch = raw.match(/(\d{2})\/(\d{2})\/(\d{4})(?:[\sT]+(\d{2}):(\d{2}))?/);
  if (brMatch) {
    return new Date(
      Number(brMatch[3]),
      Number(brMatch[2]) - 1,
      Number(brMatch[1]),
      Number(brMatch[4] || 0),
      Number(brMatch[5] || 0)
    ).getTime();
  }
  const isoMatch = raw.match(/(\d{4})-(\d{2})-(\d{2})(?:[\sT]+(\d{2}):(\d{2}))?/);
  if (isoMatch) {
    return new Date(
      Number(isoMatch[1]),
      Number(isoMatch[2]) - 1,
      Number(isoMatch[3]),
      Number(isoMatch[4] || 0),
      Number(isoMatch[5] || 0)
    ).getTime();
  }
  return 0;
};

const getOcorrenciaLabel = (t: TermoFiscalizacao): string => {
  if (t.autoInfracaoGerado) return `Auto de Infração ${t.numeroAutoInfracao || ''}`;
  if (t.notificacaoAtiva) return `Notificação ${t.numeroNotificacao || ''}`;
  if (t.intimacaoAtiva) return `Intimação ${t.numeroIntimacao || ''}`;
  return 'Regular';
};

export const TermosInspecaoView: React.FC = () => {
  const [storageTick, setStorageTick] = useState(0);

  useEffect(() => {
    return storageService.subscribe(() => {
      setStorageTick(t => t + 1);
    });
  }, []);

  const council = storageService.getCouncilConfig();
  const allTermos = useMemo(() => storageService.getTermosFiscalizacao(), [storageTick]);
  const allEmpresas = useMemo(() => storageService.getEmpresas(), [storageTick]);
  const cadastrosBasicos = useMemo(() => storageService.getCadastrosBasicos(), [storageTick]);

  // Collapsible filter panel state (hidden by default, matching Fiscalização Eletrônica)
  const [showFiltrosInline, setShowFiltrosInline] = useState(false);

  // Filters State (aligned with Fiscalização Eletrônica)
  const [searchTerm, setSearchTerm] = useState('');
  const [filtroZona, setFiltroZona] = useState<string>('todos');
  const [filtroMunicipio, setFiltroMunicipio] = useState<string>('todos');
  const [filtroBairro, setFiltroBairro] = useState<string>('');
  const [filtroTipoEmpresa, setFiltroTipoEmpresa] = useState<string>('todos');
  const [filtroNaturezaAtividade, setFiltroNaturezaAtividade] = useState<string>('todos');
  const [filtroSituacaoEmpresa, setFiltroSituacaoEmpresa] = useState<string>('todos');
  const [filtroCondicaoRegularidade, setFiltroCondicaoRegularidade] = useState<'todos' | 'regular' | 'irregular'>('todos');
  const [filtroTipo, setFiltroTipo] = useState<'todos' | 'intimada' | 'notificada' | 'autuada' | 'regular'>('todos');
  const [filtroFiscalizadas, setFiltroFiscalizadas] = useState<'todos' | 'sim' | 'nao'>('todos');
  const [dataInicio, setDataInicio] = useState<string>('');
  const [dataFim, setDataFim] = useState<string>('');
  const [filtroInspecaoAno, setFiltroInspecaoAno] = useState<string>('');
  const [filtroInspecaoCondicao, setFiltroInspecaoCondicao] = useState<'eq' | 'gte' | 'lte'>('lte');
  const [filtroInspecaoQtd, setFiltroInspecaoQtd] = useState<string>('');

  // Table Sorting (default: Data mais recente primeiro)
  const [sortField, setSortField] = useState<SortField>('data');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  // Modals state
  const [selectedTermoForDetails, setSelectedTermoForDetails] = useState<TermoFiscalizacao | null>(null);
  const [selectedTermoForEmail, setSelectedTermoForEmail] = useState<TermoFiscalizacao | null>(null);
  const [selectedTermoForEdit, setSelectedTermoForEdit] = useState<TermoFiscalizacao | null>(null);
  const [termoParaExcluir, setTermoParaExcluir] = useState<TermoFiscalizacao | null>(null);

  // Cadastros Básicos options
  const cadastrosZonas = useMemo(
    () => cadastrosBasicos.filter(i => i.categoria === 'ZONA_EMPRESA' && i.ativo).sort((a, b) => a.nome.localeCompare(b.nome)),
    [cadastrosBasicos]
  );
  const cadastrosTiposEmpresa = useMemo(
    () => cadastrosBasicos.filter(i => i.categoria === 'TIPO_EMPRESA' && i.ativo).sort((a, b) => a.nome.localeCompare(b.nome)),
    [cadastrosBasicos]
  );
  const cadastrosNaturezasAtividade = useMemo(
    () => cadastrosBasicos.filter(i => i.categoria === 'NATUREZA_ATIVIDADE' && i.ativo).sort((a, b) => a.nome.localeCompare(b.nome)),
    [cadastrosBasicos]
  );
  const cadastrosSituacoesEmpresa = useMemo(
    () => cadastrosBasicos.filter(i => i.categoria === 'SITUACAO_EMPRESA' && i.ativo).sort((a, b) => a.nome.localeCompare(b.nome)),
    [cadastrosBasicos]
  );

  // Dynamic Municipalities
  const municipiosDisponiveis = useMemo(() => {
    const fromCad = cadastrosBasicos.filter(i => i.categoria === 'MUNICIPIO' && i.ativo).map(i => i.nome);
    const fromEmp = allEmpresas.map(e => e.cidade).filter(Boolean);
    const fromTermos = allTermos.map(t => t.cidade).filter((c): c is string => Boolean(c));
    return Array.from(new Set([...fromCad, ...fromEmp, ...fromTermos])).sort((a, b) => a.localeCompare(b));
  }, [cadastrosBasicos, allEmpresas, allTermos]);

  // Dynamic Years for Inspection Count filter
  const anosInspecaoDisponiveis = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const yearSet = new Set<number>();
    for (let y = currentYear + 1; y >= currentYear - 5; y--) {
      yearSet.add(y);
    }
    yearSet.add(2026);
    allTermos.forEach(t => {
      const ymd = getTermoYmd(t);
      if (ymd) {
        const y = Number(ymd.slice(0, 4));
        if (!Number.isNaN(y) && y > 1990) yearSet.add(y);
      }
    });
    return Array.from(yearSet).sort((a, b) => b - a);
  }, [allTermos]);

  // Map Empresa by id and normalized CNPJ for fast lookup
  const findEmpresaForTermo = (termo: TermoFiscalizacao): Empresa | undefined => {
    const byId = allEmpresas.find(e => e.id === termo.empresaId);
    if (byId) return byId;
    const termoCnpjDigits = (termo.cnpj || termo.empresaCnpj || '').replace(/\D/g, '');
    if (!termoCnpjDigits) return undefined;
    return allEmpresas.find(e => (e.cnpj || '').replace(/\D/g, '') === termoCnpjDigits);
  };

  const getEmpresaTermosForTermo = (termo: TermoFiscalizacao): TermoFiscalizacao[] => {
    const emp = findEmpresaForTermo(termo);
    const cnpjDigits = ((emp?.cnpj || termo.cnpj || termo.empresaCnpj) || '').replace(/\D/g, '');
    return allTermos.filter(t => {
      if (emp && t.empresaId === emp.id) return true;
      if (termo.empresaId && t.empresaId === termo.empresaId) return true;
      if (!cnpjDigits) return false;
      const tCnpj = (t.cnpj || '').replace(/\D/g, '');
      const tEmpCnpj = (t.empresaCnpj || '').replace(/\D/g, '');
      return tCnpj === cnpjDigits || tEmpCnpj === cnpjDigits;
    });
  };

  const handleResetFiltros = () => {
    setSearchTerm('');
    setFiltroZona('todos');
    setFiltroMunicipio('todos');
    setFiltroBairro('');
    setFiltroTipoEmpresa('todos');
    setFiltroNaturezaAtividade('todos');
    setFiltroSituacaoEmpresa('todos');
    setFiltroCondicaoRegularidade('todos');
    setFiltroTipo('todos');
    setFiltroFiscalizadas('todos');
    setDataInicio('');
    setDataFim('');
    setFiltroInspecaoAno('');
    setFiltroInspecaoCondicao('lte');
    setFiltroInspecaoQtd('');
  };

  const handleToggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection(field === 'data' ? 'desc' : 'asc');
    }
  };

  const renderSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />;
    }
    return sortDirection === 'asc'
      ? <ArrowUp className="w-3.5 h-3.5 text-blue-600 shrink-0" />
      : <ArrowDown className="w-3.5 h-3.5 text-blue-600 shrink-0" />;
  };

  const hasActiveFilters = Boolean(
    searchTerm ||
    filtroZona !== 'todos' ||
    filtroMunicipio !== 'todos' ||
    filtroBairro ||
    filtroTipoEmpresa !== 'todos' ||
    filtroNaturezaAtividade !== 'todos' ||
    filtroSituacaoEmpresa !== 'todos' ||
    filtroCondicaoRegularidade !== 'todos' ||
    filtroTipo !== 'todos' ||
    filtroFiscalizadas !== 'todos' ||
    dataInicio ||
    dataFim ||
    filtroInspecaoAno
  );

  // Filter and sort terms
  const filteredTermos = useMemo(() => {
    const filtered = allTermos.filter(termo => {
      const emp = findEmpresaForTermo(termo);

      // 1. Text search
      if (searchTerm) {
        const q = searchTerm.toLowerCase();
        const match =
          termo.numeroTermo.toLowerCase().includes(q) ||
          (termo.empresaNome || '').toLowerCase().includes(q) ||
          (termo.razaoSocial && termo.razaoSocial.toLowerCase().includes(q)) ||
          (termo.cnpj || '').toLowerCase().includes(q) ||
          (termo.numeroAutoInfracao && termo.numeroAutoInfracao.toLowerCase().includes(q)) ||
          (termo.numeroNotificacao && termo.numeroNotificacao.toLowerCase().includes(q)) ||
          (termo.numeroIntimacao && termo.numeroIntimacao.toLowerCase().includes(q)) ||
          (termo.fiscalNome && termo.fiscalNome.toLowerCase().includes(q)) ||
          (termo.bairro && termo.bairro.toLowerCase().includes(q));
        if (!match) return false;
      }

      // 2. Zona (Cadastros Básicos > Empresas > Zona)
      if (filtroZona !== 'todos' && filtroZona) {
        const zonaTermo = emp?.zona || termo.rota || '';
        if (normFilterText(zonaTermo) !== normFilterText(filtroZona)) return false;
      }

      // 3. Município / Cidade
      if (filtroMunicipio !== 'todos') {
        const cidadeTermo = termo.cidade || emp?.cidade || '';
        if (!cidadeTermo || normFilterText(cidadeTermo) !== normFilterText(filtroMunicipio)) return false;
      }

      // 4. Bairro
      if (filtroBairro) {
        const bairroTermo = termo.bairro || emp?.bairro || '';
        if (!bairroTermo.toLowerCase().includes(filtroBairro.toLowerCase())) return false;
      }

      // 5. Tipo de Empresa (Cadastros Básicos)
      if (filtroTipoEmpresa !== 'todos') {
        if (normFilterText(emp?.tipoEstabelecimento) !== normFilterText(filtroTipoEmpresa)) return false;
      }

      // 6. Natureza de Atividade (Cadastros Básicos)
      if (filtroNaturezaAtividade !== 'todos') {
        if (normFilterText(emp?.naturezaAtividade) !== normFilterText(filtroNaturezaAtividade)) return false;
      }

      // 7. Situação da Empresa (Cadastros Básicos)
      if (filtroSituacaoEmpresa !== 'todos') {
        if (normFilterText(emp?.situacao) !== normFilterText(filtroSituacaoEmpresa)) return false;
      }

      // 8. Condição / Regularidade da Empresa
      if (filtroCondicaoRegularidade === 'regular' && emp?.condicao !== 'Regular') return false;
      if (filtroCondicaoRegularidade === 'irregular' && emp?.condicao === 'Regular') return false;

      // 9. Ocorrência do Termo
      if (filtroTipo === 'autuada' && !termo.autoInfracaoGerado) return false;
      if (filtroTipo === 'notificada' && !termo.notificacaoAtiva) return false;
      if (filtroTipo === 'intimada' && !termo.intimacaoAtiva) return false;
      if (filtroTipo === 'regular' && (termo.autoInfracaoGerado || termo.notificacaoAtiva || termo.intimacaoAtiva)) return false;

      // 10. Fiscalização por Período
      const termoYmd = getTermoYmd(termo);
      const isInPeriod = (() => {
        if (!dataInicio && !dataFim) return true;
        if (!termoYmd) return false;
        if (dataInicio && termoYmd < dataInicio) return false;
        if (dataFim && termoYmd > dataFim) return false;
        return true;
      })();

      if (filtroFiscalizadas === 'todos') {
        if ((dataInicio || dataFim) && !isInPeriod) return false;
      } else if (filtroFiscalizadas === 'sim') {
        if (!isInPeriod) return false;
      } else if (filtroFiscalizadas === 'nao') {
        const empresaTermos = getEmpresaTermosForTermo(termo);
        const empresaFiscalizadaNoPeriodo = empresaTermos.some(t => {
          if (!dataInicio && !dataFim) return true;
          const tYmd = getTermoYmd(t);
          if (!tYmd) return false;
          if (dataInicio && tYmd < dataInicio) return false;
          if (dataFim && tYmd > dataFim) return false;
          return true;
        });
        if (empresaFiscalizadaNoPeriodo) return false;
      }

      // 11. Filtro por Ano + Condição + Quantidade de Inspeções
      if (filtroInspecaoAno !== '' && filtroInspecaoQtd.trim() !== '') {
        const targetYear = Number(filtroInspecaoAno);
        const targetQtd = Number(filtroInspecaoQtd);
        if (!Number.isNaN(targetYear) && !Number.isNaN(targetQtd)) {
          const empresaTermos = getEmpresaTermosForTermo(termo);
          const qtdNoAno = empresaTermos.filter(t => {
            const ymd = getTermoYmd(t);
            return ymd ? Number(ymd.slice(0, 4)) === targetYear : false;
          }).length;
          if (filtroInspecaoCondicao === 'eq' && qtdNoAno !== targetQtd) return false;
          if (filtroInspecaoCondicao === 'gte' && qtdNoAno < targetQtd) return false;
          if (filtroInspecaoCondicao === 'lte' && qtdNoAno > targetQtd) return false;
        }
      }

      return true;
    });

    const mult = sortDirection === 'asc' ? 1 : -1;
    return [...filtered].sort((a, b) => {
      if (sortField === 'data') {
        const diff = getTermoTimestamp(a) - getTermoTimestamp(b);
        if (diff !== 0) return diff * mult;
        return a.numeroTermo.localeCompare(b.numeroTermo) * mult;
      }
      if (sortField === 'numeroTermo') {
        return a.numeroTermo.localeCompare(b.numeroTermo, 'pt-BR', { numeric: true }) * mult;
      }
      if (sortField === 'empresaNome') {
        return (a.empresaNome || '').localeCompare(b.empresaNome || '', 'pt-BR') * mult;
      }
      if (sortField === 'cidade') {
        return (a.cidade || '').localeCompare(b.cidade || '', 'pt-BR') * mult;
      }
      if (sortField === 'fiscalNome') {
        return (a.fiscalNome || '').localeCompare(b.fiscalNome || '', 'pt-BR') * mult;
      }
      if (sortField === 'ocorrencia') {
        return getOcorrenciaLabel(a).localeCompare(getOcorrenciaLabel(b), 'pt-BR') * mult;
      }
      return 0;
    });
  }, [
    allTermos,
    allEmpresas,
    searchTerm,
    filtroZona,
    filtroMunicipio,
    filtroBairro,
    filtroTipoEmpresa,
    filtroNaturezaAtividade,
    filtroSituacaoEmpresa,
    filtroCondicaoRegularidade,
    filtroTipo,
    filtroFiscalizadas,
    dataInicio,
    dataFim,
    filtroInspecaoAno,
    filtroInspecaoCondicao,
    filtroInspecaoQtd,
    sortField,
    sortDirection
  ]);

  const handleConfirmDelete = () => {
    if (!termoParaExcluir) return;
    storageService.deleteTermoFiscalizacao(termoParaExcluir.id);
    if (selectedTermoForDetails?.id === termoParaExcluir.id) {
      setSelectedTermoForDetails(null);
    }
    toastService.success(
      'Termo Excluído',
      `Termo ${termoParaExcluir.numeroTermo} removido com sucesso.`
    );
    setTermoParaExcluir(null);
  };

  // Statistics
  const totalCount = allTermos.length;
  const autuadosCount = allTermos.filter(t => t.autoInfracaoGerado).length;
  const notificadosCount = allTermos.filter(t => t.notificacaoAtiva).length;
  const intimadosCount = allTermos.filter(t => t.intimacaoAtiva).length;
  const regularesCount = allTermos.filter(t => !t.autoInfracaoGerado && !t.notificacaoAtiva && !t.intimacaoAtiva).length;

  return (
    <div className="space-y-6">
      {/* Top Banner Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white border border-slate-200 p-5 rounded-2xl shadow-xs">
        <div className="flex items-center space-x-3.5">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-700 shadow-xs">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-900 tracking-tight">
              Termos de Inspeção/ Visita
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Acervo de termos de fiscalização, intimações, notificações e autos de infração lavrados no tablet de campo ({council.sigla}).
            </p>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 sm:gap-4">
        <div
          onClick={() => setFiltroTipo('todos')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            filtroTipo === 'todos' ? 'bg-blue-600 text-white shadow-md' : 'bg-white border-slate-200 hover:border-blue-400'
          }`}
        >
          <div className={`text-xs font-bold ${filtroTipo === 'todos' ? 'text-blue-100' : 'text-slate-500'}`}>
            Total Lavrados
          </div>
          <div className="text-2xl font-black mt-1">{totalCount}</div>
        </div>

        <div
          onClick={() => setFiltroTipo('autuada')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            filtroTipo === 'autuada' ? 'bg-rose-600 text-white shadow-md' : 'bg-white border-slate-200 hover:border-rose-400'
          }`}
        >
          <div className={`text-xs font-bold ${filtroTipo === 'autuada' ? 'text-rose-100' : 'text-rose-600'}`}>
            Autos de Infração
          </div>
          <div className={`text-2xl font-black mt-1 ${filtroTipo === 'autuada' ? 'text-white' : 'text-rose-600'}`}>{autuadosCount}</div>
        </div>

        <div
          onClick={() => setFiltroTipo('notificada')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            filtroTipo === 'notificada' ? 'bg-amber-500 text-white shadow-md' : 'bg-white border-slate-200 hover:border-amber-400'
          }`}
        >
          <div className={`text-xs font-bold ${filtroTipo === 'notificada' ? 'text-amber-100' : 'text-amber-600'}`}>
            Notificações
          </div>
          <div className={`text-2xl font-black mt-1 ${filtroTipo === 'notificada' ? 'text-white' : 'text-amber-600'}`}>{notificadosCount}</div>
        </div>

        <div
          onClick={() => setFiltroTipo('intimada')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            filtroTipo === 'intimada' ? 'bg-blue-700 text-white shadow-md' : 'bg-white border-slate-200 hover:border-blue-500'
          }`}
        >
          <div className={`text-xs font-bold ${filtroTipo === 'intimada' ? 'text-blue-100' : 'text-blue-700'}`}>
            Intimações
          </div>
          <div className={`text-2xl font-black mt-1 ${filtroTipo === 'intimada' ? 'text-white' : 'text-blue-700'}`}>{intimadosCount}</div>
        </div>

        <div
          onClick={() => setFiltroTipo('regular')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer col-span-2 sm:col-span-1 ${
            filtroTipo === 'regular' ? 'bg-emerald-600 text-white shadow-md' : 'bg-white border-slate-200 hover:border-emerald-400'
          }`}
        >
          <div className={`text-xs font-bold ${filtroTipo === 'regular' ? 'text-emerald-100' : 'text-emerald-600'}`}>
            Regulares / Conformes
          </div>
          <div className={`text-2xl font-black mt-1 ${filtroTipo === 'regular' ? 'text-white' : 'text-emerald-600'}`}>{regularesCount}</div>
        </div>
      </div>

      {/* Barra de Busca + Botão de Filtros Escondidos (idêntico à Fiscalização Eletrônica) */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Pesquisar por nº do termo, auto, intimação, empresa, CNPJ, bairro, fiscal..."
              className="w-full pl-10 pr-9 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Ordenação Rápida por Data */}
            <div className="flex items-center space-x-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs">
              <Calendar className="w-3.5 h-3.5 text-blue-600 shrink-0" />
              <span className="font-bold text-slate-600 hidden md:inline">Data:</span>
              <select
                value={sortField === 'data' ? sortDirection : 'custom'}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === 'desc' || val === 'asc') {
                    setSortField('data');
                    setSortDirection(val);
                  }
                }}
                className="bg-transparent font-bold text-slate-800 focus:outline-none cursor-pointer"
                aria-label="Ordenação por data"
              >
                <option value="desc">Mais recentes</option>
                <option value="asc">Mais antigos</option>
                {sortField !== 'data' && <option value="custom">Ordenação por coluna</option>}
              </select>
            </div>

            {/* Botão Trigger dos Filtros Escondidos */}
            <button
              type="button"
              onClick={() => setShowFiltrosInline(!showFiltrosInline)}
              className={`px-3.5 py-2 rounded-xl border text-xs font-bold flex items-center space-x-1.5 transition-colors cursor-pointer ${
                showFiltrosInline
                  ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                  : 'bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-slate-700 border-slate-200'
              }`}
              title="Abrir/Fechar Filtros Avançados nesta mesma tela"
            >
              <Filter className="w-3.5 h-3.5" />
              <span>Filtros</span>
              {hasActiveFilters && (
                <span className={`w-2 h-2 rounded-full ${showFiltrosInline ? 'bg-amber-300' : 'bg-blue-600'}`} />
              )}
              {showFiltrosInline ? <ChevronDown className="w-3.5 h-3.5 ml-0.5" /> : <ChevronRight className="w-3.5 h-3.5 ml-0.5" />}
            </button>
          </div>
        </div>

        {/* PAINEL COLAPSÁVEL DE FILTROS AVANÇADOS (Mesmos campos e layout da Fiscalização Eletrônica) */}
        {showFiltrosInline && (
          <div className="mt-4 pt-4 border-t border-slate-200 animate-in fade-in duration-200 space-y-3 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-extrabold text-slate-700 uppercase tracking-wider text-[11px] flex items-center">
                <Filter className="w-3.5 h-3.5 mr-1 text-blue-600" />
                Filtros e Busca Avançada (Dados dos Cadastros Básicos)
              </span>
              <button
                type="button"
                onClick={handleResetFiltros}
                className="text-xs text-rose-600 font-bold hover:underline cursor-pointer"
              >
                Limpar Todos
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {/* Zona (Cadastros Básicos > Empresas > Zona) */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">Zona:</label>
                <select
                  value={filtroZona}
                  onChange={(e) => setFiltroZona(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-medium text-slate-800"
                >
                  <option value="todos">Todas as Zonas</option>
                  {cadastrosZonas.map(z => (
                    <option key={z.id} value={z.nome}>{z.nome}</option>
                  ))}
                </select>
              </div>

              {/* Cidade / Município */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">Cidade / Município:</label>
                <select
                  value={filtroMunicipio}
                  onChange={(e) => setFiltroMunicipio(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-medium text-slate-800"
                >
                  <option value="todos">Todas as Cidades</option>
                  {municipiosDisponiveis.map(m => (
                    <option key={m} value={m}>{m}</option>
                  ))}
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

              {/* Ocorrência do Termo */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">Ocorrência Lavrada:</label>
                <select
                  value={filtroTipo}
                  onChange={(e) => setFiltroTipo(e.target.value as any)}
                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-medium text-slate-800"
                >
                  <option value="todos">Todas</option>
                  <option value="autuada">Autuada (Com Auto)</option>
                  <option value="notificada">Notificada</option>
                  <option value="intimada">Intimada</option>
                  <option value="regular">Regular</option>
                </select>
              </div>

              {/* Tipo de Empresa (Cadastros Básicos > Empresas > TIPO_EMPRESA) */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">Tipo de Empresa:</label>
                <select
                  value={filtroTipoEmpresa}
                  onChange={(e) => setFiltroTipoEmpresa(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-medium text-slate-800"
                >
                  <option value="todos">Todos os Tipos</option>
                  {cadastrosTiposEmpresa.map(t => (
                    <option key={t.id} value={t.nome}>{t.nome}</option>
                  ))}
                </select>
              </div>

              {/* Natureza de Atividade (Cadastros Básicos > Empresas > NATUREZA_ATIVIDADE) */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">Natureza de Atividade:</label>
                <select
                  value={filtroNaturezaAtividade}
                  onChange={(e) => setFiltroNaturezaAtividade(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-medium text-slate-800"
                >
                  <option value="todos">Todas as Naturezas</option>
                  {cadastrosNaturezasAtividade.map(n => (
                    <option key={n.id} value={n.nome}>{n.nome}</option>
                  ))}
                </select>
              </div>

              {/* Situações da Empresa (Cadastros Básicos > Empresas > SITUACAO_EMPRESA) */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">Situação da Empresa:</label>
                <select
                  value={filtroSituacaoEmpresa}
                  onChange={(e) => setFiltroSituacaoEmpresa(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-medium text-slate-800"
                >
                  <option value="todos">Todas as Situações</option>
                  {cadastrosSituacoesEmpresa.map(s => (
                    <option key={s.id} value={s.nome}>{s.nome}</option>
                  ))}
                </select>
              </div>

              {/* Regularidade Sanitária */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">Condição / Regularidade:</label>
                <select
                  value={filtroCondicaoRegularidade}
                  onChange={(e) => setFiltroCondicaoRegularidade(e.target.value as any)}
                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-medium text-slate-800"
                >
                  <option value="todos">Todos</option>
                  <option value="regular">Regular</option>
                  <option value="irregular">Irregular</option>
                </select>
              </div>
            </div>

            {/* Segunda Linha: Fiscalização por Período + Condição por Ano/Quantidade de Inspeções */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 pt-1">
              {/* Fiscalizados por Período */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-700">Fiscalização por Período:</label>
                  <button
                    type="button"
                    onClick={() => {
                      const todayIso = new Date().toISOString().split('T')[0];
                      setDataInicio(todayIso);
                      setDataFim(todayIso);
                      if (filtroFiscalizadas === 'todos') {
                        setFiltroFiscalizadas('sim');
                      }
                    }}
                    className="text-[11px] font-bold text-blue-600 hover:text-blue-700 hover:underline cursor-pointer"
                  >
                    Usar data de hoje
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <select
                    value={filtroFiscalizadas}
                    onChange={(e) => setFiltroFiscalizadas(e.target.value as any)}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg font-medium text-slate-800"
                  >
                    <option value="todos">Todos</option>
                    <option value="sim">Apenas fiscalizados (no período)</option>
                    <option value="nao">Não fiscalizados (no período)</option>
                  </select>
                  <div className="flex items-center space-x-1.5">
                    <span className="text-[11px] font-semibold text-slate-500 shrink-0">De:</span>
                    <input
                      type="date"
                      value={dataInicio}
                      onChange={(e) => setDataInicio(e.target.value)}
                      className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-800"
                    />
                  </div>
                  <div className="flex items-center space-x-1.5">
                    <span className="text-[11px] font-semibold text-slate-500 shrink-0">Até:</span>
                    <input
                      type="date"
                      value={dataFim}
                      onChange={(e) => setDataFim(e.target.value)}
                      className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-800"
                    />
                  </div>
                </div>
              </div>

              {/* Filtro por Ano + Condição + Quantidade de Inspeções */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 space-y-2">
                <label className="block font-bold text-slate-700">
                  Quantidade de Inspeções no Ano:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div>
                    <select
                      value={filtroInspecaoAno}
                      onChange={(e) => {
                        const nextYear = e.target.value;
                        setFiltroInspecaoAno(nextYear);
                        if (nextYear && filtroInspecaoQtd.trim() === '') {
                          setFiltroInspecaoQtd('0');
                        }
                      }}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg font-medium text-slate-800"
                      aria-label="Ano das inspeções"
                    >
                      <option value="">Ano (Não filtrar)</option>
                      {anosInspecaoDisponiveis.map(ano => (
                        <option key={ano} value={String(ano)}>{ano}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <select
                      value={filtroInspecaoCondicao}
                      onChange={(e) => setFiltroInspecaoCondicao(e.target.value as 'eq' | 'gte' | 'lte')}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg font-medium text-slate-800"
                      aria-label="Condição da quantidade de inspeções"
                    >
                      <option value="eq">Igual a (=)</option>
                      <option value="gte">Maior ou igual a (≥)</option>
                      <option value="lte">Menor ou igual a (≤)</option>
                    </select>
                  </div>
                  <div>
                    <input
                      type="number"
                      min={0}
                      step={1}
                      value={filtroInspecaoQtd}
                      onChange={(e) => setFiltroInspecaoQtd(e.target.value)}
                      placeholder="Qtd. inspeções (ex: 0)"
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-800"
                      aria-label="Quantidade de inspeções"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Table of Terms with Sortable Columns */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
          <span>
            Exibindo <strong>{filteredTermos.length}</strong> de {totalCount} termos registrados
          </span>
          <span className="font-mono text-[11px] bg-slate-100 px-2 py-0.5 rounded text-slate-700">
            Clique nos títulos das colunas para ordenar • {council.sigla}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-4">
                  <button
                    type="button"
                    onClick={() => handleToggleSort('numeroTermo')}
                    className="flex items-center space-x-1 hover:text-blue-700 cursor-pointer uppercase font-bold"
                  >
                    <span>Nº Termo</span>
                    {renderSortIcon('numeroTermo')}
                  </button>
                </th>
                <th className="py-3 px-4">
                  <button
                    type="button"
                    onClick={() => handleToggleSort('data')}
                    className="flex items-center space-x-1 hover:text-blue-700 cursor-pointer uppercase font-bold"
                  >
                    <span>Data / Edição</span>
                    {renderSortIcon('data')}
                  </button>
                </th>
                <th className="py-3 px-4">
                  <button
                    type="button"
                    onClick={() => handleToggleSort('empresaNome')}
                    className="flex items-center space-x-1 hover:text-blue-700 cursor-pointer uppercase font-bold"
                  >
                    <span>Estabelecimento</span>
                    {renderSortIcon('empresaNome')}
                  </button>
                </th>
                <th className="py-3 px-4">
                  <button
                    type="button"
                    onClick={() => handleToggleSort('cidade')}
                    className="flex items-center space-x-1 hover:text-blue-700 cursor-pointer uppercase font-bold"
                  >
                    <span>Município / Zona</span>
                    {renderSortIcon('cidade')}
                  </button>
                </th>
                <th className="py-3 px-4">
                  <button
                    type="button"
                    onClick={() => handleToggleSort('fiscalNome')}
                    className="flex items-center space-x-1 hover:text-blue-700 cursor-pointer uppercase font-bold"
                  >
                    <span>Fiscal Responsável</span>
                    {renderSortIcon('fiscalNome')}
                  </button>
                </th>
                <th className="py-3 px-4">
                  <button
                    type="button"
                    onClick={() => handleToggleSort('ocorrencia')}
                    className="flex items-center space-x-1 hover:text-blue-700 cursor-pointer uppercase font-bold"
                  >
                    <span>Ocorrências Lavradas</span>
                    {renderSortIcon('ocorrencia')}
                  </button>
                </th>
                <th className="py-3 px-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredTermos.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <FileText className="w-12 h-12 mx-auto mb-2 text-slate-300" />
                    <p className="font-bold text-slate-600">Nenhum termo de inspeção encontrado com os filtros selecionados.</p>
                    <p className="text-[11px] mt-0.5">Tente redefinir os filtros ou a busca.</p>
                  </td>
                </tr>
              ) : (
                filteredTermos.map((termo) => {
                  const emp = findEmpresaForTermo(termo);
                  const zonaExibicao = emp?.zona || termo.rota || 'Não definida';
                  return (
                    <tr key={termo.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-mono font-extrabold text-blue-700 text-xs">
                          {termo.numeroTermo}
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="text-xs text-slate-700 font-mono font-semibold">
                          {termo.dataHora || termo.dataFiscalizacao || '---'}
                        </div>
                        {termo.dataEdicao && (
                          <div className="text-[10px] text-amber-700 font-semibold mt-0.5">
                            Editado: {termo.dataEdicao}
                          </div>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900 line-clamp-1">
                          {termo.empresaNome}
                        </div>
                        <div className="text-[11px] text-slate-500 font-mono">
                          CNPJ: {termo.cnpj}
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-800">
                          {termo.cidade || emp?.cidade || '---'}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          Zona: {zonaExibicao}
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-medium text-slate-800">
                          {termo.fiscalNome}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          Matrícula: {termo.fiscalMatricula || 'MAT-402'}
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex flex-wrap items-center gap-1.5">
                          {termo.autoInfracaoGerado ? (
                            <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-rose-100 text-rose-800 border border-rose-200">
                              Auto: {termo.numeroAutoInfracao}
                            </span>
                          ) : null}

                          {termo.notificacaoAtiva ? (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                              Notif: {termo.numeroNotificacao || 'S/N'}
                            </span>
                          ) : null}

                          {termo.intimacaoAtiva ? (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-200">
                              Intim: {termo.numeroIntimacao || 'S/N'}
                            </span>
                          ) : null}

                          {!termo.autoInfracaoGerado && !termo.notificacaoAtiva && !termo.intimacaoAtiva ? (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center space-x-1">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              <span>Regular</span>
                            </span>
                          ) : null}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end space-x-1">
                          {/* Ver Detalhes */}
                          <button
                            type="button"
                            onClick={() => setSelectedTermoForDetails(termo)}
                            className="p-1.5 text-slate-500 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                            title="Visualizar Termo Completo"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {/* Editar */}
                          <button
                            type="button"
                            onClick={() => setSelectedTermoForEdit(termo)}
                            className="p-1.5 text-slate-500 hover:text-amber-700 hover:bg-amber-50 rounded-lg transition-colors cursor-pointer"
                            title="Editar Termo de Inspeção"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>

                          {/* Excluir */}
                          <button
                            type="button"
                            onClick={() => setTermoParaExcluir(termo)}
                            className="p-1.5 text-slate-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title="Excluir Termo de Inspeção"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>

                          {/* Imprimir */}
                          <button
                            type="button"
                            onClick={() => printTermoFiscalizacao(termo, council)}
                            className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                            title="Imprimir Termo Oficial"
                          >
                            <Printer className="w-4 h-4" />
                          </button>

                          {/* PDF / E-mail */}
                          <button
                            type="button"
                            onClick={() => setSelectedTermoForEmail(termo)}
                            className="p-1.5 text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                            title="Transformar em PDF e Enviar por E-mail"
                          >
                            <Mail className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Ver Detalhes do Termo */}
      {selectedTermoForDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden max-h-[92vh]">
            {/* Header */}
            <div className="px-4 sm:px-6 py-3.5 sm:py-4 bg-slate-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800">
              <div className="flex items-center space-x-3 min-w-0 flex-1">
                <div className="w-10 h-10 rounded-xl bg-blue-600/30 border border-blue-500/50 flex items-center justify-center text-blue-400 shrink-0">
                  <FileText className="w-5 h-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="text-sm sm:text-base font-black text-white flex items-center space-x-2">
                    <span className="break-words">Termo de Inspeção nº {selectedTermoForDetails.numeroTermo}</span>
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5 break-words">
                    {selectedTermoForDetails.empresaNome} • {selectedTermoForDetails.cidade}
                    {selectedTermoForDetails.dataEdicao && ` • Editado em ${selectedTermoForDetails.dataEdicao}`}
                  </p>
                </div>
              </div>

              <div className="flex items-center flex-wrap gap-2 justify-end shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    const t = selectedTermoForDetails;
                    setSelectedTermoForDetails(null);
                    setSelectedTermoForEdit(t);
                  }}
                  className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-lg flex items-center space-x-1.5 cursor-pointer"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Editar</span>
                </button>
                <button
                  type="button"
                  onClick={() => printTermoFiscalizacao(selectedTermoForDetails, council)}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-lg flex items-center space-x-1.5 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Imprimir</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const t = selectedTermoForDetails;
                    setSelectedTermoForDetails(null);
                    setSelectedTermoForEmail(t);
                  }}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg flex items-center space-x-1.5 cursor-pointer"
                >
                  <Mail className="w-3.5 h-3.5" />
                  <span>PDF / E-mail</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedTermoForDetails(null)}
                  className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 cursor-pointer ml-1"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 text-xs text-slate-700">
              {selectedTermoForDetails.dataEdicao && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-2.5 text-amber-900 flex flex-wrap items-center justify-between gap-2">
                  <span className="font-bold flex items-center space-x-1.5">
                    <Calendar className="w-3.5 h-3.5 text-amber-600" />
                    <span>Última edição registrada em: {selectedTermoForDetails.dataEdicao}</span>
                  </span>
                  {selectedTermoForDetails.editadoPor && (
                    <span className="text-[11px] font-semibold">Por: {selectedTermoForDetails.editadoPor}</span>
                  )}
                </div>
              )}

              {/* Card Identificação */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                <h3 className="font-bold text-slate-900 uppercase tracking-wider text-[11px] mb-2 flex items-center">
                  <Building className="w-3.5 h-3.5 mr-1.5 text-blue-600" />
                  Estabelecimento Inspecionado
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <div><strong>Nome Fantasia:</strong> {selectedTermoForDetails.empresaNome}</div>
                  <div><strong>Razão Social:</strong> {selectedTermoForDetails.razaoSocial || selectedTermoForDetails.empresaNome}</div>
                  <div><strong>CNPJ:</strong> {selectedTermoForDetails.cnpj}</div>
                  <div><strong>Inscrição CRF:</strong> {selectedTermoForDetails.empresaInscricao || '---'}</div>
                  <div className="sm:col-span-2"><strong>Endereço:</strong> {selectedTermoForDetails.endereco || '---'} - {selectedTermoForDetails.bairro || 'Centro'} ({selectedTermoForDetails.cidade})</div>
                </div>
              </div>

              {/* Condições da Visita & RT */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                <h3 className="font-bold text-slate-900 uppercase tracking-wider text-[11px] mb-2 flex items-center">
                  <User className="w-3.5 h-3.5 mr-1.5 text-emerald-600" />
                  Responsável Técnico & Atendimento
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <div><strong>RT Averbado:</strong> {selectedTermoForDetails.respTecnicoSelecionadoNome || selectedTermoForDetails.rtPresenteNome || 'ANA KERCIA OLIVEIRA MENDES'}</div>
                  <div><strong>Situação do RT:</strong> {selectedTermoForDetails.presencaRT || selectedTermoForDetails.rtSituacao === 'Presente' ? '✅ Presente' : '⚠️ Ausente'}</div>
                  <div><strong>Quem Atendeu:</strong> {selectedTermoForDetails.atendenteNome || selectedTermoForDetails.nomeSignatarioNotificado || 'Responsável'}</div>
                  <div><strong>Cargo do Atendente:</strong> {selectedTermoForDetails.atendenteCargo || selectedTermoForDetails.cargoSignatarioNotificado || '---'}</div>
                  {selectedTermoForDetails.observacao && (
                    <div className="sm:col-span-2 mt-2 pt-2 border-t border-slate-200">
                      <strong className="block text-slate-800 font-bold mb-1">Relato Fiscal:</strong>
                      <div className="text-slate-700 whitespace-pre-wrap leading-relaxed font-sans bg-white p-2.5 rounded-lg border border-slate-200 text-xs">
                        {selectedTermoForDetails.observacao}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Notificação */}
              {selectedTermoForDetails.notificacaoAtiva && (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-900">
                  <div className="font-bold text-xs uppercase flex items-center space-x-1.5">
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                    <span>Notificação nº {selectedTermoForDetails.numeroNotificacao || 'S/N'}</span>
                  </div>
                  <div className="mt-2 text-xs whitespace-pre-wrap leading-relaxed font-sans">{selectedTermoForDetails.notificacaoTexto}</div>
                </div>
              )}

              {/* Intimação */}
              {selectedTermoForDetails.intimacaoAtiva && (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl text-blue-900">
                  <div className="font-bold text-xs uppercase flex items-center space-x-1.5">
                    <FileText className="w-4 h-4 text-blue-600" />
                    <span>Termo de Intimação nº {selectedTermoForDetails.numeroIntimacao || 'S/N'}</span>
                  </div>
                  <p className="mt-1 text-xs">Estabelecimento intimado a regularizar pendências cadastrais/sanitárias no prazo regulamentar.</p>
                </div>
              )}

              {/* Auto de Infração */}
              {selectedTermoForDetails.autoInfracaoGerado && (
                <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-900">
                  <div className="font-bold text-xs uppercase flex items-center space-x-1.5">
                    <AlertOctagon className="w-4 h-4 text-rose-600" />
                    <span>Auto de Infração nº {selectedTermoForDetails.numeroAutoInfracao}</span>
                  </div>
                  <p className="mt-1 text-xs font-semibold">Infrações lavradas pelo fiscal:</p>
                  <ul className="mt-1 list-disc list-inside space-y-0.5">
                    {selectedTermoForDetails.infracoesIdentificadas?.map((inf, i) => (
                      <li key={i}>{inf}</li>
                    ))}
                  </ul>
                  {selectedTermoForDetails.valorMultaPrevisto ? (
                    <p className="mt-2 text-xs font-bold text-rose-700">
                      Penalidade Prevista: R$ {selectedTermoForDetails.valorMultaPrevisto.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                  ) : null}
                </div>
              )}

              {/* Assinaturas Digitais */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div className="border border-slate-200 rounded-xl p-3 bg-white text-center">
                  <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Assinatura do Fiscal</span>
                  {selectedTermoForDetails.assinaturaFiscal ? (
                    <img src={selectedTermoForDetails.assinaturaFiscal} alt="Assinatura Fiscal" className="h-12 mx-auto object-contain" />
                  ) : (
                    <div className="h-12 flex items-center justify-center font-mono text-slate-400">--- Assinado via Tablet ---</div>
                  )}
                  <div className="font-bold text-xs mt-1">{selectedTermoForDetails.fiscalNome}</div>
                  <div className="text-[10px] text-slate-500 font-mono">Fiscal • {selectedTermoForDetails.fiscalMatricula || 'MAT-402'}</div>
                </div>

                <div className="border border-slate-200 rounded-xl p-3 bg-white text-center">
                  <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Assinatura do Notificado</span>
                  {selectedTermoForDetails.recusaAssinatura ? (
                    <div className="h-12 flex items-center justify-center font-bold text-rose-600 text-xs">
                      RECUSOU-SE A ASSINAR
                    </div>
                  ) : (selectedTermoForDetails.assinaturaEstabelecimento || selectedTermoForDetails.assinaturaNotificado) ? (
                    <img
                      src={selectedTermoForDetails.assinaturaEstabelecimento || selectedTermoForDetails.assinaturaNotificado}
                      alt="Assinatura Notificado"
                      className="h-12 mx-auto object-contain"
                    />
                  ) : (
                    <div className="h-12 flex items-center justify-center font-mono text-slate-400">--- Assinado ---</div>
                  )}
                  <div className="font-bold text-xs mt-1">{selectedTermoForDetails.atendenteNome || selectedTermoForDetails.nomeSignatarioNotificado || 'Atendente'}</div>
                  <div className="text-[10px] text-slate-500">{selectedTermoForDetails.atendenteCargo || selectedTermoForDetails.cargoSignatarioNotificado}</div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
              <button
                type="button"
                onClick={() => {
                  const t = selectedTermoForDetails;
                  setSelectedTermoForDetails(null);
                  setTermoParaExcluir(t);
                }}
                className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Excluir Termo</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedTermoForDetails(null)}
                className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Fechar Visualização
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Editar Termo */}
      <ModalEditarTermoFiscalizacao
        termo={selectedTermoForEdit}
        onClose={() => setSelectedTermoForEdit(null)}
        onSaved={(updated) => {
          if (selectedTermoForDetails?.id === updated.id) {
            setSelectedTermoForDetails(updated);
          }
        }}
      />

      {/* Modal: Confirmação de Exclusão */}
      {termoParaExcluir && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150"
          onClick={() => setTermoParaExcluir(null)}
        >
          <div
            className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-5 space-y-3 text-xs">
              <div className="w-11 h-11 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center">
                <Trash2 className="w-5 h-5" />
              </div>
              <h3 className="text-base font-black text-slate-900">
                Confirmar Exclusão do Termo
              </h3>
              <p className="text-slate-600 leading-relaxed">
                Tem certeza que deseja excluir o Termo nº <strong className="font-mono text-slate-900">{termoParaExcluir.numeroTermo}</strong> ({termoParaExcluir.empresaNome})? Esta ação não poderá ser desfeita.
              </p>
            </div>
            <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-end space-x-2 text-xs">
              <button
                type="button"
                onClick={() => setTermoParaExcluir(null)}
                className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-xl font-bold cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold cursor-pointer"
              >
                Confirmar Exclusão
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Enviar Termo por E-mail */}
      <ModalEnviarTermoEmail
        isOpen={!!selectedTermoForEmail}
        onClose={() => setSelectedTermoForEmail(null)}
        termo={selectedTermoForEmail}
      />
    </div>
  );
};
