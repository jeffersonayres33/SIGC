import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Plus, 
  Search, 
  Edit3, 
  Trash2, 
  Clock, 
  MapPin, 
  Building2, 
  Scale, 
  CheckCircle2, 
  AlertTriangle, 
  Info, 
  RotateCcw,
  Sparkles,
  X,
  FileCheck2,
  Check
} from 'lucide-react';
import { RegraAssistenciaFarmaceutica, TipoExigenciaAssistencia } from '../../types';
import { storageService } from '../../services/storageService';
import { toastService } from '../../services/toastService';
import { sanitizeToUpper } from '../../utils/documentUtils';

export const AssistenciaFarmaceuticaConfig: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [municipioFilter, setMunicipioFilter] = useState('Todos');
  const [tipoEstabelecimentoFilter, setTipoEstabelecimentoFilter] = useState('Todos');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRegra, setEditingRegra] = useState<Partial<RegraAssistenciaFarmaceutica> | null>(null);
  const [regraToDelete, setRegraToDelete] = useState<RegraAssistenciaFarmaceutica | null>(null);

  // Test Simulator State
  const [simMunicipio, setSimMunicipio] = useState('MANAUS');
  const [simTipoEstabelecimento, setSimTipoEstabelecimento] = useState('Farmácia sem Manipulação');
  const [simHorasFunc, setSimHorasFunc] = useState(60);
  const [simHorasAssist, setSimHorasAssist] = useState(44);

  const councilConfig = storageService.getCouncilConfig();
  const regras = storageService.getRegrasAssistencia();
  const municipiosBasicos = storageService.getCadastrosBasicos('MUNICIPIO').filter(i => i.ativo);
  const tiposEmpresaBasicos = storageService.getCadastrosBasicos('TIPO_EMPRESA').filter(i => i.ativo);

  const filteredRegras = regras.filter(r => {
    const q = searchTerm.toLowerCase();
    const matchSearch = 
      r.municipio.toLowerCase().includes(q) || 
      r.tipoEstabelecimento.toLowerCase().includes(q) || 
      (r.descricao || '').toLowerCase().includes(q) ||
      (r.baseLegal || '').toLowerCase().includes(q);

    const matchMuni = municipioFilter === 'Todos' || r.municipio.toUpperCase() === municipioFilter.toUpperCase();
    const matchTipo = tipoEstabelecimentoFilter === 'Todos' || r.tipoEstabelecimento === tipoEstabelecimentoFilter;

    return matchSearch && matchMuni && matchTipo;
  });

  const handleOpenNew = () => {
    setEditingRegra({
      id: `regra-${Date.now()}`,
      municipio: (municipiosBasicos[0]?.nome as string) || 'MANAUS',
      tipoEstabelecimento: tiposEmpresaBasicos[0]?.nome || 'Farmácia sem Manipulação',
      tipoExigencia: 'ASSISTENCIA_PLENA',
      horasMinimas: 0,
      descricao: 'Assistência Farmacêutica Plena (100% do horário de funcionamento)',
      baseLegal: 'Lei Federal 13.021/2014 & Deliberação Plenária',
      ativo: true
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (regra: RegraAssistenciaFarmaceutica) => {
    setEditingRegra({ ...regra });
    setIsModalOpen(true);
  };

  const handleSaveRegra = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRegra?.municipio?.trim()) {
      toastService.warning('Campo Obrigatório', 'Selecione ou informe o município da regra.');
      return;
    }
    if (!editingRegra?.tipoEstabelecimento?.trim()) {
      toastService.warning('Campo Obrigatório', 'Selecione o tipo de estabelecimento.');
      return;
    }

    const sanitizedRegra: RegraAssistenciaFarmaceutica = {
      id: editingRegra.id || `regra-${Date.now()}`,
      municipio: editingRegra.municipio.trim().toUpperCase(),
      tipoEstabelecimento: editingRegra.tipoEstabelecimento.trim(),
      tipoExigencia: editingRegra.tipoExigencia || 'ASSISTENCIA_PLENA',
      horasMinimas: editingRegra.tipoExigencia === 'ASSISTENCIA_PLENA' ? 0 : Number(editingRegra.horasMinimas || 0),
      descricao: editingRegra.descricao?.trim() || '',
      baseLegal: editingRegra.baseLegal?.trim() || 'Lei 13.021/2014',
      ativo: editingRegra.ativo ?? true
    };

    storageService.saveRegraAssistencia(sanitizedRegra);
    toastService.success('Regra Salva', 'Parâmetro de assistência farmacêutica atualizado com sucesso.');
    setIsModalOpen(false);
    setEditingRegra(null);
  };

  const handleDeleteRegra = () => {
    if (!regraToDelete) return;
    storageService.deleteRegraAssistencia(regraToDelete.id);
    toastService.success('Regra Excluída', 'Regra de assistência farmacêutica removida.');
    setRegraToDelete(null);
  };

  const handleResetDefaults = () => {
    if (confirm('Deseja restaurar as regras de Assistência Farmacêutica para os padrões oficiais do CRF?')) {
      storageService.resetRegrasAssistencia();
      toastService.info('Regras Restauradas', 'As diretrizes padrão de Manaus, Manacapuru e demais municípios foram restabelecidas.');
    }
  };

  // Run real-time simulation
  const simResult = storageService.avaliarRegularidadeAssistencia({
    cidade: simMunicipio,
    tipoEstabelecimento: simTipoEstabelecimento,
    cargaHorariaFuncionamentoSemanal: simHorasFunc,
    responsaveisTecnicos: [
      {
        profissionalId: 'prof-sim',
        profissionalNome: 'FARMACÊUTICO SIMULADO',
        profissionalInscricao: 'CRF-0000',
        cargo: 'RT Principal',
        cargaHorariaSemanal: simHorasAssist,
        dataInicio: '01/01/2025'
      }
    ]
  });

  return (
    <div className="space-y-6">
      {/* Header com Contexto Legal */}
      <div className="bg-gradient-to-r from-teal-900 via-teal-800 to-slate-900 text-white rounded-2xl p-5 md:p-6 shadow-md border border-teal-700/50">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-start space-x-3.5">
            <div className="w-12 h-12 rounded-xl bg-teal-500/20 border border-teal-400/30 flex items-center justify-center shrink-0">
              <Scale className="w-6 h-6 text-teal-300" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base font-bold uppercase tracking-wider text-teal-100">
                  Módulo de Assistência Farmacêutica por Município & Ramo
                </h2>
                <span className="px-2 py-0.5 rounded-md bg-teal-400/20 text-teal-200 text-[10px] font-mono font-bold uppercase border border-teal-400/30">
                  {councilConfig.uf || 'AM'}
                </span>
              </div>
              <p className="text-xs text-teal-200/80 mt-1 max-w-3xl leading-relaxed">
                Configure os pisos de horas e regimes de Assistência Farmacêutica (Integral/Plena, Horas Diárias ou Carga Horária Semanal) exigidos por município e tipo de estabelecimento. O sistema avalia e justifica automaticamente a condição de regularidade no Cadastro de Empresas.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleResetDefaults}
              className="px-3 py-2 bg-white/10 hover:bg-white/20 text-teal-100 border border-white/20 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 uppercase"
              title="Restaurar parâmetros padrão"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>PADRÕES CRF</span>
            </button>
            <button
              onClick={handleOpenNew}
              className="px-4 py-2 bg-teal-500 hover:bg-teal-400 text-teal-950 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 shadow-md shadow-teal-900/30 uppercase"
            >
              <Plus className="w-4 h-4" />
              <span>NOVA REGRA MUNICIPAL</span>
            </button>
          </div>
        </div>
      </div>

      {/* Simulador Interativo de Avaliação de Regularidade */}
      <div className="bg-white border-2 border-teal-200/80 rounded-2xl p-5 shadow-xs space-y-3 bg-gradient-to-br from-white via-teal-50/20 to-teal-50/40">
        <div className="flex items-center justify-between border-b border-teal-100 pb-2.5">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-4 h-4 text-teal-600" />
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Simulador em Tempo Real de Condição & Justificativa Técnica
            </h3>
          </div>
          <span className="text-[10px] font-bold text-teal-800 bg-teal-100 px-2 py-0.5 rounded-md uppercase">
            MOTOR DE AUDITORIA ATIVO
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          <div>
            <label className="block text-slate-700 font-bold mb-1 uppercase text-[10px]">Município:</label>
            <select
              value={simMunicipio}
              onChange={(e) => setSimMunicipio(e.target.value)}
              className="w-full px-2.5 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 font-bold uppercase focus:ring-2 focus:ring-teal-500"
            >
              {municipiosBasicos.map(m => (
                <option key={m.id} value={m.nome}>{m.nome}</option>
              ))}
              <option value="MANACAPURU">MANACAPURU</option>
              <option value="MANAUS">MANAUS</option>
              <option value="ITACOATIARA">ITACOATIARA</option>
              <option value="PARINTINS">PARINTINS</option>
            </select>
          </div>

          <div>
            <label className="block text-slate-700 font-bold mb-1 uppercase text-[10px]">Tipo de Estabelecimento:</label>
            <select
              value={simTipoEstabelecimento}
              onChange={(e) => setSimTipoEstabelecimento(e.target.value)}
              className="w-full px-2.5 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 font-bold uppercase focus:ring-2 focus:ring-teal-500"
            >
              {tiposEmpresaBasicos.map(t => (
                <option key={t.id} value={t.nome}>{t.nome}</option>
              ))}
              <option value="Farmácia sem Manipulação">Farmácia sem Manipulação</option>
              <option value="Farmácia com Manipulação">Farmácia com Manipulação</option>
              <option value="Distribuidora de Medicamentos">Distribuidora de Medicamentos</option>
              <option value="Distribuidora de Produtos para Saúde">Distribuidora de Produtos para Saúde</option>
              <option value="Drogaria">Drogaria</option>
            </select>
          </div>

          <div>
            <label className="block text-slate-700 font-bold mb-1 uppercase text-[10px]">Funcionamento da Empresa (h/sem):</label>
            <input
              type="number"
              min={1}
              max={168}
              value={simHorasFunc}
              onChange={(e) => setSimHorasFunc(Number(e.target.value) || 0)}
              className="w-full px-2.5 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 font-mono font-bold focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div>
            <label className="block text-slate-700 font-bold mb-1 uppercase text-[10px]">Assistência Farmacêutica (h/sem):</label>
            <input
              type="number"
              min={0}
              max={168}
              value={simHorasAssist}
              onChange={(e) => setSimHorasAssist(Number(e.target.value) || 0)}
              className="w-full px-2.5 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 font-mono font-bold focus:ring-2 focus:ring-teal-500"
            />
          </div>
        </div>

        {/* Resultado do Simulador */}
        <div className={`p-3 rounded-xl border flex flex-col md:flex-row md:items-center justify-between gap-3 ${
          simResult.condicao === 'Regular'
            ? 'bg-emerald-50/90 border-emerald-300 text-emerald-950'
            : 'bg-rose-50/90 border-rose-300 text-rose-950'
        }`}>
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <span className={`px-2.5 py-0.5 rounded-md font-extrabold text-xs uppercase tracking-wide ${
                simResult.condicao === 'Regular' ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'
              }`}>
                CONDIÇÃO: {simResult.condicao}
              </span>
              <span className="text-[11px] font-bold text-slate-600 uppercase">
                {simResult.regraAplicada ? `[Regra: ${simResult.regraAplicada.descricao}]` : '[Sem regra específica]'}
              </span>
            </div>
            <p className="text-[11px] font-medium leading-relaxed text-slate-800">
              {simResult.justificativa}
            </p>
          </div>
        </div>
      </div>

      {/* Filtros e Busca de Regras */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por município, tipo ou base legal..."
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs uppercase focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-teal-500/20"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            <select
              value={municipioFilter}
              onChange={(e) => setMunicipioFilter(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold uppercase text-slate-700 focus:bg-white"
            >
              <option value="Todos">TODOS OS MUNICÍPIOS</option>
              {Array.from(new Set(regras.map(r => r.municipio))).map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>

            <select
              value={tipoEstabelecimentoFilter}
              onChange={(e) => setTipoEstabelecimentoFilter(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold uppercase text-slate-700 focus:bg-white"
            >
              <option value="Todos">TODOS OS RAMOS/TIPOS</option>
              {Array.from(new Set(regras.map(r => r.tipoEstabelecimento))).map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Tabela de Regras Cadastradas */}
        <div className="overflow-x-auto border border-slate-200 rounded-xl">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200 uppercase text-[10px]">
              <tr>
                <th className="py-3 px-4">MUNICÍPIO</th>
                <th className="py-3 px-4">TIPO DE ESTABELECIMENTO</th>
                <th className="py-3 px-4">REGIME & EXIGÊNCIA DE HORAS</th>
                <th className="py-3 px-4">BASE LEGAL / DELIBERAÇÃO</th>
                <th className="py-3 px-4 text-center">STATUS</th>
                <th className="py-3 px-4 text-right">AÇÕES</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredRegras.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    <Scale className="w-8 h-8 mx-auto mb-1 opacity-40" />
                    <p className="font-semibold uppercase">Nenhuma regra de assistência localizada.</p>
                  </td>
                </tr>
              ) : (
                filteredRegras.map((regra) => (
                  <tr key={regra.id} className="hover:bg-teal-50/30 transition-colors">
                    <td className="py-3 px-4 font-bold text-slate-900">
                      <div className="flex items-center space-x-1.5">
                        <MapPin className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                        <span className="uppercase">{regra.municipio}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-1.5">
                        <Building2 className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                        <span className="font-semibold text-slate-800 uppercase">{regra.tipoEstabelecimento}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      {regra.tipoExigencia === 'ASSISTENCIA_PLENA' && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md font-bold text-[10px] bg-purple-50 text-purple-700 border border-purple-200 uppercase">
                          <CheckCircle2 className="w-3 h-3 mr-1" />
                          Assistência Plena (100%)
                        </span>
                      )}
                      {regra.tipoExigencia === 'HORAS_DIARIAS' && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md font-bold text-[10px] bg-blue-50 text-blue-700 border border-blue-200 uppercase">
                          <Clock className="w-3 h-3 mr-1" />
                          Mínimo {regra.horasMinimas} horas / dia
                        </span>
                      )}
                      {regra.tipoExigencia === 'HORAS_SEMANAIS' && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md font-bold text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 uppercase">
                          <Clock className="w-3 h-3 mr-1" />
                          Mínimo {regra.horasMinimas} horas / semana
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-[11px] text-slate-600 block">{regra.baseLegal || 'Norma CFF/CRF'}</span>
                      {regra.descricao && <span className="text-[10px] text-slate-400 block">{regra.descricao}</span>}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={`px-2 py-0.5 rounded-md font-bold text-[10px] uppercase ${
                        regra.ativo ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'
                      }`}>
                        {regra.ativo ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end space-x-1.5">
                        <button
                          onClick={() => handleOpenEdit(regra)}
                          className="p-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg border border-blue-200 transition-colors"
                          title="Editar Regra"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setRegraToDelete(regra)}
                          className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg border border-rose-200 transition-colors"
                          title="Excluir Regra"
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

      {/* Modal Criar / Editar Regra */}
      {isModalOpen && editingRegra && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-xl w-full my-6 max-h-[90vh] overflow-y-auto shadow-2xl p-5 sm:p-6 text-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2.5">
                <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center font-bold">
                  <Scale className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 uppercase">
                    {editingRegra.id ? 'Editar Parâmetro de Assistência' : 'Novo Parâmetro de Assistência Farmacêutica'}
                  </h3>
                  <p className="text-[10px] text-slate-500">
                    Defina o município, ramo e a carga horária mínima para cálculo de regularidade
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setIsModalOpen(false);
                  setEditingRegra(null);
                }}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveRegra} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-slate-700 font-bold mb-1 uppercase text-[10px]">
                    Município da Jurisdição (Cadastro Básico) *:
                  </label>
                  <select
                    required
                    value={editingRegra.municipio || ''}
                    onChange={(e) => setEditingRegra(prev => ({ ...prev, municipio: e.target.value.toUpperCase() }))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 uppercase font-bold focus:bg-white focus:ring-2 focus:ring-teal-500"
                  >
                    <option value="">SELECIONE O MUNICÍPIO...</option>
                    {municipiosBasicos.map(m => (
                      <option key={m.id} value={m.nome}>{m.nome}</option>
                    ))}
                    <option value="TODOS OS MUNICÍPIOS">TODOS OS MUNICÍPIOS</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1 uppercase text-[10px]">
                    Tipo de Empresa (Cadastro Básico) *:
                  </label>
                  <select
                    required
                    value={editingRegra.tipoEstabelecimento || ''}
                    onChange={(e) => setEditingRegra(prev => ({ ...prev, tipoEstabelecimento: e.target.value }))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-bold focus:bg-white focus:ring-2 focus:ring-teal-500"
                  >
                    <option value="">SELECIONE O TIPO DE EMPRESA...</option>
                    {tiposEmpresaBasicos.map(t => (
                      <option key={t.id} value={t.nome}>{t.nome}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1 uppercase text-[10px]">
                  Modalidade da Exigência Técnica *:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingRegra(prev => ({ ...prev, tipoExigencia: 'ASSISTENCIA_PLENA', horasMinimas: 0 }))}
                    className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all ${
                      editingRegra.tipoExigencia === 'ASSISTENCIA_PLENA'
                        ? 'bg-teal-50 border-teal-500 text-teal-900 shadow-xs'
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <span className="font-bold uppercase text-[11px] flex items-center justify-between">
                      <span>Assistência Plena</span>
                      {editingRegra.tipoExigencia === 'ASSISTENCIA_PLENA' && <Check className="w-3.5 h-3.5 text-teal-600" />}
                    </span>
                    <span className="text-[10px] text-slate-500 mt-1">100% de todo o horário em que a firma estiver aberta.</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setEditingRegra(prev => ({ ...prev, tipoExigencia: 'HORAS_DIARIAS', horasMinimas: prev?.horasMinimas || 5 }))}
                    className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all ${
                      editingRegra.tipoExigencia === 'HORAS_DIARIAS'
                        ? 'bg-blue-50 border-blue-500 text-blue-900 shadow-xs'
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <span className="font-bold uppercase text-[11px] flex items-center justify-between">
                      <span>Horas Diárias</span>
                      {editingRegra.tipoExigencia === 'HORAS_DIARIAS' && <Check className="w-3.5 h-3.5 text-blue-600" />}
                    </span>
                    <span className="text-[10px] text-slate-500 mt-1">Mínimo diário exigido (ex: 5h/dia em Manacapuru).</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setEditingRegra(prev => ({ ...prev, tipoExigencia: 'HORAS_SEMANAIS', horasMinimas: prev?.horasMinimas || 5 }))}
                    className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all ${
                      editingRegra.tipoExigencia === 'HORAS_SEMANAIS'
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-900 shadow-xs'
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <span className="font-bold uppercase text-[11px] flex items-center justify-between">
                      <span>Horas Semanais</span>
                      {editingRegra.tipoExigencia === 'HORAS_SEMANAIS' && <Check className="w-3.5 h-3.5 text-emerald-600" />}
                    </span>
                    <span className="text-[10px] text-slate-500 mt-1">Carga semanal fixa (ex: 5h/semana em distribuidoras).</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setEditingRegra(prev => ({ 
                      ...prev, 
                      tipoExigencia: 'SEM_HORA_DEFINIDA', 
                      horasMinimas: 0,
                      descricao: prev?.descricao || 'Sem Hora Definida - Não é obrigatório informar horário de assistência farmacêutica'
                    }))}
                    className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all ${
                      editingRegra.tipoExigencia === 'SEM_HORA_DEFINIDA'
                        ? 'bg-purple-50 border-purple-500 text-purple-900 shadow-xs ring-2 ring-purple-300'
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <span className="font-bold uppercase text-[11px] flex items-center justify-between">
                      <span>Sem Hora Definida</span>
                      {editingRegra.tipoExigencia === 'SEM_HORA_DEFINIDA' && <Check className="w-3.5 h-3.5 text-purple-600" />}
                    </span>
                    <span className="text-[10px] text-slate-500 mt-1">Nesta situação poderá cadastrar qualquer horário, não sendo obrigatório informar o horário de assistência do farmacêutico.</span>
                  </button>
                </div>
              </div>

              {editingRegra.tipoExigencia === 'SEM_HORA_DEFINIDA' && (
                <div className="p-3 bg-purple-50 border border-purple-200 rounded-xl space-y-1">
                  <span className="text-purple-900 font-bold uppercase text-[10px] flex items-center gap-1.5">
                    <Info className="w-4 h-4 text-purple-600 shrink-0" />
                    <span>Modalidade: SEM HORA DEFINIDA</span>
                  </span>
                  <p className="text-[11px] text-purple-800 leading-relaxed">
                    Nesta modalidade, as empresas vinculadas a este município/estabelecimento poderão cadastrar qualquer horário livremente, não sendo obrigatório informar o horário de assistência do farmacêutico para obtenção de regularidade.
                  </p>
                </div>
              )}

              {editingRegra.tipoExigencia !== 'ASSISTENCIA_PLENA' && editingRegra.tipoExigencia !== 'SEM_HORA_DEFINIDA' && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl space-y-1">
                  <label className="block text-amber-900 font-bold uppercase text-[10px]">
                    Carga Horária Mínima Obrigatória ({editingRegra.tipoExigencia === 'HORAS_DIARIAS' ? 'Horas por Dia' : 'Horas por Semana'}) *:
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={168}
                    required
                    value={editingRegra.horasMinimas || ''}
                    onChange={(e) => setEditingRegra(prev => ({ ...prev, horasMinimas: parseFloat(e.target.value) || 0 }))}
                    className="w-full px-3 py-2 bg-white border border-amber-300 rounded-lg font-mono font-bold text-slate-900 text-sm focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              )}

              <div>
                <label className="block text-slate-700 font-bold mb-1 uppercase text-[10px]">
                  Fundamentação Legal / Deliberação Plenária:
                </label>
                <input
                  type="text"
                  value={editingRegra.baseLegal || ''}
                  onChange={(e) => setEditingRegra(prev => ({ ...prev, baseLegal: e.target.value }))}
                  placeholder="Ex: Lei Federal 13.021/2014, Art. 6º | Deliberação Plenária CRF-AM 012/2024"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-xs focus:bg-white focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1 uppercase text-[10px]">
                  Observações / Detalhamento:
                </label>
                <textarea
                  rows={2}
                  value={editingRegra.descricao || ''}
                  onChange={(e) => setEditingRegra(prev => ({ ...prev, descricao: e.target.value }))}
                  placeholder="Orientações adicionais para a fiscalização e auditoria do cadastro..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-xs focus:bg-white focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div className="flex items-center space-x-2 pt-2">
                <input
                  type="checkbox"
                  id="regra-ativo"
                  checked={editingRegra.ativo ?? true}
                  onChange={(e) => setEditingRegra(prev => ({ ...prev, ativo: e.target.checked }))}
                  className="w-4 h-4 text-teal-600 rounded-md border-slate-300"
                />
                <label htmlFor="regra-ativo" className="text-slate-800 font-bold uppercase text-xs cursor-pointer">
                  Regra ativa no motor de cálculo automático
                </label>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    setEditingRegra(null);
                  }}
                  className="px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200 uppercase"
                >
                  CANCELAR
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl shadow-xs uppercase flex items-center space-x-1.5"
                >
                  <FileCheck2 className="w-3.5 h-3.5" />
                  <span>SALVAR REGRA</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Confirmar Exclusão */}
      {regraToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full shadow-2xl p-5 text-xs space-y-4">
            <div className="flex items-center space-x-3 text-rose-600">
              <AlertTriangle className="w-6 h-6 shrink-0" />
              <h3 className="text-sm font-bold uppercase">Confirmar Exclusão da Regra</h3>
            </div>
            <p className="text-slate-600">
              Deseja realmente remover a regra de assistência para <strong>{regraToDelete.tipoEstabelecimento}</strong> em <strong>{regraToDelete.municipio}</strong>?
            </p>
            <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setRegraToDelete(null)}
                className="px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200 uppercase"
              >
                CANCELAR
              </button>
              <button
                onClick={handleDeleteRegra}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl uppercase"
              >
                CONFIRMAR EXCLUSÃO
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
