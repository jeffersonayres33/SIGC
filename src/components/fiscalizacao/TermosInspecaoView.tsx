import React, { useState, useMemo } from 'react';
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
  Download,
  RotateCcw,
  SlidersHorizontal,
  ChevronRight,
  ShieldAlert
} from 'lucide-react';
import { TermoFiscalizacao, Empresa } from '../../types';
import { storageService } from '../../services/storageService';
import { toastService } from '../../services/toastService';
import { printTermoFiscalizacao } from '../../utils/printTermoFiscalizacao';
import { ModalEnviarTermoEmail } from './ModalEnviarTermoEmail';

export const TermosInspecaoView: React.FC = () => {
  const council = storageService.getCouncilConfig();
  const allTermos = storageService.getTermosFiscalizacao();
  const allEmpresas = storageService.getEmpresas();
  const cadastrosBasicos = storageService.getCadastrosBasicos();

  // Filters State (matching Cadastros Básicos pattern)
  const [searchTerm, setSearchTerm] = useState('');
  const [filtroPeriodo, setFiltroPeriodo] = useState<'todos' | '1_ano' | '2_anos' | '3_anos'>('todos');
  const [dataInicio, setDataInicio] = useState<string>('');
  const [dataFim, setDataFim] = useState<string>('');
  const [filtroTipo, setFiltroTipo] = useState<'todos' | 'intimada' | 'notificada' | 'autuada' | 'regular'>('todos');
  const [filtroMunicipio, setFiltroMunicipio] = useState<string>('todos');
  const [filtroRota, setFiltroRota] = useState<string>('todos');

  // Modals state
  const [selectedTermoForDetails, setSelectedTermoForDetails] = useState<TermoFiscalizacao | null>(null);
  const [selectedTermoForEmail, setSelectedTermoForEmail] = useState<TermoFiscalizacao | null>(null);

  // Dynamic Municipalities
  const municipiosDisponiveis = useMemo(() => {
    const fromCad = cadastrosBasicos.filter(i => i.categoria === 'MUNICIPIO' && i.ativo).map(i => i.nome);
    const fromEmp = allEmpresas.map(e => e.cidade).filter(Boolean);
    const set = new Set([...fromCad, ...fromEmp]);
    return Array.from(set).sort();
  }, [cadastrosBasicos, allEmpresas]);

  // Dynamic Routes
  const rotasDisponiveis = useMemo(() => {
    const fromEmp = allEmpresas.map(e => e.rota).filter(Boolean);
    const set = new Set(['Canutama', 'Manaus - Centro', 'Manaus - Zona Leste', 'Interior', ...fromEmp]);
    return Array.from(set).sort();
  }, [allEmpresas]);

  // Filter terms
  const filteredTermos = useMemo(() => {
    const now = new Date();
    const oneYearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
    const twoYearsAgo = new Date(now.getFullYear() - 2, now.getMonth(), now.getDate());
    const threeYearsAgo = new Date(now.getFullYear() - 3, now.getMonth(), now.getDate());

    return allTermos.filter(termo => {
      // 1. Text search
      if (searchTerm) {
        const q = searchTerm.toLowerCase();
        const match = 
          termo.numeroTermo.toLowerCase().includes(q) ||
          termo.empresaNome.toLowerCase().includes(q) ||
          (termo.razaoSocial && termo.razaoSocial.toLowerCase().includes(q)) ||
          termo.cnpj.toLowerCase().includes(q) ||
          (termo.numeroAutoInfracao && termo.numeroAutoInfracao.toLowerCase().includes(q)) ||
          (termo.numeroNotificacao && termo.numeroNotificacao.toLowerCase().includes(q)) ||
          (termo.numeroIntimacao && termo.numeroIntimacao.toLowerCase().includes(q)) ||
          (termo.fiscalNome && termo.fiscalNome.toLowerCase().includes(q));
        if (!match) return false;
      }

      // 2. Type / Occurrence Filter
      if (filtroTipo === 'autuada' && !termo.autoInfracaoGerado) return false;
      if (filtroTipo === 'notificada' && !termo.notificacaoAtiva) return false;
      if (filtroTipo === 'intimada' && !termo.intimacaoAtiva) return false;
      if (filtroTipo === 'regular' && (termo.autoInfracaoGerado || termo.notificacaoAtiva || termo.intimacaoAtiva)) return false;

      // 3. Municipality
      if (filtroMunicipio !== 'todos') {
        if (!termo.cidade || termo.cidade.toLowerCase() !== filtroMunicipio.toLowerCase()) return false;
      }

      // 4. Route
      if (filtroRota !== 'todos') {
        if (!termo.rota || termo.rota.toLowerCase() !== filtroRota.toLowerCase()) return false;
      }

      // 5. Custom Date Range (Data Inicial & Data Final)
      const datePart = termo.dataHora ? termo.dataHora.split(' ')[0] : (termo.dataFiscalizacao || '');
      let isoDateStr = '';
      if (datePart.includes('/')) {
        const parts = datePart.split('/');
        if (parts.length === 3) {
          const d = parts[0].padStart(2, '0');
          const m = parts[1].padStart(2, '0');
          const y = parts[2];
          isoDateStr = `${y}-${m}-${d}`;
        }
      } else if (datePart.includes('-')) {
        isoDateStr = datePart.substring(0, 10);
      }

      if (isoDateStr) {
        if (dataInicio && isoDateStr < dataInicio) return false;
        if (dataFim && isoDateStr > dataFim) return false;
      }

      // 6. Predefined Period
      if (filtroPeriodo !== 'todos' && !dataInicio && !dataFim) {
        if (datePart.includes('/')) {
          const parts = datePart.split('/');
          if (parts.length === 3) {
            const d = parseInt(parts[0], 10);
            const m = parseInt(parts[1], 10) - 1;
            const y = parseInt(parts[2], 10);
            const termoDate = new Date(y, m, d);

            if (filtroPeriodo === '1_ano' && termoDate < oneYearAgo) return false;
            if (filtroPeriodo === '2_anos' && termoDate < twoYearsAgo) return false;
            if (filtroPeriodo === '3_anos' && termoDate < threeYearsAgo) return false;
          }
        }
      }

      return true;
    });
  }, [allTermos, searchTerm, filtroTipo, filtroMunicipio, filtroRota, filtroPeriodo, dataInicio, dataFim]);

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
          <div className="text-2xl font-black mt-1 text-rose-600">{filtroTipo === 'autuada' ? autuadosCount : autuadosCount}</div>
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
          <div className="text-2xl font-black mt-1 text-amber-600">{notificadosCount}</div>
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
          <div className="text-2xl font-black mt-1 text-blue-700">{intimadosCount}</div>
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
          <div className="text-2xl font-black mt-1 text-emerald-600">{regularesCount}</div>
        </div>
      </div>

      {/* Cadastros Básicos-style Filter Toolbar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs space-y-4">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Pesquisar por nº do termo, auto, intimação, empresa, CNPJ, fiscal..."
              className="w-full pl-10 pr-9 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {searchTerm && (
              <button 
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Quick Clear */}
          {(searchTerm || filtroTipo !== 'todos' || filtroPeriodo !== 'todos' || filtroMunicipio !== 'todos' || filtroRota !== 'todos' || dataInicio || dataFim) && (
            <button
              onClick={() => {
                setSearchTerm('');
                setFiltroTipo('todos');
                setFiltroPeriodo('todos');
                setDataInicio('');
                setDataFim('');
                setFiltroMunicipio('todos');
                setFiltroRota('todos');
              }}
              className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl flex items-center space-x-1.5 transition-colors cursor-pointer self-end"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Limpar Filtros</span>
            </button>
          )}
        </div>

        {/* Filter Selects & Date Inputs Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3 pt-2 border-t border-slate-100 text-xs">
          {/* Período Pré-Definido */}
          <div className="lg:col-span-1">
            <label className="block font-bold text-slate-600 mb-1 flex items-center space-x-1">
              <Calendar className="w-3.5 h-3.5 text-blue-600" />
              <span>Período Rápido:</span>
            </label>
            <select
              value={filtroPeriodo}
              onChange={(e) => {
                setFiltroPeriodo(e.target.value as any);
                if (e.target.value !== 'todos') {
                  setDataInicio('');
                  setDataFim('');
                }
              }}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500"
            >
              <option value="todos">Todos</option>
              <option value="1_ano">Último 1 ano</option>
              <option value="2_anos">Últimos 2 anos</option>
              <option value="3_anos">Últimos 3 anos</option>
            </select>
          </div>

          {/* Data Inicial */}
          <div className="lg:col-span-1">
            <label className="block font-bold text-slate-600 mb-1 flex items-center space-x-1">
              <Calendar className="w-3.5 h-3.5 text-emerald-600" />
              <span>Data Inicial:</span>
            </label>
            <input
              type="date"
              value={dataInicio}
              onChange={(e) => {
                setDataInicio(e.target.value);
                if (e.target.value) setFiltroPeriodo('todos');
              }}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Data Final */}
          <div className="lg:col-span-1">
            <label className="block font-bold text-slate-600 mb-1 flex items-center space-x-1">
              <Calendar className="w-3.5 h-3.5 text-rose-600" />
              <span>Data Final:</span>
            </label>
            <input
              type="date"
              value={dataFim}
              onChange={(e) => {
                setDataFim(e.target.value);
                if (e.target.value) setFiltroPeriodo('todos');
              }}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Tipo / Ocorrência */}
          <div className="lg:col-span-1">
            <label className="block font-bold text-slate-600 mb-1 flex items-center space-x-1">
              <SlidersHorizontal className="w-3.5 h-3.5 text-blue-600" />
              <span>Ocorrência:</span>
            </label>
            <select
              value={filtroTipo}
              onChange={(e) => setFiltroTipo(e.target.value as any)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500"
            >
              <option value="todos">Todos</option>
              <option value="autuada">Autuada (Com Auto)</option>
              <option value="notificada">Notificada</option>
              <option value="intimada">Intimada</option>
              <option value="regular">Regular</option>
            </select>
          </div>

          {/* Município */}
          <div className="lg:col-span-1">
            <label className="block font-bold text-slate-600 mb-1 flex items-center space-x-1">
              <Building className="w-3.5 h-3.5 text-blue-600" />
              <span>Município:</span>
            </label>
            <select
              value={filtroMunicipio}
              onChange={(e) => setFiltroMunicipio(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500"
            >
              <option value="todos">Todos</option>
              {municipiosDisponiveis.map(m => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>

          {/* Rota */}
          <div className="lg:col-span-1">
            <label className="block font-bold text-slate-600 mb-1 flex items-center space-x-1">
              <Filter className="w-3.5 h-3.5 text-blue-600" />
              <span>Rota:</span>
            </label>
            <select
              value={filtroRota}
              onChange={(e) => setFiltroRota(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500"
            >
              <option value="todos">Todas</option>
              {rotasDisponiveis.map(r => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Table of Terms */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span>Exibindo <strong>{filteredTermos.length}</strong> de {totalCount} termos registrados</span>
          <span className="font-mono text-[11px] bg-slate-100 px-2 py-0.5 rounded text-slate-700">
            {council.sigla} • Autarquia Federal
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-4">Nº Termo / Data</th>
                <th className="py-3 px-4">Estabelecimento</th>
                <th className="py-3 px-4">Município / Rota</th>
                <th className="py-3 px-4">Fiscal Responsável</th>
                <th className="py-3 px-4">Ocorrências Lavradas</th>
                <th className="py-3 px-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredTermos.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <FileText className="w-12 h-12 mx-auto mb-2 text-slate-300" />
                    <p className="font-bold text-slate-600">Nenhum termo de inspeção encontrado com os filtros selecionados.</p>
                    <p className="text-[11px] mt-0.5">Tente redefinir os filtros de período ou busca.</p>
                  </td>
                </tr>
              ) : (
                filteredTermos.map((termo) => (
                  <tr key={termo.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-mono font-extrabold text-blue-700 text-xs">
                        {termo.numeroTermo}
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5 font-mono">
                        {termo.dataHora}
                      </div>
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
                        {termo.cidade || 'Canutama'}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        Rota: {termo.rota || 'Canutama'}
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
                      <div className="flex items-center justify-end space-x-1.5">
                        {/* Ver Detalhes */}
                        <button
                          onClick={() => setSelectedTermoForDetails(termo)}
                          className="p-1.5 text-slate-500 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                          title="Visualizar Termo Completo"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        {/* Imprimir */}
                        <button
                          onClick={() => printTermoFiscalizacao(termo, council)}
                          className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                          title="Imprimir Termo Oficial"
                        >
                          <Printer className="w-4 h-4" />
                        </button>

                        {/* PDF / E-mail */}
                        <button
                          onClick={() => setSelectedTermoForEmail(termo)}
                          className="p-1.5 text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                          title="Transformar em PDF e Enviar por E-mail"
                        >
                          <Mail className="w-4 h-4" />
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
                  </p>
                </div>
              </div>

              <div className="flex items-center flex-wrap gap-2 justify-end shrink-0">
                <button
                  onClick={() => printTermoFiscalizacao(selectedTermoForDetails, council)}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-lg flex items-center space-x-1.5 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Imprimir</span>
                </button>
                <button
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
                  onClick={() => setSelectedTermoForDetails(null)}
                  className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 cursor-pointer ml-1"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 text-xs text-slate-700">
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
                {/* Fiscal */}
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

                {/* Notificado */}
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
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end">
              <button
                onClick={() => setSelectedTermoForDetails(null)}
                className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Fechar Visualização
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
